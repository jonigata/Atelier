import type { RecipeDef } from '$lib/models/types';

export const recipes: Record<string, RecipeDef> = {
  potion_01: {
    id: 'potion_01',
    name: '回復薬',
    resultItemId: 'potion_01',
    ingredients: [
      { itemId: 'herb_01', quantity: 2 },
      { itemId: 'water_01', quantity: 1 },
    ],
    requiredLevel: 1,
    daysRequired: 1,
    difficulty: 1,
    expReward: 10,
  },
  potion_02: {
    id: 'potion_02',
    name: '上級回復薬',
    resultItemId: 'potion_02',
    ingredients: [
      { itemId: 'herb_01', quantity: 3 },
      { itemId: 'water_02', quantity: 1 },
    ],
    requiredLevel: 5,
    daysRequired: 2,
    difficulty: 4,
    expReward: 30,
  },
  antidote: {
    id: 'antidote',
    name: '解毒薬',
    resultItemId: 'antidote',
    ingredients: [
      { itemId: 'herb_02', quantity: 2 },
      { itemId: 'water_01', quantity: 1 },
    ],
    requiredLevel: 2,
    daysRequired: 1,
    difficulty: 2,
    expReward: 15,
  },
  bomb_01: {
    id: 'bomb_01',
    name: '爆弾',
    resultItemId: 'bomb_01',
    ingredients: [
      { itemId: 'ore_01', quantity: 1 },
      { category: 'misc', quantity: 1 },
    ],
    requiredLevel: 3,
    daysRequired: 2,
    difficulty: 3,
    expReward: 20,
  },
  ingot_01: {
    id: 'ingot_01',
    name: '鉄インゴット',
    resultItemId: 'ingot_01',
    ingredients: [
      { itemId: 'ore_01', quantity: 3 },
    ],
    requiredLevel: 4,
    daysRequired: 3,
    difficulty: 4,
    expReward: 25,
  },
  ingot_02: {
    id: 'ingot_02',
    name: '銀インゴット',
    resultItemId: 'ingot_02',
    ingredients: [
      { itemId: 'ore_02', quantity: 3 },
    ],
    requiredLevel: 8,
    daysRequired: 3,
    difficulty: 6,
    expReward: 50,
  },
  elixir: {
    id: 'elixir',
    name: 'エリクサー',
    resultItemId: 'elixir',
    ingredients: [
      { itemId: 'potion_02', quantity: 1 },
      { itemId: 'water_02', quantity: 1 },
      { itemId: 'misc_02', quantity: 1 },
    ],
    requiredLevel: 15,
    daysRequired: 5,
    difficulty: 9,
    expReward: 100,
  },
};

export function getRecipe(id: string): RecipeDef | undefined {
  return recipes[id];
}

export function getRecipesForLevel(level: number): RecipeDef[] {
  return Object.values(recipes).filter(r => r.requiredLevel <= level);
}
