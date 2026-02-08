<script lang="ts">
  import { gameState, addMessage, restoreStamina } from '$lib/stores/game';
  import { endTurn } from '$lib/services/gameLoop';
  import { getFatigueLabel } from '$lib/services/alchemy';

  export let onBack: () => void;

  $: fatigueLabel = getFatigueLabel($gameState.stamina);
  $: staminaPercent = Math.round(($gameState.stamina / $gameState.maxStamina) * 100);
  $: isFullStamina = $gameState.stamina >= $gameState.maxStamina;

  function handleRest() {
    restoreStamina(100);
    addMessage('休息しました。体力が全回復しました。');
    // 先にendTurn → DayTransitionが上から被さる
    endTurn(1);
    // DayTransitionの暗転(0.3s)後に画面を切り替え
    setTimeout(() => {
      onBack();
    }, 350);
  }
</script>

<div class="rest-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>😴 休息</h2>
  <p>体力を全回復します。1日経過します。</p>
  <div class="stamina-display">
    <div class="stamina-header">
      <span>現在の体力: {$gameState.stamina} / {$gameState.maxStamina}</span>
      {#if fatigueLabel}
        <span class="fatigue-badge">{fatigueLabel}</span>
      {/if}
    </div>
    <div class="stamina-bar-container">
      <div
        class="stamina-bar"
        class:high={staminaPercent >= 50}
        class:medium={staminaPercent >= 30 && staminaPercent < 50}
        class:low={staminaPercent >= 10 && staminaPercent < 30}
        class:critical={staminaPercent < 10}
        style="width: {staminaPercent}%"
      ></div>
    </div>
    {#if fatigueLabel}
      <p class="fatigue-note">疲労状態では調合の成功率が低下します。</p>
    {/if}
  </div>
  <button class="action-btn" on:click={handleRest} disabled={isFullStamina}>
    {isFullStamina ? '体力は満タンです' : '休息する'}
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

  .stamina-display {
    margin: 1rem 0;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .stamina-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #c0c0d0;
    margin-bottom: 0.5rem;
  }

  .fatigue-badge {
    padding: 0.15rem 0.5rem;
    background: rgba(255, 107, 107, 0.2);
    border: 1px solid rgba(255, 107, 107, 0.5);
    border-radius: 4px;
    color: #ff6b6b;
    font-size: 0.8rem;
    font-weight: bold;
  }

  .stamina-bar-container {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .stamina-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .stamina-bar.high {
    background: linear-gradient(90deg, #4caf50, #81c784);
  }

  .stamina-bar.medium {
    background: linear-gradient(90deg, #ff9800, #ffc107);
  }

  .stamina-bar.low {
    background: linear-gradient(90deg, #ff5722, #ff9800);
  }

  .stamina-bar.critical {
    background: linear-gradient(90deg, #f44336, #ff5722);
  }

  .fatigue-note {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: #ff9800;
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

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.1);
    color: #808090;
  }
</style>
