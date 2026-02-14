import { get } from 'svelte/store';
import {
  gameState,
  addMessage,
  addItem,
  addExp,
  markItemCrafted,
} from '$lib/stores/game';
import { incrementCraftCount } from '$lib/stores/stats';
import { getRecipe } from '$lib/data/recipes';
import { getItem } from '$lib/data/items';
import { removeItemsFromInventory } from '$lib/services/inventory';
import { ALCHEMY, CRAFT_SUCCESS, QUALITY, STAMINA } from '$lib/data/balance';
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
import type { OwnedItem, RecipeDef, Ingredient } from '$lib/models/types';

export interface CraftResult {
  success: boolean;
  item?: OwnedItem;
  duplicatedItem?: OwnedItem | null;
  expGained: number;
  message: string;
  materialsSaved?: boolean;
  materialsRecovered?: number;
}

export interface CraftMultipleResult {
  successCount: number;
  failCount: number;
  items: OwnedItem[];
  duplicatedCount: number;
  totalExpGained: number;
  message: string;
}

/**
 * 1回分の調合を試行（成功判定、品質計算、経験値計算）
 */
interface CraftAttemptResult {
  success: boolean;
  item?: OwnedItem;
  duplicatedItem?: OwnedItem | null;
  expGained: number;
}

function executeCraftAttempt(
  recipe: RecipeDef,
  selectedItems: OwnedItem[],
  alchemyLevel: number
): CraftAttemptResult {
  // 低品質素材による強制失敗チェック（品質cap付き釜の副作用）
  if (checkLowQualityFail(selectedItems)) {
    const expGained = Math.floor(recipe.expReward * ALCHEMY.FAIL_EXP_RATE);
    addExp(expGained);
    addMessage('低品質素材のせいで釜が暴走した！');
    resetCombo();
    recordFailure(recipe.id);
    return { success: false, expGained };
  }

  // 現在の体力を取得して疲労込みの成功率を計算
  const currentState = get(gameState);
  const successRate = calculateSuccessRate(recipe, alchemyLevel, currentState.stamina);

  // 体力を消費
  const staminaCost = calculateStaminaCost(recipe);
  gameState.update((s) => ({
    ...s,
    stamina: Math.max(0, s.stamina - staminaCost),
  }));

  const isSuccess = Math.random() < successRate;

  if (!isSuccess) {
    const expGained = Math.floor(recipe.expReward * ALCHEMY.FAIL_EXP_RATE);
    addExp(expGained);
    resetCombo();
    recordFailure(recipe.id);
    return { success: false, expGained };
  }

  // 品質計算
  const quality = calculateQuality(recipe, selectedItems, alchemyLevel);

  // 完成品を追加
  const stateForOrigin = get(gameState);
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

  // 経験値計算（高品質ボーナス）
  let expGained = recipe.expReward;
  if (quality >= ALCHEMY.HIGH_QUALITY_THRESHOLD) {
    expGained = Math.floor(expGained * ALCHEMY.HIGH_QUALITY_EXP_BONUS);
  }
  addExp(expGained);

  // コンボ・蓄積更新
  recordSuccess(recipe.id);

  // 複製判定
  const duplicatedItem = tryDuplicate(newItem);

  return { success: true, item: newItem, duplicatedItem, expGained };
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
  duplicatedCount: number
): string {
  if (successCount === 0 && failCount === 0) {
    return '素材が足りませんでした';
  }
  const dupMsg = duplicatedCount > 0 ? `（＋複製${duplicatedCount}個）` : '';
  if (failCount === 0) {
    const avgQuality = Math.round(items.reduce((sum, item) => sum + item.quality, 0) / items.length);
    return `${itemName}を${successCount}個${dupMsg}作成しました！（平均品質: ${avgQuality}） +${totalExpGained} Exp`;
  }
  if (successCount === 0) {
    return `${failCount}回すべて失敗しました... +${totalExpGained} Exp`;
  }
  const avgQuality = Math.round(items.reduce((sum, item) => sum + item.quality, 0) / items.length);
  return `${itemName}を${successCount}個${dupMsg}作成、${failCount}個失敗（平均品質: ${avgQuality}） +${totalExpGained} Exp`;
}

/**
 * 素材がレシピの要件を満たすかチェック
 */
export function canCraftRecipe(recipeId: string): boolean {
  const state = get(gameState);
  const recipe = getRecipe(recipeId);
  if (!recipe) return false;
  if (recipe.requiredLevel > state.alchemyLevel) return false;
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
 * 調合を実行
 */
export function craft(
  recipeId: string,
  selectedItems: OwnedItem[]
): CraftResult {
  const state = get(gameState);
  const recipe = getRecipe(recipeId);

  if (!recipe) {
    return { success: false, expGained: 0, message: 'レシピが見つかりません' };
  }

  if (recipe.requiredLevel > state.alchemyLevel) {
    return {
      success: false,
      expGained: 0,
      message: `錬金術レベルが足りません（必要: Lv${recipe.requiredLevel}）`,
    };
  }

  if (!validateSelectedItems(recipe, selectedItems)) {
    return { success: false, expGained: 0, message: '素材が正しく選択されていません' };
  }

  // 素材を消費
  consumeItems(selectedItems);

  // 調合実行
  const result = executeCraftAttempt(recipe, selectedItems, state.alchemyLevel);
  const itemDef = getItem(recipe.resultItemId);
  const itemName = itemDef?.name || recipe.name;

  if (!result.success) {
    // 失敗時の素材保全チェック
    let materialsSaved = false;
    let materialsRecovered = 0;

    if (shouldSaveMaterials()) {
      // 素材を全て返却
      selectedItems.forEach((item) => addItem(item));
      materialsSaved = true;
      addMessage('機材効果で素材が保全された！');
    } else {
      // 一部回収
      const recoverCount = getFailRecoverCount();
      if (recoverCount > 0 && selectedItems.length > 0) {
        const toRecover = selectedItems.slice(0, recoverCount);
        toRecover.forEach((item) => addItem(item));
        materialsRecovered = toRecover.length;
        addMessage(`機材効果で素材${materialsRecovered}個を回収した！`);
      }
    }

    return {
      success: false,
      expGained: result.expGained,
      message: `調合に失敗しました... (+${result.expGained} Exp)`,
      materialsSaved,
      materialsRecovered,
    };
  }

  return {
    success: true,
    item: result.item,
    duplicatedItem: result.duplicatedItem,
    expGained: result.expGained,
    message: `${itemName}（品質: ${result.item!.quality}）を作成しました！ (+${result.expGained} Exp)`,
  };
}

/**
 * 複数個の調合を実行（自動で素材を選択）
 */
export function craftMultiple(
  recipeId: string,
  quantity: number
): CraftMultipleResult {
  const recipe = getRecipe(recipeId);

  if (!recipe) {
    return {
      successCount: 0,
      failCount: 0,
      items: [],
      duplicatedCount: 0,
      totalExpGained: 0,
      message: 'レシピが見つかりません',
    };
  }

  const state = get(gameState);

  if (recipe.requiredLevel > state.alchemyLevel) {
    return {
      successCount: 0,
      failCount: 0,
      items: [],
      duplicatedCount: 0,
      totalExpGained: 0,
      message: `錬金術レベルが足りません（必要: Lv${recipe.requiredLevel}）`,
    };
  }

  let successCount = 0;
  let failCount = 0;
  const items: OwnedItem[] = [];
  let totalExpGained = 0;
  let duplicatedCount = 0;

  for (let i = 0; i < quantity; i++) {
    const selectedItems = autoSelectItems(recipe);
    if (selectedItems.length === 0) break;

    consumeItems(selectedItems);

    const currentState = get(gameState);
    const result = executeCraftAttempt(recipe, selectedItems, currentState.alchemyLevel);
    totalExpGained += result.expGained;

    if (result.success && result.item) {
      successCount++;
      items.push(result.item);
      if (result.duplicatedItem) {
        duplicatedCount++;
        items.push(result.duplicatedItem);
      }
    } else {
      failCount++;
      // 失敗時の素材保全
      if (shouldSaveMaterials()) {
        selectedItems.forEach((item) => addItem(item));
      } else {
        const recoverCount = getFailRecoverCount();
        if (recoverCount > 0 && selectedItems.length > 0) {
          selectedItems.slice(0, recoverCount).forEach((item) => addItem(item));
        }
      }
    }
  }

  const itemDef = getItem(recipe.resultItemId);
  const itemName = itemDef?.name || recipe.name;
  const message = generateBatchMessage(itemName, successCount, failCount, items, totalExpGained, duplicatedCount);

  return {
    successCount,
    failCount,
    items,
    duplicatedCount,
    totalExpGained,
    message,
  };
}

/**
 * 手動選択された素材でバッチ調合を実行
 */
export function craftBatch(
  recipeId: string,
  allSelectedItems: OwnedItem[],
  quantity: number
): CraftMultipleResult {
  const recipe = getRecipe(recipeId);

  if (!recipe) {
    return {
      successCount: 0,
      failCount: 0,
      items: [],
      duplicatedCount: 0,
      totalExpGained: 0,
      message: 'レシピが見つかりません',
    };
  }

  const state = get(gameState);

  if (recipe.requiredLevel > state.alchemyLevel) {
    return {
      successCount: 0,
      failCount: 0,
      items: [],
      duplicatedCount: 0,
      totalExpGained: 0,
      message: `錬金術レベルが足りません（必要: Lv${recipe.requiredLevel}）`,
    };
  }

  const itemsPerCraft = recipe.ingredients.reduce((sum, ing) => sum + ing.quantity, 0);

  let successCount = 0;
  let failCount = 0;
  const resultItems: OwnedItem[] = [];
  let totalExpGained = 0;
  let duplicatedCount = 0;

  for (let i = 0; i < quantity; i++) {
    const startIdx = i * itemsPerCraft;
    const batchItems = allSelectedItems.slice(startIdx, startIdx + itemsPerCraft);

    if (batchItems.length < itemsPerCraft) break;

    consumeItems(batchItems);

    const currentState = get(gameState);
    const result = executeCraftAttempt(recipe, batchItems, currentState.alchemyLevel);
    totalExpGained += result.expGained;

    if (result.success && result.item) {
      successCount++;
      resultItems.push(result.item);
      if (result.duplicatedItem) {
        duplicatedCount++;
        resultItems.push(result.duplicatedItem);
      }
    } else {
      failCount++;
      // 失敗時の素材保全
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
  const message = generateBatchMessage(itemName, successCount, failCount, resultItems, totalExpGained, duplicatedCount);

  return {
    successCount,
    failCount,
    items: resultItems,
    duplicatedCount,
    totalExpGained,
    message,
  };
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
 * 選択された素材がレシピ要件を満たすか検証
 */
function validateSelectedItems(recipe: RecipeDef, selectedItems: OwnedItem[]): boolean {
  let itemIndex = 0;
  for (const ingredient of recipe.ingredients) {
    for (let i = 0; i < ingredient.quantity; i++) {
      if (itemIndex >= selectedItems.length) return false;
      const item = selectedItems[itemIndex];
      if (!matchesIngredient(item, ingredient)) return false;
      itemIndex++;
    }
  }
  return true;
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

  return Math.max(0.01, Math.min(
    CRAFT_SUCCESS.MAX_RATE,
    baserate + levelBonus + successRateBonus + equipBonus + accumBonus + probBonus - fatiguePenalty
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

  const base = Math.floor(avgQuality + levelBonus + qualityBonus + equipQualityBonus + comboBonus);
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

  const quality = Math.floor(avgQuality + levelBonus + qualityBonus + equipQualityBonus + comboBonus + randomFactor);
  return Math.max(1, Math.min(qualityCap, quality));
}
