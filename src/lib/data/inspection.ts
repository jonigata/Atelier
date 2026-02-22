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
        key: 'level', label: '錬金Lv', unit: '',
        thresholds: { D: 1, C: 2, B: 2, A: 3, S: 3 },
        getValue: (s) => calcLevelFromExp(s.alchemyExp),
        getExpValue: (s) => s.alchemyExp,
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
        thresholds: { D: 2, C: 2, B: 3, A: 3, S: 4 },
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
        key: 'level', label: '錬金Lv', unit: '',
        thresholds: { D: 2, C: 3, B: 3, A: 4, S: 5 },
        getValue: (s) => calcLevelFromExp(s.alchemyExp),
        getExpValue: (s) => s.alchemyExp,
      },
      {
        key: 'quests', label: '依頼', unit: '件',
        thresholds: { D: 6, C: 8, B: 10, A: 12, S: 15 },
        getValue: (s) => s.completedQuestCount,
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
        thresholds: { D: 3, C: 4, B: 5, A: 6, S: 7 },
        getValue: (s) => calcLevelFromExp(s.alchemyExp),
        getExpValue: (s) => s.alchemyExp,
      },
      {
        key: 'quests', label: '依頼', unit: '件',
        thresholds: { D: 10, C: 14, B: 17, A: 20, S: 24 },
        getValue: (s) => s.completedQuestCount,
      },
      {
        key: 'villageDev', label: '村発展Lv', unit: '',
        thresholds: { D: 2, C: 3, B: 3, A: 4, S: 5 },
        getValue: (s) => calcLevelFromExp(s.villageExp),
      },
      {
        key: 'reputation', label: '名声Lv', unit: '',
        thresholds: { D: 2, C: 3, B: 3, A: 4, S: 5 },
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
        key: 'level', label: '錬金Lv', unit: '',
        thresholds: { D: 4, C: 5, B: 6, A: 7, S: 8 },
        getValue: (s) => calcLevelFromExp(s.alchemyExp),
        getExpValue: (s) => s.alchemyExp,
      },
      {
        key: 'quests', label: '依頼', unit: '件',
        thresholds: { D: 16, C: 21, B: 26, A: 30, S: 35 },
        getValue: (s) => s.completedQuestCount,
      },
      {
        key: 'villageDev', label: '村発展Lv', unit: '',
        thresholds: { D: 3, C: 4, B: 5, A: 6, S: 7 },
        getValue: (s) => calcLevelFromExp(s.villageExp),
      },
      {
        key: 'reputation', label: '名声Lv', unit: '',
        thresholds: { D: 3, C: 4, B: 5, A: 6, S: 7 },
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
        thresholds: { D: 5, C: 6, B: 7, A: 8, S: 9 },
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
        thresholds: { D: 4, C: 5, B: 6, A: 7, S: 9 },
        getValue: (s) => calcLevelFromExp(s.villageExp),
      },
      {
        key: 'reputation', label: '名声Lv', unit: '',
        thresholds: { D: 4, C: 5, B: 6, A: 7, S: 9 },
        getValue: (s) => calcLevelFromExp(s.reputationExp),
        getExpValue: (s) => s.reputationExp,
      },
    ],
  },
];

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
