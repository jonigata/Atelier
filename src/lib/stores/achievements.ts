import { get } from 'svelte/store';
import { gameState } from './game';

/**
 * アチーブメントを完了としてマーク
 */
export function completeAchievement(achievementId: string): void {
  gameState.update((state) => {
    if (state.achievementProgress.completed.includes(achievementId)) {
      return state;
    }
    return {
      ...state,
      achievementProgress: {
        ...state.achievementProgress,
        completed: [...state.achievementProgress.completed, achievementId],
        pendingReward: achievementId,
      },
    };
  });
}

/**
 * 報酬受取待ちをクリア
 */
export function clearPendingReward(): void {
  gameState.update((state) => ({
    ...state,
    achievementProgress: {
      ...state.achievementProgress,
      pendingReward: null,
    },
  }));
}

/**
 * アチーブメントが完了済みかチェック
 */
export function isAchievementCompleted(achievementId: string): boolean {
  const state = get(gameState);
  return state.achievementProgress.completed.includes(achievementId);
}
