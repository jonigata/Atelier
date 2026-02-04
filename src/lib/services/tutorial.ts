import { get } from 'svelte/store';
import {
  gameState,
  advanceTutorialMilestone,
  setTutorialDialogue,
  completeTutorial,
} from '$lib/stores/game';
import { checkAchievements, getAchievementDialogue, claimReward } from './achievement';
import { getAchievementById } from '$lib/data/achievements';

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
  // マイルストーンを進める（アクションのアンロック）
  advanceTutorialMilestone(milestoneId);

  // アチーブメントのダイアログを表示
  const dialogue = getAchievementDialogue(achievementId);
  if (dialogue) {
    // アチーブメントの報酬情報を追加
    const achievement = getAchievementById(achievementId);
    if (achievement) {
      // 報酬付与（アチーブメント達成扱い）
      claimReward(achievementId);

      // 報酬情報をダイアログに追加
      const rewardLines = getRewardLines(achievement);
      if (rewardLines.length > 0) {
        dialogue.lines.push(...rewardLines);
      }
    }

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
      const achievement = getAchievementById(achievedId);
      if (achievement) {
        // 報酬情報を追加
        const rewardLines = getRewardLines(achievement);
        if (rewardLines.length > 0) {
          dialogue.lines.push(...rewardLines);
        }
      }
      setTutorialDialogue(dialogue);
    }
  }
}

/**
 * 報酬の説明行を生成
 */
function getRewardLines(
  achievement: ReturnType<typeof getAchievementById>
): string[] {
  if (!achievement) return [];

  const { reward } = achievement;
  const lines: string[] = [];

  if (reward.money) {
    lines.push(`【報酬】${reward.money}G を獲得しました`);
  }

  if (reward.items && reward.items.length > 0) {
    lines.push(`【報酬】アイテムを獲得しました`);
  }

  if (reward.reputation) {
    lines.push(`【報酬】名声が ${reward.reputation} 上がりました`);
  }

  if (reward.recipes && reward.recipes.length > 0) {
    lines.push(`【報酬】新しいレシピを習得しました`);
  }

  return lines;
}

/**
 * ダイアログを閉じた後の処理
 */
export function onDialogueClosed(): void {
  const state = get(gameState);

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
