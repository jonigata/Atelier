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
    effects: [{ type: 'daily_item', value: 1, itemId: 'herb_01' }],
    effectDescription: '毎朝、薬草を1つ入手',
  },
  apiary: {
    id: 'apiary',
    name: '養蜂場',
    description: '花蜂を飼育する小屋。定期的に蜂蜜が採れる',
    icon: '🐝',
    effects: [{ type: 'periodic_item', value: 1, itemId: 'honey', interval: 3 }],
    effectDescription: '3日おきに蜂蜜を1つ入手',
  },
  mine: {
    id: 'mine',
    name: '採掘坑',
    description: '村の外れに掘った小さな坑道。鉱石が定期的に採れる',
    icon: '⛏️',
    effects: [{ type: 'periodic_item', value: 1, itemId: 'ore_01', interval: 3 }],
    effectDescription: '3日おきに鉱石を1つ入手',
  },
  well: {
    id: 'well',
    name: '湧き水の井戸',
    description: '清らかな地下水が湧き出す井戸。毎朝きれいな水が手に入る',
    icon: '💧',
    effects: [{ type: 'daily_item', value: 1, itemId: 'water_01' }],
    effectDescription: '毎朝、清水を1つ入手',
  },

  // =====================================
  // 経済系
  // =====================================
  market: {
    id: 'market',
    name: '市場',
    description: '村に開かれた小さな市場。品揃えが良くなり取引も有利に',
    icon: '🏪',
    effects: [
      { type: 'buy_price', value: 0.05 },
      { type: 'sell_price', value: 0.05 },
    ],
    effectDescription: '売値+5%、買値-5%',
  },
  warehouse: {
    id: 'warehouse',
    name: '倉庫',
    description: '素材を保管するための大きな倉庫。採取の持ち帰りが増える',
    icon: '📦',
    effects: [{ type: 'expedition_bonus', value: 0.2 }],
    effectDescription: '採取ドロップ+20%',
  },
  inn: {
    id: 'inn',
    name: '宿屋',
    description: '旅人が立ち寄る宿。時折珍しい素材を持った旅人が訪れる',
    icon: '🏨',
    effects: [
      { type: 'sell_price', value: 0.05 },
      { type: 'buy_price', value: 0.03 },
    ],
    effectDescription: '売値+5%、買値-3%',
  },

  // =====================================
  // 時間効率系
  // =====================================
  drying_shed: {
    id: 'drying_shed',
    name: '乾燥小屋',
    description: '薬品の乾燥・熟成を効率化する小屋。薬品系の調合が速くなる',
    icon: '🏚️',
    effects: [{ type: 'craft_days_reduce', value: 1, itemCategory: 'product' }],
    effectDescription: '薬品系の調合日数-1（最低1日）',
  },
  watermill: {
    id: 'watermill',
    name: '水車小屋',
    description: '水力で素材の粉砕・混合を補助する。調合の品質が安定する',
    icon: '🎡',
    effects: [{ type: 'craft_quality', value: 3 }],
    effectDescription: '全調合品質+3',
  },
  drying_rack: {
    id: 'drying_rack',
    name: '物干し台',
    description: '素材を効率よく乾燥させる台。調合の成功率が少し上がる',
    icon: '🧺',
    effects: [{ type: 'craft_success', value: 0.03 }],
    effectDescription: '全調合成功率+3%',
  },
  annex: {
    id: 'annex',
    name: '工房の別棟',
    description: '工房を増築した別棟。作業効率が大きく向上する',
    icon: '🏗️',
    effects: [
      { type: 'craft_quality', value: 5 },
      { type: 'craft_success', value: 0.05 },
    ],
    effectDescription: '全調合品質+5、成功率+5%',
  },

  // =====================================
  // 情報・学習系
  // =====================================
  library: {
    id: 'library',
    name: '図書館',
    description: '錬金術の文献を集めた書庫。勉強の効率が上がる',
    icon: '📚',
    effects: [{ type: 'study_days_reduce', value: 1 }],
    effectDescription: '勉強日数-1（最低1日）',
  },
  bulletin_board: {
    id: 'bulletin_board',
    name: '掲示板',
    description: '村の情報掲示板。依頼の情報が集まりやすくなる',
    icon: '📋',
    effects: [{ type: 'craft_success', value: 0.02 }],
    effectDescription: '全調合成功率+2%',
  },
  clock_tower: {
    id: 'clock_tower',
    name: '時計塔',
    description: '村のシンボルとなる時計塔。名声が自然に高まる',
    icon: '🕐',
    effects: [{ type: 'craft_quality', value: 2 }],
    effectDescription: '全調合品質+2',
  },

  // =====================================
  // 人・社会系
  // =====================================
  clinic: {
    id: 'clinic',
    name: '診療所',
    description: '村の医療施設。休息時の体力回復量が増加する',
    icon: '🏥',
    effects: [{ type: 'rest_bonus', value: 20 }],
    effectDescription: '休息の体力回復量+20',
  },
  meeting_hall: {
    id: 'meeting_hall',
    name: '集会所',
    description: '村人が集まる交流の場。村全体の活気が高まる',
    icon: '🏛️',
    effects: [
      { type: 'rest_bonus', value: 10 },
      { type: 'craft_success', value: 0.02 },
    ],
    effectDescription: '休息回復+10、調合成功率+2%',
  },
};

export function getBuilding(id: string): BuildingDef | undefined {
  return buildings[id];
}

export function getAllBuildings(): BuildingDef[] {
  return Object.values(buildings);
}
