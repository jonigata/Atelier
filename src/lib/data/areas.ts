import type { AreaDef } from '$lib/models/types';

export const areas: Record<string, AreaDef> = {
  forest: {
    id: 'forest',
    name: '緑の森',
    costPerDay: 50,
    drops: [
      { itemId: 'herb_01', weight: 50, qualityRange: [20, 60] },
      { itemId: 'herb_02', weight: 30, qualityRange: [20, 50] },
      { itemId: 'misc_01', weight: 20, qualityRange: [30, 60] },
    ],
    rareDrops: [],
    rareChance: 0,
  },
  mountain: {
    id: 'mountain',
    name: '岩山',
    costPerDay: 100,
    drops: [
      { itemId: 'ore_01', weight: 70, qualityRange: [30, 70] },
    ],
    rareDrops: [
      { itemId: 'ore_02', weight: 60, qualityRange: [40, 80] },
      { itemId: 'misc_02', weight: 40, qualityRange: [50, 90] },
    ],
    rareChance: 0.15,
  },
  lake: {
    id: 'lake',
    name: '静寂の湖',
    costPerDay: 30,
    drops: [
      { itemId: 'water_01', weight: 100, qualityRange: [30, 70] },
    ],
    rareDrops: [
      { itemId: 'water_02', weight: 100, qualityRange: [60, 95] },
    ],
    rareChance: 0.1,
  },
};

export function getArea(id: string): AreaDef | undefined {
  return areas[id];
}

export function getAllAreas(): AreaDef[] {
  return Object.values(areas);
}
