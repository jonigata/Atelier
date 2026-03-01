import { get } from 'svelte/store';
import {
  gameState,
  addMessage,
  addMorningEvent,
  clearMorningEvents,
  setPhase,
  advanceDay,
  setExpedition,
  addItem,
  addReputationExp,
  setDayTransition,
  recordDailyScore,
} from '$lib/stores/game';
import { removeActiveQuest, incrementFailedQuests, setAvailableQuests, incrementNewQuestCount } from '$lib/stores/quests';
import { isActionUnlocked } from '$lib/stores/tutorial';
import { getArea } from '$lib/data/areas';
import { getItem } from '$lib/data/items';
import { getAvailableQuestTemplates, questTemplates } from '$lib/data/quests';
import { EXPEDITION, calcLevelFromExp } from '$lib/data/balance';
import { initializeActiveGoalTracking } from '$lib/services/achievement';
import { processAutoCompleteAchievements } from '$lib/services/presentation';
import { processMorningAchievements, processInspectionSequence } from '$lib/services/presentation';
import { processBuildingMorningItems } from '$lib/services/buildingEffects';
import { processHelperMorningStamina } from '$lib/services/helperEffects';
import { checkMerchantEvents } from '$lib/services/merchant';
import { expeditionFlavors, pickRandom } from '$lib/data/flavorTexts';
import { getExpeditionDropsMult, getExpeditionRareBonus } from '$lib/services/equipmentEffects';
import { getBuildingExpeditionBonus } from '$lib/services/buildingEffects';
import { getHelperExpeditionDropBonus, getHelperExpeditionRareBonus } from '$lib/services/helperEffects';
import { getItem as getItemDef } from '$lib/data/items';
import type { OwnedItem, MorningEvent, GameState } from '$lib/models/types';
import skipDataJson from '$lib/data/skipData.json';

/**
 * ゲームループのメイン処理
 * 行動後に呼び出され、時間を進めて朝のフェーズに移行する
 */
export async function endTurn(daysSpent: number): Promise<void> {
  if (daysSpent > 0) {
    advanceDay(daysSpent);
  }

  const state = get(gameState);

  // ゲーム終了チェック
  if (state.day > 336) {
    setPhase('ending');
    addMessage('1年が経過しました。最終評価を行います...');
    return;
  }

  // 査察前にday28の完了状態を記録
  const hadDay28Before = state.completedInspections.includes(28);

  // 査察シーケンス（DayTransition完了後、朝画面の前に全て実行）
  const gameOver = await processInspectionSequence();
  if (gameOver) return;

  // 仮エンディング: 1月末査察（day 28）を今回完了した場合のみ発動
  if (!hadDay28Before) {
    const updatedState = get(gameState);
    if (updatedState.completedInspections.includes(28)) {
      setPhase('ending');
      return;
    }
  }

  // 朝のフェーズに移行
  await processMorningPhase();
}

/**
 * 朝のフェーズ処理
 */
async function processMorningPhase(): Promise<void> {
  clearMorningEvents();

  // 毎朝スコアを記録
  recordDailyScore();

  const state = get(gameState);
  addMessage(`--- ${state.day}日目の朝 ---`);

  // 1. 採取隊の帰還チェック
  checkExpeditionReturn();

  // 2. 依頼の期限チェック
  checkQuestDeadlines();

  // 3. 新しい依頼の生成
  generateNewQuests();

  // 4. マルコの来訪・出発チェック
  checkMerchantEvents();

  // 5. 施設からのアイテム生成
  processBuildingMorningItems();

  // 6. 助手の毎朝スタミナ回復
  processHelperMorningStamina();

  // 7. 朝発動アチーブメント（triggerOnMorning）
  await processMorningAchievements();

  // イベントがあればmorning画面を表示、なければ直接actionへ
  const updatedState = get(gameState);
  if (updatedState.morningEvents.length > 0) {
    setPhase('morning');
  } else {
    startActionPhase();
  }
}

/**
 * 採取隊の帰還処理
 */
function checkExpeditionReturn(): void {
  const state = get(gameState);
  if (!state.expedition) return;

  const returnDay = state.expedition.startDay + state.expedition.duration;
  if (state.day >= returnDay) {
    const area = getArea(state.expedition.areaId);
    if (!area) return;

    // ドロップアイテムを計算
    const items = calculateExpeditionDrops(
      state.expedition.areaId,
      state.expedition.duration
    );

    // アイテムを追加
    items.forEach((item) => addItem(item));

    // メッセージ生成
    const itemNames = items
      .map((item) => {
        const def = getItem(item.itemId);
        return def ? def.name : item.itemId;
      })
      .reduce((acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const itemList = Object.entries(itemNames)
      .map(([name, count]) => `${name}×${count}`)
      .join(', ');

    const event: MorningEvent = {
      type: 'expedition_return',
      message: `採取隊が${area.name}から帰還しました！ 入手: ${itemList}`,
      data: items,
    };
    addMorningEvent(event);
    addMessage(event.message);

    // 採取隊をクリア
    setExpedition(null);
  }
}

/**
 * 採取隊のドロップアイテム計算（機材効果適用済み）
 */
function calculateExpeditionDrops(areaId: string, duration: number): OwnedItem[] {
  const area = getArea(areaId);
  if (!area) return [];

  const items: OwnedItem[] = [];
  // 日ごとにドロップ数をランダムに決定
  let baseDropCount = 0;
  for (let d = 0; d < duration; d++) {
    const variance = Math.floor(Math.random() * (EXPEDITION.DROPS_PER_DAY_VARIANCE * 2 + 1)) - EXPEDITION.DROPS_PER_DAY_VARIANCE;
    baseDropCount += EXPEDITION.DROPS_PER_DAY + variance;
  }

  // 機材効果: 汎用ドロップ乗数（カテゴリ指定なし）
  const generalMult = getExpeditionDropsMult();
  // 施設・助手効果: ドロップボーナス
  const villageDropBonus = getBuildingExpeditionBonus();
  const helperDropBonus = getHelperExpeditionDropBonus();
  const effectiveDropCount = Math.round(baseDropCount * (generalMult + villageDropBonus + helperDropBonus));

  // 機材効果: レア素材確率ボーナス
  const rareBonus = getExpeditionRareBonus() + getHelperExpeditionRareBonus();

  for (let i = 0; i < effectiveDropCount; i++) {
    // レアドロップ判定（機材効果で確率上昇）
    const isRare = Math.random() < (area.rareChance + rareBonus) && area.rareDrops.length > 0;
    const dropTable = isRare ? area.rareDrops : area.drops;

    // 重み付き抽選
    const totalWeight = dropTable.reduce((sum, d) => sum + d.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const drop of dropTable) {
      roll -= drop.weight;
      if (roll <= 0) {
        const [minQ, maxQ] = drop.qualityRange;
        const quality = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ;
        const areaFlavors = expeditionFlavors[areaId] ?? [];
        const state = get(gameState);
        const droppedItem: OwnedItem = {
          itemId: drop.itemId,
          quality,
          origin: {
            type: 'expedition',
            day: state.day,
            areaId,
            flavorText: areaFlavors.length > 0 ? pickRandom(areaFlavors) : undefined,
          },
        };

        // 機材効果: カテゴリ別の追加ドロップ
        const itemInfo = getItemDef(drop.itemId);
        const catMult = itemInfo ? getExpeditionDropsMult(itemInfo.category) : 1;
        // カテゴリ乗数が汎用と異なる場合、追加ドロップとして処理
        const extraFromCat = catMult > generalMult ? Math.round(catMult - generalMult) : 0;

        items.push(droppedItem);
        for (let j = 0; j < extraFromCat; j++) {
          items.push({ ...droppedItem, quality: Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ });
        }
        break;
      }
    }
  }

  return items;
}

/**
 * 依頼の期限チェック
 */
function checkQuestDeadlines(): void {
  const state = get(gameState);

  for (const quest of state.activeQuests) {
    const deadline = quest.acceptedDay + quest.deadlineDays;
    if (state.day > deadline) {
      // 期限切れ
      const event: MorningEvent = {
        type: 'quest_expired',
        message: `依頼「${quest.title}」の期限が切れました... 名声が下がりました。`,
      };
      addMorningEvent(event);
      addMessage(event.message);

      addReputationExp(-5);
      incrementFailedQuests();
      removeActiveQuest(quest.id);
    }
  }
}

/**
 * 新しい依頼の生成
 * @param overrideCount 指定された場合、日付チェックをスキップしてこの件数を追加する
 */
export function generateNewQuests(overrideCount?: number): void {
  // クエストがアンロックされていない場合はスキップ
  if (!isActionUnlocked('quest')) {
    return;
  }

  const state = get(gameState);

  // 最初の依頼完了前はランダム生成しない
  if (!state.achievementProgress.completed.includes('ach_first_complete')) {
    return;
  }

  // 追加件数の決定
  let count: number;
  if (overrideCount !== undefined) {
    // イベント等からの直接呼び出し（初回は5件）
    count = overrideCount;
  } else {
    // 通常の朝フェーズ: n%7===1 のとき（1日目は除く）に7〜10件追加
    if (state.day === 1 || state.day % 7 !== 1) {
      return;
    }
    count = Math.floor(Math.random() * 4) + 7; // 7-10件
  }

  const reputationLevel = calcLevelFromExp(state.reputationExp);

  // 定期入れ替え（overrideCountなし）の場合、古い未受託依頼を破棄
  const isScheduledRefresh = overrideCount === undefined;

  // 受注済みIDセット（重複防止）
  const activeIds = new Set(state.activeQuests.map((q) => q.id));
  const existingIds = isScheduledRefresh
    ? activeIds
    : new Set([...state.availableQuests.map((q) => q.id), ...activeIds]);

  const templates = getAvailableQuestTemplates(reputationLevel, state.achievementProgress.completed);
  if (templates.length === 0) return;

  // 重複を除いた候補からランダムに選択
  const available = templates.filter((q) => !existingIds.has(q.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  if (selected.length > 0) {
    const newBoard = isScheduledRefresh ? selected : [...state.availableQuests, ...selected];
    setAvailableQuests(newBoard);
    incrementNewQuestCount(selected.length);

    const event: MorningEvent = {
      type: 'new_quest',
      message: isScheduledRefresh
        ? `依頼が入れ替わりました！ 新しい依頼が${selected.length}件あります`
        : `新しい依頼が${selected.length}件、掲示板に追加されました！`,
    };
    addMorningEvent(event);
    addMessage(event.message);
  }
}

/**
 * 朝のフェーズを終了し、行動フェーズに移行
 */
export function startActionPhase(): void {
  clearMorningEvents();
  setPhase('action');
}

/**
 * オープニングチュートリアルをスキップ
 * src/lib/data/skipData.json のセーブデータをロードする
 */
export function skipOpening(): void {
  const state = skipDataJson as unknown as GameState;
  if (!state.scoreHistory) {
    (state as any).scoreHistory = [];
  }
  gameState.set(state);

  // 目標追跡を初期化
  initializeActiveGoalTracking();

  // スキップ後の日のスコアを記録
  recordDailyScore();
}

/**
 * ゲーム開始時の初期化
 */
export async function initializeGame(): Promise<void> {
  // 初期依頼を設定（村長の固定クエスト）
  const mayorFirstQuest = questTemplates.find((q) => q.id === 'quest_mayor_first');
  if (mayorFirstQuest) {
    setAvailableQuests([mayorFirstQuest]);
  }

  // 1日目の演出をセット
  setDayTransition({ toDay: 1, daysAdvanced: 0 });

  // 直接actionフェーズで開始（朝フェーズはスキップ）
  setPhase('action');
  addMessage('フォンテ村での1年間が始まります。');

  // 発動済み目標の追跡を初期化
  initializeActiveGoalTracking();

  // 1日目のスコアを記録
  recordDailyScore();

  // ゲーム開始アチーブメントをチェック（ダイアログ表示）
  await processAutoCompleteAchievements();
}
