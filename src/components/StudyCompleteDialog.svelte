<script lang="ts">
  import type { RecipeBookDef } from '$lib/models/types';
  import { recipes } from '$lib/data/recipes';
  import { getItemIcon, handleIconError } from '$lib/data/items';
  import { gameState } from '$lib/stores/game';

  export let book: RecipeBookDef;
  /** 習得したレシピID配列 */
  export let learnedRecipeIds: string[];
  export let onClose: () => void;

  // ショーケース状態
  let currentIndex = 0;
  let phase: 'in' | 'show' | 'out' = 'in';
  let timer: ReturnType<typeof setTimeout> | null = null;

  $: total = learnedRecipeIds.length;
  $: currentRecipe = total > 0 ? recipes[learnedRecipeIds[currentIndex]] : null;
  $: currentItemIcon = currentRecipe ? getItemIcon(currentRecipe.resultItemId) : '';

  // 初期表示開始
  function start() {
    if (total === 0) return;
    phase = 'in';
    timer = setTimeout(() => {
      phase = 'show';
    }, 80);
  }

  // 次のレシピまたは閉じる
  function advance() {
    if (total === 0) {
      onClose();
      return;
    }
    if (phase === 'out') return; // アニメーション中

    stopTimer();
    phase = 'out';
    timer = setTimeout(() => {
      if (currentIndex + 1 >= total) {
        // 最後のレシピ：indexを変えずにそのまま閉じる（レイアウト崩れ防止）
        onClose();
      } else {
        currentIndex++;
        phase = 'in';
        timer = setTimeout(() => {
          phase = 'show';
        }, 80);
      }
    }, 120);
  }

  function stopTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      advance();
    }
  }

  // マウント時に開始
  start();
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="dialog-overlay" on:click={advance} role="button" tabindex="0">
  <div class="dialog-box">
    <div class="dialog-header">
      <span class="study-badge">読破！</span>
      <span class="book-title">{book.name}</span>
    </div>

    {#if total === 0}
      <div class="dialog-content">
        <p class="study-message">すでに全てのレシピを習得済みでした。</p>
      </div>
    {:else}
      <div class="showcase-area">
        <p class="study-label">習得レシピ</p>
        {#if currentRecipe}
          <div class="showcase" class:phase-in={phase === 'in'} class:phase-show={phase === 'show'} class:phase-out={phase === 'out'}>
            <div class="recipe-icon">
              <img class:silhouette={!$gameState.discoveredItems.includes(currentRecipe.resultItemId)} src={currentItemIcon} alt={currentRecipe.name} on:error={handleIconError} />
            </div>
            <div class="recipe-name">{currentRecipe.name}</div>
          </div>
        {/if}
        <div class="showcase-counter">{currentIndex + 1} / {total}</div>
      </div>
    {/if}

    <div class="dialog-footer">
      <span class="hint-text">クリック または Enter で{currentIndex + 1 >= total ? '閉じる' : '次へ'}</span>
    </div>
  </div>
</div>

<style>
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    cursor: pointer;
    user-select: none;
  }

  .dialog-box {
    background: linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%);
    border: 3px solid #8b7355;
    border-radius: 16px;
    padding: 2rem;
    max-width: 450px;
    width: 90%;
    box-shadow:
      0 0 40px rgba(139, 115, 85, 0.3),
      0 8px 32px rgba(0, 0, 0, 0.5);
    animation: popIn 0.3s ease-out;
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #8b7355;
  }

  .study-badge {
    background: linear-gradient(135deg, #8b7355 0%, #c9a959 50%, #8b7355 100%);
    color: #1a1a2e;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: bold;
  }

  .book-title {
    font-size: 1.3rem;
    font-weight: bold;
    color: #f4e4bc;
  }

  .dialog-content {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .study-message {
    font-size: 1.1rem;
    color: #e0e0f0;
  }

  /* ショーケースエリア */
  .showcase-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 220px;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .study-label {
    font-size: 0.85rem;
    color: #a0a0b0;
    margin-bottom: 0.75rem;
  }

  .showcase {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .showcase.phase-in {
    animation: showcaseIn 0.08s ease-out forwards;
  }

  .showcase.phase-show {
    opacity: 1;
    transform: scale(1);
  }

  .showcase.phase-out {
    animation: showcaseOut 0.12s ease-in forwards;
  }

  @keyframes showcaseIn {
    from { opacity: 0; transform: scale(0); }
    60% { opacity: 0.9; transform: scale(1.15); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes showcaseOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(1.15); }
  }

  .recipe-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .recipe-icon img {
    width: 120px;
    height: 120px;
    object-fit: contain;
    filter: drop-shadow(0 0 16px rgba(201, 169, 89, 0.5));
  }

  .recipe-icon img.silhouette {
    filter: brightness(0) saturate(0) opacity(0.3);
  }

  .recipe-name {
    font-size: 1.5rem;
    font-weight: bold;
    color: #f0e0c0;
    text-shadow: 0 0 15px rgba(240, 224, 192, 0.3);
    text-align: center;
  }

  .showcase-counter {
    font-size: 0.8rem;
    color: #6a6a8a;
    margin-top: 0.75rem;
  }

  .dialog-footer {
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid #4a4a6a;
  }

  .hint-text {
    font-size: 0.85rem;
    color: #6a6a8a;
  }
</style>
