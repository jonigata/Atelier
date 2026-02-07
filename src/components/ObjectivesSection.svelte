<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { getActiveGoals, getAchievementProgress } from '$lib/services/achievement';
  import { items } from '$lib/data/items';
  import { recipes } from '$lib/data/recipes';
  import ActiveQuestCard from './common/ActiveQuestCard.svelte';
  import AchievementCategoryIcon from './common/AchievementCategoryIcon.svelte';
  import type { AchievementDef, ActiveQuest } from '$lib/models/types';

  export let onQuestClick: (quest: ActiveQuest) => void;

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
    if (reward.reputation) {
      summaries.push(`名声+${reward.reputation}`);
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
    if (reward.facilities) {
      summaries.push(`設備解放`);
    }

    return summaries;
  }

  $: activeGoals = (() => {
    void $gameState.achievementProgress.completed;
    void $gameState.knownRecipes.length;
    void $gameState.stats.totalCraftCount;
    void $gameState.completedQuestCount;
    void $gameState.stats.totalExpeditionCount;
    void $gameState.alchemyLevel;
    return getActiveGoals();
  })();

  function getProgressDetail(achievement: AchievementDef): { label: string; current: number; target: number } | null {
    if (achievement.conditions.length !== 1) return null;

    const cond = achievement.conditions[0];
    const target = cond.target as number;
    let current = 0;
    let label = '';

    switch (cond.type) {
      case 'level':
        current = $gameState.alchemyLevel;
        label = '錬金Lv';
        break;
      case 'reputation':
        current = $gameState.reputation;
        label = '名声';
        break;
      case 'money':
        current = $gameState.money;
        label = '所持金';
        break;
      case 'quest_count':
        current = $gameState.completedQuestCount;
        label = '依頼完了';
        break;
      case 'craft_count':
        current = $gameState.stats.totalCraftCount;
        label = '調合回数';
        break;
      case 'craft_quality':
        current = $gameState.stats.highestQualityCrafted;
        label = '最高品質';
        break;
      case 'expedition_count':
        current = $gameState.stats.totalExpeditionCount;
        label = '採取回数';
        break;
      case 'recipe_count':
        current = $gameState.knownRecipes.length;
        label = 'レシピ数';
        break;
      case 'consecutive_quests':
        current = $gameState.stats.consecutiveQuestSuccess;
        label = '連続成功';
        break;
      case 'total_sales':
        current = $gameState.stats.totalSalesAmount;
        label = '累計売上';
        break;
      case 'village_development':
        current = $gameState.villageDevelopment;
        label = '村発展度';
        break;
      default:
        return null;
    }

    return { label, current: Math.min(current, target), target };
  }
</script>

{#if activeGoals.length > 0 || $gameState.activeQuests.length > 0}
  <div class="objectives-section">
    {#if activeGoals.length > 0}
      <div class="objectives-group">
        <h5>現在の目標</h5>
        <div class="goal-grid">
          {#each activeGoals as goal}
            {@const progressDetail = getProgressDetail(goal)}
            {@const progressPercent = getAchievementProgress(goal.id)}
            <div class="objective-item achievement" class:important={goal.important}>
              <div class="objective-main">
                <div class="objective-icon">
                  <AchievementCategoryIcon category={goal.category} size="medium" />
                </div>
                <div class="objective-content">
                  <div class="objective-header">
                    <span class="objective-title">{goal.title}</span>
                    {#if progressDetail}
                      <span class="progress-badge">{progressDetail.label}: {progressDetail.current}/{progressDetail.target}</span>
                    {/if}
                  </div>
                  <div class="objective-hint">{goal.hint}</div>
                </div>
              </div>
              <div class="objective-rewards">
                <span class="reward-label">報酬:</span>
                {#each getRewardSummary(goal) as reward}
                  <span class="reward-item">{reward}</span>
                {/each}
              </div>
              {#if progressPercent > 0 && progressDetail}
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
  </div>
{/if}

<style>
  .objectives-section {
    margin-top: 1.5rem;
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
    margin-bottom: 0.5rem;
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

  .progress-badge {
    padding: 0.15rem 0.4rem;
    background: rgba(201, 169, 89, 0.3);
    border-radius: 3px;
    font-size: 0.75rem;
    color: #c9a959;
    font-weight: bold;
  }

  .progress-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    margin-top: 0.5rem;
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
</style>
