<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { endTurn } from '$lib/services/gameLoop';
  import { recipes } from '$lib/data/recipes';
  import { craftBatch, getMatchingItems, countAvailableIngredients, calculateSuccessRate, calculateExpectedQuality, matchesIngredient } from '$lib/services/alchemy';
  import type { RecipeDef, OwnedItem, Ingredient } from '$lib/models/types';

  import RecipeList from './alchemy/RecipeList.svelte';
  import MaterialSlots from './alchemy/MaterialSlots.svelte';
  import ItemPicker from './alchemy/ItemPicker.svelte';
  import CraftPreview from './alchemy/CraftPreview.svelte';

  export let onBack: () => void;

  let selectedRecipe: RecipeDef | null = null;
  let craftQuantity: number = 1;
  let selectedItems: OwnedItem[] = [];
  let craftResult: string | null = null;

  // 習得済みかつレベル条件を満たすレシピ
  $: availableRecipes = Object.values(recipes).filter(
    (r) => $gameState.knownRecipes.includes(r.id) && r.requiredLevel <= $gameState.alchemyLevel
  );

  // 現在のレシピで作成可能な最大個数
  $: maxCraftable = selectedRecipe
    ? Math.min(
        ...selectedRecipe.ingredients.map((ing) =>
          Math.floor(countAvailableIngredients(ing) / ing.quantity)
        )
      )
    : 0;

  // 1個あたりの必要素材数
  $: itemsPerCraft = selectedRecipe
    ? selectedRecipe.ingredients.reduce((sum, ing) => sum + ing.quantity, 0)
    : 0;

  // 合計必要素材数
  $: requiredItemCount = itemsPerCraft * craftQuantity;

  // 選択完了したか
  $: selectionComplete = selectedItems.length === requiredItemCount;

  // 現在選択すべき素材
  $: currentIngredient = (() => {
    if (!selectedRecipe) return null;
    for (const ing of selectedRecipe.ingredients) {
      const totalNeeded = ing.quantity * craftQuantity;
      const selectedCount = selectedItems.filter((item) => matchesIngredient(item, ing)).length;
      if (selectedCount < totalNeeded) {
        return ing;
      }
    }
    return null;
  })();

  // 選択可能なアイテム（品質順）
  $: availableItemsForSelection = (() => {
    if (!currentIngredient) return [];
    const matching = getMatchingItems(currentIngredient);
    // 選択済みアイテムを除外
    const remaining = [...matching];
    for (const selected of selectedItems) {
      const idx = remaining.findIndex(
        (item) => item.itemId === selected.itemId && item.quality === selected.quality
      );
      if (idx !== -1) remaining.splice(idx, 1);
    }
    return remaining.sort((a, b) => b.quality - a.quality);
  })();

  // 成功率
  $: successRate = selectedRecipe
    ? calculateSuccessRate(selectedRecipe, $gameState.alchemyLevel)
    : 0;

  // 予想品質
  $: expectedQuality = selectedRecipe && selectedItems.length >= itemsPerCraft
    ? calculateExpectedQuality(selectedRecipe, selectedItems.slice(0, itemsPerCraft), $gameState.alchemyLevel)
    : null;

  function selectRecipe(recipe: RecipeDef) {
    selectedRecipe = recipe;
    craftQuantity = 1;
    selectedItems = [];
    craftResult = null;
  }

  function backToRecipeList() {
    selectedRecipe = null;
    craftQuantity = 1;
    selectedItems = [];
    craftResult = null;
  }

  function adjustQuantity(delta: number) {
    const newQuantity = craftQuantity + delta;
    if (newQuantity >= 1 && newQuantity <= maxCraftable) {
      craftQuantity = newQuantity;
      const newTotalSlots = itemsPerCraft * newQuantity;
      if (selectedItems.length > newTotalSlots) {
        selectedItems = selectedItems.slice(0, newTotalSlots);
      }
    }
  }

  function selectItem(item: OwnedItem) {
    selectedItems = [...selectedItems, item];
  }

  function undoLastSelection() {
    selectedItems = selectedItems.slice(0, -1);
  }

  function executeCraft() {
    if (!selectedRecipe || !selectionComplete) return;

    const result = craftBatch(selectedRecipe.id, selectedItems, craftQuantity);
    craftResult = result.message;

    setTimeout(() => {
      endTurn(selectedRecipe!.daysRequired * craftQuantity);
      onBack();
    }, 1500);
  }
</script>

<div class="alchemy-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>⚗️ 調合</h2>

  {#if !selectedRecipe}
    <RecipeList recipes={availableRecipes} onSelect={selectRecipe} />
  {:else}
    <div class="crafting-area">
      <button class="back-btn small" on:click={backToRecipeList}>← レシピ選択に戻る</button>

      <h3>{selectedRecipe.name}を調合</h3>

      <!-- 個数選択 -->
      <div class="quantity-section">
        <h4>作成個数</h4>
        <div class="quantity-selector">
          <button class="qty-btn" on:click={() => adjustQuantity(-1)} disabled={craftQuantity <= 1 || selectedItems.length > 0}>−</button>
          <span class="qty-value">{craftQuantity}</span>
          <button class="qty-btn" on:click={() => adjustQuantity(1)} disabled={craftQuantity >= maxCraftable || selectedItems.length > 0}>+</button>
          <span class="qty-max">/ 最大 {maxCraftable}個</span>
        </div>
        <p class="quantity-hint">所要日数: {selectedRecipe.daysRequired * craftQuantity}日</p>
      </div>

      <MaterialSlots
        ingredients={selectedRecipe.ingredients}
        {selectedItems}
        {craftQuantity}
        {currentIngredient}
        onUndoLast={undoLastSelection}
      />

      {#if !selectionComplete}
        <ItemPicker
          items={availableItemsForSelection}
          {currentIngredient}
          onSelect={selectItem}
        />
      {:else}
        <CraftPreview
          {successRate}
          {expectedQuality}
          {craftQuantity}
          daysRequired={selectedRecipe.daysRequired * craftQuantity}
          {craftResult}
          onCraft={executeCraft}
        />
      {/if}
    </div>
  {/if}
</div>

<style>
  .alchemy-panel {
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

  .back-btn.small {
    padding: 0.3rem 0.75rem;
    font-size: 0.85rem;
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
    font-size: 1.2rem;
    color: #f4e4bc;
    margin: 1rem 0;
  }

  h4 {
    font-size: 1rem;
    color: #c9a959;
    margin-bottom: 0.5rem;
  }

  .crafting-area {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .quantity-section {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .quantity-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .qty-btn {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid #4a4a6a;
    border-radius: 6px;
    color: #e0e0f0;
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .qty-btn:hover:not(:disabled) {
    background: rgba(201, 169, 89, 0.3);
    border-color: #c9a959;
  }

  .qty-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .qty-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #f4e4bc;
    min-width: 3rem;
    text-align: center;
  }

  .qty-max {
    color: #808090;
    font-size: 0.9rem;
  }

  .quantity-hint {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #a0a0b0;
  }
</style>
