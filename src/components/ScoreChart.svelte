<script lang="ts">
  import type { DailyScoreEntry } from '$lib/models/types';
  import type { PastGameScoreRecord } from '$lib/services/pastScores';

  export let currentScores: DailyScoreEntry[];
  export let pastGames: PastGameScoreRecord[];
  export let bestGame: PastGameScoreRecord | null = null;
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
    ? Math.max(336, ...pastGames.map(g => g.finalDay), bestGame?.finalDay ?? 0)
    : Math.max(currentDay, 2); // 最低2日で0除算回避

  // Y軸はBESTを基準に計算（常にBESTが収まるスケール）
  $: rawMax = Math.max(
    1,
    ...currentScores.filter(s => s.day <= xEnd).map(s => s.total),
    ...(bestGame ? bestGame.dailyScores.filter(s => s.day <= xEnd).map(s => s.total) : []),
  );

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

  // 過去ゲームの色: 新しいほど明るく（pastGamesは古い順）
  $: pastLineStyle = (idx: number): { color: string; width: number } => {
    const count = pastGames.length;
    // 0(最古)→1(最新) の正規化値
    const t = count <= 1 ? 1 : idx / (count - 1);
    const opacity = 0.15 + t * 0.45; // 0.15〜0.6
    const brightness = 140 + Math.round(t * 60); // 140〜200
    return {
      color: `rgba(${brightness}, ${brightness - 10}, ${brightness + 30}, ${opacity})`,
      width: 1.2 + t * 0.6, // 1.2〜1.8
    };
  };

  // bestGameが表示中のpastGamesに含まれていればそのインデックス、なければ-1
  $: bestPastIdx = (() => {
    if (!bestGame) return -1;
    return pastGames.findIndex(g =>
      g.finishedAt === bestGame!.finishedAt && g.finalScore === bestGame!.finalScore
    );
  })();

  // bestGameが表示10件に含まれない場合、別途描画するか
  $: bestGameSeparate = bestGame && bestPastIdx === -1;

  // 過去データの表示用フィルタ（表示範囲内にデータがあるもの）
  $: visiblePastGames = pastGames.map((g, i) => ({ game: g, originalIdx: i }))
    .filter(({ game }) => game.dailyScores.some(s => s.day <= xEnd));

  // === 査察項目サブチャート ===
  let showInspection = false;

  const INS_HEIGHT = 160;
  const INS_PAD = { top: 12, right: 20, bottom: 28, left: 56 };
  const insChartW = WIDTH - INS_PAD.left - INS_PAD.right;
  const insChartH = INS_HEIGHT - INS_PAD.top - INS_PAD.bottom;

  // inspectionデータがあるエントリのみ
  $: insEntries = currentScores.filter(e => e.day <= xEnd && e.inspection);

  // Y軸最大値
  $: insYMax = (() => {
    let max = 1;
    for (const e of insEntries) {
      const ins = e.inspection!;
      max = Math.max(max, ins.album, ins.quests, ins.level, ins.villageDev, ins.reputation);
    }
    return Math.ceil(max / 5) * 5 || 5;
  })();

  $: insSx = (day: number): number => {
    return INS_PAD.left + ((day - 1) / (xEnd - 1)) * insChartW;
  };

  $: insSy = (val: number): number => {
    return INS_PAD.top + insChartH - (val / insYMax) * insChartH;
  };

  const inspectionKeys = [
    { key: 'album' as const, label: 'アルバム', color: '#82b1ff' },
    { key: 'quests' as const, label: '依頼', color: '#81c784' },
    { key: 'level' as const, label: '錬金Lv', color: '#ffc107' },
    { key: 'villageDev' as const, label: '村発展Lv', color: '#ce93d8' },
    { key: 'reputation' as const, label: '名声Lv', color: '#ff9800' },
  ];

  $: insPolyline = (key: 'album' | 'quests' | 'level' | 'villageDev' | 'reputation'): string => {
    return insEntries
      .map(e => `${insSx(e.day)},${insSy(e.inspection![key])}`)
      .join(' ');
  };

  $: insYTicks = Array.from({ length: 5 }, (_, i) => Math.round((insYMax / 4) * i));
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
    {#each visiblePastGames as { game, originalIdx }}
      {@const pts = polyline(game.dailyScores)}
      {@const style = pastLineStyle(originalIdx)}
      {@const isBest = originalIdx === bestPastIdx}
      {#if pts.includes(',')}
        <polyline
          points={pts}
          fill="none"
          stroke={isBest ? 'rgba(180, 210, 255, 0.7)' : style.color}
          stroke-width={isBest ? 2.2 : style.width}
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        {#if isBest}
          {@const lastEntry = game.dailyScores.filter(e => e.day <= xEnd).slice(-1)[0]}
          {#if lastEntry}
            <circle
              cx={sx(lastEntry.day)} cy={sy(lastEntry.total)}
              r="3" fill="rgba(180, 210, 255, 0.8)" stroke="rgba(220, 230, 255, 0.9)" stroke-width="0.8"
            />
            <text
              x={sx(lastEntry.day)} y={sy(lastEntry.total) - 6}
              fill="rgba(200, 220, 255, 0.8)" font-size="7.5" text-anchor="middle"
            >BEST</text>
          {/if}
        {/if}
      {/if}
    {/each}

    <!-- bestGameが表示10件に含まれない場合、別途描画 -->
    {#if bestGameSeparate && bestGame}
      {@const pts = polyline(bestGame.dailyScores)}
      {#if pts.includes(',')}
        <polyline
          points={pts}
          fill="none"
          stroke="rgba(180, 210, 255, 0.7)"
          stroke-width="2.2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        {@const lastEntry = bestGame.dailyScores.filter(e => e.day <= xEnd).slice(-1)[0]}
        {#if lastEntry}
          <circle
            cx={sx(lastEntry.day)} cy={sy(lastEntry.total)}
            r="3" fill="rgba(180, 210, 255, 0.8)" stroke="rgba(220, 230, 255, 0.9)" stroke-width="0.8"
          />
          <text
            x={sx(lastEntry.day)} y={sy(lastEntry.total) - 6}
            fill="rgba(200, 220, 255, 0.8)" font-size="7.5" text-anchor="middle"
          >BEST</text>
        {/if}
      {/if}
    {/if}

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
        <span class="legend-line" style="background: rgba(180,180,210,0.5); height: 1.5px;"></span>
        <span>過去 ({pastGames.length}回)</span>
      </div>
      {#if bestGame}
        <div class="legend-item">
          <span class="legend-line" style="background: rgba(180,210,255,0.7); height: 2.2px;"></span>
          <span>BEST ({bestGame.finalScore.toLocaleString()}pt)</span>
        </div>
      {/if}
    {/if}
  </div>

  <!-- 査察項目サブチャート -->
  {#if insEntries.length >= 2}
    <button class="inspection-toggle" on:click={() => showInspection = !showInspection}>
      {showInspection ? '▼' : '▶'} 査察項目の推移
    </button>

    {#if showInspection}
      <svg viewBox="0 0 {WIDTH} {INS_HEIGHT}" class="score-chart inspection-chart">
        <!-- グリッド線 -->
        {#each insYTicks as tick}
          <line
            x1={INS_PAD.left} y1={insSy(tick)}
            x2={WIDTH - INS_PAD.right} y2={insSy(tick)}
            stroke="rgba(255,255,255,0.07)" stroke-width="1"
          />
          <text
            x={INS_PAD.left - 6} y={insSy(tick) + 3}
            fill="#707080" font-size="8" text-anchor="end"
          >{tick}</text>
        {/each}

        <!-- 軸 -->
        <line x1={INS_PAD.left} y1={INS_PAD.top} x2={INS_PAD.left} y2={INS_PAD.top + insChartH}
          stroke="rgba(255,255,255,0.15)" stroke-width="1" />
        <line x1={INS_PAD.left} y1={INS_PAD.top + insChartH} x2={WIDTH - INS_PAD.right} y2={INS_PAD.top + insChartH}
          stroke="rgba(255,255,255,0.15)" stroke-width="1" />

        <!-- 各査察項目の線 -->
        {#each inspectionKeys as { key, color }}
          {@const pts = insPolyline(key)}
          {#if pts.includes(',')}
            <polyline
              points={pts}
              fill="none"
              stroke={color}
              stroke-width="1.8"
              stroke-linejoin="round"
              stroke-linecap="round"
              opacity="0.85"
            />
          {/if}
        {/each}
      </svg>

      <div class="legend inspection-legend">
        {#each inspectionKeys as { label, color }}
          <div class="legend-item">
            <span class="legend-line" style="background: {color}; height: 2px;"></span>
            <span>{label}</span>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
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

  .inspection-toggle {
    display: block;
    margin-top: 0.75rem;
    padding: 0.3rem 0.6rem;
    background: none;
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #a0a0b0;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .inspection-toggle:hover {
    border-color: #c9a959;
    color: #f4e4bc;
  }

  .inspection-chart {
    margin-top: 0.5rem;
  }

  .inspection-legend {
    flex-wrap: wrap;
    gap: 0.75rem;
    font-size: 0.75rem;
  }
</style>
