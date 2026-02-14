<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { getItem, getItemIcon, handleIconError } from '$lib/data/items';
  import QuestTypeIcon from './QuestTypeIcon.svelte';
  import type { ActiveQuest, OwnedItem } from '$lib/models/types';

  export let quest: ActiveQuest;
  export let compact: boolean = false;
  export let showDeliverButton: boolean = false;
  export let onDeliver: ((quest: ActiveQuest) => void) | null = null;
  export let onClick: ((quest: ActiveQuest) => void) | null = null;

  // 依頼に合致するアイテムを取得
  function getMatchingItemsForQuest(quest: ActiveQuest): OwnedItem[] {
    return $gameState.inventory.filter((item) => {
      if (item.itemId !== quest.requiredItemId) return false;
      if (quest.requiredQuality && item.quality < quest.requiredQuality) return false;
      return true;
    });
  }

  // 納品可能かチェック
  function canDeliver(quest: ActiveQuest): boolean {
    const remaining = quest.requiredQuantity - quest.deliveredCount;
    const matchingItems = getMatchingItemsForQuest(quest);
    return matchingItems.length >= remaining;
  }

  // 残り日数を計算
  function getDaysRemaining(quest: ActiveQuest): number {
    return quest.acceptedDay + quest.deadlineDays - $gameState.day;
  }

  $: itemDef = getItem(quest.requiredItemId);
  $: daysLeft = getDaysRemaining(quest);
  $: matchingCount = getMatchingItemsForQuest(quest).length;
  $: canDeliverNow = canDeliver(quest);
  $: dangerLevel = Math.max(0, 1 - daysLeft / 7);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="quest-card"
  class:compact
  class:urgent={daysLeft <= 3}
  class:ready={canDeliverNow}
  class:clickable={onClick !== null}
  on:click={() => onClick?.(quest)}
  role={onClick ? 'button' : undefined}
  tabindex={onClick ? 0 : undefined}
>
  <div class="quest-main">
    <div class="quest-type-area">
      <QuestTypeIcon type={quest.type} size="medium" />
    </div>
    <div class="quest-content">
      <div class="quest-header">
        <span class="quest-title">{quest.title}</span>
      </div>

      <div class="days-bar-container">
        <div
          class="days-bar"
          style="width: {Math.max(0, Math.min(100, (daysLeft / 7) * 100))}%; --danger-level: {dangerLevel}"
        ></div>
        <span class="days-label">残り{daysLeft}日</span>
      </div>
    </div>
  </div>

  <div class="quest-requirement">
    <img class="item-icon" src={getItemIcon(quest.requiredItemId)} alt="" on:error={handleIconError} />
    <span class="item-name">{itemDef?.name || quest.requiredItemId}</span>
    {#if quest.requiredQuality}
      <span class="quality-req">品質{quest.requiredQuality}↑</span>
    {/if}
    <span class="quantity" class:complete={matchingCount >= quest.requiredQuantity}>
      {matchingCount}/{quest.requiredQuantity}
    </span>
  </div>

  <div class="quest-footer">
    <span class="reward-money">{quest.rewardMoney}G</span>
    <span class="reward-rep">名声+{quest.rewardReputation}</span>
    {#if canDeliverNow && !showDeliverButton}
      <span class="ready-badge">納品可</span>
    {/if}
  </div>

  {#if showDeliverButton && onDeliver}
    <button
      class="deliver-btn"
      disabled={!canDeliverNow}
      on:click={() => onDeliver(quest)}
    >
      {canDeliverNow ? '納品する' : '準備中...'}
    </button>
  {/if}
</div>

<style>
  .quest-card {
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid #3a3a5a;
    border-radius: 6px;
    border-left: 3px solid #2196f3;
  }

  .quest-card.urgent {
    border-left-color: #ff9800;
    background: rgba(255, 152, 0, 0.05);
  }

  .quest-card.ready {
    border-left-color: #4caf50;
    background: rgba(76, 175, 80, 0.08);
  }

  .quest-card.clickable {
    cursor: pointer;
  }

  .quest-card.clickable:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #6a6a8a;
  }

  .quest-main {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .quest-type-area {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .quest-content {
    flex: 1;
    min-width: 0;
  }

  .quest-header {
    margin-bottom: 0.4rem;
  }

  .quest-title {
    font-weight: bold;
    color: #e0e0f0;
    font-size: 0.95rem;
  }

  .days-bar-container {
    position: relative;
    height: 1.25rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    overflow: hidden;
  }

  .days-bar {
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, #4caf50 calc((1 - var(--danger-level)) * 100%), #f44336),
      color-mix(in srgb, #81c784 calc((1 - var(--danger-level)) * 100%), #ff6b6b)
    );
    transition: width 0.3s ease, background 0.3s ease;
  }

  .days-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 0.75rem;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .quest-requirement {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
    font-size: 0.85rem;
  }

  .item-icon {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }

  .item-name {
    color: #e0e0f0;
  }

  .quality-req {
    padding: 0.1rem 0.3rem;
    background: rgba(156, 39, 176, 0.3);
    border-radius: 3px;
    font-size: 0.7rem;
    color: #ce93d8;
  }

  .quantity {
    color: #a0a0b0;
    margin-left: auto;
  }

  .quantity.complete {
    color: #4caf50;
    font-weight: bold;
  }

  .quest-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
  }

  .reward-money {
    color: #c9a959;
    font-weight: bold;
  }

  .reward-rep {
    color: #81c784;
  }

  .ready-badge {
    margin-left: auto;
    padding: 0.2rem 0.5rem;
    background: linear-gradient(135deg, #0097a7, #26c6da);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
    color: #fff;
    box-shadow: 0 0 8px rgba(38, 198, 218, 0.6);
    animation: badge-pulse 1.5s ease-in-out infinite;
  }

  @keyframes badge-pulse {
    0%, 100% { box-shadow: 0 0 6px rgba(38, 198, 218, 0.5); }
    50% { box-shadow: 0 0 14px rgba(38, 198, 218, 0.9); }
  }

  /* コンパクトモード */
  .quest-card.compact {
    padding: 0.5rem 0.75rem;
  }

  .quest-card.compact .quest-title {
    font-size: 0.85rem;
  }

  .quest-card.compact .days-bar-container {
    height: 1rem;
  }

  .quest-card.compact .days-label {
    font-size: 0.65rem;
  }

  /* 納品ボタン */
  .deliver-btn {
    width: 100%;
    padding: 0.5rem;
    margin-top: 0.5rem;
    background: linear-gradient(135deg, #1565c0 0%, #42a5f5 100%);
    border: none;
    border-radius: 6px;
    color: white;
    font-weight: bold;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .deliver-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .deliver-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }
</style>
