import { writable, derived, get } from 'svelte/store';
import type {
  GameState,
  OwnedItem,
  MorningEvent,
} from '$lib/models/types';
import { removeItemFromInventory } from '$lib/services/inventory';
import { calcExpForLevel, calcLevelFromExp, calcExpProgress, ALCHEMY, LEVEL } from '$lib/data/balance';

// =====================================
// 初期状態
// =====================================

function createInitialState(): GameState {
  return {
    playerName: 'コレット',
    day: 1,
    money: 500,
    reputationExp: 0,
    villageExp: 0,
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

    // 村施設・助手
    buildings: [],
    ownedHelpers: [],

    completedInspections: [],
    gameOverReason: null,
    pendingInspectionCutscene: null,
    inspectionBackdrop: false,
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

// 3軸のレベル（派生ストア）
export const alchemyLevel = derived(gameState, ($state) => calcLevelFromExp($state.alchemyExp));
export const villageLevel = derived(gameState, ($state) => calcLevelFromExp($state.villageExp));
export const reputationLevel = derived(gameState, ($state) => calcLevelFromExp($state.reputationExp));

export const expForNextLevel = derived(gameState, ($state) => {
  return calcExpForLevel(calcLevelFromExp($state.alchemyExp));
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

export function addReputationExp(amount: number): void {
  gameState.update((state) => {
    const oldLevel = calcLevelFromExp(state.reputationExp);
    const newExp = Math.max(0, state.reputationExp + amount);
    const newLevel = calcLevelFromExp(newExp);
    if (newLevel > oldLevel && hasDrawLevel(oldLevel, newLevel)) {
      pendingReputationLevelUp.set({ oldLevel, newLevel });
    }
    return { ...state, reputationExp: newExp };
  });
}

export function markInventoryOpened(): void {
  gameState.update((state) => ({
    ...state,
    stats: { ...state.stats, inventoryOpened: true },
  }));
}

export function addVillageExp(amount: number): void {
  gameState.update((state) => {
    const oldLevel = calcLevelFromExp(state.villageExp);
    const newExp = Math.max(0, state.villageExp + amount);
    const newLevel = calcLevelFromExp(newExp);
    if (newLevel > oldLevel && hasDrawLevel(oldLevel, newLevel)) {
      pendingVillageLevelUp.set({ oldLevel, newLevel });
    }
    return { ...state, villageExp: newExp };
  });
}

export interface LevelUpInfo {
  oldLevel: number;
  newLevel: number;
}

/** oldLevel～newLevelの間に3の倍数レベルがあるか（ドロー発火判定） */
function hasDrawLevel(oldLevel: number, newLevel: number): boolean {
  const nextDraw = Math.ceil((oldLevel + 1) / 3) * 3;
  return nextDraw <= newLevel;
}

export const pendingLevelUp = writable<LevelUpInfo | null>(null);
export const pendingVillageLevelUp = writable<LevelUpInfo | null>(null);
export const pendingReputationLevelUp = writable<LevelUpInfo | null>(null);
export const suppressDrawDialog = writable(false);

export function addBuilding(facilityId: string): void {
  gameState.update((state) => ({
    ...state,
    buildings: [...state.buildings, facilityId],
  }));
}

export function addHelper(helperId: string): void {
  gameState.update((state) => ({
    ...state,
    ownedHelpers: [...state.ownedHelpers, { helperId, level: 1 }],
  }));
}

export function upgradeHelper(helperId: string): void {
  gameState.update((state) => ({
    ...state,
    ownedHelpers: state.ownedHelpers.map((h) =>
      h.helperId === helperId ? { ...h, level: Math.min(h.level + 1, 3) } : h
    ),
  }));
}

export function addExp(amount: number): void {
  gameState.update((state) => {
    const oldLevel = calcLevelFromExp(state.alchemyExp);
    const newExp = state.alchemyExp + amount;
    const newLevel = calcLevelFromExp(newExp);

    if (newLevel > oldLevel) {
      pendingLevelUp.set({ oldLevel, newLevel });
    }

    return {
      ...state,
      alchemyExp: newExp,
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

// =====================================
// 演出スキップ（セーブデータに含めない）
// =====================================

export const skipPresentation = writable(false);

// 依頼から調合パネルへのジャンプ用
export const pendingAlchemyRecipeId = writable<string | null>(null);

export function toggleSkipPresentation(): void {
  skipPresentation.update((v) => !v);
}

