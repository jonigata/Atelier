import { get } from 'svelte/store';
import {
  gameState,
  addMoney,
  addItem,
  addReputationExp,
  addExp,
  addVillageExp,
  learnRecipe,
} from '$lib/stores/game';
import type { LevelUpInfo } from '$lib/stores/game';
import { calcLevelFromExp } from '$lib/data/balance';
import { completeAchievement, clearPendingReward, isAchievementCompleted } from '$lib/stores/achievements';
import { unlockAction } from '$lib/stores/tutorial';
import {
  getAllAchievements,
  getAchievementById,
  narrativeCharacters,
  characterFaceIds,
} from '$lib/data/achievements';
import { items } from '$lib/data/items';
import { recipes } from '$lib/data/recipes';
import { getArea } from '$lib/data/areas';
import { getEquipmentByRarity, getEquipment, getEquipmentIcon } from '$lib/data/equipment';
import { showGoalActiveToast, actionLabels } from '$lib/stores/toast';
import type {
  AchievementDef,
  AchievementCondition,
  GameState,
  EventDialogue,
  RewardDisplay,
  EquipmentDef,
} from '$lib/models/types';

/**
 * ランダムコモン機材を事前選択（適用はしない）
 */
export function preSelectRandomEquipment(count: number): EquipmentDef[] {
  const currentState = get(gameState);
  const commonEquipment = getEquipmentByRarity('common');
  const unowned = commonEquipment.filter((e) => !currentState.ownedEquipment.includes(e.id));
  const picked: EquipmentDef[] = [];
  for (let i = 0; i < count && unowned.length > 0; i++) {
    const idx = Math.floor(Math.random() * unowned.length);
    picked.push(unowned.splice(idx, 1)[0]);
  }
  return picked;
}

/**
 * ストーリー/チュートリアル系アチーブメントかどうかを判定
 * これらは「達成」バッジや「目標達成」トーストを表示しない
 */
export function isStoryAchievement(achievement: AchievementDef): boolean {
  return achievement.id.startsWith('ach_story_') || achievement.category === 'tutorial';
}

// 前回の発動済み目標IDを追跡
let previousActiveGoalIds: Set<string> = new Set();

/**
 * アチーブメント条件を評価
 */
function evaluateCondition(condition: AchievementCondition, state: GameState): boolean {
  const comparison = condition.comparison ?? '>=';
  let currentValue: number;

  switch (condition.type) {
    case 'level':
      currentValue = calcLevelFromExp(state.alchemyExp);
      break;
    case 'reputation':
      currentValue = calcLevelFromExp(state.reputationExp);
      break;
    case 'money':
      currentValue = state.money;
      break;
    case 'quest_count':
      currentValue = state.completedQuestCount;
      break;
    case 'active_quest_count':
      currentValue = state.activeQuests.length;
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
    case 'day':
      currentValue = state.day;
      break;
    case 'village_development':
      currentValue = calcLevelFromExp(state.villageExp);
      break;
    case 'inventory_opened':
      return state.stats.inventoryOpened;
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
 * @param morningOnly trueなら triggerOnMorning のみ、falseなら triggerOnMorning を除外
 * @returns 達成したアチーブメントID（最初の1つのみ）
 *
 * 注意: トースト表示はこの関数では行わない
 * presentation.ts が async/await で順序制御を行う
 */
export function checkAchievements(morningOnly: boolean = false): string | null {
  const state = get(gameState);

  // 既にpendingRewardがある場合は新しいアチーブメントをチェックしない
  if (state.achievementProgress.pendingReward) {
    return null;
  }

  const achievements = getAllAchievements();

  for (const achievement of achievements) {
    // morningOnly=false: triggerOnMorning を除外（通常のアクション時）
    // morningOnly=true: triggerOnMorning のみ（朝フェーズ時）
    if (morningOnly !== !!achievement.triggerOnMorning) continue;

    if (isAchievementEligible(achievement, state)) {
      completeAchievement(achievement.id);
      // トースト表示は presentation.ts で行う
      return achievement.id;
    }
  }

  return null;
}

/**
 * 新しく発動した目標をチェックしてトーストを表示
 */
export function checkNewActiveGoals(): void {
  const currentGoals = getActiveGoals();
  const currentIds = new Set(currentGoals.map((g) => g.id));

  // 新しく発動した目標を検出
  for (const goal of currentGoals) {
    if (!previousActiveGoalIds.has(goal.id)) {
      showGoalActiveToast(goal.title);
    }
  }

  previousActiveGoalIds = currentIds;
}

/**
 * 発動済み目標の追跡を初期化（トーストは出さない、ダイアログ終了後に出す）
 */
export function initializeActiveGoalTracking(): void {
  // 空で初期化して、最初の目標も「新しい目標」として検出されるようにする
  previousActiveGoalIds = new Set();
}

/**
 * 通知済みの発動中目標を取得（トースト表示済みのもののみ）
 */
export function getNotifiedActiveGoals(): AchievementDef[] {
  const goals = getActiveGoals();
  return goals.filter((goal) => previousActiveGoalIds.has(goal.id));
}

/**
 * 次に目指すべきアチーブメントを取得（後方互換のため残す）
 */
export function getCurrentGoal(): AchievementDef | null {
  const goals = getActiveGoals();
  return goals.length > 0 ? goals[0] : null;
}

/**
 * アチーブメントが「発動済み」かどうか判定
 * 発動済み = 未達成かつ前提条件を満たしている
 * ただし、前提の報酬がまだ受け取られていない場合は発動しない
 */
function isAchievementActive(achievement: AchievementDef, state: GameState): boolean {
  // 既に達成済みならfalse
  if (state.achievementProgress.completed.includes(achievement.id)) {
    return false;
  }

  // 前提が満たされていない場合はfalse
  if (achievement.prerequisite) {
    for (const prereqId of achievement.prerequisite) {
      if (!state.achievementProgress.completed.includes(prereqId)) {
        return false;
      }
      // 前提の報酬がまだ受け取られていない（ダイアログ表示中）なら非表示
      if (state.achievementProgress.pendingReward === prereqId) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 重要かつ発動済みのアチーブメントを全て取得
 */
export function getActiveGoals(): AchievementDef[] {
  const state = get(gameState);
  const achievements = getAllAchievements();

  return achievements.filter((achievement) =>
    achievement.important && isAchievementActive(achievement, state)
  );
}

/**
 * 報酬を付与
 */
export interface ClaimRewardDrawInfos {
  reputationDrawInfo: LevelUpInfo | null;
  villageDrawInfo: LevelUpInfo | null;
}

export function claimReward(achievementId: string, pickedEquipment?: EquipmentDef[]): ClaimRewardDrawInfos {
  const achievement = getAchievementById(achievementId);
  if (!achievement) return { reputationDrawInfo: null, villageDrawInfo: null };

  const { reward } = achievement;
  let reputationDrawInfo: LevelUpInfo | null = null;
  let villageDrawInfo: LevelUpInfo | null = null;

  if (reward.money) {
    addMoney(reward.money);
  }

  if (reward.items) {
    const state = get(gameState);
    for (const item of reward.items) {
      for (let i = 0; i < item.quantity; i++) {
        addItem({
          itemId: item.itemId,
          quality: item.quality,
          origin: { type: 'reward', day: state.day, flavorText: reward.originLabel ?? achievement.title },
        });
      }
    }
  }

  if (reward.reputationExp) {
    reputationDrawInfo = addReputationExp(reward.reputationExp);
  }

  if (reward.exp) {
    addExp(reward.exp);
  }

  if (reward.villageExp) {
    villageDrawInfo = addVillageExp(reward.villageExp);
  }

  if (reward.recipes) {
    for (const recipeId of reward.recipes) {
      learnRecipe(recipeId);
    }
  }


  // ランダムコモン機材
  if (reward.randomCommonEquipment) {
    const equipmentToAdd = pickedEquipment ?? preSelectRandomEquipment(reward.randomCommonEquipment);
    for (const picked of equipmentToAdd) {
      gameState.update((s) => ({
        ...s,
        ownedEquipment: [...s.ownedEquipment, picked.id],
      }));
    }
  }

  // エリアアンロック
  if (reward.unlockAreas) {
    gameState.update((s) => ({
      ...s,
      unlockedAreas: [...new Set([...s.unlockedAreas, ...reward.unlockAreas!])],
    }));
  }

  // アクションアンロック（機材取得の後）
  if (reward.unlocks) {
    for (const action of reward.unlocks) {
      unlockAction(action);
    }
  }

  clearPendingReward();

  return { reputationDrawInfo, villageDrawInfo };
}

/**
 * アチーブメント達成時のダイアログを生成
 */
export function getAchievementDialogue(achievementId: string, pickedEquipment?: EquipmentDef[]): EventDialogue | null {
  const achievement = getAchievementById(achievementId);
  if (!achievement) return null;

  // キャラクター情報を取得
  const character =
    achievement.narrativeCharacter ?? narrativeCharacters[achievement.narrative];

  // 報酬詳細を生成
  const rewards = getDetailedRewards(achievement, pickedEquipment);
  const structuredRewards = getStructuredRewards(achievement, pickedEquipment);

  // ストーリー/チュートリアル系は「達成」バッジを表示しない
  const isStory = isStoryAchievement(achievement);

  // イベントCG画像パス
  const eventImage = achievement.eventImage
    ? `/images/events/${achievement.eventImage}.png`
    : undefined;

  // 顔画像IDを取得
  const characterFaceId = character ? characterFaceIds[character.name] : undefined;

  // システムメッセージ系（キャラクターなし）
  if (!character) {
    return {
      characterName: '',
      characterTitle: '',
      lines: achievement.narrativeLines,
      achievementTitle: isStory ? undefined : achievement.title,
      achievementDescription: isStory ? undefined : achievement.description,
      achievementCategory: isStory ? undefined : achievement.category,
      rewards,
      structuredRewards,
      rewardsTitle: isStory ? '報酬' : undefined,
      eventImage,
    };
  }

  return {
    characterName: character.name,
    characterTitle: character.title,
    characterFaceId,
    lines: achievement.narrativeLines,
    achievementTitle: isStory ? undefined : achievement.title,
    achievementDescription: isStory ? undefined : achievement.description,
    achievementCategory: isStory ? undefined : achievement.category,
    rewards,
    structuredRewards,
    rewardsTitle: isStory ? '報酬' : undefined,
    eventImage,
  };
}

/**
 * 報酬の詳細リストを生成
 */
function getDetailedRewards(achievement: AchievementDef, pickedEquipment?: EquipmentDef[]): string[] {
  const { reward } = achievement;
  const details: string[] = [];

  if (reward.money) {
    details.push(`${reward.money.toLocaleString()} G`);
  }

  if (reward.items) {
    for (const item of reward.items) {
      const itemDef = items[item.itemId];
      const itemName = itemDef ? itemDef.name : item.itemId;
      const qualityStr = item.quality ? `（品質${item.quality}）` : '';
      const quantityStr = item.quantity > 1 ? ` x${item.quantity}` : '';
      details.push(`${itemName}${qualityStr}${quantityStr}`);
    }
  }

  if (reward.reputationExp) {
    details.push(`名声Exp +${reward.reputationExp}`);
  }

  if (reward.exp) {
    details.push(`経験値 +${reward.exp}`);
  }

  if (reward.villageExp) {
    details.push(`村発展Exp +${reward.villageExp}`);
  }

  if (reward.recipes) {
    for (const recipeId of reward.recipes) {
      const recipeDef = recipes[recipeId];
      const recipeName = recipeDef ? recipeDef.name : recipeId;
      details.push(`レシピ「${recipeName}」`);
    }
  }

  if (pickedEquipment && pickedEquipment.length > 0) {
    for (const eq of pickedEquipment) {
      details.push(`機材「${eq.name}」`);
    }
  } else if (reward.randomCommonEquipment) {
    const count = reward.randomCommonEquipment;
    details.push(`コモン機材 x${count}（ランダム）`);
  }

  if (reward.unlockAreas) {
    for (const areaId of reward.unlockAreas) {
      const area = getArea(areaId);
      details.push(`採取地「${area?.name ?? areaId}」解放`);
    }
  }

  if (reward.unlocks) {
    for (const action of reward.unlocks) {
      const label = actionLabels[action] ?? action;
      details.push(`「${label}」解放`);
    }
  }

  return details;
}

/**
 * 構造化された報酬リストを生成（アイコン表示用）
 */
function getStructuredRewards(achievement: AchievementDef, pickedEquipment?: EquipmentDef[]): RewardDisplay[] {
  const { reward } = achievement;
  const state = get(gameState);
  const structured: RewardDisplay[] = [];

  if (reward.money) {
    structured.push({
      text: `${reward.money.toLocaleString()} G`,
      type: 'money',
    });
  }

  if (reward.items) {
    for (const item of reward.items) {
      const itemDef = items[item.itemId];
      const itemName = itemDef ? itemDef.name : item.itemId;
      const qualityStr = item.quality ? `（品質${item.quality}）` : '';
      const quantityStr = item.quantity > 1 ? ` x${item.quantity}` : '';
      structured.push({
        text: `${itemName}${qualityStr}${quantityStr}`,
        itemId: item.itemId,
        type: 'item',
      });
    }
  }

  if (reward.exp) {
    structured.push({
      text: `+${reward.exp} Exp`,
      type: 'exp',
      expType: 'alchemy',
      totalBefore: state.alchemyExp,
      totalAfter: state.alchemyExp + reward.exp,
    });
  }

  if (reward.reputationExp) {
    structured.push({
      text: `+${reward.reputationExp} Exp`,
      type: 'reputation',
      expType: 'reputation',
      totalBefore: state.reputationExp,
      totalAfter: state.reputationExp + reward.reputationExp,
    });
  }

  if (reward.villageExp) {
    structured.push({
      text: `+${reward.villageExp} Exp`,
      type: 'villageDevelopment',
      expType: 'village',
      totalBefore: state.villageExp,
      totalAfter: state.villageExp + reward.villageExp,
    });
  }

  if (reward.recipes) {
    for (const recipeId of reward.recipes) {
      const recipeDef = recipes[recipeId];
      const recipeName = recipeDef ? recipeDef.name : recipeId;
      structured.push({
        text: `レシピ「${recipeName}」`,
        itemId: recipeDef?.resultItemId,
        type: 'recipe',
      });
    }
  }

  if (pickedEquipment && pickedEquipment.length > 0) {
    for (const eq of pickedEquipment) {
      structured.push({
        text: `機材「${eq.name}」`,
        subtitle: eq.effectDescription,
        iconUrl: getEquipmentIcon(eq.id),
        type: 'unlock',
      });
    }
  } else if (reward.randomCommonEquipment) {
    const count = reward.randomCommonEquipment;
    structured.push({
      text: `コモン機材 x${count}（ランダム）`,
      type: 'unlock',
    });
  }

  if (reward.unlockAreas) {
    for (const areaId of reward.unlockAreas) {
      const area = getArea(areaId);
      structured.push({
        text: `採取地「${area?.name ?? areaId}」解放`,
        type: 'unlock',
      });
    }
  }

  if (reward.unlocks) {
    for (const action of reward.unlocks) {
      const label = actionLabels[action] ?? action;
      structured.push({
        text: `「${label}」解放`,
        type: 'unlock',
        iconUrl: `/images/actions/${action}.png`,
      });
    }
  }

  return structured;
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

  if (reward.reputationExp) {
    descriptions.push(`名声Exp +${reward.reputationExp}`);
  }

  if (reward.exp) {
    descriptions.push(`経験値 +${reward.exp}`);
  }

  if (reward.villageExp) {
    descriptions.push(`村発展Exp +${reward.villageExp}`);
  }

  if (reward.recipes) {
    descriptions.push(`レシピ x${reward.recipes.length}`);
  }

  if (reward.randomCommonEquipment) {
    descriptions.push(`コモン機材 x${reward.randomCommonEquipment}`);
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
        current = calcLevelFromExp(state.alchemyExp);
        break;
      case 'reputation':
        current = calcLevelFromExp(state.reputationExp);
        break;
      case 'money':
        current = state.money;
        break;
      case 'quest_count':
        current = state.completedQuestCount;
        break;
      case 'active_quest_count':
        current = state.activeQuests.length;
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
      case 'day':
        current = state.day;
        break;
      case 'village_development':
        current = calcLevelFromExp(state.villageExp);
        break;
      case 'inventory_opened':
        return state.stats.inventoryOpened ? 100 : 0;
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
