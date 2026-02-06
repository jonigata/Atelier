<script lang="ts">
  import { gameState, setSelectedQuestId } from '$lib/stores/game';
  import { showingUnlockActions, pendingUnlockActions } from '$lib/stores/toast';
  import { getActiveGoals, getAchievementProgress } from '$lib/services/achievement';
  import { items } from '$lib/data/items';
  import { recipes } from '$lib/data/recipes';
  import ActiveQuestCard from './common/ActiveQuestCard.svelte';
  import AchievementCategoryIcon from './common/AchievementCategoryIcon.svelte';
  import type { ActionType, AchievementDef, ActiveQuest } from '$lib/models/types';

  export let onSelect: (action: ActionType) => void;

  function handleQuestClick(quest: ActiveQuest) {
    setSelectedQuestId(quest.id);
    onSelect('quest');
  }

  // アチーブメントの報酬を短縮表示
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

    return summaries;
  }

  // アクティブな目標を取得（リアクティブ - gameStateに依存）
  $: activeGoals = (() => {
    // $gameStateを参照してリアクティブにする
    void $gameState.achievementProgress.completed;
    void $gameState.knownRecipes.length;
    void $gameState.stats.totalCraftCount;
    void $gameState.completedQuestCount;
    void $gameState.stats.totalExpeditionCount;
    void $gameState.alchemyLevel;
    return getActiveGoals();
  })();

  // アチーブメントの進捗を具体的に表示
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

  const actions: { type: ActionType; label: string; description: string }[] = [
    { type: 'alchemy', label: '調合', description: 'アイテムを調合する' },
    { type: 'quest', label: '依頼', description: '依頼の確認・受注・納品' },
    { type: 'expedition', label: '採取', description: '採取隊を派遣する' },
    { type: 'shop', label: 'ショップ', description: 'アイテムの売買' },
    { type: 'inventory', label: '所持品', description: '持ち物を確認する' },
    { type: 'rest', label: '休息', description: '体力を回復する (1日)' },
    { type: 'study', label: '勉強', description: '新しいレシピを習得' },
  ];

  function getActionIcon(type: ActionType): string {
    return `/icons/actions/${type}.png`;
  }

  // 日付演出中かどうか
  $: isDayTransition = $gameState.pendingDayTransition !== null;

  // 各アクションのロック状態をリアクティブに計算
  // ストアを直接参照することでSvelteがすべての依存関係を追跡
  $: actionStates = actions.map(action => {
    const actionType = action.type;
    const unlockedActions = $gameState.tutorialProgress.unlockedActions;
    const dayTransition = $gameState.pendingDayTransition;
    const pendingDialogue = $gameState.tutorialProgress.pendingDialogue;
    const pending = $pendingUnlockActions;

    // ロック判定: アンロックされていないアクションはロック
    let isLocked = false;
    // 日付演出中またはダイアログ表示中は、pendingのアクションもロック表示
    // （ダイアログが閉じるまでアンロック演出を見せない）
    if ((dayTransition !== null || pendingDialogue !== null) && pending.includes(actionType)) {
      isLocked = true;
    } else if (!unlockedActions.includes(actionType)) {
      isLocked = true;
    }

    // 新規アンロック判定
    const isNewlyUnlocked = $showingUnlockActions.has(actionType);

    return { ...action, isLocked, isNewlyUnlocked };
  });

</script>

<div class="action-menu">
  <h3>行動を選択してください</h3>
  <div class="actions">
    {#each actionStates as action}
      {#if action.isLocked}
        <!-- ロック中：鍵マークのみ表示 -->
        <div class="action-btn locked">
          <img class="lock-icon" src="/icons/actions/locked.png" alt="ロック中" />
          <span class="lock-label">???</span>
        </div>
      {:else}
        <!-- アンロック済み -->
        <button
          class="action-btn"
          class:newly-unlocked={action.isNewlyUnlocked}
          on:click={() => onSelect(action.type)}
          disabled={action.type === 'expedition' && $gameState.expedition !== null}
        >
          <img class="icon" src={getActionIcon(action.type)} alt={action.label} />
          <span class="label">{action.label}</span>
          <span class="description">{action.description}</span>
          {#if action.type === 'expedition' && $gameState.expedition !== null}
            <span class="badge">派遣中</span>
          {:else if action.type === 'quest' && $gameState.newQuestCount > 0}
            <span class="badge new-quest">{$gameState.newQuestCount}件</span>
          {/if}
        </button>
      {/if}
    {/each}
  </div>

  <!-- 目標一覧 -->
  {#if activeGoals.length > 0 || $gameState.activeQuests.length > 0}
    <div class="objectives-section">
      <!-- アチーブメント目標 -->
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

      <!-- 受注中の依頼 -->
      {#if $gameState.activeQuests.length > 0}
        <div class="objectives-group">
          <h5>受注中の依頼</h5>
          <div class="quest-grid">
            {#each $gameState.activeQuests as quest}
              <ActiveQuestCard {quest} onClick={handleQuestClick} />
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .action-menu {
    padding: 1.5rem;
  }

  h3 {
    color: #c9a959;
    font-size: 1.1rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1.25rem;
    min-height: 120px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #4a4a6a;
    border-radius: 8px;
    color: #e0e0f0;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .action-btn:hover:not(:disabled):not(.locked) {
    background: rgba(201, 169, 89, 0.15);
    border-color: #c9a959;
    transform: translateY(-2px);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ロック中のスタイル */
  .action-btn.locked {
    background: rgba(0, 0, 0, 0.3);
    border: 2px dashed #3a3a5a;
    cursor: not-allowed;
  }

  .lock-icon {
    width: 64px;
    height: 64px;
    object-fit: contain;
    opacity: 0.5;
  }

  .lock-label {
    font-size: 1rem;
    color: #606080;
    font-weight: bold;
  }

  /* 新しくアンロックされた時のアニメーション */
  .action-btn.newly-unlocked {
    animation: unlockPulse 2s ease-out;
  }

  @keyframes unlockPulse {
    0% {
      box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
      border-color: #4caf50;
      background: rgba(76, 175, 80, 0.2);
    }
    50% {
      box-shadow: 0 0 20px 10px rgba(76, 175, 80, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
      border-color: #4a4a6a;
      background: rgba(255, 255, 255, 0.05);
    }
  }

  .icon {
    width: 64px;
    height: 64px;
    object-fit: contain;
  }

  .label {
    font-size: 1.1rem;
    font-weight: bold;
  }

  .description {
    font-size: 0.8rem;
    color: #a0a0b0;
    text-align: center;
  }

  .badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.2rem 0.5rem;
    background: #ff9800;
    color: #1a1a2e;
    font-size: 0.7rem;
    font-weight: bold;
    border-radius: 4px;
  }

  .badge.new-quest {
    background: #2196f3;
    color: white;
    animation: badgePulse 2s ease-in-out infinite;
  }

  @keyframes badgePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* 目標一覧 */
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

  /* アチーブメント目標（通常） */
  .objective-item.achievement {
    border-left-color: #6a6a8a;
  }

  /* アチーブメント目標（重要） */
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

  .reward-item {
    color: #c9a959;
  }
</style>
