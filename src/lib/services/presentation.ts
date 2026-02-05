import { get } from 'svelte/store';
import { gameState, clearDayTransition } from '$lib/stores/game';
import { setTutorialDialogue } from '$lib/stores/tutorial';
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
} from './achievement';
import { getAchievementById } from '$lib/data/achievements';
import type { TutorialDialogue } from '$lib/models/types';

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
 * TutorialDialogue.svelte から呼ばれる
 */
export function resolveDialogue(): void {
  setTutorialDialogue(null);
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
async function showDialogueAndWait(dialogue: TutorialDialogue): Promise<void> {
  setTutorialDialogue(dialogue);

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

  // 2. ダイアログを表示して待つ
  const dialogue = getAchievementDialogue(achievementId);
  if (dialogue) {
    await showDialogueAndWait(dialogue);
  }

  // 3. 報酬を付与
  claimReward(achievementId);

  // 4. アンロックアニメーション＆トースト
  await showUnlockToasts();

  // 5. 目標達成トースト
  const achievement = getAchievementById(achievementId);
  if (achievement) {
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
