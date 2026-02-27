/**
 * 週替わりショップ特売システム
 * バーゲンセール（購入割引）と高価買取（売却ボーナス）を管理
 */

import { items } from '$lib/data/items';
import { SHOP_DEALS } from '$lib/data/balance';
import { getWeek } from '$lib/services/calendar';
import type { ItemDef } from '$lib/models/types';

/** Mulberry32 seeded PRNG */
function seededRandom(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** seeded Fisher-Yates shuffle */
function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 村発展レベルに応じた購入可能素材リスト（ShopPanelと同じロジック） */
function getBuyableMaterialIds(villageLv: number): string[] {
  const allMaterials = Object.values(items).filter(
    (item) => item.category !== 'product'
  );

  return allMaterials
    .filter((item) => {
      if (villageLv <= 1) {
        return ['herb_01', 'water_01', 'oil_seed', 'hemp_fiber', 'magic_wood'].includes(item.id);
      }
      if (villageLv <= 3) {
        return ['herb_01', 'herb_02', 'water_01', 'ore_01', 'oil_seed', 'hemp_fiber', 'magic_wood'].includes(item.id);
      }
      if (villageLv <= 6) {
        return ['herb_01', 'herb_02', 'water_01', 'ore_01', 'misc_01', 'oil_seed', 'hemp_fiber', 'magic_wood'].includes(item.id);
      }
      return true;
    })
    .map((item) => item.id);
}

/** 今週のバーゲンセール対象アイテムID（最大3個） */
export function getBargainItems(day: number, villageLv: number): string[] {
  const week = getWeek(day);
  const rng = seededRandom(week * 7919);
  const pool = getBuyableMaterialIds(villageLv);
  if (pool.length === 0) return [];
  const shuffled = seededShuffle(pool, rng);
  return shuffled.slice(0, Math.min(SHOP_DEALS.BARGAIN_COUNT, pool.length));
}

/** 村発展度に応じた高価買取アイテムの価格帯 */
function getPremiumPriceRange(villageLv: number): { min: number; max: number } {
  if (villageLv <= 2) return { min: 0, max: 100 };
  if (villageLv <= 4) return { min: 20, max: 200 };
  if (villageLv <= 6) return { min: 50, max: 500 };
  if (villageLv <= 9) return { min: 80, max: 1000 };
  if (villageLv <= 12) return { min: 150, max: 3000 };
  if (villageLv <= 15) return { min: 300, max: 8000 };
  return { min: 500, max: Infinity };
}

/** 今週の高価買取対象アイテムID（最大3個、村発展度で価格帯が変動） */
export function getPremiumPurchaseItems(day: number, villageLv: number): string[] {
  const week = getWeek(day);
  const rng = seededRandom(week * 13331);
  const { min, max } = getPremiumPriceRange(villageLv);
  const pool = Object.values(items)
    .filter((item) => item.basePrice >= min && item.basePrice <= max)
    .map((item) => item.id);
  if (pool.length === 0) return [];
  const shuffled = seededShuffle(pool, rng);
  return shuffled.slice(0, Math.min(SHOP_DEALS.PREMIUM_COUNT, pool.length));
}
