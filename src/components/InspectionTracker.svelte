<script lang="ts">
  import { getGradeForValue } from '$lib/data/inspection';
  import type { InspectionDef, InspectionCriterion, InspectionGrade } from '$lib/data/inspection';

  // props: 親から全データを受け取る
  export let inspection: InspectionDef;
  export let values: Record<string, number>; // { level: 5, quests: 10, ... }
  export let daysUntil: number;

  $: urgency = daysUntil <= 7 ? 'red' : daysUntil <= 21 ? 'yellow' : 'green';

  let expanded = false;

  const gradeList: InspectionGrade[] = ['D', 'C', 'B', 'A', 'S'];

  const gradeColors: Record<InspectionGrade, string> = {
    D: '#605060',
    C: '#a0a0b0',
    B: '#64b5f6',
    A: '#81c784',
    S: '#ffd700',
  };

  function getCriterionInfo(criterion: InspectionCriterion) {
    const value = values[criterion.key] ?? 0;
    const grade = getGradeForValue(criterion.thresholds, value);
    const met = grade !== 'D';
    const maxVal = criterion.thresholds.S;
    const progress = Math.min(1, value / maxVal);
    return { value, grade, met, progress, maxVal };
  }

  $: allMet = inspection.criteria.every((c) => getCriterionInfo(c).met);

  $: metCount = inspection.criteria.filter((c) => getCriterionInfo(c).met).length;

  // ── ポーション瓶 (level) ──
  // 液面の高さを progress に応じて変化
  function potionLiquidY(progress: number): number {
    // viewBox 0 0 60 80: 瓶の底=70, 瓶の口=18, 液面範囲=52px
    return 70 - progress * 52;
  }

  function potionColor(grade: InspectionGrade): string {
    const colors: Record<InspectionGrade, string> = {
      D: '#6a5060',
      C: '#8888aa',
      B: '#5a9fd4',
      A: '#66bb6a',
      S: '#ffd700',
    };
    return colors[grade];
  }

  function potionGlow(grade: InspectionGrade): string {
    const colors: Record<InspectionGrade, string> = {
      D: 'rgba(106, 80, 96, 0.3)',
      C: 'rgba(136, 136, 170, 0.4)',
      B: 'rgba(90, 159, 212, 0.5)',
      A: 'rgba(102, 187, 106, 0.5)',
      S: 'rgba(255, 215, 0, 0.6)',
    };
    return colors[grade];
  }

  // ── 星 (quests) ──
  // S基準の数だけ星を並べ、達成分だけ色付き。等級ゾーンで色が変わる
  // 銅(~D) → 銀(~C) → 金(~B) → 虹(A~S)
  function getStarColor(starIndex: number, criterion: InspectionCriterion): string {
    const i = starIndex + 1; // 1-based
    if (i <= criterion.thresholds.D) return '#b87333'; // 銅
    if (i <= criterion.thresholds.C) return '#c0c0c0'; // 銀
    if (i <= criterion.thresholds.B) return '#ffd700'; // 金
    return 'url(#rainbow-grad)'; // 虹
  }

  function getStarStroke(starIndex: number, criterion: InspectionCriterion): string {
    const i = starIndex + 1;
    if (i <= criterion.thresholds.D) return '#8b5a2b';
    if (i <= criterion.thresholds.C) return '#909090';
    if (i <= criterion.thresholds.B) return '#daa520';
    return '#ff69b4';
  }

  function getStarOverlap(total: number): number {
    if (total <= 8) return 0;
    if (total <= 15) return -4;
    if (total <= 25) return -7;
    if (total <= 35) return -9;
    return -11;
  }

  // ── 村 (villageDev) ──
  // 発展度に応じて建物が増える簡易SVGイラスト
  function getVillageLevel(value: number, maxVal: number): number {
    const ratio = value / maxVal;
    if (ratio >= 0.8) return 4;
    if (ratio >= 0.5) return 3;
    if (ratio >= 0.25) return 2;
    if (ratio > 0) return 1;
    return 0;
  }

  // ── 人々 (reputation) ──
  // 名声に応じて人アイコンが増える
  function getPeopleCount(value: number, maxVal: number): number {
    const ratio = value / maxVal;
    if (ratio >= 0.9) return 7;
    if (ratio >= 0.7) return 6;
    if (ratio >= 0.55) return 5;
    if (ratio >= 0.4) return 4;
    if (ratio >= 0.25) return 3;
    if (ratio >= 0.1) return 2;
    if (ratio > 0) return 1;
    return 0;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="inspection-tracker"
  class:all-met={allMet}
  class:expanded
  on:click={() => expanded = !expanded}
  role="button"
  tabindex="0"
>
  <div class="tracker-header">
    <div class="tracker-title">
      <span class="quarter-badge">Q{inspection.quarter}</span>
      <span class="title-text">査察: {inspection.title}</span>
    </div>
    <div class="tracker-meta">
      <span class="met-count" class:complete={allMet}>
        {metCount}/{inspection.criteria.length}
      </span>
      <span class="days-until {urgency}">あと{daysUntil}日</span>
    </div>
  </div>

  <div class="criteria-grid">
    {#each inspection.criteria as criterion}
        {@const info = getCriterionInfo(criterion)}

        {#if criterion.key === 'level'}
          <!-- ═══ 錬金Lv: ポーション瓶 ═══ -->
          <div class="criterion-card potion-card">
            <div class="potion-container">
              <svg viewBox="0 0 60 80" class="potion-svg">
                <defs>
                  <clipPath id="potion-clip">
                    <!-- 瓶の内部形状 -->
                    <path d="M22 18 L22 28 Q10 35 10 48 L10 65 Q10 72 18 72 L42 72 Q50 72 50 65 L50 48 Q50 35 38 28 L38 18 Z"/>
                  </clipPath>
                  <linearGradient id="liquid-grad-{info.grade}" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stop-color={potionColor(info.grade)} />
                    <stop offset="100%" stop-color={potionColor(info.grade)} stop-opacity="0.6" />
                  </linearGradient>
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
            <div class="criterion-label">
              <span class="criterion-name">錬金Lv</span>
              <span class="criterion-value" style="color: {gradeColors[info.grade]}">Lv.{info.value}</span>
              <span class="grade-badge" style="background: {gradeColors[info.grade]}">{info.grade}</span>
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
            <div class="stars-container">
              <svg viewBox="0 0 0 0" width="0" height="0" style="position:absolute">
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
            <div class="criterion-label">
              <span class="criterion-name">依頼</span>
              <span class="criterion-value" style="color: {gradeColors[info.grade]}">{info.value}/{totalStars}件</span>
              <span class="grade-badge" style="background: {gradeColors[info.grade]}">{info.grade}</span>
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
          <!-- ═══ 村発展: 村のイラスト + バー ═══ -->
          {@const villageLevel = getVillageLevel(info.value, info.maxVal)}
          <div class="criterion-card village-card">
            <div class="village-scene">
              <svg viewBox="0 0 160 60" class="village-svg">
                <!-- 地面 -->
                <rect x="0" y="48" width="160" height="12" fill="#2a3a20"/>
                <path d="M0 48 Q40 44 80 48 Q120 52 160 48 L160 60 L0 60 Z" fill="#3a4a28"/>
                <!-- 木 (常に表示) -->
                <circle cx="15" cy="38" r="8" fill="#4a6a3a" opacity="0.7"/>
                <rect x="14" y="38" width="2" height="12" fill="#5a4a3a"/>
                <circle cx="145" cy="36" r="9" fill="#4a6a3a" opacity="0.6"/>
                <rect x="144" y="36" width="2" height="14" fill="#5a4a3a"/>

                {#if villageLevel >= 1}
                  <!-- 小屋1つ -->
                  <rect x="55" y="32" width="20" height="18" fill="#6a5040"/>
                  <polygon points="55,32 65,22 75,32" fill="#8a4030"/>
                  <rect x="62" y="40" width="6" height="10" fill="#4a3020"/>
                  <!-- 煙突の煙 -->
                  <circle cx="70" cy="18" r="2" fill="rgba(200,200,200,0.3)"/>
                {/if}

                {#if villageLevel >= 2}
                  <!-- 小屋2つ目 + 井戸 -->
                  <rect x="90" y="34" width="18" height="16" fill="#6a5545"/>
                  <polygon points="90,34 99,25 108,34" fill="#7a4535"/>
                  <rect x="96" y="42" width="5" height="8" fill="#4a3525"/>
                  <!-- 井戸 -->
                  <circle cx="40" cy="46" r="5" fill="none" stroke="#888" stroke-width="1.5"/>
                  <line x1="40" y1="38" x2="40" y2="41" stroke="#888" stroke-width="1"/>
                {/if}

                {#if villageLevel >= 3}
                  <!-- 大きな建物 + 柵 -->
                  <rect x="115" y="28" width="24" height="22" fill="#7a6050"/>
                  <polygon points="115,28 127,18 139,28" fill="#9a5040"/>
                  <rect x="123" y="38" width="8" height="12" fill="#5a4030"/>
                  <!-- 窓 -->
                  <rect x="118" y="34" width="4" height="4" fill="#ffd54f" opacity="0.6"/>
                  <!-- 柵 -->
                  {#each [25, 30, 35] as fx}
                    <line x1={fx} y1="43" x2={fx} y2="50" stroke="#8a7a5a" stroke-width="1"/>
                  {/each}
                  <line x1="23" y1="46" x2="37" y2="46" stroke="#8a7a5a" stroke-width="0.8"/>
                {/if}

                {#if villageLevel >= 4}
                  <!-- 塔 + 旗 + 花 -->
                  <rect x="78" y="20" width="10" height="30" fill="#8a7060"/>
                  <polygon points="78,20 83,10 88,20" fill="#c9a959"/>
                  <!-- 旗 -->
                  <line x1="83" y1="10" x2="83" y2="5" stroke="#c9a959" stroke-width="0.8"/>
                  <polygon points="83,5 93,7 83,9" fill="#e74c3c" opacity="0.8"/>
                  <!-- 花壇 -->
                  <circle cx="50" cy="46" r="2" fill="#ff8a80"/>
                  <circle cx="55" cy="47" r="2" fill="#ffab91"/>
                  <circle cx="47" cy="47" r="1.5" fill="#ce93d8"/>
                {/if}
              </svg>
            </div>
            <!-- 発展度バー -->
            <div class="village-bar">
              <div class="village-bar-fill" style="width: {info.progress * 100}%; background: linear-gradient(90deg, #4a6a3a, {gradeColors[info.grade]})"></div>
            </div>
            <div class="criterion-label">
              <span class="criterion-name">村発展</span>
              <span class="criterion-value" style="color: {gradeColors[info.grade]}">{info.value}</span>
              <span class="grade-badge" style="background: {gradeColors[info.grade]}">{info.grade}</span>
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
          {@const peopleCount = getPeopleCount(info.value, info.maxVal)}
          <div class="criterion-card people-card">
            <div class="people-container">
              {#each Array(7) as _, i}
                <div class="person" class:active={i < peopleCount}>
                  <svg viewBox="0 0 20 28" class="person-svg">
                    <!-- 頭 -->
                    <circle cx="10" cy="7" r="5"
                      fill={i < peopleCount ? '#ffd54f' : 'rgba(255,255,255,0.08)'}
                    />
                    <!-- 体 -->
                    <path d="M4 28 L4 18 Q4 13 10 13 Q16 13 16 18 L16 28"
                      fill={i < peopleCount ? '#c9a040' : 'rgba(255,255,255,0.05)'}
                    />
                  </svg>
                </div>
              {/each}
            </div>
            <div class="criterion-label">
              <span class="criterion-name">名声</span>
              <span class="criterion-value" style="color: {gradeColors[info.grade]}">{info.value}</span>
              <span class="grade-badge" style="background: {gradeColors[info.grade]}">{info.grade}</span>
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

        {/if}
      {/each}
    </div>

  {#if !expanded}
    <div class="expand-hint">タップで詳細</div>
  {/if}
</div>

<style>
  .inspection-tracker {
    background: linear-gradient(135deg, rgba(30, 20, 40, 0.9) 0%, rgba(40, 30, 50, 0.9) 100%);
    border: 2px solid #4a3a5a;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
    cursor: pointer;
    transition: border-color 0.3s ease;
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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .criterion-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 0.75rem 0.5rem 0.5rem;
    gap: 0.4rem;
  }

  .criterion-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.25rem;
  }

  .criterion-name {
    font-size: 0.75rem;
    color: #a89060;
    font-weight: bold;
  }

  .criterion-value {
    font-size: 0.9rem;
    font-weight: bold;
  }

  .grade-badge {
    padding: 0.05rem 0.35rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
    color: #1a1a2e;
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
  .village-scene {
    width: 100%;
    max-width: 160px;
  }

  .village-svg {
    width: 100%;
    height: auto;
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

  .expand-hint {
    text-align: center;
    font-size: 0.7rem;
    color: #505060;
    margin-top: 0.5rem;
  }
</style>
