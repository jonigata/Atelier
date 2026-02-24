import { get } from 'svelte/store';
import {
  gameState,
  addMessage,
  addItem,
  addExp,
  addReputationExp,
  markItemCrafted,
} from '$lib/stores/game';
import { incrementCraftCount } from '$lib/stores/stats';
import { getRecipe } from '$lib/data/recipes';
import { getItem } from '$lib/data/items';
import { removeItemsFromInventory } from '$lib/services/inventory';
import { ALCHEMY, CRAFT_SUCCESS, QUALITY, STAMINA, calcLevelFromExp } from '$lib/data/balance';
import { getFacilityBonuses, hasRequiredFacilities } from '$lib/services/facility';
import { craftedFlavors, pickRandom } from '$lib/data/flavorTexts';
import {
  getCraftSuccessBonus,
  getFailAccumulationBonus,
  getCraftQualityBonus,
  getQualityCap,
  getQualityVarianceMult,
  getComboQualityBonus,
  getStaminaCostMult,
  getEffectiveMaterialQuality,
  getAllProbabilityBonus,
  checkLowQualityFail,
  tryDuplicate,
  shouldSaveMaterials,
  getFailRecoverCount,
  recordFailure,
  recordSuccess,
  resetCombo,
  getEffectiveIngredientCount,
} from '$lib/services/equipmentEffects';
import { getBuildingCraftSuccessBonus, getBuildingCraftQualityBonus } from '$lib/services/buildingEffects';
import { getHelperCraftSuccessBonus, getHelperCraftQualityBonus } from '$lib/services/helperEffects';
import type { OwnedItem, RecipeDef, Ingredient } from '$lib/models/types';

export interface CraftMultipleResult {
  successCount: number;
  failCount: number;
  items: OwnedItem[];
  duplicatedCount: number;
  totalExpGained: number;
  totalReputationExpGained: number;
  message: string;
}

/**
 * 調合成功時の経験値を計算（高品質ボーナス＋初回アルバム登録ボーナス）
 */
function calculateCraftExpGained(
  recipe: RecipeDef,
  quality: number,
  quantity: number,
  isNewDiscovery: boolean,
): { alchemyExp: number; reputationExp: number } {
  let exp = recipe.expReward * quantity;
  if (quality >= ALCHEMY.HIGH_QUALITY_THRESHOLD) {
    exp = Math.floor(exp * ALCHEMY.HIGH_QUALITY_EXP_BONUS);
  }
  let reputationExp = 0;
  if (isNewDiscovery) {
    const bonus = Math.floor(recipe.expReward * ALCHEMY.ALBUM_FIRST_CRAFT_EXP_BONUS);
    exp += bonus;
    reputationExp = bonus;
  }
  return { alchemyExp: exp, reputationExp };
}

/**
 * バッチ調合のメッセージを生成
 */
function generateBatchMessage(
  itemName: string,
  successCount: number,
  failCount: number,
  items: OwnedItem[],
  totalExpGained: number,
  totalReputationExpGained: number,
  duplicatedCount: number
): string {
  if (successCount === 0 && failCount === 0) {
    return '素材が足りませんでした';
  }
  const dupMsg = duplicatedCount > 0 ? `（＋複製${duplicatedCount}個）` : '';
  const repMsg = totalReputationExpGained > 0 ? ` / 名声Exp +${totalReputationExpGained}` : '';
  if (failCount === 0) {
    const avgQuality = Math.round(items.reduce((sum, item) => sum + item.quality, 0) / items.length);
    return `${itemName}を${successCount}個${dupMsg}作成しました！（平均品質: ${avgQuality}） +${totalExpGained} Exp${repMsg}`;
  }
  if (successCount === 0) {
    return `${failCount}回すべて失敗しました... +${totalExpGained} Exp`;
  }
  const avgQuality = Math.round(items.reduce((sum, item) => sum + item.quality, 0) / items.length);
  return `${itemName}を${successCount}個${dupMsg}作成、${failCount}個失敗（平均品質: ${avgQuality}） +${totalExpGained} Exp${repMsg}`;
}

/**
 * 素材がレシピの要件を満たすかチェック
 */
export function canCraftRecipe(recipeId: string): boolean {
  const state = get(gameState);
  const recipe = getRecipe(recipeId);
  if (!recipe) return false;
  if (recipe.requiredLevel > calcLevelFromExp(state.alchemyExp)) return false;
  if (!state.knownRecipes.includes(recipeId)) return false;
  if (!hasRequiredFacilities(recipe)) return false;

  // 各素材の必要数をチェック（機材効果で軽減あり）
  for (const ingredient of recipe.ingredients) {
    const effectiveQty = getEffectiveIngredientCount(ingredient.quantity);
    const available = countAvailableIngredients(ingredient);
    if (available < effectiveQty) return false;
  }
  return true;
}

/**
 * アイテムが素材要件に合致するかチェック
 */
export function matchesIngredient(item: OwnedItem, ingredient: Ingredient): boolean {
  if (ingredient.itemId) {
    return item.itemId === ingredient.itemId;
  }
  if (ingredient.category) {
    const def = getItem(item.itemId);
    return def?.category === ingredient.category;
  }
  return false;
}

/**
 * 特定の素材要件に対して利用可能な数を数える
 */
export function countAvailableIngredients(ingredient: Ingredient): number {
  const state = get(gameState);
  return state.inventory.filter((item) => matchesIngredient(item, ingredient)).length;
}

/**
 * 素材要件に合致するインベントリアイテムを取得
 */
export function getMatchingItems(ingredient: Ingredient): OwnedItem[] {
  const state = get(gameState);
  return state.inventory.filter((item) => matchesIngredient(item, ingredient));
}

/**
 * バッチ調合の共通実行ロジック
 * 素材収集後の成功判定→品質計算→アイテム生成→経験値→失敗時保全を一本化
 */
function executeBatch(recipe: RecipeDef, allBatchItems: OwnedItem[][]): CraftMultipleResult {
  const actualQuantity = allBatchItems.length;
  const firstItems = allBatchItems[0];
  const currentState = get(gameState);

  // 低品質素材による強制失敗チェック
  const lowQualityFail = checkLowQualityFail(firstItems);

  // 成功率を計算し、1回だけ判定
  const successRate = lowQualityFail ? 0 : calculateSuccessRate(recipe, calcLevelFromExp(currentState.alchemyExp), currentState.stamina);
  const isSuccess = Math.random() < successRate;

  // 体力を全個数分一括消費
  const staminaCost = calculateStaminaCost(recipe) * actualQuantity;
  gameState.update((s) => ({
    ...s,
    stamina: Math.max(0, s.stamina - staminaCost),
  }));

  const resultItems: OwnedItem[] = [];
  let totalExpGained = 0;
  let totalReputationExpGained = 0;
  let duplicatedCount = 0;

  if (isSuccess) {
    // 全成功: 品質は1回だけ計算し全個数に適用
    const quality = calculateQuality(recipe, firstItems, calcLevelFromExp(currentState.alchemyExp));
    const stateForOrigin = get(gameState);
    const isNewDiscovery = !stateForOrigin.discoveredItems.includes(recipe.resultItemId);

    for (let i = 0; i < actualQuantity; i++) {
      const newItem: OwnedItem = {
        itemId: recipe.resultItemId,
        quality,
        origin: {
          type: 'crafted',
          day: stateForOrigin.day,
          flavorText: pickRandom(craftedFlavors),
        },
      };
      addItem(newItem);
      markItemCrafted(recipe.resultItemId);
      incrementCraftCount(quality);
      resultItems.push(newItem);

      const duplicatedItem = tryDuplicate(newItem);
      if (duplicatedItem) {
        duplicatedCount++;
        resultItems.push(duplicatedItem);
      }
    }

    const { alchemyExp: expGained, reputationExp: repExpGained } = calculateCraftExpGained(recipe, quality, actualQuantity, isNewDiscovery);
    addExp(expGained);
    if (repExpGained > 0) addReputationExp(repExpGained);
    totalExpGained = expGained;
    totalReputationExpGained = repExpGained;
    recordSuccess(recipe.id);
  } else {
    // 全失敗
    const expGained = Math.floor(recipe.expReward * ALCHEMY.FAIL_EXP_RATE) * actualQuantity;
    addExp(expGained);
    totalExpGained = expGained;
    resetCombo();
    recordFailure(recipe.id);

    if (lowQualityFail) {
      addMessage('低品質素材のせいで釜が暴走した！');
    }

    // 失敗時の素材保全（全バッチ分）
    for (const batchItems of allBatchItems) {
      if (shouldSaveMaterials()) {
        batchItems.forEach((item) => addItem(item));
      } else {
        const recoverCount = getFailRecoverCount();
        if (recoverCount > 0 && batchItems.length > 0) {
          batchItems.slice(0, recoverCount).forEach((item) => addItem(item));
        }
      }
    }
  }

  const itemDef = getItem(recipe.resultItemId);
  const itemName = itemDef?.name || recipe.name;
  const message = generateBatchMessage(
    itemName,
    isSuccess ? actualQuantity : 0,
    isSuccess ? 0 : actualQuantity,
    resultItems,
    totalExpGained,
    totalReputationExpGained,
    duplicatedCount,
  );

  return {
    successCount: isSuccess ? actualQuantity : 0,
    failCount: isSuccess ? 0 : actualQuantity,
    items: resultItems,
    duplicatedCount,
    totalExpGained,
    totalReputationExpGained,
    message,
  };
}

/** バッチ調合の共通バリデーション（レシピ存在・レベル確認） */
function validateBatchPreconditions(recipeId: string): { recipe: RecipeDef } | { error: CraftMultipleResult } {
  const recipe = getRecipe(recipeId);
  if (!recipe) {
    return { error: { successCount: 0, failCount: 0, items: [], duplicatedCount: 0, totalExpGained: 0, totalReputationExpGained: 0, message: 'レシピが見つかりません' } };
  }
  const state = get(gameState);
  if (recipe.requiredLevel > calcLevelFromExp(state.alchemyExp)) {
    return { error: { successCount: 0, failCount: 0, items: [], duplicatedCount: 0, totalExpGained: 0, totalReputationExpGained: 0, message: `錬金術レベルが足りません（必要: Lv${recipe.requiredLevel}）` } };
  }
  return { recipe };
}

const EMPTY_BATCH_RESULT: CraftMultipleResult = { successCount: 0, failCount: 0, items: [], duplicatedCount: 0, totalExpGained: 0, totalReputationExpGained: 0, message: '素材が足りませんでした' };

/**
 * 複数個の調合を実行（自動で素材を選択）
 */
export function craftMultiple(recipeId: string, quantity: number): CraftMultipleResult {
  const check = validateBatchPreconditions(recipeId);
  if ('error' in check) return check.error;
  const { recipe } = check;

  const allBatchItems: OwnedItem[][] = [];
  for (let i = 0; i < quantity; i++) {
    const selectedItems = autoSelectItems(recipe);
    if (selectedItems.length === 0) break;
    consumeItems(selectedItems);
    allBatchItems.push(selectedItems);
  }
  if (allBatchItems.length === 0) return EMPTY_BATCH_RESULT;

  return executeBatch(recipe, allBatchItems);
}

/**
 * 手動選択された素材でバッチ調合を実行
 */
export function craftBatch(recipeId: string, allSelectedItems: OwnedItem[], quantity: number): CraftMultipleResult {
  const check = validateBatchPreconditions(recipeId);
  if ('error' in check) return check.error;
  const { recipe } = check;

  const itemsPerCraft = recipe.ingredients.reduce((sum, ing) => sum + ing.quantity, 0);
  const allBatchItems: OwnedItem[][] = [];
  for (let i = 0; i < quantity; i++) {
    const startIdx = i * itemsPerCraft;
    const batchItems = allSelectedItems.slice(startIdx, startIdx + itemsPerCraft);
    if (batchItems.length < itemsPerCraft) break;
    consumeItems(batchItems);
    allBatchItems.push(batchItems);
  }
  if (allBatchItems.length === 0) return EMPTY_BATCH_RESULT;

  return executeBatch(recipe, allBatchItems);
}

/**
 * レシピに必要な素材を自動で選択（品質の高い順）
 */
function autoSelectItems(recipe: RecipeDef): OwnedItem[] {
  const state = get(gameState);
  const selectedItems: OwnedItem[] = [];
  const inventoryCopy = [...state.inventory];

  for (const ingredient of recipe.ingredients) {
    const effectiveQty = getEffectiveIngredientCount(ingredient.quantity);
    for (let i = 0; i < effectiveQty; i++) {
      const matchingIndices = inventoryCopy
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => matchesIngredient(item, ingredient))
        .sort((a, b) => b.item.quality - a.item.quality);

      if (matchingIndices.length === 0) return [];

      const { item, idx } = matchingIndices[0];
      selectedItems.push(item);
      inventoryCopy.splice(idx, 1);
    }
  }

  return selectedItems;
}

/**
 * 素材をインベントリから消費
 */
function consumeItems(items: OwnedItem[]): void {
  gameState.update((state) => ({
    ...state,
    inventory: removeItemsFromInventory(state.inventory, items),
  }));
}

/**
 * 調合に必要な体力を計算（機材効果適用済み）
 */
export function calculateStaminaCost(recipe: RecipeDef): number {
  const base = STAMINA.CRAFT_BASE_COST + recipe.difficulty * STAMINA.CRAFT_DIFFICULTY_COST;
  return Math.max(1, Math.round(base * getStaminaCostMult()));
}

/**
 * 疲労による成功率ペナルティを計算
 */
export function calculateFatiguePenalty(stamina: number): number {
  if (stamina >= STAMINA.FATIGUE_THRESHOLD_NONE) return 0;
  if (stamina >= STAMINA.FATIGUE_THRESHOLD_MILD) return STAMINA.FATIGUE_PENALTY_MILD;
  if (stamina >= STAMINA.FATIGUE_THRESHOLD_MODERATE) return STAMINA.FATIGUE_PENALTY_MODERATE;
  return STAMINA.FATIGUE_PENALTY_SEVERE;
}

/**
 * 疲労レベルのラベルを取得
 */
export function getFatigueLabel(stamina: number): string | null {
  if (stamina >= STAMINA.FATIGUE_THRESHOLD_NONE) return null;
  if (stamina >= STAMINA.FATIGUE_THRESHOLD_MILD) return '軽度疲労';
  if (stamina >= STAMINA.FATIGUE_THRESHOLD_MODERATE) return '中度疲労';
  return '重度疲労';
}

/**
 * 成功率を計算（機材効果適用済み）
 */
export function calculateSuccessRate(recipe: RecipeDef, alchemyLevel: number, stamina?: number): number {
  const baserate = CRAFT_SUCCESS.BASE_RATE - (recipe.difficulty - 1) * CRAFT_SUCCESS.DIFFICULTY_PENALTY;
  const levelBonus = Math.max(0, (alchemyLevel - recipe.requiredLevel) * CRAFT_SUCCESS.LEVEL_BONUS);
  const { successRateBonus } = getFacilityBonuses(recipe);
  const fatiguePenalty = stamina !== undefined ? calculateFatiguePenalty(stamina) : 0;

  // 機材効果
  const equipBonus = getCraftSuccessBonus();
  const accumBonus = getFailAccumulationBonus(recipe.id);
  const probBonus = getAllProbabilityBonus();

  // 施設・助手効果
  const villageBonus = getBuildingCraftSuccessBonus();
  const helperBonus = getHelperCraftSuccessBonus();

  return Math.max(0.01, Math.min(
    CRAFT_SUCCESS.MAX_RATE,
    baserate + levelBonus + successRateBonus + equipBonus + accumBonus + probBonus + villageBonus + helperBonus - fatiguePenalty
  ));
}

/**
 * 予想品質を計算（ランダム要素を除く）
 */
export function calculateExpectedQuality(
  recipe: RecipeDef,
  selectedItems: OwnedItem[],
  alchemyLevel: number
): { min: number; max: number; base: number } {
  if (selectedItems.length === 0) {
    return { min: 0, max: 0, base: 0 };
  }
  // 素材の平均品質（機材効果適用）
  const avgQuality =
    selectedItems.reduce((sum, item) => sum + getEffectiveMaterialQuality(item.quality), 0) / selectedItems.length;

  const levelBonus = Math.max(0, (alchemyLevel - recipe.requiredLevel) * QUALITY.LEVEL_BONUS);
  const { qualityBonus } = getFacilityBonuses(recipe);

  // 機材効果
  const equipQualityBonus = getCraftQualityBonus();
  const comboBonus = getComboQualityBonus();
  const qualityCap = getQualityCap();
  const varianceMult = getQualityVarianceMult();

  // 施設・助手効果
  const villageQualityBonus = getBuildingCraftQualityBonus();
  const helperQualityBonus = getHelperCraftQualityBonus();

  const base = Math.floor(avgQuality + levelBonus + qualityBonus + equipQualityBonus + comboBonus + villageQualityBonus + helperQualityBonus);
  const randomMin = Math.round(QUALITY.RANDOM_MIN * varianceMult);
  const randomMax = Math.round(QUALITY.RANDOM_MAX * varianceMult);
  const min = Math.max(QUALITY.MIN, base + randomMin);
  const max = Math.min(qualityCap, base + randomMax);

  return { min, max, base };
}

/**
 * 完成品の品質を計算（機材効果適用済み）
 */
function calculateQuality(
  recipe: RecipeDef,
  selectedItems: OwnedItem[],
  alchemyLevel: number
): number {
  // 素材の平均品質（機材効果: 底上げ＋ボーナス適用）
  const avgQuality =
    selectedItems.reduce((sum, item) => sum + getEffectiveMaterialQuality(item.quality), 0) / selectedItems.length;

  const levelBonus = Math.max(0, (alchemyLevel - recipe.requiredLevel) * QUALITY.LEVEL_BONUS);
  const { qualityBonus } = getFacilityBonuses(recipe);

  // 機材効果
  const equipQualityBonus = getCraftQualityBonus();
  const comboBonus = getComboQualityBonus();
  const qualityCap = getQualityCap();
  const varianceMult = getQualityVarianceMult();

  // ランダム要素（機材効果でブレ幅を変更）
  const randomMin = Math.round(QUALITY.RANDOM_MIN * varianceMult);
  const randomMax = Math.round(QUALITY.RANDOM_MAX * varianceMult);
  const randomRange = randomMax - randomMin + 1;
  const randomFactor = Math.floor(Math.random() * randomRange) + randomMin;

  // 施設・助手効果
  const villageQualityBonus = getBuildingCraftQualityBonus();
  const helperQualityBonus = getHelperCraftQualityBonus();

  const quality = Math.floor(avgQuality + levelBonus + qualityBonus + equipQualityBonus + comboBonus + villageQualityBonus + helperQualityBonus + randomFactor);
  return Math.max(1, Math.min(qualityCap, quality));
}
