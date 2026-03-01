import { get } from 'svelte/store';
import { gameState, addItem, addMoney, addExp, addReputationExp, addVillageExp, addMessage, upgradeHelper } from '$lib/stores/game';
import type { LevelUpInfo } from '$lib/stores/game';
import { restEvents, type RestEventDef, type ResolvedReward, type RestEventRewardTemplate } from '$lib/data/restEvents';
import { getItem } from '$lib/data/items';
import { getAllEquipment } from '$lib/data/equipment';
import { getHelper } from '$lib/data/helpers';
import type { GameState } from '$lib/models/types';

export interface DrawInfos {
  village: LevelUpInfo | null;
  reputation: LevelUpInfo | null;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 条件チェック（special イベント用の追加条件含む）
 */
function checkCondition(event: RestEventDef, state: GameState): boolean {
  // 定義上の condition
  if (event.condition && !event.condition(state)) return false;

  // special 固有の条件
  switch (event.special) {
    case 'helperLevelUp':
      return state.ownedHelpers.some((h) => h.level < 3);
    case 'randomEquipment': {
      const all = getAllEquipment();
      return all.some((e) => !state.ownedEquipment.includes(e.id));
    }
    case 'duplicateItem':
      return state.inventory.length > 0;
    default:
      return true;
  }
}

/**
 * weight 付き抽選でイベントを1つ選出
 */
export function selectRestEvent(): RestEventDef {
  const state = get(gameState);

  // 条件を満たすイベントだけフィルタ
  const eligible = restEvents.filter((e) => checkCondition(e, state));

  if (eligible.length === 0) {
    // フォールバック: 条件なしのコモンイベントから選ぶ
    const fallback = restEvents.filter((e) => !e.special && !e.condition);
    return pickRandom(fallback);
  }

  const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const event of eligible) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }

  return eligible[eligible.length - 1];
}

/**
 * テンプレート報酬を具体値に解決
 */
function resolveTemplate(tmpl: RestEventRewardTemplate): ResolvedReward {
  const itemId = tmpl.itemId ?? (tmpl.itemPool ? pickRandom(tmpl.itemPool) : undefined);
  const count = tmpl.countRange ? randInt(tmpl.countRange[0], tmpl.countRange[1]) : 1;
  const amount = tmpl.amountRange ? randInt(tmpl.amountRange[0], tmpl.amountRange[1]) : (tmpl.amount ?? 0);
  const quality = tmpl.qualityRange ? randInt(tmpl.qualityRange[0], tmpl.qualityRange[1]) : undefined;

  switch (tmpl.type) {
    case 'item': {
      const itemDef = itemId ? getItem(itemId) : undefined;
      const name = itemDef?.name ?? itemId ?? '???';
      return {
        description: `${name} ×${count} を入手`,
        type: 'item',
        apply: { type: 'item', itemId, count, quality },
      };
    }
    case 'gold':
      return {
        description: `${amount}G 獲得`,
        type: 'gold',
        apply: { type: 'gold', amount },
      };
    case 'alchemyExp':
      return {
        description: `錬金経験値 +${amount}`,
        type: 'exp',
        apply: { type: 'alchemyExp', amount },
      };
    case 'reputationExp':
      return {
        description: `名声経験値 +${amount}`,
        type: 'exp',
        apply: { type: 'reputationExp', amount },
      };
    case 'villageExp':
      return {
        description: `村発展経験値 +${amount}`,
        type: 'exp',
        apply: { type: 'villageExp', amount },
      };
    default:
      return {
        description: '???',
        type: 'item',
        apply: { type: 'item' },
      };
  }
}

/**
 * special イベントの報酬を動的に生成
 */
function resolveSpecialRewards(event: RestEventDef): ResolvedReward[] {
  const state = get(gameState);

  switch (event.special) {
    case 'helperLevelUp': {
      const upgradeable = state.ownedHelpers.filter((h) => h.level < 3);
      if (upgradeable.length === 0) {
        // フォールバック
        return [{ description: '錬金経験値 +30', type: 'exp', apply: { type: 'alchemyExp', amount: 30 } }];
      }
      const target = pickRandom(upgradeable);
      const helperDef = getHelper(target.helperId);
      const name = helperDef?.name ?? target.helperId;
      return [{
        description: `${name} がレベルアップ！ (Lv${target.level} → Lv${target.level + 1})`,
        type: 'exp',
        apply: { type: 'alchemyExp', amount: 0, itemId: target.helperId },
      }];
    }
    case 'randomEquipment': {
      const all = getAllEquipment();
      const unowned = all.filter((e) => !state.ownedEquipment.includes(e.id));
      if (unowned.length === 0) {
        return [{ description: '500G 獲得', type: 'gold', apply: { type: 'gold', amount: 500 } }];
      }
      const eq = pickRandom(unowned);
      return [{
        description: `機材「${eq.name}」を入手！`,
        type: 'item',
        apply: { type: 'item', itemId: eq.id },
      }];
    }
    case 'duplicateItem': {
      if (state.inventory.length === 0) {
        return [{ description: '錬金経験値 +30', type: 'exp', apply: { type: 'alchemyExp', amount: 30 } }];
      }
      // 素材のみ（product以外）を対象にする
      const materialItems = state.inventory.filter((item) => {
        const def = getItem(item.itemId);
        return def && def.category !== 'product';
      });
      const targetItems = materialItems.length > 0 ? materialItems : state.inventory;
      const target = pickRandom(targetItems);
      const itemDef = getItem(target.itemId);
      const name = itemDef?.name ?? target.itemId;
      return [{
        description: `${name} ×5 が増殖！`,
        type: 'item',
        apply: { type: 'item', itemId: target.itemId, count: 5, quality: target.quality },
      }];
    }
    default:
      return [];
  }
}

/**
 * イベントの報酬を確定させる
 */
export function resolveRestEventRewards(event: RestEventDef): ResolvedReward[] {
  if (event.special) {
    return resolveSpecialRewards(event);
  }
  if (!event.rewards) return [];
  return event.rewards.map(resolveTemplate);
}

/**
 * 確定済み報酬をゲーム状態に適用
 */
export function applyRestEventRewards(event: RestEventDef, rewards: ResolvedReward[]): DrawInfos {
  const state = get(gameState);
  let village: LevelUpInfo | null = null;
  let reputation: LevelUpInfo | null = null;

  for (const reward of rewards) {
    const a = reward.apply;
    switch (a.type) {
      case 'item': {
        // special: randomEquipment の場合
        if (event.special === 'randomEquipment' && a.itemId) {
          gameState.update((s) => ({
            ...s,
            ownedEquipment: [...s.ownedEquipment, a.itemId!],
          }));
          break;
        }
        // 通常アイテム追加
        if (a.itemId) {
          const count = a.count ?? 1;
          for (let i = 0; i < count; i++) {
            addItem({
              itemId: a.itemId,
              quality: a.quality ?? randInt(20, 50),
              origin: { type: 'reward', day: state.day },
            });
          }
        }
        break;
      }
      case 'gold':
        if (a.amount) addMoney(a.amount);
        break;
      case 'alchemyExp':
        // special: helperLevelUp の場合
        if (event.special === 'helperLevelUp' && a.itemId) {
          upgradeHelper(a.itemId);
          break;
        }
        if (a.amount) addExp(a.amount);
        break;
      case 'reputationExp':
        if (a.amount) reputation = addReputationExp(a.amount) ?? reputation;
        break;
      case 'villageExp':
        if (a.amount) village = addVillageExp(a.amount) ?? village;
        break;
    }
  }

  // メッセージログに報酬概要を追加
  const rewardDescs = rewards.map((r) => r.description).join('、');
  addMessage(`【休日のできごと】${event.name}：${rewardDescs}`);

  return { village, reputation };
}
