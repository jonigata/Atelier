import { get } from 'svelte/store';
import {
  gameState,
  completeAchievement,
} from '$lib/stores/game';
import { setTutorialDialogue } from '$lib/stores/tutorial';
import { checkAchievements, getAchievementDialogue, claimReward, checkNewActiveGoals } from './achievement';
import { triggerUnlockAnimations, showUnlockToast, pendingUnlockActions } from '$lib/stores/toast';
import { getAutoCompleteAchievements } from '$lib/data/achievements';

/**
 * ゲーム開始時にautoCompleteアチーブメントをチェック
 */
export function checkAutoCompleteAchievements(): void {
  const state = get(gameState);

  const autoAchievements = getAutoCompleteAchievements();
  for (const achievement of autoAchievements) {
    // 既に達成済みならスキップ
    if (state.achievementProgress.completed.includes(achievement.id)) continue;

    // 自動達成
    completeAchievement(achievement.id);
    const dialogue = getAchievementDialogue(achievement.id);
    if (dialogue) {
      setTutorialDialogue(dialogue);
      claimReward(achievement.id);
    }
    // 最初の1つだけ処理（残りはダイアログ終了後に順次）
    return;
  }
}

/**
 * アチーブメントをチェックしてトリガー
 */
function checkAndTriggerAchievement(): void {
  const state = get(gameState);

  // 既にダイアログ表示中なら何もしない
  if (state.tutorialProgress.pendingDialogue) return;
  if (state.achievementProgress.pendingReward) return;

  const achievedId = checkAchievements();
  if (achievedId) {
    const dialogue = getAchievementDialogue(achievedId);
    if (dialogue) {
      setTutorialDialogue(dialogue);
    }
  }
}

/**
 * マイルストーン/アチーブメント進捗をチェック
 * 各アクション完了時に呼び出す
 */
export function checkMilestoneProgress(): void {
  checkAndTriggerAchievement();
}

/**
 * ダイアログを閉じた後の処理
 */
export function onDialogueClosed(): void {
  const state = get(gameState);

  // 1. アンロックアニメーションをトリガー
  const pending = get(pendingUnlockActions);
  if (pending.length > 0) {
    triggerUnlockAnimations();

    // 2. 少し遅延してトーストを表示
    setTimeout(() => {
      for (const action of pending) {
        showUnlockToast(action);
      }
      // 3. さらに遅延して目標トーストを表示
      setTimeout(() => {
        checkNewActiveGoals();
      }, 300);
    }, 500);
  } else {
    // アンロックがない場合は目標トーストのみ
    checkNewActiveGoals();
  }

  // アチーブメントの報酬がpendingなら付与
  if (state.achievementProgress.pendingReward) {
    claimReward(state.achievementProgress.pendingReward);
  }

  // 次のアチーブメントをチェック
  checkAndTriggerAchievement();
}
