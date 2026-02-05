import { get } from 'svelte/store';
import {
  gameState,
  addMessage,
  addItem,
  addExp,
  markItemCrafted,
  incrementCraftCount,
} from '$lib/stores/game';
import { getRecipe } from '$lib/data/recipes';
import { getItem } from '$lib/data/items';
import { removeItemsFromInventory } from '$lib/services/inventory';
import { ALCHEMY, CRAFT_SUCCESS, QUALITY } from '$lib/data/balance';
import type { OwnedItem, RecipeDef, Ingredient } from '$lib/models/types';

export interface CraftResult {
  success: boolean;
  item?: OwnedItem;
  expGained: number;
  message: string;
}

export interface CraftMultipleResult {
  successCount: number;
  failCount: number;
  items: OwnedItem[];
  totalExpGained: number;
  message: string;
}

/**
 * 1回分の調合を試行（成功判定、品質計算、経験値計算）
 * @returns 成功時: { success: true, item, expGained }、失敗時: { success: false, expGained }
 */
interface CraftAttemptResult {
  success: boolean;
  item?: OwnedItem;
  expGained: number;
}

function executeCraftAttempt(
  recipe: RecipeDef,
  selectedItems: OwnedItem[],
  alchemyLevel: number
): CraftAttemptResult {
  // 成功判定
  const successRate = calculateSuccessRate(recipe, alchemyLevel);
  const isSuccess = Math.random() < successRate;

  if (!isSuccess) {
    // 失敗時も経験値は少しもらえる
    const expGained = Math.floor(recipe.expReward * ALCHEMY.FAIL_EXP_RATE);
    addExp(expGained);
    return { success: false, expGained };
  }

  // 品質計算
  const quality = calculateQuality(recipe, selectedItems, alchemyLevel);

  // 完成品を追加
  const newItem: OwnedItem = {
    itemId: recipe.resultItemId,
    quality,
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

  return { success: true, item: newItem, expGained };
}

/**
 * バッチ調合のメッセージを生成
 */
function generateBatchMessage(
  itemName: string,
  successCount: number,
  failCount: number,
  items: OwnedItem[],
  totalExpGained: number
): string {
  if (successCount === 0 && failCount === 0) {
    return '素材が足りませんでした';
  }
  if (failCount === 0) {
    const avgQuality = Math.round(items.reduce((sum, item) => sum + item.quality, 0) / items.length);
    return `${itemName}を${successCount}個作成しました！（平均品質: ${avgQuality}） +${totalExpGained} Exp`;
  }
  if (successCount === 0) {
    return `${failCount}回すべて失敗しました... +${totalExpGained} Exp`;
  }
  const avgQuality = Math.round(items.reduce((sum, item) => sum + item.quality, 0) / items.length);
  return `${itemName}を${successCount}個作成、${failCount}個失敗（平均品質: ${avgQuality}） +${totalExpGained} Exp`;
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

  // 各素材の必要数をチェック
  for (const ingredient of recipe.ingredients) {
    const available = countAvailableIngredients(ingredient);
    if (available < ingredient.quantity) return false;
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

  // レベルチェック
  if (recipe.requiredLevel > state.alchemyLevel) {
    return {
      success: false,
      expGained: 0,
      message: `錬金術レベルが足りません（必要: Lv${recipe.requiredLevel}）`,
    };
  }

  // 素材チェック
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
    return {
      success: false,
      expGained: result.expGained,
      message: `調合に失敗しました... (+${result.expGained} Exp)`,
    };
  }

  return {
    success: true,
    item: result.item,
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
      totalExpGained: 0,
      message: 'レシピが見つかりません',
    };
  }

  const state = get(gameState);

  // レベルチェック
  if (recipe.requiredLevel > state.alchemyLevel) {
    return {
      successCount: 0,
      failCount: 0,
      items: [],
      totalExpGained: 0,
      message: `錬金術レベルが足りません（必要: Lv${recipe.requiredLevel}）`,
    };
  }

  let successCount = 0;
  let failCount = 0;
  const items: OwnedItem[] = [];
  let totalExpGained = 0;

  // 各調合を実行
  for (let i = 0; i < quantity; i++) {
    // 品質の高い順に素材を自動選択
    const selectedItems = autoSelectItems(recipe);

    if (selectedItems.length === 0) {
      // 素材不足で中断
      break;
    }

    // 素材を消費
    consumeItems(selectedItems);

    // 調合実行
    const currentState = get(gameState);
    const result = executeCraftAttempt(recipe, selectedItems, currentState.alchemyLevel);
    totalExpGained += result.expGained;

    if (result.success && result.item) {
      successCount++;
      items.push(result.item);
    } else {
      failCount++;
    }
  }

  const itemDef = getItem(recipe.resultItemId);
  const itemName = itemDef?.name || recipe.name;
  const message = generateBatchMessage(itemName, successCount, failCount, items, totalExpGained);

  return {
    successCount,
    failCount,
    items,
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
      totalExpGained: 0,
      message: `錬金術レベルが足りません（必要: Lv${recipe.requiredLevel}）`,
    };
  }

  const itemsPerCraft = recipe.ingredients.reduce((sum, ing) => sum + ing.quantity, 0);

  let successCount = 0;
  let failCount = 0;
  const resultItems: OwnedItem[] = [];
  let totalExpGained = 0;

  // 各調合を実行
  for (let i = 0; i < quantity; i++) {
    const startIdx = i * itemsPerCraft;
    const batchItems = allSelectedItems.slice(startIdx, startIdx + itemsPerCraft);

    if (batchItems.length < itemsPerCraft) {
      break;
    }

    // 素材を消費
    consumeItems(batchItems);

    // 調合実行
    const currentState = get(gameState);
    const result = executeCraftAttempt(recipe, batchItems, currentState.alchemyLevel);
    totalExpGained += result.expGained;

    if (result.success && result.item) {
      successCount++;
      resultItems.push(result.item);
    } else {
      failCount++;
    }
  }

  const itemDef = getItem(recipe.resultItemId);
  const itemName = itemDef?.name || recipe.name;
  const message = generateBatchMessage(itemName, successCount, failCount, resultItems, totalExpGained);

  return {
    successCount,
    failCount,
    items: resultItems,
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
    for (let i = 0; i < ingredient.quantity; i++) {
      // マッチするアイテムを品質順にソート
      const matchingIndices = inventoryCopy
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => matchesIngredient(item, ingredient))
        .sort((a, b) => b.item.quality - a.item.quality);

      if (matchingIndices.length === 0) {
        // 素材不足
        return [];
      }

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

      if (!matchesIngredient(item, ingredient)) {
        return false;
      }
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
 * 成功率を計算
 */
export function calculateSuccessRate(recipe: RecipeDef, alchemyLevel: number): number {
  // 基本成功率: 難易度1で100%、難易度上昇ごとに減少
  const baserate = CRAFT_SUCCESS.BASE_RATE - (recipe.difficulty - 1) * CRAFT_SUCCESS.DIFFICULTY_PENALTY;
  // レベルボーナス: レベルが必要レベルを超えるごとに加算
  const levelBonus = Math.max(0, (alchemyLevel - recipe.requiredLevel) * CRAFT_SUCCESS.LEVEL_BONUS);
  return Math.min(CRAFT_SUCCESS.MAX_RATE, baserate + levelBonus);
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
  // 素材の平均品質
  const avgQuality =
    selectedItems.reduce((sum, item) => sum + item.quality, 0) / selectedItems.length;

  // レベル補正
  const levelBonus = Math.max(0, (alchemyLevel - recipe.requiredLevel) * QUALITY.LEVEL_BONUS);

  const base = Math.floor(avgQuality + levelBonus);
  const min = Math.max(QUALITY.MIN, base + QUALITY.RANDOM_MIN);
  const max = Math.min(QUALITY.MAX, base + QUALITY.RANDOM_MAX);

  return { min, max, base };
}

/**
 * 完成品の品質を計算
 */
function calculateQuality(
  recipe: RecipeDef,
  selectedItems: OwnedItem[],
  alchemyLevel: number
): number {
  // 素材の平均品質
  const avgQuality =
    selectedItems.reduce((sum, item) => sum + item.quality, 0) / selectedItems.length;

  // レベル補正: 必要レベルを超えると品質が上がりやすい
  const levelBonus = Math.max(0, (alchemyLevel - recipe.requiredLevel) * QUALITY.LEVEL_BONUS);

  // ランダム要素
  const randomRange = QUALITY.RANDOM_MAX - QUALITY.RANDOM_MIN + 1;
  const randomFactor = Math.floor(Math.random() * randomRange) + QUALITY.RANDOM_MIN;

  const quality = Math.floor(avgQuality + levelBonus + randomFactor);
  return Math.max(1, Math.min(100, quality));
}
