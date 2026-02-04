import { get } from 'svelte/store';
import { gameState } from './game';
import type { TutorialDialogue, ActionType } from '$lib/models/types';
import { getUnlockedActionsUpTo, TUTORIAL_ACTIONS } from '$lib/data/tutorial';

/**
 * チュートリアルダイアログを設定
 */
export function setTutorialDialogue(dialogue: TutorialDialogue | null): void {
  gameState.update((state) => ({
    ...state,
    tutorialProgress: {
      ...state.tutorialProgress,
      pendingDialogue: dialogue,
    },
  }));
}

/**
 * チュートリアルマイルストーンを進める
 */
export function advanceTutorialMilestone(milestoneId: number): void {
  gameState.update((state) => ({
    ...state,
    tutorialProgress: {
      ...state.tutorialProgress,
      currentMilestone: milestoneId,
      unlockedActions: getUnlockedActionsUpTo(milestoneId),
    },
  }));
}

/**
 * チュートリアルを完了
 */
export function completeTutorial(): void {
  gameState.update((state) => ({
    ...state,
    tutorialProgress: {
      ...state.tutorialProgress,
      isActive: false,
      unlockedActions: [...new Set([...TUTORIAL_ACTIONS, ...state.tutorialProgress.unlockedActions])],
      pendingDialogue: null,
    },
  }));
}

/**
 * チュートリアルをスキップ（経験者モード）
 */
export function skipTutorial(): void {
  gameState.update((state) => ({
    ...state,
    tutorialProgress: {
      isActive: false,
      currentMilestone: -1,
      unlockedActions: TUTORIAL_ACTIONS,
      pendingDialogue: null,
    },
  }));
}

/**
 * 指定アクションがアンロックされているか確認
 */
export function isActionUnlocked(action: ActionType): boolean {
  const state = get(gameState);
  return state.tutorialProgress.unlockedActions.includes(action);
}
