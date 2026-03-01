<script lang="ts">
  import type { RestEventDef, ResolvedReward } from '$lib/data/restEvents';

  import { onMount } from 'svelte';

  export let event: RestEventDef;
  export let rewards: ResolvedReward[];
  export let onClose: () => void;

  let canDismiss = false;

  onMount(() => {
    // 動画スキップのキー入力と衝突しないよう少し待つ
    const timer = setTimeout(() => { canDismiss = true; }, 300);
    return () => clearTimeout(timer);
  });

  function handleClick() {
    if (canDismiss) onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!canDismiss) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  const isRare = event.weight <= 1;
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="overlay" on:click={handleClick} role="button" tabindex="-1">
  <div class="dialog" class:rare={isRare}>
    <div class="event-header">
      <span class="event-icon">{isRare ? '✨' : '🌙'}</span>
      <h2 class="event-name" class:rare={isRare}>{event.name}</h2>
    </div>

    <p class="narrative">{event.narrative}</p>

    <div class="divider"></div>

    <div class="rewards">
      {#each rewards as reward}
        <div class="reward-item" class:gold={reward.type === 'gold'} class:exp={reward.type === 'exp'} class:item={reward.type === 'item'}>
          <span class="reward-bullet">
            {#if reward.type === 'gold'}💰
            {:else if reward.type === 'exp'}📘
            {:else}📦
            {/if}
          </span>
          <span class="reward-text">{reward.description}</span>
        </div>
      {/each}
    </div>

    <p class="hint">クリック または Enter で続ける</p>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: overlayFadeIn 0.2s ease-out;
    cursor: pointer;
  }

  .dialog {
    background: linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%);
    border: 2px solid #8b7355;
    border-radius: 12px;
    padding: 2rem 2.5rem;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    animation: dialogPopIn 0.3s ease-out;
    cursor: default;
  }

  .dialog.rare {
    border-color: #c9a959;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(201, 169, 89, 0.2);
  }

  .event-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .event-icon {
    font-size: 1.5rem;
  }

  .event-name {
    font-size: 1.3rem;
    color: #f4e4bc;
    margin: 0;
  }

  .event-name.rare {
    color: #ffd700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }

  .narrative {
    color: #d0d0e0;
    line-height: 1.7;
    font-size: 0.95rem;
    margin: 0;
  }

  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #8b7355, transparent);
    margin: 1.2rem 0;
  }

  .rewards {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .reward-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.5rem;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.03);
  }

  .reward-bullet {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .reward-text {
    font-size: 0.9rem;
  }

  .reward-item.gold .reward-text {
    color: #ffd54f;
  }

  .reward-item.exp .reward-text {
    color: #81c784;
  }

  .reward-item.item .reward-text {
    color: #64b5f6;
  }

  .hint {
    text-align: center;
    color: #6a6a8a;
    font-size: 0.8rem;
    margin: 1.2rem 0 0;
    animation: hintPulse 2s ease-in-out infinite;
  }

  @keyframes overlayFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes dialogPopIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes hintPulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
</style>
