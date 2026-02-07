<script lang="ts">
  import { countAvailableIngredients, calculateSuccessRate } from '$lib/services/alchemy';
  import { hasRequiredFacilities, getMissingFacilities } from '$lib/services/facility';
  import { getItem, getItemIcon, handleIconError } from '$lib/data/items';
  import { getCategoryName } from '$lib/data/categories';
  import { gameState } from '$lib/stores/game';
  import type { RecipeDef, Ingredient } from '$lib/models/types';

  export let recipe: RecipeDef;
  export let onBack: () => void;

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

  $: facilityOk = hasRequiredFacilities(recipe);
  $: missingFacilities = getMissingFacilities(recipe);
  $: successRate = calculateSuccessRate(recipe, $gameState.alchemyLevel);
  $: resultItem = getItem(recipe.resultItemId);
</script>

<div class="recipe-detail">
  <button class="back-btn small" on:click={onBack}>← レシピ選択に戻る</button>

  <div class="detail-header">
    <img class="detail-icon" src={getItemIcon(recipe.resultItemId)} alt={recipe.name} on:error={handleIconError} />
    <div>
      <h3>{recipe.name}</h3>
      {#if resultItem?.description}
        <p class="detail-description">{resultItem.description}</p>
      {/if}
    </div>
  </div>

  <div class="detail-info">
    <div class="info-row">
      <span class="info-label">所要日数</span>
      <span class="info-value">{recipe.daysRequired}日</span>
    </div>
    <div class="info-row">
      <span class="info-label">難易度</span>
      <span class="info-value">{recipe.difficulty}</span>
    </div>
    <div class="info-row">
      <span class="info-label">成功率</span>
      <span class="info-value" class:high={successRate >= 0.8} class:low={successRate < 0.5}>
        {Math.round(successRate * 100)}%
      </span>
    </div>
  </div>

  <div class="ingredients-section">
    <h4>必要素材</h4>
    {#each recipe.ingredients as ing}
      {@const available = countAvailableIngredients(ing)}
      {@const sufficient = available >= ing.quantity}
      <div class="ingredient-row" class:missing={!sufficient}>
        <span class="ingredient-name">{getIngredientName(ing)}</span>
        <span class="ingredient-count" class:sufficient class:insufficient={!sufficient}>
          {available} / {ing.quantity}
        </span>
      </div>
    {/each}
  </div>

  {#if !facilityOk}
    <div class="facility-section">
      <h4>不足している設備</h4>
      {#each missingFacilities as facility}
        <div class="facility-row">
          <span class="facility-icon">🔒</span>
          <span>{facility.name}</span>
        </div>
      {/each}
    </div>
  {/if}

  <div class="unavailable-notice">
    素材が不足しているため調合できません
  </div>
</div>

<style>
  .recipe-detail {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .back-btn {
    padding: 0.3rem 0.75rem;
    font-size: 0.85rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #c0c0d0;
    cursor: pointer;
    align-self: flex-start;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .detail-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .detail-icon {
    width: 56px;
    height: 56px;
    object-fit: contain;
    flex-shrink: 0;
  }

  h3 {
    font-size: 1.2rem;
    color: #f4e4bc;
    margin: 0;
  }

  h4 {
    font-size: 1rem;
    color: #c9a959;
    margin-bottom: 0.5rem;
  }

  .detail-description {
    font-size: 0.85rem;
    color: #a0a0b0;
    margin-top: 0.25rem;
  }

  .detail-info {
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    display: flex;
    gap: 1.5rem;
  }

  .info-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .info-label {
    font-size: 0.8rem;
    color: #808090;
  }

  .info-value {
    font-weight: bold;
    color: #e0e0f0;
  }

  .info-value.high {
    color: #81c784;
  }

  .info-value.low {
    color: #ff6b6b;
  }

  .ingredients-section {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
  }

  .ingredient-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.25rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    border-left: 3px solid #4caf50;
  }

  .ingredient-row.missing {
    border-left-color: #ff6b6b;
  }

  .ingredient-name {
    color: #e0e0f0;
  }

  .ingredient-count {
    font-weight: bold;
    font-size: 0.9rem;
  }

  .ingredient-count.sufficient {
    color: #81c784;
  }

  .ingredient-count.insufficient {
    color: #ff6b6b;
  }

  .facility-section {
    padding: 1rem;
    background: rgba(255, 152, 0, 0.1);
    border: 1px solid rgba(255, 152, 0, 0.3);
    border-radius: 8px;
  }

  .facility-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #ffb74d;
    padding: 0.25rem 0;
  }

  .unavailable-notice {
    padding: 0.75rem;
    background: rgba(211, 47, 47, 0.15);
    border: 1px solid rgba(211, 47, 47, 0.3);
    border-radius: 8px;
    color: #ef9a9a;
    text-align: center;
    font-size: 0.9rem;
  }
</style>
