import { writable, derived, get } from 'svelte/store';
import type {
  GameState,
  OwnedItem,
  MorningEvent,
  DailyScoreEntry,
} from '$lib/models/types';
import { removeItemFromInventory } from '$lib/services/inventory';
import { calcExpForLevel, calcLevelFromExp, calcExpProgress, ALCHEMY, LEVEL } from '$lib/data/balance';
import { getHelper } from '$lib/data/helpers';
import { getBuilding } from '$lib/data/buildings';
import { calcScore } from '$lib/services/score';

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
    maxQualityByItem: {},

    // 機材システム
    ownedEquipment: [],
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

    scoreHistory: [],
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

// スコア（派生ストア）
export const scoreBreakdown = derived(gameState, ($state) => calcScore($state));
export const totalScore = derived(scoreBreakdown, ($b) => $b.total);

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
  gameState.update((state) => {
    const prevMax = (state.maxQualityByItem ?? {})[item.itemId] ?? 0;
    return {
      ...state,
      inventory: [...state.inventory, item],
      discoveredItems: state.discoveredItems.includes(item.itemId)
        ? state.discoveredItems
        : [...state.discoveredItems, item.itemId],
      maxQualityByItem: {
        ...(state.maxQualityByItem ?? {}),
        [item.itemId]: Math.max(prevMax, item.quality),
      },
    };
  });
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

export function addReputationExp(amount: number): LevelUpInfo | null {
  let drawInfo: LevelUpInfo | null = null;
  gameState.update((state) => {
    const oldLevel = calcLevelFromExp(state.reputationExp);
    const newExp = Math.max(0, state.reputationExp + amount);
    const newLevel = calcLevelFromExp(newExp);
    if (newLevel > oldLevel && hasDrawLevel(oldLevel, newLevel)) {
      drawInfo = { oldLevel, newLevel };
    }
    return { ...state, reputationExp: newExp };
  });
  return drawInfo;
}

export function markInventoryOpened(): void {
  gameState.update((state) => ({
    ...state,
    stats: { ...state.stats, inventoryOpened: true },
  }));
}

export function addVillageExp(amount: number): LevelUpInfo | null {
  let drawInfo: LevelUpInfo | null = null;
  gameState.update((state) => {
    const oldLevel = calcLevelFromExp(state.villageExp);
    const newExp = Math.max(0, state.villageExp + amount);
    const newLevel = calcLevelFromExp(newExp);
    if (newLevel > oldLevel && hasDrawLevel(oldLevel, newLevel)) {
      drawInfo = { oldLevel, newLevel };
    }
    return { ...state, villageExp: newExp };
  });
  return drawInfo;
}

export interface LevelUpInfo {
  oldLevel: number;
  newLevel: number;
}

/** レベルアップでドローが発火するか（毎レベル発火） */
function hasDrawLevel(_oldLevel: number, _newLevel: number): boolean {
  return true;
}


export function addBuilding(facilityId: string): void {
  gameState.update((state) => ({
    ...state,
    buildings: [...state.buildings, { buildingId: facilityId, level: 1 }],
  }));
}

export function upgradeBuilding(buildingId: string): void {
  const def = getBuilding(buildingId);
  const maxLevel = def?.maxLevel ?? 3;
  gameState.update((state) => ({
    ...state,
    buildings: state.buildings.map((b) =>
      b.buildingId === buildingId ? { ...b, level: Math.min(b.level + 1, maxLevel) } : b
    ),
  }));
}

export function addHelper(helperId: string): void {
  gameState.update((state) => ({
    ...state,
    ownedHelpers: [...state.ownedHelpers, { helperId, level: 1 }],
  }));
}

export function upgradeHelper(helperId: string): void {
  const def = getHelper(helperId);
  const maxLevel = def?.maxLevel ?? 7;
  gameState.update((state) => ({
    ...state,
    ownedHelpers: state.ownedHelpers.map((h) =>
      h.helperId === helperId ? { ...h, level: Math.min(h.level + 1, maxLevel) } : h
    ),
  }));
}

export function addExp(amount: number): LevelUpInfo | null {
  let levelUp: LevelUpInfo | null = null;
  gameState.update((state) => {
    const oldLevel = calcLevelFromExp(state.alchemyExp);
    const newExp = state.alchemyExp + amount;
    const newLevel = calcLevelFromExp(newExp);

    if (newLevel > oldLevel) {
      levelUp = { oldLevel, newLevel };
    }

    return {
      ...state,
      alchemyExp: newExp,
    };
  });
  return levelUp;
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

// =====================================
// スコア履歴
// =====================================

export function recordDailyScore(): void {
  gameState.update((state) => {
    const score = calcScore(state);
    const entry: DailyScoreEntry = {
      day: state.day,
      total: score.total,
      inspection: {
        album: state.discoveredItems.length,
        quests: state.completedQuestCount,
        level: calcLevelFromExp(state.alchemyExp),
        villageDev: calcLevelFromExp(state.villageExp),
        reputation: calcLevelFromExp(state.reputationExp),
      },
    };

    // 同日の重複記録を防止
    if (state.scoreHistory.length > 0 &&
        state.scoreHistory[state.scoreHistory.length - 1].day === state.day) {
      return state;
    }

    return {
      ...state,
      scoreHistory: [...state.scoreHistory, entry],
    };
  });
}

