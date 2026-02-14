import { writable, derived, get } from 'svelte/store';
import type {
  GameState,
  OwnedItem,
  MorningEvent,
} from '$lib/models/types';
import { removeItemFromInventory } from '$lib/services/inventory';
import { calcExpForLevel, ALCHEMY } from '$lib/data/balance';

// =====================================
// 初期状態
// =====================================

function createInitialState(): GameState {
  return {
    playerName: 'コレット',
    day: 1,
    money: 500,
    reputation: 0,
    villageDevelopment: 0,
    alchemyLevel: 1,
    alchemyExp: 0,
    stamina: 0,
    maxStamina: 100,

    inventory: [],
    ownedBooks: ['book_basics'],   // 錬金術入門を所持
    knownRecipes: [],              // まだ勉強していない

    activeQuests: [],
    availableQuests: [],
    completedQuestCount: 0,
    failedQuestCount: 0,
    newQuestCount: 0,
    selectedQuestId: null,

    expedition: null,

    craftedItems: [],
    discoveredItems: ['herb_01', 'water_01'],
    facilities: [],

    // 機材システム
    ownedEquipment: [],
    activeCauldron: null,
    shopEquipment: [],

    // 旅商人マルコ
    merchantLineup: null,
    merchantVisitedMonths: [],

    phase: 'morning',
    morningEvents: [],
    messageLog: ['ゲームを開始しました。'],

    pendingDayTransition: null,

    tutorialProgress: {
      unlockedActions: [],  // 空で開始（ゲーム開始アチーブメントでアンロック）
      pendingDialogue: null,
    },

    achievementProgress: {
      completed: [],
      pendingReward: null,
    },

    stats: {
      totalCraftCount: 0,
      totalExpeditionCount: 0,
      consecutiveQuestSuccess: 0,
      highestQualityCrafted: 0,
      totalSalesAmount: 0,
      inventoryOpened: false,
    },
  };
}

// =====================================
// メインストア
// =====================================

export const gameState = writable<GameState>(createInitialState());

// =====================================
// 派生ストア
// =====================================

export const daysRemaining = derived(gameState, ($state) => 336 - $state.day);

export const isGameOver = derived(gameState, ($state) => $state.day > 336);

export const expForNextLevel = derived(gameState, ($state) => {
  return calcExpForLevel($state.alchemyLevel);
});

// =====================================
// メッセージ・フェーズ
// =====================================

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

// =====================================
// インベントリ
// =====================================

export function addItem(item: OwnedItem): void {
  gameState.update((state) => ({
    ...state,
    inventory: [...state.inventory, item],
    discoveredItems: state.discoveredItems.includes(item.itemId)
      ? state.discoveredItems
      : [...state.discoveredItems, item.itemId],
  }));
}

export function removeItem(itemId: string, quality: number): boolean {
  const state = get(gameState);
  const newInventory = removeItemFromInventory(state.inventory, itemId, quality);
  if (newInventory === state.inventory) return false;

  gameState.update((s) => ({
    ...s,
    inventory: newInventory,
  }));
  return true;
}

// =====================================
// プレイヤー状態
// =====================================

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

export function markInventoryOpened(): void {
  gameState.update((state) => ({
    ...state,
    stats: { ...state.stats, inventoryOpened: true },
  }));
}

export function addVillageDevelopment(amount: number): void {
  gameState.update((state) => ({
    ...state,
    villageDevelopment: Math.max(0, Math.min(100, state.villageDevelopment + amount)),
  }));
}

export interface LevelUpInfo {
  oldLevel: number;
  newLevel: number;
}

export const pendingLevelUp = writable<LevelUpInfo | null>(null);

export function addExp(amount: number): void {
  gameState.update((state) => {
    let newExp = state.alchemyExp + amount;
    let newLevel = state.alchemyLevel;
    const oldLevel = state.alchemyLevel;
    let expNeeded = calcExpForLevel(newLevel);

    while (newExp >= expNeeded && newLevel < ALCHEMY.MAX_LEVEL) {
      newExp -= expNeeded;
      newLevel++;
      expNeeded = calcExpForLevel(newLevel);
    }

    if (newLevel > oldLevel) {
      pendingLevelUp.set({ oldLevel, newLevel });
    }

    return {
      ...state,
      alchemyExp: newExp,
      alchemyLevel: newLevel,
    };
  });
}

// =====================================
// 日付・時間
// =====================================

export function advanceDay(days: number): void {
  gameState.update((state) => ({
    ...state,
    day: state.day + days,
    pendingDayTransition: { toDay: state.day + days, daysAdvanced: days },
  }));
}

export function setDayTransition(transition: GameState['pendingDayTransition']): void {
  gameState.update((state) => ({
    ...state,
    pendingDayTransition: transition,
  }));
}

export function clearDayTransition(): void {
  gameState.update((state) => ({
    ...state,
    pendingDayTransition: null,
  }));
}

// =====================================
// 採取隊
// =====================================

export function setExpedition(expedition: GameState['expedition']): void {
  gameState.update((state) => ({ ...state, expedition }));
}

// =====================================
// スタミナ
// =====================================

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

// =====================================
// レシピ・調合
// =====================================

export function learnRecipe(recipeId: string): void {
  gameState.update((state) => {
    if (state.knownRecipes.includes(recipeId)) return state;
    return {
      ...state,
      knownRecipes: [...state.knownRecipes, recipeId],
    };
  });
}

export function learnRecipesFromBook(recipeIds: string[]): string[] {
  const learned: string[] = [];
  gameState.update((state) => {
    const newRecipes = recipeIds.filter(id => !state.knownRecipes.includes(id));
    learned.push(...newRecipes);
    if (newRecipes.length === 0) return state;
    return {
      ...state,
      knownRecipes: [...state.knownRecipes, ...newRecipes],
    };
  });
  return learned;
}

export function addBook(bookId: string): void {
  gameState.update((state) => {
    if (state.ownedBooks.includes(bookId)) return state;
    return {
      ...state,
      ownedBooks: [...state.ownedBooks, bookId],
    };
  });
}

export function markItemDiscovered(itemId: string): void {
  gameState.update((state) => {
    if (state.discoveredItems.includes(itemId)) return state;
    return {
      ...state,
      discoveredItems: [...state.discoveredItems, itemId],
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

// =====================================
// 設備
// =====================================

export function unlockFacility(facilityId: string): void {
  gameState.update((state) => {
    if (state.facilities.includes(facilityId)) return state;
    return {
      ...state,
      facilities: [...state.facilities, facilityId],
    };
  });
}

// =====================================
// ゲームリセット
// =====================================

export function resetGame(): void {
  gameState.set(createInitialState());
}

