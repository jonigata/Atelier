<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { resolveInspectionCutscene } from '$lib/services/presentation';
  import type { InspectionCutsceneData } from '$lib/models/types';

  let visible = false;
  let transitioning = false;
  let timers: ReturnType<typeof setTimeout>[] = [];

  // 演出フェーズ
  let phase: 'movie' | 'fade-in' | 'image' | 'title' | 'criteria' | 'grade' | 'fade-out' | 'idle' = 'idle';
  let data: InspectionCutsceneData | null = null;
  let revealedCriteria = 0;
  let showGrade = false;
  let gradeStamped = false;
  let videoEl: HTMLVideoElement | null = null;

  // パーティクル（座標はコンテナ内の%）
  interface Particle {
    id: number;
    x: number;   // % (コンテナ幅内)
    y: number;    // % (開始位置、負=上から)
    size: number; // px
    color: string;
    delay: number; // s
    duration: number; // s
    type: 'confetti' | 'spark' | 'firework';
    rotation: number;
    rotateX: number;  // 3D回転速度
    rotateY: number;  // 3D回転速度
    driftPx: number; // 横移動量 px
    wobblePx: number; // 左右揺れ振幅 px
  }
  let particles: Particle[] = [];
  let particleId = 0;

  $: if ($gameState.pendingInspectionCutscene && !transitioning) {
    data = $gameState.pendingInspectionCutscene;
    startCutscene();
  }

  function clearTimers() {
    for (const t of timers) clearTimeout(t);
    timers = [];
  }

  function after(ms: number, fn: () => void) {
    timers.push(setTimeout(fn, ms));
  }

  function startCutscene() {
    clearTimers();
    transitioning = true;
    visible = true;
    revealedCriteria = 0;
    showGrade = false;
    gradeStamped = false;
    particles = [];

    // 演出スキップ
    if ($gameState.skipPresentation) {
      after(50, finish);
      return;
    }

    if (data?.mode === 'movie') {
      phase = 'fade-in';
      after(500, () => { phase = 'movie'; });
    } else {
      startEvaluationTimeline();
    }
  }

  // ムービー終了後
  function onMovieEnded() {
    finish();
  }

  function skipMovie() {
    if (videoEl) {
      videoEl.pause();
    }
    finish();
  }

  function startEvaluationTimeline() {
    phase = 'fade-in';

    // タイムライン
    let t = 0;

    // フェードイン → 画像表示
    t += 500;
    after(t, () => { phase = 'image'; });

    // タイトル表示
    t += 800;
    after(t, () => { phase = 'title'; });

    // 各項目を順番に表示（700ms間隔）
    t += 1000;
    const criteriaCount = data?.criteria.length ?? 0;
    for (let i = 0; i < criteriaCount; i++) {
      const delay = t + i * 700;
      after(delay, () => {
        phase = 'criteria';
        revealedCriteria = i + 1;
      });
    }
    t += criteriaCount * 700;

    // タメ（総合評価前の間）
    t += 1200;

    // 総合等級スタンプ
    after(t, () => {
      phase = 'grade';
      showGrade = true;
    });
    t += 150;
    after(t, () => {
      gradeStamped = true;
      // 等級に応じた祝福エフェクト
      if (data && data.passed) {
        spawnCelebration(data.overallGrade);
      }
    });

    // ホールド（エフェクト分長めに）
    t += 4000;

    // フェードアウト
    after(t, () => { phase = 'fade-out'; });
    t += 600;
    after(t, finish);
  }

  // 等級に応じたパーティクル生成
  function spawnCelebration(grade: string) {
    const newParticles: Particle[] = [];
    const colors = gradeParticleColors(grade);
    const count = gradeParticleCount(grade);
    const types = gradeParticleTypes(grade);

    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      newParticles.push({
        id: particleId++,
        x: 5 + Math.random() * 90,  // コンテナ内5%~95%
        y: type === 'firework' ? 20 + Math.random() * 30 : -10 + Math.random() * 25,
        size: type === 'firework' ? 16 + Math.random() * 16 : type === 'spark' ? 4 + Math.random() * 6 : 56 + Math.random() * 28,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: type === 'firework' ? Math.random() * 0.8 : Math.random() * 2.5,
        duration: type === 'firework' ? 0.6 + Math.random() * 0.4 : type === 'confetti' ? 2.5 + Math.random() * 1.0 : 3.0 + Math.random() * 1.5,
        type,
        rotation: Math.random() * 360,
        rotateX: 360 + Math.random() * 720,
        rotateY: 360 + Math.random() * 720,
        driftPx: (Math.random() - 0.5) * 120,  // px
        wobblePx: 15 + Math.random() * 50,  // 揺れ振幅 px
      });
    }

    particles = newParticles;
  }

  function gradeParticleColors(grade: string): string[] {
    switch (grade) {
      case 'S': return ['#c9a0ff', '#ffd700', '#ff90d0', '#90d0ff', '#ffffff', '#ffe066'];
      case 'A': return ['#ffd700', '#ffb000', '#ffe066', '#ffffff'];
      case 'B': return ['#60c060', '#90e090', '#c0f0c0'];
      case 'C': return ['#80b0d0', '#a0c8e0'];
      default: return [];
    }
  }

  function gradeParticleCount(grade: string): number {
    switch (grade) {
      case 'S': return 160;
      case 'A': return 100;
      case 'B': return 70;
      case 'C': return 24;
      default: return 0;
    }
  }

  function gradeParticleTypes(grade: string): Particle['type'][] {
    switch (grade) {
      case 'S': return ['confetti', 'confetti', 'confetti', 'spark'];
      case 'A': return ['confetti', 'confetti', 'spark'];
      case 'B': return ['confetti', 'confetti', 'spark'];
      case 'C': return ['confetti', 'spark'];
      default: return ['spark'];
    }
  }

  function finish() {
    visible = false;
    phase = 'idle';
    particles = [];
    transitioning = false;
    resolveInspectionCutscene();
  }

  function gradeColor(grade: string): string {
    switch (grade) {
      case 'S': return '#c9a0ff';
      case 'A': return '#ffd700';
      case 'B': return '#60c060';
      case 'C': return '#80b0d0';
      case 'D': return '#e05050';
      default: return '#a0a0b0';
    }
  }
</script>

{#if $gameState.inspectionBackdrop}
  <div class="inspection-backdrop" />
{/if}

{#if visible && data}
  <div
    class="cutscene-overlay"
    class:entering={phase === 'fade-in'}
    class:leaving={phase === 'fade-out'}
  >
    <!-- ムービー -->
    {#if phase === 'movie'}
      <!-- svelte-ignore a11y_media_has_caption -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div class="movie-wrap" on:click={skipMovie} role="button" tabindex="-1">
        <video
          class="inspection-movie"
          autoplay
          muted
          playsinline
          bind:this={videoEl}
          on:ended={onMovieEnded}
        >
          <source src="/movies/inspection.mp4" type="video/mp4" />
        </video>
        <p class="skip-hint">クリックでスキップ</p>
      </div>
    {/if}

    <!-- 背景: イベントCG -->
    <div class="bg-image" class:visible={phase !== 'fade-in' && phase !== 'movie'}>
      <img src="/images/events/inspection_evaluation.png" alt="" />
      <div class="bg-dim" />
    </div>

    <!-- パーティクル層 -->
    {#if particles.length > 0}
      <div class="particles">
        {#each particles as p (p.id)}
          {#if p.type === 'confetti'}
            <div
              class="particle confetti"
              style="
                left: {p.x}%;
                top: {p.y}%;
                width: {p.size}px;
                height: {p.size * 0.6}px;
                background: {p.color};
                animation-delay: {p.delay}s;
                animation-duration: {p.duration}s;
                --drift-px: {p.driftPx}px;
                --wobble-px: {p.wobblePx}px;
                --rotation: {p.rotation}deg;
                --rx: {p.rotateX}deg;
                --ry: {p.rotateY}deg;
              "
            />
          {:else if p.type === 'spark'}
            <div
              class="particle spark"
              style="
                left: {p.x}%;
                top: {p.y}%;
                width: {p.size}px;
                height: {p.size}px;
                background: {p.color};
                box-shadow: 0 0 {p.size * 2}px {p.color};
                animation-delay: {p.delay}s;
                animation-duration: {p.duration}s;
                --drift-px: {p.driftPx}px;
              "
            />
          {:else if p.type === 'firework'}
            <div
              class="particle firework"
              style="
                left: {p.x}%;
                top: {p.y}%;
                width: {p.size}px;
                height: {p.size}px;
                background: {p.color};
                box-shadow: 0 0 {p.size * 3}px {p.color}, 0 0 {p.size * 6}px {p.color};
                animation-delay: {p.delay}s;
                animation-duration: {p.duration}s;
              "
            />
          {/if}
        {/each}
      </div>
    {/if}

    <!-- コンテンツ -->
    <div class="content">
      <!-- タイトル -->
      {#if phase === 'title' || phase === 'criteria' || phase === 'grade' || phase === 'fade-out'}
        <div class="header" class:visible={true}>
          <div class="header-sub">師匠組合 定期査察</div>
          <div class="header-main">{data.month}月末 — {data.title}</div>
        </div>
      {/if}

      <!-- 評価項目 -->
      {#if phase === 'criteria' || phase === 'grade' || phase === 'fade-out'}
        <div class="criteria-list">
          {#each data.criteria as c, i}
            {#if i < revealedCriteria}
              <div class="criterion" style="animation-delay: 0s">
                <span class="criterion-label">{c.label}</span>
                <span class="criterion-value">{c.value}</span>
                <span class="criterion-arrow">→</span>
                <span class="criterion-grade" style="color: {gradeColor(c.grade)}">{c.grade}等級</span>
              </div>
            {/if}
          {/each}
        </div>
      {/if}

      <!-- 総合等級スタンプ -->
      {#if showGrade}
        <div class="grade-stamp-wrap">
          {#if gradeStamped && data.passed}
            <div class="burst-rays" style="--ray-color: {gradeColor(data.overallGrade)}">
              {#each Array(8) as _, i}
                <div class="ray" style="
                  --angle: {i * 45 + (Math.random() - 0.5) * 20}deg;
                  --len: {200 + Math.random() * 200}px;
                  --w: {8 + Math.random() * 60}px;
                  --opacity: {0.25 + Math.random() * 0.35};
                " />
              {/each}
            </div>
          {/if}
          <div class="grade-stamp" class:stamped={gradeStamped} class:fail={!data.passed}>
            <div class="grade-label">総合評価</div>
            <div class="grade-value" style="color: {gradeColor(data.overallGrade)}">{data.overallGrade}</div>
            <div class="grade-result">{data.passed ? '合格' : '不合格'}</div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .inspection-backdrop {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: #000;
    pointer-events: all;
  }

  .cutscene-overlay {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-width: 960px;
    margin: 0 auto;
    z-index: 1050;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    pointer-events: all;
    opacity: 1;
    overflow: hidden;
  }

  .cutscene-overlay.entering {
    animation: fadeIn 0.5s ease-out both;
  }

  .cutscene-overlay.leaving {
    animation: fadeOut 0.6s ease-in forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  /* ムービー */
  .movie-wrap {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    cursor: pointer;
  }

  .inspection-movie {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .skip-hint {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.8rem;
    pointer-events: none;
  }

  /* 背景CG */
  .bg-image {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.8s ease-out;
  }

  .bg-image.visible {
    opacity: 1;
  }

  .bg-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .bg-dim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(0, 0, 0, 0.6) 40%,
      rgba(0, 0, 0, 0.85) 100%
    );
  }

  /* パーティクル */
  .particles {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    perspective: 800px;
  }

  .particle {
    position: absolute;
    border-radius: 2px;
  }

  .particle.confetti {
    animation: confettiFall linear both;
    transform-style: preserve-3d;
  }

  .particle.spark {
    border-radius: 50%;
    animation: sparkFall linear both;
  }

  .particle.firework {
    border-radius: 50%;
    animation: fireworkBurst ease-out both;
  }

  @keyframes confettiFall {
    0% {
      opacity: 0;
      transform: translateY(0) translateX(0) rotateX(0deg) rotateY(0deg) rotate(var(--rotation, 0deg)) scale(1);
    }
    8% {
      opacity: 1;
      transform: translateY(3vh) translateX(calc(var(--wobble-px) * 0.3)) rotateX(calc(var(--rx) * 0.08)) rotateY(calc(var(--ry) * 0.08)) rotate(calc(var(--rotation) + 30deg)) scale(1);
    }
    20% {
      opacity: 1;
      transform: translateY(8vh) translateX(calc(var(--wobble-px) * -0.4)) rotateX(calc(var(--rx) * 0.2)) rotateY(calc(var(--ry) * 0.2)) rotate(calc(var(--rotation) + 75deg)) scale(0.98);
    }
    40% {
      opacity: 0.95;
      transform: translateY(24vh) translateX(calc(var(--wobble-px) * 0.3)) rotateX(calc(var(--rx) * 0.4)) rotateY(calc(var(--ry) * 0.4)) rotate(calc(var(--rotation) + 170deg)) scale(0.95);
    }
    55% {
      opacity: 0.85;
      transform: translateY(42vh) translateX(calc(var(--wobble-px) * -0.2 + var(--drift-px) * 0.3)) rotateX(calc(var(--rx) * 0.55)) rotateY(calc(var(--ry) * 0.55)) rotate(calc(var(--rotation) + 230deg)) scale(0.92);
    }
    70% {
      opacity: 0.6;
      transform: translateY(62vh) translateX(calc(var(--wobble-px) * 0.1 + var(--drift-px) * 0.6)) rotateX(calc(var(--rx) * 0.7)) rotateY(calc(var(--ry) * 0.7)) rotate(calc(var(--rotation) + 290deg)) scale(0.9);
    }
    85% {
      opacity: 0.3;
      transform: translateY(82vh) translateX(calc(var(--drift-px) * 0.85)) rotateX(calc(var(--rx) * 0.85)) rotateY(calc(var(--ry) * 0.85)) rotate(calc(var(--rotation) + 330deg)) scale(0.87);
    }
    100% {
      opacity: 0;
      transform: translateY(100vh) translateX(var(--drift-px)) rotateX(var(--rx)) rotateY(var(--ry)) rotate(calc(var(--rotation) + 360deg)) scale(0.85);
    }
  }

  @keyframes sparkFall {
    0% {
      opacity: 0;
      transform: translateY(0) translateX(0) scale(1);
    }
    8% {
      opacity: 1;
      transform: translateY(3vh) translateX(calc(var(--drift-px, 0px) * 0.1)) scale(1);
    }
    50% {
      opacity: 0.8;
      transform: translateY(40vh) translateX(calc(var(--drift-px, 0px) * 0.5)) scale(0.6);
    }
    100% {
      opacity: 0;
      transform: translateY(80vh) translateX(var(--drift-px, 0px)) scale(0);
    }
  }

  @keyframes fireworkBurst {
    0% {
      opacity: 0;
      transform: scale(0);
    }
    15% {
      opacity: 1;
      transform: scale(4);
    }
    40% {
      opacity: 0.8;
      transform: scale(2);
    }
    100% {
      opacity: 0;
      transform: scale(0);
    }
  }

  /* コンテンツ */
  .content {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem;
    width: 100%;
    max-width: 500px;
  }

  /* ヘッダー */
  .header {
    text-align: center;
    animation: slideUp 0.5s ease-out both;
  }

  .header-sub {
    font-size: 0.85rem;
    color: #a0a0b0;
    letter-spacing: 0.15em;
    margin-bottom: 0.3rem;
  }

  .header-main {
    font-size: 1.5rem;
    font-weight: bold;
    color: #f4e4bc;
    text-shadow: 0 0 15px rgba(244, 228, 188, 0.3);
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* 評価項目 */
  .criteria-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .criterion {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 1rem;
    background: rgba(0, 0, 0, 0.5);
    border-left: 3px solid #4a4a6a;
    border-radius: 0 6px 6px 0;
    animation: criterionIn 0.4s ease-out both;
  }

  @keyframes criterionIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .criterion-label {
    font-size: 0.9rem;
    color: #c0c0d0;
    min-width: 5em;
  }

  .criterion-value {
    font-size: 1rem;
    font-weight: bold;
    color: #e0e0f0;
  }

  .criterion-arrow {
    color: #606080;
    font-size: 0.9rem;
  }

  .criterion-grade {
    font-size: 1.1rem;
    font-weight: bold;
    letter-spacing: 0.05em;
  }

  /* 放射線 */
  .grade-stamp-wrap {
    position: relative;
  }

  .burst-rays {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    z-index: -1;
    animation: raysRotate 8s linear infinite, raysFadeIn 0.6s ease-out both;
  }

  .ray {
    position: absolute;
    top: calc(var(--w, 10px) / -2);
    left: 0;
    width: var(--len, 300px);
    height: var(--w, 10px);
    transform-origin: 0 50%;
    transform: rotate(var(--angle, 0deg));
    background: linear-gradient(
      90deg,
      var(--ray-color, #ffd700) 0%,
      transparent 100%
    );
    opacity: var(--opacity, 0.4);
    clip-path: polygon(0 50%, 100% 0, 100% 100%);
  }

  @keyframes raysRotate {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  @keyframes raysFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* 総合等級スタンプ */
  .grade-stamp {
    text-align: center;
    margin-top: 0.5rem;
    transform: scale(2.5);
    opacity: 0;
    transition: transform 0.15s cubic-bezier(0.2, 0, 0.3, 1), opacity 0.1s;
  }

  .grade-stamp.stamped {
    transform: scale(1);
    opacity: 1;
  }

  .grade-label {
    font-size: 0.8rem;
    color: #a0a0b0;
    letter-spacing: 0.1em;
    margin-bottom: 0.2rem;
  }

  .grade-value {
    font-size: 4rem;
    font-weight: 900;
    line-height: 1;
    text-shadow: 0 0 30px currentColor;
  }

  .grade-result {
    font-size: 1.1rem;
    font-weight: bold;
    color: #90e090;
    margin-top: 0.3rem;
    letter-spacing: 0.15em;
  }

  .grade-stamp.fail .grade-result {
    color: #e05050;
  }
</style>
