import { gameState, addMoney, addReputationExp, addVillageExp } from '$lib/stores/game';
import type { LevelUpInfo } from '$lib/stores/game';
import { removeActiveQuest, incrementCompletedQuests } from '$lib/stores/quests';
import { removeItemsFromInventory } from '$lib/services/inventory';
import { getQuestMoneyMult, getQuestReputationBonus, getQuestQualityBonus } from '$lib/services/equipmentEffects';
import { getBuildingReputationExpBonus, getBuildingVillageExpBonus } from '$lib/services/buildingEffects';
import { getHelperReputationExpBonus, getHelperVillageExpBonus } from '$lib/services/helperEffects';
import type { ActiveQuest, OwnedItem } from '$lib/models/types';

export interface QuestDeliveryResult {
  finalMoney: number;
  finalReputation: number;
  finalDevelopment: number;
  reputationDrawInfo: LevelUpInfo | null;
  villageDrawInfo: LevelUpInfo | null;
}

/**
 * 依頼納品の共通ロジック
 * - アイテム消費
 * - 報酬計算（機材・施設・助手ボーナス込み）
 * - 経験値・お金の付与
 * - クエスト完了処理
 */
export function executeQuestDelivery(quest: ActiveQuest, itemsToConsume: OwnedItem[]): QuestDeliveryResult {
  // アイテム消費
  gameState.update(s => ({
    ...s,
    inventory: removeItemsFromInventory(s.inventory, itemsToConsume),
  }));

  // 報酬計算
  const baseExp = quest.rewardReputation;
  const avgQuality = itemsToConsume.reduce((sum, i) => sum + i.quality, 0) / itemsToConsume.length;
  const qualityBonusExp = avgQuality >= 70 ? Math.max(1, Math.floor(baseExp * 0.2)) : 0;

  let reputationGain: number;
  let developmentGain: number;
  if (quest.type === 'quality') {
    reputationGain = baseExp + qualityBonusExp;
    developmentGain = 0;
  } else if (quest.type === 'bulk') {
    reputationGain = 0;
    developmentGain = baseExp + qualityBonusExp;
  } else {
    const half = Math.floor(baseExp / 2);
    reputationGain = half + qualityBonusExp;
    developmentGain = half + qualityBonusExp;
  }
  if (quest.requiredItemId === 'elixir') {
    reputationGain += baseExp;
    developmentGain += baseExp;
  }

  // 機材効果
  const moneyMult = getQuestMoneyMult();
  const repBonus = getQuestReputationBonus();
  const qualityBonus = getQuestQualityBonus(avgQuality);

  const finalMoney = Math.floor(quest.rewardMoney * moneyMult) + qualityBonus.money;
  const finalReputation = Math.floor((reputationGain + repBonus + qualityBonus.reputation) * (1 + getBuildingReputationExpBonus() + getHelperReputationExpBonus()));
  const finalDevelopment = Math.floor(developmentGain * (1 + getBuildingVillageExpBonus() + getHelperVillageExpBonus()));

  // 報酬付与
  addMoney(finalMoney);
  const reputationDrawInfo = addReputationExp(finalReputation);
  const villageDrawInfo = addVillageExp(finalDevelopment);
  incrementCompletedQuests();
  removeActiveQuest(quest.id);

  // 連続成功カウント
  gameState.update(s => ({
    ...s,
    stats: { ...s.stats, consecutiveQuestSuccess: s.stats.consecutiveQuestSuccess + 1 },
  }));

  return { finalMoney, finalReputation, finalDevelopment, reputationDrawInfo, villageDrawInfo };
}
