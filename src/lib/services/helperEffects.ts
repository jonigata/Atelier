import { get } from 'svelte/store';
import { gameState, restoreStamina, addMessage } from '$lib/stores/game';
import { getHelper } from '$lib/data/helpers';

/**
 * 助手の効果値を取得するユーティリティ
 * 全所有助手の指定フィールドの値を合算
 */
function sumHelperEffect(field: 'craftSuccessBonus' | 'craftQualityBonus' | 'expeditionDropBonus' | 'expeditionRareBonus' | 'morningStamina' | 'staminaCostReduction' | 'rareEventBonus'): number {
  const state = get(gameState);
  let total = 0;
  for (const owned of state.ownedHelpers) {
    const def = getHelper(owned.helperId);
    if (!def) continue;
    const levelIdx = owned.level - 1;
    total += def[field][levelIdx] ?? 0;
  }
  return total;
}

/**
 * 助手の乗数効果を取得するユーティリティ
 * 全所有助手の指定フィールドの乗数を掛け合わせ
 */
function multHelperEffect(field: 'buyPriceMult' | 'sellPriceMult'): number {
  const state = get(gameState);
  let mult = 1;
  for (const owned of state.ownedHelpers) {
    const def = getHelper(owned.helperId);
    if (!def) continue;
    const levelIdx = owned.level - 1;
    mult *= def[field][levelIdx] ?? 1;
  }
  return mult;
}

export function getHelperCraftSuccessBonus(): number {
  return sumHelperEffect('craftSuccessBonus');
}

export function getHelperCraftQualityBonus(): number {
  return sumHelperEffect('craftQualityBonus');
}

export function getHelperExpeditionDropBonus(): number {
  return sumHelperEffect('expeditionDropBonus');
}

export function getHelperExpeditionRareBonus(): number {
  return sumHelperEffect('expeditionRareBonus');
}

export function getHelperMorningStamina(): number {
  return sumHelperEffect('morningStamina');
}

export function getHelperStaminaCostReduction(): number {
  return sumHelperEffect('staminaCostReduction');
}

export function getHelperBuyPriceMult(): number {
  return multHelperEffect('buyPriceMult');
}

export function getHelperSellPriceMult(): number {
  return multHelperEffect('sellPriceMult');
}

/**
 * 朝フェーズ：助手の毎朝スタミナ回復
 */
export function processHelperMorningStamina(): void {
  const amount = getHelperMorningStamina();
  if (amount > 0) {
    restoreStamina(amount);
    addMessage(`助手の力で体力が${amount}回復した`);
  }
}
