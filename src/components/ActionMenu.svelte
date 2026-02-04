<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { showingUnlockActions, pendingUnlockActions } from '$lib/stores/toast';
  import type { ActionType } from '$lib/models/types';

  export let onSelect: (action: ActionType) => void;

  const actions: { type: ActionType; label: string; icon: string; description: string }[] = [
    { type: 'alchemy', label: '調合', icon: '⚗️', description: 'アイテムを調合する' },
    { type: 'quest', label: '依頼', icon: '📜', description: '依頼の確認・受注・納品' },
    { type: 'expedition', label: '採取', icon: '🏕️', description: '採取隊を派遣する' },
    { type: 'shop', label: 'ショップ', icon: '🏪', description: 'アイテムの売買' },
    { type: 'inventory', label: '所持品', icon: '📦', description: '持ち物を確認する' },
    { type: 'rest', label: '休息', icon: '😴', description: '体力を回復する (1日)' },
    { type: 'study', label: '勉強', icon: '📚', description: '新しいレシピを習得' },
  ];

  // 常に利用可能なアクション
  const alwaysAvailable: ActionType[] = ['rest', 'study', 'inventory'];

  // 日付演出中かどうか
  $: isDayTransition = $gameState.pendingDayTransition !== null;

  // 各アクションのロック状態をリアクティブに計算
  // ストアを直接参照することでSvelteがすべての依存関係を追跡
  $: actionStates = actions.map(action => {
    const actionType = action.type;
    const tutorialActive = $gameState.tutorialProgress.isActive;
    const unlockedActions = $gameState.tutorialProgress.unlockedActions;
    const dayTransition = $gameState.pendingDayTransition;
    const pendingDialogue = $gameState.tutorialProgress.pendingDialogue;
    const pending = $pendingUnlockActions;

    // ロック判定
    let isLocked = false;
    if (!alwaysAvailable.includes(actionType)) {
      if (tutorialActive) {
        // 日付演出中またはダイアログ表示中は、pendingのアクションもロック表示
        // （ダイアログが閉じるまでアンロック演出を見せない）
        if ((dayTransition !== null || pendingDialogue !== null) && pending.includes(actionType)) {
          isLocked = true;
        } else if (!unlockedActions.includes(actionType)) {
          isLocked = true;
        }
      }
    }

    // 新規アンロック判定
    const isNewlyUnlocked = $showingUnlockActions.has(actionType);

    return { ...action, isLocked, isNewlyUnlocked };
  });

  // デバッグ用: 状態変化をログ出力
  $: if (typeof window !== 'undefined') {
    console.log('[ActionMenu] State update:', {
      isDayTransition,
      hasPendingDialogue: $gameState.tutorialProgress.pendingDialogue !== null,
      pendingUnlockActions: $pendingUnlockActions,
      unlockedActions: $gameState.tutorialProgress.unlockedActions,
      actionStates: actionStates.map(a => ({ type: a.type, isLocked: a.isLocked }))
    });
  }
</script>

<div class="action-menu">
  <h3>行動を選択してください</h3>
  <div class="actions">
    {#each actionStates as action}
      {#if action.isLocked}
        <!-- ロック中：鍵マークのみ表示 -->
        <div class="action-btn locked">
          <span class="lock-icon">🔒</span>
          <span class="lock-label">???</span>
        </div>
      {:else}
        <!-- アンロック済み -->
        <button
          class="action-btn"
          class:newly-unlocked={action.isNewlyUnlocked}
          on:click={() => onSelect(action.type)}
          disabled={action.type === 'expedition' && $gameState.expedition !== null}
        >
          <span class="icon">{action.icon}</span>
          <span class="label">{action.label}</span>
          <span class="description">{action.description}</span>
          {#if action.type === 'expedition' && $gameState.expedition !== null}
            <span class="badge">派遣中</span>
          {/if}
        </button>
      {/if}
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
    justify-content: center;
    gap: 0.5rem;
    padding: 1.25rem;
    min-height: 120px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #4a4a6a;
    border-radius: 8px;
    color: #e0e0f0;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .action-btn:hover:not(:disabled):not(.locked) {
    background: rgba(201, 169, 89, 0.15);
    border-color: #c9a959;
    transform: translateY(-2px);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ロック中のスタイル */
  .action-btn.locked {
    background: rgba(0, 0, 0, 0.3);
    border: 2px dashed #3a3a5a;
    cursor: not-allowed;
  }

  .lock-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  .lock-label {
    font-size: 1rem;
    color: #606080;
    font-weight: bold;
  }

  /* 新しくアンロックされた時のアニメーション */
  .action-btn.newly-unlocked {
    animation: unlockPulse 2s ease-out;
  }

  @keyframes unlockPulse {
    0% {
      box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
      border-color: #4caf50;
      background: rgba(76, 175, 80, 0.2);
    }
    50% {
      box-shadow: 0 0 20px 10px rgba(76, 175, 80, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
      border-color: #4a4a6a;
      background: rgba(255, 255, 255, 0.05);
    }
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
    text-align: center;
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
</style>
