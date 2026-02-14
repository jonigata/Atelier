<script lang="ts">
  import { get } from 'svelte/store';
  import { gameState, pendingLevelUp } from '$lib/stores/game';
  import type { LevelUpInfo } from '$lib/stores/game';
  import { endTurn } from '$lib/services/gameLoop';
  import { recipes } from '$lib/data/recipes';
  import { craftBatch, getMatchingItems, countAvailableIngredients, calculateSuccessRate, calculateExpectedQuality, matchesIngredient, calculateStaminaCost, calculateFatiguePenalty, getFatigueLabel } from '$lib/services/alchemy';
  import { hasRequiredFacilities, getMissingFacilities } from '$lib/services/facility';
  import { calcExpForLevel } from '$lib/data/balance';
  import { getEffectiveCraftDays, getEffectiveIngredientCount } from '$lib/services/equipmentEffects';
  import type { RecipeDef, OwnedItem, Ingredient } from '$lib/models/types';
  import type { CraftMultipleResult } from '$lib/services/alchemy';

  import RecipeList from './alchemy/RecipeList.svelte';
  import RecipeDetail from './alchemy/RecipeDetail.svelte';
  import MaterialSlots from './alchemy/MaterialSlots.svelte';
  import ItemPicker from './alchemy/ItemPicker.svelte';
  import CraftPreview from './alchemy/CraftPreview.svelte';
  import CraftResultDialog from './alchemy/CraftResultDialog.svelte';
  import LevelUpDialog from './LevelUpDialog.svelte';
  import FacilityInfo from './alchemy/FacilityInfo.svelte';

  export let onBack: () => void;

  let showFacilities = false;
  let selectedRecipe: RecipeDef | null = null;
  let craftQuantity: number = 1;
  let selectedItems: OwnedItem[] = [];
  let craftResultData: CraftMultipleResult | null = null;
  let expGaugeData: { before: number; after: number; max: number; label: string } | null = null;
  let staminaGaugeData: { before: number; after: number; max: number; label: string } | null = null;
  let levelUpData: LevelUpInfo | null = null;

  // 習得済みかつレベル条件を満たすレシピ
  $: availableRecipes = Object.values(recipes).filter(
    (r) => $gameState.knownRecipes.includes(r.id) && r.requiredLevel <= $gameState.alchemyLevel
  );

  // 選択中のレシピが調合可能か
  $: canCraftSelected = selectedRecipe
    ? hasRequiredFacilities(selectedRecipe) &&
      selectedRecipe.ingredients.every((ing) => countAvailableIngredients(ing) >= ing.quantity)
    : false;

  // 現在のレシピで作成可能な最大個数（機材効果適用済み）
  $: maxCraftable = selectedRecipe
    ? Math.min(
        ...selectedRecipe.ingredients.map((ing) =>
          Math.floor(countAvailableIngredients(ing) / getEffectiveIngredientCount(ing.quantity))
        )
      )
    : 0;

  // 1個あたりの必要素材数（機材効果適用済み）
  $: itemsPerCraft = selectedRecipe
    ? selectedRecipe.ingredients.reduce((sum, ing) => sum + getEffectiveIngredientCount(ing.quantity), 0)
    : 0;

  // 合計必要素材数
  $: requiredItemCount = itemsPerCraft * craftQuantity;

  // 選択完了したか
  $: selectionComplete = selectedItems.length === requiredItemCount;

  // 現在選択すべき素材（機材効果適用済み）
  $: currentIngredient = (() => {
    if (!selectedRecipe) return null;
    for (const ing of selectedRecipe.ingredients) {
      const totalNeeded = getEffectiveIngredientCount(ing.quantity) * craftQuantity;
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

  // 体力コスト
  $: staminaCost = selectedRecipe ? calculateStaminaCost(selectedRecipe) : 0;
  $: totalStaminaCost = staminaCost * craftQuantity;

  // 疲労ペナルティ
  $: fatiguePenalty = calculateFatiguePenalty($gameState.stamina);
  $: fatigueLabel = getFatigueLabel($gameState.stamina);

  // 成功率（体力による疲労ペナルティ込み）
  $: successRate = selectedRecipe
    ? calculateSuccessRate(selectedRecipe, $gameState.alchemyLevel, $gameState.stamina)
    : 0;

  // 予想品質
  $: expectedQuality = selectedRecipe && selectedItems.length >= itemsPerCraft
    ? calculateExpectedQuality(selectedRecipe, selectedItems.slice(0, itemsPerCraft), $gameState.alchemyLevel)
    : null;

  function selectRecipe(recipe: RecipeDef) {
    selectedRecipe = recipe;
    craftQuantity = 1;
    selectedItems = [];
    craftResultData = null;
  }

  function backToRecipeList() {
    selectedRecipe = null;
    craftQuantity = 1;
    selectedItems = [];
    craftResultData = null;
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

  function clearSelection() {
    selectedItems = [];
  }

  function autoFillAll(sortOrder: 'asc' | 'desc') {
    if (!selectedRecipe) return;

    let newSelectedItems = [...selectedItems];

    for (const ing of selectedRecipe.ingredients) {
      const totalNeeded = getEffectiveIngredientCount(ing.quantity) * craftQuantity;
      const alreadySelected = newSelectedItems.filter((item) => matchesIngredient(item, ing)).length;
      const remaining = totalNeeded - alreadySelected;

      if (remaining <= 0) continue;

      // 在庫から一致するアイテムを取得（選択済みを除外）
      const matching = getMatchingItems(ing);
      const available = [...matching];
      for (const selected of newSelectedItems) {
        const idx = available.findIndex(
          (item) => item.itemId === selected.itemId && item.quality === selected.quality
        );
        if (idx !== -1) available.splice(idx, 1);
      }

      // 品質順でソート
      if (sortOrder === 'asc') {
        available.sort((a, b) => a.quality - b.quality);
      } else {
        available.sort((a, b) => b.quality - a.quality);
      }

      // スロットに投入
      for (let i = 0; i < remaining && i < available.length; i++) {
        newSelectedItems.push(available[i]);
      }
    }

    selectedItems = newSelectedItems;
  }

  function executeCraft() {
    if (!selectedRecipe || !selectionComplete) return;

    // 錬成前にpendingLevelUpをクリア
    pendingLevelUp.set(null);

    // ゲージ用にbefore値をキャプチャ
    const stateBefore = get(gameState);
    const expBefore = stateBefore.alchemyExp;
    const levelBefore = stateBefore.alchemyLevel;
    const expMax = calcExpForLevel(levelBefore);
    const staminaBefore = stateBefore.stamina;

    const result = craftBatch(selectedRecipe.id, selectedItems, craftQuantity);
    craftResultData = result;

    // 経験値ゲージデータを構築
    const stateAfter = get(gameState);
    const leveledUp = stateAfter.alchemyLevel > levelBefore;
    expGaugeData = {
      before: expBefore,
      after: leveledUp ? expMax : stateAfter.alchemyExp,
      max: expMax,
      label: `Lv.${levelBefore}`,
    };

    // 体力ゲージデータを構築
    staminaGaugeData = {
      before: staminaBefore,
      after: stateAfter.stamina,
      max: stateBefore.maxStamina,
      label: '体力',
    };
  }

  function closeCraftResult() {
    if (!selectedRecipe) return;

    // レベルアップがあればダイアログを表示
    const lvUp = $pendingLevelUp;
    if (lvUp) {
      craftResultData = null;
      levelUpData = lvUp;
      pendingLevelUp.set(null);
    } else {
      finishCraft();
    }
  }

  function closeLevelUp() {
    finishCraft();
  }

  function finishCraft() {
    if (!selectedRecipe) return;
    const days = getEffectiveCraftDays(selectedRecipe) * craftQuantity;
    // 先にendTurn → DayTransitionが上から被さる
    endTurn(days);
    // DayTransitionの暗転(0.3s)後にダイアログを片付け
    setTimeout(() => {
      craftResultData = null;
      levelUpData = null;
      onBack();
    }, 350);
  }
</script>

<div class="alchemy-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>⚗️ 調合</h2>

  {#if !selectedRecipe}
    <div class="tab-bar">
      <button class="tab" class:active={!showFacilities} on:click={() => showFacilities = false}>レシピ</button>
      <button class="tab" class:active={showFacilities} on:click={() => showFacilities = true}>設備</button>
    </div>
    {#if showFacilities}
      <FacilityInfo />
    {:else}
      <RecipeList recipes={availableRecipes} onSelect={selectRecipe} />
    {/if}
  {:else if !canCraftSelected}
    <RecipeDetail recipe={selectedRecipe} onBack={backToRecipeList} />
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
        <p class="quantity-hint">所要日数: {getEffectiveCraftDays(selectedRecipe) * craftQuantity}日</p>
      </div>

      <MaterialSlots
        ingredients={selectedRecipe.ingredients}
        {selectedItems}
        {craftQuantity}
        {currentIngredient}
        onUndoLast={undoLastSelection}
        onAutoFill={autoFillAll}
        onClear={clearSelection}
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
          daysRequired={getEffectiveCraftDays(selectedRecipe) * craftQuantity}
          recipe={selectedRecipe}
          {staminaCost}
          {totalStaminaCost}
          currentStamina={$gameState.stamina}
          {fatiguePenalty}
          {fatigueLabel}
          onCraft={executeCraft}
        />
      {/if}
    </div>
  {/if}
</div>

{#if craftResultData && selectedRecipe}
  <CraftResultDialog
    result={craftResultData}
    recipeName={selectedRecipe.name}
    {expGaugeData}
    {staminaGaugeData}
    onClose={closeCraftResult}
  />
{/if}

{#if levelUpData}
  <LevelUpDialog
    levelUpInfo={levelUpData}
    onClose={closeLevelUp}
  />
{/if}

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

  .tab-bar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .tab {
    padding: 0.5rem 1.25rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    color: #a0a0b0;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .tab.active {
    background: rgba(201, 169, 89, 0.2);
    border-color: #c9a959;
    color: #f4e4bc;
  }

  .tab:hover:not(.active) {
    background: rgba(255, 255, 255, 0.1);
  }

</style>
