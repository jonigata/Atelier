import type { FacilityDef } from '$lib/models/types';

export const facilities: Record<string, FacilityDef> = {
  // =====================================
  // 永続設備（アチーブメントで解放）
  // =====================================
  furnace: {
    id: 'furnace',
    name: '錬成炉',
    description: '鉱石を溶かしてインゴットを作るための炉。金属系の調合に必須',
    type: 'permanent',
    effects: [
      { type: 'success_rate', value: 0.05, scope: 'category', targetCategory: 'ore' },
    ],
  },
  distiller: {
    id: 'distiller',
    name: '蒸留器',
    description: '液体を精製・濃縮するための装置。上級薬品の調合に必須',
    type: 'permanent',
    effects: [
      { type: 'quality', value: 3, scope: 'category', targetCategory: 'water' },
    ],
  },
  magic_circle: {
    id: 'magic_circle',
    name: '魔法陣',
    description: '魔力を制御するための術式。魔法系の調合に必須',
    type: 'permanent',
    effects: [],
  },
  improved_cauldron: {
    id: 'improved_cauldron',
    name: '改良の大釜',
    description: '師匠直伝の改良を施した大釜。全ての調合の成功率が上がる',
    type: 'permanent',
    effects: [
      { type: 'success_rate', value: 0.03, scope: 'all' },
    ],
  },
  advanced_workbench: {
    id: 'advanced_workbench',
    name: '高等作業台',
    description: '精密な作業が可能な上等の作業台。全ての調合品の品質が上がる',
    type: 'permanent',
    effects: [
      { type: 'quality', value: 5, scope: 'all' },
    ],
  },

  // =====================================
  // 所持設備（インベントリにある間だけ有効）
  // =====================================
  precision_tools_facility: {
    id: 'precision_tools_facility',
    name: '精密工具',
    description: '繊細な作業を助ける工具セット。所持している間、調合品質が上がる',
    type: 'inventory',
    itemId: 'precision_tools',
    effects: [
      { type: 'quality', value: 3, scope: 'all' },
    ],
  },
};

export function getFacility(id: string): FacilityDef | undefined {
  return facilities[id];
}

export function getAllFacilities(): FacilityDef[] {
  return Object.values(facilities);
}

export function getPermanentFacilities(): FacilityDef[] {
  return Object.values(facilities).filter(f => f.type === 'permanent');
}

export function getInventoryFacilities(): FacilityDef[] {
  return Object.values(facilities).filter(f => f.type === 'inventory');
}
