import { get } from 'svelte/store';
import {
  gameState,
  advanceTutorialMilestone,
  setTutorialDialogue,
  completeTutorial,
  completeAchievement,
} from '$lib/stores/game';
import { checkAchievements, getAchievementDialogue, claimReward, checkNewActiveGoals } from './achievement';
import { triggerUnlockAnimations, showUnlockToast, pendingUnlockActions, queueUnlockAction } from '$lib/stores/toast';
import { milestones } from '$lib/data/tutorial';

/**
 * マイルストーン達成をチェックし、必要に応じて次のマイルストーンをトリガー
 * チュートリアル完了後はアチーブメントのみチェック
 * 各アクション完了時に呼び出す
 */
export function checkMilestoneProgress(): void {
  const state = get(gameState);

  // チュートリアル中はマイルストーンをチェック
  if (state.tutorialProgress.isActive) {
    // 既にダイアログ表示中なら何もしない
    if (state.tutorialProgress.pendingDialogue) return;

    const current = state.tutorialProgress.currentMilestone;

    // マイルストーン0完了 → 1へ: 最初のレシピ習得
    if (current === 0 && state.knownRecipes.length > 0) {
      triggerMilestoneWithAchievement(1, 'ach_first_recipe');
      return;
    }

    // マイルストーン1完了 → 2へ: 最初の調合成功
    if (current === 1 && state.craftedItems.length > 0) {
      triggerMilestoneWithAchievement(2, 'ach_first_craft');
      return;
    }

    // マイルストーン2完了 → 3へ: 最初の依頼受注
    if (current === 2 && state.activeQuests.length > 0) {
      triggerMilestoneWithAchievement(3, 'ach_first_quest');
      return;
    }

    // マイルストーン3完了 → 4へ: 最初の依頼完了
    if (current === 3 && state.completedQuestCount > 0) {
      triggerMilestoneWithAchievement(4, 'ach_first_complete');
      return;
    }

    // マイルストーン4完了 → チュートリアル終了
    if (current === 4) {
      completeTutorial();
      // チュートリアル終了後もアチーブメントをチェック
      checkAndTriggerAchievement();
    }
    return;
  }

  // チュートリアル完了後はアチーブメントのみチェック
  checkAndTriggerAchievement();
}

/**
 * マイルストーンとアチーブメントを同時にトリガー
 * ダイアログはアチーブメントのものを使用（報酬付きのため）
 */
function triggerMilestoneWithAchievement(
  milestoneId: number,
  achievementId: string
): void {
  // このマイルストーンでアンロックされるアクションを取得
  const milestone = milestones.find(m => m.id === milestoneId);
  if (milestone) {
    for (const action of milestone.unlocks) {
      queueUnlockAction(action);
    }
  }

  // マイルストーンを進める（アクションのアンロック）
  advanceTutorialMilestone(milestoneId);

  // アチーブメントのダイアログを表示
  const dialogue = getAchievementDialogue(achievementId);
  if (dialogue) {
    // アチーブメント達成を記録してから報酬付与
    completeAchievement(achievementId);
    claimReward(achievementId);
    setTutorialDialogue(dialogue);
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

  // チュートリアル中でマイルストーン4が完了していたら終了処理
  if (state.tutorialProgress.isActive) {
    if (state.tutorialProgress.currentMilestone === 4) {
      completeTutorial();
    }
    return;
  }

  // アチーブメントの報酬がpendingなら付与
  if (state.achievementProgress.pendingReward) {
    claimReward(state.achievementProgress.pendingReward);
  }

  // 次のアチーブメントをチェック
  checkAndTriggerAchievement();
}
