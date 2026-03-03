<script lang="ts">
  import { gameState, skipPresentation } from '$lib/stores/game';
  import { resolveExpeditionReturn } from '$lib/services/presentation';
  import { getItem } from '$lib/data/items';
  import StampRush from './common/StampRush.svelte';
  import type { OwnedItem } from '$lib/models/types';

  $: data = $gameState.pendingExpeditionReturn;

  let canDismiss = false;
  let stampRushActive = false;
  let dismissTimer: ReturnType<typeof setTimeout> | null = null;

  // アイテムをStampRush用に集約
  $: stampRushItems = data
    ? aggregateItems(data.items)
    : [];

  function aggregateItems(items: OwnedItem[]): { itemId: string; quantity: number }[] {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(item.itemId, (map.get(item.itemId) || 0) + 1);
    }
    return Array.from(map.entries()).map(([itemId, quantity]) => ({ itemId, quantity }));
  }

  // メッセージ用のアイテムリスト
  $: itemSummary = data
    ? stampRushItems.map(si => {
        const def = getItem(si.itemId);
        const name = def ? def.name : si.itemId;
        return si.quantity > 1 ? `${name}×${si.quantity}` : name;
      }).join('、')
    : '';

  // data が表示されたらdismissタイマーを開始（コンポーネントは常駐のためonMountではなくリアクティブで制御）
  $: if (data) {
    canDismiss = false;
    stampRushActive = false;
    if (dismissTimer) clearTimeout(dismissTimer);
    dismissTimer = setTimeout(() => {
      canDismiss = true;
      stampRushActive = true;
    }, 300);
  } else {
    if (dismissTimer) clearTimeout(dismissTimer);
    dismissTimer = null;
  }

  // 演出スキップ対応
  $: if (data && $skipPresentation) {
    resolveExpeditionReturn();
  }

  function handleClick() {
    if (canDismiss) resolveExpeditionReturn();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!data || !canDismiss) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      resolveExpeditionReturn();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if data}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="overlay" on:click={handleClick} role="button" tabindex="-1">
    <div class="dialog">
      <div class="event-image-container">
        <img class="event-image" src="/images/areas/{data.areaId}.png" alt={data.areaName} />
        <div class="image-overlay"></div>
      </div>

      <div class="dialog-content">
        <div class="event-header">
          <span class="event-icon">📦</span>
          <h2 class="event-name">採取隊が帰還しました！</h2>
        </div>

        <p class="narrative">ガルドたちが{data.areaName}から素材を持ち帰りました。</p>

        <div class="divider"></div>

        {#if stampRushItems.length > 0}
          <StampRush items={stampRushItems} active={stampRushActive} />
        {/if}

        <div class="rewards">
          <div class="reward-item">
            <span class="reward-bullet">📦</span>
            <span class="reward-text">{itemSummary}</span>
          </div>
        </div>

        <p class="hint">クリック または Enter で続ける</p>
      </div>
    </div>
  </div>
{/if}

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
    border: 2px solid #4caf50;
    border-radius: 12px;
    padding: 0;
    max-width: 900px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(76, 175, 80, 0.15);
    animation: dialogPopIn 0.3s ease-out;
    cursor: default;
    overflow: hidden;
    position: relative;
  }

  .dialog-content {
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
    color: #81c784;
    margin: 0;
    text-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
  }

  .narrative {
    color: #d0d0e0;
    line-height: 1.7;
    font-size: 0.95rem;
    margin: 0;
  }

  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #4caf50, transparent);
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
