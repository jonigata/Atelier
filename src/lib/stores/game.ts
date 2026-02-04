import { writable, derived, get } from 'svelte/store';
import type {
  GameState,
  OwnedItem,
  MorningEvent,
} from '$lib/models/types';
import { getMilestoneDialogue } from '$lib/data/tutorial';
import { removeItemFromInventory } from '$lib/services/inventory';

// =====================================
// 初期状態
// =====================================

function createInitialState(): GameState {
  return {
    playerName: '見習い錬金術士',
    day: 1,
    money: 500,
    reputation: 0,
    villageDevelopment: 0,
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

    pendingDayTransition: null,

    tutorialProgress: {
      isActive: true,
      currentMilestone: 0,
      unlockedActions: ['rest', 'study'],
      pendingDialogue: getMilestoneDialogue(0),
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

export const daysRemaining = derived(gameState, ($state) => 365 - $state.day);

export const isGameOver = derived(gameState, ($state) => $state.day > 365);

export const expForNextLevel = derived(gameState, ($state) => {
  return Math.floor(100 * Math.pow(1.5, $state.alchemyLevel - 1));
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

export function addVillageDevelopment(amount: number): void {
  gameState.update((state) => ({
    ...state,
    villageDevelopment: Math.max(0, Math.min(100, state.villageDevelopment + amount)),
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
  import('$lib/services/gameLoop').then(({ resetVillageMilestones }) => {
    resetVillageMilestones();
  });
  gameState.set(createInitialState());
}

// =====================================
// 再エクスポート（後方互換性のため）
// =====================================

export {
  setTutorialDialogue,
  advanceTutorialMilestone,
  completeTutorial,
  skipTutorial,
  isActionUnlocked,
} from './tutorial';

export {
  incrementCraftCount,
  incrementExpeditionCount,
  incrementConsecutiveQuestSuccess,
  resetConsecutiveQuestSuccess,
  addSalesAmount,
} from './stats';

export {
  completeAchievement,
  clearPendingReward,
  isAchievementCompleted,
} from './achievements';

export {
  addActiveQuest,
  removeActiveQuest,
  setAvailableQuests,
  incrementCompletedQuests,
  incrementFailedQuests,
} from './quests';
