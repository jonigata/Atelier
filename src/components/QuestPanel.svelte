<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    gameState,
    addMessage,
    addMoney,
    addReputationExp,
    addVillageExp,
  } from '$lib/stores/game';
  import {
    addActiveQuest,
    removeActiveQuest,
    incrementCompletedQuests,
    setAvailableQuests,
    clearNewQuestCount,
    setSelectedQuestId,
  } from '$lib/stores/quests';
  import { getItem, getItemIcon, handleIconError } from '$lib/data/items';
  import { getQuestClient } from '$lib/data/quests';
  import { removeItemsFromInventory } from '$lib/services/inventory';
  import { checkMilestoneProgress } from '$lib/services/tutorial';
  import { setEventDialogue } from '$lib/stores/tutorial';
  import { getQuestMoneyMult, getQuestReputationBonus, getQuestQualityBonus } from '$lib/services/equipmentEffects';
  import { calcLevelFromExp, calcExpProgress, calcExpForLevel, buildExpGaugeSegments } from '$lib/data/balance';
  import { get } from 'svelte/store';
  import ActiveQuestCard from './common/ActiveQuestCard.svelte';
  import QuestTypeIcon from './common/QuestTypeIcon.svelte';
  import type { QuestDef, ActiveQuest, OwnedItem, EventDialogue, RewardDisplay } from '$lib/models/types';
  import ActiveEquipmentIcons from './common/ActiveEquipmentIcons.svelte';

  export let onBack: () => void;

  // パネルを開いたときに新規依頼のバッジをクリア
  onMount(() => {
    clearNewQuestCount();
  });

  // パネルを閉じるときにselectedQuestIdをクリア
  onDestroy(() => {
    setSelectedQuestId(null);
  });

  type Tab = 'available' | 'active';
  // selectedQuestIdがある場合は受注中タブを開く
  let activeTab: Tab = $gameState.selectedQuestId ? 'active' : 'available';

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

    // アチーブメントチェック（依頼受注関連）
    checkMilestoneProgress();
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

    // 村発展度の増加量を計算（依頼難易度に応じて1-3）
    let developmentGain = 1;
    if (quest.type === 'quality') developmentGain = 2;
    if (quest.type === 'bulk') developmentGain = 2;
    if (quest.requiredItemId === 'elixir') developmentGain = 3;

    // 高品質納品ボーナス（品質70以上で+1）
    const avgQuality = itemsToConsume.reduce((sum, i) => sum + i.quality, 0) / itemsToConsume.length;
    if (avgQuality >= 70) developmentGain += 1;

    // 機材効果: 報酬補正
    const moneyMult = getQuestMoneyMult();
    const repBonus = getQuestReputationBonus();
    const qualityBonus = getQuestQualityBonus(avgQuality);

    const finalMoney = Math.floor(quest.rewardMoney * moneyMult) + qualityBonus.money;
    const finalReputation = quest.rewardReputation + repBonus + qualityBonus.reputation;

    // ゲージ用: 変更前の状態を保存
    const stateBefore = get(gameState);
    const repLevelBefore = calcLevelFromExp(stateBefore.reputationExp);
    const repExpBefore = calcExpProgress(stateBefore.reputationExp);
    const repExpMax = calcExpForLevel(repLevelBefore);
    const vilLevelBefore = calcLevelFromExp(stateBefore.villageExp);
    const vilExpBefore = calcExpProgress(stateBefore.villageExp);
    const vilExpMax = calcExpForLevel(vilLevelBefore);

    // 報酬付与（機材効果適用済み）
    addMoney(finalMoney);
    addReputationExp(finalReputation);
    addVillageExp(developmentGain);
    incrementCompletedQuests();
    removeActiveQuest(quest.id);

    // ゲージ用: 変更後の状態を取得
    const stateAfter = get(gameState);
    const repLevelAfter = calcLevelFromExp(stateAfter.reputationExp);
    const vilLevelAfter = calcLevelFromExp(stateAfter.villageExp);

    // 完了ダイアログを表示
    const repProgressAfter = calcExpProgress(stateAfter.reputationExp);
    const vilProgressAfter = calcExpProgress(stateAfter.villageExp);
    const repLeveledUp = repLevelAfter > repLevelBefore;
    const vilLeveledUp = vilLevelAfter > vilLevelBefore;

    const structuredRewards: RewardDisplay[] = [
      { text: `${finalMoney.toLocaleString()} G`, type: 'money' },
      {
        text: `名声Exp +${finalReputation}`,
        type: 'reputation',
        gaugeData: {
          before: repExpBefore,
          after: repLeveledUp ? repExpMax : repProgressAfter,
          max: repExpMax,
          label: `Lv.${repLevelBefore}`,
          segments: repLeveledUp
            ? buildExpGaugeSegments(repLevelBefore, repExpBefore, repLevelAfter, repProgressAfter)
            : undefined,
        },
      },
      {
        text: `村発展Exp +${developmentGain}`,
        type: 'villageDevelopment',
        gaugeData: {
          before: vilExpBefore,
          after: vilLeveledUp ? vilExpMax : vilProgressAfter,
          max: vilExpMax,
          label: `Lv.${vilLevelBefore}`,
          segments: vilLeveledUp
            ? buildExpGaugeSegments(vilLevelBefore, vilExpBefore, vilLevelAfter, vilProgressAfter)
            : undefined,
        },
      },
    ];

    const client = quest.clientId ? getQuestClient(quest.clientId) : undefined;
    const dialogue: EventDialogue = {
      characterName: client?.name ?? '依頼主',
      characterTitle: client?.title ?? '',
      characterFaceId: client?.faceId,
      lines: [quest.completionMessage ?? quest.description],
      rewardsTitle: '依頼達成！',
      achievementTitle: quest.title,
      structuredRewards,
    };
    setEventDialogue(dialogue);

    addMessage(
      `依頼「${quest.title}」を達成しました！ 報酬: ${finalMoney}G, 名声+${finalReputation}, 村発展+${developmentGain}`
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

  // 掲示板の依頼をいますぐ納品可能かチェック
  function canFulfill(quest: QuestDef): boolean {
    const matchingItems = $gameState.inventory.filter((item) => {
      if (item.itemId !== quest.requiredItemId) return false;
      if (quest.requiredQuality && item.quality < quest.requiredQuality) return false;
      return true;
    });
    return matchingItems.length >= quest.requiredQuantity;
  }

  // 納品可能なクエスト数
  $: deliverableCount = $gameState.activeQuests.filter((quest) => canDeliver(quest)).length;
</script>

<div class="quest-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>📜 依頼 <ActiveEquipmentIcons prefixes={['quest_']} /></h2>

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
          {@const client = quest.clientId ? getQuestClient(quest.clientId) : undefined}
          <div class="quest-item">
            {#if client}
              <div class="quest-client">{client.name}（{client.title}）</div>
            {/if}
            <div class="quest-header">
              <span class="quest-title">{quest.title}</span>
              <span class="quest-type">
                <QuestTypeIcon type={quest.type} showLabel={true} />
              </span>
            </div>
            <p class="quest-desc">{quest.description}</p>
            <div class="quest-details">
              <span class="requirement">
                <img class="item-icon-small" src={getItemIcon(quest.requiredItemId)} alt={itemDef?.name || quest.requiredItemId} on:error={handleIconError} />
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
              {#if canFulfill(quest)}
                <span class="ready-badge">納品可</span>
              {/if}
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
          <ActiveQuestCard {quest} showDeliverButton={true} onDeliver={deliverQuest} />
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
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
    max-height: 500px;
    overflow-y: auto;
  }

  .empty {
    color: #808090;
    text-align: center;
    padding: 2rem;
  }

  .quest-item {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #4a4a6a;
    border-radius: 8px;
    min-height: 200px;
  }

  .quest-client {
    font-size: 0.8rem;
    color: #a0a0b0;
    margin-bottom: 0.25rem;
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
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .item-icon-small {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  .deadline, .progress {
    color: #a0a0b0;
  }

  .quest-rewards {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
    margin-top: auto;
    padding-top: 0.5rem;
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

  .accept-btn {
    width: 100%;
    padding: 0.6rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 6px;
    color: #1a1a2e;
    font-weight: bold;
    cursor: pointer;
  }

  .accept-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .accept-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }
</style>
