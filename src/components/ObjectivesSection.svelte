<script lang="ts">
  import { gameState, alchemyLevel, villageLevel, reputationLevel } from '$lib/stores/game';
  import { getActiveGoals, getAchievementProgress } from '$lib/services/achievement';
  import { items } from '$lib/data/items';
  import { recipes } from '$lib/data/recipes';
  import ActiveQuestCard from './common/ActiveQuestCard.svelte';
  import CardCarousel from './common/CardCarousel.svelte';
  import ContinueMarker from './common/ContinueMarker.svelte';
  import type { AchievementDef, AchievementCondition, ActiveQuest } from '$lib/models/types';

  let selectedGoal: AchievementDef | null = null;

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

  $: goalsFirst = !questsFirst;

</script>

{#if activeGoals.length > 0 || $gameState.activeQuests.length > 0}
  <div class="objectives-section">
    {#if questsFirst && $gameState.activeQuests.length > 0}
      <div class="objectives-group">
        <h5>受注中の依頼</h5>
        <CardCarousel itemsPerPage={3} itemCount={$gameState.activeQuests.length}>
          {#each $gameState.activeQuests as quest}
            <div>
              <ActiveQuestCard {quest} onClick={onQuestClick} compact />
            </div>
          {/each}
        </CardCarousel>
      </div>
    {/if}

    {#if activeGoals.length > 0}
      <div class="objectives-group">
        <h5>現在の目標</h5>
        <CardCarousel itemsPerPage={2} itemCount={activeGoals.length}>
          {#each activeGoals as goal}
            {@const progressPercent = getAchievementProgress(goal.id)}
            {@const condDetails = getConditionDetails(goal)}
            <div>
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                class="objective-item achievement clickable"
                class:important={goal.important}
                on:click={() => selectedGoal = goal}
              >
                <div class="objective-bg-icon" style="background-image: url('/icons/achievements/{goal.category}.png')"></div>
                <div class="objective-content">
                  <div class="objective-header">
                    <span class="objective-title">{goal.title}</span>
                  </div>
                  <div class="objective-hint">{@html goal.hint}</div>
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
                {#if progressPercent > 0}
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: {progressPercent}%"></div>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </CardCarousel>
      </div>
    {/if}

    {#if goalsFirst && $gameState.activeQuests.length > 0}
      <div class="objectives-group">
        <h5>受注中の依頼</h5>
        <CardCarousel itemsPerPage={3} itemCount={$gameState.activeQuests.length}>
          {#each $gameState.activeQuests as quest}
            <div>
              <ActiveQuestCard {quest} onClick={onQuestClick} compact />
            </div>
          {/each}
        </CardCarousel>
      </div>
    {/if}
  </div>
{/if}

{#if selectedGoal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="goal-dialog-overlay" on:click={() => selectedGoal = null}>
    <div class="goal-dialog">
      <div class="goal-dialog-title">{selectedGoal.title}</div>
      <div class="goal-dialog-hint">{@html selectedGoal.hint}</div>
      <div class="goal-dialog-section">
        <div class="goal-dialog-label">達成条件</div>
        {#each getConditionDetails(selectedGoal) as cond}
          <div class="condition-row" class:met={cond.met}>
            <span class="condition-check">{cond.met ? '✓' : '○'}</span>
            <span class="condition-label">{cond.label}</span>
            <span class="condition-value">{cond.current} / {cond.target}</span>
          </div>
        {/each}
      </div>
      <div class="goal-dialog-section">
        <div class="goal-dialog-label">報酬</div>
        <div class="goal-dialog-rewards">
          {#each getRewardSummary(selectedGoal) as reward}
            <span class="reward-item">{reward}</span>
          {/each}
        </div>
      </div>
      <div class="goal-dialog-footer">
        <ContinueMarker />
      </div>
    </div>
  </div>
{/if}

<style>
  .objectives-section {
    margin-top: 3rem;
    margin-bottom: 2.5rem;
    padding-top: 0;
    border-top: none;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .objectives-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    background: rgba(0, 0, 0, 0.5);
    padding: 0.6rem 0.4rem;
    border-radius: 8px;
  }

  .objectives-group:last-child {
    margin-bottom: 0;
  }

  .objectives-group h5 {
    color: #f0e8d0;
    font-size: 0.85rem;
    font-weight: bold;
    margin: 0;
    padding: 0;
    border-left: none;
    background: none;
    text-shadow:
      2px 2px 4px rgba(0, 0, 0, 1),
      -2px -2px 4px rgba(0, 0, 0, 1),
      2px -2px 4px rgba(0, 0, 0, 1),
      -2px 2px 4px rgba(0, 0, 0, 1),
      0 0 12px rgba(0, 0, 0, 1),
      0 0 24px rgba(0, 0, 0, 0.8);
  }

  .objective-item {
    position: relative;
    overflow: hidden;
    padding: 0.4rem 0.6rem;
    background: #1e1e38;
    border: 1px solid #3a3a5a;
    border-radius: 6px;
    border-left: 3px solid #2196f3;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .objective-bg-icon {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.1;
    pointer-events: none;
  }

  .objective-item.achievement {
    border-left-color: #6a6a8a;
  }

  .objective-item.achievement.important {
    border: 2px solid #c9a959;
    border-left: 4px solid #c9a959;
    background: linear-gradient(135deg, #2a2518 0%, #1e1e38 100%);
    box-shadow: 0 0 8px rgba(201, 169, 89, 0.2);
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
    font-size: 0.75rem;
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

  .reward-item {
    color: #c9a959;
  }

  .detail-conditions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.75rem;
    font-size: 0.6rem;
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

  .objective-item.clickable {
    cursor: pointer;
    transition: background 0.15s;
  }

  .objective-item.clickable:active {
    background: rgba(255, 255, 255, 0.08);
  }

  .goal-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .goal-dialog {
    background: #1a1a2e;
    border: 1px solid #4a4a6a;
    border-radius: 8px;
    padding: 1.5rem;
    max-width: 400px;
    width: 90%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .goal-dialog-title {
    font-weight: bold;
    font-size: 1.1rem;
    color: #e0e0f0;
  }

  .goal-dialog-hint {
    color: #a0a0b0;
    font-size: 0.9rem;
  }

  .goal-dialog-hint :global(strong) {
    color: #6cc4e0;
    font-weight: bold;
  }

  .goal-dialog-section {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .goal-dialog-label {
    color: #808090;
    font-size: 0.8rem;
    border-bottom: 1px solid #3a3a5a;
    padding-bottom: 0.2rem;
    margin-bottom: 0.2rem;
  }

  .goal-dialog-rewards {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .goal-dialog-footer {
    text-align: center;
    margin-top: 0.5rem;
  }
</style>
