<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import type { ActionType } from '$lib/models/types';

  export let onSelect: (action: ActionType) => void;

  const actions: { type: ActionType; label: string; icon: string; description: string; unlockHint: string }[] = [
    { type: 'alchemy', label: '調合', icon: '⚗️', description: 'アイテムを調合する', unlockHint: 'レシピを習得すると解放' },
    { type: 'quest', label: '依頼', icon: '📜', description: '依頼の確認・受注・納品', unlockHint: 'アイテムを調合すると解放' },
    { type: 'expedition', label: '採取', icon: '🏕️', description: '採取隊を派遣する', unlockHint: '依頼を完了すると解放' },
    { type: 'shop', label: 'ショップ', icon: '🏪', description: 'アイテムの売買', unlockHint: '依頼を受注すると解放' },
    { type: 'inventory', label: '所持品', icon: '📦', description: '持ち物を確認する', unlockHint: '' },
    { type: 'rest', label: '休息', icon: '😴', description: '体力を回復する (1日)', unlockHint: '' },
    { type: 'study', label: '勉強', icon: '📚', description: '新しいレシピを習得', unlockHint: '' },
  ];

  $: unlockedActions = $gameState.tutorialProgress.unlockedActions;
  $: isTutorialActive = $gameState.tutorialProgress.isActive;

  // 常に利用可能なアクション
  const alwaysAvailable: ActionType[] = ['rest', 'study', 'inventory'];

  function isLocked(actionType: ActionType): boolean {
    if (alwaysAvailable.includes(actionType)) return false;
    return isTutorialActive && !unlockedActions.includes(actionType);
  }
</script>

<div class="action-menu">
  <h3>行動を選択してください</h3>
  <div class="actions">
    {#each actions as action}
      <button
        class="action-btn"
        class:locked={isLocked(action.type)}
        on:click={() => onSelect(action.type)}
        disabled={isLocked(action.type) || (action.type === 'expedition' && $gameState.expedition !== null)}
      >
        <span class="icon">{action.icon}</span>
        <span class="label">{action.label}</span>
        {#if isLocked(action.type) && action.unlockHint}
          <span class="description unlock-hint">{action.unlockHint}</span>
        {:else}
          <span class="description">{action.description}</span>
        {/if}
        {#if isLocked(action.type)}
          <span class="lock-badge">🔒</span>
        {:else if action.type === 'expedition' && $gameState.expedition !== null}
          <span class="badge">派遣中</span>
        {/if}
      </button>
    {/each}
  </div>
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
    gap: 0.5rem;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #4a4a6a;
    border-radius: 8px;
    color: #e0e0f0;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .action-btn:hover:not(:disabled) {
    background: rgba(201, 169, 89, 0.15);
    border-color: #c9a959;
    transform: translateY(-2px);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn.locked {
    opacity: 0.4;
    filter: grayscale(0.5);
  }

  .icon {
    font-size: 2rem;
  }

  .label {
    font-size: 1.1rem;
    font-weight: bold;
  }

  .description {
    font-size: 0.8rem;
    color: #a0a0b0;
  }

  .unlock-hint {
    color: #ff9800;
    font-style: italic;
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

  .lock-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 1.2rem;
  }
</style>
