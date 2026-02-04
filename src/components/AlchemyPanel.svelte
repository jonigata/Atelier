<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { endTurn } from '$lib/services/gameLoop';
  import { getRecipe, recipes } from '$lib/data/recipes';
  import { getItem } from '$lib/data/items';
  import { craftBatch, getMatchingItems, countAvailableIngredients, calculateSuccessRate, calculateExpectedQuality } from '$lib/services/alchemy';
  import type { RecipeDef, OwnedItem, Ingredient } from '$lib/models/types';

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

  // 合計必要素材数（個数 × 1個あたり）
  $: requiredItemCount = itemsPerCraft * craftQuantity;

  // 選択完了したか
  $: selectionComplete = selectedItems.length === requiredItemCount;

  // 素材ごとの必要数と選択済み数を計算
  $: ingredientStatus = (() => {
    if (!selectedRecipe) return [];
    return selectedRecipe.ingredients.map((ing) => {
      const totalNeeded = ing.quantity * craftQuantity;
      const selectedCount = selectedItems.filter((item) => {
        if (ing.itemId) return item.itemId === ing.itemId;
        if (ing.category) {
          const def = getItem(item.itemId);
          return def?.category === ing.category;
        }
        return false;
      }).length;
      return { ingredient: ing, totalNeeded, selectedCount };
    });
  })();

  // 現在選択すべき素材（リアクティブ）
  $: currentIngredient = (() => {
    if (!selectedRecipe) return null;
    // まだ足りない素材を探す
    for (const status of ingredientStatus) {
      if (status.selectedCount < status.totalNeeded) {
        return status.ingredient;
      }
    }
    return null;
  })();

  // 選択可能なアイテム（リアクティブ、品質順）
  $: availableItemsForSelection = (() => {
    if (!currentIngredient) return [];
    const matching = getMatchingItems(currentIngredient);
    return matching
      .filter((item) => {
        const selectedCount = selectedItems.filter(
          (s) => s.itemId === item.itemId && s.quality === item.quality
        ).length;
        const totalCount = matching.filter(
          (m) => m.itemId === item.itemId && m.quality === item.quality
        ).length;
        return selectedCount < totalCount;
      })
      .sort((a, b) => b.quality - a.quality);
  })();

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
      // 個数減らした場合、選択済みアイテムを調整
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

    // 日数経過してメニューに戻る
    setTimeout(() => {
      endTurn(selectedRecipe!.daysRequired * craftQuantity);
      onBack();
    }, 1500);
  }

  function getIngredientName(ing: Ingredient): string {
    if (ing.itemId) {
      const item = getItem(ing.itemId);
      return item?.name || ing.itemId;
    }
    if (ing.category) {
      const categoryNames: Record<string, string> = {
        herb: 'ハーブ系',
        ore: '鉱石系',
        water: '水系',
        misc: 'その他',
        product: '生成物',
      };
      return categoryNames[ing.category] || ing.category;
    }
    return '???';
  }

  function canCraft(recipe: RecipeDef): boolean {
    for (const ing of recipe.ingredients) {
      if (countAvailableIngredients(ing) < ing.quantity) return false;
    }
    return true;
  }

  // 成功率の計算（リアクティブ）
  $: successRate = selectedRecipe
    ? calculateSuccessRate(selectedRecipe, $gameState.alchemyLevel)
    : 0;

  // 予想品質の計算（リアクティブ、最初の1個分の素材で計算）
  $: expectedQuality = selectedRecipe && selectedItems.length >= itemsPerCraft
    ? calculateExpectedQuality(selectedRecipe, selectedItems.slice(0, itemsPerCraft), $gameState.alchemyLevel)
    : null;
</script>

<div class="alchemy-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>⚗️ 調合</h2>

  {#if !selectedRecipe}
    <!-- レシピ選択画面 -->
    <div class="recipe-list">
      {#if availableRecipes.length === 0}
        <p class="no-recipes">習得済みのレシピがありません。勉強してレシピを習得しましょう。</p>
      {:else}
        {#each availableRecipes as recipe}
          {@const craftable = canCraft(recipe)}
          <button
            class="recipe-item"
            class:disabled={!craftable}
            on:click={() => craftable && selectRecipe(recipe)}
          >
            <div class="recipe-header">
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

  {:else}
    <!-- 素材選択画面 -->
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

      <!-- 素材選択（素材タイプごと） -->
      <div class="material-slots">
        <h4>素材を選択 ({selectedItems.length}/{requiredItemCount})</h4>
        {#each ingredientStatus as status}
          {@const isActive = currentIngredient === status.ingredient}
          {@const isComplete = status.selectedCount >= status.totalNeeded}
          {@const lastSelectedItem = selectedItems.length > 0 ? selectedItems[selectedItems.length - 1] : null}
          {@const lastItemBelongsHere = lastSelectedItem && (
            status.ingredient.itemId ? lastSelectedItem.itemId === status.ingredient.itemId :
            status.ingredient.category ? getItem(lastSelectedItem.itemId)?.category === status.ingredient.category : false
          )}
          <div class="ingredient-row" class:active={isActive} class:complete={isComplete}>
            <div class="ingredient-header">
              <span class="ingredient-name">{getIngredientName(status.ingredient)}</span>
              <span class="ingredient-progress">{status.selectedCount}/{status.totalNeeded}</span>
            </div>
            <div class="ingredient-slots">
              {#each selectedItems.filter((item) => {
                if (status.ingredient.itemId) return item.itemId === status.ingredient.itemId;
                if (status.ingredient.category) {
                  const def = getItem(item.itemId);
                  return def?.category === status.ingredient.category;
                }
                return false;
              }) as item, idx}
                {@const isLastOverall = lastItemBelongsHere && idx === status.selectedCount - 1}
                <button
                  class="slot filled"
                  class:removable={isLastOverall}
                  on:click={() => isLastOverall && undoLastSelection()}
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

      <!-- 選択可能アイテムリスト -->
      {#if !selectionComplete}
        <div class="item-selection">
          <h4>
            {#if currentIngredient}
              {getIngredientName(currentIngredient)} を選んでください
            {/if}
          </h4>
          {#if availableItemsForSelection.length === 0}
            <p class="no-items">選択可能なアイテムがありません</p>
          {:else}
            <div class="available-items">
              {#each availableItemsForSelection as item}
                {@const def = getItem(item.itemId)}
                <button class="item-btn" on:click={() => selectItem(item)}>
                  <span class="item-name">{def?.name || item.itemId}</span>
                  <span class="item-quality">品質 {item.quality}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <!-- 調合実行 -->
        <div class="craft-action">
          {#if craftResult}
            <p class="craft-result" class:success={craftResult.includes('作成')}>
              {craftResult}
            </p>
          {:else}
            <p>素材の選択が完了しました。調合を開始しますか？</p>

            <div class="craft-preview">
              <div class="preview-item">
                <span class="preview-label">成功率（1個あたり）</span>
                <span class="preview-value success-rate" class:high={successRate >= 0.8} class:low={successRate < 0.5}>
                  {Math.round(successRate * 100)}%
                </span>
              </div>
              {#if expectedQuality}
                <div class="preview-item">
                  <span class="preview-label">予想品質</span>
                  <span class="preview-value quality">
                    {expectedQuality.min} 〜 {expectedQuality.max}
                  </span>
                </div>
              {/if}
            </div>

            <button class="craft-btn" on:click={executeCraft}>
              {craftQuantity}個 調合する ({selectedRecipe.daysRequired * craftQuantity}日)
            </button>
          {/if}
        </div>
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

  .no-recipes {
    color: #a0a0b0;
    font-style: italic;
    padding: 2rem;
    text-align: center;
  }

  .recipe-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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
    justify-content: space-between;
    align-items: center;
  }

  .recipe-name {
    font-size: 1.1rem;
    font-weight: bold;
  }

  .recipe-days {
    font-size: 0.85rem;
    color: #a0a0b0;
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

  .crafting-area {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .material-slots {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
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

  .item-selection {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .available-items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
  }

  .item-btn {
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #e0e0f0;
    cursor: pointer;
    font-size: 0.85rem;
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

  .craft-action {
    padding: 1.5rem;
    background: rgba(201, 169, 89, 0.1);
    border: 2px solid #c9a959;
    border-radius: 8px;
    text-align: center;
  }

  .craft-action p {
    color: #e0e0f0;
    margin-bottom: 1rem;
  }

  .craft-btn {
    padding: 0.75rem 2rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 6px;
    color: #1a1a2e;
    font-weight: bold;
    font-size: 1.1rem;
    cursor: pointer;
  }

  .craft-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(201, 169, 89, 0.4);
  }

  .craft-result {
    font-size: 1.1rem;
    padding: 1rem;
    border-radius: 6px;
    background: rgba(211, 47, 47, 0.2);
    color: #ff6b6b;
  }

  .craft-result.success {
    background: rgba(76, 175, 80, 0.2);
    color: #81c784;
  }

  .craft-preview {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin: 1rem 0;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
  }

  .preview-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .preview-label {
    font-size: 0.85rem;
    color: #a0a0b0;
  }

  .preview-value {
    font-size: 1.1rem;
    font-weight: bold;
  }

  .success-rate {
    color: #ffc107;
  }

  .success-rate.high {
    color: #81c784;
  }

  .success-rate.low {
    color: #ff6b6b;
  }

  .quality {
    color: #82b1ff;
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
