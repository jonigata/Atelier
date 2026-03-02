import { get } from 'svelte/store';
import { gameState, clearDayTransition, setPhase, addMessage, addItem, addMoney, addReputationExp } from '$lib/stores/game';
import { generateNewQuests } from '$lib/services/gameLoop';
import { setEventDialogue } from '$lib/stores/tutorial';
import {
  showGoalCompleteToast,
  showUnlockToast,
  triggerUnlockAnimations,
  pendingUnlockActions,
} from '$lib/stores/toast';
import {
  checkAchievements,
  getAchievementDialogue,
  claimReward,
  checkNewActiveGoals,
  isStoryAchievement,
  preSelectRandomEquipment,
} from './achievement';
import { showDrawAndWait } from './drawEvent';
import { getAchievementById } from '$lib/data/achievements';
import { autoSave } from '$lib/services/saveLoad';
import { INSPECTION_DAYS, inspections, getOverallGrade, getGradeForValue, getInspectionReward } from '$lib/data/inspection';
import type { InspectionGrade } from '$lib/data/inspection';
import { getItem } from '$lib/data/items';
import type { EquipmentDef, NarrativeLine, InspectionCutsceneData } from '$lib/models/types';
import type { EventDialogue } from '$lib/models/types';

// 日数表示の完了を待つための resolver
let dayTransitionResolver: (() => void) | null = null;

// ダイアログ完了を待つための resolver
let dialogueResolver: (() => void) | null = null;

// 査察カットシーン完了を待つための resolver
let inspectionCutsceneResolver: (() => void) | null = null;

/**
 * 日数表示の完了を待つ
 * DayTransition.svelte から呼ばれる
 */
export function resolveDayTransition(): void {
  clearDayTransition();
  if (dayTransitionResolver) {
    dayTransitionResolver();
    dayTransitionResolver = null;
  }
}

/**
 * ダイアログの完了を待つ
 * EventDialog.svelte から呼ばれる
 */
export function resolveDialogue(): void {
  setEventDialogue(null);
  if (dialogueResolver) {
    dialogueResolver();
    dialogueResolver = null;
  }
}

/**
 * 日数表示が終わるまで待つ
 */
async function waitForDayTransition(): Promise<void> {
  const state = get(gameState);
  if (!state.pendingDayTransition) {
    return;
  }

  return new Promise((resolve) => {
    dayTransitionResolver = resolve;
  });
}

/**
 * 査察カットシーンの完了を待つ
 * InspectionCutscene.svelte から呼ばれる
 */
export function resolveInspectionCutscene(): void {
  gameState.update((s) => ({ ...s, pendingInspectionCutscene: null }));
  if (inspectionCutsceneResolver) {
    inspectionCutsceneResolver();
    inspectionCutsceneResolver = null;
  }
}

/**
 * 査察カットシーンを表示して完了まで待つ
 */
async function showInspectionCutsceneAndWait(data: InspectionCutsceneData): Promise<void> {
  gameState.update((s) => ({ ...s, pendingInspectionCutscene: data }));

  return new Promise((resolve) => {
    inspectionCutsceneResolver = resolve;
  });
}

/**
 * ダイアログを表示して閉じるまで待つ
 */
export async function showDialogueAndWait(dialogue: EventDialogue): Promise<void> {
  setEventDialogue(dialogue);

  return new Promise((resolve) => {
    dialogueResolver = resolve;
  });
}

/**
 * アンロックトーストを表示
 */
async function showUnlockToasts(): Promise<void> {
  const pending = get(pendingUnlockActions);
  if (pending.length === 0) {
    return;
  }

  // アンロックアニメーション開始
  triggerUnlockAnimations();

  // アニメーション後にトースト表示
  await sleep(500);
  for (const action of pending) {
    showUnlockToast(action);
  }
}

/**
 * 指定ミリ秒待つ
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * アチーブメント達成時の一連の演出を順番に実行
 * 日数表示 → ダイアログ → アンロック演出 → トースト
 */
export async function processAchievementPresentation(achievementId: string): Promise<void> {
  // 1. 日数表示を待つ
  await waitForDayTransition();

  // 2. ランダム機材を事前選択（ダイアログに名前を表示するため）
  const achievement = getAchievementById(achievementId);
  let pickedEquipment: EquipmentDef[] = [];
  if (achievement?.reward.randomCommonEquipment) {
    pickedEquipment = preSelectRandomEquipment(achievement.reward.randomCommonEquipment);
  }

  // 3. ダイアログを表示して待つ
  const dialogue = getAchievementDialogue(achievementId, pickedEquipment);
  if (dialogue) {
    await showDialogueAndWait(dialogue);
  }

  // 4. 報酬を付与（事前選択した機材を渡す）
  const drawInfos = claimReward(achievementId, pickedEquipment);

  // 最初の依頼完了時、ランダム依頼生成を開始（初回は5件）
  if (achievementId === 'ach_first_complete') {
    generateNewQuests(5);
  }

  // 5. アンロックアニメーション＆トースト
  await showUnlockToasts();

  // 5. 目標達成トースト（ストーリー/チュートリアル系はスキップ）
  if (achievement && !isStoryAchievement(achievement)) {
    await sleep(300);
    showGoalCompleteToast(achievement.title);
  }

  // 6. 新しく発動した目標のトースト
  await sleep(300);
  checkNewActiveGoals();

  // 7. ドロー表示（明示的に待つ）
  if (drawInfos.villageDrawInfo) await showDrawAndWait({ type: 'facility', levelUpInfo: drawInfos.villageDrawInfo });
  if (drawInfos.reputationDrawInfo) await showDrawAndWait({ type: 'helper', levelUpInfo: drawInfos.reputationDrawInfo });

  // 8. アチーブメント完了後にオートセーブ
  // endTurn内のautoSaveがprocessActionCompleteより先に実行される場合、
  // 達成状態が永続化されずリロード後に再発火するのを防ぐ
  autoSave();
}

/**
 * アクション完了後のマイルストーン処理
 * これが新しいエントリポイント
 */
export async function processActionComplete(): Promise<void> {
  const state = get(gameState);

  // 既にダイアログ表示中なら何もしない
  if (state.tutorialProgress.pendingDialogue) return;
  if (state.achievementProgress.pendingReward) return;

  // アチーブメントをチェック
  const achievedId = checkAchievements();
  if (achievedId) {
    await processAchievementPresentation(achievedId);

    // 連鎖的に次のアチーブメントをチェック
    await processActionComplete();
  }
}

/**
 * 査察シーケンス全体（日送り直後、朝画面の前に実行）
 * ムービー → 導入ダイアログ → 評価カットシーン → 結果ダイアログ を一連で再生。
 * ホーム画面が見えないまま全て完了する。
 */
export async function processInspectionSequence(): Promise<boolean> {
  const state = get(gameState);

  // 査察制度が未説明（ach_inspection_intro 未完了）ならスキップ
  if (!state.achievementProgress.completed.includes('ach_inspection_intro')) {
    return false;
  }

  // 処理すべき査察を検出（d < state.day かつ未処理、12月末=336は除外）
  const pendingDays = INSPECTION_DAYS.filter(
    (d) => d < state.day && d !== 336 && !state.completedInspections.includes(d)
  );

  if (pendingDays.length === 0) return false;

  // 黒オーバーレイON（DayTransitionの裏でホーム画面を隠す）
  gameState.update((s) => ({ ...s, inspectionBackdrop: true }));

  // 日数表示を待つ
  await waitForDayTransition();

  for (const inspDay of pendingDays) {
    const inspection = inspections.find((i) => i.day === inspDay);
    if (!inspection) continue;

    const overallGrade = getOverallGrade(inspection, state);

    // 各項目の結果データ
    const criteriaResults = inspection.criteria.map((c) => {
      const value = c.getValue(state);
      const grade = getGradeForValue(c.thresholds, value);
      return { label: c.label, value: `${value}${c.unit}`, grade };
    });

    const passed = overallGrade !== 'D';

    // 1. 査察官が歩いてくるムービー
    await showInspectionCutsceneAndWait({
      mode: 'movie',
      month: inspection.month,
      title: inspection.title,
      criteria: criteriaResults,
      overallGrade,
      passed,
    });

    // 2. 導入ダイアログ（クリック送り）
    await showDialogueAndWait({
      characterName: '査察官',
      characterTitle: '師匠組合',
      characterFaceId: 'inspector',
      eventImage: '/images/events/inspection_evaluation.png',
      lines: [
        { text: `${inspection.month}月末の定期査察を執り行います`, expression: 'neutral' },
        { text: 'それでは項目ごとに確認します', expression: 'neutral' },
      ],
    });

    // 3. 査察カットシーン（評価タイムライン）
    await showInspectionCutsceneAndWait({
      mode: 'evaluation',
      month: inspection.month,
      title: inspection.title,
      criteria: criteriaResults,
      overallGrade,
      passed,
    });

    // 3. 結果コメント（クリック送り）
    const verdictLines: NarrativeLine[] = [];
    if (passed) {
      verdictLines.push({ text: `以上を踏まえまして、総合${overallGrade}等級。合格です`, expression: 'neutral' });
      verdictLines.push({ text: '引き続き精進を期待します', expression: 'neutral' });
    } else {
      verdictLines.push({ text: '以上を踏まえまして……総合D等級。不合格です', expression: 'neutral' });
      verdictLines.push({ text: '残念ですが、これ以上の活動継続は認められません', expression: 'neutral' });
      verdictLines.push({ text: '召還命令を発行します', expression: 'neutral' });
    }

    await showDialogueAndWait({
      characterName: '査察官',
      characterTitle: '師匠組合',
      characterFaceId: 'inspector',
      lines: verdictLines,
    });

    // メッセージログに記録
    addMessage(`【査察結果】${inspection.month}月末 ${inspection.title}: 総合${overallGrade}等級${passed ? '（合格）' : '（不合格）'}`);

    // 報酬付与（B等級以上）
    const reward = passed ? getInspectionReward(inspDay, overallGrade as InspectionGrade) : null;
    if (reward) {
      // 報酬カットシーンのデータを組み立て
      const rewardItemsData = reward.items.map((ri) => {
        const itemDef = getItem(ri.itemId);
        return { itemId: ri.itemId, name: itemDef?.name ?? ri.itemId, quality: ri.quality, quantity: ri.quantity };
      });

      // 報酬カットシーン表示
      await showInspectionCutsceneAndWait({
        mode: 'reward',
        month: inspection.month,
        title: inspection.title,
        criteria: criteriaResults,
        overallGrade,
        passed,
        rewardItems: rewardItemsData,
        rewardMoney: reward.money,
      });

      // 実際に報酬を付与
      if (reward.money > 0) {
        addMoney(reward.money);
      }
      const currentState = get(gameState);
      for (const ri of reward.items) {
        for (let i = 0; i < ri.quantity; i++) {
          addItem({
            itemId: ri.itemId,
            quality: ri.quality,
            origin: { type: 'reward', day: currentState.day, flavorText: `${inspection.month}月末査察報酬` },
          });
        }
      }
      let inspRepDrawInfo = null;
      if (reward.reputationExp > 0) {
        inspRepDrawInfo = addReputationExp(reward.reputationExp);
      }

      // メッセージログに報酬内容を記録
      const rewardDescParts: string[] = [];
      if (reward.money > 0) rewardDescParts.push(`${reward.money}G`);
      for (const ri of rewardItemsData) {
        rewardDescParts.push(`${ri.name}(品質${ri.quality})×${ri.quantity}`);
      }
      addMessage(`【査察報酬】${rewardDescParts.join('、')}`);

      // ドロー表示
      if (inspRepDrawInfo) await showDrawAndWait({ type: 'helper', levelUpInfo: inspRepDrawInfo });
    }

    // 次の査察日を告知
    if (passed) {
      const nextInsp = inspections.find((i) => i.day > inspDay);
      const nextDeadlineLines: NarrativeLine[] = [];
      if (nextInsp) {
        nextDeadlineLines.push({ text: `次の査察は${nextInsp.month}月末です。それまでに備えておくように`, expression: 'neutral' });
      } else {
        nextDeadlineLines.push({ text: '次回は12月末の最終評価となります。悔いのないよう励みなさい', expression: 'neutral' });
      }
      await showDialogueAndWait({
        characterName: '査察官',
        characterTitle: '師匠組合',
        characterFaceId: 'inspector',
        lines: nextDeadlineLines,
      });
    }

    // completedInspections に追加
    gameState.update((s) => ({
      ...s,
      completedInspections: [...s.completedInspections, inspDay],
    }));

    // 不合格ならゲームオーバー
    if (!passed) {
      gameState.update((s) => ({
        ...s,
        inspectionBackdrop: false,
        gameOverReason: `${inspection.month}月末の査察で不合格（D等級）となり、召還されました。`,
      }));
      setPhase('ending');
      return true; // 中断
    }
  }

  // 黒オーバーレイOFF
  gameState.update((s) => ({ ...s, inspectionBackdrop: false }));
  return false;
}

/**
 * 朝フェーズのアチーブメント処理
 * triggerOnMorning フラグ付きのアチーブメントをチェック
 */
export async function processMorningAchievements(): Promise<void> {
  const state = get(gameState);

  if (state.tutorialProgress.pendingDialogue) return;
  if (state.achievementProgress.pendingReward) return;

  const achievedId = checkAchievements(true);
  if (achievedId) {
    await processAchievementPresentation(achievedId);

    // 連鎖チェック（通常アチーブメントも含む）
    await processActionComplete();
  }
}

/**
 * ゲーム開始時のautoCompleteアチーブメントを処理
 */
export async function processAutoCompleteAchievements(): Promise<void> {
  const { getAutoCompleteAchievements } = await import('$lib/data/achievements');
  const { completeAchievement } = await import('$lib/stores/achievements');

  const state = get(gameState);
  const autoAchievements = getAutoCompleteAchievements();

  for (const achievement of autoAchievements) {
    // 既に達成済みならスキップ
    if (state.achievementProgress.completed.includes(achievement.id)) continue;

    // 自動達成
    completeAchievement(achievement.id);

    // 演出を実行
    await processAchievementPresentation(achievement.id);

    // 1つ処理したら連鎖チェック
    await processActionComplete();
    break;
  }
}
