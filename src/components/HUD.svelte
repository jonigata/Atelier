<script lang="ts">
  import { gameState, daysRemaining, expForNextLevel } from '$lib/stores/game';
  import { getCurrentGoal, getAchievementProgress } from '$lib/services/achievement';

  // $gameStateの変更でcurrentGoalを再計算
  $: currentGoal = (() => {
    // これらの参照でリアクティビティをトリガー
    void $gameState.achievementProgress.completed.length;
    void $gameState.knownRecipes.length;
    void $gameState.stats.totalCraftCount;
    void $gameState.completedQuestCount;
    return getCurrentGoal();
  })();
  $: goalProgress = currentGoal ? getAchievementProgress(currentGoal.id) : 0;
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

  <div class="hud-item village">
    <span class="label">村発展</span>
    <span class="value">{$gameState.villageDevelopment}</span>
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

  {#if currentGoal}
    <div class="hud-goal">
      <span class="goal-label">目標</span>
      <span class="goal-title">{currentGoal.title}</span>
      <span class="goal-hint">{currentGoal.hint}</span>
      {#if goalProgress > 0 && goalProgress < 100}
        <span class="goal-progress">({goalProgress}%)</span>
      {/if}
    </div>
  {/if}
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

  .hud-goal {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin-left: auto;
    padding-left: 1rem;
    border-left: 2px solid #8b6914;
  }

  .goal-label {
    font-size: 0.75rem;
    color: #c9a959;
    background: #5a3d1a;
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
  }

  .goal-title {
    font-size: 0.95rem;
    font-weight: bold;
    color: #ffd700;
  }

  .goal-hint {
    font-size: 0.8rem;
    color: #c9a959;
  }

  .goal-progress {
    font-size: 0.75rem;
    color: #7cb342;
  }

  .hud-item.village .value {
    color: #81c784;
  }
</style>
