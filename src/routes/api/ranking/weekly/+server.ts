import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface RankingRow {
  id: number;
  player_id: string;
  nickname: string;
  score: number;
  ending_type: string;
  final_day: number;
  bd_money: number;
  bd_inventory: number;
  bd_levels: number;
  bd_quests: number;
  bd_album: number;
  bd_crafting: number;
  bd_buildings: number;
  submitted_at: string;
}

export const GET: RequestHandler = async ({ url, platform }) => {
  const db = platform?.env?.DB;
  if (!db) throw error(503, 'Database not available');

  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  const playerId = url.searchParams.get('playerId') ?? null;

  const weekStart = getWeekStart();

  // エントリ取得
  const entries = await db.prepare(
    `SELECT id, player_id, nickname, score, ending_type, final_day,
            bd_money, bd_inventory, bd_levels, bd_quests, bd_album, bd_crafting, bd_buildings,
            submitted_at
     FROM ranking_entries
     WHERE submitted_at >= ?
     ORDER BY score DESC
     LIMIT ? OFFSET ?`
  ).bind(weekStart, limit, offset).all<RankingRow>();

  // 総件数
  const totalResult = await db.prepare(
    `SELECT COUNT(*) as cnt FROM ranking_entries WHERE submitted_at >= ?`
  ).bind(weekStart).first<{ cnt: number }>();

  // 自分の最高スコア順位
  let myRank: number | null = null;
  let myBestEntry = null;

  if (playerId) {
    const myBest = await db.prepare(
      `SELECT id, player_id, nickname, score, ending_type, final_day,
              bd_money, bd_inventory, bd_levels, bd_quests, bd_album, bd_crafting, bd_buildings,
              submitted_at
       FROM ranking_entries
       WHERE player_id = ? AND submitted_at >= ?
       ORDER BY score DESC LIMIT 1`
    ).bind(playerId, weekStart).first<RankingRow>();

    if (myBest) {
      const rankResult = await db.prepare(
        `SELECT COUNT(*) + 1 as rank FROM ranking_entries
         WHERE submitted_at >= ? AND score > ?`
      ).bind(weekStart, myBest.score).first<{ rank: number }>();

      myRank = rankResult?.rank ?? null;
      myBestEntry = formatEntry(myBest, myRank ?? 0, true);
    }
  }

  const formattedEntries = ((entries.results ?? []) as RankingRow[]).map((row: RankingRow, i: number) =>
    formatEntry(row, offset + i + 1, playerId ? row.player_id === playerId : false)
  );

  return json({
    entries: formattedEntries,
    total: totalResult?.cnt ?? 0,
    myRank,
    myBestEntry,
    weekStart,
  });
};

function formatEntry(row: RankingRow, rank: number, isOwn: boolean) {
  return {
    rank,
    nickname: row.nickname,
    score: row.score,
    endingType: row.ending_type,
    finalDay: row.final_day,
    breakdown: {
      money: row.bd_money,
      inventory: row.bd_inventory,
      levels: row.bd_levels,
      quests: row.bd_quests,
      album: row.bd_album,
      crafting: row.bd_crafting,
      buildings: row.bd_buildings,
    },
    submittedAt: row.submitted_at,
    isOwn,
  };
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().replace('T', ' ').slice(0, 19);
}
