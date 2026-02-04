import { gameState } from './game';
import type { ActiveQuest, QuestDef } from '$lib/models/types';

/**
 * アクティブな依頼を追加
 */
export function addActiveQuest(quest: ActiveQuest): void {
  gameState.update((state) => ({
    ...state,
    activeQuests: [...state.activeQuests, quest],
  }));
}

/**
 * アクティブな依頼を削除
 */
export function removeActiveQuest(questId: string): void {
  gameState.update((state) => ({
    ...state,
    activeQuests: state.activeQuests.filter((q) => q.id !== questId),
  }));
}

/**
 * 利用可能な依頼を設定
 */
export function setAvailableQuests(quests: QuestDef[]): void {
  gameState.update((state) => ({
    ...state,
    availableQuests: quests,
  }));
}

/**
 * 完了した依頼数を増加
 */
export function incrementCompletedQuests(): void {
  gameState.update((state) => ({
    ...state,
    completedQuestCount: state.completedQuestCount + 1,
  }));
}

/**
 * 失敗した依頼数を増加
 */
export function incrementFailedQuests(): void {
  gameState.update((state) => ({
    ...state,
    failedQuestCount: state.failedQuestCount + 1,
  }));
}
