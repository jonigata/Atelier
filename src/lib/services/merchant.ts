import { get } from 'svelte/store';
import {
  gameState,
  addMessage,
  addMorningEvent,
  addItem,
  addMoney,
} from '$lib/stores/game';
import { getMonth, isMerchantVisiting } from './calendar';
import { getAllEquipment, getEquipment } from '$lib/data/equipment';
import { books, getBook } from '$lib/data/books';
import { items, getItem } from '$lib/data/items';
import { MERCHANT } from '$lib/data/balance';
import type { MerchantLineup, MerchantSlot, GameState } from '$lib/models/types';

/**
 * マルコの来訪・出発イベントをチェック
 * processMorningPhase() から呼び出される
 */
export function checkMerchantEvents(): void {
  const state = get(gameState);
  const month = getMonth(state.day);
  const visiting = isMerchantVisiting(state.day);

  // 来訪: visit期間中 AND 今月のlineupが未生成
  if (visiting && (!state.merchantLineup || state.merchantLineup.month !== month)) {
    if (!state.merchantVisitedMonths.includes(month)) {
      const lineup = generateMerchantLineup(month, state);
      gameState.update((s) => ({
        ...s,
        merchantLineup: lineup,
        merchantVisitedMonths: [...s.merchantVisitedMonths, month],
      }));

      addMorningEvent({
        type: 'merchant_arrival',
        message: `旅商人マルコが村にやってきた！（${month}月の品揃え）`,
      });
      addMessage(`旅商人マルコが村にやってきた！`);
    }
  }

  // 出発: visit期間外 AND lineupが残っている
  if (!visiting && state.merchantLineup) {
    addMorningEvent({
      type: 'merchant_departure',
      message: 'マルコは次の村へ旅立ちました。また来月！',
    });
    addMessage('マルコは次の村へ旅立ちました。');

    gameState.update((s) => ({
      ...s,
      merchantLineup: null,
    }));
  }
}

/**
 * 月のラインナップを生成
 * 構成: 機材1 + レシピ本1 + レア素材1-2
 */
export function generateMerchantLineup(month: number, state: GameState): MerchantLineup {
  const slots: MerchantSlot[] = [];

  // 枠1: 未所持の機材からランダム1つ
  const allEquipment = getAllEquipment();
  const unowned = allEquipment.filter((e) => !state.ownedEquipment.includes(e.id));
  if (unowned.length > 0) {
    const selected = unowned[Math.floor(Math.random() * unowned.length)];
    slots.push({
      type: 'equipment',
      id: selected.id,
      price: selected.price,
      purchased: false,
    });
  }

  // 枠2: 未所持のレシピ本からランダム1つ
  const unownedBooks = Object.values(books).filter(
    (b) => !state.ownedBooks.includes(b.id),
  );
  if (unownedBooks.length > 0) {
    const selected = unownedBooks[Math.floor(Math.random() * unownedBooks.length)];
    slots.push({
      type: 'recipe_book',
      id: selected.id,
      price: Math.floor(selected.basePrice * MERCHANT.RECIPE_BOOK_PRICE_RATE),
      purchased: false,
    });
  }

  // 枠3: レア素材
  const rareMaterials = getRareMaterialPool(state);
  if (rareMaterials.length > 0) {
    const selected = rareMaterials[Math.floor(Math.random() * rareMaterials.length)];
    slots.push({
      type: 'rare_material',
      id: selected.id,
      price: Math.floor(selected.basePrice * MERCHANT.RARE_MATERIAL_PRICE_RATE),
      purchased: false,
    });
  }

  // 枠4: 50%で追加レア素材
  if (Math.random() < MERCHANT.EXTRA_SLOT_CHANCE && rareMaterials.length > 1) {
    const alreadyOffered = new Set(slots.filter((s) => s.type === 'rare_material').map((s) => s.id));
    const remaining = rareMaterials.filter((m) => !alreadyOffered.has(m.id));
    if (remaining.length > 0) {
      const selected = remaining[Math.floor(Math.random() * remaining.length)];
      slots.push({
        type: 'rare_material',
        id: selected.id,
        price: Math.floor(selected.basePrice * MERCHANT.RARE_MATERIAL_PRICE_RATE),
        purchased: false,
      });
    }
  }

  return { month, slots };
}

/**
 * レア素材プール（錬金レベルで段階的に開放）
 */
function getRareMaterialPool(state: GameState): { id: string; basePrice: number }[] {
  return Object.values(items)
    .filter((item) => {
      // 製品カテゴリは除外
      if (item.category === 'product') return false;
      // basePrice 80以上をレアとみなす
      if (item.basePrice < 80) return false;
      // レベルによるゲート
      if (item.basePrice >= 500 && state.alchemyLevel < 10) return false;
      if (item.basePrice >= 150 && state.alchemyLevel < 5) return false;
      return true;
    })
    .map((item) => ({ id: item.id, basePrice: item.basePrice }));
}

/**
 * マルコの商品を購入
 */
export function purchaseMerchantSlot(slotIndex: number): boolean {
  const state = get(gameState);
  if (!state.merchantLineup) return false;

  const slot = state.merchantLineup.slots[slotIndex];
  if (!slot || slot.purchased) return false;
  if (state.money < slot.price) {
    addMessage(`所持金が足りない（必要: ${slot.price}G）`);
    return false;
  }

  // 代金を引く
  addMoney(-slot.price);

  // 種類別の処理
  switch (slot.type) {
    case 'equipment': {
      const equipDef = getEquipment(slot.id);
      if (!equipDef) return false;
      gameState.update((s) => ({
        ...s,
        ownedEquipment: [...s.ownedEquipment, slot.id],
        // 釜カテゴリかつ未装着なら自動装着
        activeCauldron:
          equipDef.category === 'cauldron' && !s.activeCauldron ? slot.id : s.activeCauldron,
      }));
      addMessage(`機材「${equipDef.name}」を購入した！`);
      break;
    }

    case 'recipe_book': {
      const book = getBook(slot.id);
      if (!book) return false;
      gameState.update((s) => ({
        ...s,
        ownedBooks: s.ownedBooks.includes(slot.id)
          ? s.ownedBooks
          : [...s.ownedBooks, slot.id],
      }));
      addMessage(`レシピ本「${book.name}」を購入した！`);
      break;
    }

    case 'rare_material': {
      const itemDef = getItem(slot.id);
      if (!itemDef) return false;
      const quality =
        Math.floor(
          Math.random() * (MERCHANT.RARE_MATERIAL_QUALITY_MAX - MERCHANT.RARE_MATERIAL_QUALITY_MIN + 1),
        ) + MERCHANT.RARE_MATERIAL_QUALITY_MIN;
      addItem({
        itemId: slot.id,
        quality,
        origin: {
          type: 'merchant',
          day: state.day,
          flavorText: 'マルコが遠い国から持ってきた品',
        },
      });
      addMessage(`${itemDef.name}（品質${quality}）を購入した！`);
      break;
    }
  }

  // 購入済みフラグ
  gameState.update((s) => {
    if (!s.merchantLineup) return s;
    return {
      ...s,
      merchantLineup: {
        ...s.merchantLineup,
        slots: s.merchantLineup.slots.map((sl, i) =>
          i === slotIndex ? { ...sl, purchased: true } : sl,
        ),
      },
    };
  });

  return true;
}
