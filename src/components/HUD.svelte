<script lang="ts">
  import { gameState, daysRemaining, expForNextLevel } from '$lib/stores/game';
</script>

<div class="hud">
  <div class="hud-item">
    <span class="label">日付</span>
    <span class="value">{$gameState.day} / 365日</span>
    <span class="sub">(残り {$daysRemaining}日)</span>
  </div>

  <div class="hud-item">
    <span class="label">所持金</span>
    <span class="value">{$gameState.money.toLocaleString()} G</span>
  </div>

  <div class="hud-item">
    <span class="label">名声</span>
    <span class="value">{$gameState.reputation}</span>
  </div>

  <div class="hud-item">
    <span class="label">錬金術Lv</span>
    <span class="value">{$gameState.alchemyLevel}</span>
    <span class="sub">(Exp: {$gameState.alchemyExp} / {$expForNextLevel})</span>
  </div>

  <div class="hud-item">
    <span class="label">体力</span>
    <span class="value">{$gameState.stamina} / {$gameState.maxStamina}</span>
  </div>
</div>

<style>
  .hud {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
    background: linear-gradient(135deg, #2c1810 0%, #4a2c17 100%);
    border-bottom: 3px solid #8b6914;
    color: #f4e4bc;
  }

  .hud-item {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .label {
    font-size: 0.85rem;
    color: #c9a959;
  }

  .value {
    font-size: 1.1rem;
    font-weight: bold;
  }

  .sub {
    font-size: 0.75rem;
    color: #a89060;
  }
</style>
