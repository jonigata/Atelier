<script lang="ts">
  import { getItem } from '$lib/data/items';
  import { getCategoryName } from '$lib/data/categories';
  import ItemCard from '../common/ItemCard.svelte';
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
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div on:click={() => onSelect(item)}>
          <ItemCard itemId={item.itemId} quality={item.quality} clickable={true} />
        </div>
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

  .no-items {
    color: #ff6b6b;
    font-style: italic;
    padding: 1rem;
    text-align: center;
  }
</style>
