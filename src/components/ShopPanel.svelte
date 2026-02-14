<script lang="ts">
  import { gameState, addMessage, addMoney, addItem } from '$lib/stores/game';
  import { addSalesAmount } from '$lib/stores/stats';
  import { items, getItem, getItemIcon, handleIconError } from '$lib/data/items';
  import { getAllEquipment, getEquipment } from '$lib/data/equipment';
  import { removeItemFromInventory } from '$lib/services/inventory';
  import { SHOP } from '$lib/data/balance';
  import { shopFlavors, pickRandom } from '$lib/data/flavorTexts';
  import { getSellPriceMult, getBuyPriceMult, recordSell } from '$lib/services/equipmentEffects';
  import type { OwnedItem, ItemDef, EquipmentDef } from '$lib/models/types';

  export let onBack: () => void;

  type Tab = 'buy' | 'sell';
  let activeTab: Tab = 'buy';

  // 村発展度に応じた購入可能アイテム
  $: buyableItems = getBuyableItems($gameState.villageDevelopment);

  // ショップ機材ラインナップの初期化
  $: if ($gameState.shopEquipment.length === 0) {
    initShopEquipment();
  }

  $: shopEquipmentList = $gameState.shopEquipment
    .map((slot) => ({ slot, def: getEquipment(slot.id) }))
    .filter((e): e is { slot: typeof e.slot; def: EquipmentDef } => e.def !== undefined);

  function initShopEquipment() {
    const all = getAllEquipment();
    const unowned = all.filter((e) => !$gameState.ownedEquipment.includes(e.id));
    // シャッフルして3つ選出
    const shuffled = [...unowned].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    if (selected.length === 0) return;
    gameState.update((s) => ({
      ...s,
      shopEquipment: selected.map((e) => ({ id: e.id, purchased: false })),
    }));
  }

  function getBuyableItems(development: number): ItemDef[] {
    const allMaterials = Object.values(items).filter(
      (item) => item.category !== 'product'
    );

    return allMaterials.filter((item) => {
      // 発展度0-9: 基本素材のみ（ハルマム草、清水）
      if (development < 10) {
        return item.id === 'herb_01' || item.id === 'water_01';
      }
      // 発展度10-19: 中級素材追加（毒消し草、鉄鉱石）
      if (development < 20) {
        return ['herb_01', 'herb_02', 'water_01', 'ore_01'].includes(item.id);
      }
      // 発展度20-49: さらに拡大（獣の皮）
      if (development < 50) {
        return ['herb_01', 'herb_02', 'water_01', 'ore_01', 'misc_01'].includes(item.id);
      }
      // 発展度50+: レア素材も購入可能
      return true;
    });
  }

  // 購入処理（機材効果: 購入割引適用）
  function buyItem(item: ItemDef) {
    const buyMult = getBuyPriceMult();
    const price = Math.max(1, Math.floor(item.basePrice * buyMult));
    if ($gameState.money < price) {
      addMessage(`所持金が足りません（必要: ${price}G）`);
      return;
    }

    addMoney(-price);
    // 品質はランダム（40-70）
    const quality = Math.floor(Math.random() * 31) + 40;
    addItem({
      itemId: item.id,
      quality,
      origin: {
        type: 'shop',
        day: $gameState.day,
        flavorText: pickRandom(shopFlavors),
      },
    });
    addMessage(`${item.name}（品質${quality}）を${price}Gで購入しました`);
  }

  // 機材購入処理
  function buyEquipment(slotIndex: number) {
    const slot = $gameState.shopEquipment[slotIndex];
    if (!slot || slot.purchased) return;

    const equipDef = getEquipment(slot.id);
    if (!equipDef) return;

    if ($gameState.money < equipDef.price) {
      addMessage(`所持金が足りません（必要: ${equipDef.price}G）`);
      return;
    }

    if ($gameState.ownedEquipment.includes(slot.id)) {
      addMessage(`${equipDef.name}は既に所持しています`);
      return;
    }

    addMoney(-equipDef.price);
    gameState.update((s) => ({
      ...s,
      ownedEquipment: [...s.ownedEquipment, slot.id],
      activeCauldron:
        equipDef.category === 'cauldron' && !s.activeCauldron ? slot.id : s.activeCauldron,
      shopEquipment: s.shopEquipment.map((sl, i) =>
        i === slotIndex ? { ...sl, purchased: true } : sl,
      ),
    }));
    addMessage(`機材「${equipDef.name}」を購入した！`);
  }

  // 売却処理（機材効果: 売却価格補正適用）
  function sellItem(item: OwnedItem) {
    const def = getItem(item.itemId);
    if (!def) return;

    // 売却価格 = 基本価格 × (品質 / 50) × 売却係数 × 機材効果
    const basePrice = Math.floor(def.basePrice * (item.quality / 50) * SHOP.SELL_PRICE_RATE);
    const price = Math.max(1, Math.floor(basePrice * getSellPriceMult(item)));

    // インベントリから削除
    gameState.update((state) => ({
      ...state,
      inventory: removeItemFromInventory(state.inventory, item.itemId, item.quality),
    }));

    addMoney(price);
    addSalesAmount(price);
    recordSell();
    addMessage(`${def.name}（品質${item.quality}）を${price}Gで売却しました`);
  }

  // インベントリをアイテムIDでグループ化
  $: groupedInventory = $gameState.inventory.reduce(
    (acc, item) => {
      const key = item.itemId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, OwnedItem[]>
  );

  function getSellPrice(item: OwnedItem): number {
    const def = getItem(item.itemId);
    if (!def) return 0;
    const basePrice = Math.floor(def.basePrice * (item.quality / 50) * SHOP.SELL_PRICE_RATE);
    return Math.max(1, Math.floor(basePrice * getSellPriceMult(item)));
  }
</script>

<div class="shop-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>🏪 ショップ</h2>

  <div class="money-display">
    所持金: <span class="amount">{$gameState.money.toLocaleString()}G</span>
  </div>

  <div class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'buy'}
      on:click={() => (activeTab = 'buy')}
    >
      購入
    </button>
    <button
      class="tab"
      class:active={activeTab === 'sell'}
      on:click={() => (activeTab = 'sell')}
    >
      売却
    </button>
  </div>

  {#if activeTab === 'buy'}
    <div class="item-list">
      {#each buyableItems as item}
        {@const buyMult = getBuyPriceMult()}
        {@const displayPrice = Math.max(1, Math.floor(item.basePrice * buyMult))}
        {@const canBuy = $gameState.money >= displayPrice}
        <div class="shop-item" class:disabled={!canBuy}>
          <img class="item-icon" src={getItemIcon(item.id)} alt={item.name} on:error={handleIconError} />
          <div class="item-info">
            <span class="item-name">{item.name}</span>
            <span class="item-desc">{item.description}</span>
          </div>
          <div class="item-action">
            <span class="item-price">{displayPrice}G{buyMult < 1 ? ' (割引)' : ''}</span>
            <button
              class="buy-btn"
              disabled={!canBuy}
              on:click={() => buyItem(item)}
            >
              購入
            </button>
          </div>
        </div>
      {/each}

      {#if shopEquipmentList.length > 0}
        <h3 class="section-header">機材</h3>
        {#each shopEquipmentList as { slot, def }, i}
          {@const owned = $gameState.ownedEquipment.includes(slot.id)}
          {@const canBuy = !slot.purchased && !owned && $gameState.money >= def.price}
          <div class="shop-item equip-item" class:disabled={!canBuy && !slot.purchased && !owned} class:purchased={slot.purchased || owned}>
            <div class="equip-badge">{def.category === 'cauldron' ? '釜' : '機材'}</div>
            <div class="item-info">
              <span class="item-name">{def.name}</span>
              <span class="item-desc">{def.effectDescription}</span>
            </div>
            <div class="item-action">
              {#if slot.purchased || owned}
                <span class="sold-label">{owned && !slot.purchased ? '所持済' : '購入済'}</span>
              {:else}
                <span class="item-price">{def.price.toLocaleString()}G</span>
                <button
                  class="buy-btn"
                  disabled={!canBuy}
                  on:click={() => buyEquipment(i)}
                >
                  購入
                </button>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>

  {:else}
    <div class="item-list">
      {#if Object.keys(groupedInventory).length === 0}
        <p class="empty">売却できるアイテムがありません</p>
      {:else}
        {#each Object.entries(groupedInventory) as [itemId, items]}
          {@const def = getItem(itemId)}
          {#if def}
            <div class="item-group">
              <div class="item-group-header">
                <img class="item-icon-small" src={getItemIcon(itemId)} alt={def.name} on:error={handleIconError} />
                <h4>{def.name} ({items.length}個)</h4>
              </div>
              <div class="item-variants">
                {#each items as item}
                  <div class="sell-item">
                    <span class="quality">品質 {item.quality}</span>
                    <span class="sell-price">{getSellPrice(item)}G</span>
                    <button class="sell-btn" on:click={() => sellItem(item)}>
                      売却
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .shop-panel {
    padding: 1.5rem;
  }

  .back-btn {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #c0c0d0;
    cursor: pointer;
    margin-bottom: 1rem;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  h2 {
    font-size: 1.5rem;
    color: #f4e4bc;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1rem;
    color: #c9a959;
    margin: 0;
  }

  h4 {
    font-size: 1rem;
    color: #c9a959;
    margin-bottom: 0.5rem;
  }

  .money-display {
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    color: #e0e0f0;
    margin-bottom: 1rem;
  }

  .amount {
    font-size: 1.2rem;
    font-weight: bold;
    color: #c9a959;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .tab {
    flex: 1;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #4a4a6a;
    border-radius: 6px;
    color: #a0a0b0;
    cursor: pointer;
    font-size: 1rem;
  }

  .tab.active {
    border-color: #c9a959;
    color: #f4e4bc;
    background: rgba(201, 169, 89, 0.2);
  }

  .item-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-header {
    padding-top: 0.5rem;
    border-top: 1px solid #4a4a6a;
  }

  .shop-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
  }

  .equip-item {
    border-color: #ff980050;
  }

  .item-icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .item-icon-small {
    width: 32px;
    height: 32px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .shop-item.disabled {
    opacity: 0.5;
  }

  .shop-item.purchased {
    opacity: 0.5;
  }

  .equip-badge {
    padding: 0.2rem 0.5rem;
    font-size: 0.7rem;
    font-weight: bold;
    border-radius: 3px;
    color: #1a1a2e;
    background: #ff9800;
    flex-shrink: 0;
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 0;
  }

  .item-name {
    color: #e0e0f0;
    font-weight: bold;
  }

  .item-desc {
    color: #808090;
    font-size: 0.85rem;
  }

  .item-action {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .item-price {
    color: #c9a959;
    font-weight: bold;
    white-space: nowrap;
  }

  .buy-btn, .sell-btn {
    padding: 0.4rem 0.75rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 4px;
    color: #1a1a2e;
    font-weight: bold;
    cursor: pointer;
  }

  .buy-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .buy-btn:hover:not(:disabled), .sell-btn:hover {
    transform: translateY(-1px);
  }

  .sold-label {
    color: #9e9e9e;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .empty {
    color: #808090;
    text-align: center;
    padding: 2rem;
  }

  .item-group {
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
  }

  .item-group-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .item-group-header h4 {
    margin-bottom: 0;
  }

  .item-variants {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sell-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .quality {
    color: #a0a0b0;
  }

  .sell-price {
    color: #81c784;
    margin-left: auto;
  }
</style>
