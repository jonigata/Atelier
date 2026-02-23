<script lang="ts">
  import { getGradeForValue } from '$lib/data/inspection';
  import type { InspectionDef, InspectionCriterion, InspectionGrade } from '$lib/data/inspection';
  import { calcTotalExpForLevel } from '$lib/data/balance';

  import { onMount } from 'svelte';

  // props: 親から全データを受け取る
  export let inspection: InspectionDef;
  export let values: Record<string, number>; // { level: 5, quests: 10, ... }
  export let expValues: Record<string, number> = {}; // 生XP値（ビジュアル進捗用）
  export let daysUntil: number;
  export let firstReveal: boolean = false;

  $: urgency = daysUntil <= 7 ? 'red' : daysUntil <= 21 ? 'yellow' : 'green';

  let expanded = false;
  let revealing = false;

  onMount(() => {
    if (firstReveal) {
      revealing = true;
    }
  });

  const gradeList: InspectionGrade[] = ['D', 'C', 'B', 'A', 'S'];

  const gradeColors: Record<InspectionGrade, string> = {
    D: '#606068', // 鉄
    C: '#b87333', // 銅
    B: '#c0c0c0', // 銀
    A: '#ffd700', // 金
    S: '#74c0fc', // 虹（フォールバック）
  };

  const rainbowGrad = 'linear-gradient(135deg, #ff6b6b, #ffd700, #69db7c, #74c0fc, #da77f2)';

  function gradeBg(grade: InspectionGrade): string {
    if (grade === 'S') return rainbowGrad;
    return gradeColors[grade];
  }

  function getCriterionInfo(
    criterion: InspectionCriterion,
    currentValues: Record<string, number>,
    currentExpValues: Record<string, number>
  ) {
    const value = currentValues[criterion.key] ?? 0;
    const grade = getGradeForValue(criterion.thresholds, value);
    const met = grade !== 'D';
    const maxVal = criterion.thresholds.S;

    // 生XPがある場合はXPベースで滑らかな進捗を計算
    const rawExp = currentExpValues[criterion.key];
    let progress: number;
    if (rawExp !== undefined) {
      const expMax = calcTotalExpForLevel(maxVal);
      progress = expMax > 0 ? Math.min(1, rawExp / expMax) : 0;
    } else {
      progress = maxVal > 0 ? Math.min(1, value / maxVal) : 0;
    }

    return { value, grade, met, progress, maxVal };
  }

  $: allMet = inspection.criteria.every((c) => getCriterionInfo(c, values, expValues).met);

  $: metCount = inspection.criteria.filter((c) => getCriterionInfo(c, values, expValues).met).length;

  // ── ポーション瓶 (level) ──
  // 液面の高さを progress に応じて変化
  function potionLiquidY(progress: number): number {
    // viewBox 0 0 60 80: 瓶の底=70, 瓶の口=18, 液面範囲=52px
    return 70 - progress * 52;
  }

  function potionColor(grade: InspectionGrade): string {
    const colors: Record<InspectionGrade, string> = {
      D: '#505058', // 鉄
      C: '#a06828', // 銅
      B: '#a0a0b0', // 銀
      A: '#d4a800', // 金
      S: '#5a9fd4', // 虹
    };
    return colors[grade];
  }

  function potionGlow(grade: InspectionGrade): string {
    const colors: Record<InspectionGrade, string> = {
      D: 'rgba(96, 96, 104, 0.3)',    // 鉄
      C: 'rgba(184, 115, 51, 0.4)',   // 銅
      B: 'rgba(192, 192, 192, 0.5)',  // 銀
      A: 'rgba(255, 215, 0, 0.5)',    // 金
      S: 'rgba(116, 192, 252, 0.6)',  // 虹
    };
    return colors[grade];
  }

  // ── 星 (quests) ──
  // S基準の数だけ星を並べ、達成分だけ色付き。等級ゾーンで色が変わる
  // 銅(~D) → 銀(~C) → 金(~B) → 虹(A~S)
  function getStarColor(starIndex: number, criterion: InspectionCriterion): string {
    const i = starIndex + 1; // 1-based
    if (i <= criterion.thresholds.D) return '#606068'; // 鉄
    if (i <= criterion.thresholds.C) return '#b87333'; // 銅
    if (i <= criterion.thresholds.B) return '#c0c0c0'; // 銀
    if (i <= criterion.thresholds.A) return '#ffd700'; // 金
    return 'url(#rainbow-grad)'; // 虹
  }

  function getStarStroke(starIndex: number, criterion: InspectionCriterion): string {
    const i = starIndex + 1;
    if (i <= criterion.thresholds.D) return '#404048'; // 鉄
    if (i <= criterion.thresholds.C) return '#8b5a2b'; // 銅
    if (i <= criterion.thresholds.B) return '#909090'; // 銀
    if (i <= criterion.thresholds.A) return '#daa520'; // 金
    return '#ff69b4'; // 虹
  }

  function getStarOverlap(total: number): number {
    if (total <= 8) return 0;
    if (total <= 15) return -4;
    if (total <= 25) return -7;
    if (total <= 35) return -9;
    return -11;
  }

  // ── 村 (villageDev) ──
  // 発展度に応じて画像が変わる（7段階）
  function getVillageImage(value: number, maxVal: number): string {
    const ratio = value / maxVal;
    if (ratio >= 0.85) return '/images/village/village_7.png';
    if (ratio >= 0.70) return '/images/village/village_6.png';
    if (ratio >= 0.55) return '/images/village/village_5.png';
    if (ratio >= 0.40) return '/images/village/village_4.png';
    if (ratio >= 0.25) return '/images/village/village_3.png';
    if (ratio >= 0.10) return '/images/village/village_2.png';
    return '/images/village/village_1.png';
  }

  // ── 人々 (reputation) ──
  // 名声の進捗（XPベース）に応じて人アイコンが増える
  function getPeopleCount(progress: number): number {
    if (progress >= 0.9) return 7;
    if (progress >= 0.7) return 6;
    if (progress >= 0.55) return 5;
    if (progress >= 0.4) return 4;
    if (progress >= 0.25) return 3;
    if (progress >= 0.1) return 2;
    if (progress > 0) return 1;
    return 0;
  }

  // ── アルバム (album) ──
  // タイルグリッドで収集率を表現。S基準を24分割し、埋まったタイルを等級色で表示
  const ALBUM_TILES = 24;

  function getAlbumTileColor(tileIndex: number, litCount: number, grade: InspectionGrade): string {
    if (tileIndex >= litCount) return 'rgba(255,255,255,0.04)';
    if (grade === 'S') return rainbowPalette[tileIndex % rainbowPalette.length];
    return gradeColors[grade];
  }

  const rainbowPalette = ['#ff6b6b', '#ffa94d', '#ffd700', '#69db7c', '#74c0fc', '#b197fc', '#da77f2'];

  function getPersonColor(index: number, grade: InspectionGrade): string {
    if (grade === 'S') return rainbowPalette[index % rainbowPalette.length];
    return gradeColors[grade];
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="inspection-tracker"
  class:all-met={allMet}
  class:expanded
  class:revealing
  on:click={() => expanded = !expanded}
  on:animationend={() => { revealing = false; }}
  role="button"
  tabindex="0"
>
  <div class="tracker-header">
    <div class="tracker-title">
      <span class="quarter-badge">{inspection.month}月末</span>
      <span class="title-text">査察: {inspection.title}</span>
    </div>
    <div class="tracker-meta">
      <span class="met-count" class:complete={allMet}>
        {metCount}/{inspection.criteria.length}
      </span>
      <span class="days-until {urgency}">あと{daysUntil}日</span>
    </div>
  </div>

  <!-- 共有SVGグラデーション定義 -->
  <svg width="0" height="0" style="position:absolute">
    <defs>
      <linearGradient id="rainbow-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff6b6b" />
        <stop offset="25%" stop-color="#ffd700" />
        <stop offset="50%" stop-color="#69db7c" />
        <stop offset="75%" stop-color="#74c0fc" />
        <stop offset="100%" stop-color="#da77f2" />
      </linearGradient>
    </defs>
  </svg>

  <div class="criteria-grid">
    {#each inspection.criteria as criterion}
        {@const info = getCriterionInfo(criterion, values, expValues)}

        {#if criterion.key === 'level'}
          <!-- ═══ 錬金Lv: ポーション瓶 ═══ -->
          <div class="criterion-card potion-card">
            <div class="criterion-visual">
            <div class="potion-container">
              <svg viewBox="0 0 60 80" class="potion-svg">
                <defs>
                  <clipPath id="potion-clip">
                    <!-- 瓶の内部形状 -->
                    <path d="M22 18 L22 28 Q10 35 10 48 L10 65 Q10 72 18 72 L42 72 Q50 72 50 65 L50 48 Q50 35 38 28 L38 18 Z"/>
                  </clipPath>
                  {#if info.grade === 'S'}
                    <linearGradient id="liquid-grad-S" x1="0" y1="1" x2="0.5" y2="0">
                      <stop offset="0%" stop-color="#ff6b6b" />
                      <stop offset="25%" stop-color="#ffd700" />
                      <stop offset="50%" stop-color="#69db7c" />
                      <stop offset="75%" stop-color="#74c0fc" />
                      <stop offset="100%" stop-color="#da77f2" />
                    </linearGradient>
                  {:else}
                    <linearGradient id="liquid-grad-{info.grade}" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stop-color={potionColor(info.grade)} />
                      <stop offset="100%" stop-color={potionColor(info.grade)} stop-opacity="0.6" />
                    </linearGradient>
                  {/if}
                </defs>
                <!-- 瓶の輪郭 -->
                <path d="M24 8 L24 18 L22 18 L22 28 Q10 35 10 48 L10 65 Q10 72 18 72 L42 72 Q50 72 50 65 L50 48 Q50 35 38 28 L38 18 L36 18 L36 8 Z"
                  fill="none" stroke="rgba(200, 200, 220, 0.4)" stroke-width="1.5"/>
                <!-- 瓶の口のリング -->
                <rect x="22" y="6" width="16" height="4" rx="2" fill="rgba(200, 200, 220, 0.3)"/>
                <!-- 液体 (clipPathで瓶内部に収める) -->
                <g clip-path="url(#potion-clip)">
                  <rect x="8" y={potionLiquidY(info.progress)} width="44" height={80 - potionLiquidY(info.progress)}
                    fill="url(#liquid-grad-{info.grade})" />
                  <!-- 液面のハイライト -->
                  <ellipse cx="30" cy={potionLiquidY(info.progress)} rx="18" ry="3"
                    fill="rgba(255,255,255,0.15)"/>
                  <!-- 泡 (S等級のみ) -->
                  {#if info.grade === 'S'}
                    <circle cx="20" cy={potionLiquidY(info.progress) + 8} r="2" fill="rgba(255,255,255,0.3)"/>
                    <circle cx="35" cy={potionLiquidY(info.progress) + 14} r="1.5" fill="rgba(255,255,255,0.25)"/>
                    <circle cx="28" cy={potionLiquidY(info.progress) + 20} r="2.5" fill="rgba(255,255,255,0.2)"/>
                  {/if}
                </g>
                <!-- 瓶の光沢 -->
                <path d="M16 35 Q14 50 16 65" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
              </svg>
              <!-- グロー -->
              {#if info.grade !== 'D'}
                <div class="potion-glow" style="background: radial-gradient(ellipse, {potionGlow(info.grade)}, transparent 70%)"></div>
              {/if}
            </div>
            </div>
            <div class="criterion-label">
              <span class="criterion-name">錬金Lv</span>
              <span class="criterion-value">現在Lv.{info.value}</span>
              <span class="grade-badge" style="background: {gradeBg(info.grade)}">{info.grade}</span>
              <span class="criterion-target">目標Lv.{criterion.thresholds.S}</span>
            </div>
            {#if expanded}
              <div class="thresholds">
                {#each gradeList as g}
                  <span class:active={info.value >= criterion.thresholds[g]}
                    style="color: {info.value >= criterion.thresholds[g] ? gradeColors[g] : '#404050'}"
                  >{g}:Lv.{criterion.thresholds[g]}</span>
                {/each}
              </div>
            {/if}
          </div>

        {:else if criterion.key === 'quests'}
          <!-- ═══ 依頼: S基準の数だけ星、達成分が色付き ═══ -->
          {@const totalStars = criterion.thresholds.S}
          {@const overlap = getStarOverlap(totalStars)}
          <div class="criterion-card stars-card">
            <div class="criterion-visual">
            <div class="stars-container">
              {#each Array(totalStars) as _, i}
                {@const lit = i < info.value}
                <svg viewBox="0 0 24 24" class="quest-star" class:lit
                  style="margin-left: {i === 0 ? 0 : overlap}px; z-index: {i}"
                >
                  <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z"
                    fill={lit ? getStarColor(i, criterion) : 'rgba(255,255,255,0.06)'}
                    stroke={lit ? getStarStroke(i, criterion) : 'rgba(255,255,255,0.1)'}
                    stroke-width="0.8"
                  />
                </svg>
              {/each}
            </div>
            </div>
            <div class="criterion-label">
              <span class="criterion-name">依頼</span>
              <span class="criterion-value">達成済み{info.value}件</span>
              <span class="grade-badge" style="background: {gradeBg(info.grade)}">{info.grade}</span>
              <span class="criterion-target">目標{totalStars}件</span>
            </div>
            {#if expanded}
              <div class="thresholds">
                {#each gradeList as g}
                  <span class:active={info.value >= criterion.thresholds[g]}
                    style="color: {info.value >= criterion.thresholds[g] ? gradeColors[g] : '#404050'}"
                  >{g}:{criterion.thresholds[g]}件</span>
                {/each}
              </div>
            {/if}
          </div>

        {:else if criterion.key === 'villageDev'}
          <!-- ═══ 村発展: 村の画像 + バー ═══ -->
          {@const villageImage = getVillageImage(info.value, info.maxVal)}
          <div class="criterion-card village-card">
            <div class="criterion-visual">
              <div class="village-visual-inner">
                <div class="village-scene">
                  <img src={villageImage} alt="村の発展" class="village-img" />
                </div>
                <div class="village-bar">
                  <div class="village-bar-fill" style="width: {info.progress * 100}%; background: {info.grade === 'S' ? rainbowGrad : `linear-gradient(90deg, #4a6a3a, ${gradeColors[info.grade]})`}"></div>
                </div>
              </div>
            </div>
            <div class="criterion-label">
              <span class="criterion-name">村発展</span>
              <span class="criterion-value">現在Lv.{info.value}</span>
              <span class="grade-badge" style="background: {gradeBg(info.grade)}">{info.grade}</span>
              <span class="criterion-target">目標Lv.{criterion.thresholds.S}</span>
            </div>
            {#if expanded}
              <div class="thresholds">
                {#each gradeList as g}
                  <span class:active={info.value >= criterion.thresholds[g]}
                    style="color: {info.value >= criterion.thresholds[g] ? gradeColors[g] : '#404050'}"
                  >{g}:{criterion.thresholds[g]}</span>
                {/each}
              </div>
            {/if}
          </div>

        {:else if criterion.key === 'reputation'}
          <!-- ═══ 名声: 人々アイコン ═══ -->
          {@const peopleCount = getPeopleCount(info.progress)}
          <div class="criterion-card people-card">
            <div class="criterion-visual">
              <div class="people-container">
                {#each Array(7) as _, i}
                  <div class="person" class:active={i < peopleCount}>
                    <svg viewBox="0 0 20 28" class="person-svg">
                      <!-- 頭 -->
                      <circle cx="10" cy="7" r="5"
                        fill={i < peopleCount ? getPersonColor(i, info.grade) : 'rgba(255,255,255,0.08)'}
                      />
                      <!-- 体 -->
                      <path d="M4 28 L4 18 Q4 13 10 13 Q16 13 16 18 L16 28"
                        fill={i < peopleCount ? getPersonColor(i, info.grade) : 'rgba(255,255,255,0.05)'}
                        opacity={i < peopleCount ? 0.7 : 1}
                      />
                    </svg>
                  </div>
                {/each}
              </div>
            </div>
            <div class="criterion-label">
              <span class="criterion-name">名声</span>
              <span class="criterion-value">現在Lv.{info.value}</span>
              <span class="grade-badge" style="background: {gradeBg(info.grade)}">{info.grade}</span>
              <span class="criterion-target">目標Lv.{criterion.thresholds.S}</span>
            </div>
            {#if expanded}
              <div class="thresholds">
                {#each gradeList as g}
                  <span class:active={info.value >= criterion.thresholds[g]}
                    style="color: {info.value >= criterion.thresholds[g] ? gradeColors[g] : '#404050'}"
                  >{g}:Lv.{criterion.thresholds[g]}</span>
                {/each}
              </div>
            {/if}
          </div>

        {:else if criterion.key === 'album'}
          <!-- ═══ アルバム: タイルグリッド ═══ -->
          {@const litCount = Math.round(info.progress * ALBUM_TILES)}
          <div class="criterion-card album-card">
            <div class="criterion-visual">
              <div class="album-grid">
                {#each Array(ALBUM_TILES) as _, i}
                  <div
                    class="album-tile"
                    class:lit={i < litCount}
                    style="background: {getAlbumTileColor(i, litCount, info.grade)};
                           {i < litCount && info.grade !== 'S' ? `box-shadow: inset 0 0 4px ${gradeColors[info.grade]}44` : ''}
                           {i < litCount && info.grade === 'S' ? `box-shadow: 0 0 4px ${rainbowPalette[i % rainbowPalette.length]}66` : ''}"
                  >
                    {#if i < litCount}
                      <svg viewBox="0 0 12 12" class="tile-icon">
                        <circle cx="6" cy="4" r="2.5" fill="rgba(0,0,0,0.3)"/>
                        <rect x="2" y="7" width="8" height="4" rx="1" fill="rgba(0,0,0,0.2)"/>
                      </svg>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
            <div class="criterion-label">
              <span class="criterion-name">アルバム</span>
              <span class="criterion-value">{info.value}種</span>
              <span class="grade-badge" style="background: {gradeBg(info.grade)}">{info.grade}</span>
              <span class="criterion-target">目標{criterion.thresholds.S}種</span>
            </div>
            {#if expanded}
              <div class="thresholds">
                {#each gradeList as g}
                  <span class:active={info.value >= criterion.thresholds[g]}
                    style="color: {info.value >= criterion.thresholds[g] ? gradeColors[g] : '#404050'}"
                  >{g}:{criterion.thresholds[g]}種</span>
                {/each}
              </div>
            {/if}
          </div>

        {:else}
          <!-- ═══ 汎用: プログレスバー ═══ -->
          <div class="criterion-card generic-card">
            <div class="criterion-visual">
              <div class="generic-visual">
                <div class="generic-value-big" style="color: {gradeColors[info.grade]}">{info.value}</div>
                <div class="generic-bar">
                  <div class="generic-bar-fill" style="width: {info.progress * 100}%; background: {info.grade === 'S' ? rainbowGrad : `linear-gradient(90deg, ${gradeColors[info.grade]}88, ${gradeColors[info.grade]})`}"></div>
                </div>
              </div>
            </div>
            <div class="criterion-label">
              <span class="criterion-name">{criterion.label}</span>
              <span class="criterion-value">{info.value}{criterion.unit}</span>
              <span class="grade-badge" style="background: {gradeBg(info.grade)}">{info.grade}</span>
              <span class="criterion-target">目標{criterion.thresholds.S}{criterion.unit}</span>
            </div>
            {#if expanded}
              <div class="thresholds">
                {#each gradeList as g}
                  <span class:active={info.value >= criterion.thresholds[g]}
                    style="color: {info.value >= criterion.thresholds[g] ? gradeColors[g] : '#404050'}"
                  >{g}:{criterion.thresholds[g]}{criterion.unit}</span>
                {/each}
              </div>
            {/if}
          </div>

        {/if}
      {/each}
    </div>

  {#if !expanded}
    <div class="expand-hint">タップで詳細</div>
  {/if}
</div>

<style>
  .inspection-tracker {
    position: relative;
    background: linear-gradient(135deg, rgba(30, 20, 40, 0.9) 0%, rgba(40, 30, 50, 0.9) 100%);
    border: 2px solid #4a3a5a;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: border-color 0.3s ease;
  }

  .inspection-tracker.revealing {
    animation: revealEntrance 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  @keyframes revealEntrance {
    0% {
      opacity: 0;
      transform: translateY(15px);
      border-color: rgba(201, 169, 89, 0.2);
      box-shadow: 0 0 10px 2px rgba(201, 169, 89, 0.1);
    }
    /* slide in completes + glow peaks together */
    18% {
      opacity: 1;
      transform: translateY(0);
      border-color: #c9a959;
      box-shadow: 0 0 30px 8px rgba(201, 169, 89, 0.45), inset 0 0 20px rgba(201, 169, 89, 0.12);
    }
    /* Phase 3: smooth decay to normal (no plateau) */
    100% {
      opacity: 1;
      transform: translateY(0);
      border-color: #4a3a5a;
      box-shadow: none;
    }
  }

  .inspection-tracker:hover {
    border-color: #6a5a7a;
  }

  .inspection-tracker.all-met {
    border-color: rgba(76, 175, 80, 0.5);
    background: linear-gradient(135deg, rgba(20, 35, 20, 0.9) 0%, rgba(30, 45, 30, 0.9) 100%);
  }

  .tracker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .tracker-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .quarter-badge {
    padding: 0.15rem 0.5rem;
    background: rgba(201, 169, 89, 0.3);
    border: 1px solid #c9a959;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    color: #c9a959;
  }

  .title-text {
    font-size: 0.95rem;
    font-weight: bold;
    color: #e0e0f0;
  }

  .tracker-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .met-count {
    font-size: 0.85rem;
    color: #a0a0b0;
    font-weight: bold;
  }

  .met-count.complete {
    color: #81c784;
  }

  .days-until {
    font-size: 0.9rem;
    font-weight: bold;
  }

  .days-until.green { color: #81c784; }
  .days-until.yellow { color: #ffd54f; }
  .days-until.red { color: #ff8a65; }

  /* ── グリッドレイアウト ── */
  .criteria-grid {
    display: flex;
    gap: 0.75rem;
  }

  .criterion-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    min-width: 0;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 0.75rem 0.5rem 0.5rem;
    gap: 0.4rem;
  }

  .criterion-visual {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
    width: 100%;
  }

  .criterion-label {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: baseline;
    gap: 0.15rem 0.5rem;
    width: 100%;
    max-width: 150px;
    margin-top: 0.25rem;
  }

  .criterion-target {
    font-size: 0.8rem;
    font-weight: bold;
    color: #a0a0b0;
    justify-self: end;
  }

  .criterion-name {
    font-size: 0.75rem;
    color: #a89060;
    font-weight: bold;
  }

  .criterion-value {
    font-size: 0.8rem;
    font-weight: bold;
    justify-self: end;
    color: #e0dce8;
  }

  .grade-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.3em;
    height: 1.3em;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
    color: #1a1a2e;
    line-height: 1;
  }

  .thresholds {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 0.5rem;
    font-size: 0.65rem;
    font-weight: bold;
    justify-content: center;
  }

  /* ── ポーション瓶 (level) ── */
  .potion-container {
    position: relative;
    width: 60px;
    height: 80px;
  }

  .potion-svg {
    width: 100%;
    height: 100%;
  }

  .potion-glow {
    position: absolute;
    inset: -10px;
    pointer-events: none;
  }

  /* ── 星 (quests) ── */
  .stars-container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    min-height: 32px;
    max-width: 160px;
    padding: 0.25rem 0;
    row-gap: 2px;
  }

  .quest-star {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    transition: filter 0.3s ease;
  }

  .quest-star.lit {
    filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.4));
  }

  /* ── 村 (villageDev) ── */
  .village-visual-inner {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
  }

  .village-scene {
    width: 100%;
    max-width: 160px;
    border-radius: 6px;
    overflow: hidden;
  }

  .village-img {
    width: 100%;
    height: auto;
    display: block;
  }

  .village-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 3px;
    overflow: hidden;
  }

  .village-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s ease;
  }

  /* ── 人々 (reputation) ── */
  .people-container {
    display: flex;
    gap: 0.15rem;
    align-items: flex-end;
    min-height: 40px;
  }

  .person {
    transition: opacity 0.3s ease;
  }

  .person:not(.active) {
    opacity: 0.3;
  }

  .person-svg {
    width: 18px;
    height: 28px;
  }

  /* ── アルバム (album) ── */
  .album-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 3px;
    width: 100%;
    max-width: 130px;
  }

  .album-tile {
    aspect-ratio: 1;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s ease;
  }

  .album-tile.lit {
    border-color: rgba(255, 255, 255, 0.12);
  }

  .tile-icon {
    width: 70%;
    height: 70%;
    opacity: 0.5;
  }

  /* ── 汎用 (generic) ── */
  .generic-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    max-width: 140px;
  }

  .generic-value-big {
    font-size: 1.8rem;
    font-weight: bold;
    line-height: 1;
  }

  .generic-bar {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 3px;
    overflow: hidden;
  }

  .generic-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s ease;
  }

  .expand-hint {
    text-align: center;
    font-size: 0.7rem;
    color: #505060;
    margin-top: 0.5rem;
  }
</style>
