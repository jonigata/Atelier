<script lang="ts">
  import type { RecipeBookDef } from '$lib/models/types';

  export let book: RecipeBookDef;
  export let learnedRecipes: string[];
  export let onClose: () => void;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="dialog-overlay" on:click={onClose} role="button" tabindex="0">
  <div class="dialog-box">
    <div class="dialog-header">
      <span class="study-badge">読破！</span>
      <span class="book-title">{book.name}</span>
    </div>

    <div class="dialog-image">
      <img src="/images/study_complete.png" alt="勉強完了" />
    </div>

    <div class="dialog-content">
      <p class="study-message">本を読み終えて、新しい知識を習得しました！</p>
      {#if learnedRecipes.length > 0}
        <div class="learned-recipes">
          <span class="label">習得したレシピ:</span>
          <span class="recipes">{learnedRecipes.join('、')}</span>
        </div>
      {/if}
    </div>

    <div class="dialog-footer">
      <span class="hint-text">クリック または Enter で閉じる</span>
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

  .dialog-image {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .dialog-image img {
    width: 200px;
    height: 200px;
    object-fit: contain;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
  }

  .dialog-content {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .study-message {
    font-size: 1.1rem;
    color: #e0e0f0;
    margin-bottom: 1rem;
  }

  .learned-recipes {
    background: rgba(201, 169, 89, 0.15);
    border: 1px solid #c9a959;
    border-radius: 8px;
    padding: 0.75rem 1rem;
  }

  .learned-recipes .label {
    display: block;
    font-size: 0.85rem;
    color: #a0a0b0;
    margin-bottom: 0.25rem;
  }

  .learned-recipes .recipes {
    font-size: 1rem;
    color: #c9a959;
    font-weight: bold;
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
