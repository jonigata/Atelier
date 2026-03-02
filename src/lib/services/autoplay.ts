import { get } from 'svelte/store';
import { gameState, learnRecipesFromBook, addBook, consumeStamina, addMessage, markInventoryOpened } from '$lib/stores/game';
import { incrementExpeditionCount } from '$lib/stores/stats';
import { endTurn, startActionPhase } from './gameLoop';
import { processActionComplete, resolveDialogue } from './presentation';
import { executeQuestDelivery } from './quest';
import { areas } from '$lib/data/areas';
import { items } from '$lib/data/items';
import { recipes } from '$lib/data/recipes';
import { books, getShopBooks } from '$lib/data/books';
import { removeItemsFromInventory } from '$lib/services/inventory';
import { calcLevelFromExp, STAMINA, SHOP } from '$lib/data/balance';
import { craftMultiple, canCraftRecipe } from '$lib/services/alchemy';
import { getEffectiveStudyDays } from '$lib/services/equipmentEffects';
import { isCraftedCategory } from '$lib/data/categories';
import type { GameState, OwnedItem, Expedition, RecipeDef } from '$lib/models/types';

export interface AutoplayLog {
  day: number;
  action: string;
  result: 'success' | 'error' | 'info';
  message: string;
  daysCost?: number;
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

export interface AutoplayStats {
  action: string;
  label: string;
  days: number;
  count: number;
}

const ACTION_LABELS: Record<string, string> = {
  craft: '調合',
  study: '勉強',
  rest: '休息',
  quest: '納品',
};

export function getAutoplayStats(): AutoplayStats[] {
  const map = new Map<string, { days: number; count: number }>();
  for (const log of autoplayState.logs) {
    if (log.daysCost === undefined) continue;
    const entry = map.get(log.action) ?? { days: 0, count: 0 };
    entry.days += log.daysCost;
    entry.count += 1;
    map.set(log.action, entry);
  }
  // ACTION_LABELSの順序で返す（未知のアクションも末尾に追加）
  const result: AutoplayStats[] = [];
  for (const [action, label] of Object.entries(ACTION_LABELS)) {
    const entry = map.get(action);
    if (entry) {
      result.push({ action, label, ...entry });
      map.delete(action);
    }
  }
  for (const [action, entry] of map) {
    result.push({ action, label: action, ...entry });
  }
  return result;
}

function log(action: string, result: 'success' | 'error' | 'info', message: string, daysCost?: number): void {
  const state = get(gameState);
  autoplayState.logs.push({ day: state.day, action, result, message, daysCost });
  console.log(`[Autoplay Day ${state.day}] ${action}: ${message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 自動プレイを開始（Greedy Growth戦略）
 */
export async function startAutoplay(options?: { speed?: number; maxDays?: number }): Promise<void> {
  if (autoplayState.isRunning) {
    log('start', 'error', '既に実行中です');
    return;
  }

  autoplayState.isRunning = true;
  stopRequested = false;
  const speed = options?.speed ?? 100;
  const maxDays = options?.maxDays ?? 27;

  log('start', 'info', `Greedy Growth開始 (speed=${speed}ms, maxDays=${maxDays})`);

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

      const remainingDays = maxDays - (state.day - startDay);
      await processCurrentPhase(remainingDays);
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
async function processCurrentPhase(remainingDays: number): Promise<void> {
  const state = get(gameState);

  // ダイアログがあれば閉じる
  if (state.tutorialProgress.pendingDialogue) {
    resolveDialogue();
    log('dialogue', 'success', 'ダイアログを閉じました');
    return;
  }

  switch (state.phase) {
    case 'morning':
      startActionPhase();
      log('phase', 'success', '行動フェーズに移行');
      break;

    case 'action':
      await executeAction(state, remainingDays);
      break;

    case 'ending':
      break;
  }
}

// =====================================================================
// Greedy Growth戦略: 行動選択
// =====================================================================

/**
 * 行動を実行（Greedy戦略）
 *
 * 優先順位:
 * 1. 納品可能な依頼があれば納品（無料）
 * 2. 余剰品を売却して資金確保（無料）
 * 3. レシピ本を購入・勉強（日数消費）
 * 4. 依頼受注（無料）
 * 5. 素材購入（無料）
 * 6. 最高効率のレシピを調合（日数消費）
 * 7. 採取隊派遣（無料）
 * 8. 体力が低ければ休息（1日消費）
 * 9. フォールバック: 休息
 */
async function executeAction(state: GameState, remainingDays: number): Promise<void> {
  const unlocked = state.tutorialProgress.unlockedActions;

  // 0. チュートリアル進行: 所持品を開いてstudyを解放する
  if (unlocked.includes('inventory') && !state.stats.inventoryOpened) {
    markInventoryOpened();
    log('tutorial', 'success', '所持品を確認');
    await processActionComplete();
    return;
  }

  // 1. 納品可能な依頼を全て処理
  if (unlocked.includes('quest') && state.activeQuests.length > 0) {
    if (await tryDeliverQuest(state)) return;
  }

  // 2. 余剰品を売却して資金確保
  if (unlocked.includes('shop')) {
    if (await trySellExcess(state)) return;
  }

  // 3. レシピ本を購入・勉強（未習得レシピがある本を優先）
  if (unlocked.includes('study')) {
    if (await tryBuyAndStudy(state, remainingDays)) return;
  }

  // 4. 依頼受注（達成可能な依頼を優先）
  if (unlocked.includes('quest') && state.activeQuests.length < 3 && state.availableQuests.length > 0) {
    if (await tryAcceptSmartQuest(state)) return;
  }

  // 5. 素材購入（調合に必要な素材を買う）
  if (unlocked.includes('shop')) {
    if (tryBuySmartMaterials(state)) return;
  }

  // 6. 最高効率のレシピを調合
  if (unlocked.includes('alchemy') && state.knownRecipes.length > 0) {
    if (await tryCraftBest(state, remainingDays)) return;
  }

  // 7. 採取隊を派遣
  if (unlocked.includes('expedition') && !state.expedition) {
    if (await tryDispatchBestExpedition(state)) return;
  }

  // 残り日数が足りなければ日数消費アクションをスキップ
  if (remainingDays < 1) {
    log('end', 'info', '残り日数なし、停止待ち');
    return;
  }

  // 8. 体力が低ければ休息
  if (unlocked.includes('rest') && state.stamina < 30) {
    await doRest();
    return;
  }

  // 9. フォールバック: 休息して日を進める
  await doRest();
}

// =====================================================================
// 依頼納品
// =====================================================================

async function tryDeliverQuest(state: GameState): Promise<boolean> {
  for (const quest of state.activeQuests) {
    const matchingItems = state.inventory.filter(item => {
      if (item.itemId !== quest.requiredItemId) return false;
      if (quest.requiredQuality && item.quality < quest.requiredQuality) return false;
      return true;
    });

    const remaining = quest.requiredQuantity - quest.deliveredCount;
    if (matchingItems.length >= remaining) {
      const itemsToConsume = matchingItems.slice(0, remaining);
      const result = executeQuestDelivery(quest, itemsToConsume);

      const itemDef = items[quest.requiredItemId];
      log('quest', 'success', `納品「${quest.title}」(${itemDef?.name ?? quest.requiredItemId} x${remaining}) +${result.finalMoney}G +${result.finalReputation}名声`, 0);
      await processActionComplete();
      await endTurn(0);
      return true;
    }
  }
  return false;
}

// =====================================================================
// 余剰品売却
// =====================================================================

async function trySellExcess(state: GameState): Promise<boolean> {
  // 依頼で必要なアイテムIDと数量を集計
  const neededItems: Record<string, number> = {};
  for (const quest of state.activeQuests) {
    const remaining = quest.requiredQuantity - quest.deliveredCount;
    neededItems[quest.requiredItemId] = (neededItems[quest.requiredItemId] ?? 0) + remaining;
  }

  // 売却候補: 完成品（錬成物）のうち依頼に不要な分
  const products = state.inventory.filter(item => {
    const def = items[item.itemId];
    return isCraftedCategory(def?.category);
  });

  // アイテムIDごとにグループ化
  const productsByItem: Record<string, OwnedItem[]> = {};
  for (const item of products) {
    if (!productsByItem[item.itemId]) productsByItem[item.itemId] = [];
    productsByItem[item.itemId].push(item);
  }

  // 売却: 依頼で必要な数を残して余りを売る
  for (const [itemId, owned] of Object.entries(productsByItem)) {
    const needed = neededItems[itemId] ?? 0;
    const excess = owned.length - needed;

    // 余りがあり、中間素材として必要でもないものを売る
    // ただし、レシピ素材として使うアイテムは除外
    if (excess > 0 && !isNeededAsIngredient(itemId, state)) {
      // 品質が低いものから売る
      const sorted = [...owned].sort((a, b) => a.quality - b.quality);
      const toSell = sorted.slice(0, excess);

      // 一度に1個だけ売る（ループで複数回呼ばれる）
      const item = toSell[0];
      const def = items[item.itemId];
      if (!def) return false;

      const sellPrice = Math.floor(def.basePrice * SHOP.SELL_PRICE_RATE * (item.quality / 50));

      gameState.update(s => ({
        ...s,
        inventory: removeItemsFromInventory(s.inventory, [item]),
        money: s.money + sellPrice,
        stats: { ...s.stats, totalSalesAmount: s.stats.totalSalesAmount + sellPrice },
      }));

      log('sell', 'success', `${def.name}(Q${item.quality})を${sellPrice}Gで売却`);
      await processActionComplete();
      return true;
    }
  }

  return false;
}

/**
 * アイテムが既知レシピの素材として必要かチェック
 */
function isNeededAsIngredient(itemId: string, state: GameState): boolean {
  for (const recipeId of state.knownRecipes) {
    const recipe = recipes[recipeId];
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      if (ing.itemId === itemId) return true;
    }
  }
  return false;
}

// =====================================================================
// レシピ本購入 & 勉強
// =====================================================================

async function tryBuyAndStudy(state: GameState, remainingDays: number): Promise<boolean> {
  const villageLv = calcLevelFromExp(state.villageExp);
  const alchemyLv = calcLevelFromExp(state.alchemyExp);
  const availableBooks = getShopBooks(villageLv);

  // 未所持で、新しいレシピが含まれる本を安い順にソート
  const booksToStudy = availableBooks
    .filter(book => {
      // 未所持 or 所持済みだが未習得レシピがある
      const hasNewRecipes = book.recipeIds.some(id => !state.knownRecipes.includes(id));
      if (!hasNewRecipes) return false;
      // レシピの最低要求レベルが現在レベル+2以内（あまりに先のレシピは無駄）
      const minRequiredLevel = Math.min(...book.recipeIds.map(id => recipes[id]?.requiredLevel ?? 99));
      return minRequiredLevel <= alchemyLv + 3;
    })
    .sort((a, b) => a.basePrice - b.basePrice);

  for (const book of booksToStudy) {
    const alreadyOwned = state.ownedBooks.includes(book.id);
    const cost = alreadyOwned ? 0 : book.basePrice;

    // 購入可能か
    if (cost > state.money) continue;

    // 体力チェック
    if (state.stamina < STAMINA.STUDY_COST) continue;

    // 勉強日数（機材効果適用）を先に計算してオーバーランチェック
    const maxLevel = Math.max(...book.recipeIds.map(id => recipes[id]?.requiredLevel ?? 1));
    const studyDays = getEffectiveStudyDays(book, maxLevel);
    if (studyDays > remainingDays) continue;

    // 本を購入（未所持の場合）
    if (!alreadyOwned) {
      gameState.update(s => ({
        ...s,
        money: s.money - cost,
      }));
      addBook(book.id);
      log('shop', 'success', `「${book.name}」を${cost}Gで購入`);
    }

    // 勉強: 体力消費 + レシピ習得
    consumeStamina(STAMINA.STUDY_COST);
    const learned = learnRecipesFromBook(book.recipeIds);

    if (learned.length > 0) {
      const learnedNames = learned.map(id => recipes[id]?.name ?? id).join(', ');
      log('study', 'success', `「${book.name}」を勉強 → ${learnedNames}`, studyDays);
    } else {
      log('study', 'info', `「${book.name}」は全て習得済み`, studyDays);
    }

    await processActionComplete();
    await endTurn(studyDays);
    return true;
  }

  return false;
}

// =====================================================================
// 依頼受注（賢い選択）
// =====================================================================

async function tryAcceptSmartQuest(state: GameState): Promise<boolean> {
  if (state.availableQuests.length === 0) return false;

  const alchemyLv = calcLevelFromExp(state.alchemyExp);

  // 既存アクティブ依頼の残り調合時間を計算
  // 未完了の調合が必要な依頼がある場合、新規受注を制限する
  let pendingCraftDays = 0;
  for (const aq of state.activeQuests) {
    const ownedCount = state.inventory.filter(i => {
      if (i.itemId !== aq.requiredItemId) return false;
      if (aq.requiredQuality && i.quality < aq.requiredQuality) return false;
      return true;
    }).length;
    const needsToCraft = (aq.requiredQuantity - aq.deliveredCount - ownedCount) > 0;
    if (needsToCraft) {
      const recipeForItem = Object.values(recipes).find(r => r.resultItemId === aq.requiredItemId);
      if (recipeForItem) {
        pendingCraftDays += recipeForItem.craftDaysTenths;
      }
    }
  }

  // スコア付きで依頼を評価
  const scoredQuests = state.availableQuests.map(quest => {
    let score = 0;

    // 既にインベントリにアイテムがある → 即納品可能 → 最高スコア
    const matchingItems = state.inventory.filter(item => {
      if (item.itemId !== quest.requiredItemId) return false;
      if (quest.requiredQuality && item.quality < quest.requiredQuality) return false;
      return true;
    });
    const remaining = quest.requiredQuantity;
    if (matchingItems.length >= remaining) {
      score += 1000;
    } else {
      // 即納品できない場合: 調合の実現可能性をチェック
      const recipeForItem = Object.values(recipes).find(r => r.resultItemId === quest.requiredItemId);

      if (recipeForItem && state.knownRecipes.includes(recipeForItem.id)) {
        // 調合所要日数が期限内に収まるか？
        // pendingCraftDaysも加味: 既存依頼の調合に必要な時間も考慮
        const ownedCount = matchingItems.length;
        const needToCraft = remaining - ownedCount;
        const maxPerBatch = getMaxCraftQuantity(recipeForItem, state);
        const batchesNeeded = maxPerBatch > 0 ? Math.ceil(needToCraft / maxPerBatch) : needToCraft;
        const totalCraftDays = recipeForItem.craftDaysTenths * batchesNeeded;
        const effectiveCraftDays = totalCraftDays + pendingCraftDays;

        if (totalCraftDays > quest.deadlineDays) {
          // 自分自身の調合だけで期限オーバー
          score -= 9999;
          log('quest', 'info', `依頼「${quest.title}」スキップ: 調合${totalCraftDays}日 > 期限${quest.deadlineDays}日`);
        } else if (effectiveCraftDays > quest.deadlineDays) {
          // 既存依頼の調合と合わせると期限オーバー → 大幅減点
          score -= 5000;
          log('quest', 'info', `依頼「${quest.title}」スキップ: 既存依頼込み${effectiveCraftDays}日 > 期限${quest.deadlineDays}日`);
        } else {
          // 調合可能で期限内に収まる
          score += 100;
          // 余裕度ボーナス
          const slack = quest.deadlineDays - effectiveCraftDays;
          score += slack * 3;
          // 要求レベルが現在レベル以下 → 成功率が高い
          if (recipeForItem.requiredLevel <= alchemyLv) {
            score += 50;
          }

          // 成長機会コスト: このレシピのExp効率 vs 最高効率レシピ
          // 長時間・低効率のレシピは成長を大きく阻害する
          const bestEfficiency = getOptimalCraftEfficiency(state);
          const questEfficiency = recipeForItem.expReward / Math.max(1, recipeForItem.craftDaysTenths);
          const lostExpPerDay = Math.max(0, bestEfficiency - questEfficiency);
          score -= lostExpPerDay * recipeForItem.craftDaysTenths * 5;
        }
      } else if (recipeForItem && !state.knownRecipes.includes(recipeForItem.id)) {
        // レシピ未習得 → 勉強時間も含めると期限がさらに厳しい → 低スコア
        score -= 500;
      } else {
        // レシピがそもそも存在しない → 採取や購入でしか入手できない
        score -= 200;
      }
    }

    // 報酬が高い
    score += quest.rewardMoney / 10;
    score += quest.rewardReputation * 10;

    return { quest, score };
  });

  // 最高スコアの依頼を受注
  scoredQuests.sort((a, b) => b.score - a.score);
  const best = scoredQuests[0];

  if (best && best.score > 0) {
    gameState.update(s => ({
      ...s,
      activeQuests: [...s.activeQuests, { ...best.quest, acceptedDay: s.day, deliveredCount: 0 }],
      availableQuests: s.availableQuests.filter(q => q.id !== best.quest.id),
    }));

    log('quest', 'success', `依頼受注「${best.quest.title}」(${items[best.quest.requiredItemId]?.name ?? best.quest.requiredItemId} x${best.quest.requiredQuantity}, スコア${Math.floor(best.score)})`);
    await processActionComplete();
    return true;
  }

  return false;
}

// =====================================================================
// 素材購入（スマート）
// =====================================================================

function tryBuySmartMaterials(state: GameState): boolean {
  const villageLv = calcLevelFromExp(state.villageExp);
  const buyableIds = getShopBuyableIds(villageLv);

  // 調合可能レシピのうち、素材がほぼ揃っているものを優先して不足分を買う
  const craftableRecipes = getCraftCandidates(state);

  for (const { recipe, missingItems } of craftableRecipes) {
    for (const missing of missingItems) {
      if (missing.itemId && buyableIds.includes(missing.itemId)) {
        const def = items[missing.itemId];
        if (!def) continue;
        if (state.money < def.basePrice) continue;

        // 購入実行
        const quality = Math.floor(Math.random() * 31) + 40; // 40-70
        gameState.update(s => ({
          ...s,
          money: s.money - def.basePrice,
          inventory: [...s.inventory, {
            itemId: missing.itemId!,
            quality,
            origin: { type: 'shop' as const, day: s.day },
          }],
        }));

        log('shop', 'success', `${def.name}(Q${quality})を${def.basePrice}Gで購入 ← ${recipe.name}用`);
        return true;
      }
    }
  }

  // 依頼用アイテムの素材も購入
  for (const quest of state.activeQuests) {
    const recipeForItem = Object.values(recipes).find(r => r.resultItemId === quest.requiredItemId);
    if (!recipeForItem || !state.knownRecipes.includes(recipeForItem.id)) continue;

    for (const ing of recipeForItem.ingredients) {
      if (!ing.itemId) continue;
      if (!buyableIds.includes(ing.itemId)) continue;

      const owned = state.inventory.filter(i => i.itemId === ing.itemId).length;
      if (owned >= ing.quantity) continue;

      const def = items[ing.itemId];
      if (!def || state.money < def.basePrice) continue;

      const quality = Math.floor(Math.random() * 31) + 40;
      gameState.update(s => ({
        ...s,
        money: s.money - def.basePrice,
        inventory: [...s.inventory, {
          itemId: ing.itemId!,
          quality,
          origin: { type: 'shop' as const, day: s.day },
        }],
      }));

      log('shop', 'success', `${def.name}(Q${quality})を${def.basePrice}Gで購入 ← 依頼「${quest.title}」用`);
      return true;
    }
  }

  return false;
}

/**
 * 村レベルに応じたショップ購入可能アイテムID
 */
function getShopBuyableIds(villageLv: number): string[] {
  if (villageLv <= 1) {
    return ['herb_01', 'water_01', 'oil_seed', 'hemp_fiber', 'magic_wood'];
  }
  if (villageLv <= 3) {
    return ['herb_01', 'herb_02', 'water_01', 'ore_01', 'oil_seed', 'hemp_fiber', 'magic_wood'];
  }
  if (villageLv <= 6) {
    return ['herb_01', 'herb_02', 'water_01', 'ore_01', 'misc_01', 'oil_seed', 'hemp_fiber', 'magic_wood'];
  }
  // Lv7+: 全素材
  return Object.values(items)
    .filter(i => !isCraftedCategory(i.category))
    .map(i => i.id);
}

/**
 * 調合候補を取得（素材の不足数が少ない順）
 */
function getCraftCandidates(state: GameState): { recipe: RecipeDef; missingItems: { itemId?: string; category?: string; count: number }[] }[] {
  const alchemyLv = calcLevelFromExp(state.alchemyExp);

  return state.knownRecipes
    .map(id => recipes[id])
    .filter((recipe): recipe is RecipeDef => {
      if (!recipe) return false;
      return true;
    })
    .map(recipe => {
      const missingItems: { itemId?: string; category?: string; count: number }[] = [];
      for (const ing of recipe.ingredients) {
        let owned: number;
        if (ing.itemId) {
          owned = state.inventory.filter(i => i.itemId === ing.itemId).length;
        } else if (ing.category) {
          owned = state.inventory.filter(i => items[i.itemId]?.category === ing.category).length;
        } else {
          owned = 0;
        }
        const deficit = ing.quantity - owned;
        if (deficit > 0) {
          missingItems.push({ itemId: ing.itemId, category: ing.category, count: deficit });
        }
      }
      return { recipe, missingItems };
    })
    .sort((a, b) => a.missingItems.length - b.missingItems.length);
}

// =====================================================================
// 調合（最高効率レシピ選択）
// =====================================================================

async function tryCraftBest(state: GameState, remainingDays: number): Promise<boolean> {
  const alchemyLv = calcLevelFromExp(state.alchemyExp);

  // 調合可能なレシピを全て取得（残り日数内に収まるもののみ）
  const craftableRecipes = state.knownRecipes
    .filter(id => canCraftRecipe(id))
    .map(id => recipes[id])
    .filter((r): r is RecipeDef => !!r && r.craftDaysTenths <= remainingDays);

  if (craftableRecipes.length === 0) return false;

  // アクティブ依頼の緊急度を計算
  const questUrgency = state.activeQuests.map(q => {
    const remainingDays = (q.acceptedDay + q.deadlineDays) - state.day;
    const recipe = Object.values(recipes).find(r => r.resultItemId === q.requiredItemId);
    const craftDays = recipe ? recipe.craftDaysTenths : 0;
    const ownedCount = state.inventory.filter(i => {
      if (i.itemId !== q.requiredItemId) return false;
      if (q.requiredQuality && i.quality < q.requiredQuality) return false;
      return true;
    }).length;
    const needsToCraft = (q.requiredQuantity - q.deliveredCount - ownedCount) > 0;
    return { quest: q, remainingDays, craftDays, recipe, needsToCraft };
  });

  // 最高効率レシピのExp/日を取得
  const bestEfficiency = getOptimalCraftEfficiency(state);

  // 依頼アイテムのレシピを緊急度順に評価
  const urgentQuestRecipes: { recipe: RecipeDef; quest: typeof questUrgency[0]; urgencyScore: number }[] = [];
  for (const qu of questUrgency) {
    if (!qu.needsToCraft || !qu.recipe) continue;
    if (!state.knownRecipes.includes(qu.recipe.id)) continue;
    if (!canCraftRecipe(qu.recipe.id)) continue;
    // 調合しても期限に間に合わないなら諦める
    if (qu.craftDays > qu.remainingDays) continue;

    // 余裕度（残り日数 - 調合日数）
    const slack = qu.remainingDays - qu.craftDays;

    // クエストレシピの効率
    const questEfficiency = qu.recipe.expReward / Math.max(1, qu.recipe.craftDaysTenths);

    // 効率が最適より低いクエストは、ギリギリまで遅延させる
    // slackが大きく、かつ効率が悪い場合は「まだ急がない」
    if (questEfficiency < bestEfficiency * 0.7 && slack > 3) {
      // 効率が悪くまだ余裕がある → 今は作らない
      continue;
    }

    // 緊急度 = 残り日数が少ないほど高い
    const urgencyScore = 1000 - qu.remainingDays + qu.quest.rewardReputation * 5;
    urgentQuestRecipes.push({ recipe: qu.recipe, quest: qu, urgencyScore });
  }

  // 緊急度順でソート（最も切迫している依頼を優先）
  urgentQuestRecipes.sort((a, b) => b.urgencyScore - a.urgencyScore);

  // 候補レシピを決定
  let bestRecipe: RecipeDef;
  let quantity = 1;
  let isQuestCraft = false;

  if (urgentQuestRecipes.length > 0) {
    // 緊急依頼がある場合: 最も切迫した依頼のレシピを選択
    // ただし、この調合が他の依頼を失効させないか確認
    let selectedQuestRecipe: typeof urgentQuestRecipes[0] | null = null;

    for (const candidate of urgentQuestRecipes) {
      // この調合にかかる日数
      const craftDays = candidate.recipe.craftDaysTenths;

      // 他の依頼がこの調合期間中に失効しないかチェック
      const wouldExpireOther = questUrgency.some(other => {
        if (other.quest.id === candidate.quest.quest.id) return false; // 同じ依頼はスキップ
        if (!other.needsToCraft) return false; // 既に納品可能なら問題なし
        // 既に達成不可能な依頼（残り日数 < 必要調合日数）はブロックしない
        if (other.remainingDays < other.craftDays) return false;
        // この調合中に他の依頼が失効する？
        return other.remainingDays <= craftDays;
      });

      if (!wouldExpireOther) {
        selectedQuestRecipe = candidate;
        break;
      } else {
        // 他の依頼が失効してしまうので、先にそちらの依頼の調合を試みる
        log('craft', 'info', `「${candidate.quest.quest.title}」の調合(${craftDays}日)は他の依頼を失効させるためスキップ`);
      }
    }

    if (selectedQuestRecipe) {
      bestRecipe = selectedQuestRecipe.recipe;
      isQuestCraft = true;

      // 必要数を計算
      const q = selectedQuestRecipe.quest.quest;
      const owned = state.inventory.filter(i => i.itemId === q.requiredItemId).length;
      const needed = q.requiredQuantity - q.deliveredCount - owned;
      if (needed > 1) {
        quantity = Math.min(needed, getMaxCraftQuantity(bestRecipe, state));
      }
    } else {
      // 全ての依頼レシピが他を失効させる場合: 日数が短い順でフォールバック
      bestRecipe = selectNonQuestRecipe(craftableRecipes, state);
    }
  } else {
    // 依頼レシピがない場合: 経験値効率でソート（日数が短いものを優先）
    bestRecipe = selectNonQuestRecipe(craftableRecipes, state);
  }

  // 依頼でない調合の場合、長すぎるレシピは避ける
  if (!isQuestCraft && state.activeQuests.length > 0) {
    // 達成可能な依頼のみ考慮（残り日数 >= 必要調合日数）
    const achievableQuests = questUrgency.filter(q => q.needsToCraft && q.remainingDays >= q.craftDays);
    const minQuestRemaining = Math.min(
      ...achievableQuests.map(q => q.remainingDays),
      999
    );
    // アクティブ依頼の最短残り日数より長い調合は避ける
    if (bestRecipe.craftDaysTenths > minQuestRemaining) {
      const shorterRecipes = craftableRecipes
        .filter(r => r.craftDaysTenths <= minQuestRemaining)
        .sort((a, b) => (b.expReward / Math.max(1, b.craftDaysTenths)) - (a.expReward / Math.max(1, a.craftDaysTenths)));
      if (shorterRecipes.length > 0) {
        bestRecipe = shorterRecipes[0];
      }
    }
  }

  // 調合実行（proper alchemy service使用）
  const result = craftMultiple(bestRecipe.id, quantity);

  const itemDef = items[bestRecipe.resultItemId];
  const name = itemDef?.name ?? bestRecipe.name;

  if (result.successCount > 0) {
    log('craft', 'success', `${name} x${result.successCount}${result.duplicatedCount > 0 ? `(+複製${result.duplicatedCount})` : ''} +${result.totalExpGained}Exp (${bestRecipe.craftDaysTenths}日)`, bestRecipe.craftDaysTenths);
  } else {
    log('craft', 'error', `${name}の調合に失敗 +${result.totalExpGained}Exp`, bestRecipe.craftDaysTenths);
  }

  await processActionComplete();
  await endTurn(bestRecipe.craftDaysTenths);
  return true;
}

/**
 * 依頼以外の調合レシピを選択（経験値効率 / 日数で最適化）
 */
function selectNonQuestRecipe(craftableRecipes: RecipeDef[], state: GameState): RecipeDef {
  // 短い日数で高い経験値効率のレシピを優先
  const sorted = [...craftableRecipes].sort((a, b) => {
    const aEfficiency = a.expReward / Math.max(1, a.craftDaysTenths);
    const bEfficiency = b.expReward / Math.max(1, b.craftDaysTenths);
    if (Math.abs(aEfficiency - bEfficiency) > 0.5) return bEfficiency - aEfficiency;
    // 効率が同程度なら日数が短い方を優先
    return a.craftDaysTenths - b.craftDaysTenths;
  });
  return sorted[0];
}

/**
 * 現在の最高Exp/日効率を取得（レベル内で調合可能なレシピから）
 */
function getOptimalCraftEfficiency(state: GameState): number {
  const alchemyLv = calcLevelFromExp(state.alchemyExp);
  let best = 0;
  for (const recipeId of state.knownRecipes) {
    const recipe = recipes[recipeId];
    if (!recipe) continue;
    // 成功率が低いレシピは効率が悪いので除外
    if (recipe.requiredLevel > alchemyLv + 3) continue;
    const eff = recipe.expReward / Math.max(1, recipe.craftDaysTenths);
    if (eff > best) best = eff;
  }
  return best;
}

/**
 * レシピを何個まで調合できるか（素材数から計算）
 */
function getMaxCraftQuantity(recipe: RecipeDef, state: GameState): number {
  let maxQty = 999;
  for (const ing of recipe.ingredients) {
    let owned: number;
    if (ing.itemId) {
      owned = state.inventory.filter(i => i.itemId === ing.itemId).length;
    } else if (ing.category) {
      owned = state.inventory.filter(i => items[i.itemId]?.category === ing.category).length;
    } else {
      owned = 0;
    }
    maxQty = Math.min(maxQty, Math.floor(owned / ing.quantity));
  }
  return Math.max(1, maxQty);
}

// =====================================================================
// 採取隊派遣（最適エリア選択）
// =====================================================================

async function tryDispatchBestExpedition(state: GameState): Promise<boolean> {
  // 必要な素材に基づいてエリアを選択
  const neededMaterials = getNeededMaterials(state);
  const areaScores: { areaId: string; score: number; duration: number }[] = [];

  for (const [areaId, area] of Object.entries(areas)) {
    const cost3 = area.costPerDay * 3;
    if (state.money < cost3) continue;

    let score = 0;
    // このエリアのドロップが必要な素材と一致するかチェック
    for (const drop of [...area.drops, ...area.rareDrops]) {
      if (neededMaterials.has(drop.itemId)) {
        score += 10;
      }
      // ドロップ価値も考慮
      const dropDef = items[drop.itemId];
      if (dropDef) {
        score += dropDef.basePrice / 10;
      }
    }

    areaScores.push({ areaId, score, duration: 3 });
  }

  if (areaScores.length === 0) return false;

  // 最高スコアのエリアを選択
  areaScores.sort((a, b) => b.score - a.score);
  const best = areaScores[0];

  const area = areas[best.areaId];
  const cost = area.costPerDay * best.duration;

  const expedition: Expedition = {
    areaId: best.areaId,
    startDay: state.day,
    duration: best.duration,
  };

  gameState.update(s => ({
    ...s,
    money: s.money - cost,
    expedition,
  }));

  incrementExpeditionCount();
  log('expedition', 'success', `採取隊を${area.name}に派遣 (${best.duration}日, ${cost}G, スコア${Math.floor(best.score)})`);
  await processActionComplete();
  return true;
}

/**
 * 不足している素材IDのセットを取得
 */
function getNeededMaterials(state: GameState): Set<string> {
  const needed = new Set<string>();
  const alchemyLv = calcLevelFromExp(state.alchemyExp);

  for (const recipeId of state.knownRecipes) {
    const recipe = recipes[recipeId];
    if (!recipe) continue;

    for (const ing of recipe.ingredients) {
      if (!ing.itemId) continue;
      const owned = state.inventory.filter(i => i.itemId === ing.itemId).length;
      if (owned < ing.quantity) {
        needed.add(ing.itemId);
      }
    }
  }

  return needed;
}

// =====================================================================
// 休息
// =====================================================================

async function doRest(): Promise<void> {
  gameState.update(s => ({
    ...s,
    stamina: s.maxStamina,
  }));

  log('rest', 'success', '休息', 1);
  await endTurn(1);
}
