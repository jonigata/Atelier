import type { DailyScoreEntry } from '$lib/models/types';

const STORAGE_KEY = 'atelier_past_scores';
const MAX_PAST_GAMES = 10;

export interface PastGameScoreRecord {
  finishedAt: string;
  endingType: string;
  finalDay: number;
  finalScore: number;
  dailyScores: DailyScoreEntry[];
}

/** 完了したゲームのスコア履歴をlocalStorageに保存 */
export function savePastGameScores(
  scoreHistory: DailyScoreEntry[],
  endingType: string,
  finalDay: number,
  finalScore: number,
): void {
  const record: PastGameScoreRecord = {
    finishedAt: new Date().toISOString(),
    endingType,
    finalDay,
    finalScore,
    dailyScores: scoreHistory,
  };

  const existing = loadPastGameScores();
  existing.push(record);

  // 最大件数を超えたら古い方から削除
  while (existing.length > MAX_PAST_GAMES) {
    existing.shift();
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage容量不足等 - 静かに失敗
  }
}

/** 過去ゲームのスコア記録をlocalStorageから読み込み */
export function loadPastGameScores(): PastGameScoreRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/** テスト用: 嘘の過去ゲームデータを1件追加 */
export function addFakePastScore(): void {
  const existing = loadPastGameScores();
  const n = existing.length;

  // バリエーション: 短い/中/長いゲームをローテーション
  const patterns = [
    { days: 28, start: 860, end: 2500 + Math.random() * 2000, type: 'retire' },
    { days: 28, start: 860, end: 4000 + Math.random() * 3000, type: 'provisional' },
    { days: 336, start: 860, end: 25000 + Math.random() * 25000, type: 'good' },
  ];
  const p = patterns[n % patterns.length];

  const record: PastGameScoreRecord = {
    finishedAt: new Date().toISOString(),
    endingType: p.type,
    finalDay: p.days,
    finalScore: Math.round(p.end),
    dailyScores: generateFakeCurve(p.days, p.start, p.end, 0.4 + Math.random() * 0.3),
  };

  existing.push(record);
  while (existing.length > MAX_PAST_GAMES) existing.shift();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch { /* ignore */ }
}

/** 嘘のスコアカーブを生成（緩やかなS字カーブ + ノイズ） */
function generateFakeCurve(days: number, startScore: number, endScore: number, noise: number): DailyScoreEntry[] {
  const entries: DailyScoreEntry[] = [];
  for (let d = 1; d <= days; d++) {
    const t = d / days;
    // S字カーブ: 序盤ゆっくり → 中盤加速 → 終盤ゆっくり
    const s = t * t * (3 - 2 * t);
    const base = startScore + (endScore - startScore) * s;
    const jitter = (Math.sin(d * 7.3) * 0.5 + Math.sin(d * 3.1) * 0.3) * noise * (endScore - startScore) * 0.05;
    entries.push({ day: d, total: Math.round(Math.max(0, base + jitter)) });
  }
  return entries;
}
