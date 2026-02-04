<script lang="ts">
  import { getItem, getItemIcon } from '$lib/data/items';
  import { getCategoryName } from '$lib/data/categories';
  import type { OwnedItem, Ingredient } from '$lib/models/types';

  export let items: OwnedItem[];
  export let currentIngredient: Ingredient | null;
  export let onSelect: (item: OwnedItem) => void;

  function getIngredientName(ing: Ingredient): string {
    if (ing.itemId) {
      const item = getItem(ing.itemId);
      return item?.name || ing.itemId;
    }
    if (ing.category) {
      return getCategoryName(ing.category);
    }
    return '???';
  }
</script>

<div class="item-selection">
  <h4>
    {#if currentIngredient}
      {getIngredientName(currentIngredient)} を選んでください
    {/if}
  </h4>
  {#if items.length === 0}
    <p class="no-items">選択可能なアイテムがありません</p>
  {:else}
    <div class="available-items">
      {#each items as item}
        {@const def = getItem(item.itemId)}
        <button class="item-btn" on:click={() => onSelect(item)}>
          <img class="item-icon" src={getItemIcon(item.itemId)} alt={def?.name || item.itemId} />
          <span class="item-name">{def?.name || item.itemId}</span>
          <span class="item-quality">品質 {item.quality}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .item-selection {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  h4 {
    font-size: 1rem;
    color: #c9a959;
    margin-bottom: 0.5rem;
  }

  .available-items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .item-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #e0e0f0;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .item-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
    margin-bottom: 0.25rem;
  }

  .item-btn:hover {
    background: rgba(201, 169, 89, 0.2);
    border-color: #c9a959;
  }

  .item-name {
    font-weight: bold;
  }

  .item-quality {
    font-size: 0.8rem;
    color: #a0a0b0;
  }

  .no-items {
    color: #ff6b6b;
    font-style: italic;
    padding: 1rem;
    text-align: center;
  }
</style>
