import type { ItemCategory } from '$lib/models/types';

/**
 * カテゴリIDから日本語表示名へのマッピング
 */
export const CATEGORY_NAMES: Record<ItemCategory, string> = {
  herb: 'ハーブ系',
  ore: '鉱石系',
  water: '水系',
  misc: 'その他',
  plant: '植物系',
  wood: '木材系',
  crystal: '結晶系',
  medicine: '薬品',
  material: '加工素材',
  metal: '金属・鍛冶',
  magic: '魔法素材',
  device: '装置・機構',
  infrastructure: '村の発展品',
} as const;

/**
 * カテゴリの表示名を取得
 */
export function getCategoryName(category: string): string {
  return CATEGORY_NAMES[category as ItemCategory] || category;
}

// =====================================
// 採取物 / 錬成物の判定
// =====================================

/** 錬成物カテゴリの表示順 */
export const CRAFTED_CATEGORY_ORDER: ItemCategory[] = [
  'medicine', 'material', 'metal', 'magic', 'device', 'infrastructure',
];

const CRAFTED_CATEGORY_SET = new Set<ItemCategory>(CRAFTED_CATEGORY_ORDER);

/** カテゴリが錬成物かどうかを判定 */
export function isCraftedCategory(cat: ItemCategory | undefined): boolean {
  if (!cat) return false;
  return CRAFTED_CATEGORY_SET.has(cat);
}
