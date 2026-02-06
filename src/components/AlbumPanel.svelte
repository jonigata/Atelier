<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { items, getItemIcon, handleIconError } from '$lib/data/items';
  import { CATEGORY_NAMES } from '$lib/data/categories';
  import type { ItemCategory } from '$lib/models/types';

  export let onBack: () => void;

  let filterCategory: string = 'all';

  // 全アイテムリスト
  const allItems = Object.values(items);
  const totalItemCount = allItems.length;

  // カテゴリ一覧
  const categories = [...new Set(allItems.map(item => item.category))];

  // カテゴリ別のアイテム数
  function getCategoryItemCount(category: string): number {
    return allItems.filter(item => item.category === category).length;
  }

  // カテゴリ別の発見済み数
  function getCategoryDiscoveredCount(category: string, discovered: string[]): number {
    return allItems.filter(item => item.category === category && discovered.includes(item.id)).length;
  }

  // フィルター済みアイテム
  $: discoveredItems = $gameState.discoveredItems;
  $: discoveredCount = discoveredItems.length;

  $: filteredItems = filterCategory === 'all'
    ? allItems
    : allItems.filter(item => item.category === filterCategory);

  // カテゴリごとにグルーピングして表示
  $: groupedItems = (() => {
    const groups: { category: ItemCategory; label: string; items: typeof allItems }[] = [];
    const categoryOrder: ItemCategory[] = ['herb', 'ore', 'water', 'plant', 'wood', 'crystal', 'misc', 'product'];

    if (filterCategory === 'all') {
      for (const cat of categoryOrder) {
        const catItems = allItems.filter(item => item.category === cat);
        if (catItems.length > 0) {
          groups.push({
            category: cat,
            label: CATEGORY_NAMES[cat] || cat,
            items: catItems,
          });
        }
      }
    } else {
      const catItems = allItems.filter(item => item.category === filterCategory);
      if (catItems.length > 0) {
        groups.push({
          category: filterCategory as ItemCategory,
          label: CATEGORY_NAMES[filterCategory as ItemCategory] || filterCategory,
          items: catItems,
        });
      }
    }
    return groups;
  })();
</script>

<div class="album-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>
    <img class="title-icon" src="/icons/actions/album.png" alt="" on:error={handleIconError} />
    アイテムアルバム
  </h2>

  <div class="album-header">
    <div class="collection-rate">
      <span class="rate-label">収集率</span>
      <span class="rate-value">{discoveredCount} / {totalItemCount}</span>
      <div class="rate-bar">
        <div class="rate-fill" style="width: {(discoveredCount / totalItemCount) * 100}%"></div>
      </div>
      <span class="rate-percent">{Math.floor((discoveredCount / totalItemCount) * 100)}%</span>
    </div>

    <div class="filter-group">
      <label for="album-filter">カテゴリ:</label>
      <select id="album-filter" bind:value={filterCategory}>
        <option value="all">すべて</option>
        {#each categories as cat}
          <option value={cat}>
            {CATEGORY_NAMES[cat] || cat} ({getCategoryDiscoveredCount(cat, discoveredItems)}/{getCategoryItemCount(cat)})
          </option>
        {/each}
      </select>
    </div>
  </div>

  {#each groupedItems as group}
    <div class="category-group">
      <h3 class="category-title">
        {group.label}
        <span class="category-count">
          {getCategoryDiscoveredCount(group.category, discoveredItems)}/{group.items.length}
        </span>
      </h3>
      <div class="item-grid">
        {#each group.items as item}
          {@const isDiscovered = discoveredItems.includes(item.id)}
          <div class="album-item" class:undiscovered={!isDiscovered}>
            {#if isDiscovered}
              <img class="item-icon" src={getItemIcon(item.id)} alt={item.name} on:error={handleIconError} />
              <div class="item-info">
                <span class="item-name">{item.name}</span>
                <span class="item-desc">{item.description}</span>
              </div>
            {:else}
              <div class="silhouette-wrapper">
                <img class="item-icon silhouette" src={getItemIcon(item.id)} alt="???" on:error={handleIconError} />
              </div>
              <div class="item-info">
                <span class="item-name unknown">???</span>
                <span class="item-desc unknown">まだ発見されていないアイテム</span>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .album-panel {
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
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .title-icon {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  .album-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
  }

  .collection-rate {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .rate-label {
    color: #c9a959;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .rate-value {
    color: #e0e0f0;
    font-size: 0.9rem;
  }

  .rate-bar {
    width: 120px;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .rate-fill {
    height: 100%;
    background: linear-gradient(90deg, #c9a959, #e0c080);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .rate-percent {
    color: #c9a959;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-group label {
    font-size: 0.85rem;
    color: #a0a0b0;
  }

  .filter-group select {
    padding: 0.3rem 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #e0e0f0;
    font-size: 0.9rem;
  }

  .category-group {
    margin-bottom: 1.5rem;
  }

  .category-title {
    font-size: 1rem;
    color: #c9a959;
    margin-bottom: 0.75rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid #3a3a5a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .category-count {
    font-size: 0.8rem;
    color: #808090;
    font-weight: normal;
  }

  .item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.5rem;
  }

  .album-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .album-item:hover:not(.undiscovered) {
    background: rgba(255, 255, 255, 0.1);
    border-color: #6a6a8a;
  }

  .album-item.undiscovered {
    background: rgba(0, 0, 0, 0.2);
    border-color: #3a3a5a;
  }

  .item-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .silhouette-wrapper {
    flex-shrink: 0;
  }

  .item-icon.silhouette {
    filter: brightness(0) saturate(0) opacity(0.3);
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .item-name {
    font-weight: bold;
    color: #e0e0f0;
    font-size: 0.9rem;
  }

  .item-name.unknown {
    color: #606080;
  }

  .item-desc {
    font-size: 0.75rem;
    color: #a0a0b0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-desc.unknown {
    color: #505060;
    font-style: italic;
  }
</style>
