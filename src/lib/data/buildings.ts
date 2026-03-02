import type { BuildingDef } from '$lib/models/types';

export const buildings: Record<string, BuildingDef> = {
  // =====================================
  // 採取・素材系
  // =====================================
  herb_garden: {
    id: 'herb_garden',
    name: '薬草園',
    description: '工房の裏庭に設けた薬草畑。毎朝新鮮な薬草が収穫できる',
    icon: '🌿',
    maxLevel: 3,
    levels: [
      { effects: [{ type: 'daily_item', value: 1, itemId: 'herb_01' }], effectDescription: '毎朝、薬草を1つ入手' },
      { effects: [{ type: 'daily_item', value: 2, itemId: 'herb_01' }], effectDescription: '毎朝、薬草を2つ入手' },
      { effects: [{ type: 'daily_item', value: 3, itemId: 'herb_01' }], effectDescription: '毎朝、薬草を3つ入手' },
    ],
  },
  apiary: {
    id: 'apiary',
    name: '養蜂場',
    description: '花蜂を飼育する小屋。定期的に蜂蜜が採れる',
    icon: '🐝',
    maxLevel: 3,
    levels: [
      { effects: [{ type: 'periodic_item', value: 1, itemId: 'honey', interval: 3 }], effectDescription: '3日おきに蜂蜜を1つ入手' },
      { effects: [{ type: 'periodic_item', value: 1, itemId: 'honey', interval: 2 }], effectDescription: '2日おきに蜂蜜を1つ入手' },
      { effects: [{ type: 'periodic_item', value: 2, itemId: 'honey', interval: 2 }], effectDescription: '2日おきに蜂蜜を2つ入手' },
    ],
  },
  mine: {
    id: 'mine',
    name: '採掘坑',
    description: '村の外れに掘った小さな坑道。鉱石が定期的に採れる',
    icon: '⛏️',
    maxLevel: 3,
    levels: [
      { effects: [{ type: 'periodic_item', value: 1, itemId: 'ore_01', interval: 3 }], effectDescription: '3日おきに鉱石を1つ入手' },
      { effects: [{ type: 'periodic_item', value: 1, itemId: 'ore_01', interval: 2 }], effectDescription: '2日おきに鉱石を1つ入手' },
      { effects: [{ type: 'periodic_item', value: 2, itemId: 'ore_01', interval: 2 }], effectDescription: '2日おきに鉱石を2つ入手' },
    ],
  },
  well: {
    id: 'well',
    name: '湧き水の井戸',
    description: '清らかな地下水が湧き出す井戸。毎朝きれいな水が手に入る',
    icon: '💧',
    maxLevel: 3,
    levels: [
      { effects: [{ type: 'daily_item', value: 1, itemId: 'water_01' }], effectDescription: '毎朝、清水を1つ入手' },
      { effects: [{ type: 'daily_item', value: 2, itemId: 'water_01' }], effectDescription: '毎朝、清水を2つ入手' },
      { effects: [{ type: 'daily_item', value: 3, itemId: 'water_01' }], effectDescription: '毎朝、清水を3つ入手' },
    ],
  },

  // =====================================
  // 経済系
  // =====================================
  market: {
    id: 'market',
    name: '市場',
    description: '村に開かれた小さな市場。品揃えが良くなり取引も有利に',
    icon: '🏪',
    maxLevel: 3,
    levels: [
      { effects: [{ type: 'buy_price', value: 0.05 }, { type: 'sell_price', value: 0.05 }], effectDescription: '売値+5%、買値-5%' },
      { effects: [{ type: 'buy_price', value: 0.08 }, { type: 'sell_price', value: 0.08 }], effectDescription: '売値+8%、買値-8%' },
      { effects: [{ type: 'buy_price', value: 0.12 }, { type: 'sell_price', value: 0.12 }], effectDescription: '売値+12%、買値-12%' },
    ],
  },
  warehouse: {
    id: 'warehouse',
    name: '倉庫',
    description: '素材を保管するための大きな倉庫。採取の持ち帰りが増える',
    icon: '📦',
    maxLevel: 3,
    levels: [
      { effects: [{ type: 'expedition_bonus', value: 0.2 }], effectDescription: '採取ドロップ+20%' },
      { effects: [{ type: 'expedition_bonus', value: 0.35 }], effectDescription: '採取ドロップ+35%' },
      { effects: [{ type: 'expedition_bonus', value: 0.50 }], effectDescription: '採取ドロップ+50%' },
    ],
  },

  // =====================================
  // 時間効率系
  // =====================================
  drying_shed: {
    id: 'drying_shed',
    name: '乾燥小屋',
    description: '薬品の乾燥・熟成を効率化する小屋。薬品系の調合が速くなる',
    icon: '🏚️',
    maxLevel: 3,
    levels: [
      { effects: [{ type: 'craft_days_reduce', value: 1, itemCategory: 'medicine' }], effectDescription: '薬品系の調合日数-0.1日' },
      { effects: [{ type: 'craft_days_halve', value: 0.25, itemCategory: 'medicine' }], effectDescription: '薬品系の調合日数-25%' },
      { effects: [{ type: 'craft_days_halve', value: 0.50, itemCategory: 'medicine' }], effectDescription: '薬品系の調合日数-50%' },
    ],
  },
  watermill: {
    id: 'watermill',
    name: '水車小屋',
    description: '水力で素材の粉砕・混合を補助する。調合の品質が安定する',
    icon: '🎡',
    maxLevel: 3,
    levels: [
      { effects: [{ type: 'craft_quality', value: 5 }], effectDescription: '全調合品質+5' },
      { effects: [{ type: 'craft_quality', value: 8 }], effectDescription: '全調合品質+8' },
      { effects: [{ type: 'craft_quality', value: 12 }], effectDescription: '全調合品質+12' },
    ],
  },

  // =====================================
  // 情報・学習系
  // =====================================
  library: {
    id: 'library',
    name: '図書館',
    description: '錬金術の文献を集めた書庫。勉強の効率が上がる',
    icon: '📚',
    maxLevel: 3,
    levels: [
      { effects: [{ type: 'study_days_reduce', value: 1 }], effectDescription: '勉強日数-1（最低1日）' },
      { effects: [{ type: 'study_days_reduce', value: 2 }], effectDescription: '勉強日数-2（最低1日）' },
      { effects: [{ type: 'study_days_reduce', value: 3 }], effectDescription: '勉強日数-3（最低1日）' },
    ],
  },
  clock_tower: {
    id: 'clock_tower',
    name: '時計塔',
    description: '村のシンボルとなる時計塔。名声が自然に高まる',
    icon: '🕐',
    maxLevel: 3,
    levels: [
      { effects: [{ type: 'reputation_exp_bonus', value: 0.20 }], effectDescription: '名声Exp +20%' },
      { effects: [{ type: 'reputation_exp_bonus', value: 0.35 }], effectDescription: '名声Exp +35%' },
      { effects: [{ type: 'reputation_exp_bonus', value: 0.50 }], effectDescription: '名声Exp +50%' },
    ],
  },

  // =====================================
  // 人・社会系
  // =====================================
  clinic: {
    id: 'clinic',
    name: '診療所',
    description: '村の医療施設。休息時の体力回復量が増加する',
    icon: '🏥',
    maxLevel: 3,
    levels: [
      { effects: [{ type: 'rest_bonus', value: 25 }], effectDescription: '休息の体力回復量+25' },
      { effects: [{ type: 'rest_bonus', value: 40 }], effectDescription: '休息の体力回復量+40' },
      { effects: [{ type: 'rest_bonus', value: 60 }], effectDescription: '休息の体力回復量+60' },
    ],
  },
  meeting_hall: {
    id: 'meeting_hall',
    name: '集会所',
    description: '村人が集まる交流の場。村全体の活気が高まる',
    icon: '🏛️',
    maxLevel: 3,
    levels: [
      { effects: [{ type: 'village_exp_bonus', value: 0.20 }], effectDescription: '村発展Exp +20%' },
      { effects: [{ type: 'village_exp_bonus', value: 0.35 }], effectDescription: '村発展Exp +35%' },
      { effects: [{ type: 'village_exp_bonus', value: 0.50 }], effectDescription: '村発展Exp +50%' },
    ],
  },
};

export function getBuilding(id: string): BuildingDef | undefined {
  return buildings[id];
}

export function getAllBuildings(): BuildingDef[] {
  return Object.values(buildings);
}
