<script lang="ts">
  import {
    gameState,
    addMessage,
    addMoney,
    addReputation,
    addVillageDevelopment,
    addActiveQuest,
    removeActiveQuest,
    incrementCompletedQuests,
    setAvailableQuests,
  } from '$lib/stores/game';
  import { getItem } from '$lib/data/items';
  import { removeItemsFromInventory } from '$lib/services/inventory';
  import type { QuestDef, ActiveQuest, OwnedItem } from '$lib/models/types';

  export let onBack: () => void;

  type Tab = 'available' | 'active';
  let activeTab: Tab = 'available';

  // 依頼を受注
  function acceptQuest(quest: QuestDef) {
    if ($gameState.activeQuests.length >= 3) {
      addMessage('同時に受注できる依頼は3件までです');
      return;
    }

    const activeQuest: ActiveQuest = {
      ...quest,
      acceptedDay: $gameState.day,
      deliveredCount: 0,
    };

    addActiveQuest(activeQuest);
    setAvailableQuests($gameState.availableQuests.filter((q) => q.id !== quest.id));
    addMessage(`依頼「${quest.title}」を受注しました`);
    activeTab = 'active';
  }

  // 納品可能かチェック
  function canDeliver(quest: ActiveQuest): boolean {
    const remaining = quest.requiredQuantity - quest.deliveredCount;
    const matchingItems = getMatchingItemsForQuest(quest);
    return matchingItems.length >= remaining;
  }

  // 依頼に合致するアイテムを取得
  function getMatchingItemsForQuest(quest: ActiveQuest): OwnedItem[] {
    return $gameState.inventory.filter((item) => {
      if (item.itemId !== quest.requiredItemId) return false;
      if (quest.requiredQuality && item.quality < quest.requiredQuality) return false;
      return true;
    });
  }

  // 納品処理
  function deliverQuest(quest: ActiveQuest) {
    const remaining = quest.requiredQuantity - quest.deliveredCount;
    const matchingItems = getMatchingItemsForQuest(quest);

    if (matchingItems.length < remaining) {
      addMessage('納品に必要なアイテムが足りません');
      return;
    }

    // アイテムを消費
    const itemsToConsume = matchingItems.slice(0, remaining);
    gameState.update((state) => ({
      ...state,
      inventory: removeItemsFromInventory(state.inventory, itemsToConsume),
    }));

    // 報酬付与
    addMoney(quest.rewardMoney);
    addReputation(quest.rewardReputation);
    incrementCompletedQuests();
    removeActiveQuest(quest.id);

    // 村発展度の増加（依頼難易度に応じて1-3）
    let developmentGain = 1;
    if (quest.type === 'quality') developmentGain = 2;
    if (quest.type === 'bulk') developmentGain = 2;
    if (quest.requiredItemId === 'elixir') developmentGain = 3;

    // 高品質納品ボーナス（品質70以上で+1）
    const avgQuality = itemsToConsume.reduce((sum, i) => sum + i.quality, 0) / itemsToConsume.length;
    if (avgQuality >= 70) developmentGain += 1;

    addVillageDevelopment(developmentGain);

    const itemDef = getItem(quest.requiredItemId);
    const itemName = itemDef?.name || quest.requiredItemId;
    addMessage(
      `依頼「${quest.title}」を達成しました！ 報酬: ${quest.rewardMoney}G, 名声+${quest.rewardReputation}, 村発展+${developmentGain}`
    );
  }

  // 残り日数を計算
  function getDaysRemaining(quest: ActiveQuest): number {
    return quest.acceptedDay + quest.deadlineDays - $gameState.day;
  }

  function getQuestTypeLabel(type: string): string {
    switch (type) {
      case 'deliver':
        return '納品';
      case 'quality':
        return '品質指定';
      case 'bulk':
        return '大量納品';
      default:
        return type;
    }
  }

  // 納品可能なクエスト数
  $: deliverableCount = $gameState.activeQuests.filter((quest) => canDeliver(quest)).length;
</script>

<div class="quest-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>📜 依頼</h2>

  <div class="tabs">
    <button
      class="tab"
      class:active={activeTab === 'available'}
      on:click={() => (activeTab = 'available')}
    >
      掲示板 ({$gameState.availableQuests.length})
    </button>
    <button
      class="tab"
      class:active={activeTab === 'active'}
      on:click={() => (activeTab = 'active')}
    >
      受注中 ({$gameState.activeQuests.length}/3)
      {#if deliverableCount > 0}
        <span class="badge">{deliverableCount}</span>
      {/if}
    </button>
  </div>

  {#if activeTab === 'available'}
    <div class="quest-list">
      {#if $gameState.availableQuests.length === 0}
        <p class="empty">現在受注可能な依頼はありません</p>
      {:else}
        {#each $gameState.availableQuests as quest}
          {@const itemDef = getItem(quest.requiredItemId)}
          {@const canAccept = $gameState.activeQuests.length < 3}
          <div class="quest-item">
            <div class="quest-header">
              <span class="quest-title">{quest.title}</span>
              <span class="quest-type">{getQuestTypeLabel(quest.type)}</span>
            </div>
            <p class="quest-desc">{quest.description}</p>
            <div class="quest-details">
              <span class="requirement">
                {itemDef?.name || quest.requiredItemId}
                ×{quest.requiredQuantity}
                {#if quest.requiredQuality}
                  (品質{quest.requiredQuality}以上)
                {/if}
              </span>
              <span class="deadline">期限: {quest.deadlineDays}日</span>
            </div>
            <div class="quest-rewards">
              <span class="reward-money">{quest.rewardMoney}G</span>
              <span class="reward-rep">名声+{quest.rewardReputation}</span>
            </div>
            <button
              class="accept-btn"
              disabled={!canAccept}
              on:click={() => acceptQuest(quest)}
            >
              受注する
            </button>
          </div>
        {/each}
      {/if}
    </div>

  {:else}
    <div class="quest-list">
      {#if $gameState.activeQuests.length === 0}
        <p class="empty">受注中の依頼はありません</p>
      {:else}
        {#each $gameState.activeQuests as quest}
          {@const itemDef = getItem(quest.requiredItemId)}
          {@const daysLeft = getDaysRemaining(quest)}
          {@const canDeliverNow = canDeliver(quest)}
          {@const matchingCount = getMatchingItemsForQuest(quest).length}
          <div class="quest-item active" class:urgent={daysLeft <= 3}>
            <div class="quest-header">
              <span class="quest-title">{quest.title}</span>
              <span class="days-left" class:danger={daysLeft <= 3}>
                残り{daysLeft}日
              </span>
            </div>
            <div class="quest-details">
              <span class="requirement">
                {itemDef?.name || quest.requiredItemId}
                ×{quest.requiredQuantity}
                {#if quest.requiredQuality}
                  (品質{quest.requiredQuality}以上)
                {/if}
              </span>
              <span class="progress">
                所持: {matchingCount}/{quest.requiredQuantity}
              </span>
            </div>
            <div class="quest-rewards">
              <span class="reward-money">{quest.rewardMoney}G</span>
              <span class="reward-rep">名声+{quest.rewardReputation}</span>
            </div>
            <button
              class="deliver-btn"
              disabled={!canDeliverNow}
              on:click={() => deliverQuest(quest)}
            >
              {canDeliverNow ? '納品する' : '準備中...'}
            </button>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .quest-panel {
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

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .tab {
    flex: 1;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #4a4a6a;
    border-radius: 6px;
    color: #a0a0b0;
    cursor: pointer;
    font-size: 1rem;
  }

  .tab.active {
    border-color: #c9a959;
    color: #f4e4bc;
    background: rgba(201, 169, 89, 0.2);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.4rem;
    margin-left: 0.5rem;
    background: #4caf50;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: bold;
    color: white;
  }

  .quest-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 400px;
    overflow-y: auto;
  }

  .empty {
    color: #808090;
    text-align: center;
    padding: 2rem;
  }

  .quest-item {
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #4a4a6a;
    border-radius: 8px;
  }

  .quest-item.active {
    border-color: #2196f3;
  }

  .quest-item.urgent {
    border-color: #ff9800;
    background: rgba(255, 152, 0, 0.1);
  }

  .quest-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .quest-title {
    font-size: 1.1rem;
    font-weight: bold;
    color: #f4e4bc;
  }

  .quest-type {
    padding: 0.2rem 0.5rem;
    background: rgba(33, 150, 243, 0.3);
    border-radius: 4px;
    font-size: 0.8rem;
    color: #90caf9;
  }

  .days-left {
    padding: 0.2rem 0.5rem;
    background: rgba(76, 175, 80, 0.3);
    border-radius: 4px;
    font-size: 0.85rem;
    color: #81c784;
  }

  .days-left.danger {
    background: rgba(244, 67, 54, 0.3);
    color: #ef5350;
  }

  .quest-desc {
    color: #a0a0b0;
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
  }

  .quest-details {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .requirement {
    color: #e0e0f0;
  }

  .deadline, .progress {
    color: #a0a0b0;
  }

  .quest-rewards {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .reward-money {
    color: #c9a959;
    font-weight: bold;
  }

  .reward-rep {
    color: #81c784;
  }

  .accept-btn, .deliver-btn {
    width: 100%;
    padding: 0.6rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 6px;
    color: #1a1a2e;
    font-weight: bold;
    cursor: pointer;
  }

  .accept-btn:disabled, .deliver-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .accept-btn:hover:not(:disabled), .deliver-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .deliver-btn {
    background: linear-gradient(135deg, #1565c0 0%, #42a5f5 100%);
    color: white;
  }
</style>
