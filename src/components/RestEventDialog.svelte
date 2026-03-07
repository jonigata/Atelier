<script lang="ts">
  import type { RestEventDef, ResolvedReward } from '$lib/data/restEvents';
  import ExpGauge from './common/ExpGauge.svelte';
  import ContinueMarker from './common/ContinueMarker.svelte';
  import StampRush from './common/StampRush.svelte';

  import { onMount } from 'svelte';

  export let event: RestEventDef;
  export let rewards: ResolvedReward[];
  export let onClose: () => void;

  let canDismiss = false;

  // ゲージ付きEXP報酬とそれ以外を分離（HUDと同じ順序: 錬金術→名声→村発展）
  const expOrder: Record<string, number> = { alchemyExp: 0, reputationExp: 1, villageExp: 2 };
  $: gaugeRewards = rewards.filter(r => r.expType).sort((a, b) =>
    (expOrder[a.apply.type] ?? 99) - (expOrder[b.apply.type] ?? 99)
  );
  $: normalRewards = rewards.filter(r => !r.expType);

  // スタンプ演出用：アイテム報酬を抽出
  $: stampRushItems = normalRewards
    .filter(r => r.type === 'item' && r.apply.itemId)
    .map(r => ({ itemId: r.apply.itemId!, quantity: r.apply.count ?? 1 }));
  let stampRushActive = false;

  onMount(() => {
    // 動画スキップのキー入力と衝突しないよう少し待つ
    const timer = setTimeout(() => {
      canDismiss = true;
      if (stampRushItems.length > 0) stampRushActive = true;
    }, 300);
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
  <div class="dialog" class:rare={isRare} class:has-image={!!event.eventImage}>
    {#if event.eventImage}
      <div class="event-image-container">
        <img class="event-image" src="/images/events/{event.eventImage}.webp" alt={event.name} />
        <div class="image-overlay"></div>
      </div>
    {/if}

    <div class="dialog-content">
    <div class="event-header">
      <span class="event-icon">{isRare ? '✨' : '🌙'}</span>
      <h2 class="event-name" class:rare={isRare}>{event.name}</h2>
    </div>

    <p class="narrative">{event.narrative}</p>

    <div class="divider"></div>

    {#if stampRushItems.length > 0}
      <StampRush items={stampRushItems} active={stampRushActive} />
    {/if}

    {#if normalRewards.length > 0}
      <div class="rewards">
        {#each normalRewards as reward}
          <div class="reward-item" class:gold={reward.type === 'gold'} class:exp={reward.type === 'exp'} class:item={reward.type === 'item'}>
            <span class="reward-bullet">
              {#if reward.type === 'gold'}<img class="reward-icon" src="/icons/ui/coin.webp" alt="" />
              {:else if reward.type === 'exp'}📘
              {:else}📦
              {/if}
            </span>
            <span class="reward-text">{reward.description}</span>
          </div>
        {/each}
      </div>
    {/if}

    {#if gaugeRewards.length > 0}
      <div class="gauge-rewards">
        {#each gaugeRewards as reward}
          {#if reward.expType && reward.totalBefore != null && reward.totalAfter != null}
            <ExpGauge type={reward.expType} totalBefore={reward.totalBefore} totalAfter={reward.totalAfter} />
          {/if}
        {/each}
      </div>
    {/if}

    <p class="hint"><ContinueMarker /></p>
    </div>
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
    z-index: var(--z-modal);
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
    overflow: hidden;
    position: relative;
  }

  .dialog.has-image {
    padding: 0;
    max-width: 900px;
  }

  .dialog.has-image .dialog-content {
    padding: 1.5rem 2rem 2rem;
  }

  .event-image-container {
    position: relative;
    width: 100%;
    max-height: 440px;
    overflow: hidden;
  }

  .event-image {
    width: 100%;
    height: 440px;
    object-fit: cover;
    display: block;
  }

  .image-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(transparent, #1a1a2e);
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

  .reward-icon {
    width: 1.2em;
    height: 1.2em;
    vertical-align: middle;
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

  .gauge-rewards {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.75rem;
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
