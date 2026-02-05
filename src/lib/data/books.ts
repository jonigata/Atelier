import type { RecipeBookDef } from '$lib/models/types';

export const books: Record<string, RecipeBookDef> = {
  book_basics: {
    id: 'book_basics',
    name: '錬金術入門',
    description: '錬金術の基礎を学ぶための教科書。回復薬と解毒薬のレシピが載っている。',
    recipeIds: ['potion_01', 'antidote'],
    basePrice: 100,
  },
  book_advanced_potions: {
    id: 'book_advanced_potions',
    name: '上級調合術',
    description: 'より高度な薬の調合法を解説した本。',
    recipeIds: ['potion_02'],
    basePrice: 500,
  },
  book_metallurgy: {
    id: 'book_metallurgy',
    name: '鍛冶と精錬',
    description: '金属の精錬技術について書かれた技術書。',
    recipeIds: ['ingot_01', 'ingot_02'],
    basePrice: 800,
  },
  book_explosives: {
    id: 'book_explosives',
    name: '爆発物概論',
    description: '危険だが役立つ爆発物の製造法。取扱注意。',
    recipeIds: ['bomb_01'],
    basePrice: 400,
  },
  book_legendary: {
    id: 'book_legendary',
    name: '伝説の秘薬',
    description: '古代から伝わる万能薬の製法が記された貴重な書物。',
    recipeIds: ['elixir'],
    basePrice: 2000,
  },
};

export function getBook(id: string): RecipeBookDef | undefined {
  return books[id];
}

export function getBooksContainingRecipe(recipeId: string): RecipeBookDef[] {
  return Object.values(books).filter(book => book.recipeIds.includes(recipeId));
}
