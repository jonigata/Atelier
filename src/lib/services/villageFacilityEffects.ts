import { get } from 'svelte/store';
import { gameState, addItem, addMessage, addMorningEvent } from '$lib/stores/game';
import { getVillageFacility } from '$lib/data/villageFacilities';
import { getItem } from '$lib/data/items';
import type { VillageFacilityEffect } from '$lib/models/types';

/**
 * 所有施設の全効果を取得
 */
function getAllFacilityEffects(): VillageFacilityEffect[] {
  const state = get(gameState);
  const effects: VillageFacilityEffect[] = [];
  for (const fId of state.villageFacilities) {
    const def = getVillageFacility(fId);
    if (def) effects.push(...def.effects);
  }
  return effects;
}

/**
 * 施設の調合成功率ボーナス合計
 */
export function getVillageCraftSuccessBonus(): number {
  return getAllFacilityEffects()
    .filter((e) => e.type === 'craft_success')
    .reduce((sum, e) => sum + e.value, 0);
}

/**
 * 施設の調合品質ボーナス合計
 */
export function getVillageCraftQualityBonus(): number {
  return getAllFacilityEffects()
    .filter((e) => e.type === 'craft_quality')
    .reduce((sum, e) => sum + e.value, 0);
}

/**
 * 施設の勉強日数短縮合計
 */
export function getVillageStudyDaysReduce(): number {
  return getAllFacilityEffects()
    .filter((e) => e.type === 'study_days_reduce')
    .reduce((sum, e) => sum + e.value, 0);
}

/**
 * 施設の休息ボーナス合計
 */
export function getVillageRestBonus(): number {
  return getAllFacilityEffects()
    .filter((e) => e.type === 'rest_bonus')
    .reduce((sum, e) => sum + e.value, 0);
}

/**
 * 施設の採取ドロップボーナス合計
 */
export function getVillageExpeditionBonus(): number {
  return getAllFacilityEffects()
    .filter((e) => e.type === 'expedition_bonus')
    .reduce((sum, e) => sum + e.value, 0);
}

/**
 * 施設の売値ボーナス合計（乗数として返す）
 */
export function getVillageSellPriceMult(): number {
  const bonus = getAllFacilityEffects()
    .filter((e) => e.type === 'sell_price')
    .reduce((sum, e) => sum + e.value, 0);
  return 1 + bonus;
}

/**
 * 施設の買値割引合計（乗数として返す）
 */
export function getVillageBuyPriceMult(): number {
  const discount = getAllFacilityEffects()
    .filter((e) => e.type === 'buy_price')
    .reduce((sum, e) => sum + e.value, 0);
  return Math.max(0.5, 1 - discount);
}

/**
 * 朝フェーズ：施設からのアイテム生成
 */
export function processFacilityMorningItems(): void {
  const state = get(gameState);
  const generatedItems: string[] = [];

  for (const fId of state.villageFacilities) {
    const def = getVillageFacility(fId);
    if (!def) continue;

    for (const effect of def.effects) {
      if (effect.type === 'daily_item' && effect.itemId) {
        const itemDef = getItem(effect.itemId);
        const quality = 20 + Math.floor(Math.random() * 30); // 品質20-49
        for (let i = 0; i < effect.value; i++) {
          addItem({
            itemId: effect.itemId,
            quality,
            origin: { type: 'reward', day: state.day, flavorText: `${def.name}から入手` },
          });
        }
        if (itemDef) generatedItems.push(itemDef.name);
      }

      if (effect.type === 'periodic_item' && effect.itemId && effect.interval) {
        if ((state.day - 1) % effect.interval === 0) {
          const itemDef = getItem(effect.itemId);
          const quality = 25 + Math.floor(Math.random() * 30); // 品質25-54
          for (let i = 0; i < effect.value; i++) {
            addItem({
              itemId: effect.itemId,
              quality,
              origin: { type: 'reward', day: state.day, flavorText: `${def.name}から入手` },
            });
          }
          if (itemDef) generatedItems.push(itemDef.name);
        }
      }
    }
  }

  if (generatedItems.length > 0) {
    const msg = `施設から入手: ${generatedItems.join('、')}`;
    addMessage(msg);
    addMorningEvent({ type: 'expedition_return', message: msg, data: [] });
  }
}
