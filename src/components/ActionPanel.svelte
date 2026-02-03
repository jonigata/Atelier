<script lang="ts">
  import { gameState, addMessage, restoreStamina, consumeStamina, learnRecipe } from '$lib/stores/game';
  import { endTurn } from '$lib/services/gameLoop';
  import { recipes } from '$lib/data/recipes';
  import type { ActionType } from '$lib/models/types';
  import AlchemyPanel from './AlchemyPanel.svelte';
  import ExpeditionPanel from './ExpeditionPanel.svelte';
  import ShopPanel from './ShopPanel.svelte';
  import QuestPanel from './QuestPanel.svelte';

  export let action: ActionType;
  export let onBack: () => void;

  // 休息処理
  function handleRest() {
    restoreStamina(100);
    addMessage('休息しました。体力が全回復しました。');
    endTurn(1);
    onBack();
  }

  // 勉強処理（シンプル版）
  function handleStudy() {
    const state = $gameState;
    const unknownRecipes = Object.values(recipes).filter(
      (r) => r.requiredLevel <= state.alchemyLevel && !state.knownRecipes.includes(r.id)
    );

    if (unknownRecipes.length === 0) {
      addMessage('現在習得できる新しいレシピはありません。');
      return;
    }

    // ランダムに1つ習得
    const recipe = unknownRecipes[Math.floor(Math.random() * unknownRecipes.length)];
    learnRecipe(recipe.id);
    addMessage(`勉強の成果！ 「${recipe.name}」のレシピを習得しました！`);
    endTurn(3);
    onBack();
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
    <p>レシピ本を読んで新しいレシピを習得します。3日経過します。</p>
    <p class="known-recipes">
      習得済みレシピ: {$gameState.knownRecipes.length}個
    </p>
    <button class="action-btn" on:click={handleStudy}>
      勉強する
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

  .action-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(201, 169, 89, 0.4);
  }
</style>
