import { get } from 'svelte/store';
import { gameState, setTutorialDialogue, incrementExpeditionCount } from '$lib/stores/game';
import { endTurn, startActionPhase } from './gameLoop';
import { checkMilestoneProgress, onDialogueClosed } from './tutorial';
import { areas } from '$lib/data/areas';
import { items } from '$lib/data/items';
import type { GameState, ActionType, OwnedItem, Expedition } from '$lib/models/types';

export interface AutoplayLog {
  day: number;
  action: string;
  result: 'success' | 'error' | 'info';
  message: string;
}

export interface AutoplayState {
  isRunning: boolean;
  logs: AutoplayLog[];
  speed: number;
  stopOnError: boolean;
}

let autoplayState: AutoplayState = {
  isRunning: false,
  logs: [],
  speed: 100,
  stopOnError: true,
};

let stopRequested = false;

export function getAutoplayState(): AutoplayState {
  return { ...autoplayState };
}

export function clearLogs(): void {
  autoplayState.logs = [];
}

function log(action: string, result: 'success' | 'error' | 'info', message: string): void {
  const state = get(gameState);
  autoplayState.logs.push({ day: state.day, action, result, message });
  console.log(`[Autoplay Day ${state.day}] ${action}: ${message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 自動プレイを開始
 */
export async function startAutoplay(options?: { speed?: number; maxDays?: number }): Promise<void> {
  if (autoplayState.isRunning) {
    log('start', 'error', '既に実行中です');
    return;
  }

  autoplayState.isRunning = true;
  stopRequested = false;
  const speed = options?.speed ?? 100;
  const maxDays = options?.maxDays ?? 30;

  log('start', 'info', `自動プレイ開始 (speed=${speed}ms, maxDays=${maxDays})`);

  try {
    const startDay = get(gameState).day;

    while (!stopRequested) {
      const state = get(gameState);

      if (state.phase === 'ending') {
        log('end', 'success', 'エンディングに到達しました');
        break;
      }

      if (state.day - startDay >= maxDays) {
        log('end', 'info', `${maxDays}日経過で停止`);
        break;
      }

      await processCurrentPhase();
      await sleep(speed);
    }
  } catch (error) {
    log('error', 'error', `エラー発生: ${error}`);
    if (autoplayState.stopOnError) {
      autoplayState.isRunning = false;
      throw error;
    }
  }

  autoplayState.isRunning = false;
  log('end', 'info', '自動プレイ終了');
}

/**
 * 自動プレイを停止
 */
export function stopAutoplay(): void {
  stopRequested = true;
  log('stop', 'info', '停止リクエスト');
}

/**
 * 現在のフェーズを処理
 */
async function processCurrentPhase(): Promise<void> {
  const state = get(gameState);

  // ダイアログがあれば閉じる
  if (state.tutorialProgress.pendingDialogue) {
    setTutorialDialogue(null);
    onDialogueClosed();
    log('dialogue', 'success', 'ダイアログを閉じました');
    return;
  }

  switch (state.phase) {
    case 'morning':
      startActionPhase();
      log('phase', 'success', '行動フェーズに移行');
      break;

    case 'action':
      await executeAction(state);
      break;

    case 'ending':
      break;
  }
}

/**
 * 行動を実行
 */
async function executeAction(state: GameState): Promise<void> {
  const unlocked = state.tutorialProgress.unlockedActions;

  // 優先順位:
  // 1. 納品可能な依頼があれば納品
  // 2. 調合可能なら調合
  // 3. 素材が足りなければ購入
  // 4. 採取隊が戻ってきていなければ派遣
  // 5. 依頼受注
  // 6. レシピ未習得なら勉強
  // 7. 休息

  // 1. 納品可能な依頼があれば納品
  if (unlocked.includes('quest') && state.activeQuests.length > 0) {
    const delivered = tryDeliverQuest(state);
    if (delivered) return;
  }

  // 2. 調合可能なら調合
  if (unlocked.includes('alchemy') && state.knownRecipes.length > 0) {
    const crafted = tryCraft(state);
    if (crafted) return;
  }

  // 3. 素材が足りなければ購入（ショップ解放済みの場合）
  if (unlocked.includes('shop')) {
    const bought = tryBuyMaterials(state);
    if (bought) return;
  }

  // 4. 採取隊を派遣（解放済み＆派遣中でない場合）
  if (unlocked.includes('expedition') && !state.expedition) {
    const dispatched = tryDispatchExpedition(state);
    if (dispatched) return;
  }

  // 5. 依頼受注
  if (unlocked.includes('quest') && state.activeQuests.length < 3 && state.availableQuests.length > 0) {
    const accepted = tryAcceptQuest(state);
    if (accepted) return;
  }

  // 6. レシピ未習得なら勉強
  if (unlocked.includes('study') && state.knownRecipes.length === 0) {
    doStudy();
    return;
  }

  // 7. 体力が低ければ休息
  if (unlocked.includes('rest') && state.stamina < 30) {
    doRest();
    return;
  }

  // 8. 何もできなければ休息して日を進める
  doRest();
}

/**
 * 素材を購入
 */
function tryBuyMaterials(state: GameState): boolean {
  // 必要な素材をチェック
  const herbCount = state.inventory.filter(i => i.itemId === 'herb_01').length;
  const waterCount = state.inventory.filter(i => i.itemId === 'water_01').length;

  // 薬草が2個未満、または清水が1個未満なら購入
  const needHerb = herbCount < 4;
  const needWater = waterCount < 2;

  if (!needHerb && !needWater) return false;

  // 購入可能なアイテムをチェック（村発展度に応じて）
  const buyableItemIds = getBuyableItemIds(state.villageDevelopment);

  // 薬草を優先購入
  if (needHerb && buyableItemIds.includes('herb_01')) {
    const herbDef = items['herb_01'];
    if (state.money >= herbDef.basePrice) {
      const quality = Math.floor(Math.random() * 31) + 40;
      gameState.update(s => ({
        ...s,
        money: s.money - herbDef.basePrice,
        inventory: [...s.inventory, { itemId: 'herb_01', quality }],
      }));
      log('shop', 'success', `薬草を${herbDef.basePrice}Gで購入`);
      return true;
    }
  }

  // 清水を購入
  if (needWater && buyableItemIds.includes('water_01')) {
    const waterDef = items['water_01'];
    if (state.money >= waterDef.basePrice) {
      const quality = Math.floor(Math.random() * 31) + 40;
      gameState.update(s => ({
        ...s,
        money: s.money - waterDef.basePrice,
        inventory: [...s.inventory, { itemId: 'water_01', quality }],
      }));
      log('shop', 'success', `清水を${waterDef.basePrice}Gで購入`);
      return true;
    }
  }

  return false;
}

/**
 * 村発展度に応じた購入可能アイテムIDを取得
 */
function getBuyableItemIds(development: number): string[] {
  if (development < 10) {
    return ['herb_01', 'water_01'];
  }
  if (development < 20) {
    return ['herb_01', 'herb_02', 'water_01', 'ore_01'];
  }
  if (development < 50) {
    return ['herb_01', 'herb_02', 'water_01', 'ore_01', 'misc_01'];
  }
  return Object.keys(items).filter(id => items[id].category !== 'product');
}

/**
 * 採取隊を派遣
 */
function tryDispatchExpedition(state: GameState): boolean {
  // 費用チェック（森: 50G/日 × 3日 = 150G）
  const area = areas['forest'];
  const duration = 3;
  const cost = area.costPerDay * duration;

  if (state.money < cost) {
    return false;
  }

  // 派遣実行
  const expedition: Expedition = {
    areaId: 'forest',
    startDay: state.day,
    duration,
  };

  gameState.update(s => ({
    ...s,
    money: s.money - cost,
    expedition,
  }));

  incrementExpeditionCount();
  log('expedition', 'success', `採取隊を${area.name}に派遣 (${duration}日間, ${cost}G)`);
  checkMilestoneProgress();
  return true;
}

/**
 * 依頼納品を試みる
 */
function tryDeliverQuest(state: GameState): boolean {
  for (const quest of state.activeQuests) {
    const matchingItems = state.inventory.filter(item => {
      if (item.itemId !== quest.requiredItemId) return false;
      if (quest.requiredQuality && item.quality < quest.requiredQuality) return false;
      return true;
    });

    const remaining = quest.requiredQuantity - quest.deliveredCount;
    if (matchingItems.length >= remaining) {
      const itemsToConsume = matchingItems.slice(0, remaining);

      gameState.update(s => {
        let newInventory = [...s.inventory];
        for (const item of itemsToConsume) {
          const index = newInventory.findIndex(
            i => i.itemId === item.itemId && i.quality === item.quality
          );
          if (index !== -1) {
            newInventory = [...newInventory.slice(0, index), ...newInventory.slice(index + 1)];
          }
        }

        let developmentGain = 1;
        if (quest.type === 'quality') developmentGain = 2;
        if (quest.type === 'bulk') developmentGain = 2;
        if (quest.requiredItemId === 'elixir') developmentGain = 3;
        const avgQuality = itemsToConsume.reduce((sum, i) => sum + i.quality, 0) / itemsToConsume.length;
        if (avgQuality >= 70) developmentGain += 1;

        return {
          ...s,
          inventory: newInventory,
          money: s.money + quest.rewardMoney,
          reputation: Math.min(100, s.reputation + quest.rewardReputation),
          villageDevelopment: Math.min(100, s.villageDevelopment + developmentGain),
          completedQuestCount: s.completedQuestCount + 1,
          activeQuests: s.activeQuests.filter(q => q.id !== quest.id),
          stats: {
            ...s.stats,
            consecutiveQuestSuccess: s.stats.consecutiveQuestSuccess + 1,
          },
        };
      });

      log('quest', 'success', `依頼「${quest.title}」を納品 (村発展+)`);
      checkMilestoneProgress();
      endTurn(0);
      return true;
    }
  }
  return false;
}

/**
 * 調合を試みる
 */
function tryCraft(state: GameState): boolean {
  const recipeId = 'potion_01';
  if (!state.knownRecipes.includes(recipeId)) return false;

  const herbs = state.inventory.filter(i => i.itemId === 'herb_01');
  const waters = state.inventory.filter(i => i.itemId === 'water_01');

  if (herbs.length < 2 || waters.length < 1) return false;

  const sortedHerbs = [...herbs].sort((a, b) => b.quality - a.quality);
  const sortedWaters = [...waters].sort((a, b) => b.quality - a.quality);

  const selectedItems = [sortedHerbs[0], sortedHerbs[1], sortedWaters[0]];
  const avgQuality = selectedItems.reduce((sum, i) => sum + i.quality, 0) / selectedItems.length;

  gameState.update(s => {
    let newInventory = [...s.inventory];

    for (const item of selectedItems) {
      const index = newInventory.findIndex(
        i => i.itemId === item.itemId && i.quality === item.quality
      );
      if (index !== -1) {
        newInventory = [...newInventory.slice(0, index), ...newInventory.slice(index + 1)];
      }
    }

    const resultQuality = Math.floor(avgQuality * 0.9 + Math.random() * 10);
    newInventory.push({ itemId: 'potion_01', quality: Math.min(100, resultQuality) });

    const expGain = 15;
    let newExp = s.alchemyExp + expGain;
    let newLevel = s.alchemyLevel;
    let expNeeded = Math.floor(100 * Math.pow(1.5, newLevel - 1));
    while (newExp >= expNeeded && newLevel < 20) {
      newExp -= expNeeded;
      newLevel++;
      expNeeded = Math.floor(100 * Math.pow(1.5, newLevel - 1));
    }

    return {
      ...s,
      inventory: newInventory,
      alchemyExp: newExp,
      alchemyLevel: newLevel,
      craftedItems: s.craftedItems.includes('potion_01')
        ? s.craftedItems
        : [...s.craftedItems, 'potion_01'],
      stats: {
        ...s.stats,
        totalCraftCount: s.stats.totalCraftCount + 1,
        highestQualityCrafted: Math.max(s.stats.highestQualityCrafted, resultQuality),
      },
    };
  });

  log('craft', 'success', '回復薬を調合');
  checkMilestoneProgress();
  endTurn(1);
  return true;
}

/**
 * 依頼受注
 */
function tryAcceptQuest(state: GameState): boolean {
  if (state.availableQuests.length === 0) return false;

  // 納品可能な依頼を優先
  const canDeliverQuest = state.availableQuests.find(quest => {
    if (quest.requiredItemId !== 'potion_01') return false;
    const matchingItems = state.inventory.filter(item => {
      if (item.itemId !== quest.requiredItemId) return false;
      if (quest.requiredQuality && item.quality < quest.requiredQuality) return false;
      return true;
    });
    return matchingItems.length >= quest.requiredQuantity;
  });

  const quest = canDeliverQuest || state.availableQuests[0];

  gameState.update(s => ({
    ...s,
    activeQuests: [...s.activeQuests, { ...quest, acceptedDay: s.day, deliveredCount: 0 }],
    availableQuests: s.availableQuests.filter(q => q.id !== quest.id),
  }));

  log('quest', 'success', `依頼「${quest.title}」を受注`);
  checkMilestoneProgress();
  return true;
}

/**
 * 勉強
 */
function doStudy(): void {
  gameState.update(s => ({
    ...s,
    knownRecipes: s.knownRecipes.includes('potion_01')
      ? s.knownRecipes
      : [...s.knownRecipes, 'potion_01'],
  }));

  log('study', 'success', 'レシピを習得');
  checkMilestoneProgress();
  endTurn(3);
}

/**
 * 休息
 */
function doRest(): void {
  gameState.update(s => ({
    ...s,
    stamina: s.maxStamina,
  }));

  log('rest', 'success', '休息');
  endTurn(1);
}
