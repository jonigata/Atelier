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
  let dialogKey: string | null = null;

  function openDetail(key: string) {
    dialogKey = key;
  }

  function closeDetail() {
    dialogKey = null;
  }

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

  // ── 次のランク情報 ──
  function getNextGradeInfo(criterion: InspectionCriterion, currentGrade: InspectionGrade): { grade: InspectionGrade; threshold: number } | null {
    const order: InspectionGrade[] = ['D', 'C', 'B', 'A', 'S'];
    const idx = order.indexOf(currentGrade);
    if (idx >= order.length - 1) return null; // Already S
    const nextGrade = order[idx + 1] as 'C' | 'B' | 'A' | 'S';
    return { grade: nextGrade, threshold: criterion.thresholds[nextGrade] };
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
  function getStarColor(starIndex: number, criterion: InspectionCriterion, grade: InspectionGrade): string {
    if (grade === 'D') return '#606068'; // 鉄
    const i = starIndex + 1; // 1-based
    if (i <= criterion.thresholds.C) return '#b87333'; // 銅（合格ライン）
    if (i <= criterion.thresholds.B) return '#c0c0c0'; // 銀
    if (i <= criterion.thresholds.A) return '#ffd700'; // 金
    return 'url(#rainbow-grad)'; // 虹
  }

  function getStarStroke(starIndex: number, criterion: InspectionCriterion, grade: InspectionGrade): string {
    if (grade === 'D') return '#48484e'; // 鉄
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
  function getAlbumGridCols(total: number): number {
    if (total <= 6) return total;
    if (total <= 24) return 6;
    if (total <= 48) return 8;
    if (total <= 72) return 10;
    return 12;
  }

  function getAlbumGap(total: number): number {
    if (total <= 24) return 3;
    if (total <= 48) return 2;
    return 1;
  }

  function getAlbumTileColor(tileIndex: number, litCount: number, criterion: InspectionCriterion, tileCount: number, grade: InspectionGrade): string {
    if (tileIndex >= litCount) return 'rgba(255,255,255,0.04)';
    if (grade === 'D') return '#606068'; // 鉄
    if (grade === 'S') return rainbowPalette[tileIndex % rainbowPalette.length];
    const boundC = getAlbumGradeBoundary(criterion, 'C', tileCount);
    const boundB = getAlbumGradeBoundary(criterion, 'B', tileCount);
    const boundA = getAlbumGradeBoundary(criterion, 'A', tileCount);
    if (tileIndex < boundC) return '#b87333'; // 銅
    if (tileIndex < boundB) return '#c0c0c0'; // 銀
    if (tileIndex < boundA) return '#ffd700'; // 金
    return 'url(#rainbow-grad)'; // 虹（S圏）
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

  <!-- ═══ 横並びバー ═══ -->
  <div class="criteria-row">
    {#each inspection.criteria as criterion}
      {@const info = getCriterionInfo(criterion, values, expValues)}
      {@const gradeUp = gradeUpAnimations[criterion.key]}
      {@const nextInfo = getNextGradeInfo(criterion, info.grade)}
      <button
        class="criterion-chip"
        class:met={info.met}
        class:grade-up={!!gradeUp}
        style="{info.met ? `border-color: ${gradeColors[info.grade]}88` : ''}"
        on:click={() => openDetail(criterion.key)}
        on:animationend={(e) => handleGradeUpAnimEnd(e, criterion.key)}
      >
        {#if gradeUp}
          <div class="grade-change-indicator">
            <span style="color: {gradeColors[gradeUp.from]}">{gradeUp.from}</span>
            <span class="grade-arrow">→</span>
            <span style="color: {gradeColors[gradeUp.to]}">{gradeUp.to}</span>
          </div>
        {/if}
        <span class="chip-name">{criterion.key === 'quests' ? '依頼完了' : criterion.label}</span>
        <span class="chip-value-row">
          <span class="chip-value">
            {#if criterion.key === 'level' || criterion.key === 'villageDev' || criterion.key === 'reputation'}
              Lv.{info.value}
            {:else if criterion.key === 'quests'}
              {info.value}件
            {:else if criterion.key === 'album'}
              {info.value}種
            {:else}
              {info.value}{criterion.unit}
            {/if}
          </span>
          <span class="chip-grade" style="background: {gradeBg(info.grade)}">{info.grade}</span>
          {#if info.met}<span class="chip-pass">PASS</span>{/if}
        </span>
        {#if nextInfo}
          <span class="chip-next">
            <span class="chip-next-label">次は</span>
            <span class="chip-next-grade" style="background: {gradeBg(nextInfo.grade)}">{nextInfo.grade}</span>
            <span class="chip-next-threshold">
              {#if criterion.key === 'level' || criterion.key === 'villageDev' || criterion.key === 'reputation'}
                Lv.{nextInfo.threshold}
              {:else if criterion.key === 'quests'}
                {nextInfo.threshold}件
              {:else if criterion.key === 'album'}
                {nextInfo.threshold}種
              {:else}
                {nextInfo.threshold}{criterion.unit}
              {/if}
            </span>
          </span>
        {/if}
      </button>
    {/each}
  </div>

  <!-- ═══ 詳細ダイアログ ═══ -->
  {#if dialogKey}
    {@const criterion = inspection.criteria.find(c => c.key === dialogKey)}
    {#if criterion}
      {@const info = getCriterionInfo(criterion, values, expValues)}
      <div class="detail-overlay" on:click={closeDetail}>
        <div class="detail-dialog" on:click|stopPropagation>
          <div class="dialog-header">
            <span class="dialog-title">{criterion.label}</span>
            <span class="dialog-value">
              {#if criterion.key === 'level' || criterion.key === 'villageDev' || criterion.key === 'reputation'}
                Lv.{info.value}
              {:else if criterion.key === 'quests'}
                {info.value}件
              {:else if criterion.key === 'album'}
                {info.value}種
              {:else}
                {info.value}{criterion.unit}
              {/if}
            </span>
            <span class="dialog-grade" style="background: {gradeBg(info.grade)}">{info.grade}</span>
            {#if info.met}<span class="chip-pass">PASS</span>{/if}
          </div>

          <div class="dialog-body">
            <div class="dialog-visual">
              {#if criterion.key === 'level'}
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
                    <path d="M24 8 L24 18 L22 18 L22 28 Q10 35 10 48 L10 65 Q10 72 18 72 L42 72 Q50 72 50 65 L50 48 Q50 35 38 28 L38 18 L36 18 L36 8 Z"
                      fill="none" stroke="rgba(200, 200, 220, 0.4)" stroke-width="1.5"/>
                    <rect x="22" y="6" width="16" height="4" rx="2" fill="rgba(200, 200, 220, 0.3)"/>
                    <g clip-path="url(#potion-clip)">
                      <rect x="8" y={potionLiquidY(info.progress)} width="44" height={80 - potionLiquidY(info.progress)}
                        fill="url(#liquid-grad-{info.grade})" />
                      <ellipse cx="30" cy={potionLiquidY(info.progress)} rx="18" ry="3" fill="rgba(255,255,255,0.15)"/>
                      {#if info.grade === 'S'}
                        <circle cx="20" cy={potionLiquidY(info.progress) + 8} r="2" fill="rgba(255,255,255,0.3)"/>
                        <circle cx="35" cy={potionLiquidY(info.progress) + 14} r="1.5" fill="rgba(255,255,255,0.25)"/>
                        <circle cx="28" cy={potionLiquidY(info.progress) + 20} r="2.5" fill="rgba(255,255,255,0.2)"/>
                      {/if}
                    </g>
                    <path d="M16 35 Q14 50 16 65" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
                    {#each gradeList as g}
                      {@const y = potionThresholdY(criterion, g)}
                      <line x1="51" y1={y} x2="57" y2={y} stroke={gradeColors[g]} stroke-width="1.5" opacity="0.7"/>
                      <text x="59" y={y + 3} font-size="7" fill={gradeColors[g]} opacity="0.8">{g}</text>
                    {/each}
                  </svg>
                  {#if info.grade !== 'D'}
                    <div class="potion-glow" style="background: radial-gradient(ellipse, {potionGlow(info.grade)}, transparent 70%)"></div>
                  {/if}
                </div>

              {:else if criterion.key === 'quests'}
                {@const totalStars = criterion.thresholds.S}
                {@const overlap = getStarOverlap(totalStars)}
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
                      style="margin-left: {i === 0 ? 0 : overlap}px; z-index: {i}">
                      <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z"
                        fill={lit ? getStarColor(i, criterion, info.grade) : 'rgba(255,255,255,0.06)'}
                        stroke={lit ? getStarStroke(i, criterion, info.grade) : 'rgba(255,255,255,0.1)'}
                        stroke-width="0.8" />
                    </svg>
                  {/each}
                </div>

              {:else if criterion.key === 'villageDev'}
                {@const villageImage = getVillageImage(info.value, info.maxVal)}
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

              {:else if criterion.key === 'reputation'}
                {@const peopleCount = getPeopleCount(info.progress)}
                <div class="reputation-visual-inner">
                  <div class="people-container">
                    {#each Array(7) as _, i}
                      <div class="person" class:active={i < peopleCount}>
                        <svg viewBox="0 0 20 28" class="person-svg">
                          <circle cx="10" cy="7" r="5" fill={i < peopleCount ? getPersonColor(i, info.grade) : 'rgba(255,255,255,0.08)'} />
                          <path d="M4 28 L4 18 Q4 13 10 13 Q16 13 16 18 L16 28"
                            fill={i < peopleCount ? getPersonColor(i, info.grade) : 'rgba(255,255,255,0.05)'}
                            opacity={i < peopleCount ? 0.7 : 1} />
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

              {:else if criterion.key === 'album'}
                {@const tileCount = criterion.thresholds.S}
                {@const litCount = Math.round(info.progress * tileCount)}
                {@const cols = getAlbumGridCols(tileCount)}
                {@const gap = getAlbumGap(tileCount)}
                <div class="album-grid" style="grid-template-columns: repeat({cols}, 1fr); gap: {gap}px; --album-gap: {gap}; --album-radius: {tileCount > 48 ? 1 : tileCount > 24 ? 2 : 3}px">
                  {#each Array(tileCount) as _, i}
                    {@const isBoundaryC = i === getAlbumGradeBoundary(criterion, 'C', tileCount) - 1}
                    {@const isBoundaryB = i === getAlbumGradeBoundary(criterion, 'B', tileCount) - 1}
                    {@const isBoundaryA = i === getAlbumGradeBoundary(criterion, 'A', tileCount) - 1}
                    <div class="album-tile" class:lit={i < litCount}
                      class:boundary-c={isBoundaryC} class:boundary-b={isBoundaryB} class:boundary-a={isBoundaryA}
                      style="background: {getAlbumTileColor(i, litCount, criterion, tileCount, info.grade)};
                             {i < litCount && info.grade !== 'S' ? `box-shadow: inset 0 0 4px ${getAlbumTileColor(i, litCount, criterion, tileCount, info.grade)}44` : ''}
                             {i < litCount && info.grade === 'S' ? `box-shadow: 0 0 4px ${rainbowPalette[i % rainbowPalette.length]}66` : ''}">
                      {#if i < litCount && tileCount <= 24}
                        <svg viewBox="0 0 12 12" class="tile-icon">
                          <circle cx="6" cy="4" r="2.5" fill="rgba(0,0,0,0.3)"/>
                          <rect x="2" y="7" width="8" height="4" rx="1" fill="rgba(0,0,0,0.2)"/>
                        </svg>
                      {/if}
                    </div>
                  {/each}
                </div>

              {:else}
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
              {/if}
            </div>

            <div class="dialog-thresholds">
              {#each gradeList as g}
                <span class="th-entry"><span class="th-grade-badge" style="background: {gradeColors[g]}">{g}</span>{criterion.thresholds[g]}</span>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .inspection-tracker {
    position: relative;
    background: linear-gradient(135deg, rgba(30, 20, 40, 0.9) 0%, rgba(40, 30, 50, 0.9) 100%);
    border: 2px solid #4a3a5a;
    border-radius: 10px;
    padding: 16px 20px;
    margin-bottom: 16px;
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
    margin-bottom: 12px;
  }

  .tracker-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .quarter-badge {
    padding: 2px 8px;
    background: rgba(201, 169, 89, 0.3);
    border: 1px solid #c9a959;
    border-radius: 4px;
    font-size: 13px;
    font-weight: bold;
    color: #c9a959;
  }

  .title-text {
    font-size: 15px;
    font-weight: bold;
    color: #e0e0f0;
  }

  .tracker-meta {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .met-count {
    font-size: 14px;
    color: #d0d0e0;
    font-weight: bold;
  }

  .met-count.complete {
    color: #81c784;
  }

  .clear-badge {
    display: inline-block;
    padding: 2px 10px;
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.4), rgba(129, 199, 132, 0.3));
    border: 1.5px solid #81c784;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    color: #a5d6a7;
    letter-spacing: 0.15em;
    text-shadow: 0 0 8px rgba(129, 199, 132, 0.5);
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
  }

  .days-until {
    font-size: 14px;
    font-weight: bold;
  }

  .days-until.green { color: #81c784; }
  .days-until.yellow { color: #ffd54f; }
  .days-until.red { color: #ff8a65; }

  /* ── 横並びチップ ── */
  .criteria-row {
    display: flex;
    gap: 6px;
  }

  .criterion-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    flex: 1;
    min-width: 0;
    padding: 6px 4px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    cursor: pointer;
    color: #e0dce8;
    font-family: inherit;
    text-align: center;
    position: relative;
  }

  .criterion-chip:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .criterion-chip.met {
    background: rgba(76, 175, 80, 0.08);
  }

  .chip-name {
    font-size: 22px;
    color: #a89060;
    font-weight: bold;
  }

  .chip-value-row {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
  }

  .chip-value {
    font-weight: bold;
    font-size: 32px;
  }

  .chip-grade {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 5px;
    font-size: 20px;
    font-weight: bold;
    color: #1a1a2e;
    line-height: 1;
  }

  .chip-pass {
    padding: 1px 5px;
    background: rgba(76, 175, 80, 0.25);
    border: 1px solid rgba(76, 175, 80, 0.5);
    border-radius: 3px;
    font-size: 9px;
    font-weight: bold;
    color: #81c784;
    letter-spacing: 0.05em;
    line-height: 1;
  }

  .chip-next {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 20px;
    opacity: 0.6;
    line-height: 1;
  }

  .chip-next-label {
    color: #888;
    font-size: 16px;
  }

  .chip-next-grade {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    color: #1a1a2e;
    line-height: 1;
  }

  .chip-next-threshold {
    color: #b0b0c0;
    font-weight: bold;
  }

  /* ── 詳細ダイアログ ── */
  .detail-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: var(--z-modal);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .detail-dialog {
    background: linear-gradient(135deg, #1e1428 0%, #28203a 100%);
    border: 2px solid #5a4a6a;
    border-radius: 16px;
    padding: 28px;
    max-width: 700px;
    width: 95%;
    max-height: 85vh;
    overflow-y: auto;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 24px;
  }

  .dialog-title {
    font-size: 32px;
    font-weight: bold;
    color: #a89060;
  }

  .dialog-value {
    font-size: 38px;
    font-weight: bold;
    color: #e0dce8;
  }

  .dialog-grade {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 6px;
    font-size: 26px;
    font-weight: bold;
    color: #1a1a2e;
    line-height: 1;
  }

  .dialog-body {
    display: flex;
    gap: 24px;
    align-items: center;
  }

  .dialog-visual {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  .dialog-thresholds {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 28px;
    color: #a0a0b0;
    font-weight: bold;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 12px 16px;
    flex-shrink: 0;
  }

  .th-entry {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    line-height: 1.5;
  }

  .th-grade-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 5px;
    font-size: 18px;
    font-weight: bold;
    color: #1a1a2e;
    line-height: 1;
    flex-shrink: 0;
  }

  .passed-chip {
    padding: 1px 4px;
    background: rgba(76, 175, 80, 0.25);
    border: 1px solid rgba(76, 175, 80, 0.5);
    border-radius: 3px;
    font-size: 8px;
    font-weight: bold;
    color: #81c784;
    letter-spacing: 0.05em;
    line-height: 1;
  }

  /* ── 共通: 等級マーカー付きバー ── */
  .grade-bar {
    position: relative;
    width: 100%;
    height: 10px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 5px;
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
    width: 3px;
    height: 16px;
    border-radius: 1px;
    opacity: 0.7;
  }

  .grade-marker-label {
    font-size: 14px;
    font-weight: bold;
    opacity: 0.8;
    line-height: 1;
    margin-top: 2px;
  }

  /* ── ポーション瓶 (level) ── */
  .potion-container {
    position: relative;
    height: 220px;
    aspect-ratio: 3 / 4;
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
    width: 100%;
    padding: 4px 0;
    row-gap: 2px;
  }

  .quest-star {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    transition: filter 0.3s ease;
  }

  .quest-star.lit {
    filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.4));
  }

  .star-boundary {
    position: relative;
    width: 0;
    height: 30px;
    z-index: 100;
  }

  .boundary-line {
    position: absolute;
    left: -2px;
    top: -2px;
    width: 3px;
    height: 34px;
    border-radius: 1px;
    opacity: 0.6;
  }

  /* ── 村 (villageDev) ── */
  .village-visual-inner {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .village-scene {
    width: 100%;
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
    gap: 4px;
    width: 100%;
    align-items: center;
  }

  .people-container {
    display: flex;
    gap: 2px;
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
    width: 36px;
    height: 52px;
  }

  /* ── アルバム (album) ── */
  .album-grid {
    display: grid;
    gap: 3px;
    width: 100%;
  }

  .album-tile {
    aspect-ratio: 1;
    border-radius: var(--album-radius, 3px);
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
    right: calc(var(--album-gap, 3) * -1px);
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
    gap: 8px;
    width: 100%;
    max-width: 140px;
  }

  .generic-value-big {
    font-size: 29px;
    font-weight: bold;
    line-height: 1;
  }

  /* ── ランク変動フィードバック ── */
  .criterion-bar.grade-up {
    animation: gradeUpGlow 2s ease-out;
  }

  @keyframes gradeUpGlow {
    0% { filter: brightness(1); }
    10% { filter: brightness(1.8); }
    30% { filter: brightness(1.3); }
    100% { filter: brightness(1); }
  }

  .criterion-bar.grade-up .bar-grade {
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
    gap: 2px;
    font-size: 14px;
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
