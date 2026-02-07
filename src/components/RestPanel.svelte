<script lang="ts">
  import { gameState, addMessage, restoreStamina } from '$lib/stores/game';
  import { endTurn } from '$lib/services/gameLoop';

  export let onBack: () => void;

  function handleRest() {
    restoreStamina(100);
    addMessage('休息しました。体力が全回復しました。');
    endTurn(1);
    onBack();
  }
</script>

<div class="rest-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>😴 休息</h2>
  <p>体力を全回復します。1日経過します。</p>
  <p class="current-stamina">
    現在の体力: {$gameState.stamina} / {$gameState.maxStamina}
  </p>
  <button class="action-btn" on:click={handleRest}>
    休息する
  </button>
</div>

<style>
  .rest-panel {
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

  p {
    color: #e0e0f0;
  }

  .current-stamina {
    color: #c0c0d0;
    margin: 1rem 0;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .action-btn {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 6px;
    color: #1a1a2e;
    font-weight: bold;
    cursor: pointer;
    margin-top: 1rem;
  }

  .action-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(201, 169, 89, 0.4);
  }
</style>
