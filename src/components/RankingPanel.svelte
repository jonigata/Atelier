<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchRanking, type RankingEntry, type RankingListResponse } from '$lib/services/ranking';

  const ENDING_LABELS: Record<string, string> = {
    true: '真ED',
    good: '良ED',
    normal: '普通ED',
    mediocre: '微妙ED',
    fail: '失敗ED',
    gameover: 'GAMEOVER',
    provisional: '仮ED',
    retire: 'リタイア',
  };

  const BD_LABELS: [string, string][] = [
    ['money', '所持金'],
    ['inventory', '所持品'],
    ['levels', 'レベル'],
    ['quests', '依頼達成'],
    ['album', 'アルバム'],
    ['crafting', '調合実績'],
    ['buildings', '建物・助手'],
  ];

  let activeTab: 'weekly' | 'total' = 'weekly';
  let loading = false;
  let errorMsg = '';
  let data: RankingListResponse | null = null;
  let expandedIndex: number | null = null;

  onMount(() => {
    loadRanking();
  });

  async function loadRanking() {
    loading = true;
    errorMsg = '';
    data = null;
    expandedIndex = null;
    try {
      data = await fetchRanking(activeTab, { limit: 50 });
    } catch (e: unknown) {
      errorMsg = e instanceof Error ? e.message : 'ランキングの取得に失敗しました';
    } finally {
      loading = false;
    }
  }

  function switchTab(tab: 'weekly' | 'total') {
    if (tab === activeTab) return;
    activeTab = tab;
    loadRanking();
  }

  function toggleExpand(idx: number) {
    expandedIndex = expandedIndex === idx ? null : idx;
  }

  function formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr + 'Z');
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  }
</script>

<div class="ranking-panel">
  <div class="sub-tabs">
    <button class="sub-tab" class:active={activeTab === 'weekly'} on:click={() => switchTab('weekly')}>
      週間
    </button>
    <button class="sub-tab" class:active={activeTab === 'total'} on:click={() => switchTab('total')}>
      全期間
    </button>
    <button class="reload-btn" on:click={loadRanking} disabled={loading} title="再読み込み">
      ↻
    </button>
  </div>

  {#if data?.myBestEntry}
    <div class="my-rank-banner">
      <span class="my-rank-label">あなたの最高順位</span>
      <span class="my-rank-value">#{data.myRank}</span>
      <span class="my-rank-score">{data.myBestEntry.score.toLocaleString()} pt</span>
    </div>
  {/if}

  {#if loading}
    <div class="state-msg">読み込み中...</div>
  {:else if errorMsg}
    <div class="state-msg error">{errorMsg}</div>
    <button class="retry-btn" on:click={loadRanking}>再試行</button>
  {:else if data && data.entries.length === 0}
    <div class="state-msg">まだ記録がありません</div>
  {:else if data}
    <div class="entry-count">{data.total}件中 {data.entries.length}件表示</div>
    <div class="ranking-list">
      {#each data.entries as entry, idx}
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
        <div
          class="ranking-entry"
          class:own={entry.isOwn}
          class:top1={entry.rank === 1}
          class:top3={entry.rank <= 3}
          on:click={() => toggleExpand(idx)}
        >
          <div class="entry-main">
            <span class="rank" class:gold={entry.rank === 1} class:silver={entry.rank === 2} class:bronze={entry.rank === 3}>
              {entry.rank}
            </span>
            <div class="entry-info">
              <span class="nickname">{entry.nickname}</span>
              <span class="entry-meta">
                {ENDING_LABELS[entry.endingType] ?? entry.endingType}
                · {entry.finalDay}日目
                · {formatDate(entry.submittedAt)}
              </span>
            </div>
            <span class="score">{entry.score.toLocaleString()}</span>
          </div>

          {#if expandedIndex === idx}
            <div class="entry-detail">
              <div class="bd-grid">
                {#each BD_LABELS as [key, label]}
                  <span class="bd-label">{label}</span>
                  <span class="bd-value">{(entry.breakdown[key as keyof typeof entry.breakdown] ?? 0).toLocaleString()}</span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .ranking-panel {
    padding: 0;
  }

  .sub-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 1rem;
    align-items: center;
  }

  .sub-tab {
    padding: 0.4rem 1rem;
    background: transparent;
    border: 1px solid #3a3a5a;
    color: #808090;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .sub-tab:first-child {
    border-radius: 4px 0 0 4px;
  }

  .sub-tab:nth-child(2) {
    border-radius: 0 4px 4px 0;
    border-left: none;
  }

  .sub-tab.active {
    background: rgba(201, 169, 89, 0.15);
    color: #f4e4bc;
    border-color: #c9a959;
  }

  .reload-btn {
    margin-left: auto;
    padding: 0.3rem 0.6rem;
    background: transparent;
    border: 1px solid #3a3a5a;
    border-radius: 4px;
    color: #808090;
    cursor: pointer;
    font-size: 1.1rem;
  }

  .reload-btn:hover:not(:disabled) {
    color: #c0c0d0;
    border-color: #5a5a7a;
  }

  .reload-btn:disabled {
    opacity: 0.4;
  }

  .my-rank-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    background: rgba(201, 169, 89, 0.1);
    border: 1px solid rgba(201, 169, 89, 0.3);
    border-radius: 6px;
    margin-bottom: 0.75rem;
  }

  .my-rank-label {
    color: #c9a959;
    font-size: 0.85rem;
  }

  .my-rank-value {
    font-size: 1.1rem;
    font-weight: bold;
    color: #f0c040;
  }

  .my-rank-score {
    margin-left: auto;
    color: #e0e0f0;
    font-size: 0.9rem;
    font-variant-numeric: tabular-nums;
  }

  .state-msg {
    color: #808090;
    text-align: center;
    padding: 2rem 0;
    font-size: 0.9rem;
  }

  .state-msg.error {
    color: #e07060;
  }

  .retry-btn {
    display: block;
    margin: 0 auto;
    padding: 0.4rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #c0c0d0;
    cursor: pointer;
  }

  .entry-count {
    color: #606080;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
    text-align: right;
  }

  .ranking-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .ranking-entry {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid #3a3a5a;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .ranking-entry:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .ranking-entry.own {
    border-color: rgba(201, 169, 89, 0.4);
    background: rgba(201, 169, 89, 0.06);
  }

  .ranking-entry.top1 {
    border-color: rgba(240, 192, 64, 0.5);
  }

  .entry-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .rank {
    font-size: 1rem;
    font-weight: bold;
    color: #808090;
    min-width: 2rem;
    text-align: center;
    flex-shrink: 0;
  }

  .rank.gold { color: #f0c040; }
  .rank.silver { color: #c0c0d0; }
  .rank.bronze { color: #cd8032; }

  .entry-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .nickname {
    color: #e0e0f0;
    font-weight: bold;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .entry-meta {
    color: #707088;
    font-size: 0.75rem;
  }

  .score {
    font-size: 1rem;
    font-weight: bold;
    color: #f0c040;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .entry-detail {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
  }

  .bd-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.15rem 1rem;
    font-size: 0.8rem;
  }

  .bd-label {
    color: #808090;
  }

  .bd-value {
    color: #c0c0d0;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
</style>
