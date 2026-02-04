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
  addReputation,
  removeActiveQuest,
  incrementFailedQuests,
  setAvailableQuests,
  setDayTransition,
} from '$lib/stores/game';
import { queueUnlockAction } from '$lib/stores/toast';
import { getArea } from '$lib/data/areas';
import { getItem } from '$lib/data/items';
import { getAvailableQuestTemplates } from '$lib/data/quests';
import { villageMilestones, getVillageMilestoneDialogue } from '$lib/data/tutorial';
import { initializeActiveGoalTracking } from '$lib/services/achievement';
import type { OwnedItem, MorningEvent } from '$lib/models/types';

// 達成済みの村発展マイルストーンを追跡
const completedVillageMilestones = new Set<string>();

/**
 * ゲームループのメイン処理
 * 行動後に呼び出され、時間を進めて朝のフェーズに移行する
 */
export function endTurn(daysSpent: number): void {
  if (daysSpent > 0) {
    advanceDay(daysSpent);
  }

  const state = get(gameState);

  // ゲーム終了チェック
  if (state.day > 365) {
    setPhase('ending');
    addMessage('1年が経過しました。最終評価を行います...');
    return;
  }

  // 朝のフェーズに移行
  processMorningPhase();
}

/**
 * 朝のフェーズ処理
 */
function processMorningPhase(): void {
  clearMorningEvents();

  const state = get(gameState);
  addMessage(`--- ${state.day}日目の朝 ---`);

  // 1. 村発展マイルストーンチェック
  checkVillageMilestones();

  // 2. 採取隊の帰還チェック
  checkExpeditionReturn();

  // 3. 依頼の期限チェック
  checkQuestDeadlines();

  // 4. 新しい依頼の生成
  generateNewQuests();

  // イベントがあればmorning画面を表示、なければ直接actionへ
  const updatedState = get(gameState);
  if (updatedState.morningEvents.length > 0) {
    setPhase('morning');
  } else {
    setPhase('action');
  }
}

/**
 * 村発展マイルストーンチェック
 */
function checkVillageMilestones(): void {
  const state = get(gameState);

  for (const milestone of villageMilestones) {
    if (completedVillageMilestones.has(milestone.id)) continue;
    if (state.villageDevelopment < milestone.requiredDevelopment) continue;

    // マイルストーン達成
    completedVillageMilestones.add(milestone.id);

    const dialogue = getVillageMilestoneDialogue(milestone.id);
    if (dialogue) {
      // イベントとして通知
      const event: MorningEvent = {
        type: 'tutorial',
        message: `${dialogue.characterName}が村にやってきた！`,
        data: { milestoneId: milestone.id, dialogue },
      };
      addMorningEvent(event);

      // アクション解放
      if (milestone.unlocks.length > 0) {
        gameState.update((s) => ({
          ...s,
          tutorialProgress: {
            ...s.tutorialProgress,
            unlockedActions: [...new Set([...s.tutorialProgress.unlockedActions, ...milestone.unlocks])],
            pendingDialogue: dialogue,
          },
        }));
        addMessage(`${dialogue.characterName}の到着により、${milestone.unlocks.join('、')}が解放されました！`);

        // アンロック演出をキューに追加（ダイアログ終了後に表示）
        for (const action of milestone.unlocks) {
          queueUnlockAction(action as import('$lib/models/types').ActionType);
        }
      }
    }
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
 * 採取隊のドロップアイテム計算
 */
function calculateExpeditionDrops(areaId: string, duration: number): OwnedItem[] {
  const area = getArea(areaId);
  if (!area) return [];

  const items: OwnedItem[] = [];
  const baseDropCount = duration * 2; // 1日あたり2個

  for (let i = 0; i < baseDropCount; i++) {
    // レアドロップ判定
    const isRare = Math.random() < area.rareChance && area.rareDrops.length > 0;
    const dropTable = isRare ? area.rareDrops : area.drops;

    // 重み付き抽選
    const totalWeight = dropTable.reduce((sum, d) => sum + d.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const drop of dropTable) {
      roll -= drop.weight;
      if (roll <= 0) {
        const [minQ, maxQ] = drop.qualityRange;
        const quality = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ;
        items.push({ itemId: drop.itemId, quality });
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

      addReputation(-5);
      incrementFailedQuests();
      removeActiveQuest(quest.id);
    }
  }
}

/**
 * 新しい依頼の生成
 */
function generateNewQuests(): void {
  const state = get(gameState);

  // 一定確率で新しい依頼を追加
  if (Math.random() < 0.3 || state.availableQuests.length === 0) {
    const templates = getAvailableQuestTemplates(state.alchemyLevel, state.reputation);

    if (templates.length > 0) {
      // ランダムに1-2個選択
      const count = Math.min(templates.length, Math.random() < 0.5 ? 1 : 2);
      const shuffled = [...templates].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);

      // 既存の依頼と重複しないものだけ追加
      const existingIds = new Set([
        ...state.availableQuests.map((q) => q.id),
        ...state.activeQuests.map((q) => q.id),
      ]);

      const newQuests = selected.filter((q) => !existingIds.has(q.id));

      if (newQuests.length > 0) {
        setAvailableQuests([...state.availableQuests, ...newQuests]);

        const event: MorningEvent = {
          type: 'new_quest',
          message: `新しい依頼が掲示板に追加されました！`,
        };
        addMorningEvent(event);
        addMessage(event.message);
      }
    }
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
 * ゲーム開始時の初期化
 */
export function initializeGame(): void {
  // 村発展マイルストーンをリセット
  completedVillageMilestones.clear();

  // 初期依頼を設定
  const state = get(gameState);
  const templates = getAvailableQuestTemplates(state.alchemyLevel, state.reputation);
  const initialQuests = templates.slice(0, 2);
  setAvailableQuests(initialQuests);

  // 1日目の演出をセット
  setDayTransition({ toDay: 1, daysAdvanced: 0 });

  // 直接actionフェーズで開始（朝フェーズはスキップ）
  setPhase('action');
  addMessage('ハイデル村での1年間が始まります。');

  // 発動済み目標の追跡を初期化
  initializeActiveGoalTracking();
}
