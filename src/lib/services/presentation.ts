import { get } from 'svelte/store';
import { gameState, clearDayTransition, setPhase, addMessage } from '$lib/stores/game';
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
import { getAchievementById } from '$lib/data/achievements';
import { INSPECTION_DAYS, inspections, getOverallGrade, getGradeForValue } from '$lib/data/inspection';
import type { EquipmentDef } from '$lib/models/types';
import type { EventDialogue } from '$lib/models/types';

// 日数表示の完了を待つための resolver
let dayTransitionResolver: (() => void) | null = null;

// ダイアログ完了を待つための resolver
let dialogueResolver: (() => void) | null = null;

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
 * ダイアログを表示して閉じるまで待つ
 */
async function showDialogueAndWait(dialogue: EventDialogue): Promise<void> {
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
  claimReward(achievementId, pickedEquipment);

  // 最初の依頼完了時、ランダム依頼生成を開始
  if (achievementId === 'ach_first_complete') {
    generateNewQuests();
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
 * 査察の朝処理
 * 査察日の翌朝に査察結果を告げる。D等級ならゲームオーバー。
 */
export async function processInspectionMorning(): Promise<boolean> {
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

  for (const inspDay of pendingDays) {
    const inspection = inspections.find((i) => i.day === inspDay);
    if (!inspection) continue;

    const overallGrade = getOverallGrade(inspection, state);

    // 各項目の結果テキスト
    const criteriaLines = inspection.criteria.map((c) => {
      const value = c.getValue(state);
      const grade = getGradeForValue(c.thresholds, value);
      return `${c.label}: ${value}${c.unit} → ${grade}等級`;
    });

    const passed = overallGrade !== 'D';

    // 日数表示を待つ
    await waitForDayTransition();

    // 査察ダイアログ表示
    const lines: string[] = [
      `${inspection.month}月末の定期査察を執り行います`,
      criteriaLines.join(' / '),
      passed
        ? `総合評価: ${overallGrade}等級。合格です`
        : `総合評価: ${overallGrade}等級……不合格です`,
    ];

    if (passed) {
      lines.push('引き続き精進を期待します');
    } else {
      lines.push('残念ですが、これ以上の活動継続は認められません。召還命令を発行します');
    }

    await showDialogueAndWait({
      characterName: '査察官',
      characterTitle: '師匠組合',
      lines,
    });

    // メッセージログに記録
    addMessage(`【査察結果】${inspection.month}月末 ${inspection.title}: 総合${overallGrade}等級${passed ? '（合格）' : '（不合格）'}`);

    // completedInspections に追加
    gameState.update((s) => ({
      ...s,
      completedInspections: [...s.completedInspections, inspDay],
    }));

    // 不合格ならゲームオーバー
    if (!passed) {
      gameState.update((s) => ({
        ...s,
        gameOverReason: `${inspection.month}月末の査察で不合格（D等級）となり、召還されました。`,
      }));
      setPhase('ending');
      return true; // 中断
    }
  }

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
