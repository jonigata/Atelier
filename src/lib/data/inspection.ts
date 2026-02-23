import type { GameState } from '$lib/models/types';
import { calcLevelFromExp } from '$lib/data/balance';

// 査察日（1,2,3,5,7,9,12月末）
export const INSPECTION_DAYS = [28, 56, 84, 140, 196, 252, 336] as const;

// 等級
export type InspectionGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface InspectionThresholds {
  D: number;
  C: number;
  B: number;
  A: number;
  S: number;
}

export interface InspectionCriterion {
  key: string;
  label: string;
  unit: string; // 'Lv.' | '件' | '回' | '' etc
  thresholds: InspectionThresholds;
  getValue: (state: GameState) => number;
  /** 生の経験値を返す（ビジュアル進捗用、省略時はgetValueと同じ） */
  getExpValue?: (state: GameState) => number;
}

export interface InspectionDef {
  day: number;
  month: number;
  title: string;
  criteria: InspectionCriterion[];
}

// 1～9月末の査察定義（12月末はエンディング分岐のみ）
export const inspections: InspectionDef[] = [
  {
    day: 28,
    month: 1,
    title: '初回報告',
    criteria: [
      {
        key: 'album', label: 'アルバム', unit: '種',
        thresholds: { D: 3, C: 5, B: 8, A: 10, S: 14 },
        getValue: (s) => s.discoveredItems.length,
      },
      {
        key: 'quests', label: '依頼', unit: '件',
        thresholds: { D: 1, C: 2, B: 3, A: 4, S: 5 },
        getValue: (s) => s.completedQuestCount,
      },
    ],
  },
  {
    day: 56,
    month: 2,
    title: '適応確認',
    criteria: [
      {
        key: 'level', label: '錬金Lv', unit: '',
        thresholds: { D: 6, C: 6, B: 9, A: 9, S: 12 },
        getValue: (s) => calcLevelFromExp(s.alchemyExp),
        getExpValue: (s) => s.alchemyExp,
      },
      {
        key: 'quests', label: '依頼', unit: '件',
        thresholds: { D: 3, C: 5, B: 6, A: 8, S: 10 },
        getValue: (s) => s.completedQuestCount,
      },
    ],
  },
  {
    day: 84,
    month: 3,
    title: '基礎確認',
    criteria: [
      {
        key: 'album', label: 'アルバム', unit: '種',
        thresholds: { D: 14, C: 20, B: 28, A: 35, S: 42 },
        getValue: (s) => s.discoveredItems.length,
      },
      {
        key: 'quests', label: '依頼', unit: '件',
        thresholds: { D: 6, C: 8, B: 10, A: 12, S: 15 },
        getValue: (s) => s.completedQuestCount,
      },
      {
        key: 'villageDev', label: '村発展Lv', unit: '',
        thresholds: { D: 3, C: 6, B: 6, A: 9, S: 12 },
        getValue: (s) => calcLevelFromExp(s.villageExp),
      },
    ],
  },
  {
    day: 140,
    month: 5,
    title: '成長評価',
    criteria: [
      {
        key: 'level', label: '錬金Lv', unit: '',
        thresholds: { D: 9, C: 12, B: 15, A: 18, S: 21 },
        getValue: (s) => calcLevelFromExp(s.alchemyExp),
        getExpValue: (s) => s.alchemyExp,
      },
      {
        key: 'quests', label: '依頼', unit: '件',
        thresholds: { D: 10, C: 14, B: 17, A: 20, S: 24 },
        getValue: (s) => s.completedQuestCount,
      },
      {
        key: 'reputation', label: '名声Lv', unit: '',
        thresholds: { D: 6, C: 9, B: 9, A: 12, S: 15 },
        getValue: (s) => calcLevelFromExp(s.reputationExp),
        getExpValue: (s) => s.reputationExp,
      },
    ],
  },
  {
    day: 196,
    month: 7,
    title: '中間評価',
    criteria: [
      {
        key: 'album', label: 'アルバム', unit: '種',
        thresholds: { D: 38, C: 50, B: 65, A: 80, S: 95 },
        getValue: (s) => s.discoveredItems.length,
      },
      {
        key: 'quests', label: '依頼', unit: '件',
        thresholds: { D: 16, C: 21, B: 26, A: 30, S: 35 },
        getValue: (s) => s.completedQuestCount,
      },
      {
        key: 'villageDev', label: '村発展Lv', unit: '',
        thresholds: { D: 9, C: 12, B: 15, A: 18, S: 21 },
        getValue: (s) => calcLevelFromExp(s.villageExp),
      },
      {
        key: 'reputation', label: '名声Lv', unit: '',
        thresholds: { D: 9, C: 12, B: 15, A: 18, S: 21 },
        getValue: (s) => calcLevelFromExp(s.reputationExp),
        getExpValue: (s) => s.reputationExp,
      },
    ],
  },
  {
    day: 252,
    month: 9,
    title: '最終準備',
    criteria: [
      {
        key: 'level', label: '錬金Lv', unit: '',
        thresholds: { D: 15, C: 18, B: 21, A: 24, S: 27 },
        getValue: (s) => calcLevelFromExp(s.alchemyExp),
        getExpValue: (s) => s.alchemyExp,
      },
      {
        key: 'quests', label: '依頼', unit: '件',
        thresholds: { D: 22, C: 28, B: 33, A: 38, S: 43 },
        getValue: (s) => s.completedQuestCount,
      },
      {
        key: 'villageDev', label: '村発展Lv', unit: '',
        thresholds: { D: 12, C: 15, B: 18, A: 21, S: 27 },
        getValue: (s) => calcLevelFromExp(s.villageExp),
      },
      {
        key: 'reputation', label: '名声Lv', unit: '',
        thresholds: { D: 12, C: 15, B: 18, A: 21, S: 27 },
        getValue: (s) => calcLevelFromExp(s.reputationExp),
        getExpValue: (s) => s.reputationExp,
      },
    ],
  },
];

// =====================================
// 査察報酬
// =====================================

export interface InspectionRewardItem {
  itemId: string;
  quantity: number;
  quality: number;
}

export interface InspectionReward {
  money: number;
  items: InspectionRewardItem[];
  reputationExp: number;
}

/** 査察日 → 等級 → 報酬 のマップ（C等級=報酬なし、D等級=不合格） */
export const inspectionRewards: Record<number, Partial<Record<InspectionGrade, InspectionReward>>> = {
  // Day 28 — 初回報告「スタートアップ支援」基本素材の高品質版
  28: {
    S: {
      money: 500,
      items: [
        { itemId: 'water_01', quantity: 15, quality: 80 },
        { itemId: 'herb_01', quantity: 15, quality: 80 },
      ],
      reputationExp: 10,
    },
    A: {
      money: 300,
      items: [
        { itemId: 'water_01', quantity: 9, quality: 65 },
        { itemId: 'herb_01', quantity: 9, quality: 65 },
      ],
      reputationExp: 5,
    },
    B: {
      money: 150,
      items: [
        { itemId: 'herb_01', quantity: 9, quality: 45 },
      ],
      reputationExp: 2,
    },
  },
  // Day 56 — 適応確認「採取地への手がかり」レアドロップ素材
  56: {
    S: {
      money: 500,
      items: [
        { itemId: 'ore_02', quantity: 6, quality: 75 },
        { itemId: 'misc_02', quantity: 3, quality: 70 },
      ],
      reputationExp: 10,
    },
    A: {
      money: 300,
      items: [
        { itemId: 'ore_01', quantity: 9, quality: 70 },
        { itemId: 'herb_02', quantity: 9, quality: 65 },
      ],
      reputationExp: 5,
    },
    B: {
      money: 150,
      items: [
        { itemId: 'ore_01', quantity: 6, quality: 50 },
        { itemId: 'water_01', quantity: 6, quality: 50 },
      ],
      reputationExp: 2,
    },
  },
  // Day 84 — 基礎確認「調合素材パック」Tier2向け鉱物系
  84: {
    S: {
      money: 500,
      items: [
        { itemId: 'coal', quantity: 9, quality: 70 },
        { itemId: 'sulfur', quantity: 6, quality: 70 },
        { itemId: 'crystal_ore', quantity: 6, quality: 70 },
      ],
      reputationExp: 10,
    },
    A: {
      money: 300,
      items: [
        { itemId: 'coal', quantity: 6, quality: 60 },
        { itemId: 'silica_sand', quantity: 9, quality: 60 },
        { itemId: 'honey', quantity: 6, quality: 60 },
      ],
      reputationExp: 5,
    },
    B: {
      money: 150,
      items: [
        { itemId: 'oil_seed', quantity: 9, quality: 50 },
        { itemId: 'tree_resin', quantity: 9, quality: 50 },
      ],
      reputationExp: 2,
    },
  },
  // Day 140 — 成長評価「王都からの特別支給品」植物・花系
  140: {
    S: {
      money: 800,
      items: [
        { itemId: 'herb_03', quantity: 9, quality: 85 },
        { itemId: 'spirit_flower', quantity: 6, quality: 80 },
      ],
      reputationExp: 10,
    },
    A: {
      money: 500,
      items: [
        { itemId: 'herb_03', quantity: 6, quality: 70 },
        { itemId: 'glow_mushroom', quantity: 6, quality: 65 },
      ],
      reputationExp: 5,
    },
    B: {
      money: 250,
      items: [
        { itemId: 'herb_02', quantity: 12, quality: 60 },
        { itemId: 'forest_moss', quantity: 9, quality: 55 },
      ],
      reputationExp: 2,
    },
  },
  // Day 196 — 中間評価「錬金ギルドの援助物資」結晶・金属系
  196: {
    S: {
      money: 800,
      items: [
        { itemId: 'thunder_shard', quantity: 6, quality: 85 },
        { itemId: 'magma_stone', quantity: 6, quality: 80 },
        { itemId: 'gold_ore', quantity: 3, quality: 90 },
      ],
      reputationExp: 10,
    },
    A: {
      money: 500,
      items: [
        { itemId: 'ice_crystal', quantity: 6, quality: 75 },
        { itemId: 'ore_02', quantity: 9, quality: 75 },
      ],
      reputationExp: 5,
    },
    B: {
      money: 250,
      items: [
        { itemId: 'ore_02', quantity: 6, quality: 60 },
        { itemId: 'crystal_ore', quantity: 9, quality: 55 },
      ],
      reputationExp: 2,
    },
  },
  // Day 252 — 最終準備「伝説素材の下賜」最高級素材
  252: {
    S: {
      money: 1200,
      items: [
        { itemId: 'dragon_scale', quantity: 3, quality: 95 },
        { itemId: 'moon_stone', quantity: 3, quality: 90 },
        { itemId: 'mithril_ore', quantity: 3, quality: 85 },
      ],
      reputationExp: 10,
    },
    A: {
      money: 800,
      items: [
        { itemId: 'moon_stone', quantity: 3, quality: 75 },
        { itemId: 'ice_crystal', quantity: 6, quality: 80 },
        { itemId: 'beast_blood', quantity: 6, quality: 75 },
      ],
      reputationExp: 5,
    },
    B: {
      money: 400,
      items: [
        { itemId: 'magma_stone', quantity: 6, quality: 65 },
        { itemId: 'glow_mushroom', quantity: 9, quality: 60 },
      ],
      reputationExp: 2,
    },
  },
};

/** 査察の報酬を取得（C/Dは null） */
export function getInspectionReward(day: number, grade: InspectionGrade): InspectionReward | null {
  if (grade === 'C' || grade === 'D') return null;
  return inspectionRewards[day]?.[grade] ?? null;
}

/** 値から等級を判定 */
export function getGradeForValue(thresholds: InspectionThresholds, value: number): InspectionGrade {
  if (value >= thresholds.S) return 'S';
  if (value >= thresholds.A) return 'A';
  if (value >= thresholds.B) return 'B';
  if (value >= thresholds.C) return 'C';
  return 'D';
}

/** 査察の総合等級（全項目の最低等級） */
export function getOverallGrade(inspection: InspectionDef, state: GameState): InspectionGrade {
  const gradeOrder: InspectionGrade[] = ['D', 'C', 'B', 'A', 'S'];
  let minIndex = 4; // start at S
  for (const criterion of inspection.criteria) {
    const value = criterion.getValue(state);
    const grade = getGradeForValue(criterion.thresholds, value);
    const index = gradeOrder.indexOf(grade);
    if (index < minIndex) minIndex = index;
  }
  return gradeOrder[minIndex];
}

/** 合格判定 */
export function isInspectionPassed(inspection: InspectionDef, state: GameState): boolean {
  return getOverallGrade(inspection, state) !== 'D';
}

/** 次の査察を取得（当日含む、12月末含む） */
export function getNextInspection(day: number): InspectionDef | null {
  return inspections.find((i) => i.day >= day) ?? null;
}

/** 次の査察日を取得（当日含む、12月末含む） */
export function getNextInspectionDay(day: number): number | null {
  return INSPECTION_DAYS.find((d) => d >= day) ?? null;
}
