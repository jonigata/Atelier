import type { GameState } from '$lib/models/types';
import { calcLevelFromExp } from '$lib/data/balance';
import { items } from '$lib/data/items';

export interface ScoreBreakdown {
  money: number;
  inventory: number;
  levels: number;
  quests: number;
  album: number;
  crafting: number;
  buildings: number;
  total: number;
}

/**
 * ゲーム状態からスコアを計算する
 */
export function calcScore(state: GameState): ScoreBreakdown {
  // 所持金: 1Gにつき1pt
  const money = state.money;

  // インベントリ: 所持アイテムのbasePrice × 品質補正の合計
  const inventory = state.inventory.reduce((sum, item) => {
    const def = items[item.itemId];
    if (!def) return sum;
    const qualityMult = item.quality / 50; // 品質50で等倍、100で2倍
    return sum + Math.floor(def.basePrice * qualityMult);
  }, 0);

  // レベル: 3軸の合計 × 100pt
  const villageLv = calcLevelFromExp(state.villageExp);
  const alchemyLv = calcLevelFromExp(state.alchemyExp);
  const reputationLv = calcLevelFromExp(state.reputationExp);
  const levels = (villageLv + alchemyLv + reputationLv) * 100;

  // 依頼: 完了数 × 50pt
  const quests = state.completedQuestCount * 50;

  // アルバム: 発見アイテム数 × 30pt
  const album = state.discoveredItems.length * 30;

  // 調合実績: 調合済み種類数 × 40pt + 最高品質ボーナス
  const craftedBonus = state.craftedItems.length * 40;
  const qualityBonus = Math.floor(state.stats.highestQualityCrafted / 10) * 10;
  const crafting = craftedBonus + qualityBonus;

  // 建物・助手: 各レベル合計 × 30pt
  const buildingPts = state.buildings.reduce((sum, b) => sum + b.level * 30, 0);
  const helperPts = state.ownedHelpers.reduce((sum, h) => sum + h.level * 30, 0);
  const buildings = buildingPts + helperPts;

  const total = money + inventory + levels + quests + album + crafting + buildings;

  return { money, inventory, levels, quests, album, crafting, buildings, total };
}
