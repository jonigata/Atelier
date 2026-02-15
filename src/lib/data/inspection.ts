import type { GameState } from '$lib/models/types';

// 査察日（Q1-Q4）
export const INSPECTION_DAYS = [84, 168, 252, 336] as const;

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
}

export interface InspectionDef {
  day: number;
  quarter: number;
  title: string;
  criteria: InspectionCriterion[];
}

// Q1-Q3 の査察定義（Q4はエンディング分岐のみ）
export const inspections: InspectionDef[] = [
  {
    day: 84,
    quarter: 1,
    title: '基礎確認',
    criteria: [
      {
        key: 'level', label: '錬金Lv', unit: '',
        thresholds: { D: 3, C: 4, B: 5, A: 6, S: 7 },
        getValue: (s) => s.alchemyLevel,
      },
      {
        key: 'quests', label: '依頼', unit: '件',
        thresholds: { D: 6, C: 8, B: 10, A: 12, S: 15 },
        getValue: (s) => s.completedQuestCount,
      },
    ],
  },
  {
    day: 168,
    quarter: 2,
    title: '中間評価',
    criteria: [
      {
        key: 'level', label: '錬金Lv', unit: '',
        thresholds: { D: 5, C: 7, B: 8, A: 9, S: 10 },
        getValue: (s) => s.alchemyLevel,
      },
      {
        key: 'quests', label: '依頼', unit: '件',
        thresholds: { D: 13, C: 18, B: 22, A: 26, S: 30 },
        getValue: (s) => s.completedQuestCount,
      },
      {
        key: 'villageDev', label: '村発展', unit: '',
        thresholds: { D: 24, C: 30, B: 38, A: 46, S: 55 },
        getValue: (s) => s.villageDevelopment,
      },
      {
        key: 'reputation', label: '名声', unit: '',
        thresholds: { D: 24, C: 30, B: 40, A: 50, S: 60 },
        getValue: (s) => s.reputation,
      },
    ],
  },
  {
    day: 252,
    quarter: 3,
    title: '最終準備',
    criteria: [
      {
        key: 'level', label: '錬金Lv', unit: '',
        thresholds: { D: 7, C: 9, B: 10, A: 11, S: 12 },
        getValue: (s) => s.alchemyLevel,
      },
      {
        key: 'quests', label: '依頼', unit: '件',
        thresholds: { D: 22, C: 28, B: 33, A: 38, S: 43 },
        getValue: (s) => s.completedQuestCount,
      },
      {
        key: 'villageDev', label: '村発展', unit: '',
        thresholds: { D: 40, C: 50, B: 58, A: 66, S: 75 },
        getValue: (s) => s.villageDevelopment,
      },
      {
        key: 'reputation', label: '名声', unit: '',
        thresholds: { D: 40, C: 50, B: 58, A: 66, S: 75 },
        getValue: (s) => s.reputation,
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

/** 次の査察を取得（Q4含む） */
export function getNextInspection(day: number): InspectionDef | null {
  return inspections.find((i) => i.day > day) ?? null;
}

/** 次の査察日を取得（Q4含む） */
export function getNextInspectionDay(day: number): number | null {
  return INSPECTION_DAYS.find((d) => d > day) ?? null;
}
