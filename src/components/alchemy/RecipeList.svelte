<script lang="ts">
  import { countAvailableIngredients, calculateSuccessRate } from '$lib/services/alchemy';
  import { hasRequiredFacilities, getMissingFacilities } from '$lib/services/facility';
  import { getItem, getItemIcon, handleIconError } from '$lib/data/items';
  import { getCategoryName } from '$lib/data/categories';
  import { calcLevelFromExp } from '$lib/data/balance';
  import { formatCraftDays } from '$lib/services/equipmentEffects';
  import { gameState } from '$lib/stores/game';
  import type { RecipeDef, Ingredient } from '$lib/models/types';

  export let recipes: RecipeDef[];
  export let onSelect: (recipe: RecipeDef) => void;

  function getActiveQuestsForItem(itemId: string) {
    return $gameState.activeQuests.filter(q => q.requiredItemId === itemId);
  }

  function getAvailableQuestsForItem(itemId: string) {
    return $gameState.availableQuests.filter(q => q.requiredItemId === itemId);
  }

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
    if (!hasRequiredFacilities(recipe)) return false;
    for (const ing of recipe.ingredients) {
      if (countAvailableIngredients(ing) < ing.quantity) return false;
    }
    return true;
  }

  function getResultDescription(recipe: RecipeDef): string {
    const item = getItem(recipe.resultItemId);
    return item?.description || '';
  }

  function getDisabledReason(recipe: RecipeDef): string | null {
    if (!hasRequiredFacilities(recipe)) {
      const missing = getMissingFacilities(recipe);
      return '設備不足: ' + missing.map(f => f.name).join(', ');
    }
    for (const ing of recipe.ingredients) {
      if (countAvailableIngredients(ing) < ing.quantity) return '素材不足';
    }
    return null;
  }
</script>

<div class="recipe-list">
  {#if recipes.length === 0}
    <p class="no-recipes">習得済みのレシピがありません。勉強してレシピを習得しましょう。</p>
  {:else}
    {#each recipes as recipe}
      {@const craftable = canCraft(recipe)}
      {@const reason = !craftable ? getDisabledReason(recipe) : null}
      {@const facilityMissing = !hasRequiredFacilities(recipe)}
      {@const alchemyLevel = calcLevelFromExp($gameState.alchemyExp)}
      {@const levelDeficit = recipe.requiredLevel - alchemyLevel}
      {@const successRate = calculateSuccessRate(recipe, alchemyLevel)}
      <button
        class="recipe-item"
        class:disabled={!craftable}
        class:level-warning={levelDeficit > 0}
        on:click={() => onSelect(recipe)}
      >
        <div class="recipe-header">
          <img class="recipe-icon" class:silhouette={!$gameState.discoveredItems.includes(recipe.resultItemId)} src={getItemIcon(recipe.resultItemId)} alt={recipe.name} on:error={handleIconError} />
          <div class="recipe-name-block">
            <div class="recipe-name-row">
              <span class="recipe-name">{recipe.name}</span>
              {#if levelDeficit > 0}
                <span class="level-deficit-badge">Lv.{recipe.requiredLevel} ({Math.round(successRate * 100)}%)</span>
              {/if}
              {#each getActiveQuestsForItem(recipe.resultItemId) as quest}
                <span class="quest-badge active">{quest.title}({quest.requiredQuantity})</span>
              {/each}
              {#each getAvailableQuestsForItem(recipe.resultItemId) as quest}
                <span class="quest-badge available">{quest.title}({quest.requiredQuantity})</span>
              {/each}
            </div>
            {#if getResultDescription(recipe)}
              <span class="recipe-description">{getResultDescription(recipe)}</span>
            {/if}
          </div>
          <span class="recipe-days">{formatCraftDays(recipe.craftDaysTenths)}</span>
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
        {#if recipe.requiredFacilities && recipe.requiredFacilities.length > 0}
          <div class="recipe-facilities">
            {#each getMissingFacilities(recipe) as facility}
              <span class="facility-tag missing">🔒 {facility.name}</span>
            {/each}
          </div>
        {/if}
        {#if reason}
          <span class="craft-status" class:facility-status={facilityMissing}>{reason}</span>
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

  .recipe-item.disabled:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #5a5a7a;
  }

  .recipe-item.disabled {
    opacity: 0.6;
    cursor: pointer;
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

  .recipe-icon.silhouette {
    filter: brightness(0) saturate(0) opacity(0.3);
  }

  .recipe-name-block {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .recipe-name-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .recipe-name {
    font-size: 1.1rem;
    font-weight: bold;
  }

  .quest-badge {
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .quest-badge.active {
    background: rgba(255, 152, 0, 0.25);
    border: 1px solid #ff9800;
    color: #ffb74d;
  }

  .quest-badge.available {
    background: rgba(100, 181, 246, 0.2);
    border: 1px solid #64b5f6;
    color: #90caf9;
  }

  .recipe-description {
    font-size: 0.8rem;
    color: #8a8a9a;
    margin-top: 0.15rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

  .recipe-facilities {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    font-size: 0.8rem;
  }

  .facility-tag.missing {
    padding: 0.15rem 0.4rem;
    background: rgba(255, 152, 0, 0.2);
    border: 1px solid #ff9800;
    border-radius: 4px;
    color: #ffb74d;
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

  .craft-status.facility-status {
    background: #e65100;
  }

  .recipe-item.level-warning {
    border-color: #8a6a2a;
  }

  .recipe-item.level-warning:hover:not(.disabled) {
    border-color: #b8860b;
  }

  .level-deficit-badge {
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
    white-space: nowrap;
    flex-shrink: 0;
    background: rgba(255, 152, 0, 0.2);
    border: 1px solid #ff9800;
    color: #ffb74d;
  }
</style>
