<script lang="ts">
  import { countAvailableIngredients } from '$lib/services/alchemy';
  import { getItem, getItemIcon } from '$lib/data/items';
  import { getCategoryName } from '$lib/data/categories';
  import type { RecipeDef, Ingredient } from '$lib/models/types';

  export let recipes: RecipeDef[];
  export let onSelect: (recipe: RecipeDef) => void;

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

  function canCraft(recipe: RecipeDef): boolean {
    for (const ing of recipe.ingredients) {
      if (countAvailableIngredients(ing) < ing.quantity) return false;
    }
    return true;
  }
</script>

<div class="recipe-list">
  {#if recipes.length === 0}
    <p class="no-recipes">習得済みのレシピがありません。勉強してレシピを習得しましょう。</p>
  {:else}
    {#each recipes as recipe}
      {@const craftable = canCraft(recipe)}
      <button
        class="recipe-item"
        class:disabled={!craftable}
        on:click={() => craftable && onSelect(recipe)}
      >
        <div class="recipe-header">
          <img class="recipe-icon" src={getItemIcon(recipe.resultItemId)} alt={recipe.name} />
          <span class="recipe-name">{recipe.name}</span>
          <span class="recipe-days">{recipe.daysRequired}日</span>
        </div>
        <div class="recipe-ingredients">
          {#each recipe.ingredients as ing}
            {@const available = countAvailableIngredients(ing)}
            <span class="ingredient" class:missing={available < ing.quantity}>
              {getIngredientName(ing)}×{ing.quantity}
              <span class="stock">({available}個)</span>
            </span>
          {/each}
        </div>
        {#if !craftable}
          <span class="craft-status">素材不足</span>
        {/if}
      </button>
    {/each}
  {/if}
</div>

<style>
  .recipe-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .no-recipes {
    color: #a0a0b0;
    font-style: italic;
    padding: 2rem;
    text-align: center;
  }

  .recipe-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #4a4a6a;
    border-radius: 8px;
    color: #e0e0f0;
    cursor: pointer;
    text-align: left;
    position: relative;
  }

  .recipe-item:hover:not(.disabled) {
    background: rgba(201, 169, 89, 0.15);
    border-color: #c9a959;
  }

  .recipe-item.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .recipe-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .recipe-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .recipe-name {
    font-size: 1.1rem;
    font-weight: bold;
    flex: 1;
  }

  .recipe-days {
    font-size: 0.85rem;
    color: #a0a0b0;
    margin-left: auto;
  }

  .recipe-ingredients {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .ingredient {
    padding: 0.2rem 0.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }

  .ingredient.missing {
    color: #ff6b6b;
  }

  .stock {
    color: #808090;
    font-size: 0.8rem;
  }

  .craft-status {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.2rem 0.5rem;
    background: #d32f2f;
    color: white;
    font-size: 0.75rem;
    border-radius: 4px;
  }
</style>
