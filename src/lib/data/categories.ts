import type { ItemCategory } from '$lib/models/types';

/**
 * カテゴリIDから日本語表示名へのマッピング
 */
export const CATEGORY_NAMES: Record<ItemCategory, string> = {
  herb: 'ハーブ系',
  ore: '鉱石系',
  water: '水系',
  misc: 'その他',
  product: '生成物',
} as const;

/**
 * カテゴリの表示名を取得
 */
export function getCategoryName(category: string): string {
  return CATEGORY_NAMES[category as ItemCategory] || category;
}
