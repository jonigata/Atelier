<script lang="ts">
  import { gameState, totalScore } from '$lib/stores/game';
  import { items, getItemIcon, handleIconError } from '$lib/data/items';
  import ScoreChart from './ScoreChart.svelte';
  import RankingPanel from './RankingPanel.svelte';
  import { loadPastGameScores, loadBestPastGame } from '$lib/services/pastScores';
  import { recipes } from '$lib/data/recipes';
  import { CATEGORY_NAMES, CRAFTED_CATEGORY_ORDER, isCraftedCategory } from '$lib/data/categories';
  import { getAllAchievements } from '$lib/data/achievements';
  import { getAchievementProgress, isStoryAchievement } from '$lib/services/achievement';
  import type { ItemCategory, AchievementCategory, AchievementDef, ItemDef } from '$lib/models/types';

  // レシピのresultItemId → レシピが存在するアイテムIDのSet
  const recipeResultItemIds = new Set(Object.values(recipes).map(r => r.resultItemId));

  export let onBack: () => void;
  export let initialTab: 'items' | 'achievements' | 'scores' | 'ranking' = 'items';

  // タブ切り替え
  let activeTab: 'items' | 'achievements' | 'scores' | 'ranking' = initialTab;

  // スコア推移タブ用
  $: pastGames = typeof window !== 'undefined' ? loadPastGameScores() : [];
  $: bestGame = typeof window !== 'undefined' ? loadBestPastGame() : null;
  $: currentScores = $gameState.scoreHistory ?? [];

  // === アイテムタブ ===
  let openItemCategories: Set<string> = new Set();
  let openAchCategories: Set<string> = new Set();

  function toggleItemCategory(cat: string) {
    if (openItemCategories.has(cat)) {
      openItemCategories.delete(cat);
    } else {
      openItemCategories.add(cat);
    }
    openItemCategories = openItemCategories;
  }

  function toggleAchCategory(cat: string) {
    if (openAchCategories.has(cat)) {
      openAchCategories.delete(cat);
    } else {
      openAchCategories.add(cat);
    }
    openAchCategories = openAchCategories;
  }

  const allItems = Object.values(items);
  const totalItemCount = allItems.length;

  // 採取物（錬成物以外）
  const gatheringItems = allItems.filter(item => !isCraftedCategory(item.category));
  const gatheringCategoryOrder: ItemCategory[] = ['herb', 'ore', 'water', 'plant', 'wood', 'crystal', 'misc'];

  // 錬成物をカテゴリ別にグルーピング
  const craftedItems = allItems.filter(item => isCraftedCategory(item.category));

  interface ItemGroup {
    key: string;
    label: string;
    items: ItemDef[];
  }

  const gatheringGroups: ItemGroup[] = gatheringCategoryOrder
    .map(cat => ({
      key: cat,
      label: CATEGORY_NAMES[cat] || cat,
      items: gatheringItems.filter(item => item.category === cat),
    }))
    .filter(g => g.items.length > 0);

  const craftedGroups: ItemGroup[] = CRAFTED_CATEGORY_ORDER
    .map(cat => ({
      key: cat,
      label: CATEGORY_NAMES[cat] || cat,
      items: craftedItems.filter(item => item.category === cat),
    }))
    .filter(g => g.items.length > 0);

  function getGroupDiscoveredCount(group: ItemGroup, discovered: string[]): number {
    return group.items.filter(item => discovered.includes(item.id)).length;
  }

  function getSectionDiscoveredCount(groups: ItemGroup[], discovered: string[]): number {
    return groups.reduce((sum, g) => sum + g.items.filter(item => discovered.includes(item.id)).length, 0);
  }

  function getSectionTotalCount(groups: ItemGroup[]): number {
    return groups.reduce((sum, g) => sum + g.items.length, 0);
  }

  $: discoveredItems = $gameState.discoveredItems;
  $: discoveredCount = discoveredItems.length;
  $: maxQualityByItem = $gameState.maxQualityByItem ?? {};

  // === アチーブメントタブ ===
  const ACHIEVEMENT_CATEGORY_NAMES: Record<AchievementCategory, string> = {
    tutorial: 'チュートリアル',
    alchemy: '調合',
    quest: '依頼',
    expedition: '採取',
    economy: '経済',
    mastery: '熟練',
  };

  const ACHIEVEMENT_CATEGORY_ORDER: AchievementCategory[] = ['alchemy', 'quest', 'expedition', 'economy', 'mastery'];

  // チュートリアル・autoCompleteを除外したアチーブメント
  const displayAchievements = getAllAchievements().filter(a => !a.autoComplete && a.category !== 'tutorial');

  let achFilterCategory: string = 'all';

  $: completedIds = $gameState.achievementProgress.completed;
  $: completedAchCount = displayAchievements.filter(a => completedIds.includes(a.id)).length;

  // アチーブメントが「発動済み」（前提条件クリア済み）かどうか
  function isAchievementVisible(ach: AchievementDef, completed: string[]): boolean {
    if (completed.includes(ach.id)) return true;
    if (!ach.prerequisite) return true;
    return ach.prerequisite.every(pid => completed.includes(pid));
  }

  $: groupedAchievements = (() => {
    const groups: { category: AchievementCategory; label: string; achievements: AchievementDef[] }[] = [];

    const filterCats = achFilterCategory === 'all'
      ? ACHIEVEMENT_CATEGORY_ORDER
      : [achFilterCategory as AchievementCategory];

    for (const cat of filterCats) {
      const catAchs = displayAchievements.filter(a => a.category === cat);
      if (catAchs.length > 0) {
        groups.push({
          category: cat,
          label: ACHIEVEMENT_CATEGORY_NAMES[cat] || cat,
          achievements: catAchs,
        });
      }
    }
    return groups;
  })();

  function getCategoryAchCount(cat: AchievementCategory): number {
    return displayAchievements.filter(a => a.category === cat).length;
  }

  function getCategoryCompletedCount(cat: AchievementCategory, completed: string[]): number {
    return displayAchievements.filter(a => a.category === cat && completed.includes(a.id)).length;
  }
</script>

<div class="album-panel">
  <!-- タブ切り替え -->
  <div class="tab-bar">
    <button class="tab" class:active={activeTab === 'items'} on:click={() => activeTab = 'items'}>
      アイテム
    </button>
    <button class="tab" class:active={activeTab === 'achievements'} on:click={() => activeTab = 'achievements'}>
      アチーブメント
    </button>
    <button class="tab" class:active={activeTab === 'scores'} on:click={() => activeTab = 'scores'}>
      スコア推移
    </button>
    <button class="tab" class:active={activeTab === 'ranking'} on:click={() => activeTab = 'ranking'}>
      ランキング
    </button>
  </div>

  {#if activeTab === 'items'}
    <!-- アイテムタブ -->
    <div class="album-header">
      <div class="collection-rate">
        <span class="rate-label">収集率</span>
        <span class="rate-value">{discoveredCount} / {totalItemCount}</span>
        <div class="rate-bar">
          <div class="rate-fill" style="width: {(discoveredCount / totalItemCount) * 100}%"></div>
        </div>
        <span class="rate-percent">{Math.floor((discoveredCount / totalItemCount) * 100)}%</span>
      </div>
    </div>

    <!-- 採取物セクション -->
    <div class="section-header">
      <h3 class="section-title">採取物</h3>
      <span class="section-count">
        {getSectionDiscoveredCount(gatheringGroups, discoveredItems)}/{getSectionTotalCount(gatheringGroups)}
      </span>
    </div>
    {#each gatheringGroups as group}
      <div class="category-group">
        <button class="category-title" on:click={() => toggleItemCategory(group.key)}>
          <span class="accordion-arrow" class:open={openItemCategories.has(group.key)}>▶</span>
          {group.label}
          <span class="category-count">
            {getGroupDiscoveredCount(group, discoveredItems)}/{group.items.length}
          </span>
        </button>
        {#if openItemCategories.has(group.key)}
          <div class="item-grid">
            {#each group.items as item}
              {@const isDiscovered = discoveredItems.includes(item.id)}
              <div class="album-item" class:undiscovered={!isDiscovered}>
                {#if isDiscovered}
                  <img class="item-icon" src={getItemIcon(item.id)} alt={item.name} on:error={handleIconError} />
                  <div class="item-info">
                    <span class="item-name">{item.name}</span>
                    <span class="item-desc">{item.description}</span>
                  </div>
                  {#if maxQualityByItem[item.id]}
                    <span class="item-max-quality" class:high-quality={maxQualityByItem[item.id] >= 70}>
                      最高 {maxQualityByItem[item.id]}
                    </span>
                  {/if}
                {:else}
                  <div class="silhouette-wrapper">
                    <img class="item-icon silhouette" src={getItemIcon(item.id)} alt="???" on:error={handleIconError} />
                  </div>
                  <div class="item-info">
                    <span class="item-name unknown">???</span>
                    <span class="item-desc unknown">まだ発見されていないアイテム</span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}

    <!-- 錬成物セクション -->
    <div class="section-header">
      <h3 class="section-title">錬成物</h3>
      <span class="section-count">
        {getSectionDiscoveredCount(craftedGroups, discoveredItems)}/{getSectionTotalCount(craftedGroups)}
      </span>
    </div>
    {#each craftedGroups as group}
      <div class="category-group">
        <button class="category-title" on:click={() => toggleItemCategory(group.key)}>
          <span class="accordion-arrow" class:open={openItemCategories.has(group.key)}>▶</span>
          {group.label}
          <span class="category-count">
            {getGroupDiscoveredCount(group, discoveredItems)}/{group.items.length}
          </span>
        </button>
        {#if openItemCategories.has(group.key)}
          <div class="item-grid">
            {#each group.items as item}
              {@const isDiscovered = discoveredItems.includes(item.id)}
              {@const isRecipeKnown = !isDiscovered && recipeResultItemIds.has(item.id) && $gameState.knownRecipes.some(rid => recipes[rid]?.resultItemId === item.id)}
              <div class="album-item" class:undiscovered={!isDiscovered} class:recipe-known={isRecipeKnown}>
                {#if isDiscovered}
                  <img class="item-icon" src={getItemIcon(item.id)} alt={item.name} on:error={handleIconError} />
                  <div class="item-info">
                    <span class="item-name">{item.name}</span>
                    <span class="item-desc">{item.description}</span>
                  </div>
                  {#if maxQualityByItem[item.id]}
                    <span class="item-max-quality" class:high-quality={maxQualityByItem[item.id] >= 70}>
                      最高 {maxQualityByItem[item.id]}
                    </span>
                  {/if}
                {:else if isRecipeKnown}
                  <div class="icon-placeholder"></div>
                  <div class="item-info">
                    <span class="item-name recipe-hint">{item.name}</span>
                    <span class="item-desc recipe-hint">未調合</span>
                  </div>
                {:else}
                  <div class="silhouette-wrapper">
                    <img class="item-icon silhouette" src={getItemIcon(item.id)} alt="???" on:error={handleIconError} />
                  </div>
                  <div class="item-info">
                    <span class="item-name unknown">???</span>
                    <span class="item-desc unknown">まだ発見されていないアイテム</span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}

  {:else if activeTab === 'achievements'}
    <!-- アチーブメントタブ -->
    <div class="album-header">
      <div class="collection-rate">
        <span class="rate-label">達成率</span>
        <span class="rate-value">{completedAchCount} / {displayAchievements.length}</span>
        <div class="rate-bar">
          <div class="rate-fill" style="width: {(completedAchCount / displayAchievements.length) * 100}%"></div>
        </div>
        <span class="rate-percent">{Math.floor((completedAchCount / displayAchievements.length) * 100)}%</span>
      </div>

      <div class="filter-group">
        <label for="ach-filter">カテゴリ:</label>
        <select id="ach-filter" bind:value={achFilterCategory}>
          <option value="all">すべて</option>
          {#each ACHIEVEMENT_CATEGORY_ORDER as cat}
            <option value={cat}>
              {ACHIEVEMENT_CATEGORY_NAMES[cat]} ({getCategoryCompletedCount(cat, completedIds)}/{getCategoryAchCount(cat)})
            </option>
          {/each}
        </select>
      </div>
    </div>

    {#each groupedAchievements as group}
      <div class="category-group">
        <button class="category-title" on:click={() => toggleAchCategory(group.category)}>
          <span class="accordion-arrow" class:open={openAchCategories.has(group.category)}>▶</span>
          {group.label}
          <span class="category-count">
            {getCategoryCompletedCount(group.category, completedIds)}/{group.achievements.length}
          </span>
        </button>
        {#if openAchCategories.has(group.category)}
        <div class="ach-list">
          {#each group.achievements as ach}
            {@const isCompleted = completedIds.includes(ach.id)}
            {@const isVisible = isAchievementVisible(ach, completedIds)}
            {@const isStory = isStoryAchievement(ach)}
            {@const progress = !isCompleted && isVisible ? getAchievementProgress(ach.id) : 0}
            <div class="ach-item" class:completed={isCompleted} class:locked={!isVisible}>
              <div class="ach-icon-area">
                {#if isCompleted}
                  <span class="ach-check">✓</span>
                {:else if !isVisible}
                  <span class="ach-lock">🔒</span>
                {:else}
                  <span class="ach-pending">○</span>
                {/if}
              </div>
              <div class="ach-content">
                {#if isCompleted}
                  <span class="ach-title">{ach.title}</span>
                  <span class="ach-desc">{ach.description}</span>
                {:else if isVisible}
                  <span class="ach-title unrevealed">{ach.title}</span>
                  <span class="ach-hint">{@html ach.hint}</span>
                  {#if progress > 0}
                    <div class="ach-progress-bar">
                      <div class="ach-progress-fill" style="width: {progress}%"></div>
                    </div>
                  {/if}
                {:else}
                  <span class="ach-title locked-text">???</span>
                  <span class="ach-desc locked-text">未発見のアチーブメント</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        {/if}
      </div>
    {/each}
  {:else if activeTab === 'scores'}
    <!-- スコア推移タブ -->
    <div class="album-header">
      <div class="collection-rate">
        <span class="rate-label">現在のスコア</span>
        <span class="rate-value" style="color: #f0c040; font-weight: bold;">
          {$totalScore.toLocaleString()} pt
        </span>
      </div>
      {#if pastGames.length > 0}
        <span style="color: #808090; font-size: 0.85rem;">
          過去{pastGames.length}回分と比較
        </span>
      {/if}
    </div>

    <ScoreChart {currentScores} {pastGames} {bestGame} currentDay={$gameState.day} />

    {#if pastGames.length === 0 && currentScores.length <= 1}
      <p class="score-empty-msg">
        ゲームを進めるとスコア推移が表示されます。<br/>
        ゲーム終了後、過去のスコアと比較できます。
      </p>
    {/if}
  {:else if activeTab === 'ranking'}
    <RankingPanel />
  {/if}
</div>

<style>
  .album-panel {
    padding: 1.5rem;
    padding-bottom: 6rem;
  }


  h2 {
    font-size: 1.5rem;
    color: #f4e4bc;
    margin-bottom: 1rem;
  }
  /* タブバー */
  .tab-bar {
    display: flex;
    gap: 0;
    margin-bottom: 1rem;
    border-bottom: 2px solid #3a3a5a;
  }

  .tab {
    padding: 0.5rem 1.25rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #808090;
    font-size: 1rem;
    cursor: pointer;
    margin-bottom: -2px;
    transition: all 0.2s;
  }

  .tab:hover {
    color: #c0c0d0;
  }

  .tab.active {
    color: #f4e4bc;
    border-bottom-color: #c9a959;
    font-weight: bold;
  }

  .album-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
  }

  .collection-rate {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .rate-label {
    color: #c9a959;
    font-weight: bold;
    font-size: 1rem;
  }

  .rate-value {
    color: #e0e0f0;
    font-size: 1rem;
  }

  .rate-bar {
    width: 120px;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .rate-fill {
    height: 100%;
    background: linear-gradient(90deg, #c9a959, #e0c080);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .rate-percent {
    color: #c9a959;
    font-weight: bold;
    font-size: 1rem;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-group label {
    font-size: 1rem;
    color: #a0a0b0;
  }

  .filter-group select {
    padding: 0.3rem 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #e0e0f0;
    font-size: 1rem;
  }

  /* セクション大見出し */
  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.4rem;
    border-bottom: 2px solid #c9a959;
  }

  .section-header:first-of-type {
    margin-top: 0;
  }

  .section-title {
    font-size: 1.15rem;
    color: #f4e4bc;
    margin: 0;
  }

  .section-count {
    font-size: 1rem;
    color: #a09070;
  }

  .category-group {
    margin-bottom: 0.25rem;
  }

  .category-title {
    width: 100%;
    font-size: 1rem;
    font-weight: bold;
    color: #c9a959;
    margin-bottom: 0;
    padding: 0.4rem 0.5rem;
    border: none;
    border-bottom: 1px solid #3a3a5a;
    background: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .category-title:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .accordion-arrow {
    font-size: 0.7rem;
    color: #808090;
    transition: transform 0.2s;
    display: inline-block;
  }

  .accordion-arrow.open {
    transform: rotate(90deg);
  }

  .category-count {
    font-size: 1rem;
    color: #808090;
    font-weight: normal;
  }

  /* アイテムグリッド */
  .item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .album-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .album-item:hover:not(.undiscovered) {
    background: rgba(255, 255, 255, 0.1);
    border-color: #6a6a8a;
  }

  .album-item.undiscovered {
    background: rgba(0, 0, 0, 0.2);
    border-color: #3a3a5a;
  }

  .item-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .silhouette-wrapper {
    flex-shrink: 0;
  }

  .item-icon.silhouette {
    filter: brightness(0) saturate(0) opacity(0.3);
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .item-name {
    font-weight: bold;
    color: #e0e0f0;
    font-size: 1rem;
  }

  .item-name.unknown {
    color: #606080;
  }

  .item-desc {
    font-size: 1rem;
    color: #a0a0b0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-desc.unknown {
    color: #505060;
    font-style: italic;
  }

  .album-item.recipe-known {
    background: rgba(201, 169, 89, 0.05);
    border-color: #4a4a5a;
  }

  .icon-placeholder {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed #4a4a5a;
    border-radius: 4px;
  }

  .item-name.recipe-hint {
    color: #908878;
  }

  .item-desc.recipe-hint {
    color: #605848;
    font-style: italic;
  }

  .item-max-quality {
    flex-shrink: 0;
    font-size: 1rem;
    color: #a0a0b0;
    margin-left: auto;
    padding: 0.15rem 0.4rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
    white-space: nowrap;
  }

  .item-max-quality.high-quality {
    color: #c9a959;
    background: rgba(201, 169, 89, 0.12);
  }

  /* アチーブメントリスト */
  .ach-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }

  .ach-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .ach-item.completed {
    border-color: #5a6a4a;
    background: rgba(100, 160, 80, 0.08);
  }

  .ach-item.locked {
    background: rgba(0, 0, 0, 0.2);
    border-color: #3a3a5a;
  }

  .ach-icon-area {
    flex-shrink: 0;
    width: 28px;
    text-align: center;
  }

  .ach-check {
    color: #80c060;
    font-size: 1.1rem;
    font-weight: bold;
  }

  .ach-lock {
    font-size: 1rem;
    opacity: 0.4;
  }

  .ach-pending {
    color: #808090;
    font-size: 1rem;
  }

  .ach-content {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
    flex: 1;
  }

  .ach-title {
    font-weight: bold;
    color: #e0e0f0;
    font-size: 1rem;
  }

  .ach-title.unrevealed {
    color: #b0b0c0;
  }

  .ach-title.locked-text {
    color: #505060;
  }

  .ach-desc {
    font-size: 1rem;
    color: #a0a0b0;
  }

  .ach-desc.locked-text {
    color: #505060;
    font-style: italic;
  }

  .ach-hint {
    font-size: 1rem;
    color: #908878;
  }

  .ach-hint :global(strong) {
    color: #c9a959;
    font-weight: bold;
  }

  .ach-progress-bar {
    width: 100%;
    max-width: 160px;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 0.2rem;
  }

  .ach-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6a7a5a, #90b070);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .score-empty-msg {
    color: #808090;
    text-align: center;
    margin-top: 1.5rem;
    font-size: 1rem;
    line-height: 1.6;
  }
</style>
