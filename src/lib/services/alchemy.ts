import { get } from 'svelte/store';
import {
  gameState,
  addMessage,
  addItem,
  addExp,
  markItemCrafted,
} from '$lib/stores/game';
import { getRecipe } from '$lib/data/recipes';
import { getItem } from '$lib/data/items';
import type { OwnedItem, RecipeDef, Ingredient } from '$lib/models/types';

export interface CraftResult {
  success: boolean;
  item?: OwnedItem;
  expGained: number;
  message: string;
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
 * 特定の素材要件に対して利用可能な数を数える
 */
export function countAvailableIngredients(ingredient: Ingredient): number {
  const state = get(gameState);
  return state.inventory.filter((item) => {
    if (ingredient.itemId) {
      return item.itemId === ingredient.itemId;
    }
    if (ingredient.category) {
      const def = getItem(item.itemId);
      return def?.category === ingredient.category;
    }
    return false;
  }).length;
}

/**
 * 素材要件に合致するインベントリアイテムを取得
 */
export function getMatchingItems(ingredient: Ingredient): OwnedItem[] {
  const state = get(gameState);
  return state.inventory.filter((item) => {
    if (ingredient.itemId) {
      return item.itemId === ingredient.itemId;
    }
    if (ingredient.category) {
      const def = getItem(item.itemId);
      return def?.category === ingredient.category;
    }
    return false;
  });
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

  // 成功判定
  const successRate = calculateSuccessRate(recipe, state.alchemyLevel);
  const isSuccess = Math.random() < successRate;

  if (!isSuccess) {
    // 失敗時も経験値は少しもらえる
    const expGained = Math.floor(recipe.expReward * 0.3);
    addExp(expGained);
    return {
      success: false,
      expGained,
      message: `調合に失敗しました... (+${expGained} Exp)`,
    };
  }

  // 品質計算
  const quality = calculateQuality(recipe, selectedItems, state.alchemyLevel);

  // 完成品を追加
  const newItem: OwnedItem = {
    itemId: recipe.resultItemId,
    quality,
  };
  addItem(newItem);
  markItemCrafted(recipe.resultItemId);

  // 経験値計算
  let expGained = recipe.expReward;
  if (quality >= 70) expGained = Math.floor(expGained * 1.2); // 高品質ボーナス
  addExp(expGained);

  const itemDef = getItem(recipe.resultItemId);
  const itemName = itemDef?.name || recipe.name;

  return {
    success: true,
    item: newItem,
    expGained,
    message: `${itemName}（品質: ${quality}）を作成しました！ (+${expGained} Exp)`,
  };
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

      if (ingredient.itemId && item.itemId !== ingredient.itemId) {
        return false;
      }
      if (ingredient.category) {
        const def = getItem(item.itemId);
        if (def?.category !== ingredient.category) return false;
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
  gameState.update((state) => {
    const newInventory = [...state.inventory];
    for (const item of items) {
      const index = newInventory.findIndex(
        (i) => i.itemId === item.itemId && i.quality === item.quality
      );
      if (index !== -1) {
        newInventory.splice(index, 1);
      }
    }
    return { ...state, inventory: newInventory };
  });
}

/**
 * 成功率を計算
 */
function calculateSuccessRate(recipe: RecipeDef, alchemyLevel: number): number {
  // 基本成功率: 難易度1で95%、難易度10で50%
  const baserate = 1 - (recipe.difficulty - 1) * 0.05;
  // レベルボーナス: レベルが必要レベルを超えるごとに+5%
  const levelBonus = Math.max(0, (alchemyLevel - recipe.requiredLevel) * 0.05);
  return Math.min(0.99, baserate + levelBonus);
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
  const levelBonus = Math.max(0, (alchemyLevel - recipe.requiredLevel) * 2);

  // ランダム要素: -10 ~ +10
  const randomFactor = Math.floor(Math.random() * 21) - 10;

  const quality = Math.floor(avgQuality + levelBonus + randomFactor);
  return Math.max(1, Math.min(100, quality));
}
