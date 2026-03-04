import { get, writable } from 'svelte/store';
import { gameState } from '$lib/stores/game';
import { calcLevelFromExp, STAMINA } from '$lib/data/balance';
import { getBuilding } from '$lib/data/buildings';
import type { GameState } from '$lib/models/types';

/** セーブ/ロードインジケータ表示用 */
export const saveIndicator = writable<string | null>(null);
let indicatorTimer: ReturnType<typeof setTimeout> | null = null;

function flashIndicator(msg: string, durationMs = 1500): void {
  if (indicatorTimer) clearTimeout(indicatorTimer);
  saveIndicator.set(msg);
  indicatorTimer = setTimeout(() => saveIndicator.set(null), durationMs);
}

const STORAGE_KEY_PREFIX = 'atelier_save_slot_';
const AUTOSAVE_KEY = 'atelier_autosave';
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
    autoSave();
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

  // unlockedAreas: 旧セーブデータに存在しない場合の補完
  if (!state.unlockedAreas) {
    (state as any).unlockedAreas = ['lake'];
  }

  // maxStamina: 建物ボーナスを反映して再計算
  let staminaBonus = 0;
  for (const owned of state.buildings) {
    const def = getBuilding(owned.buildingId);
    if (!def) continue;
    const levelData = def.levels[owned.level - 1];
    if (levelData) {
      for (const effect of levelData.effects) {
        if (effect.type === 'max_stamina_bonus') staminaBonus += effect.value;
      }
    }
  }
  state.maxStamina = STAMINA.INITIAL_MAX + staminaBonus;
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

// ==================== 本番用オートセーブ ====================

/** 毎日の開始時に自動セーブ（1スロットのみ） */
export function autoSave(): void {
  try {
    const state = get(gameState);
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
    flashIndicator('セーブしました');
  } catch {
    // localStorage容量超過等は無視
  }
}

/** リロード時にオートセーブからロード。成功でtrue */
export function autoLoad(): boolean {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return false;
    const state: GameState = JSON.parse(raw);
    migrateState(state);
    gameState.set(state);
    flashIndicator('ロードしました');
    return true;
  } catch {
    return false;
  }
}

/** オートセーブデータを削除 */
export function clearAutoSave(): void {
  localStorage.removeItem(AUTOSAVE_KEY);
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
