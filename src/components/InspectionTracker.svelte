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

  let revealing = false;

  onMount(() => {
    if (firstReveal) {
      revealing = true;
    }
  });

  const gradeList = ['C', 'B', 'A', 'S'] as const;

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

  // ── ランク変動検知 ──
  let prevInspectionDay: number = -1;
  let prevGrades: Record<string, InspectionGrade> = {};
  let prevMetCount: number = -1;
  let gradeUpAnimations: Record<string, { from: InspectionGrade; to: InspectionGrade }> = {};
  let metCountUpAnim = false;
  let gradeInitialized = false;

  function detectGradeChanges(currentValues: Record<string, number>, currentInspection: InspectionDef) {
    const newGrades: Record<string, InspectionGrade> = {};
    for (const c of currentInspection.criteria) {
      newGrades[c.key] = getGradeForValue(c.thresholds, currentValues[c.key] ?? 0);
    }
    const newMet = currentInspection.criteria.filter((c) => newGrades[c.key] !== 'D').length;

    // 査察が切り替わったらリセット
    if (currentInspection.day !== prevInspectionDay) {
      prevInspectionDay = currentInspection.day;
      prevGrades = newGrades;
      prevMetCount = newMet;
      gradeUpAnimations = {};
      metCountUpAnim = false;
      gradeInitialized = true;
      return;
    }

    if (gradeInitialized) {
      const gradeOrder: InspectionGrade[] = ['D', 'C', 'B', 'A', 'S'];
      const newAnims: Record<string, { from: InspectionGrade; to: InspectionGrade }> = {};

      for (const key of Object.keys(newGrades)) {
        const prev = prevGrades[key];
        const curr = newGrades[key];
        if (prev && curr !== prev && gradeOrder.indexOf(curr) > gradeOrder.indexOf(prev)) {
          newAnims[key] = { from: prev, to: curr };
        }
      }

      if (Object.keys(newAnims).length > 0) {
        gradeUpAnimations = newAnims;
      }

      if (newMet > prevMetCount) {
        metCountUpAnim = true;
      }
    }

    prevGrades = newGrades;
    prevMetCount = newMet;
    if (!gradeInitialized) gradeInitialized = true;
  }

  $: detectGradeChanges(values, inspection);

  function handleGradeUpAnimEnd(e: AnimationEvent, key: string) {
    if (e.animationName === 'gradeUpGlow') {
      const { [key]: _, ...rest } = gradeUpAnimations;
      gradeUpAnimations = rest;
    }
  }

  function handleMetCountUpEnd() {
    metCountUpAnim = false;
  }

  // ── しきい値の位置を0-1の割合で返す ──
  function getThresholdRatio(criterion: InspectionCriterion, grade: 'C' | 'B' | 'A' | 'S'): number {
    return criterion.thresholds[grade] / criterion.thresholds.S;
  }

  // ── ポーション瓶 (level) ──
  // 液面の高さを progress に応じて変化
  // viewBox 0 0 60 80: 瓶の底=70, 瓶の口=18, 液面範囲=52px
  const POTION_BOTTOM = 70;
  const POTION_RANGE = 52;

  function potionLiquidY(progress: number): number {
    return POTION_BOTTOM - progress * POTION_RANGE;
  }

  function potionThresholdY(criterion: InspectionCriterion, grade: 'C' | 'B' | 'A' | 'S'): number {
    const ratio = getThresholdRatio(criterion, grade);
    return POTION_BOTTOM - ratio * POTION_RANGE;
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
  function getStarColor(starIndex: number, criterion: InspectionCriterion): string {
    const i = starIndex + 1; // 1-based
    if (i <= criterion.thresholds.C) return '#b87333'; // 銅（合格ライン）
    if (i <= criterion.thresholds.B) return '#c0c0c0'; // 銀
    if (i <= criterion.thresholds.A) return '#ffd700'; // 金
    return 'url(#rainbow-grad)'; // 虹
  }

  function getStarStroke(starIndex: number, criterion: InspectionCriterion): string {
    const i = starIndex + 1;
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

  // 星の等級境界にあたるインデックスを返す（区切り線描画用）
  function isStarBoundary(starIndex: number, criterion: InspectionCriterion): InspectionGrade | null {
    const i = starIndex + 1;
    if (i === criterion.thresholds.C) return 'C';
    if (i === criterion.thresholds.B) return 'B';
    if (i === criterion.thresholds.A) return 'A';
    return null;
  }

  // ── 村 (villageDev) ──
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

  // アルバムの等級境界タイルインデックス
  function getAlbumGradeBoundary(criterion: InspectionCriterion, grade: 'C' | 'B' | 'A' | 'S', tileCount: number): number {
    return Math.round(getThresholdRatio(criterion, grade) * tileCount);
  }

  // カードの背景・ボーダースタイル（pass時にグレード色で染める）
  function cardStyle(grade: InspectionGrade, met: boolean): string {
    if (!met) return '';
    const c = gradeColors[grade];
    return `background: linear-gradient(135deg, ${c}12, ${c}20); border: 2px solid ${c}cc; box-shadow: 0 0 10px ${c}55, 0 0 3px ${c}44;`;
  }
</script>

<div
  class="inspection-tracker"
  class:all-met={allMet}
  class:revealing
  on:animationend={() => { revealing = false; }}
>
  <div class="tracker-header">
    <div class="tracker-title">
      <span class="quarter-badge">{inspection.month}月末</span>
      <span class="title-text">査察: {inspection.title}</span>
    </div>
    <div class="tracker-meta">
      <span class="met-count" class:complete={allMet} class:met-up={metCountUpAnim}
        on:animationend={() => handleMetCountUpEnd()}>
        {#if allMet}
          <span class="clear-badge">CLEAR</span>
        {:else}
          全ての項目をCランク以上にしよう 達成項目 {metCount}/{inspection.criteria.length}
        {/if}
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
        {@const gradeUp = gradeUpAnimations[criterion.key]}

        <div class="criterion-slot"
          class:grade-up={!!gradeUp}
          on:animationend={(e) => handleGradeUpAnimEnd(e, criterion.key)}
        >
          {#if gradeUp}
            <div class="grade-change-indicator">
              <span style="color: {gradeColors[gradeUp.from]}">{gradeUp.from}</span>
              <span class="grade-arrow">→</span>
              <span style="color: {gradeColors[gradeUp.to]}">{gradeUp.to}</span>
            </div>
          {/if}

        {#if criterion.key === 'level'}
          <!-- ═══ 錬金Lv: ポーション瓶 + 等級ライン ═══ -->
          <div class="criterion-card potion-card" style="{cardStyle(info.grade, info.met)}">
            <div class="criterion-visual">
            <div class="potion-container">
              <svg viewBox="0 0 60 80" class="potion-svg">
                <defs>
                  <clipPath id="potion-clip">
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
                <rect x="22" y="6" width="16" height="4" rx="2" fill="rgba(200, 200, 220, 0.3)"/>
                <!-- 液体 -->
                <g clip-path="url(#potion-clip)">
                  <rect x="8" y={potionLiquidY(info.progress)} width="44" height={80 - potionLiquidY(info.progress)}
                    fill="url(#liquid-grad-{info.grade})" />
                  <ellipse cx="30" cy={potionLiquidY(info.progress)} rx="18" ry="3"
                    fill="rgba(255,255,255,0.15)"/>
                  {#if info.grade === 'S'}
                    <circle cx="20" cy={potionLiquidY(info.progress) + 8} r="2" fill="rgba(255,255,255,0.3)"/>
                    <circle cx="35" cy={potionLiquidY(info.progress) + 14} r="1.5" fill="rgba(255,255,255,0.25)"/>
                    <circle cx="28" cy={potionLiquidY(info.progress) + 20} r="2.5" fill="rgba(255,255,255,0.2)"/>
                  {/if}
                </g>
                <path d="M16 35 Q14 50 16 65" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
                <!-- 等級ライン（瓶の右側に目盛り） -->
                {#each gradeList as g}
                  {@const y = potionThresholdY(criterion, g)}
                  <line x1="51" y1={y} x2="57" y2={y}
                    stroke={gradeColors[g]} stroke-width="1.5" opacity="0.7"/>
                  <text x="59" y={y + 3} font-size="7" fill={gradeColors[g]} opacity="0.8">{g}</text>
                {/each}
              </svg>
              {#if info.grade !== 'D'}
                <div class="potion-glow" style="background: radial-gradient(ellipse, {potionGlow(info.grade)}, transparent 70%)"></div>
              {/if}
            </div>
            </div>
            <div class="criterion-label">
              <span class="criterion-name">錬金Lv</span>
              <span class="criterion-value">Lv.{info.value}</span>
              <span class="grade-row"><span class="grade-badge" style="background: {gradeBg(info.grade)}">{info.grade}</span>{#if info.met}<span class="passed-chip">PASS</span>{/if}</span>
              <span class="criterion-target">目標 Lv.{criterion.thresholds.C}～{criterion.thresholds.S}</span>

            </div>
          </div>

        {:else if criterion.key === 'quests'}
          <!-- ═══ 依頼: 星 + 等級境界マーカー ═══ -->
          {@const totalStars = criterion.thresholds.S}
          {@const overlap = getStarOverlap(totalStars)}
          <div class="criterion-card stars-card" style="{cardStyle(info.grade, info.met)}">
            <div class="criterion-visual">
            <div class="stars-container">
              {#each Array(totalStars) as _, i}
                {@const lit = i < info.value}
                {@const boundary = isStarBoundary(i, criterion)}
                {#if boundary}
                  <div class="star-boundary" style="z-index: {totalStars + 1}">
                    <div class="boundary-line" style="background: {gradeColors[boundary]}"></div>
                  </div>
                {/if}
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
              <span class="criterion-value">完了 {info.value}件</span>
              <span class="grade-row"><span class="grade-badge" style="background: {gradeBg(info.grade)}">{info.grade}</span>{#if info.met}<span class="passed-chip">PASS</span>{/if}</span>
              <span class="criterion-target">目標 {criterion.thresholds.C}～{totalStars}件</span>

            </div>
          </div>

        {:else if criterion.key === 'villageDev'}
          <!-- ═══ 村発展: 村の画像 + 等級マーカー付きバー ═══ -->
          {@const villageImage = getVillageImage(info.value, info.maxVal)}
          <div class="criterion-card village-card" style="{cardStyle(info.grade, info.met)}">
            <div class="criterion-visual">
              <div class="village-visual-inner">
                <div class="village-scene">
                  <img src={villageImage} alt="村の発展" class="village-img" />
                </div>
                <div class="grade-bar">
                  <div class="grade-bar-fill" style="width: {info.progress * 100}%; background: {info.grade === 'S' ? rainbowGrad : `linear-gradient(90deg, #4a6a3a, ${gradeColors[info.grade]})`}"></div>
                  {#each gradeList as g}
                    {@const pos = getThresholdRatio(criterion, g) * 100}
                    {#if g !== 'S'}
                      <div class="grade-marker" style="left: {pos}%">
                        <div class="grade-marker-line" style="background: {gradeColors[g]}"></div>
                        <span class="grade-marker-label" style="color: {gradeColors[g]}">{g}</span>
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>
            </div>
            <div class="criterion-label">
              <span class="criterion-name">村発展</span>
              <span class="criterion-value">Lv.{info.value}</span>
              <span class="grade-row"><span class="grade-badge" style="background: {gradeBg(info.grade)}">{info.grade}</span>{#if info.met}<span class="passed-chip">PASS</span>{/if}</span>
              <span class="criterion-target">目標 Lv.{criterion.thresholds.C}～{criterion.thresholds.S}</span>

            </div>
          </div>

        {:else if criterion.key === 'reputation'}
          <!-- ═══ 名声: 人々アイコン + 等級マーカー付きバー ═══ -->
          {@const peopleCount = getPeopleCount(info.progress)}
          <div class="criterion-card people-card" style="{cardStyle(info.grade, info.met)}">
            <div class="criterion-visual">
              <div class="reputation-visual-inner">
                <div class="people-container">
                  {#each Array(7) as _, i}
                    <div class="person" class:active={i < peopleCount}>
                      <svg viewBox="0 0 20 28" class="person-svg">
                        <circle cx="10" cy="7" r="5"
                          fill={i < peopleCount ? getPersonColor(i, info.grade) : 'rgba(255,255,255,0.08)'}
                        />
                        <path d="M4 28 L4 18 Q4 13 10 13 Q16 13 16 18 L16 28"
                          fill={i < peopleCount ? getPersonColor(i, info.grade) : 'rgba(255,255,255,0.05)'}
                          opacity={i < peopleCount ? 0.7 : 1}
                        />
                      </svg>
                    </div>
                  {/each}
                </div>
                <div class="grade-bar">
                  <div class="grade-bar-fill" style="width: {info.progress * 100}%; background: {info.grade === 'S' ? rainbowGrad : `linear-gradient(90deg, ${gradeColors[info.grade]}88, ${gradeColors[info.grade]})`}"></div>
                  {#each gradeList as g}
                    {@const pos = getThresholdRatio(criterion, g) * 100}
                    {#if g !== 'S'}
                      <div class="grade-marker" style="left: {pos}%">
                        <div class="grade-marker-line" style="background: {gradeColors[g]}"></div>
                        <span class="grade-marker-label" style="color: {gradeColors[g]}">{g}</span>
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>
            </div>
            <div class="criterion-label">
              <span class="criterion-name">名声</span>
              <span class="criterion-value">Lv.{info.value}</span>
              <span class="grade-row"><span class="grade-badge" style="background: {gradeBg(info.grade)}">{info.grade}</span>{#if info.met}<span class="passed-chip">PASS</span>{/if}</span>
              <span class="criterion-target">目標 Lv.{criterion.thresholds.C}～{criterion.thresholds.S}</span>

            </div>
          </div>

        {:else if criterion.key === 'album'}
          <!-- ═══ アルバム: タイルグリッド + 等級境界線 ═══ -->
          {@const tileCount = Math.min(criterion.thresholds.S, ALBUM_TILES)}
          {@const litCount = Math.round(info.progress * tileCount)}
          {@const cols = tileCount <= 6 ? tileCount : 6}
          <div class="criterion-card album-card" style="{cardStyle(info.grade, info.met)}">
            <div class="criterion-visual">
              <div class="album-grid" style="grid-template-columns: repeat({cols}, 1fr)">
                {#each Array(tileCount) as _, i}
                  {@const isBoundaryC = i === getAlbumGradeBoundary(criterion, 'C', tileCount) - 1}
                  {@const isBoundaryB = i === getAlbumGradeBoundary(criterion, 'B', tileCount) - 1}
                  {@const isBoundaryA = i === getAlbumGradeBoundary(criterion, 'A', tileCount) - 1}
                  <div
                    class="album-tile"
                    class:lit={i < litCount}
                    class:boundary-c={isBoundaryC}
                    class:boundary-b={isBoundaryB}
                    class:boundary-a={isBoundaryA}
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
              <span class="grade-row"><span class="grade-badge" style="background: {gradeBg(info.grade)}">{info.grade}</span>{#if info.met}<span class="passed-chip">PASS</span>{/if}</span>
              <span class="criterion-target">目標 {criterion.thresholds.C}～{criterion.thresholds.S}種</span>

            </div>
          </div>

        {:else}
          <!-- ═══ 汎用: プログレスバー + 等級マーカー ═══ -->
          <div class="criterion-card generic-card" style="{cardStyle(info.grade, info.met)}">
            <div class="criterion-visual">
              <div class="generic-visual">
                <div class="generic-value-big" style="color: {gradeColors[info.grade]}">{info.value}</div>
                <div class="grade-bar">
                  <div class="grade-bar-fill" style="width: {info.progress * 100}%; background: {info.grade === 'S' ? rainbowGrad : `linear-gradient(90deg, ${gradeColors[info.grade]}88, ${gradeColors[info.grade]})`}"></div>
                  {#each gradeList as g}
                    {@const pos = getThresholdRatio(criterion, g) * 100}
                    {#if g !== 'S'}
                      <div class="grade-marker" style="left: {pos}%">
                        <div class="grade-marker-line" style="background: {gradeColors[g]}"></div>
                        <span class="grade-marker-label" style="color: {gradeColors[g]}">{g}</span>
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>
            </div>
            <div class="criterion-label">
              <span class="criterion-name">{criterion.label}</span>
              <span class="criterion-value">{info.value}{criterion.unit}</span>
              <span class="grade-row"><span class="grade-badge" style="background: {gradeBg(info.grade)}">{info.grade}</span>{#if info.met}<span class="passed-chip">PASS</span>{/if}</span>
              <span class="criterion-target">目標 {criterion.thresholds.C}～{criterion.thresholds.S}{criterion.unit}</span>

            </div>
          </div>

        {/if}
        </div>
      {/each}
    </div>
</div>

<style>
  .inspection-tracker {
    position: relative;
    background: linear-gradient(135deg, rgba(30, 20, 40, 0.9) 0%, rgba(40, 30, 50, 0.9) 100%);
    border: 2px solid #4a3a5a;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
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
    18% {
      opacity: 1;
      transform: translateY(0);
      border-color: #c9a959;
      box-shadow: 0 0 30px 8px rgba(201, 169, 89, 0.45), inset 0 0 20px rgba(201, 169, 89, 0.12);
    }
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
    color: #d0d0e0;
    font-weight: bold;
  }

  .met-count.complete {
    color: #81c784;
  }

  .clear-badge {
    display: inline-block;
    padding: 0.1rem 0.6rem;
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.4), rgba(129, 199, 132, 0.3));
    border: 1.5px solid #81c784;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: bold;
    color: #a5d6a7;
    letter-spacing: 0.15em;
    text-shadow: 0 0 8px rgba(129, 199, 132, 0.5);
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
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

  .grade-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .passed-chip {
    padding: 0.05rem 0.25rem;
    background: rgba(76, 175, 80, 0.25);
    border: 1px solid rgba(76, 175, 80, 0.5);
    border-radius: 3px;
    font-size: 0.5rem;
    font-weight: bold;
    color: #81c784;
    letter-spacing: 0.05em;
    line-height: 1;
  }

  /* ── 共通: 等級マーカー付きバー ── */
  .grade-bar {
    position: relative;
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 3px;
    overflow: visible;
  }

  .grade-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s ease;
  }

  .grade-marker {
    position: absolute;
    top: -2px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
  }

  .grade-marker-line {
    width: 2px;
    height: 10px;
    border-radius: 1px;
    opacity: 0.6;
  }

  .grade-marker-label {
    font-size: 0.5rem;
    font-weight: bold;
    opacity: 0.7;
    line-height: 1;
    margin-top: 1px;
  }

  /* ── ポーション瓶 (level) ── */
  .potion-container {
    position: relative;
    width: 70px;
    height: 80px;
  }

  .potion-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
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

  .star-boundary {
    position: relative;
    width: 0;
    height: 18px;
    z-index: 100;
  }

  .boundary-line {
    position: absolute;
    left: -2px;
    top: -2px;
    width: 2px;
    height: 22px;
    border-radius: 1px;
    opacity: 0.5;
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

  /* ── 名声 (reputation) ── */
  .reputation-visual-inner {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
    align-items: center;
  }

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

  .album-tile.boundary-c,
  .album-tile.boundary-b,
  .album-tile.boundary-a {
    position: relative;
  }

  .album-tile.boundary-c::after,
  .album-tile.boundary-b::after,
  .album-tile.boundary-a::after {
    content: '';
    position: absolute;
    right: -3px;
    top: -2px;
    width: 2px;
    height: 130%;
    border-radius: 1px;
  }

  .album-tile.boundary-c::after {
    background: #b8733388;
  }

  .album-tile.boundary-b::after {
    background: #c0c0c088;
  }

  .album-tile.boundary-a::after {
    background: #ffd70088;
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

  /* ── ランク変動フィードバック ── */
  .criterion-slot {
    flex: 1;
    min-width: 0;
    position: relative;
    display: flex;
  }

  .criterion-slot.grade-up {
    animation: gradeUpGlow 2s ease-out;
  }

  @keyframes gradeUpGlow {
    0% { filter: brightness(1); }
    10% { filter: brightness(1.8); }
    30% { filter: brightness(1.3); }
    100% { filter: brightness(1); }
  }

  .criterion-slot.grade-up .grade-badge {
    animation: gradeBadgeBounce 1.5s ease-out;
  }

  @keyframes gradeBadgeBounce {
    0%, 100% { transform: scale(1); }
    10% { transform: scale(2.2); }
    25% { transform: scale(0.9); }
    35% { transform: scale(1.5); }
    50% { transform: scale(1); }
  }

  .grade-change-indicator {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 0.15rem;
    font-size: 0.85rem;
    font-weight: bold;
    white-space: nowrap;
    animation: gradeIndicatorFloat 2s ease-out forwards;
    pointer-events: none;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
  }

  .grade-arrow {
    color: #ffd700;
  }

  @keyframes gradeIndicatorFloat {
    0% { opacity: 0; transform: translateX(-50%) translateY(8px); }
    10% { opacity: 1; transform: translateX(-50%) translateY(0); }
    60% { opacity: 1; }
    100% { opacity: 0; transform: translateX(-50%) translateY(-12px); }
  }

  .met-count.met-up {
    animation: metCountUpPulse 1.8s ease-out;
  }

  @keyframes metCountUpPulse {
    0% { transform: scale(1); text-shadow: none; }
    12% { transform: scale(1.2); text-shadow: 0 0 15px rgba(129, 199, 132, 0.8), 0 0 30px rgba(129, 199, 132, 0.4); }
    30% { transform: scale(1.05); }
    100% { transform: scale(1); text-shadow: none; }
  }
</style>
