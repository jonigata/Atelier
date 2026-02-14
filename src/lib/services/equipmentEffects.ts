/**
 * 機材効果サービス
 * 所持している機材の効果をデータドリブンに集約・適用する
 */
import { get, writable } from 'svelte/store';
import { gameState, addItem, addMessage } from '$lib/stores/game';
import { getEquipment } from '$lib/data/equipment';
import { getItem } from '$lib/data/items';
import type {
  EquipmentEffect,
  OwnedItem,
  RecipeDef,
  RecipeBookDef,
  ItemCategory,
} from '$lib/models/types';

// =====================================================================
// 一時的な状態（セーブ不要）
// =====================================================================

/** 調合コンボカウンタ */
export const craftCombo = writable(0);

/** レシピ別の失敗蓄積（レシピID → 蓄積回数） */
export const failAccumulation = writable<Record<string, number>>({});

/** 同日売却カウンタ（日 → 売却数） */
export const dailySellCount = writable<{ day: number; count: number }>({ day: 0, count: 0 });

// =====================================================================
// コア: 所持機材からeffectsを収集
// =====================================================================

/** 所持機材の全効果を取得 */
function getAllOwnedEffects(): EquipmentEffect[] {
  const state = get(gameState);
  const effects: EquipmentEffect[] = [];
  for (const eqId of state.ownedEquipment) {
    const def = getEquipment(eqId);
    if (def) {
      effects.push(...def.effects);
    }
  }
  return effects;
}

/** 特定typeの効果だけ取得 */
function getEffectsOfType<T extends EquipmentEffect['type']>(
  effectType: T
): Extract<EquipmentEffect, { type: T }>[] {
  return getAllOwnedEffects().filter(
    (e): e is Extract<EquipmentEffect, { type: T }> => e.type === effectType
  );
}

// =====================================================================
// 確率ボーナス
// =====================================================================

/** 全確率判定へのボーナス */
export function getAllProbabilityBonus(): number {
  return getEffectsOfType('all_probability_bonus').reduce((sum, e) => sum + e.value, 0);
}

// =====================================================================
// 調合: 成功率
// =====================================================================

/** 機材による成功率ボーナス */
export function getCraftSuccessBonus(): number {
  return getEffectsOfType('craft_success_bonus').reduce((sum, e) => sum + e.value, 0);
}

/** 失敗蓄積による成功率ボーナス */
export function getFailAccumulationBonus(recipeId: string): number {
  const accum = get(failAccumulation);
  const count = accum[recipeId] || 0;
  if (count === 0) return 0;
  const rates = getEffectsOfType('craft_fail_accumulate');
  if (rates.length === 0) return 0;
  const totalRate = rates.reduce((sum, e) => sum + e.rate, 0);
  return count * totalRate;
}

// =====================================================================
// 調合: 品質
// =====================================================================

/** 機材による品質ボーナス */
export function getCraftQualityBonus(): number {
  return getEffectsOfType('craft_quality_bonus').reduce((sum, e) => sum + e.value, 0);
}

/** 品質上限（デフォルト100） */
export function getQualityCap(): number {
  const caps = getEffectsOfType('craft_quality_cap');
  if (caps.length === 0) return 100;
  return Math.max(100, ...caps.map((e) => e.cap));
}

/** 低品質素材の失敗閾値リスト（この品質以下の素材があると失敗） */
export function getFailBelowQualityThresholds(): number[] {
  return getEffectsOfType('craft_quality_cap')
    .filter((e) => e.failBelowQuality !== undefined)
    .map((e) => e.failBelowQuality!);
}

/** 品質ランダム幅の乗数 */
export function getQualityVarianceMult(): number {
  const mults = getEffectsOfType('craft_quality_variance_mult');
  if (mults.length === 0) return 1;
  return mults.reduce((m, e) => m * e.value, 1);
}

/** コンボによる品質ボーナス */
export function getComboQualityBonus(): number {
  const combos = getEffectsOfType('craft_combo');
  if (combos.length === 0) return 0;
  const currentCombo = get(craftCombo);
  let total = 0;
  for (const combo of combos) {
    const effectiveCombo = combo.maxCombo ? Math.min(currentCombo, combo.maxCombo) : currentCombo;
    total += effectiveCombo * combo.bonusPerCombo;
  }
  return total;
}

// =====================================================================
// 調合: 素材品質の補正
// =====================================================================

/** 素材品質の底上げ閾値（最も高い値を返す） */
export function getMaterialQualityFloor(): number {
  const floors = getEffectsOfType('material_quality_floor');
  if (floors.length === 0) return 0;
  return Math.max(...floors.map((e) => e.value));
}

/** 素材品質への固定ボーナス */
export function getMaterialQualityBonus(): number {
  return getEffectsOfType('material_quality_bonus').reduce((sum, e) => sum + e.value, 0);
}

/** 素材の実効品質を計算（底上げ＋ボーナス適用） */
export function getEffectiveMaterialQuality(originalQuality: number): number {
  const floor = getMaterialQualityFloor();
  const bonus = getMaterialQualityBonus();
  return Math.max(originalQuality, floor) + bonus;
}

// =====================================================================
// 調合: 体力コスト
// =====================================================================

/** 体力コスト乗数 */
export function getStaminaCostMult(): number {
  const mults = getEffectsOfType('craft_stamina_mult');
  if (mults.length === 0) return 1;
  return Math.max(0.1, 1 + mults.reduce((sum, e) => sum + (e.value - 1), 0));
}

// =====================================================================
// 調合: 日数
// =====================================================================

/** 調合日数を計算 */
export function getEffectiveCraftDays(recipe: RecipeDef): number {
  let days = recipe.daysRequired;

  // 半減
  const halves = getEffectsOfType('craft_days_halve');
  if (halves.length > 0) {
    days = Math.ceil(days / 2);
  }

  // 固定短縮
  const reduces = getEffectsOfType('craft_days_reduce');
  for (const r of reduces) {
    if (r.minOriginalDays && recipe.daysRequired < r.minOriginalDays) continue;
    days -= r.value;
  }

  return Math.max(1, days);
}

// =====================================================================
// 調合: 複製
// =====================================================================

/** 複製判定を実行し、複製アイテムがあれば追加する */
export function tryDuplicate(item: OwnedItem): OwnedItem | null {
  const duplicates = getEffectsOfType('craft_duplicate');
  const probBonus = getAllProbabilityBonus();

  for (const dup of duplicates) {
    if (Math.random() < dup.chance + probBonus) {
      const variance = Math.floor(Math.random() * (dup.qualityVariance * 2 + 1)) - dup.qualityVariance;
      const newQuality = Math.max(1, Math.min(getQualityCap(), item.quality + variance));
      const duplicated: OwnedItem = {
        itemId: item.itemId,
        quality: newQuality,
        origin: item.origin,
      };
      addItem(duplicated);
      const itemDef = getItem(item.itemId);
      addMessage(`機材効果で${itemDef?.name || item.itemId}がもう1個生成された！（品質${newQuality}）`);
      return duplicated;
    }
  }
  return null;
}

// =====================================================================
// 調合: 失敗時の処理
// =====================================================================

/** 失敗時に素材を保全するか判定 */
export function shouldSaveMaterials(): boolean {
  const saves = getEffectsOfType('craft_fail_save');
  const probBonus = getAllProbabilityBonus();
  for (const save of saves) {
    if (Math.random() < save.chance + probBonus) {
      return true;
    }
  }
  return false;
}

/** 失敗時に回収できる素材数 */
export function getFailRecoverCount(): number {
  return getEffectsOfType('craft_fail_recover').reduce((sum, e) => sum + e.count, 0);
}

/** 低品質素材で失敗するかチェック */
export function checkLowQualityFail(materials: OwnedItem[]): boolean {
  const thresholds = getFailBelowQualityThresholds();
  if (thresholds.length === 0) return false;
  const maxThreshold = Math.max(...thresholds);
  return materials.some((m) => m.quality <= maxThreshold);
}

/** 失敗蓄積を更新 */
export function recordFailure(recipeId: string): void {
  const accums = getEffectsOfType('craft_fail_accumulate');
  if (accums.length === 0) return;
  failAccumulation.update((acc) => ({
    ...acc,
    [recipeId]: (acc[recipeId] || 0) + 1,
  }));
}

/** 成功時: コンボを進め、失敗蓄積をリセット */
export function recordSuccess(recipeId: string): void {
  const combos = getEffectsOfType('craft_combo');
  if (combos.length > 0) {
    craftCombo.update((c) => c + 1);
  }
  // 成功したら蓄積リセット
  failAccumulation.update((acc) => {
    const next = { ...acc };
    delete next[recipeId];
    return next;
  });
}

/** 失敗時: コンボリセット */
export function resetCombo(): void {
  craftCombo.set(0);
}

// =====================================================================
// 素材数の軽減
// =====================================================================

/** レシピの必要素材数を効果適用後の値で返す */
export function getEffectiveIngredientCount(originalCount: number): number {
  const reduces = getEffectsOfType('material_count_reduce');
  let reduction = 0;
  for (const r of reduces) {
    if (r.minOriginalCount && originalCount < r.minOriginalCount) continue;
    reduction += r.value;
  }
  return Math.max(1, originalCount - reduction);
}

// =====================================================================
// 勉強日数
// =====================================================================

/** 勉強日数を計算 */
export function getEffectiveStudyDays(book: RecipeBookDef, maxRecipeLevel?: number): number {
  // 即日習得チェック
  const instants = getEffectsOfType('study_instant');
  for (const inst of instants) {
    if (inst.maxLevel === undefined || (maxRecipeLevel !== undefined && maxRecipeLevel <= inst.maxLevel)) {
      return 0;
    }
  }

  let days = book.studyDays;
  const reduces = getEffectsOfType('study_days_reduce');
  for (const r of reduces) {
    days -= r.value;
  }
  return Math.max(1, days);
}

// =====================================================================
// 行動回数（2回行動）
// =====================================================================

/** 今日2回行動可能かどうか */
export function canExtraAction(currentDay: number): boolean {
  const extras = getEffectsOfType('action_extra');
  for (const extra of extras) {
    if (currentDay % extra.frequency === 0) {
      return true;
    }
  }
  return false;
}

/** 2回目の行動の体力消費乗数 */
export function getExtraActionStaminaMult(): number {
  const extras = getEffectsOfType('action_extra');
  if (extras.length === 0) return 1;
  return Math.max(...extras.map((e) => e.staminaMult));
}

// =====================================================================
// 採取
// =====================================================================

/** 採取ドロップ数の乗数 */
export function getExpeditionDropsMult(itemCategory?: ItemCategory): number {
  const effects = getEffectsOfType('expedition_drops_mult');
  let mult = 1;
  for (const e of effects) {
    if (e.materialCategory && e.materialCategory !== itemCategory) continue;
    mult += e.value - 1; // value=2.0 → +1.0, value=1.5 → +0.5
  }
  return mult;
}

/** 採取レア素材確率ボーナス */
export function getExpeditionRareBonus(): number {
  return getEffectsOfType('expedition_rare_bonus').reduce((sum, e) => sum + e.value, 0)
    + getAllProbabilityBonus();
}

// =====================================================================
// 経済: 売却
// =====================================================================

/** 売却価格の乗数 */
export function getSellPriceMult(item: OwnedItem): number {
  const effects = getEffectsOfType('sell_price_mult');
  let bonus = 0;
  for (const e of effects) {
    if (e.minQuality && item.quality < e.minQuality) continue;
    if (e.itemCategory) {
      const itemDef = getItem(item.itemId);
      if (itemDef?.category !== e.itemCategory) continue;
    }
    bonus += e.value;
  }

  // 同日売却ボーナス
  const dayBonuses = getEffectsOfType('sell_same_day_bonus');
  const daily = get(dailySellCount);
  const state = get(gameState);
  if (daily.day === state.day) {
    for (const db of dayBonuses) {
      if (daily.count >= db.minCount) {
        bonus += db.value;
      }
    }
  }

  return 1 + bonus;
}

/** 売却カウンタを更新 */
export function recordSell(): void {
  const state = get(gameState);
  dailySellCount.update((d) => {
    if (d.day !== state.day) {
      return { day: state.day, count: 1 };
    }
    return { ...d, count: d.count + 1 };
  });
}

// =====================================================================
// 経済: 購入
// =====================================================================

/** 購入価格の乗数 */
export function getBuyPriceMult(): number {
  const effects = getEffectsOfType('buy_price_mult');
  let discount = 0;
  for (const e of effects) {
    discount += 1 - e.value; // value=0.9 → discount +0.1
  }
  return Math.max(0.5, 1 - discount);
}

// =====================================================================
// 経済: 依頼報酬
// =====================================================================

/** 依頼金銭報酬の乗数 */
export function getQuestMoneyMult(): number {
  const effects = getEffectsOfType('quest_money_mult');
  return 1 + effects.reduce((sum, e) => sum + (e.value - 1), 0);
}

/** 依頼名声ボーナス */
export function getQuestReputationBonus(): number {
  return getEffectsOfType('quest_reputation_bonus').reduce((sum, e) => sum + e.value, 0);
}

/** 高品質納品ボーナスを計算 */
export function getQuestQualityBonus(avgQuality: number): { money: number; reputation: number } {
  const effects = getEffectsOfType('quest_quality_bonus');
  let money = 0;
  let reputation = 0;
  for (const e of effects) {
    if (avgQuality >= e.qualityThreshold) {
      money += e.moneyBonus || 0;
      reputation += e.reputationBonus || 0;
    }
  }
  return { money, reputation };
}

// =====================================================================
// 特殊: 分解
// =====================================================================

/** 分解が可能か */
export function canDecompose(): boolean {
  return getEffectsOfType('decompose').length > 0;
}

/** 分解時の品質劣化率（最も緩い値） */
export function getDecomposeQualityLoss(): number {
  const effects = getEffectsOfType('decompose');
  if (effects.length === 0) return 1;
  return Math.min(...effects.map((e) => e.qualityLossMult));
}

/** 分解時のレシピヒント確率 */
export function getDecomposeHintChance(): number {
  const effects = getEffectsOfType('decompose');
  return effects.reduce((max, e) => Math.max(max, e.hintChance || 0), 0) + getAllProbabilityBonus();
}

/** 分解可能な最大品質（制限がある場合） */
export function getDecomposeMaxQuality(): number | null {
  const effects = getEffectsOfType('decompose');
  const limited = effects.filter((e) => e.maxQuality !== undefined);
  if (limited.length === 0) return null;
  // 制限なしの効果があればnull
  if (effects.some((e) => e.maxQuality === undefined)) return null;
  return Math.max(...limited.map((e) => e.maxQuality!));
}

/** 分解時の追加回収数 */
export function getDecomposeExtraCount(): number {
  return getEffectsOfType('decompose_extra').reduce((sum, e) => sum + e.count, 0);
}

// =====================================================================
// 特殊: プレビュー
// =====================================================================

/** 依頼先読み日数 */
export function getPreviewQuestDays(): number {
  const effects = getEffectsOfType('preview_quests');
  if (effects.length === 0) return 0;
  return Math.max(...effects.map((e) => e.days));
}

/** 天候先読み日数 */
export function getPreviewWeatherDays(): number {
  const effects = getEffectsOfType('preview_weather');
  if (effects.length === 0) return 0;
  return Math.max(...effects.map((e) => e.days));
}

/** イベント先読み日数 */
export function getPreviewEventDays(): number {
  const effects = getEffectsOfType('preview_events');
  if (effects.length === 0) return 0;
  return Math.max(...effects.map((e) => e.days));
}

// =====================================================================
// 特殊: インベントリ拡張
// =====================================================================

/** インベントリ拡張枠 */
export function getInventoryExpansion(): number {
  return getEffectsOfType('inventory_expand').reduce((sum, e) => sum + e.value, 0);
}
