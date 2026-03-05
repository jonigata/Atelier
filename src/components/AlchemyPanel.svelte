<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { gameState, pendingAlchemyRecipeId } from '$lib/stores/game';
  import type { LevelUpInfo } from '$lib/stores/game';
  import { endTurn } from '$lib/services/gameLoop';
  import { processActionComplete } from '$lib/services/presentation';
  import { showDrawAndWait } from '$lib/services/drawEvent';
  import { recipes } from '$lib/data/recipes';
  import { craftBatch, getMatchingItems, countAvailableIngredients, calculateSuccessRate, calculateExpectedQuality, matchesIngredient, calculateStaminaCost, calculateFatiguePenalty, getFatigueLabel, getInspectionConflict } from '$lib/services/alchemy';
  import { calcExpForLevel, calcLevelFromExp, calcExpProgress, buildExpGaugeSegments } from '$lib/data/balance';
  import { getEffectiveCraftDays, getEffectiveIngredientCount, craftDaysToActual, formatCraftDays } from '$lib/services/equipmentEffects';
  import type { RecipeDef, OwnedItem, Ingredient, GaugeData } from '$lib/models/types';
  import type { CraftMultipleResult } from '$lib/services/alchemy';

  import RecipeList from './alchemy/RecipeList.svelte';
  import RecipeDetail from './alchemy/RecipeDetail.svelte';
  import MaterialSlots from './alchemy/MaterialSlots.svelte';
  import ItemPicker from './alchemy/ItemPicker.svelte';
  import CraftPreview from './alchemy/CraftPreview.svelte';
  import CraftResultDialog from './alchemy/CraftResultDialog.svelte';
  import LevelUpDialog from './LevelUpDialog.svelte';


  export let onBack: (opts?: { skipMilestoneCheck?: boolean }) => void;

  let selectedRecipe: RecipeDef | null = null;

  // 依頼からのジャンプ: レシピを自動選択
  onMount(() => {
    const recipeId = get(pendingAlchemyRecipeId);
    if (recipeId && recipes[recipeId]) {
      selectedRecipe = recipes[recipeId];
      pendingAlchemyRecipeId.set(null);
    }
  });
  let craftQuantity: number = 1;
  let selectedItems: OwnedItem[] = [];
  let craftResultData: CraftMultipleResult | null = null;
  let expGaugeData: GaugeData | null = null;
  let reputationExpGaugeData: GaugeData | null = null;
  let staminaGaugeData: GaugeData | null = null;
  let levelUpData: LevelUpInfo | null = null;

  // 習得済みのレシピ（レベル不足でも表示、成功率が下がるのみ）
  $: availableRecipes = Object.values(recipes)
    .filter((r) => $gameState.knownRecipes.includes(r.id))
    .sort((a, b) => a.requiredLevel - b.requiredLevel);

  // 選択中のレシピが調合可能か
  $: canCraftSelected = selectedRecipe
    ? selectedRecipe.ingredients.every((ing) => countAvailableIngredients(ing) >= getEffectiveIngredientCount(ing.quantity))
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
    ? calculateSuccessRate(selectedRecipe, calcLevelFromExp($gameState.alchemyExp), $gameState.stamina)
    : 0;

  // 査察日をまたぐかチェック
  $: craftDaysRequired = selectedRecipe
    ? craftDaysToActual(getEffectiveCraftDays(selectedRecipe) * craftQuantity)
    : 0;
  // 各個数で査察コンフリクトが起きるか（ボタン無効化用）
  function getInspectionConflictForQuantity(n: number): number | null {
    if (!selectedRecipe) return null;
    const days = craftDaysToActual(getEffectiveCraftDays(selectedRecipe) * n);
    return getInspectionConflict($gameState.day, days);
  }

  // 査察で制限される最大個数
  $: maxWithoutInspection = (() => {
    if (!selectedRecipe) return maxCraftable;
    for (let n = 1; n <= maxCraftable; n++) {
      if (getInspectionConflictForQuantity(n)) return n - 1;
    }
    return maxCraftable;
  })();

  // 予想品質
  $: expectedQuality = selectedRecipe && selectedItems.length >= itemsPerCraft
    ? calculateExpectedQuality(selectedRecipe, selectedItems.slice(0, itemsPerCraft), calcLevelFromExp($gameState.alchemyExp))
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

  function setQuantity(n: number) {
    if (n >= 1 && n <= maxCraftable) {
      craftQuantity = n;
      const newTotalSlots = itemsPerCraft * n;
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

    // ゲージ用にbefore値をキャプチャ
    const stateBefore = get(gameState);
    const levelBefore = calcLevelFromExp(stateBefore.alchemyExp);
    const expBefore = calcExpProgress(stateBefore.alchemyExp);
    const expMax = calcExpForLevel(levelBefore);
    const repLevelBefore = calcLevelFromExp(stateBefore.reputationExp);
    const repExpBefore = calcExpProgress(stateBefore.reputationExp);
    const repExpMax = calcExpForLevel(repLevelBefore);
    const staminaBefore = stateBefore.stamina;

    const result = craftBatch(selectedRecipe.id, selectedItems, craftQuantity);

    craftResultData = result;

    // 経験値ゲージデータを構築
    const stateAfter = get(gameState);
    const levelAfter = calcLevelFromExp(stateAfter.alchemyExp);
    const progressAfter = calcExpProgress(stateAfter.alchemyExp);
    const leveledUp = levelAfter > levelBefore;
    expGaugeData = {
      before: expBefore,
      after: leveledUp ? expMax : progressAfter,
      max: expMax,
      label: `Lv.${levelBefore}`,
      segments: leveledUp
        ? buildExpGaugeSegments(levelBefore, expBefore, levelAfter, progressAfter)
        : undefined,
    };

    // 名声経験値ゲージデータを構築
    if (result.totalReputationExpGained > 0) {
      const repLevelAfter = calcLevelFromExp(stateAfter.reputationExp);
      const repProgressAfter = calcExpProgress(stateAfter.reputationExp);
      const repLeveledUp = repLevelAfter > repLevelBefore;
      reputationExpGaugeData = {
        before: repExpBefore,
        after: repLeveledUp ? repExpMax : repProgressAfter,
        max: repExpMax,
        label: `名声 Lv.${repLevelBefore}`,
        segments: repLeveledUp
          ? buildExpGaugeSegments(repLevelBefore, repExpBefore, repLevelAfter, repProgressAfter, '名声 Lv.')
          : undefined,
      };
    } else {
      reputationExpGaugeData = null;
    }

    // 体力ゲージデータを構築
    staminaGaugeData = {
      before: staminaBefore,
      after: stateAfter.stamina,
      max: stateBefore.maxStamina,
      label: '体力',
    };

    // ダイアログ表示 → レベルアップ → ターン終了 を逐次実行
    runPostCraftSequence();
  }

  // ダイアログの閉じ待ちを Promise で制御するための resolver
  let craftResultResolver: (() => void) | null = null;
  let levelUpResolver: (() => void) | null = null;

  function closeCraftResult() {
    if (craftResultResolver) {
      craftResultResolver();
      craftResultResolver = null;
    }
  }

  function closeLevelUp() {
    if (levelUpResolver) {
      levelUpResolver();
      levelUpResolver = null;
    }
  }

  /**
   * 調合後の一連のシーケンスを一つのasync関数で逐次制御する。
   * 結果ダイアログ → レベルアップダイアログ → ターン終了 → アチーブメント → ドロー
   */
  async function runPostCraftSequence() {
    if (!selectedRecipe || !craftResultData) return;
    const recipe = selectedRecipe;

    // 1. 調合結果ダイアログが閉じられるのを待つ
    await new Promise<void>(resolve => { craftResultResolver = resolve; });

    // 2. 結果から必要な情報を取り出す（この後 craftResultData をクリアするため）
    const repDrawInfo = craftResultData.reputationDrawInfo;
    const alchemyLevelUp = craftResultData.alchemyLevelUp;

    // 3. アルケミーレベルアップがあればダイアログ表示 → 閉じ待ち
    if (alchemyLevelUp) {
      levelUpData = alchemyLevelUp;
      craftResultData = null;
      await new Promise<void>(resolve => { levelUpResolver = resolve; });
    }

    // 4. ターン終了 → アチーブメント → ドロー
    const totalTenths = getEffectiveCraftDays(recipe) * craftQuantity;
    const days = craftDaysToActual(totalTenths);

    const turnPromise = endTurn(days);
    // DayTransition暗転開始を待ってからパネルを閉じる
    await new Promise(r => setTimeout(r, 350));
    craftResultData = null;
    levelUpData = null;
    onBack({ skipMilestoneCheck: true });

    await turnPromise;
    await processActionComplete();

    if (repDrawInfo) {
      await showDrawAndWait({ type: 'helper', levelUpInfo: repDrawInfo });
    }
  }
</script>

<div class="alchemy-panel">
  {#if !selectedRecipe}
    <RecipeList recipes={availableRecipes} onSelect={selectRecipe} />
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
          {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as n}
            <button
              class="qty-num-btn"
              class:selected={craftQuantity === n}
              on:click={() => setQuantity(n)}
              disabled={n > maxCraftable || n > maxWithoutInspection || selectedItems.length > 0}
            >{n}</button>
          {/each}
          <span class="qty-max">/ 最大 {maxCraftable}個</span>
        </div>
        <p class="quantity-hint">所要日数: {formatCraftDays(getEffectiveCraftDays(selectedRecipe))} × {craftQuantity}個 = <span class="days-total" class:multi-day={craftDaysToActual(getEffectiveCraftDays(selectedRecipe) * craftQuantity) >= 2}>{craftDaysToActual(getEffectiveCraftDays(selectedRecipe) * craftQuantity)}日</span></p>
        {#if maxWithoutInspection === 0}
          {@const conflictDay = getInspectionConflictForQuantity(1)}
          <div class="inspection-warning">
            {conflictDay}日目に査察があるため、調合できません
          </div>
        {:else if maxWithoutInspection < maxCraftable && maxWithoutInspection < 10}
          {@const conflictDay = getInspectionConflictForQuantity(maxWithoutInspection + 1)}
          <div class="inspection-warning">
            {conflictDay}日目に査察があるため、{maxWithoutInspection + 1}個以上は調合できません
          </div>
        {/if}
      </div>

      {#if maxWithoutInspection > 0}
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
            daysRequired={craftDaysRequired}
            {staminaCost}
            {totalStaminaCost}
            currentStamina={$gameState.stamina}
            {fatiguePenalty}
            {fatigueLabel}
            onCraft={executeCraft}
          />
        {/if}
      {/if}
    </div>
  {/if}
</div>

{#if craftResultData && selectedRecipe}
  <CraftResultDialog
    result={craftResultData}
    recipeName={selectedRecipe.name}
    {expGaugeData}
    {reputationExpGaugeData}
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
    padding: 0.3rem 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #c0c0d0;
    cursor: pointer;
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

  .qty-num-btn {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid #4a4a6a;
    border-radius: 6px;
    color: #e0e0f0;
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .qty-num-btn:hover:not(:disabled) {
    background: rgba(201, 169, 89, 0.3);
    border-color: #c9a959;
  }

  .qty-num-btn.selected {
    background: rgba(201, 169, 89, 0.4);
    border-color: #c9a959;
    color: #f4e4bc;
    box-shadow: 0 0 6px rgba(201, 169, 89, 0.3);
  }

  .qty-num-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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

  .days-total {
    font-size: 1.3rem;
    font-weight: bold;
    color: #ffc107;
  }

  .days-total.multi-day {
    color: #ff9800;
  }

  .inspection-warning {
    margin-top: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 152, 0, 0.15);
    border: 1px solid rgba(255, 152, 0, 0.5);
    border-radius: 4px;
    color: #ff9800;
    font-size: 0.85rem;
  }

</style>
