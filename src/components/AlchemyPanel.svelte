<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { endTurn } from '$lib/services/gameLoop';
  import { getRecipe, recipes } from '$lib/data/recipes';
  import { getItem } from '$lib/data/items';
  import { craft, getMatchingItems, countAvailableIngredients, calculateSuccessRate, calculateExpectedQuality } from '$lib/services/alchemy';
  import type { RecipeDef, OwnedItem, Ingredient } from '$lib/models/types';

  export let onBack: () => void;

  let selectedRecipe: RecipeDef | null = null;
  let selectedItems: OwnedItem[] = [];
  let craftResult: string | null = null;

  // 習得済みかつレベル条件を満たすレシピ
  $: availableRecipes = Object.values(recipes).filter(
    (r) => $gameState.knownRecipes.includes(r.id) && r.requiredLevel <= $gameState.alchemyLevel
  );

  // 現在のレシピで必要な素材の総数
  $: requiredItemCount = selectedRecipe
    ? selectedRecipe.ingredients.reduce((sum, ing) => sum + ing.quantity, 0)
    : 0;

  // 選択完了したか
  $: selectionComplete = selectedItems.length === requiredItemCount;

  // 現在選択すべき素材（リアクティブ）
  $: currentIngredient = (() => {
    if (!selectedRecipe) return null;
    let count = 0;
    for (let i = 0; i < selectedRecipe.ingredients.length; i++) {
      const ing = selectedRecipe.ingredients[i];
      for (let j = 0; j < ing.quantity; j++) {
        if (count === selectedItems.length) {
          return { ingredient: ing, index: j, ingredientIndex: i };
        }
        count++;
      }
    }
    return null;
  })();

  // 選択可能なアイテム（リアクティブ、品質順）
  $: availableItemsForSelection = (() => {
    if (!currentIngredient) return [];
    const matching = getMatchingItems(currentIngredient.ingredient);
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
      .sort((a, b) => b.quality - a.quality); // 品質の高い順
  })();

  function selectRecipe(recipe: RecipeDef) {
    selectedRecipe = recipe;
    selectedItems = [];
    craftResult = null;
  }

  function backToRecipeList() {
    selectedRecipe = null;
    selectedItems = [];
    craftResult = null;
  }

  function selectItem(item: OwnedItem) {
    selectedItems = [...selectedItems, item];
  }

  function undoLastSelection() {
    selectedItems = selectedItems.slice(0, -1);
  }

  function executeCraft() {
    if (!selectedRecipe || !selectionComplete) return;

    const result = craft(selectedRecipe.id, selectedItems);
    craftResult = result.message;

    if (result.success) {
      // 成功したら日数経過してメニューに戻る
      setTimeout(() => {
        endTurn(selectedRecipe!.daysRequired);
        onBack();
      }, 1500);
    } else {
      // 失敗したらリセット
      setTimeout(() => {
        selectedItems = [];
        craftResult = null;
      }, 1500);
    }
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

  // 予想品質の計算（リアクティブ）
  $: expectedQuality = selectedRecipe && selectedItems.length > 0
    ? calculateExpectedQuality(selectedRecipe, selectedItems, $gameState.alchemyLevel)
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
      <p class="craft-info">所要日数: {selectedRecipe.daysRequired}日</p>

      <!-- 素材スロット一覧 -->
      <div class="material-slots">
        <h4>素材を選択 ({selectedItems.length}/{requiredItemCount})</h4>
        <div class="slots-container">
          {#each selectedRecipe.ingredients as ing, ingIdx}
            {@const startIdx = selectedRecipe.ingredients.slice(0, ingIdx).reduce((sum, i) => sum + i.quantity, 0)}
            <div class="ingredient-group">
              <div class="ingredient-label">{getIngredientName(ing)}</div>
              <div class="ingredient-slots">
                {#each Array(ing.quantity) as _, slotIdx}
                  {@const globalIdx = startIdx + slotIdx}
                  {@const isActive = globalIdx === selectedItems.length && !selectionComplete}
                  {@const isFilled = globalIdx < selectedItems.length}
                  {@const selectedItem = isFilled ? selectedItems[globalIdx] : null}
                  {@const itemDef = selectedItem ? getItem(selectedItem.itemId) : null}
                  <button
                    class="slot"
                    class:active={isActive}
                    class:filled={isFilled}
                    class:pending={!isActive && !isFilled}
                    on:click={() => {
                      if (isFilled && globalIdx === selectedItems.length - 1) {
                        undoLastSelection();
                      }
                    }}
                    disabled={!isFilled || globalIdx !== selectedItems.length - 1}
                  >
                    {#if isFilled}
                      <span class="slot-item">{itemDef?.name || selectedItem?.itemId}</span>
                      <span class="slot-quality">品質 {selectedItem?.quality}</span>
                      {#if globalIdx === selectedItems.length - 1}
                        <span class="slot-remove">×</span>
                      {/if}
                    {:else if isActive}
                      <span class="slot-prompt">選択中</span>
                    {:else}
                      <span class="slot-empty">―</span>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- 選択可能アイテムリスト -->
      {#if !selectionComplete}
        <div class="item-selection">
          <h4>
            {#if currentIngredient}
              {getIngredientName(currentIngredient.ingredient)} を選んでください
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
            <p class="craft-result" class:success={craftResult.includes('作成しました')}>
              {craftResult}
            </p>
          {:else}
            <p>素材の選択が完了しました。調合を開始しますか？</p>

            <div class="craft-preview">
              <div class="preview-item">
                <span class="preview-label">成功率</span>
                <span class="preview-value success-rate" class:high={successRate >= 0.8} class:low={successRate < 0.5}>
                  {Math.round(successRate * 100)}%
                </span>
              </div>
              {#if expectedQuality}
                <div class="preview-item">
                  <span class="preview-label">予想品質</span>
                  <span class="preview-value quality">
                    {expectedQuality.min} 〜 {expectedQuality.max}
                    <span class="quality-hint">(基準: {expectedQuality.base})</span>
                  </span>
                </div>
              {/if}
            </div>

            <button class="craft-btn" on:click={executeCraft}>
              調合する ({selectedRecipe.daysRequired}日)
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

  .craft-info {
    color: #a0a0b0;
    font-size: 0.9rem;
  }

  .material-slots {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
  }

  .slots-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .ingredient-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ingredient-label {
    font-size: 0.9rem;
    color: #c9a959;
    font-weight: bold;
  }

  .ingredient-slots {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 70px;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: default;
    position: relative;
    transition: all 0.2s ease;
  }

  .slot.pending {
    background: rgba(255, 255, 255, 0.03);
    border: 2px dashed #4a4a6a;
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
    50% { box-shadow: 0 0 0 6px rgba(201, 169, 89, 0); }
  }

  .slot.filled {
    background: rgba(76, 175, 80, 0.15);
    border: 2px solid #4caf50;
    color: #e0f0e0;
    cursor: pointer;
  }

  .slot.filled:not(:disabled):hover {
    background: rgba(255, 100, 100, 0.15);
    border-color: #ff6b6b;
  }

  .slot.filled:disabled {
    cursor: default;
    opacity: 0.8;
  }

  .slot-item {
    font-weight: bold;
    text-align: center;
    line-height: 1.2;
  }

  .slot-quality {
    font-size: 0.75rem;
    color: #a0a0b0;
  }

  .slot-prompt {
    font-style: italic;
  }

  .slot-empty {
    font-size: 1.2rem;
  }

  .slot-remove {
    position: absolute;
    top: 2px;
    right: 4px;
    font-size: 0.7rem;
    color: #ff6b6b;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .slot.filled:not(:disabled):hover .slot-remove {
    opacity: 1;
  }

  .item-selection {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .available-items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.5rem;
  }

  .item-btn {
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    color: #e0e0f0;
    cursor: pointer;
  }

  .item-btn:hover {
    background: rgba(201, 169, 89, 0.2);
    border-color: #c9a959;
  }

  .item-name {
    font-weight: bold;
  }

  .item-quality {
    font-size: 0.85rem;
    color: #a0a0b0;
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

  .no-items {
    color: #ff6b6b;
    font-style: italic;
    padding: 1rem;
    text-align: center;
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

  .quality-hint {
    font-size: 0.75rem;
    font-weight: normal;
    color: #808090;
    margin-left: 0.25rem;
  }
</style>
