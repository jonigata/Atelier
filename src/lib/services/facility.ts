import { get } from 'svelte/store';
import { gameState } from '$lib/stores/game';
import { getAllFacilities, getFacility } from '$lib/data/facilities';
import { getItem } from '$lib/data/items';
import { FACILITY } from '$lib/data/balance';
import type { FacilityDef, RecipeDef, Ingredient } from '$lib/models/types';

/**
 * 特定の設備が現在有効かどうかを判定
 */
export function isFacilityActive(facilityId: string): boolean {
  const facility = getFacility(facilityId);
  if (!facility) return false;

  const state = get(gameState);

  if (facility.type === 'permanent') {
    return state.facilities.includes(facilityId);
  }

  if (facility.type === 'inventory' && facility.itemId) {
    return state.inventory.some(
      (item) => item.itemId === facility.itemId && item.quality >= FACILITY.INVENTORY_QUALITY_MIN
    );
  }

  return false;
}

/**
 * 現在有効な全設備を取得
 */
export function getActiveFacilities(): FacilityDef[] {
  return getAllFacilities().filter((f) => isFacilityActive(f.id));
}

/**
 * レシピの設備要件を満たしているか
 */
export function hasRequiredFacilities(recipe: RecipeDef): boolean {
  if (!recipe.requiredFacilities || recipe.requiredFacilities.length === 0) {
    return true;
  }
  return recipe.requiredFacilities.every((fId) => isFacilityActive(fId));
}

/**
 * レシピに不足している設備のリストを取得
 */
export function getMissingFacilities(recipe: RecipeDef): FacilityDef[] {
  if (!recipe.requiredFacilities) return [];
  return recipe.requiredFacilities
    .filter((fId) => !isFacilityActive(fId))
    .map((fId) => getFacility(fId))
    .filter((f): f is FacilityDef => f !== undefined);
}

/**
 * レシピの素材カテゴリを取得（設備ボーナス判定用）
 */
function getRecipeIngredientCategories(recipe: RecipeDef): Set<string> {
  const categories = new Set<string>();
  for (const ing of recipe.ingredients) {
    if (ing.category) {
      categories.add(ing.category);
    }
    if (ing.itemId) {
      const itemDef = getItem(ing.itemId);
      if (itemDef) {
        categories.add(itemDef.category);
      }
    }
  }
  return categories;
}

/**
 * レシピに対する設備ボーナスを集計
 */
export function getFacilityBonuses(recipe: RecipeDef): {
  successRateBonus: number;
  qualityBonus: number;
} {
  const activeFacilities = getActiveFacilities();
  const recipeCategories = getRecipeIngredientCategories(recipe);

  let successRateBonus = 0;
  let qualityBonus = 0;

  for (const facility of activeFacilities) {
    for (const effect of facility.effects) {
      const applies =
        effect.scope === 'all' ||
        (effect.scope === 'category' &&
          effect.targetCategory &&
          recipeCategories.has(effect.targetCategory));

      if (!applies) continue;

      if (effect.type === 'success_rate') {
        successRateBonus += effect.value;
      } else if (effect.type === 'quality') {
        qualityBonus += effect.value;
      }
    }
  }

  return { successRateBonus, qualityBonus };
}
