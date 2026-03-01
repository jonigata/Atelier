import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const POST: RequestHandler = async ({ request, platform }) => {
  const db = platform?.env?.DB;
  if (!db) throw error(503, 'Database not available');

  const body = await request.json();
  const { playerId, nickname, score, endingType, finalDay, breakdown, saveData } = body;

  // バリデーション
  if (!playerId || !UUID_RE.test(playerId)) {
    throw error(400, 'Invalid playerId');
  }
  if (typeof score !== 'number' || score < 0 || score > 9999999) {
    throw error(400, 'Invalid score');
  }
  if (typeof finalDay !== 'number' || finalDay < 1 || finalDay > 400) {
    throw error(400, 'Invalid finalDay');
  }
  if (!endingType || typeof endingType !== 'string') {
    throw error(400, 'Invalid endingType');
  }

  const nick = (typeof nickname === 'string' && nickname.trim().length > 0)
    ? nickname.trim().slice(0, 12)
    : '名無しの錬金術師';

  const bd = breakdown ?? {};

  // レートリミット: 同一playerId 5分以内の連続投稿拒否
  const recentCheck = await db.prepare(
    `SELECT COUNT(*) as cnt FROM ranking_entries
     WHERE player_id = ? AND submitted_at > datetime('now', '-5 minutes')`
  ).bind(playerId).first<{ cnt: number }>();

  if (recentCheck && recentCheck.cnt > 0) {
    throw error(429, 'Too many submissions. Please wait 5 minutes.');
  }

  // 挿入
  const result = await db.prepare(
    `INSERT INTO ranking_entries
     (player_id, nickname, score, ending_type, final_day,
      bd_money, bd_inventory, bd_levels, bd_quests, bd_album, bd_crafting, bd_buildings,
      save_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    playerId, nick, score, endingType, finalDay,
    bd.money ?? 0, bd.inventory ?? 0, bd.levels ?? 0,
    bd.quests ?? 0, bd.album ?? 0, bd.crafting ?? 0, bd.buildings ?? 0,
    saveData ? JSON.stringify(saveData) : null
  ).run();

  const entryId = result.meta?.last_row_id;

  // 順位算出
  const weekStart = getWeekStart();

  const weeklyRankResult = await db.prepare(
    `SELECT COUNT(*) + 1 as rank FROM ranking_entries
     WHERE submitted_at >= ? AND score > ?`
  ).bind(weekStart, score).first<{ rank: number }>();

  const totalRankResult = await db.prepare(
    `SELECT COUNT(*) + 1 as rank FROM ranking_entries WHERE score > ?`
  ).bind(score).first<{ rank: number }>();

  return json({
    success: true,
    entryId,
    weeklyRank: weeklyRankResult?.rank ?? null,
    totalRank: totalRankResult?.rank ?? null,
  });
};

function getWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // 月曜始まり
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().replace('T', ' ').slice(0, 19);
}
