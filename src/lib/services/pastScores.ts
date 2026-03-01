import type { DailyScoreEntry } from '$lib/models/types';

const STORAGE_KEY = 'atelier_past_scores';
const MAX_RECORDS = 1000;
const DISPLAY_LIMIT = 10;

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

  const existing = loadAllPastGameScores();
  existing.push(record);

  // 安全弁: 1000件超えたら古い方から削除
  while (existing.length > MAX_RECORDS) {
    existing.shift();
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage容量不足等 - 静かに失敗
  }
}

/** 全件読み込み（内部用） */
function loadAllPastGameScores(): PastGameScoreRecord[] {
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

/** チャート表示用: 最新10件を返す */
export function loadPastGameScores(): PastGameScoreRecord[] {
  const all = loadAllPastGameScores();
  return all.slice(-DISPLAY_LIMIT);
}

/** 全件削除 */
export function clearAllPastGameScores(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** 全件数を返す */
export function countPastGameScores(): number {
  return loadAllPastGameScores().length;
}

/** 全期間の最高スコア記録を返す（なければnull） */
export function loadBestPastGame(): PastGameScoreRecord | null {
  const all = loadAllPastGameScores();
  if (all.length === 0) return null;
  return all.reduce((best, g) => g.finalScore > best.finalScore ? g : best);
}

/** テスト用: 嘘の過去ゲームデータを1件追加 */
export function addFakePastScore(): void {
  const existing = loadAllPastGameScores();

  const r = Math.random();
  const types = ['retire', 'provisional', 'good', 'normal', 'mediocre', 'fail'];
  const endingType = types[Math.floor(Math.random() * types.length)];

  // 日数: 7〜336でランダム（短めに偏る分布）
  const days = r < 0.3
    ? Math.floor(7 + Math.random() * 21)       // 7〜28日 (30%)
    : r < 0.6
    ? Math.floor(28 + Math.random() * 100)     // 28〜128日 (30%)
    : Math.floor(128 + Math.random() * 208);   // 128〜336日 (40%)

  const start = 800 + Math.random() * 200;
  const end = start + Math.random() * days * (80 + Math.random() * 80);
  const noise = 0.2 + Math.random() * 0.6;

  const record: PastGameScoreRecord = {
    finishedAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
    endingType,
    finalDay: days,
    finalScore: Math.round(end),
    dailyScores: generateFakeCurve(days, start, end, noise),
  };

  existing.push(record);
  while (existing.length > MAX_RECORDS) existing.shift();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch { /* ignore */ }
}

/** 嘘のスコアカーブを生成（基本単調増加、たまに微減） */
function generateFakeCurve(days: number, startScore: number, endScore: number, _noise: number): DailyScoreEntry[] {
  const entries: DailyScoreEntry[] = [];
  let current = startScore;
  const dailyGain = (endScore - startScore) / days;
  for (let d = 1; d <= days; d++) {
    const r = Math.random();
    if (r < 0.2) {
      // 20%の確率で微減
      current -= dailyGain * (0.3 + Math.random() * 0.7);
    } else {
      // 80%は増加（ばらつきあり）
      current += dailyGain * (0.5 + Math.random() * 1.0);
    }
    entries.push({ day: d, total: Math.round(Math.max(startScore * 0.8, current)) });
  }
  return entries;
}
