<script lang="ts">
  import { gameState, daysRemaining, expForNextLevel, alchemyLevel, villageLevel, reputationLevel, skipPresentation, toggleSkipPresentation } from '$lib/stores/game';
  import { calcExpForLevel, calcExpProgress, calcNextDrawLevel } from '$lib/data/balance';
  import MoneyIndicator from './MoneyIndicator.svelte';

  $: staminaRatio = $gameState.stamina / $gameState.maxStamina;
  $: staminaClass = staminaRatio <= 0.2 ? 'critical' : staminaRatio <= 0.5 ? 'low' : '';
</script>

<div class="hud">
  <div class="hud-row main-row">
    <div class="hud-section skip-section">
      <label class="skip-checkbox">
        <input
          type="checkbox"
          checked={$skipPresentation}
          on:change={toggleSkipPresentation}
        />
        <span>演出スキップ</span>
      </label>
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

    <div class="hud-section stats-section">
      <div class="stat-item">
        <span class="stat-label">村発展</span>
        <div class="stat-value-row">
          <span class="stat-value village">Lv.{$villageLevel}</span>
          {#if calcNextDrawLevel($villageLevel)}
            <span class="draw-target village"><img class="draw-icon" src="/icons/ui/draw_lightning.png" alt="⚡" />Lv.{calcNextDrawLevel($villageLevel)}</span>
          {/if}
        </div>
        <div class="exp-bar">
          <div class="exp-fill village-fill" style="width: {Math.min(100, (calcExpProgress($gameState.villageExp) / calcExpForLevel($villageLevel)) * 100)}%"></div>
        </div>
      </div>
      <div class="stat-item">
        <span class="stat-label">名声</span>
        <div class="stat-value-row">
          <span class="stat-value reputation">Lv.{$reputationLevel}</span>
          {#if calcNextDrawLevel($reputationLevel)}
            <span class="draw-target reputation"><img class="draw-icon" src="/icons/ui/draw_lightning.png" alt="⚡" />Lv.{calcNextDrawLevel($reputationLevel)}</span>
          {/if}
        </div>
        <div class="exp-bar">
          <div class="exp-fill reputation-fill" style="width: {Math.min(100, (calcExpProgress($gameState.reputationExp) / calcExpForLevel($reputationLevel)) * 100)}%"></div>
        </div>
      </div>
      <div class="stat-item">
        <span class="stat-label">錬金術</span>
        <div class="stat-value-row">
          <span class="stat-value">Lv.{$alchemyLevel}</span>
        </div>
        <div class="exp-bar">
          <div class="exp-fill" style="width: {Math.min(100, (calcExpProgress($gameState.alchemyExp) / $expForNextLevel) * 100)}%"></div>
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

  .skip-section {
    margin-left: auto;
    order: 999;
  }

  .skip-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.85rem;
    color: #c9a959;
    user-select: none;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  .skip-checkbox:hover {
    background-color: rgba(201, 169, 89, 0.1);
  }

  .skip-checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: #c9a959;
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

  .draw-target {
    display: flex;
    align-items: center;
    font-size: 0.7rem;
    font-weight: bold;
    position: relative;
    top: 3px;
  }

  .draw-icon {
    height: 1.3em;
    width: auto;
    margin-right: 1px;
    position: relative;
  }

  .draw-target.village {
    color: #81c784;
  }

  .draw-target.reputation {
    color: #e0c080;
  }

  .exp-bar,
  .stamina-bar {
    width: 65px;
    height: 4px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
    overflow: hidden;
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
