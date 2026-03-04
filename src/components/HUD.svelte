<script lang="ts">
  import { gameState, daysRemaining, expForNextLevel, alchemyLevel, villageLevel, reputationLevel, totalScore } from '$lib/stores/game';
  import { calcExpForLevel, calcExpProgress } from '$lib/data/balance';
  import MoneyIndicator from './MoneyIndicator.svelte';
  import ConfigDialog from './ConfigDialog.svelte';

  export let onScoreClick: (() => void) | undefined = undefined;

  let showConfig = false;

  $: staminaRatio = $gameState.stamina / $gameState.maxStamina;
  $: staminaClass = staminaRatio <= 0.2 ? 'critical' : staminaRatio <= 0.5 ? 'low' : '';
</script>

<div class="hud">
  <div class="hud-row main-row">
    <div class="hud-section config-section">
      <button class="config-btn" on:click={() => showConfig = true} title="設定">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/>
        </svg>
      </button>
    </div>

    <div class="hud-section time-section">
      <div class="section-icon">📅</div>
      <div class="section-content">
        <span class="day-display">{$gameState.day}日目</span>
        <span class="remaining">残り {$daysRemaining}日</span>
      </div>
    </div>

    <div class="hud-section money-section">
      <div class="section-icon">💰</div>
      <div class="section-content">
        <span class="money-value">{$gameState.money.toLocaleString()} G</span>
        <MoneyIndicator />
      </div>
    </div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="hud-section score-section" class:clickable={!!onScoreClick} on:click={onScoreClick} role={onScoreClick ? 'button' : undefined} tabindex={onScoreClick ? 0 : undefined}>
      <div class="section-content">
        <span class="score-label">スコア</span>
        <span class="score-value">☆{$totalScore.toLocaleString()}</span>
      </div>
    </div>

    <div class="hud-section stats-section">
      <div class="stat-item">
        <span class="stat-label">錬金術</span>
        <div class="stat-value-row">
          <span class="stat-value">Lv.{$alchemyLevel}</span>
        </div>
        <div class="exp-bar">
          <div class="exp-fill" style="width: {Math.min(100, (calcExpProgress($gameState.alchemyExp) / $expForNextLevel) * 100)}%"></div>
        </div>
      </div>
      <div class="stat-item">
        <span class="stat-label">名声</span>
        <div class="stat-value-row">
          <span class="stat-value reputation">Lv.{$reputationLevel}</span>
        </div>
        <div class="exp-bar">
          <div class="exp-fill reputation-fill" style="width: {Math.min(100, (calcExpProgress($gameState.reputationExp) / calcExpForLevel($reputationLevel)) * 100)}%"></div>
        </div>
      </div>
      <div class="stat-item">
        <span class="stat-label">村発展</span>
        <div class="stat-value-row">
          <span class="stat-value village">Lv.{$villageLevel}</span>
        </div>
        <div class="exp-bar">
          <div class="exp-fill village-fill" style="width: {Math.min(100, (calcExpProgress($gameState.villageExp) / calcExpForLevel($villageLevel)) * 100)}%"></div>
        </div>
      </div>
    </div>

    <div class="hud-section character-section">
      <div class="stat-item stamina {staminaClass}">
        <span class="stat-label">体力</span>
        <span class="stat-value">{$gameState.stamina}/{$gameState.maxStamina}</span>
        <div class="stamina-bar">
          <div class="stamina-fill" style="width: {staminaRatio * 100}%"></div>
        </div>
      </div>
    </div>
  </div>

</div>

{#if showConfig}
  <ConfigDialog on:close={() => showConfig = false} />
{/if}

<style>
  .hud {
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #2c1810 0%, #4a2c17 100%);
    border-bottom: 3px solid #8b6914;
    color: #f4e4bc;
  }

  .hud-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
  }

  .main-row {
    gap: 1rem;
  }

  .hud-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .config-section {
    margin-left: auto;
    order: 999;
  }

  .config-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid rgba(160, 128, 96, 0.4);
    border-radius: 4px;
    color: #a08060;
    cursor: pointer;
    padding: 0.25rem;
    transition: color 0.2s, border-color 0.2s, background-color 0.2s;
  }

  .config-btn:hover {
    color: #c9a959;
    border-color: rgba(201, 169, 89, 0.6);
    background-color: rgba(201, 169, 89, 0.1);
  }

  .section-icon {
    font-size: 1rem;
    opacity: 0.9;
  }

  .section-content {
    display: flex;
    flex-direction: column;
  }

  .time-section .day-display {
    font-size: 1.1rem;
    font-weight: bold;
  }

  .time-section .remaining {
    font-size: 0.75rem;
    color: #a89060;
  }

  .money-section .section-content {
    position: relative;
  }

  .money-section .money-value {
    font-size: 1.1rem;
    font-weight: bold;
    color: #ffd700;
  }

  .score-section .section-content {
    display: flex;
    flex-direction: column;
  }

  .score-section.clickable {
    cursor: pointer;
    border-radius: 4px;
    padding: 0.2rem 0.4rem;
    transition: background-color 0.2s ease;
  }

  .score-section.clickable:hover {
    background-color: rgba(240, 192, 64, 0.1);
  }

  .score-value {
    font-size: 1.1rem;
    font-weight: bold;
    color: #f0c040;
  }

  .score-label {
    font-size: 0.7rem;
    color: #a89060;
  }

  .stats-section,
  .character-section {
    display: flex;
    gap: 1rem;
    padding-left: 0.75rem;
    border-left: 1px solid rgba(139, 105, 20, 0.5);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
    min-width: 4rem;
  }

  .stat-label {
    font-size: 0.7rem;
    color: #c9a959;
  }

  .stat-value {
    font-size: 0.95rem;
    font-weight: bold;
  }

  .stat-value.village {
    color: #81c784;
  }

  .stat-value-row {
    display: flex;
    align-items: baseline;
    gap: 0.3rem;
  }

  .exp-bar,
  .stamina-bar {
    width: 65px;
    height: 4px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
  }

  .exp-fill {
    height: 100%;
    background: linear-gradient(90deg, #6a5acd, #9370db);
    transition: width 0.3s ease;
  }

  .exp-fill.village-fill {
    background: linear-gradient(90deg, #388e3c, #81c784);
  }

  .exp-fill.reputation-fill {
    background: linear-gradient(90deg, #c9a959, #e0c080);
  }

  .stat-value.reputation {
    color: #e0c080;
  }

  .stamina-fill {
    height: 100%;
    background: linear-gradient(90deg, #4caf50, #81c784);
    transition: width 0.3s ease, background 0.3s ease;
  }

  .stamina.low .stat-value {
    color: #ffa726;
  }

  .stamina.low .stamina-fill {
    background: linear-gradient(90deg, #e65100, #ffa726);
  }

  .stamina.critical .stat-value {
    color: #ef5350;
    animation: blink 1s ease-in-out infinite;
  }

  .stamina.critical .stamina-fill {
    background: linear-gradient(90deg, #c62828, #ef5350);
    animation: blink 1s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @media (max-width: 600px) {
    .hud-row {
      padding: 0.4rem 0.75rem;
    }

    .stats-section,
    .character-section {
      padding-left: 0.5rem;
      gap: 0.75rem;
    }

    .exp-bar,
    .stamina-bar {
      width: 40px;
    }
  }
</style>
