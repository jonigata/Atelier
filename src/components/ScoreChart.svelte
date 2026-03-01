<script lang="ts">
  import type { DailyScoreEntry } from '$lib/models/types';
  import type { PastGameScoreRecord } from '$lib/services/pastScores';

  export let currentScores: DailyScoreEntry[];
  export let pastGames: PastGameScoreRecord[];
  export let currentDay: number = 1;

  const WIDTH = 560;
  const HEIGHT = 280;
  const PAD = { top: 20, right: 20, bottom: 36, left: 56 };
  const chartW = WIDTH - PAD.left - PAD.right;
  const chartH = HEIGHT - PAD.top - PAD.bottom;

  // スケールモード: 'today' = 今日が右端, 'full' = 全体(336日)
  let scaleMode: 'today' | 'full' = 'today';

  // X軸: 左端=1日目, 右端=xEnd日目
  $: xEnd = scaleMode === 'full'
    ? Math.max(336, ...pastGames.map(g => g.finalDay))
    : Math.max(currentDay, 2); // 最低2日で0除算回避

  // 表示範囲内のスコアだけでY軸を計算
  $: visibleTotals = [
    ...currentScores.filter(s => s.day <= xEnd).map(s => s.total),
    ...pastGames.flatMap(g => g.dailyScores.filter(s => s.day <= xEnd).map(s => s.total)),
  ];

  $: rawMax = Math.max(1, ...visibleTotals);

  $: yMax = (() => {
    if (rawMax <= 100) return 100;
    const mag = Math.pow(10, Math.floor(Math.log10(rawMax)));
    return Math.ceil(rawMax / mag) * mag;
  })();

  // リアクティブ関数（xEnd/yMax変化時にSvelteが再評価するよう$:で宣言）
  $: sx = (day: number): number => {
    return PAD.left + ((day - 1) / (xEnd - 1)) * chartW;
  };

  $: sy = (score: number): number => {
    return PAD.top + chartH - (score / yMax) * chartH;
  };

  $: polyline = (entries: DailyScoreEntry[]): string => {
    return entries
      .filter(e => e.day <= xEnd)
      .map(e => `${sx(e.day)},${sy(e.total)}`)
      .join(' ');
  };

  $: yTicks = Array.from({ length: 6 }, (_, i) => Math.round((yMax / 5) * i));

  // X軸目盛り: 表示範囲に応じて間隔を調整
  $: xRange = xEnd - 1;
  $: xInterval = xRange <= 14 ? 7 : 28;
  $: xTicks = Array.from(
    { length: Math.floor(xEnd / xInterval) + 1 },
    (_, i) => i * xInterval
  ).filter(d => d >= 1 && d <= xEnd);

  const pastColors = [
    'rgba(130, 130, 190, 0.4)',
    'rgba(110, 160, 170, 0.35)',
    'rgba(160, 130, 150, 0.35)',
    'rgba(130, 170, 140, 0.35)',
    'rgba(170, 140, 130, 0.35)',
    'rgba(140, 140, 180, 0.3)',
    'rgba(120, 150, 160, 0.3)',
    'rgba(150, 120, 140, 0.3)',
    'rgba(120, 160, 130, 0.3)',
    'rgba(160, 130, 120, 0.3)',
  ];

  // 過去データの表示用フィルタ（表示範囲内にデータがあるもの）
  $: visiblePastGames = pastGames.filter(g =>
    g.dailyScores.some(s => s.day <= xEnd)
  );
</script>

<div class="chart-wrap">
  <!-- スケール切り替え -->
  <div class="scale-toggle">
    <button
      class="scale-btn" class:active={scaleMode === 'today'}
      on:click={() => scaleMode = 'today'}
    >今日まで</button>
    <button
      class="scale-btn" class:active={scaleMode === 'full'}
      on:click={() => scaleMode = 'full'}
    >全体</button>
  </div>

  <svg viewBox="0 0 {WIDTH} {HEIGHT}" class="score-chart">
    <!-- グリッド線 -->
    {#each yTicks as tick}
      <line
        x1={PAD.left} y1={sy(tick)}
        x2={WIDTH - PAD.right} y2={sy(tick)}
        stroke="rgba(255,255,255,0.07)" stroke-width="1"
      />
      <text
        x={PAD.left - 6} y={sy(tick) + 3}
        fill="#707080" font-size="9" text-anchor="end"
      >{tick.toLocaleString()}</text>
    {/each}

    <!-- X軸目盛り -->
    {#each xTicks as day}
      <line
        x1={sx(day)} y1={PAD.top}
        x2={sx(day)} y2={PAD.top + chartH}
        stroke="rgba(255,255,255,0.04)" stroke-width="1"
      />
      <text
        x={sx(day)} y={HEIGHT - PAD.bottom + 16}
        fill="#707080" font-size="9" text-anchor="middle"
      >{day}日</text>
    {/each}

    <!-- 軸 -->
    <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH}
      stroke="rgba(255,255,255,0.15)" stroke-width="1" />
    <line x1={PAD.left} y1={PAD.top + chartH} x2={WIDTH - PAD.right} y2={PAD.top + chartH}
      stroke="rgba(255,255,255,0.15)" stroke-width="1" />

    <!-- 過去ゲームの線 -->
    {#each visiblePastGames as game, i}
      {@const pts = polyline(game.dailyScores)}
      {#if pts.includes(',')}
        <polyline
          points={pts}
          fill="none"
          stroke={pastColors[i % pastColors.length]}
          stroke-width="1.5"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      {/if}
    {/each}

    <!-- 今回のゲーム（金色太線） -->
    {#if currentScores.length >= 2}
      <polyline
        points={polyline(currentScores)}
        fill="none"
        stroke="#c9a959"
        stroke-width="2.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
      {@const last = currentScores[currentScores.length - 1]}
      <circle
        cx={sx(last.day)} cy={sy(last.total)}
        r="3.5" fill="#f0c040" stroke="#c9a959" stroke-width="1"
      />
    {:else if currentScores.length === 1}
      {@const pt = currentScores[0]}
      <circle
        cx={sx(pt.day)} cy={sy(pt.total)}
        r="3.5" fill="#f0c040" stroke="#c9a959" stroke-width="1"
      />
    {/if}
  </svg>

  <!-- 凡例 -->
  <div class="legend">
    <div class="legend-item">
      <span class="legend-line" style="background: #c9a959; height: 2.5px;"></span>
      <span>今回</span>
    </div>
    {#if pastGames.length > 0}
      <div class="legend-item">
        <span class="legend-line" style="background: rgba(130,130,190,0.6); height: 1.5px;"></span>
        <span>過去 ({pastGames.length}回)</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .chart-wrap {
    margin-top: 0.75rem;
  }

  .scale-toggle {
    display: flex;
    justify-content: flex-end;
    gap: 0;
    margin-bottom: 0.5rem;
  }

  .scale-btn {
    padding: 0.25rem 0.75rem;
    font-size: 0.8rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    color: #808090;
    cursor: pointer;
    transition: all 0.15s;
  }

  .scale-btn:first-child {
    border-radius: 4px 0 0 4px;
  }

  .scale-btn:last-child {
    border-radius: 0 4px 4px 0;
    margin-left: -1px;
  }

  .scale-btn.active {
    background: rgba(201, 169, 89, 0.15);
    border-color: #c9a959;
    color: #f4e4bc;
    position: relative;
    z-index: 1;
  }

  .score-chart {
    width: 100%;
    height: auto;
    display: block;
  }

  .legend {
    display: flex;
    gap: 1.25rem;
    justify-content: center;
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: #a0a0b0;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .legend-line {
    display: inline-block;
    width: 20px;
    border-radius: 1px;
  }
</style>
