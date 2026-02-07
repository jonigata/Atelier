<script lang="ts">
  import { gameState, addMessage, learnRecipesFromBook } from '$lib/stores/game';
  import { endTurn } from '$lib/services/gameLoop';
  import { recipes } from '$lib/data/recipes';
  import { books } from '$lib/data/books';
  import { items, getItemIcon } from '$lib/data/items';
  import { getCategoryName } from '$lib/data/categories';
  import type { RecipeBookDef } from '$lib/models/types';
  import StudyCompleteDialog from './StudyCompleteDialog.svelte';

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

  let showStudyDialog = false;
  let studyCompletedBook: RecipeBookDef | null = null;
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

  function handleStudy() {
    if (!selectedBookId || !selectedBook) return;

    const learned = learnRecipesFromBook(selectedBook.recipeIds);
    const learnedNames = learned.map(id => recipes[id]?.name || id);

    if (learned.length > 0) {
      addMessage(`「${selectedBook.name}」を読破！ ${learnedNames.join('、')}のレシピを習得しました！`);
    } else {
      addMessage(`「${selectedBook.name}」を読みましたが、すでに全てのレシピを習得済みでした。`);
    }

    studyCompletedBook = selectedBook;
    studyLearnedRecipeNames = learnedNames;
    showStudyDialog = true;
  }

  function handleStudyDialogClose() {
    if (!studyCompletedBook) return;

    const days = studyCompletedBook.studyDays;
    showStudyDialog = false;
    studyCompletedBook = null;
    studyLearnedRecipeNames = [];
    selectedBookId = null;
    endTurn(days);
    onBack();
  }

  function selectBook(bookId: string) {
    selectedBookId = bookId;
  }
</script>

<div class="study-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>📚 勉強</h2>
  <p>本を選んで読みます。{selectedBook ? selectedBook.studyDays : 1}日経過します。</p>
  <p class="known-recipes">
    習得済みレシピ: {$gameState.knownRecipes.length}個 / 錬金術Lv: {$gameState.alchemyLevel}
  </p>

  {#if availableBooks.length > 0}
    <div class="recipe-list">
      <h3>読める本</h3>
      {#each availableBooks as book}
        {@const bookUnlearnedRecipes = book.recipeIds.filter(id => !$gameState.knownRecipes.includes(id))}
        <button
          class="recipe-item"
          class:selected={selectedBookId === book.id}
          on:click={() => selectBook(book.id)}
        >
          <div class="recipe-header">
            <span class="book-icon">📖</span>
            <span class="recipe-name">{book.name}</span>
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

  <button
    class="action-btn"
    on:click={handleStudy}
    disabled={!selectedBookId}
  >
    {selectedBookId && selectedBook ? `「${selectedBook.name}」を読む` : '本を選んでください'}
  </button>
</div>

{#if showStudyDialog && studyCompletedBook}
  <StudyCompleteDialog
    book={studyCompletedBook}
    learnedRecipes={studyLearnedRecipeNames}
    onClose={handleStudyDialogClose}
  />
{/if}

<style>
  .study-panel {
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
    font-size: 0.9rem;
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
    font-size: 0.85rem;
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
    font-size: 0.85rem;
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

  .recipe-info {
    font-size: 0.85rem;
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
</style>
