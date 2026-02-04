<script lang="ts">
  import { gameState } from '$lib/stores/game';

  interface ChangeItem {
    id: number;
    amount: number;
  }

  let changes: ChangeItem[] = [];
  let previousMoney = 0;
  let nextId = 0;

  // 所持金の変更を監視
  $: {
    const currentMoney = $gameState.money;
    if (previousMoney > 0 && currentMoney !== previousMoney) {
      const diff = currentMoney - previousMoney;
      addChange(diff);
    }
    previousMoney = currentMoney;
  }

  function addChange(amount: number) {
    const id = nextId++;
    changes = [...changes, { id, amount }];

    // 2秒後に削除
    setTimeout(() => {
      changes = changes.filter(c => c.id !== id);
    }, 2000);
  }
</script>

<div class="money-indicator">
  {#each changes as change (change.id)}
    <div
      class="change-item"
      class:positive={change.amount > 0}
      class:negative={change.amount < 0}
    >
      {change.amount > 0 ? '+' : ''}{change.amount.toLocaleString()} G
    </div>
  {/each}
</div>

<style>
  .money-indicator {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
    z-index: 100;
  }

  .change-item {
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: bold;
    white-space: nowrap;
    animation: floatUp 2s ease-out forwards;
  }

  .change-item.positive {
    color: #4caf50;
    background: rgba(76, 175, 80, 0.2);
  }

  .change-item.negative {
    color: #f44336;
    background: rgba(244, 67, 54, 0.2);
  }

  @keyframes floatUp {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(-30px);
    }
  }
</style>
