import { writable, derived, get } from 'svelte/store';
import type { GameState, OwnedItem, MorningEvent, ActiveQuest, QuestDef } from '$lib/models/types';

function createInitialState(): GameState {
  return {
    playerName: '見習い錬金術士',
    day: 1,
    money: 500,
    reputation: 0,
    alchemyLevel: 1,
    alchemyExp: 0,
    stamina: 100,
    maxStamina: 100,

    inventory: [
      { itemId: 'herb_01', quality: 45 },
      { itemId: 'herb_01', quality: 52 },
      { itemId: 'herb_01', quality: 38 },
      { itemId: 'herb_01', quality: 61 },
      { itemId: 'herb_01', quality: 44 },
      { itemId: 'water_01', quality: 30 },
      { itemId: 'water_01', quality: 55 },
      { itemId: 'water_01', quality: 42 },
    ],
    knownRecipes: [],

    activeQuests: [],
    availableQuests: [],
    completedQuestCount: 0,
    failedQuestCount: 0,

    expedition: null,

    craftedItems: [],

    phase: 'morning',
    morningEvents: [],
    messageLog: ['ゲームを開始しました。'],
  };
}

// メインのゲーム状態ストア
export const gameState = writable<GameState>(createInitialState());

// 派生ストア
export const daysRemaining = derived(gameState, ($state) => 365 - $state.day);

export const isGameOver = derived(gameState, ($state) => $state.day > 365);

export const expForNextLevel = derived(gameState, ($state) => {
  // レベルアップに必要な経験値（累積ではなく現在レベルから次へ）
  return Math.floor(100 * Math.pow(1.5, $state.alchemyLevel - 1));
});

// アクション: ゲーム状態の更新ヘルパー
export function addMessage(message: string): void {
  gameState.update((state) => ({
    ...state,
    messageLog: [...state.messageLog.slice(-49), message],
  }));
}

export function addMorningEvent(event: MorningEvent): void {
  gameState.update((state) => ({
    ...state,
    morningEvents: [...state.morningEvents, event],
  }));
}

export function clearMorningEvents(): void {
  gameState.update((state) => ({
    ...state,
    morningEvents: [],
  }));
}

export function setPhase(phase: GameState['phase']): void {
  gameState.update((state) => ({ ...state, phase }));
}

export function addItem(item: OwnedItem): void {
  gameState.update((state) => ({
    ...state,
    inventory: [...state.inventory, item],
  }));
}

export function removeItem(itemId: string, quality: number): boolean {
  const state = get(gameState);
  const index = state.inventory.findIndex(
    (i) => i.itemId === itemId && i.quality === quality
  );
  if (index === -1) return false;

  gameState.update((s) => ({
    ...s,
    inventory: [...s.inventory.slice(0, index), ...s.inventory.slice(index + 1)],
  }));
  return true;
}

export function addMoney(amount: number): void {
  gameState.update((state) => ({
    ...state,
    money: state.money + amount,
  }));
}

export function addReputation(amount: number): void {
  gameState.update((state) => ({
    ...state,
    reputation: Math.max(0, Math.min(100, state.reputation + amount)),
  }));
}

export function addExp(amount: number): void {
  gameState.update((state) => {
    let newExp = state.alchemyExp + amount;
    let newLevel = state.alchemyLevel;
    let expNeeded = Math.floor(100 * Math.pow(1.5, newLevel - 1));

    while (newExp >= expNeeded && newLevel < 20) {
      newExp -= expNeeded;
      newLevel++;
      expNeeded = Math.floor(100 * Math.pow(1.5, newLevel - 1));
    }

    return {
      ...state,
      alchemyExp: newExp,
      alchemyLevel: newLevel,
    };
  });
}

export function advanceDay(days: number): void {
  gameState.update((state) => ({
    ...state,
    day: state.day + days,
  }));
}

export function setExpedition(expedition: GameState['expedition']): void {
  gameState.update((state) => ({ ...state, expedition }));
}

export function addActiveQuest(quest: ActiveQuest): void {
  gameState.update((state) => ({
    ...state,
    activeQuests: [...state.activeQuests, quest],
  }));
}

export function removeActiveQuest(questId: string): void {
  gameState.update((state) => ({
    ...state,
    activeQuests: state.activeQuests.filter((q) => q.id !== questId),
  }));
}

export function setAvailableQuests(quests: QuestDef[]): void {
  gameState.update((state) => ({
    ...state,
    availableQuests: quests,
  }));
}

export function incrementCompletedQuests(): void {
  gameState.update((state) => ({
    ...state,
    completedQuestCount: state.completedQuestCount + 1,
  }));
}

export function incrementFailedQuests(): void {
  gameState.update((state) => ({
    ...state,
    failedQuestCount: state.failedQuestCount + 1,
  }));
}

export function restoreStamina(amount: number): void {
  gameState.update((state) => ({
    ...state,
    stamina: Math.min(state.maxStamina, state.stamina + amount),
  }));
}

export function consumeStamina(amount: number): boolean {
  const state = get(gameState);
  if (state.stamina < amount) return false;
  gameState.update((s) => ({
    ...s,
    stamina: s.stamina - amount,
  }));
  return true;
}

export function learnRecipe(recipeId: string): void {
  gameState.update((state) => {
    if (state.knownRecipes.includes(recipeId)) return state;
    return {
      ...state,
      knownRecipes: [...state.knownRecipes, recipeId],
    };
  });
}

export function markItemCrafted(itemId: string): void {
  gameState.update((state) => {
    if (state.craftedItems.includes(itemId)) return state;
    return {
      ...state,
      craftedItems: [...state.craftedItems, itemId],
    };
  });
}

export function resetGame(): void {
  gameState.set(createInitialState());
}
