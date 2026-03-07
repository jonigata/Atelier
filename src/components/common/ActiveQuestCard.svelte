<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { getItem, getItemIcon, handleIconError } from '$lib/data/items';
  import { getQuestClient } from '$lib/data/quests';
  import QuestTypeIcon from './QuestTypeIcon.svelte';
  import type { ActiveQuest, OwnedItem } from '$lib/models/types';

  export let quest: ActiveQuest;
  export let compact: boolean = false;
  export let showDeliverButton: boolean = false;
  export let onDeliver: ((quest: ActiveQuest) => void) | null = null;
  export let onCancel: ((quest: ActiveQuest) => void) | null = null;
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
  $: dangerLevel = Math.max(0, 1 - daysLeft / quest.deadlineDays);
  $: client = quest.clientId ? getQuestClient(quest.clientId) : undefined;
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="quest-card"
  class:compact
  class:type-quality={quest.type === 'quality'}
  class:type-bulk={quest.type === 'bulk'}
  class:ready={canDeliverNow}
  class:urgent={daysLeft <= 3 && !canDeliverNow}
  class:clickable={onClick !== null}
  on:click={() => onClick?.(quest)}
  role={onClick ? 'button' : undefined}
  tabindex={onClick ? 0 : undefined}
>
  {#if quest.type !== 'deliver'}
    <span class="quest-type-float">
      <QuestTypeIcon type={quest.type} showLabel={true} />
    </span>
  {/if}

  {#if client}
    <div class="quest-client">{client.name}（{client.title}）</div>
  {/if}

  <div class="quest-header">
    <span class="quest-title">{quest.title}</span>
  </div>

  <div class="days-bar-container">
    <div
      class="days-bar"
      style="width: {Math.max(0, Math.min(100, (daysLeft / quest.deadlineDays) * 100))}%; --danger-level: {dangerLevel}"
    ></div>
    <span class="days-label">残り{daysLeft}日</span>
  </div>

  <div class="quest-details">
    <span class="requirement">
      <img
        class="item-icon"
        class:silhouette={!$gameState.craftedItems.includes(quest.requiredItemId)}
        src={getItemIcon(quest.requiredItemId)}
        alt={itemDef?.name || quest.requiredItemId}
        on:error={handleIconError}
      />
      <span class="requirement-text">
        {itemDef?.name || quest.requiredItemId}
        ×{quest.requiredQuantity}
        <span class="requirement-sub">
          {#if quest.requiredQuality}
            <span class="quality-req">品質{quest.requiredQuality}↑</span>
          {/if}
          <span class="owned-count" class:enough={matchingCount >= quest.requiredQuantity}>
            所持: {matchingCount}
          </span>
        </span>
      </span>
    </span>
  </div>

  <div class="quest-rewards">
    <span class="detail-label">報酬:</span>
    <span class="reward-money">{quest.rewardMoney}G</span>
    {#if quest.type === 'quality'}
      <span class="reward-rep">名声+{quest.rewardReputation}</span>
    {:else if quest.type === 'bulk'}
      <span class="reward-dev">村発展+{quest.rewardReputation}</span>
    {:else}
      <span class="reward-rep">名声+{Math.floor(quest.rewardReputation / 2)}</span>
      <span class="reward-dev">村発展+{Math.floor(quest.rewardReputation / 2)}</span>
    {/if}
  </div>

  {#if showDeliverButton && onDeliver}
    <div class="quest-actions">
      <button
        class="deliver-btn"
        disabled={!canDeliverNow}
        on:click={() => onDeliver(quest)}
      >
        {canDeliverNow ? '納品' : '準備中'}
      </button>
      {#if onCancel}
        <button
          class="cancel-btn"
          on:click={() => onCancel(quest)}
        >
          取り下げ
        </button>
      {/if}
    </div>
  {:else if canDeliverNow}
    <div class="quest-bottom-row">
      <span class="ready-badge">納品可</span>
    </div>
  {/if}
</div>

<style>
  .quest-card {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 0.3rem 0.4rem;
    background: var(--surface-subtle);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    gap: 0.05rem;
  }

  .quest-card.ready {
    border-color: rgba(76, 175, 80, 0.5);
    background: rgba(76, 175, 80, 0.06);
  }

  .quest-card.urgent {
    border-color: rgba(255, 152, 0, 0.5);
    background: rgba(255, 152, 0, 0.06);
  }

  .quest-card.type-quality:not(.ready):not(.urgent) {
    background: rgba(156, 39, 176, 0.08);
    border-color: rgba(156, 39, 176, 0.3);
  }

  .quest-card.type-bulk:not(.ready):not(.urgent) {
    background: rgba(33, 150, 243, 0.08);
    border-color: rgba(33, 150, 243, 0.3);
  }

  .quest-card.clickable {
    cursor: pointer;
  }

  .quest-card.clickable:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .quest-type-float {
    position: absolute;
    top: -0.35rem;
    right: -0.25rem;
    padding: 0.08rem 0.2rem;
    background: rgba(33, 150, 243, 0.4);
    border-radius: 3px;
    font-size: 0.5rem;
    color: #90caf9;
    line-height: 1.2;
    z-index: 1;
  }

  .quest-type-float :global(.icon) {
    width: 12px;
    height: 12px;
  }

  .quest-type-float :global(.label) {
    font-size: 0.5rem;
  }

  .quest-client {
    font-size: 0.5rem;
    color: var(--text-sub);
  }

  .quest-header {
    display: flex;
    align-items: center;
  }

  .quest-title {
    font-size: 0.7rem;
    font-weight: bold;
    color: var(--text-heading);
  }

  .days-bar-container {
    position: relative;
    height: 1.1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.1rem;
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
    font-size: 0.6rem;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .quest-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    font-size: 0.7rem;
    margin-bottom: 0.1rem;
  }

  .requirement {
    color: var(--text-body);
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  .item-icon {
    width: 56px;
    height: 56px;
    object-fit: contain;
  }

  .item-icon.silhouette {
    filter: brightness(0);
    opacity: 0.5;
  }

  .requirement-text {
    display: flex;
    flex-direction: column;
    gap: 0;
    line-height: 1.2;
  }

  .requirement-sub {
    display: flex;
    gap: 0.3rem;
    align-items: center;
  }

  .quality-req {
    font-size: 0.5rem;
    color: #ce93d8;
    background: rgba(156, 39, 176, 0.2);
    padding: 0.08rem 0.2rem;
    border-radius: 3px;
    line-height: 1.2;
  }

  .owned-count {
    font-size: 0.6rem;
    color: var(--text-dim);
  }

  .owned-count.enough {
    color: var(--accent-green-dark);
  }

  .quest-rewards {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.1rem 0.2rem;
    font-size: 0.5rem;
    white-space: nowrap;
  }

  .detail-label {
    color: var(--text-dim);
    font-size: 0.5rem;
    flex-shrink: 0;
  }

  .reward-money {
    color: var(--accent-gold);
    font-weight: bold;
    font-size: 0.55rem;
  }

  .reward-rep {
    color: var(--accent-green);
  }

  .reward-dev {
    color: var(--accent-blue);
  }

  .quest-bottom-row {
    display: flex;
    align-items: center;
    margin-top: 0.1rem;
  }

  .ready-badge {
    padding: 0.08rem 0.2rem;
    background: linear-gradient(135deg, #0097a7, #26c6da);
    border-radius: 3px;
    font-size: 0.5rem;
    line-height: 1.2;
    font-weight: bold;
    color: #fff;
    box-shadow: 0 0 8px rgba(38, 198, 218, 0.6);
    animation: badge-pulse 1.5s ease-in-out infinite;
  }

  @keyframes badge-pulse {
    0%, 100% { box-shadow: 0 0 6px rgba(38, 198, 218, 0.5); }
    50% { box-shadow: 0 0 14px rgba(38, 198, 218, 0.9); }
  }

  /* アクションボタン群 */
  .quest-actions {
    display: flex;
    gap: 0.2rem;
    margin-top: 0.1rem;
  }

  .deliver-btn {
    flex: 1;
    padding: 0.3rem;
    background: linear-gradient(135deg, #1565c0 0%, #42a5f5 100%);
    border: none;
    border-radius: var(--radius-md);
    color: white;
    font-weight: bold;
    font-size: 0.7rem;
    cursor: pointer;
  }

  .deliver-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .deliver-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .cancel-btn {
    padding: 0.3rem 0.5rem;
    background: rgba(244, 67, 54, 0.15);
    border: 1px solid rgba(244, 67, 54, 0.4);
    border-radius: var(--radius-md);
    color: #ef9a9a;
    font-size: 0.7rem;
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: rgba(244, 67, 54, 0.3);
    color: #ffcdd2;
  }

  /* コンパクトモード（現在は通常モードと同じ） */
  .quest-card.compact {
    padding: 0.3rem 0.4rem;
  }
</style>
