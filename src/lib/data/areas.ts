import type { AreaDef } from '$lib/models/types';

export const areas: Record<string, AreaDef> = {
  forest: {
    id: 'forest',
    name: '緑の森',
    costPerDay: 50,
    drops: [
      { itemId: 'herb_01', weight: 40, qualityRange: [20, 60] },
      { itemId: 'herb_02', weight: 25, qualityRange: [20, 50] },
      { itemId: 'misc_01', weight: 15, qualityRange: [30, 60] },
      { itemId: 'oil_seed', weight: 20, qualityRange: [20, 50] },
      { itemId: 'hemp_fiber', weight: 18, qualityRange: [25, 55] },
      { itemId: 'magic_wood', weight: 12, qualityRange: [30, 60] },
      { itemId: 'forest_moss', weight: 15, qualityRange: [20, 45] },
      { itemId: 'honey', weight: 10, qualityRange: [35, 65] },
      { itemId: 'tree_resin', weight: 12, qualityRange: [25, 55] },
    ],
    rareDrops: [
      { itemId: 'glow_mushroom', weight: 40, qualityRange: [40, 75] },
      { itemId: 'rubber_sap', weight: 30, qualityRange: [45, 80] },
      { itemId: 'spirit_flower', weight: 30, qualityRange: [55, 90] },
    ],
    rareChance: 0.1,
  },
  mountain: {
    id: 'mountain',
    name: '岩山',
    costPerDay: 100,
    drops: [
      { itemId: 'ore_01', weight: 40, qualityRange: [30, 70] },
      { itemId: 'crystal_ore', weight: 20, qualityRange: [30, 65] },
      { itemId: 'whetstone_ore', weight: 18, qualityRange: [25, 55] },
      { itemId: 'coal', weight: 22, qualityRange: [30, 60] },
      { itemId: 'sulfur', weight: 15, qualityRange: [35, 65] },
      { itemId: 'talc', weight: 15, qualityRange: [25, 55] },
    ],
    rareDrops: [
      { itemId: 'ore_02', weight: 35, qualityRange: [40, 80] },
      { itemId: 'misc_02', weight: 25, qualityRange: [50, 90] },
      { itemId: 'thunder_shard', weight: 20, qualityRange: [50, 85] },
      { itemId: 'beast_blood', weight: 20, qualityRange: [45, 80] },
    ],
    rareChance: 0.15,
  },
  lake: {
    id: 'lake',
    name: '静寂の湖',
    costPerDay: 30,
    drops: [
      { itemId: 'water_01', weight: 40, qualityRange: [30, 70] },
      { itemId: 'silica_sand', weight: 20, qualityRange: [20, 50] },
      { itemId: 'clay', weight: 18, qualityRange: [20, 50] },
      { itemId: 'salt', weight: 15, qualityRange: [25, 55] },
      { itemId: 'lotus', weight: 12, qualityRange: [35, 65] },
    ],
    rareDrops: [
      { itemId: 'water_02', weight: 50, qualityRange: [60, 95] },
      { itemId: 'glow_moss', weight: 30, qualityRange: [45, 80] },
      { itemId: 'ice_crystal', weight: 20, qualityRange: [55, 90] },
    ],
    rareChance: 0.1,
  },
  dried_spring_hill: {
    id: 'dried_spring_hill',
    name: '枯泉の丘',
    costPerDay: 80,
    drops: [
      { itemId: 'herb_03', weight: 35, qualityRange: [40, 80] },
      { itemId: 'herb_01', weight: 25, qualityRange: [40, 70] },
      { itemId: 'glow_mushroom', weight: 15, qualityRange: [35, 65] },
      { itemId: 'forest_moss', weight: 12, qualityRange: [30, 60] },
      { itemId: 'honey', weight: 10, qualityRange: [40, 70] },
    ],
    rareDrops: [
      { itemId: 'herb_03', weight: 50, qualityRange: [60, 95] },
      { itemId: 'spirit_flower', weight: 30, qualityRange: [55, 90] },
      { itemId: 'rubber_sap', weight: 20, qualityRange: [50, 85] },
    ],
    rareChance: 0.12,
  },
};

export function getArea(id: string): AreaDef | undefined {
  return areas[id];
}

export function getAllAreas(): AreaDef[] {
  return Object.values(areas);
}
