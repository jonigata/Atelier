import { get } from 'svelte/store';
import { gameState } from '$lib/stores/game';
import { calcLevelFromExp } from '$lib/data/balance';
import type { GameState } from '$lib/models/types';

const STORAGE_KEY_PREFIX = 'atelier_save_slot_';
const MAX_SLOTS = 10;

export interface SaveSlotMeta {
  slotIndex: number;
  savedAt: string;       // ISO date string
  day: number;
  alchemyLevel: number;
  money: number;
  playerName: string;
  label: string;         // ユーザーが付けるラベル（空文字可）
  memo: string;          // ユーザーメモ（複数行可）
}

interface SaveData {
  meta: SaveSlotMeta;
  state: GameState;
}

function slotKey(index: number): string {
  return `${STORAGE_KEY_PREFIX}${index}`;
}

/** 全スロットのメタ情報を取得（空スロットはnull） */
export function getAllSlotMeta(): (SaveSlotMeta | null)[] {
  const result: (SaveSlotMeta | null)[] = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    const raw = localStorage.getItem(slotKey(i));
    if (raw) {
      try {
        const data: SaveData = JSON.parse(raw);
        result.push(data.meta);
      } catch {
        result.push(null);
      }
    } else {
      result.push(null);
    }
  }
  return result;
}

/** 指定スロットにセーブ */
export function saveToSlot(index: number, label: string = '', memo: string = ''): SaveSlotMeta {
  if (index < 0 || index >= MAX_SLOTS) throw new Error(`Invalid slot index: ${index}`);

  const state = get(gameState);
  const meta: SaveSlotMeta = {
    slotIndex: index,
    savedAt: new Date().toISOString(),
    day: state.day,
    alchemyLevel: calcLevelFromExp(state.alchemyExp),
    money: state.money,
    playerName: state.playerName,
    label,
    memo,
  };

  const data: SaveData = { meta, state };
  localStorage.setItem(slotKey(index), JSON.stringify(data));
  return meta;
}

/** 指定スロットからロード */
export function loadFromSlot(index: number): boolean {
  if (index < 0 || index >= MAX_SLOTS) return false;

  const raw = localStorage.getItem(slotKey(index));
  if (!raw) return false;

  try {
    const data: SaveData = JSON.parse(raw);
    migrateState(data.state);
    gameState.set(data.state);
    return true;
  } catch {
    return false;
  }
}

/** 旧フォーマットのセーブデータを現行形式にマイグレーション */
function migrateState(state: GameState): void {
  // buildings: string[] → OwnedBuilding[] マイグレーション
  if (Array.isArray(state.buildings) && state.buildings.length > 0 && typeof state.buildings[0] === 'string') {
    state.buildings = (state.buildings as unknown as string[]).map((id) => ({ buildingId: id, level: 1 }));
  }

  // scoreHistory: 旧セーブデータに存在しない場合の補完
  if (!state.scoreHistory) {
    (state as any).scoreHistory = [];
  }
}

/** 指定スロットを削除 */
export function deleteSlot(index: number): void {
  if (index < 0 || index >= MAX_SLOTS) return;
  localStorage.removeItem(slotKey(index));
}

/** スロットのラベルを更新 */
export function updateSlotLabel(index: number, label: string): void {
  const raw = localStorage.getItem(slotKey(index));
  if (!raw) return;

  try {
    const data: SaveData = JSON.parse(raw);
    data.meta.label = label;
    localStorage.setItem(slotKey(index), JSON.stringify(data));
  } catch {
    // ignore
  }
}

/** スロットのメモを更新 */
export function updateSlotMemo(index: number, memo: string): void {
  const raw = localStorage.getItem(slotKey(index));
  if (!raw) return;

  try {
    const data: SaveData = JSON.parse(raw);
    data.meta.memo = memo;
    localStorage.setItem(slotKey(index), JSON.stringify(data));
  } catch {
    // ignore
  }
}
