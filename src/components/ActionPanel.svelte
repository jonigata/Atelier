<script lang="ts">
  import { gameState, addMessage, restoreStamina, consumeStamina, learnRecipe } from '$lib/stores/game';
  import { endTurn } from '$lib/services/gameLoop';
  import { recipes } from '$lib/data/recipes';
  import type { ActionType, RecipeDef } from '$lib/models/types';
  import AlchemyPanel from './AlchemyPanel.svelte';
  import ExpeditionPanel from './ExpeditionPanel.svelte';
  import ShopPanel from './ShopPanel.svelte';
  import QuestPanel from './QuestPanel.svelte';

  export let action: ActionType;
  export let onBack: () => void;

  // 勉強用の選択状態
  let selectedRecipeId: string | null = null;

  // 習得可能なレシピ一覧
  $: availableRecipes = Object.values(recipes).filter(
    (r) => r.requiredLevel <= $gameState.alchemyLevel && !$gameState.knownRecipes.includes(r.id)
  );

  // レベル不足で習得できないレシピ（参考表示用）
  $: lockedRecipes = Object.values(recipes).filter(
    (r) => r.requiredLevel > $gameState.alchemyLevel && !$gameState.knownRecipes.includes(r.id)
  );

  // 休息処理
  function handleRest() {
    restoreStamina(100);
    addMessage('休息しました。体力が全回復しました。');
    endTurn(1);
    onBack();
  }

  // 勉強処理
  function handleStudy() {
    if (!selectedRecipeId) return;

    const recipe = recipes[selectedRecipeId];
    if (!recipe) return;

    learnRecipe(recipe.id);
    addMessage(`勉強の成果！ 「${recipe.name}」のレシピを習得しました！`);
    selectedRecipeId = null;
    endTurn(3);
    onBack();
  }

  function selectRecipe(recipeId: string) {
    selectedRecipeId = recipeId;
  }
</script>

<div class="action-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>

  {#if action === 'alchemy'}
    <AlchemyPanel {onBack} />

  {:else if action === 'quest'}
    <QuestPanel {onBack} />

  {:else if action === 'expedition'}
    <ExpeditionPanel {onBack} />

  {:else if action === 'shop'}
    <ShopPanel {onBack} />

  {:else if action === 'rest'}
    <h2>😴 休息</h2>
    <p>体力を全回復します。1日経過します。</p>
    <p class="current-stamina">
      現在の体力: {$gameState.stamina} / {$gameState.maxStamina}
    </p>
    <button class="action-btn" on:click={handleRest}>
      休息する
    </button>

  {:else if action === 'study'}
    <h2>📚 勉強</h2>
    <p>教科書を選んでレシピを習得します。3日経過します。</p>
    <p class="known-recipes">
      習得済みレシピ: {$gameState.knownRecipes.length}個 / 錬金術Lv: {$gameState.alchemyLevel}
    </p>

    {#if availableRecipes.length > 0}
      <div class="recipe-list">
        <h3>習得可能な教科書</h3>
        {#each availableRecipes as recipe}
          <button
            class="recipe-item"
            class:selected={selectedRecipeId === recipe.id}
            on:click={() => selectRecipe(recipe.id)}
          >
            <span class="recipe-name">{recipe.name}</span>
            <span class="recipe-info">必要Lv.{recipe.requiredLevel}</span>
          </button>
        {/each}
      </div>
    {:else}
      <div class="no-recipes">
        <p>現在習得できる教科書がありません。</p>
        <p class="hint">錬金術レベルを上げると新しい教科書が読めるようになります。</p>
      </div>
    {/if}

    {#if lockedRecipes.length > 0}
      <div class="locked-recipes">
        <h3>レベル不足</h3>
        {#each lockedRecipes as recipe}
          <div class="recipe-item locked">
            <span class="recipe-name">{recipe.name}</span>
            <span class="recipe-info">必要Lv.{recipe.requiredLevel}</span>
          </div>
        {/each}
      </div>
    {/if}

    <button
      class="action-btn"
      on:click={handleStudy}
      disabled={!selectedRecipeId}
    >
      {selectedRecipeId ? `「${recipes[selectedRecipeId].name}」を勉強する` : '教科書を選んでください'}
    </button>
  {/if}
</div>

<style>
  .action-panel {
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

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  h2 {
    font-size: 1.5rem;
    color: #f4e4bc;
    margin-bottom: 1rem;
  }

  .placeholder {
    color: #808090;
    font-style: italic;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .hint {
    color: #a0a0b0;
  }

  p {
    color: #e0e0f0;
  }

  .quest-info, .current-stamina, .known-recipes, .status {
    color: #c0c0d0;
    margin: 1rem 0;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .action-btn {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 6px;
    color: #1a1a2e;
    font-weight: bold;
    cursor: pointer;
    margin-top: 1rem;
  }

  .action-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(201, 169, 89, 0.4);
  }

  .action-btn:disabled {
    background: #4a4a5a;
    color: #808090;
    cursor: not-allowed;
  }

  /* 勉強パネル用スタイル */
  .recipe-list, .locked-recipes {
    margin: 1rem 0;
  }

  .recipe-list h3, .locked-recipes h3 {
    font-size: 0.9rem;
    color: #c9a959;
    margin-bottom: 0.5rem;
  }

  .recipe-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    color: #e0e0f0;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .recipe-item:hover:not(.locked) {
    background: rgba(255, 255, 255, 0.1);
    border-color: #6a6a8a;
  }

  .recipe-item.selected {
    background: rgba(201, 169, 89, 0.2);
    border-color: #c9a959;
  }

  .recipe-item.locked {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .recipe-name {
    font-weight: bold;
  }

  .recipe-info {
    font-size: 0.85rem;
    color: #a0a0b0;
  }

  .no-recipes {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    margin: 1rem 0;
  }

  .no-recipes p {
    margin: 0.25rem 0;
  }

  .locked-recipes {
    opacity: 0.7;
  }

  .locked-recipes h3 {
    color: #808090;
  }
</style>
