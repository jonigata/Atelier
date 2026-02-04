<script lang="ts">
  import { gameState, addMessage, addMoney, addItem, addSalesAmount } from '$lib/stores/game';
  import { items, getItem } from '$lib/data/items';
  import { removeItemFromInventory } from '$lib/services/inventory';
  import { SHOP } from '$lib/data/balance';
  import type { OwnedItem, ItemDef } from '$lib/models/types';

  export let onBack: () => void;

  type Tab = 'buy' | 'sell';
  let activeTab: Tab = 'buy';

  // 村発展度に応じた購入可能アイテム
  $: buyableItems = getBuyableItems($gameState.villageDevelopment);

  function getBuyableItems(development: number): ItemDef[] {
    const allMaterials = Object.values(items).filter(
      (item) => item.category !== 'product'
    );

    return allMaterials.filter((item) => {
      // 発展度0-9: 基本素材のみ（薬草、清水）
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

  // 購入処理
  function buyItem(item: ItemDef) {
    const price = item.basePrice;
    if ($gameState.money < price) {
      addMessage(`所持金が足りません（必要: ${price}G）`);
      return;
    }

    addMoney(-price);
    // 品質はランダム（40-70）
    const quality = Math.floor(Math.random() * 31) + 40;
    addItem({ itemId: item.id, quality });
    addMessage(`${item.name}（品質${quality}）を${price}Gで購入しました`);
  }

  // 売却処理
  function sellItem(item: OwnedItem) {
    const def = getItem(item.itemId);
    if (!def) return;

    // 売却価格 = 基本価格 × (品質 / 50) × 売却係数
    const price = Math.floor(def.basePrice * (item.quality / 50) * SHOP.SELL_PRICE_RATE);

    // インベントリから削除
    gameState.update((state) => ({
      ...state,
      inventory: removeItemFromInventory(state.inventory, item.itemId, item.quality),
    }));

    addMoney(price);
    addSalesAmount(price);
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
    return Math.floor(def.basePrice * (item.quality / 50) * SHOP.SELL_PRICE_RATE);
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
        {@const canBuy = $gameState.money >= item.basePrice}
        <div class="shop-item" class:disabled={!canBuy}>
          <div class="item-info">
            <span class="item-name">{item.name}</span>
            <span class="item-desc">{item.description}</span>
          </div>
          <div class="item-action">
            <span class="item-price">{item.basePrice}G</span>
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
              <h4>{def.name} ({items.length}個)</h4>
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
    max-height: 400px;
    overflow-y: auto;
  }

  .shop-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
  }

  .shop-item.disabled {
    opacity: 0.5;
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
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
  }

  .item-price {
    color: #c9a959;
    font-weight: bold;
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
