<script lang="ts">
  import { gameState, daysRemaining, expForNextLevel, alchemyLevel, villageLevel, reputationLevel, totalScore } from '$lib/stores/game';
  import { calcExpForLevel, calcExpProgress } from '$lib/data/balance';
  import MoneyIndicator from './MoneyIndicator.svelte';
  import ConfigDialog from './ConfigDialog.svelte';
  import ProgressDial from './common/ProgressDial.svelte';

  export let onScoreClick: (() => void) | undefined = undefined;
  export let showSubRow: boolean = true;

  let showConfig = false;

  $: staminaRatio = $gameState.stamina / $gameState.maxStamina;
  $: staminaClass = staminaRatio <= 0.2 ? 'critical' : staminaRatio <= 0.5 ? 'low' : '';

  $: alchemyExpPct = Math.min(100, (calcExpProgress($gameState.alchemyExp) / $expForNextLevel) * 100);
  $: reputationExpPct = Math.min(100, (calcExpProgress($gameState.reputationExp) / calcExpForLevel($reputationLevel)) * 100);
  $: villageExpPct = Math.min(100, (calcExpProgress($gameState.villageExp) / calcExpForLevel($villageLevel)) * 100);
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
      <div class="stacked">
        <span class="day-display">{$gameState.day}日目</span>
        <span class="remaining">残り{$daysRemaining}日</span>
      </div>
    </div>

    <div class="hud-section money-section">
      <span class="money-value">{$gameState.money.toLocaleString()} G</span>
      <MoneyIndicator />
    </div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="hud-section score-section" class:clickable={!!onScoreClick} on:click={onScoreClick} role={onScoreClick ? 'button' : undefined} tabindex={onScoreClick ? 0 : undefined}>
      <div class="stacked">
        <span class="score-label">スコア</span>
        <span class="score-value">☆{$totalScore.toLocaleString()}</span>
      </div>
    </div>

    <div class="hud-section character-section">
      <div class="stat-item stamina {staminaClass}">
        <div class="stat-header">
          <span class="stat-label">体力</span>
          <span class="stat-value">{$gameState.stamina}/{$gameState.maxStamina}</span>
        </div>
        <div class="stamina-bar">
          <div class="stamina-fill" style="width: {staminaRatio * 100}%"></div>
        </div>
      </div>
    </div>
  </div>

  {#if showSubRow}
    <div class="hud-row sub-row">
      <ProgressDial value={alchemyExpPct} label="錬金術" level={$alchemyLevel} color="#64b5f6" size={160} />
      <ProgressDial value={reputationExpPct} label="名声" level={$reputationLevel} color="#ffd700" size={160} />
      <ProgressDial value={villageExpPct} label="村発展" level={$villageLevel} color="#81c784" size={160} />
    </div>
  {/if}

</div>

{#if showConfig}
  <ConfigDialog on:close={() => showConfig = false} />
{/if}

<style>
  .hud {
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #2c1810 0%, #4a2c17 100%);
    border-bottom: 3px solid var(--accent-gold-dark);
    color: var(--text-heading);
  }

  .hud-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 1rem;
    padding: 0.4rem 0.75rem;
  }

  .hud-section {
    display: flex;
    align-items: center;
    gap: 0.35rem;
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

  .stacked {
    display: flex;
    flex-direction: column;
  }

  .time-section .stacked {
    line-height: 1.3;
  }

  .time-section .day-display {
    font-size: 1.3rem;
    font-weight: bold;
  }

  .time-section .remaining {
    font-size: 0.8rem;
    color: #a89060;
  }

  .score-section .stacked {
    line-height: 1.05;
  }

  .money-section {
    position: relative;
    min-width: 5.5rem;
    justify-content: flex-end;
  }

  .money-section .money-value {
    font-size: 1.3rem;
    font-weight: bold;
    color: var(--accent-yellow);
    text-align: right;
  }

  .score-section.clickable {
    cursor: pointer;
    border-radius: 4px;
    padding: 0.15rem 0.3rem;
    transition: background-color 0.2s ease;
  }

  .score-section.clickable:hover {
    background-color: rgba(240, 192, 64, 0.1);
  }

  .score-section {
    min-width: 4.5rem;
  }

  .score-section .stacked {
    align-items: flex-end;
  }

  .score-value {
    font-size: 1.2rem;
    font-weight: bold;
    color: #f0c040;
  }

  .score-label {
    font-size: 0.6rem;
    color: #a89060;
  }

  .sub-row {
    justify-content: center;
    gap: 1.5rem;
    padding: 0.25rem 0.75rem 0.4rem;
    border-top: 1px solid rgba(139, 105, 20, 0.3);
  }

  .character-section {
    display: flex;
    flex: 1;
    padding-left: 0.75rem;
    border-left: 1px solid rgba(139, 105, 20, 0.5);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
    flex: 1;
    min-width: 0;
  }

  .stat-header {
    display: flex;
    align-items: baseline;
    gap: 0.3rem;
  }

  .stat-label {
    font-size: 0.85rem;
    color: var(--accent-gold);
  }

  .stat-value {
    font-size: 1.05rem;
    font-weight: bold;
  }

  .stamina-bar {
    width: 100%;
    height: 5px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
    overflow: hidden;
    position: relative;
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
    .character-section {
      padding-left: 0.5rem;
    }
  }
</style>
