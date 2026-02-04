<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { getItem } from '$lib/data/items';
  import type { OwnedItem } from '$lib/models/types';
  import { CATEGORY_NAMES, getCategoryName } from '$lib/data/categories';

  export let onBack: () => void;

  type SortKey = 'name' | 'quality' | 'category';
  let sortKey: SortKey = 'category';
  let filterCategory: string = 'all';

  // アイテムをグループ化（同一アイテム・同一品質ごとに個数をカウント）
  interface GroupedItem {
    itemId: string;
    quality: number;
    count: number;
    name: string;
    category: string;
  }

  function groupItems(items: OwnedItem[]): GroupedItem[] {
    const grouped = new Map<string, GroupedItem>();

    for (const item of items) {
      const def = getItem(item.itemId);
      if (!def) continue;

      const key = `${item.itemId}_${item.quality}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.count++;
      } else {
        grouped.set(key, {
          itemId: item.itemId,
          quality: item.quality,
          count: 1,
          name: def.name,
          category: def.category,
        });
      }
    }

    return Array.from(grouped.values());
  }

  // ソートとフィルター
  $: groupedItems = groupItems($gameState.inventory);

  $: filteredItems = filterCategory === 'all'
    ? groupedItems
    : groupedItems.filter(item => item.category === filterCategory);

  $: sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortKey) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'quality':
        return b.quality - a.quality;
      case 'category':
        return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // カテゴリ一覧（実際に持っているアイテムのカテゴリのみ）
  $: availableCategories = [...new Set(groupedItems.map(item => item.category))];

  // 合計アイテム数
  $: totalItems = $gameState.inventory.length;
</script>

<div class="inventory-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>📦 インベントリ</h2>

  <div class="inventory-header">
    <span class="total-count">所持アイテム: {totalItems}個</span>

    <div class="controls">
      <div class="filter-group">
        <label for="filter-category">カテゴリ:</label>
        <select id="filter-category" bind:value={filterCategory}>
          <option value="all">すべて</option>
          {#each availableCategories as cat}
            <option value={cat}>{CATEGORY_NAMES[cat as keyof typeof CATEGORY_NAMES] || cat}</option>
          {/each}
        </select>
      </div>

      <div class="sort-group">
        <label for="sort-key">並び替え:</label>
        <select id="sort-key" bind:value={sortKey}>
          <option value="category">カテゴリ</option>
          <option value="name">名前</option>
          <option value="quality">品質</option>
        </select>
      </div>
    </div>
  </div>

  {#if sortedItems.length === 0}
    <div class="empty-inventory">
      <p>アイテムがありません</p>
      <p class="hint">採取に行ってアイテムを集めましょう</p>
    </div>
  {:else}
    <div class="item-grid">
      {#each sortedItems as item}
        <div class="item-card">
          <div class="item-header">
            <span class="item-name">{item.name}</span>
            {#if item.count > 1}
              <span class="item-count">×{item.count}</span>
            {/if}
          </div>
          <div class="item-details">
            <span class="item-category">{CATEGORY_NAMES[item.category as keyof typeof CATEGORY_NAMES] || item.category}</span>
            <span class="item-quality" class:high={item.quality >= 70} class:low={item.quality < 30}>
              品質 {item.quality}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .inventory-panel {
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

  .inventory-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
  }

  .total-count {
    font-size: 1rem;
    color: #c9a959;
  }

  .controls {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .filter-group,
  .sort-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  label {
    font-size: 0.85rem;
    color: #a0a0b0;
  }

  select {
    padding: 0.3rem 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #e0e0f0;
    font-size: 0.9rem;
  }

  .empty-inventory {
    padding: 2rem;
    text-align: center;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .empty-inventory p {
    color: #e0e0f0;
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.9rem;
    color: #a0a0b0 !important;
  }

  .item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  .item-card {
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .item-card:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #6a6a8a;
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .item-name {
    font-weight: bold;
    color: #e0e0f0;
  }

  .item-count {
    background: #c9a959;
    color: #1a1a2e;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-size: 0.8rem;
    font-weight: bold;
  }

  .item-details {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
  }

  .item-category {
    color: #808090;
  }

  .item-quality {
    color: #a0a0b0;
  }

  .item-quality.high {
    color: #81c784;
  }

  .item-quality.low {
    color: #ff6b6b;
  }
</style>
