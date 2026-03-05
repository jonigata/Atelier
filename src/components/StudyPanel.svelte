<script lang="ts">
  import { gameState, addMessage, learnRecipesFromBook, consumeStamina, skipPresentation } from '$lib/stores/game';
  import { endTurn } from '$lib/services/gameLoop';
  import { recipes } from '$lib/data/recipes';
  import { books } from '$lib/data/books';
  import { items, getItemIcon } from '$lib/data/items';
  import { getCategoryName } from '$lib/data/categories';
  import { STAMINA, calcLevelFromExp } from '$lib/data/balance';
  import { getEffectiveStudyDays } from '$lib/services/equipmentEffects';
  import type { RecipeBookDef } from '$lib/models/types';
  import StudyCompleteDialog from './StudyCompleteDialog.svelte';

  import VideoOverlay from './common/VideoOverlay.svelte';

  export let onBack: () => void;

  function getIngredientName(ingredient: { itemId?: string; category?: string }): string {
    if (ingredient.itemId) {
      return items[ingredient.itemId]?.name || ingredient.itemId;
    }
    if (ingredient.category) {
      return getCategoryName(ingredient.category);
    }
    return '不明';
  }

  let selectedBookId: string | null = null;

  let showVideo = false;
  let showStudyDialog = false;
  let studyCompletedBook: RecipeBookDef | null = null;
  let studyLearnedRecipeIds: string[] = [];
  let studyLearnedRecipeNames: string[] = [];

  $: availableBooks = $gameState.ownedBooks
    .map(id => books[id])
    .filter((book): book is RecipeBookDef => {
      if (!book) return false;
      return book.recipeIds.some(recipeId => !$gameState.knownRecipes.includes(recipeId));
    });

  $: selectedBook = selectedBookId ? books[selectedBookId] : null;
  $: unlearnedRecipes = selectedBook
    ? selectedBook.recipeIds.filter(id => !$gameState.knownRecipes.includes(id))
    : [];

  $: canStudy = selectedBookId && selectedBook && $gameState.stamina >= STAMINA.STUDY_COST;

  function handleStudy() {
    if (!selectedBookId || !selectedBook) return;
    if (!consumeStamina(STAMINA.STUDY_COST)) {
      addMessage('体力が足りません。休息して体力を回復しましょう。');
      return;
    }
    if ($skipPresentation) {
      onVideoEnd();
      return;
    }
    showVideo = true;
  }

  async function onVideoEnd() {
    showVideo = false;
    if (!selectedBookId || !selectedBook) return;

    const learned = learnRecipesFromBook(selectedBook.recipeIds);
    const learnedNames = learned.map(id => recipes[id]?.name || id);

    if (learned.length > 0) {
      addMessage(`「${selectedBook.name}」を読破！ ${learnedNames.join('、')}のレシピを習得しました！`);
    } else {
      addMessage(`「${selectedBook.name}」を読みましたが、すでに全てのレシピを習得済みでした。`);
    }

    if ($skipPresentation) {
      const days = getStudyDays(selectedBook);
      await endTurn(days);
      selectedBookId = null;
      onBack();
      return;
    }

    studyCompletedBook = selectedBook;
    studyLearnedRecipeIds = learned;
    studyLearnedRecipeNames = learnedNames;
    showStudyDialog = true;
  }

  // 本に含まれるレシピのレベル範囲を取得
  function getBookLevelRange(book: RecipeBookDef): { min: number; max: number } {
    const levels = book.recipeIds.map(id => recipes[id]?.requiredLevel ?? 1);
    return { min: Math.min(...levels), max: Math.max(...levels) };
  }

  // 機材効果適用済みの勉強日数を取得
  function getStudyDays(book: RecipeBookDef): number {
    const { max } = getBookLevelRange(book);
    return getEffectiveStudyDays(book, max);
  }

  async function handleStudyDialogClose() {
    if (!studyCompletedBook) return;

    const days = getStudyDays(studyCompletedBook);
    // endTurnのPromiseを保持しつつ、DayTransition暗転を待つ
    const turnPromise = endTurn(days);
    await new Promise(r => setTimeout(r, 350));
    showStudyDialog = false;
    studyCompletedBook = null;
    studyLearnedRecipeIds = [];
    studyLearnedRecipeNames = [];
    selectedBookId = null;
    onBack();
    await turnPromise;
  }

  function selectBook(bookId: string) {
    selectedBookId = bookId;
  }
</script>

<div class="study-panel">
  <p>本を選んで読みます。{selectedBook ? getStudyDays(selectedBook) : 1}日経過・体力{STAMINA.STUDY_COST}消費します。</p>
  <p class="known-recipes">
    習得済みレシピ: {$gameState.knownRecipes.length}個 / 錬金術Lv: {calcLevelFromExp($gameState.alchemyExp)}
  </p>

  {#if availableBooks.length > 0}
    <div class="recipe-list">
      <h3>読める本</h3>
      {#each availableBooks as book}
        {@const bookUnlearnedRecipes = book.recipeIds.filter(id => !$gameState.knownRecipes.includes(id))}
        {@const levelRange = getBookLevelRange(book)}
        <button
          class="recipe-item"
          class:selected={selectedBookId === book.id}
          on:click={() => selectBook(book.id)}
        >
          <div class="recipe-header">
            <span class="book-icon">📖</span>
            <span class="recipe-name">{book.name}</span>
            <span class="book-level">Lv{levelRange.min}{levelRange.min !== levelRange.max ? `-${levelRange.max}` : ''}</span>
            <span class="recipe-info">未習得: {bookUnlearnedRecipes.length}個</span>
          </div>
          <div class="book-description">{book.description}</div>
          {#if selectedBookId === book.id}
            <div class="recipe-details">
              <span class="detail-label">習得できるレシピ:</span>
              {#each bookUnlearnedRecipes as recipeId}
                {@const recipe = recipes[recipeId]}
                {#if recipe}
                  <span class="ingredient">
                    <img class="mini-icon" src={getItemIcon(recipe.resultItemId)} alt="" />
                    {recipe.name}
                  </span>
                {/if}
              {/each}
            </div>
          {/if}
        </button>
      {/each}
    </div>
  {:else}
    <div class="no-recipes">
      <p>読める本がありません。</p>
      <p class="hint">ショップで本を購入するか、報酬で入手しましょう。</p>
    </div>
  {/if}

  {#if !selectedBookId}
    <p class="study-hint">📖 読む本を選んでください</p>
  {:else if $gameState.stamina < STAMINA.STUDY_COST}
    <p class="study-hint warning">⚠ 体力が足りません（必要: {STAMINA.STUDY_COST} / 現在: {$gameState.stamina}）</p>
  {/if}

  <button
    class="action-btn"
    on:click={handleStudy}
    disabled={!canStudy}
  >
    {#if !selectedBookId}
      本を選んでください
    {:else}
      「{selectedBook?.name}」を読む（体力 -{STAMINA.STUDY_COST}）
    {/if}
  </button>
</div>

{#if showVideo}
  <VideoOverlay src="/movies/study.mp4" text="勉強中..." onEnd={onVideoEnd} />
{/if}

{#if showStudyDialog && studyCompletedBook}
  <StudyCompleteDialog
    book={studyCompletedBook}
    learnedRecipeIds={studyLearnedRecipeIds}
    onClose={handleStudyDialogClose}
  />
{/if}

<style>
  .study-panel {
  }


  h2 {
    font-size: 1.5rem;
    color: #f4e4bc;
    margin-bottom: 1rem;
  }

  .hint {
    color: #a0a0b0;
  }

  p {
    color: #e0e0f0;
  }

  .known-recipes {
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

  .recipe-list {
    margin: 1rem 0;
  }

  .recipe-list h3 {
    font-size: 1rem;
    color: #c9a959;
    margin-bottom: 0.5rem;
  }

  .recipe-item {
    display: flex;
    flex-direction: column;
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
    gap: 0.5rem;
  }

  .recipe-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }

  .recipe-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    font-size: 1rem;
  }

  .detail-label {
    color: #808090;
  }

  .ingredient {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    color: #c0c0d0;
  }

  .mini-icon {
    width: 16px;
    height: 16px;
    object-fit: contain;
  }

  .book-icon {
    font-size: 1.5rem;
  }

  .book-description {
    font-size: 1rem;
    color: #a0a0b0;
    margin-top: 0.25rem;
  }

  .recipe-item:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #6a6a8a;
  }

  .recipe-item.selected {
    background: rgba(201, 169, 89, 0.2);
    border-color: #c9a959;
  }

  .recipe-name {
    font-weight: bold;
  }

  .book-level {
    font-size: 0.75rem;
    font-weight: bold;
    color: #a0c4ff;
    background: rgba(160, 196, 255, 0.15);
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    white-space: nowrap;
  }

  .recipe-info {
    font-size: 1rem;
    color: #a0a0b0;
    margin-left: auto;
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

  .study-hint {
    color: #c0c0d0;
    font-size: 1rem;
    margin-top: 1rem;
    padding: 0.6rem 0.8rem;
    background: rgba(255, 255, 255, 0.05);
    border-left: 3px solid #6a6a8a;
    border-radius: 2px;
  }

  .study-hint.warning {
    color: #ffb74d;
    border-left-color: #ffb74d;
    background: rgba(255, 183, 77, 0.1);
  }
</style>
