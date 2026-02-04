import { writable, derived, get } from 'svelte/store';
import type {
  GameState,
  OwnedItem,
  MorningEvent,
  ActiveQuest,
  QuestDef,
  TutorialDialogue,
  ActionType,
} from '$lib/models/types';
import { milestones, getUnlockedActionsUpTo, getMilestoneDialogue, TUTORIAL_ACTIONS, ALL_ACTIONS } from '$lib/data/tutorial';
import { removeItemFromInventory } from '$lib/services/inventory';

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
  const newInventory = removeItemFromInventory(state.inventory, itemId, quality);
  if (newInventory === state.inventory) return false;

  gameState.update((s) => ({
    ...s,
    inventory: newInventory,
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
  // 村発展マイルストーンもリセット
  import('$lib/services/gameLoop').then(({ resetVillageMilestones }) => {
    resetVillageMilestones();
  });
  gameState.set(createInitialState());
}

// チュートリアル関連アクション
export function setTutorialDialogue(dialogue: TutorialDialogue | null): void {
  gameState.update((state) => ({
    ...state,
    tutorialProgress: {
      ...state.tutorialProgress,
      pendingDialogue: dialogue,
    },
  }));
}

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

export function completeTutorial(): void {
  gameState.update((state) => ({
    ...state,
    tutorialProgress: {
      ...state.tutorialProgress,
      isActive: false,
      // チュートリアル終了時は TUTORIAL_ACTIONS + 既存のアンロック（村発展分）を維持
      unlockedActions: [...new Set([...TUTORIAL_ACTIONS, ...state.tutorialProgress.unlockedActions])],
      pendingDialogue: null,
    },
  }));
}

export function skipTutorial(): void {
  gameState.update((state) => ({
    ...state,
    tutorialProgress: {
      isActive: false,
      currentMilestone: -1,
      // 経験者モードでもexpeditionは村発展マイルストーンで解放
      unlockedActions: TUTORIAL_ACTIONS,
      pendingDialogue: null,
    },
  }));
}

export function isActionUnlocked(action: ActionType): boolean {
  const state = get(gameState);
  return state.tutorialProgress.unlockedActions.includes(action);
}

// =====================================
// 統計更新関数
// =====================================

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

export function incrementExpeditionCount(): void {
  gameState.update((state) => ({
    ...state,
    stats: {
      ...state.stats,
      totalExpeditionCount: state.stats.totalExpeditionCount + 1,
    },
  }));
}

export function incrementConsecutiveQuestSuccess(): void {
  gameState.update((state) => ({
    ...state,
    stats: {
      ...state.stats,
      consecutiveQuestSuccess: state.stats.consecutiveQuestSuccess + 1,
    },
  }));
}

export function resetConsecutiveQuestSuccess(): void {
  gameState.update((state) => ({
    ...state,
    stats: {
      ...state.stats,
      consecutiveQuestSuccess: 0,
    },
  }));
}

export function addSalesAmount(amount: number): void {
  gameState.update((state) => ({
    ...state,
    stats: {
      ...state.stats,
      totalSalesAmount: state.stats.totalSalesAmount + amount,
    },
  }));
}

// =====================================
// アチーブメント関連アクション
// =====================================

export function completeAchievement(achievementId: string): void {
  gameState.update((state) => {
    if (state.achievementProgress.completed.includes(achievementId)) {
      return state;
    }
    return {
      ...state,
      achievementProgress: {
        ...state.achievementProgress,
        completed: [...state.achievementProgress.completed, achievementId],
        pendingReward: achievementId,
      },
    };
  });
}

export function clearPendingReward(): void {
  gameState.update((state) => ({
    ...state,
    achievementProgress: {
      ...state.achievementProgress,
      pendingReward: null,
    },
  }));
}

export function isAchievementCompleted(achievementId: string): boolean {
  const state = get(gameState);
  return state.achievementProgress.completed.includes(achievementId);
}
