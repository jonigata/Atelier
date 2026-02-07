import { get } from 'svelte/store';
import { gameState } from './game';
import type { EventDialogue, ActionType } from '$lib/models/types';

/**
 * イベントダイアログを設定
 */
export function setEventDialogue(dialogue: EventDialogue | null): void {
  gameState.update((state) => ({
    ...state,
    tutorialProgress: {
      ...state.tutorialProgress,
      pendingDialogue: dialogue,
    },
  }));
}

/**
 * アクションをアンロック
 */
export function unlockAction(action: ActionType): void {
  gameState.update((state) => {
    if (state.tutorialProgress.unlockedActions.includes(action)) {
      return state;
    }
    return {
      ...state,
      tutorialProgress: {
        ...state.tutorialProgress,
        unlockedActions: [...state.tutorialProgress.unlockedActions, action],
      },
    };
  });
}

/**
 * 複数のアクションを一括アンロック
 */
export function unlockActions(actions: ActionType[]): void {
  gameState.update((state) => {
    const newActions = actions.filter(
      (action) => !state.tutorialProgress.unlockedActions.includes(action)
    );
    if (newActions.length === 0) return state;
    return {
      ...state,
      tutorialProgress: {
        ...state.tutorialProgress,
        unlockedActions: [...state.tutorialProgress.unlockedActions, ...newActions],
      },
    };
  });
}

/**
 * 指定アクションがアンロックされているか確認
 */
export function isActionUnlocked(action: ActionType): boolean {
  const state = get(gameState);
  return state.tutorialProgress.unlockedActions.includes(action);
}
