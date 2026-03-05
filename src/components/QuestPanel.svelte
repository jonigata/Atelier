<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    gameState,
    addMessage,
    addReputationExp,
  } from '$lib/stores/game';
  import {
    addActiveQuest,
    removeActiveQuest,
    incrementFailedQuests,
    setAvailableQuests,
    clearNewQuestCount,
    setSelectedQuestId,
  } from '$lib/stores/quests';
  import { getItem, getItemIcon, handleIconError } from '$lib/data/items';
  import { recipes } from '$lib/data/recipes';
  import { getQuestClient } from '$lib/data/quests';
  import { processActionComplete, processAchievementPresentation, showDialogueAndWait } from '$lib/services/presentation';
  import { showConfirmAndWait } from '$lib/stores/confirmDialog';
  import { executeQuestDelivery } from '$lib/services/quest';
  import { checkAchievements } from '$lib/services/achievement';
  import { showDrawsForLevelUp } from '$lib/services/drawEvent';
  import { calcLevelFromExp, calcExpProgress, calcExpForLevel, buildExpGaugeSegments } from '$lib/data/balance';
  import { get } from 'svelte/store';
  import ActiveQuestCard from './common/ActiveQuestCard.svelte';
  import QuestTypeIcon from './common/QuestTypeIcon.svelte';
  import type { QuestDef, ActiveQuest, OwnedItem, EventDialogue, RewardDisplay } from '$lib/models/types';


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
  async function acceptQuest(quest: QuestDef) {
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
    await processActionComplete();
  }

  // 依頼を取り下げ（失敗と同じペナルティ）
  async function cancelQuest(quest: ActiveQuest) {
    const confirmed = await showConfirmAndWait({
      message: `依頼「${quest.title}」を取り下げますか？\n失敗と同じペナルティ（名声-5）が発生します。`,
      confirmLabel: '取り下げる',
      cancelLabel: '取り下げない',
    });
    if (!confirmed) return;
    addReputationExp(-5);
    incrementFailedQuests();
    removeActiveQuest(quest.id);
    addMessage(`依頼「${quest.title}」を取り下げました。名声が下がりました。`);
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
  async function deliverQuest(quest: ActiveQuest) {
    const remaining = quest.requiredQuantity - quest.deliveredCount;
    const matchingItems = getMatchingItemsForQuest(quest);

    if (matchingItems.length < remaining) {
      addMessage('納品に必要なアイテムが足りません');
      return;
    }

    const itemsToConsume = matchingItems.slice(0, remaining);

    // ゲージ用: 変更前の状態を保存
    const stateBefore = get(gameState);
    const repLevelBefore = calcLevelFromExp(stateBefore.reputationExp);
    const repExpBefore = calcExpProgress(stateBefore.reputationExp);
    const repExpMax = calcExpForLevel(repLevelBefore);
    const vilLevelBefore = calcLevelFromExp(stateBefore.villageExp);
    const vilExpBefore = calcExpProgress(stateBefore.villageExp);
    const vilExpMax = calcExpForLevel(vilLevelBefore);

    // 共通納品ロジック
    const { finalMoney, finalReputation, finalDevelopment, reputationDrawInfo, villageDrawInfo } = executeQuestDelivery(quest, itemsToConsume);

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
    ];
    if (finalReputation > 0) {
      structuredRewards.push({
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
      });
    }
    if (finalDevelopment > 0) {
      structuredRewards.push({
        text: `村発展Exp +${finalDevelopment}`,
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
      });
    }

    const client = quest.clientId ? getQuestClient(quest.clientId) : undefined;
    // 採取隊派遣中はレン・フィーが遠征で不在 → 書き置きとして表示
    const isAdventurerAbsent = (quest.clientId === 'ren' || quest.clientId === 'fee') && $gameState.expedition !== null;
    const dialogue: EventDialogue = {
      characterName: client?.name ?? '依頼主',
      characterTitle: isAdventurerAbsent ? '書き置き' : (client?.title ?? ''),
      characterFaceId: isAdventurerAbsent ? undefined : client?.faceId,
      lines: isAdventurerAbsent
        ? [`（掲示板に書き置きが残されていた）`, `「${quest.completionMessage ?? quest.description}」`]
        : [quest.completionMessage ?? quest.description],
      rewardsTitle: '依頼達成！',
      achievementTitle: quest.title,
      structuredRewards,
    };
    const rewardParts = [`${finalMoney}G`];
    if (finalReputation > 0) rewardParts.push(`名声+${finalReputation}`);
    if (finalDevelopment > 0) rewardParts.push(`村発展+${finalDevelopment}`);
    addMessage(`依頼「${quest.title}」を達成しました！ 報酬: ${rewardParts.join(', ')}`);

    // 納品ダイアログ → 閉じた後にアチーブメントを明示的にチェック
    await showDialogueAndWait(dialogue);
    let achievedId = checkAchievements();
    while (achievedId) {
      await processAchievementPresentation(achievedId);
      achievedId = checkAchievements();
    }

    // ドロー表示（明示的に待つ）
    if (villageDrawInfo) await showDrawsForLevelUp('facility', villageDrawInfo);
    if (reputationDrawInfo) await showDrawsForLevelUp('helper', reputationDrawInfo);
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

  // 要求アイテムのレシピを逆引き
  function getRecipeForItem(itemId: string) {
    return Object.values(recipes).find(r => r.resultItemId === itemId);
  }

  // レシピを知らない調合品か
  function isRecipeUnknown(quest: QuestDef): boolean {
    const recipe = getRecipeForItem(quest.requiredItemId);
    if (!recipe) return false; // 素材アイテム（レシピなし）
    return !$gameState.knownRecipes.includes(recipe.id);
  }

  // 素材が不足しているか（レシピ既知の調合品のみ）
  function isMaterialShort(quest: QuestDef): boolean {
    const recipe = getRecipeForItem(quest.requiredItemId);
    if (!recipe) return false;
    if (!$gameState.knownRecipes.includes(recipe.id)) return false;
    for (const ing of recipe.ingredients) {
      const owned = $gameState.inventory.filter(item =>
        ing.itemId ? item.itemId === ing.itemId : (getItem(item.itemId)?.category === ing.category)
      ).reduce((sum, item) => sum + 1, 0);
      if (owned < ing.quantity * quest.requiredQuantity) return true;
    }
    return false;
  }

  // 即納品（受注→即納品をワンアクションで）
  async function instantDeliver(questDef: QuestDef) {
    if ($gameState.activeQuests.length >= 3) {
      addMessage('同時に受注できる依頼は3件までです');
      return;
    }

    const activeQuest: ActiveQuest = {
      ...questDef,
      acceptedDay: $gameState.day,
      deliveredCount: 0,
    };

    addActiveQuest(activeQuest);
    setAvailableQuests($gameState.availableQuests.filter((q) => q.id !== questDef.id));
    addMessage(`依頼「${questDef.title}」を受注しました`);

    await deliverQuest(activeQuest);
  }

  // 納品可能なクエスト数
  $: deliverableCount = $gameState.activeQuests.filter((quest) => canDeliver(quest)).length;
</script>

<div class="quest-panel">
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
          {@const reqLabel = `${itemDef?.name || quest.requiredItemId} ×${quest.requiredQuantity}`}
          <div class="quest-item" class:type-quality={quest.type === 'quality'} class:type-bulk={quest.type === 'bulk'}>
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
            <p class="quest-desc">{quest.description}</p>
            <div class="quest-details">
              <span class="requirement">
                <img
                  class="item-icon-small"
                  class:silhouette={!$gameState.craftedItems.includes(quest.requiredItemId)}
                  src={getItemIcon(quest.requiredItemId)}
                  alt={itemDef?.name || quest.requiredItemId}
                  on:error={handleIconError}
                />
                <span class="requirement-text" class:long={reqLabel.length > 8}>
                  {itemDef?.name || quest.requiredItemId}
                  ×{quest.requiredQuantity}
                  <span class="requirement-sub">
                    {#if quest.requiredQuality}
                      <span class="quality-req">品質{quest.requiredQuality}↑</span>
                    {/if}
                    <span class="owned-count" class:enough={$gameState.inventory.filter(item => item.itemId === quest.requiredItemId && (!quest.requiredQuality || item.quality >= quest.requiredQuality)).length >= quest.requiredQuantity}>
                      所持: {$gameState.inventory.filter(item => item.itemId === quest.requiredItemId && (!quest.requiredQuality || item.quality >= quest.requiredQuality)).length}
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
            <div class="quest-bottom-row">
              <span class="detail-label">期限:</span>
              <span class="deadline">{quest.deadlineDays}日</span>
              {#if canFulfill(quest)}
                <span class="ready-badge">納品可</span>
              {:else if isRecipeUnknown(quest)}
                <span class="badge-recipe-unknown">レシピ不明</span>
              {:else if isMaterialShort(quest)}
                <span class="badge-material-short">素材不足</span>
              {/if}
            </div>
            <div class="quest-actions">
              <button
                class="accept-btn"
                disabled={!canAccept}
                on:click={() => acceptQuest(quest)}
              >
                受注する
              </button>
              {#if canFulfill(quest) && canAccept && $gameState.tutorialProgress.unlockedActions.includes('shop')}
                <button
                  class="instant-deliver-btn"
                  on:click={() => instantDeliver(quest)}
                >
                  即納品
                </button>
              {/if}
            </div>
          </div>
        {/each}
      {/if}
    </div>

  {:else}
    <div class="quest-list">
      {#if $gameState.activeQuests.length === 0}
        <p class="empty">受注中の依頼はありません</p>
      {:else}
        {#each $gameState.activeQuests as quest (quest.id)}
          <ActiveQuestCard {quest} compact showDeliverButton={true} onDeliver={deliverQuest} onCancel={cancelQuest} />
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .quest-panel {
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
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #4a4a6a;
    border-radius: 6px;
    color: #a0a0b0;
    cursor: pointer;
    font-size: 0.8rem;
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
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
  }

  .empty {
    grid-column: 1 / -1;
    color: #808090;
    text-align: center;
    padding: 2rem;
  }

  .quest-item {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 0.3rem 0.4rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    gap: 0.05rem;
  }

  .quest-item.type-quality {
    background: rgba(156, 39, 176, 0.08);
    border-color: rgba(156, 39, 176, 0.3);
  }

  .quest-item.type-bulk {
    background: rgba(33, 150, 243, 0.08);
    border-color: rgba(33, 150, 243, 0.3);
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
    color: #a0a0b0;
  }

  .quest-header {
    display: flex;
    align-items: center;
  }

  .quest-title {
    font-size: 0.8rem;
    font-weight: bold;
    color: #f4e4bc;
  }


  .quest-desc {
    color: #a0a0b0;
    font-size: 0.55rem;
    margin: 0;
    margin-bottom: 0.15rem;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .quest-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    font-size: 0.7rem;
    margin-bottom: 0.1rem;
  }

  .requirement {
    color: #e0e0f0;
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }

  .item-icon-small {
    width: 56px;
    height: 56px;
    object-fit: contain;
  }

  .requirement-text {
    display: flex;
    flex-direction: column;
    gap: 0;
    line-height: 1.2;
  }

  .requirement-text.long {
    font-size: 0.6rem;
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
    color: #808090;
  }

  .owned-count.enough {
    color: #4caf50;
  }

  .item-icon-small.silhouette {
    filter: brightness(0);
    opacity: 0.5;
  }

  .deadline {
    color: #a0a0b0;
  }

  .quest-rewards {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.1rem 0.3rem;
    font-size: 0.6rem;
  }

  .quest-bottom-row {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-bottom: 0.1rem;
    font-size: 0.6rem;
  }

  .detail-label {
    color: #808090;
    font-size: 0.55rem;
  }

  .reward-money {
    color: #c9a959;
    font-weight: bold;
    font-size: 0.65rem;
  }

  .reward-rep {
    color: #81c784;
  }

  .reward-dev {
    color: #64b5f6;
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

  .badge-recipe-unknown {
    padding: 0.08rem 0.2rem;
    background: rgba(156, 39, 176, 0.2);
    border-radius: 3px;
    font-size: 0.5rem;
    line-height: 1.2;
    color: #ce93d8;
  }

  .badge-material-short {
    padding: 0.08rem 0.2rem;
    background: rgba(255, 152, 0, 0.2);
    border-radius: 3px;
    font-size: 0.5rem;
    line-height: 1.2;
    color: #ffb74d;
  }

  @keyframes badge-pulse {
    0%, 100% { box-shadow: 0 0 6px rgba(38, 198, 218, 0.5); }
    50% { box-shadow: 0 0 14px rgba(38, 198, 218, 0.9); }
  }

  .quest-actions {
    display: flex;
    gap: 0.2rem;
    margin-top: 0.1rem;
  }

  .accept-btn {
    flex: 1;
    padding: 0.3rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 6px;
    color: #1a1a2e;
    font-weight: bold;
    font-size: 0.7rem;
    cursor: pointer;
  }

  .accept-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .accept-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .instant-deliver-btn {
    flex: 1;
    padding: 0.3rem;
    background: linear-gradient(135deg, #1a6b3c 0%, #2ecc71 100%);
    border: none;
    border-radius: 6px;
    color: #fff;
    font-weight: bold;
    font-size: 0.7rem;
    cursor: pointer;
  }

  .instant-deliver-btn:hover {
    transform: translateY(-1px);
  }
</style>
