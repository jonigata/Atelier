import type { ScoreBreakdown } from './score';
import type { GameState } from '$lib/models/types';

const PLAYER_ID_KEY = 'atelier_player_id';
const NICKNAME_KEY = 'atelier_nickname';

export function getPlayerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getNickname(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(NICKNAME_KEY) ?? '';
}

export function saveNickname(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NICKNAME_KEY, name);
}

export interface RankingEntry {
  rank: number;
  nickname: string;
  score: number;
  endingType: string;
  finalDay: number;
  breakdown: {
    money: number;
    inventory: number;
    levels: number;
    quests: number;
    album: number;
    crafting: number;
    buildings: number;
  };
  submittedAt: string;
  isOwn: boolean;
}

export interface RankingListResponse {
  entries: RankingEntry[];
  total: number;
  myRank: number | null;
  myBestEntry: RankingEntry | null;
  weekStart?: string;
}

export interface SubmitResponse {
  success: boolean;
  entryId: number;
  weeklyRank: number | null;
  totalRank: number | null;
}

export async function submitScore(
  nickname: string,
  score: number,
  endingType: string,
  finalDay: number,
  breakdown: ScoreBreakdown,
  saveData: GameState,
): Promise<SubmitResponse> {
  const res = await fetch('/api/ranking/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId: getPlayerId(),
      nickname: nickname || '名無しの錬金術師',
      score,
      endingType,
      finalDay,
      breakdown: {
        money: breakdown.money,
        inventory: breakdown.inventory,
        levels: breakdown.levels,
        quests: breakdown.quests,
        album: breakdown.album,
        crafting: breakdown.crafting,
        buildings: breakdown.buildings,
      },
      saveData,
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchRanking(
  type: 'weekly' | 'total',
  opts: { limit?: number; offset?: number } = {},
): Promise<RankingListResponse> {
  const params = new URLSearchParams();
  if (opts.limit) params.set('limit', String(opts.limit));
  if (opts.offset) params.set('offset', String(opts.offset));

  const playerId = getPlayerId();
  if (playerId) params.set('playerId', playerId);

  const res = await fetch(`/api/ranking/${type}?${params}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ranking: HTTP ${res.status}`);
  }
  return res.json();
}
