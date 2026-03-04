<script lang="ts">
  import { gameState, pendingAlchemyRecipeId } from '$lib/stores/game';
  import { setSelectedQuestId } from '$lib/stores/quests';
  import { showingUnlockActions } from '$lib/stores/toast';
  import { isMerchantVisiting, getDayOfMonth } from '$lib/services/calendar';
  import { MERCHANT } from '$lib/data/balance';
  import { getNextInspection, INSPECTION_DAYS } from '$lib/data/inspection';
  import { recipes } from '$lib/data/recipes';
  import InspectionTracker from './InspectionTracker.svelte';
  import ObjectivesSection from './ObjectivesSection.svelte';
  import type { ActionType, ActiveQuest, QuestDef } from '$lib/models/types';

  export let onSelect: (action: ActionType) => void;

  function canDeliverQuest(quest: ActiveQuest): boolean {
    const remaining = quest.requiredQuantity - quest.deliveredCount;
    const matchingItems = $gameState.inventory.filter((item) => {
      if (item.itemId !== quest.requiredItemId) return false;
      if (quest.requiredQuality && item.quality < quest.requiredQuality) return false;
      return true;
    });
    return matchingItems.length >= remaining;
  }

  function canInstantDeliver(quest: QuestDef): boolean {
    const matchingItems = $gameState.inventory.filter((item) => {
      if (item.itemId !== quest.requiredItemId) return false;
      if (quest.requiredQuality && item.quality < quest.requiredQuality) return false;
      return true;
    });
    return matchingItems.length >= quest.requiredQuantity;
  }

  function findRecipeForItem(itemId: string): string | null {
    const recipe = Object.values(recipes).find(
      (r) => r.resultItemId === itemId && $gameState.knownRecipes.includes(r.id)
    );
    return recipe?.id ?? null;
  }

  function handleQuestClick(quest: ActiveQuest) {
    if (canDeliverQuest(quest)) {
      // 納品可能 → 依頼パネルへ
      setSelectedQuestId(quest.id);
      onSelect('quest');
    } else {
      // 納品不可 → 調合パネルへジャンプ（レシピがあれば）
      const recipeId = findRecipeForItem(quest.requiredItemId);
      if (recipeId && $gameState.tutorialProgress.unlockedActions.includes('alchemy')) {
        pendingAlchemyRecipeId.set(recipeId);
        onSelect('alchemy');
      } else {
        // レシピ未習得 or 調合未解放 → 従来通り依頼パネルへ
        setSelectedQuestId(quest.id);
        onSelect('quest');
      }
    }
  }

  const actions: { type: ActionType; label: string; description: string }[] = [
    { type: 'alchemy', label: '調合', description: 'アイテムを調合する' },
    { type: 'quest', label: '依頼', description: '依頼の確認・受注・納品' },
    { type: 'expedition', label: '採取', description: '採取隊を派遣する' },
    { type: 'shop', label: 'ショップ', description: 'アイテムの売買' },
    { type: 'inventory', label: '所持品', description: '持ち物を確認する' },
    { type: 'rest', label: '休息', description: '体力を回復する (1日)' },
    { type: 'study', label: '勉強', description: '新しいレシピを習得' },
    { type: 'album', label: 'アルバム', description: 'アイテム図鑑' },
  ];

  function getActionBanner(type: ActionType): string {
    return `/images/actions/${type}.png`;
  }

  $: merchantInTown = isMerchantVisiting($gameState.day);
  $: merchantDaysLeft = MERCHANT.VISIT_END_DAY - getDayOfMonth($gameState.day) + 1;

  // 査察トラッカー用データ
  $: inspectionKnown = $gameState.achievementProgress.completed.includes('ach_q1_goal_reminder');
  let inspectionRevealDone = false;
  let inspectionFirstReveal = false;
  $: if (inspectionKnown && !inspectionRevealDone) {
    inspectionFirstReveal = true;
    inspectionRevealDone = true;
  }
  $: nextInspection = getNextInspection($gameState.day);
  $: nextInspectionDay = INSPECTION_DAYS.find((d) => d >= $gameState.day) ?? null;
  $: daysUntilInspection = nextInspectionDay !== null ? nextInspectionDay - $gameState.day : null;
  $: inspectionValues = nextInspection
    ? Object.fromEntries(nextInspection.criteria.map(c => [c.key, c.getValue($gameState)]))
    : {};
  $: inspectionExpValues = nextInspection
    ? Object.fromEntries(nextInspection.criteria.filter(c => c.getExpValue).map(c => [c.key, c.getExpValue!($gameState)]))
    : {};

  $: hasDeliverableQuest = $gameState.activeQuests.some(q => canDeliverQuest(q));
  $: shopUnlocked = $gameState.tutorialProgress.unlockedActions.includes('shop');
  $: hasInstantDeliverableQuest = shopUnlocked && $gameState.availableQuests.some(q => canInstantDeliver(q));
  $: availableQuestCount = $gameState.availableQuests.length;

  $: actionStates = actions.map(action => {
    const unlockedActions = $gameState.tutorialProgress.unlockedActions;
    const isLocked = !unlockedActions.includes(action.type);
    const isNewlyUnlocked = $showingUnlockActions.has(action.type);
    return { ...action, isLocked, isNewlyUnlocked };
  });

</script>

<div class="action-menu">
  {#if inspectionKnown && nextInspection && daysUntilInspection !== null}
    <InspectionTracker inspection={nextInspection} values={inspectionValues} expValues={inspectionExpValues} daysUntil={daysUntilInspection} firstReveal={inspectionFirstReveal} />
  {/if}

  <div class="actions-bottom">
    <ObjectivesSection onQuestClick={handleQuestClick} questsFirst={true} />

    {#if merchantInTown}
      <div class="special-actions">
        <button
          class="action-btn merchant-btn"
          on:click={() => onSelect('traveling_merchant')}
        >
          <img class="icon" src="/images/characters/marco/marco-face-smug.png" alt="マルコ" />
          <div class="merchant-info">
            <span class="label">旅商人マルコ <span class="merchant-days">あと{merchantDaysLeft}日</span></span>
            <span class="description">マルコの行商を覗く</span>
          </div>
        </button>
      </div>
    {/if}

    <div class="actions">
      {#each actionStates as action}
        {#if action.isLocked}
          <div class="action-wrapper">
          <button class="action-btn locked" disabled>
            <img class="lock-icon" src="/icons/actions/locked.png" alt="ロック中" />
            <span class="lock-label">???</span>
          </button>
          <span class="description">&nbsp;</span>
          </div>
        {:else}
          <div class="action-wrapper">
          <button
            class="action-btn"
            class:newly-unlocked={action.isNewlyUnlocked}
            on:click={() => onSelect(action.type)}
            disabled={action.type === 'expedition' && $gameState.expedition !== null}
            style="background-image: url({getActionBanner(action.type)})"
          >
            <span class="label">{action.label}</span>
            {#if action.type === 'expedition' && $gameState.expedition !== null}
              {@const returnDay = $gameState.expedition.startDay + $gameState.expedition.duration}
              {@const daysLeft = returnDay - $gameState.day}
              <span class="badge">あと{daysLeft}日</span>
            {:else if action.type === 'quest'}
              <div class="badge-stack">
                {#if hasDeliverableQuest}
                  <span class="badge deliverable">納品可能</span>
                {/if}
                {#if hasInstantDeliverableQuest}
                  <span class="badge instant-deliverable">即納品可</span>
                {/if}
                {#if !hasDeliverableQuest && !hasInstantDeliverableQuest && $gameState.newQuestCount > 0}
                  <span class="badge new-quest">{$gameState.newQuestCount}件</span>
                {:else if !hasDeliverableQuest && !hasInstantDeliverableQuest && availableQuestCount > 0}
                  <span class="badge available-quest">{availableQuestCount}件</span>
                {/if}
              </div>
            {/if}
          </button>
          <span class="description">{action.description}</span>
          </div>
        {/if}
      {/each}
    </div>
  </div>
</div>

<style>
  .action-menu {
    padding: 1.5rem;
    padding-bottom: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .actions-bottom {
    margin-top: auto;
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 0.5rem;
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 0;
    padding: 0.4rem 0.5rem;
    min-height: 120px;
    background-color: #2a2a4a;
    background-size: cover;
    background-position: center;
    border: 2px solid #4a4a6a;
    border-radius: 8px;
    overflow: hidden;
    color: #e0e0f0;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .action-btn:hover:not(:disabled):not(.locked) {
    border-color: #c9a959;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn.locked {
    background: rgba(0, 0, 0, 0.3) !important;
    background-image: none !important;
    border: 2px dashed #3a3a5a;
    cursor: not-allowed;
    flex: 0 0 auto;
  }

  .lock-icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
    opacity: 0.5;
  }

  .lock-label {
    font-size: 1rem;
    color: #606080;
    font-weight: bold;
  }

  .action-btn.newly-unlocked {
    animation: unlockPulse 2s ease-out;
  }

  @keyframes unlockPulse {
    0% {
      box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
      border-color: #4caf50;
    }
    50% {
      box-shadow: 0 0 20px 10px rgba(76, 175, 80, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
      border-color: #4a4a6a;
    }
  }

  .label {
    font-size: 1.1rem;
    font-weight: bold;
    line-height: 1.2;
    color: #fff;
    text-shadow:
      -2px -2px 0 rgba(20, 20, 40, 0.95),
       2px -2px 0 rgba(20, 20, 40, 0.95),
      -2px  2px 0 rgba(20, 20, 40, 0.95),
       2px  2px 0 rgba(20, 20, 40, 0.95),
       0   -2px 0 rgba(20, 20, 40, 0.95),
       0    2px 0 rgba(20, 20, 40, 0.95),
      -2px  0   0 rgba(20, 20, 40, 0.95),
       2px  0   0 rgba(20, 20, 40, 0.95),
       3px  6px 10px rgba(0, 0, 0, 0.9),
       2px  4px 20px rgba(0, 0, 0, 0.6);
  }

  .action-wrapper {
    display: flex;
    flex-direction: column;
  }

  .action-wrapper > .action-btn {
    flex: 0 0 auto;
  }

  .description {
    font-size: 0.55rem;
    line-height: 1.2;
    color: #aaa;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
    padding: 0.15rem 0;
  }

  .badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.2rem 0.5rem;
    background: #ff9800;
    color: #1a1a2e;
    font-size: 0.7rem;
    font-weight: bold;
    border-radius: 4px;
  }

  .badge.deliverable {
    background: #4caf50;
    color: white;
    animation: badgePulse 2s ease-in-out infinite;
  }

  .badge.new-quest {
    background: #2196f3;
    color: white;
    animation: badgePulse 2s ease-in-out infinite;
  }

  .badge.instant-deliverable {
    background: #00acc1;
    color: white;
  }

  .badge.available-quest {
    background: #7e57c2;
    color: white;
  }

  .badge-stack {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    align-items: flex-end;
  }

  .badge-stack .badge {
    position: static;
  }

  .badge.merchant {
    background: #ff9800;
  }

  @keyframes badgePulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
    50% { transform: scale(1.1); box-shadow: 0 0 8px 2px rgba(255,255,255,0.3); }
  }

  .special-actions {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(201, 169, 89, 0.3);
  }

  .merchant-btn {
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 1rem;
    min-height: auto;
    padding: 1rem 1.25rem;
    border-color: #ff9800 !important;
    background-image: url(/images/actions/traveling_merchant.png) !important;
    background-size: cover;
    background-position: center;
    animation: merchantPulse 3s ease-in-out infinite;
  }

  .merchant-btn .icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .merchant-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }

  .merchant-btn .label {
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .merchant-days {
    font-size: 0.8rem;
    color: #fff;
    background: rgba(255, 152, 0, 0.4);
    border: 1px solid #ff9800;
    padding: 0.1rem 0.5rem;
    border-radius: 4px;
    font-weight: bold;
  }

  .merchant-btn .description {
    text-align: left;
    font-size: 0.8rem;
    opacity: 0.7;
  }

  @keyframes merchantPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0); }
    50% { box-shadow: 0 0 15px 3px rgba(255, 152, 0, 0.3); }
  }
</style>
