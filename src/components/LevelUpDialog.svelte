<script lang="ts">
  import { recipes } from '$lib/data/recipes';
  import { gameState } from '$lib/stores/game';
  import type { LevelUpInfo } from '$lib/stores/game';
  import type { RecipeDef } from '$lib/models/types';
  import { onMount } from 'svelte';

  export let levelUpInfo: LevelUpInfo;
  export let onClose: () => void;

  // 新レベルで解放されたレシピ（oldLevel < requiredLevel <= newLevel）
  $: unlockedRecipes = Object.values(recipes).filter(
    (r) => r.requiredLevel > levelUpInfo.oldLevel && r.requiredLevel <= levelUpInfo.newLevel
  );

  // 習得済みのレシピ
  $: knownRecipeIds = $gameState.knownRecipes;

  // 習得済み（すぐ作れる）と未習得に分ける
  $: knownUnlocked = unlockedRecipes.filter((r) => knownRecipeIds.includes(r.id));
  $: unknownUnlocked = unlockedRecipes.filter((r) => !knownRecipeIds.includes(r.id));

  let mounted = false;

  onMount(() => {
    const timer = setTimeout(() => {
      mounted = true;
    }, 50);
    return () => clearTimeout(timer);
  });

  function handleKeydown(event: KeyboardEvent) {
    if (!mounted) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }

  function handleClick() {
    if (!mounted) return;
    onClose();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="dialog-overlay" on:click={handleClick} role="button" tabindex="0">
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
  <div class="dialog-box" on:click|stopPropagation={handleClick}>
    <!-- 光のパーティクル -->
    <div class="particles">
      <div class="particle p1"></div>
      <div class="particle p2"></div>
      <div class="particle p3"></div>
      <div class="particle p4"></div>
      <div class="particle p5"></div>
      <div class="particle p6"></div>
      <div class="particle p7"></div>
      <div class="particle p8"></div>
    </div>

    <!-- ヘッダー -->
    <div class="dialog-header">
      <span class="levelup-badge">LEVEL UP!</span>
    </div>

    <!-- レベル表示 -->
    <div class="level-display">
      <span class="old-level">Lv.{levelUpInfo.oldLevel}</span>
      <span class="arrow">→</span>
      <span class="new-level">Lv.{levelUpInfo.newLevel}</span>
    </div>

    <p class="congrats-text">錬金術の腕が上がった！</p>

    <!-- 解放レシピ -->
    {#if unlockedRecipes.length > 0}
      <div class="unlocked-section">
        <h4 class="section-title">解放されたレシピ</h4>

        {#if knownUnlocked.length > 0}
          <div class="recipe-group">
            <span class="group-label">調合可能</span>
            <div class="recipe-list">
              {#each knownUnlocked as recipe, i}
                <div class="recipe-item craftable" style="animation-delay: {i * 0.06}s">
                  <span class="recipe-name">{recipe.name}</span>
                  <span class="recipe-level">Lv.{recipe.requiredLevel}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if unknownUnlocked.length > 0}
          <div class="recipe-group">
            <span class="group-label">レシピ習得で解放</span>
            <div class="recipe-list">
              {#each unknownUnlocked as recipe, i}
                <div class="recipe-item locked" style="animation-delay: {(knownUnlocked.length + i) * 0.06}s">
                  <span class="recipe-name">{recipe.name}</span>
                  <span class="recipe-level">Lv.{recipe.requiredLevel}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- フッター -->
    <div class="dialog-footer">
      <span class="hint-text">クリック または Enter で閉じる</span>
    </div>
  </div>
</div>

<style>
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    cursor: pointer;
    user-select: none;
  }

  .dialog-box {
    background: linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%);
    border: 3px solid #c9a959;
    border-radius: 16px;
    padding: 2rem;
    max-width: 450px;
    width: 90%;
    box-shadow:
      0 0 60px rgba(201, 169, 89, 0.4),
      0 0 120px rgba(201, 169, 89, 0.15),
      0 8px 32px rgba(0, 0, 0, 0.5);
    animation: levelUpReveal 0.6s ease-out;
    position: relative;
    overflow: hidden;
  }

  @keyframes levelUpReveal {
    0% { opacity: 0; transform: scale(0.7) translateY(30px); }
    50% { transform: scale(1.05) translateY(-5px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* パーティクル */
  .particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #ffd700;
    animation: particleFloat 2s ease-in-out infinite;
  }

  .p1 { top: 10%; left: 15%; animation-delay: 0s; }
  .p2 { top: 20%; right: 10%; animation-delay: 0.25s; width: 3px; height: 3px; }
  .p3 { top: 45%; left: 5%; animation-delay: 0.5s; }
  .p4 { top: 40%; right: 15%; animation-delay: 0.75s; width: 5px; height: 5px; }
  .p5 { top: 65%; left: 20%; animation-delay: 0.3s; width: 3px; height: 3px; }
  .p6 { top: 70%; right: 25%; animation-delay: 0.6s; }
  .p7 { top: 85%; left: 10%; animation-delay: 0.15s; width: 3px; height: 3px; }
  .p8 { top: 80%; right: 5%; animation-delay: 0.45s; width: 5px; height: 5px; }

  @keyframes particleFloat {
    0% { opacity: 0; transform: translateY(0) scale(0); }
    30% { opacity: 1; transform: translateY(-15px) scale(1.2); }
    100% { opacity: 0; transform: translateY(-40px) scale(0); }
  }

  /* ヘッダー */
  .dialog-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .levelup-badge {
    display: inline-block;
    background: linear-gradient(135deg, #c9a959 0%, #ffd700 50%, #c9a959 100%);
    color: #1a1a2e;
    padding: 0.5rem 1.5rem;
    border-radius: 6px;
    font-size: 1.4rem;
    font-weight: bold;
    letter-spacing: 0.15em;
    animation: badgeGlow 1.5s ease-in-out infinite alternate;
  }

  @keyframes badgeGlow {
    from { box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
    to { box-shadow: 0 0 25px rgba(255, 215, 0, 0.6); }
  }

  /* レベル表示 */
  .level-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .old-level {
    font-size: 1.5rem;
    color: #808090;
    animation: fadeInLeft 0.4s ease-out 0.2s both;
  }

  @keyframes fadeInLeft {
    from { opacity: 0; transform: translateX(-15px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .arrow {
    font-size: 1.5rem;
    color: #c9a959;
    animation: arrowPulse 0.6s ease-out 0.35s both;
  }

  @keyframes arrowPulse {
    0% { opacity: 0; transform: scale(0.5); }
    60% { transform: scale(1.3); }
    100% { opacity: 1; transform: scale(1); }
  }

  .new-level {
    font-size: 2.2rem;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
    animation: newLevelPop 0.5s ease-out 0.5s both;
  }

  @keyframes newLevelPop {
    0% { opacity: 0; transform: scale(0.3); }
    60% { transform: scale(1.15); }
    100% { opacity: 1; transform: scale(1); }
  }

  .congrats-text {
    text-align: center;
    font-size: 1.1rem;
    color: #e0e0f0;
    margin-bottom: 1.5rem;
    animation: fadeIn 0.4s ease-out 0.6s both;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* 解放レシピ */
  .unlocked-section {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(201, 169, 89, 0.3);
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
    animation: fadeIn 0.4s ease-out 0.7s both;
    max-height: 250px;
    overflow-y: auto;
  }

  .section-title {
    font-size: 0.95rem;
    color: #c9a959;
    margin-bottom: 0.75rem;
    text-align: center;
  }

  .recipe-group {
    margin-bottom: 0.75rem;
  }

  .recipe-group:last-child {
    margin-bottom: 0;
  }

  .group-label {
    display: block;
    font-size: 0.8rem;
    color: #808090;
    margin-bottom: 0.4rem;
    padding-left: 0.25rem;
  }

  .recipe-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .recipe-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    animation: recipeSlide 0.3s ease-out both;
  }

  @keyframes recipeSlide {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .recipe-item.craftable {
    background: rgba(201, 169, 89, 0.15);
    border: 1px solid rgba(201, 169, 89, 0.4);
  }

  .recipe-item.locked {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .recipe-item.craftable .recipe-name {
    color: #f4e4bc;
    font-weight: bold;
  }

  .recipe-item.locked .recipe-name {
    color: #808090;
  }

  .recipe-level {
    font-size: 0.8rem;
    color: #808090;
  }

  /* フッター */
  .dialog-footer {
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid #4a4a6a;
    animation: fadeIn 0.4s ease-out 0.8s both;
  }

  .hint-text {
    font-size: 0.85rem;
    color: #6a6a8a;
  }
</style>
