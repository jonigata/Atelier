<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { showingUnlockActions, pendingUnlockActions } from '$lib/stores/toast';
  import { getItem, getItemIcon, handleIconError } from '$lib/data/items';
  import { getNotifiedActiveGoals, getAchievementProgress } from '$lib/services/achievement';
  import { items } from '$lib/data/items';
  import { recipes } from '$lib/data/recipes';
  import type { ActionType, ActiveQuest, OwnedItem, AchievementDef } from '$lib/models/types';

  export let onSelect: (action: ActionType) => void;

  // 依頼に合致するアイテムを取得
  function getMatchingItemsForQuest(quest: ActiveQuest): OwnedItem[] {
    return $gameState.inventory.filter((item) => {
      if (item.itemId !== quest.requiredItemId) return false;
      if (quest.requiredQuality && item.quality < quest.requiredQuality) return false;
      return true;
    });
  }

  // 納品可能かチェック
  function canDeliver(quest: ActiveQuest): boolean {
    const remaining = quest.requiredQuantity - quest.deliveredCount;
    const matchingItems = getMatchingItemsForQuest(quest);
    return matchingItems.length >= remaining;
  }

  // 残り日数を計算
  function getDaysRemaining(quest: ActiveQuest): number {
    return quest.acceptedDay + quest.deadlineDays - $gameState.day;
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
  // 通知済み（トースト表示済み）の目標のみ表示
  $: activeGoals = (() => {
    // $gameStateを参照してリアクティブにする
    void $gameState.achievementProgress.completed;
    void $gameState.knownRecipes.length;
    void $gameState.stats.totalCraftCount;
    void $gameState.completedQuestCount;
    void $gameState.stats.totalExpeditionCount;
    void $gameState.alchemyLevel;
    return getNotifiedActiveGoals();
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

  const actions: { type: ActionType; label: string; icon: string; description: string }[] = [
    { type: 'alchemy', label: '調合', icon: '⚗️', description: 'アイテムを調合する' },
    { type: 'quest', label: '依頼', icon: '📜', description: '依頼の確認・受注・納品' },
    { type: 'expedition', label: '採取', icon: '🏕️', description: '採取隊を派遣する' },
    { type: 'shop', label: 'ショップ', icon: '🏪', description: 'アイテムの売買' },
    { type: 'inventory', label: '所持品', icon: '📦', description: '持ち物を確認する' },
    { type: 'rest', label: '休息', icon: '😴', description: '体力を回復する (1日)' },
    { type: 'study', label: '勉強', icon: '📚', description: '新しいレシピを習得' },
  ];

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
    // ただし、inventoryは常に利用可能
    let isLocked = false;
    if (actionType !== 'inventory') {
      // 日付演出中またはダイアログ表示中は、pendingのアクションもロック表示
      // （ダイアログが閉じるまでアンロック演出を見せない）
      if ((dayTransition !== null || pendingDialogue !== null) && pending.includes(actionType)) {
        isLocked = true;
      } else if (!unlockedActions.includes(actionType)) {
        isLocked = true;
      }
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
          <span class="lock-icon">🔒</span>
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
          <span class="icon">{action.icon}</span>
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
          <h5>実績</h5>
          {#each activeGoals as goal}
            {@const progressDetail = getProgressDetail(goal)}
            {@const progressPercent = getAchievementProgress(goal.id)}
            <div class="objective-item achievement" class:important={goal.important}>
              <div class="objective-header">
                <span class="objective-title">{goal.title}</span>
                {#if progressDetail}
                  <span class="progress-badge">{progressDetail.label}: {progressDetail.current}/{progressDetail.target}</span>
                {/if}
              </div>
              <div class="objective-hint">{goal.hint}</div>
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
      {/if}

      <!-- 受注中の依頼 -->
      {#if $gameState.activeQuests.length > 0}
        <div class="objectives-group">
          <h5>受注中の依頼</h5>
          {#each $gameState.activeQuests as quest}
            {@const itemDef = getItem(quest.requiredItemId)}
            {@const daysLeft = getDaysRemaining(quest)}
            {@const matchingCount = getMatchingItemsForQuest(quest).length}
            {@const canDeliverNow = canDeliver(quest)}
            <div class="objective-item quest" class:urgent={daysLeft <= 3} class:ready={canDeliverNow}>
              <div class="objective-header">
                <span class="objective-title">{quest.title}</span>
                <span class="days-left" class:danger={daysLeft <= 3}>残{daysLeft}日</span>
              </div>
              <div class="objective-requirement">
                <span class="req-label">納品:</span>
                <img class="item-icon-tiny" src={getItemIcon(quest.requiredItemId)} alt="" on:error={handleIconError} />
                <span class="item-name">{itemDef?.name || quest.requiredItemId}</span>
                {#if quest.requiredQuality}
                  <span class="quality-req">品質{quest.requiredQuality}以上</span>
                {/if}
                <span class="quantity">
                  (所持: <span class:complete={matchingCount >= quest.requiredQuantity}>{matchingCount}</span>/{quest.requiredQuantity})
                </span>
              </div>
              <div class="objective-rewards">
                <span class="reward-label">報酬:</span>
                <span class="reward-money">{quest.rewardMoney}G</span>
                <span class="reward-rep">名声+{quest.rewardReputation}</span>
                {#if canDeliverNow}
                  <span class="ready-badge">納品可</span>
                {/if}
              </div>
            </div>
          {/each}
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
    font-size: 3rem;
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
    font-size: 2rem;
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

  /* 依頼目標 */
  .objective-item.quest {
    border-left-color: #2196f3;
  }

  .objective-item.quest.urgent {
    border-left-color: #ff9800;
    background: rgba(255, 152, 0, 0.05);
  }

  .objective-item.quest.ready {
    border-left-color: #4caf50;
    background: rgba(76, 175, 80, 0.08);
  }

  .objective-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }

  .objective-title {
    font-weight: bold;
    color: #e0e0f0;
    font-size: 0.95rem;
  }

  .objective-hint {
    color: #a0a0b0;
    font-size: 0.85rem;
    margin-bottom: 0.4rem;
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

  .days-left {
    padding: 0.15rem 0.4rem;
    background: rgba(76, 175, 80, 0.3);
    border-radius: 3px;
    font-size: 0.75rem;
    color: #81c784;
  }

  .days-left.danger {
    background: rgba(244, 67, 54, 0.3);
    color: #ef5350;
  }

  .objective-requirement {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.4rem;
    font-size: 0.9rem;
  }

  .item-name {
    color: #e0e0f0;
  }

  .item-icon-tiny {
    width: 20px;
    height: 20px;
    object-fit: contain;
    vertical-align: middle;
  }

  .quantity {
    color: #a0a0b0;
  }

  .quantity .complete {
    color: #4caf50;
    font-weight: bold;
  }

  .quality-req {
    padding: 0.1rem 0.35rem;
    background: rgba(156, 39, 176, 0.3);
    border-radius: 3px;
    font-size: 0.75rem;
    color: #ce93d8;
  }

  .objective-rewards {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .reward-label, .req-label {
    color: #808090;
    font-size: 0.8rem;
  }

  .reward-item {
    color: #c9a959;
  }

  .reward-money {
    color: #c9a959;
  }

  .reward-rep {
    color: #81c784;
  }

  .ready-badge {
    margin-left: auto;
    padding: 0.15rem 0.5rem;
    background: #4caf50;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: bold;
    color: white;
  }
</style>
