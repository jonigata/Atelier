<script lang="ts">
  import { gameState, alchemyLevel, villageLevel, reputationLevel } from '$lib/stores/game';
  import { getActiveGoals, getAchievementProgress } from '$lib/services/achievement';
  import { items } from '$lib/data/items';
  import { recipes } from '$lib/data/recipes';
  import ActiveQuestCard from './common/ActiveQuestCard.svelte';
  import AchievementCategoryIcon from './common/AchievementCategoryIcon.svelte';
  import type { AchievementDef, AchievementCondition, ActiveQuest } from '$lib/models/types';

  export let onQuestClick: (quest: ActiveQuest) => void;
  export let questsFirst: boolean = false;

  const conditionLabels: Record<string, string> = {
    level: '錬金レベル',
    reputation: '名声',
    money: '所持金',
    quest_count: '依頼完了数',
    active_quest_count: '受注中の依頼',
    craft_count: '調合回数',
    craft_item: 'アイテム調合',
    craft_quality: '最高品質',
    expedition_count: '採取回数',
    recipe_count: 'レシピ数',
    consecutive_quests: '連続成功',
    total_sales: '累計売上',
    day: '経過日数',
    village_development: '村発展度',
    inventory_opened: '所持品を確認',
  };

  function getConditionCurrentValue(cond: AchievementCondition): number {
    switch (cond.type) {
      case 'level': return $alchemyLevel;
      case 'reputation': return $reputationLevel;
      case 'money': return $gameState.money;
      case 'quest_count': return $gameState.completedQuestCount;
      case 'craft_count': return $gameState.stats.totalCraftCount;
      case 'craft_quality': return $gameState.stats.highestQualityCrafted;
      case 'expedition_count': return $gameState.stats.totalExpeditionCount;
      case 'recipe_count': return $gameState.knownRecipes.length;
      case 'consecutive_quests': return $gameState.stats.consecutiveQuestSuccess;
      case 'total_sales': return $gameState.stats.totalSalesAmount;
      case 'day': return $gameState.day;
      case 'village_development': return $villageLevel;
      case 'inventory_opened': return $gameState.stats.inventoryOpened ? 1 : 0;
      default: return 0;
    }
  }

  function getConditionDetails(achievement: AchievementDef): { label: string; current: number; target: number; met: boolean }[] {
    return achievement.conditions.map(cond => {
      const target = cond.target as number;
      const current = getConditionCurrentValue(cond);
      const comparison = cond.comparison ?? '>=';
      let met = false;
      switch (comparison) {
        case '>=': met = current >= target; break;
        case '>': met = current > target; break;
        case '==': met = current === target; break;
        case '<=': met = current <= target; break;
        case '<': met = current < target; break;
      }
      return {
        label: conditionLabels[cond.type] || cond.type,
        current,
        target,
        met,
      };
    });
  }

  function getRewardSummary(achievement: AchievementDef): string[] {
    const { reward } = achievement;
    const summaries: string[] = [];

    if (reward.money) {
      summaries.push(`${reward.money}G`);
    }
    if (reward.items) {
      for (const item of reward.items) {
        const itemDef = items[item.itemId];
        summaries.push(`${itemDef?.name || item.itemId}x${item.quantity}`);
      }
    }
    if (reward.reputationExp) {
      summaries.push(`名声Exp+${reward.reputationExp}`);
    }
    if (reward.exp) {
      summaries.push(`経験値+${reward.exp}`);
    }
    if (reward.villageExp) {
      summaries.push(`村発展Exp+${reward.villageExp}`);
    }
    if (reward.recipes) {
      for (const recipeId of reward.recipes) {
        const recipeDef = recipes[recipeId];
        summaries.push(`レシピ:${recipeDef?.name || recipeId}`);
      }
    }
    if (reward.unlocks) {
      const actionLabels: Record<string, string> = {
        alchemy: '調合', quest: '依頼', expedition: '採取', shop: 'ショップ',
        inventory: '所持品', rest: '休息', study: '勉強', album: 'アルバム',
      };
      for (const action of reward.unlocks) {
        summaries.push(`解放:${actionLabels[action] || action}`);
      }
    }
    return summaries;
  }

  $: activeGoals = (() => {
    void $gameState.achievementProgress.completed;
    void $gameState.knownRecipes.length;
    void $gameState.stats.totalCraftCount;
    void $gameState.completedQuestCount;
    void $gameState.stats.totalExpeditionCount;
    void $alchemyLevel;
    return getActiveGoals();
  })();

</script>

{#if activeGoals.length > 0 || $gameState.activeQuests.length > 0}
  <div class="objectives-section">
    {#if questsFirst}
      {#if $gameState.activeQuests.length > 0}
        <div class="objectives-group">
          <h5>受注中の依頼</h5>
          <div class="quest-grid">
            {#each $gameState.activeQuests as quest}
              <ActiveQuestCard {quest} onClick={onQuestClick} />
            {/each}
          </div>
        </div>
      {/if}

      {#if activeGoals.length > 0}
        <div class="objectives-group">
          <h5>現在の目標</h5>
          <div class="goal-grid">
            {#each activeGoals as goal}
              {@const progressPercent = getAchievementProgress(goal.id)}
              {@const condDetails = getConditionDetails(goal)}
              <div
                class="objective-item achievement"
                class:important={goal.important}
              >
                <div class="objective-main">
                  <div class="objective-icon">
                    <AchievementCategoryIcon category={goal.category} size="medium" />
                  </div>
                  <div class="objective-content">
                    <div class="objective-header">
                      <span class="objective-title">{goal.title}</span>
                    </div>
                    <div class="objective-hint">{@html goal.hint}</div>
                  </div>
                </div>
                <div class="detail-conditions">
                  {#each condDetails as cond}
                    <div class="condition-row" class:met={cond.met}>
                      <span class="condition-check">{cond.met ? '✓' : '○'}</span>
                      <span class="condition-label">{cond.label}</span>
                      <span class="condition-value">{cond.current} / {cond.target}</span>
                    </div>
                  {/each}
                </div>
                <div class="objective-rewards">
                  <span class="reward-label">報酬:</span>
                  {#each getRewardSummary(goal) as reward}
                    <span class="reward-item">{reward}</span>
                  {/each}
                </div>
                {#if progressPercent > 0}
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: {progressPercent}%"></div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {:else}
      {#if activeGoals.length > 0}
        <div class="objectives-group">
          <h5>現在の目標</h5>
          <div class="goal-grid">
            {#each activeGoals as goal}
              {@const progressPercent = getAchievementProgress(goal.id)}
              {@const condDetails = getConditionDetails(goal)}
              <div
                class="objective-item achievement"
                class:important={goal.important}
              >
                <div class="objective-main">
                  <div class="objective-icon">
                    <AchievementCategoryIcon category={goal.category} size="medium" />
                  </div>
                  <div class="objective-content">
                    <div class="objective-header">
                      <span class="objective-title">{goal.title}</span>
                    </div>
                    <div class="objective-hint">{@html goal.hint}</div>
                  </div>
                </div>
                <div class="detail-conditions">
                  {#each condDetails as cond}
                    <div class="condition-row" class:met={cond.met}>
                      <span class="condition-check">{cond.met ? '✓' : '○'}</span>
                      <span class="condition-label">{cond.label}</span>
                      <span class="condition-value">{cond.current} / {cond.target}</span>
                    </div>
                  {/each}
                </div>
                <div class="objective-rewards">
                  <span class="reward-label">報酬:</span>
                  {#each getRewardSummary(goal) as reward}
                    <span class="reward-item">{reward}</span>
                  {/each}
                </div>
                {#if progressPercent > 0}
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: {progressPercent}%"></div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if $gameState.activeQuests.length > 0}
        <div class="objectives-group">
          <h5>受注中の依頼</h5>
          <div class="quest-grid">
            {#each $gameState.activeQuests as quest}
              <ActiveQuestCard {quest} onClick={onQuestClick} />
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .objectives-section {
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid #3a3a5a;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .objectives-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .objectives-group:last-child {
    margin-bottom: 0;
  }

  .objectives-group h5 {
    color: #a0a0b0;
    font-size: 0.85rem;
    margin: 0;
    padding-left: 0.5rem;
    border-left: 2px solid #4a4a6a;
  }

  .goal-grid, .quest-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .objective-item {
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid #3a3a5a;
    border-radius: 6px;
    border-left: 3px solid #2196f3;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .objective-item.achievement {
    border-left-color: #6a6a8a;
  }

  .objective-item.achievement.important {
    border: 2px solid #c9a959;
    border-left: 4px solid #c9a959;
    background: linear-gradient(135deg, rgba(201, 169, 89, 0.15) 0%, rgba(201, 169, 89, 0.05) 100%);
    box-shadow: 0 0 8px rgba(201, 169, 89, 0.2);
  }

  .objective-main {
    display: flex;
    gap: 0.75rem;
  }

  .objective-icon {
    flex-shrink: 0;
  }

  .objective-content {
    flex: 1;
    min-width: 0;
  }

  .objective-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .objective-title {
    font-weight: bold;
    color: #e0e0f0;
    font-size: 0.95rem;
  }

  .objective-hint {
    color: #a0a0b0;
    font-size: 0.85rem;
  }

  .objective-hint :global(strong) {
    color: #6cc4e0;
    font-weight: bold;
  }

  .progress-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #c9a959, #e0c080);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .reward-label {
    color: #808090;
    font-size: 0.8rem;
  }

  .objective-rewards {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    font-size: 0.85rem;
  }

  .reward-item {
    color: #c9a959;
  }

  .detail-conditions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.75rem;
    font-size: 0.8rem;
  }

  .condition-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #a0a0b0;
  }

  .condition-row.met {
    color: #80c080;
  }

  .condition-check {
    flex-shrink: 0;
  }

  .condition-value {
    font-variant-numeric: tabular-nums;
  }
</style>
