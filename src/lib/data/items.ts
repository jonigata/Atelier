import type { ItemDef } from '$lib/models/types';

export const items: Record<string, ItemDef> = {
  // 素材: ハーブ系
  herb_01: {
    id: 'herb_01',
    name: '薬草',
    category: 'herb',
    basePrice: 10,
    description: 'どこにでも生えている基本的な薬草',
  },
  herb_02: {
    id: 'herb_02',
    name: '毒消し草',
    category: 'herb',
    basePrice: 20,
    description: '解毒作用のある草',
  },

  // 素材: 鉱石系
  ore_01: {
    id: 'ore_01',
    name: '鉄鉱石',
    category: 'ore',
    basePrice: 30,
    description: '一般的な鉄の原石',
  },
  ore_02: {
    id: 'ore_02',
    name: '銀鉱石',
    category: 'ore',
    basePrice: 100,
    description: '美しく輝く銀の原石',
  },

  // 素材: 水系
  water_01: {
    id: 'water_01',
    name: '清水',
    category: 'water',
    basePrice: 5,
    description: '澄んだ水',
  },
  water_02: {
    id: 'water_02',
    name: '聖水',
    category: 'water',
    basePrice: 200,
    description: '神聖な力を宿した水',
  },

  // 素材: その他
  misc_01: {
    id: 'misc_01',
    name: '獣の皮',
    category: 'misc',
    basePrice: 25,
    description: '動物の皮',
  },
  misc_02: {
    id: 'misc_02',
    name: '魔獣の牙',
    category: 'misc',
    basePrice: 150,
    description: '魔力を帯びた牙',
  },

  // 生成物
  potion_01: {
    id: 'potion_01',
    name: '回復薬',
    category: 'product',
    basePrice: 50,
    description: '体力を回復する基本的な薬',
  },
  potion_02: {
    id: 'potion_02',
    name: '上級回復薬',
    category: 'product',
    basePrice: 200,
    description: '強力な回復効果を持つ薬',
  },
  antidote: {
    id: 'antidote',
    name: '解毒薬',
    category: 'product',
    basePrice: 60,
    description: '毒を中和する薬',
  },
  bomb_01: {
    id: 'bomb_01',
    name: '爆弾',
    category: 'product',
    basePrice: 100,
    description: '爆発する錬金術の産物',
  },
  ingot_01: {
    id: 'ingot_01',
    name: '鉄インゴット',
    category: 'product',
    basePrice: 120,
    description: '精錬された鉄の塊',
  },
  ingot_02: {
    id: 'ingot_02',
    name: '銀インゴット',
    category: 'product',
    basePrice: 400,
    description: '精錬された銀の塊',
  },
  elixir: {
    id: 'elixir',
    name: 'エリクサー',
    category: 'product',
    basePrice: 1000,
    description: '伝説の万能薬',
  },
};

export function getItem(id: string): ItemDef | undefined {
  return items[id];
}

export function getItemIcon(id: string): string {
  return `/icons/materials/${id}.png`;
}
