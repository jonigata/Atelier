import { gameState } from './game';

/**
 * 調合回数と最高品質を更新
 */
export function incrementCraftCount(quality: number): void {
  gameState.update((state) => ({
    ...state,
    stats: {
      ...state.stats,
      totalCraftCount: state.stats.totalCraftCount + 1,
      highestQualityCrafted: Math.max(state.stats.highestQualityCrafted, quality),
    },
  }));
}

/**
 * 採取隊派遣回数を更新
 */
export function incrementExpeditionCount(): void {
  gameState.update((state) => ({
    ...state,
    stats: {
      ...state.stats,
      totalExpeditionCount: state.stats.totalExpeditionCount + 1,
    },
  }));
}

/**
 * 連続依頼成功回数を増加
 */
export function incrementConsecutiveQuestSuccess(): void {
  gameState.update((state) => ({
    ...state,
    stats: {
      ...state.stats,
      consecutiveQuestSuccess: state.stats.consecutiveQuestSuccess + 1,
    },
  }));
}

/**
 * 連続依頼成功回数をリセット
 */
export function resetConsecutiveQuestSuccess(): void {
  gameState.update((state) => ({
    ...state,
    stats: {
      ...state.stats,
      consecutiveQuestSuccess: 0,
    },
  }));
}

/**
 * 売上金額を加算
 */
export function addSalesAmount(amount: number): void {
  gameState.update((state) => ({
    ...state,
    stats: {
      ...state.stats,
      totalSalesAmount: state.stats.totalSalesAmount + amount,
    },
  }));
}
