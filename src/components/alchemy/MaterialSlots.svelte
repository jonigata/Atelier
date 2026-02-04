<script lang="ts">
  import { getItem } from '$lib/data/items';
  import { getCategoryName } from '$lib/data/categories';
  import { matchesIngredient } from '$lib/services/alchemy';
  import type { OwnedItem, Ingredient } from '$lib/models/types';

  export let ingredients: Ingredient[];
  export let selectedItems: OwnedItem[];
  export let craftQuantity: number;
  export let currentIngredient: Ingredient | null;
  export let onUndoLast: () => void;

  interface IngredientStatus {
    ingredient: Ingredient;
    totalNeeded: number;
    selectedCount: number;
  }

  $: ingredientStatus = ingredients.map((ing): IngredientStatus => {
    const totalNeeded = ing.quantity * craftQuantity;
    const selectedCount = selectedItems.filter((item) => matchesIngredient(item, ing)).length;
    return { ingredient: ing, totalNeeded, selectedCount };
  });

  $: totalRequired = ingredients.reduce((sum, ing) => sum + ing.quantity, 0) * craftQuantity;

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

  function getSelectedForIngredient(ing: Ingredient): OwnedItem[] {
    return selectedItems.filter((item) => matchesIngredient(item, ing));
  }
</script>

<div class="material-slots">
  <h4>素材を選択 ({selectedItems.length}/{totalRequired})</h4>
  {#each ingredientStatus as status}
    {@const isActive = currentIngredient === status.ingredient}
    {@const isComplete = status.selectedCount >= status.totalNeeded}
    {@const lastSelectedItem = selectedItems.length > 0 ? selectedItems[selectedItems.length - 1] : null}
    {@const lastItemBelongsHere = lastSelectedItem && matchesIngredient(lastSelectedItem, status.ingredient)}
    {@const selectedForThis = getSelectedForIngredient(status.ingredient)}
    <div class="ingredient-row" class:active={isActive} class:complete={isComplete}>
      <div class="ingredient-header">
        <span class="ingredient-name">{getIngredientName(status.ingredient)}</span>
        <span class="ingredient-progress">{status.selectedCount}/{status.totalNeeded}</span>
      </div>
      <div class="ingredient-slots">
        {#each selectedForThis as item, idx}
          {@const isLastOverall = lastItemBelongsHere && idx === status.selectedCount - 1}
          <button
            class="slot filled"
            class:removable={isLastOverall}
            on:click={() => isLastOverall && onUndoLast()}
            disabled={!isLastOverall}
          >
            <span class="slot-quality">品質 {item.quality}</span>
            {#if isLastOverall}<span class="slot-remove">×</span>{/if}
          </button>
        {/each}
        {#each Array(Math.max(0, status.totalNeeded - status.selectedCount)) as _, idx}
          <div class="slot" class:active={isActive && idx === 0}>
            {#if isActive && idx === 0}
              <span class="slot-prompt">選択中</span>
            {:else}
              <span class="slot-empty">―</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .material-slots {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
  }

  h4 {
    font-size: 1rem;
    color: #c9a959;
    margin-bottom: 0.5rem;
  }

  .ingredient-row {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid #3a3a5a;
    border-radius: 6px;
  }

  .ingredient-row.active {
    border-color: #c9a959;
    background: rgba(201, 169, 89, 0.1);
  }

  .ingredient-row.complete {
    border-color: #4caf50;
    background: rgba(76, 175, 80, 0.1);
  }

  .ingredient-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .ingredient-name {
    font-weight: bold;
    color: #e0e0f0;
  }

  .ingredient-progress {
    color: #a0a0b0;
    font-size: 0.9rem;
  }

  .ingredient-slots {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 60px;
    height: 36px;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    cursor: default;
    position: relative;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed #4a4a6a;
    color: #606070;
  }

  .slot.active {
    background: rgba(201, 169, 89, 0.15);
    border: 2px solid #c9a959;
    color: #c9a959;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(201, 169, 89, 0.4); }
    50% { box-shadow: 0 0 0 4px rgba(201, 169, 89, 0); }
  }

  .slot.filled {
    background: rgba(76, 175, 80, 0.15);
    border: 1px solid #4caf50;
    color: #e0f0e0;
  }

  .slot.filled.removable {
    cursor: pointer;
  }

  .slot.filled.removable:hover {
    background: rgba(255, 100, 100, 0.15);
    border-color: #ff6b6b;
  }

  .slot.filled:disabled:not(.removable) {
    cursor: default;
    opacity: 0.9;
  }

  .slot-quality {
    font-size: 0.7rem;
  }

  .slot-prompt {
    font-style: italic;
    font-size: 0.7rem;
  }

  .slot-empty {
    font-size: 0.9rem;
  }

  .slot-remove {
    position: absolute;
    top: 1px;
    right: 3px;
    font-size: 0.6rem;
    color: #ff6b6b;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .slot.filled.removable:hover .slot-remove {
    opacity: 1;
  }
</style>
