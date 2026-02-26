import { get } from 'svelte/store';
import { gameState } from './game';

/**
 * アチーブメント達成を開始（pendingRewardをセット）
 * completed への追加は報酬受取時（clearPendingReward）に行う
 */
export function completeAchievement(achievementId: string): void {
  gameState.update((state) => {
    if (state.achievementProgress.completed.includes(achievementId)) {
      return state;
    }
    if (state.achievementProgress.pendingReward) {
      return state;
    }
    return {
      ...state,
      achievementProgress: {
        ...state.achievementProgress,
        pendingReward: achievementId,
      },
    };
  });
}

/**
 * 報酬受取を完了し、アチーブメントを completed に追加
 */
export function clearPendingReward(): void {
  gameState.update((state) => {
    const pendingId = state.achievementProgress.pendingReward;
    return {
      ...state,
      achievementProgress: {
        ...state.achievementProgress,
        completed: pendingId && !state.achievementProgress.completed.includes(pendingId)
          ? [...state.achievementProgress.completed, pendingId]
          : state.achievementProgress.completed,
        pendingReward: null,
      },
    };
  });
}

/**
 * アチーブメントが完了済みかチェック
 */
export function isAchievementCompleted(achievementId: string): boolean {
  const state = get(gameState);
  return state.achievementProgress.completed.includes(achievementId);
}
