<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { setSelectedQuestId } from '$lib/stores/quests';
  import { showingUnlockActions, pendingUnlockActions } from '$lib/stores/toast';
  import { isMerchantVisiting } from '$lib/services/calendar';
  import ObjectivesSection from './ObjectivesSection.svelte';
  import type { ActionType, ActiveQuest } from '$lib/models/types';

  export let onSelect: (action: ActionType) => void;

  function handleQuestClick(quest: ActiveQuest) {
    setSelectedQuestId(quest.id);
    onSelect('quest');
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

  $: isDayTransition = $gameState.pendingDayTransition !== null;
  $: merchantInTown = isMerchantVisiting($gameState.day);

  $: actionStates = actions.map(action => {
    const actionType = action.type;
    const unlockedActions = $gameState.tutorialProgress.unlockedActions;
    const dayTransition = $gameState.pendingDayTransition;
    const pendingDialogue = $gameState.tutorialProgress.pendingDialogue;
    const pending = $pendingUnlockActions;

    let isLocked = false;
    if ((dayTransition !== null || pendingDialogue !== null) && pending.includes(actionType)) {
      isLocked = true;
    } else if (!unlockedActions.includes(actionType)) {
      isLocked = true;
    }

    const isNewlyUnlocked = $showingUnlockActions.has(actionType);

    return { ...action, isLocked, isNewlyUnlocked };
  });

</script>

<div class="action-menu">
  <h3>行動を選択してください</h3>

  {#if merchantInTown}
    <div class="special-actions">
      <button
        class="action-btn merchant-btn"
        on:click={() => onSelect('traveling_merchant')}
      >
        <img class="icon" src="/images/characters/marco/marco-face-smug.png" alt="マルコ" />
        <span class="label">旅商人マルコ</span>
        <span class="description">マルコの行商を覗く</span>
        <span class="badge merchant">来訪中</span>
      </button>
    </div>
  {/if}

  <div class="actions">
    {#each actionStates as action}
      {#if action.isLocked}
        <div class="action-btn locked">
          <img class="lock-icon" src="/icons/actions/locked.png" alt="ロック中" />
          <span class="lock-label">???</span>
        </div>
      {:else}
        <button
          class="action-btn"
          class:newly-unlocked={action.isNewlyUnlocked}
          on:click={() => onSelect(action.type)}
          disabled={action.type === 'expedition' && $gameState.expedition !== null}
          style="background-image: url({getActionBanner(action.type)})"
        >
          <span class="label">{action.label}</span>
          <span class="description">{action.description}</span>
          {#if action.type === 'expedition' && $gameState.expedition !== null}
            <span class="badge">派遣中</span>
          {:else if action.type === 'quest' && $gameState.newQuestCount > 0}
            <span class="badge new-quest">{$gameState.newQuestCount}件</span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>

  <ObjectivesSection onQuestClick={handleQuestClick} />
</div>

<style>
  .action-menu {
    padding: 1.5rem;
  }

  h3 {
    color: #c9a959;
    font-size: 1.1rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 0;
    padding: 0.4rem 0.5rem;
    min-height: 120px;
    background-size: cover;
    background-position: center;
    border: 2px solid #4a4a6a;
    border-radius: 8px;
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
       2px  0   0 rgba(20, 20, 40, 0.95);
  }

  .description {
    font-size: 0.7rem;
    line-height: 1.2;
    color: #ddd;
    text-shadow:
      -1px -1px 0 rgba(20, 20, 40, 0.95),
       1px -1px 0 rgba(20, 20, 40, 0.95),
      -1px  1px 0 rgba(20, 20, 40, 0.95),
       1px  1px 0 rgba(20, 20, 40, 0.95),
       0   -1px 0 rgba(20, 20, 40, 0.95),
       0    1px 0 rgba(20, 20, 40, 0.95),
      -1px  0   0 rgba(20, 20, 40, 0.95),
       1px  0   0 rgba(20, 20, 40, 0.95);
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

  .badge.new-quest {
    background: #2196f3;
    color: white;
    animation: badgePulse 2s ease-in-out infinite;
  }

  .badge.merchant {
    background: #ff9800;
  }

  @keyframes badgePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .special-actions {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(201, 169, 89, 0.3);
  }

  .merchant-btn {
    width: 100%;
    flex-direction: row;
    min-height: auto;
    padding: 1rem 1.25rem;
    border-color: #ff9800 !important;
    animation: merchantPulse 3s ease-in-out infinite;
  }

  .merchant-btn .icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }

  .merchant-btn .label {
    font-size: 1.1rem;
  }

  .merchant-btn .description {
    text-align: left;
  }

  @keyframes merchantPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 152, 0, 0); }
    50% { box-shadow: 0 0 15px 3px rgba(255, 152, 0, 0.3); }
  }
</style>
