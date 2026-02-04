import { get } from 'svelte/store';
import {
  gameState,
  completeAchievement,
  clearPendingReward,
  addMoney,
  addItem,
  addReputation,
  learnRecipe,
  isAchievementCompleted,
} from '$lib/stores/game';
import {
  getAllAchievements,
  getAchievementById,
  narrativeCharacters,
} from '$lib/data/achievements';
import type {
  AchievementDef,
  AchievementCondition,
  GameState,
  TutorialDialogue,
} from '$lib/models/types';

/**
 * アチーブメント条件を評価
 */
function evaluateCondition(condition: AchievementCondition, state: GameState): boolean {
  const comparison = condition.comparison ?? '>=';
  let currentValue: number;

  switch (condition.type) {
    case 'level':
      currentValue = state.alchemyLevel;
      break;
    case 'reputation':
      currentValue = state.reputation;
      break;
    case 'money':
      currentValue = state.money;
      break;
    case 'quest_count':
      currentValue = state.completedQuestCount;
      break;
    case 'craft_count':
      currentValue = state.stats.totalCraftCount;
      break;
    case 'craft_item':
      // 特定アイテムを調合したかどうか
      return state.craftedItems.includes(condition.target as string);
    case 'craft_quality':
      currentValue = state.stats.highestQualityCrafted;
      break;
    case 'expedition_count':
      currentValue = state.stats.totalExpeditionCount;
      break;
    case 'recipe_count':
      currentValue = state.knownRecipes.length;
      break;
    case 'consecutive_quests':
      currentValue = state.stats.consecutiveQuestSuccess;
      break;
    case 'total_sales':
      currentValue = state.stats.totalSalesAmount;
      break;
    default:
      return false;
  }

  const target = condition.target as number;

  switch (comparison) {
    case '>=':
      return currentValue >= target;
    case '>':
      return currentValue > target;
    case '==':
      return currentValue === target;
    case '<=':
      return currentValue <= target;
    case '<':
      return currentValue < target;
    default:
      return false;
  }
}

/**
 * アチーブメントの全条件を満たしているか確認
 */
function isAchievementEligible(achievement: AchievementDef, state: GameState): boolean {
  // 既に達成済みならスキップ
  if (state.achievementProgress.completed.includes(achievement.id)) {
    return false;
  }

  // 前提アチーブメントが未達成ならスキップ
  if (achievement.prerequisite) {
    for (const prereqId of achievement.prerequisite) {
      if (!state.achievementProgress.completed.includes(prereqId)) {
        return false;
      }
    }
  }

  // 全条件を満たすか確認
  return achievement.conditions.every((cond) => evaluateCondition(cond, state));
}

/**
 * 全アチーブメントをチェックし、達成したものを処理
 * @returns 達成したアチーブメントID（最初の1つのみ）
 */
export function checkAchievements(): string | null {
  const state = get(gameState);

  // 既にpendingRewardがある場合は新しいアチーブメントをチェックしない
  if (state.achievementProgress.pendingReward) {
    return null;
  }

  const achievements = getAllAchievements();

  for (const achievement of achievements) {
    if (isAchievementEligible(achievement, state)) {
      completeAchievement(achievement.id);
      return achievement.id;
    }
  }

  return null;
}

/**
 * 次に目指すべきアチーブメントを取得
 */
export function getCurrentGoal(): AchievementDef | null {
  const state = get(gameState);
  const achievements = getAllAchievements();

  for (const achievement of achievements) {
    // 既に達成済みならスキップ
    if (state.achievementProgress.completed.includes(achievement.id)) {
      continue;
    }

    // 前提が満たされていない場合はスキップ
    if (achievement.prerequisite) {
      const prereqsMet = achievement.prerequisite.every((prereqId) =>
        state.achievementProgress.completed.includes(prereqId)
      );
      if (!prereqsMet) continue;
    }

    // 最初に見つかった未達成のアチーブメントを返す
    return achievement;
  }

  return null;
}

/**
 * 報酬を付与
 */
export function claimReward(achievementId: string): void {
  const achievement = getAchievementById(achievementId);
  if (!achievement) return;

  const { reward } = achievement;

  if (reward.money) {
    addMoney(reward.money);
  }

  if (reward.items) {
    for (const item of reward.items) {
      for (let i = 0; i < item.quantity; i++) {
        addItem({ itemId: item.itemId, quality: item.quality });
      }
    }
  }

  if (reward.reputation) {
    addReputation(reward.reputation);
  }

  if (reward.recipes) {
    for (const recipeId of reward.recipes) {
      learnRecipe(recipeId);
    }
  }

  clearPendingReward();
}

/**
 * アチーブメント達成時のダイアログを生成
 */
export function getAchievementDialogue(achievementId: string): TutorialDialogue | null {
  const achievement = getAchievementById(achievementId);
  if (!achievement) return null;

  // キャラクター情報を取得
  const character =
    achievement.narrativeCharacter ?? narrativeCharacters[achievement.narrative];

  // システムメッセージ系（キャラクターなし）
  if (!character) {
    return {
      characterName: '',
      characterTitle: '',
      lines: [achievement.narrativeMessage],
    };
  }

  return {
    characterName: character.name,
    characterTitle: character.title,
    lines: [achievement.narrativeMessage],
  };
}

/**
 * 報酬の説明文を生成
 */
export function getRewardDescription(achievementId: string): string[] {
  const achievement = getAchievementById(achievementId);
  if (!achievement) return [];

  const { reward } = achievement;
  const descriptions: string[] = [];

  if (reward.money) {
    descriptions.push(`${reward.money}G`);
  }

  if (reward.items) {
    for (const item of reward.items) {
      // アイテム名は後でマスタから取得するが、今は簡易表示
      descriptions.push(`アイテム x${item.quantity}`);
    }
  }

  if (reward.reputation) {
    descriptions.push(`名声 +${reward.reputation}`);
  }

  if (reward.recipes) {
    descriptions.push(`レシピ x${reward.recipes.length}`);
  }

  return descriptions;
}

/**
 * アチーブメントの進捗を取得（0-100%）
 */
export function getAchievementProgress(achievementId: string): number {
  const achievement = getAchievementById(achievementId);
  if (!achievement) return 0;

  const state = get(gameState);

  if (state.achievementProgress.completed.includes(achievementId)) {
    return 100;
  }

  // 単一条件の場合、進捗を計算
  if (achievement.conditions.length === 1) {
    const cond = achievement.conditions[0];
    const target = cond.target as number;

    let current = 0;
    switch (cond.type) {
      case 'level':
        current = state.alchemyLevel;
        break;
      case 'reputation':
        current = state.reputation;
        break;
      case 'money':
        current = state.money;
        break;
      case 'quest_count':
        current = state.completedQuestCount;
        break;
      case 'craft_count':
        current = state.stats.totalCraftCount;
        break;
      case 'craft_quality':
        current = state.stats.highestQualityCrafted;
        break;
      case 'expedition_count':
        current = state.stats.totalExpeditionCount;
        break;
      case 'recipe_count':
        current = state.knownRecipes.length;
        break;
      case 'consecutive_quests':
        current = state.stats.consecutiveQuestSuccess;
        break;
      case 'total_sales':
        current = state.stats.totalSalesAmount;
        break;
      default:
        return 0;
    }

    return Math.min(100, Math.floor((current / target) * 100));
  }

  // 複数条件の場合は達成条件の割合
  const metCount = achievement.conditions.filter((cond) =>
    evaluateCondition(cond, state)
  ).length;
  return Math.floor((metCount / achievement.conditions.length) * 100);
}
