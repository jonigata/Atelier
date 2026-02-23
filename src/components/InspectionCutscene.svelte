<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { resolveInspectionCutscene } from '$lib/services/presentation';
  import type { InspectionCutsceneData } from '$lib/models/types';

  let visible = false;
  let transitioning = false;
  let timers: ReturnType<typeof setTimeout>[] = [];

  // 演出フェーズ
  let phase: 'fade-in' | 'image' | 'title' | 'criteria' | 'grade' | 'fade-out' | 'idle' = 'idle';
  let data: InspectionCutsceneData | null = null;
  let revealedCriteria = 0;
  let showGrade = false;
  let gradeStamped = false;

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
    phase = 'fade-in';
    revealedCriteria = 0;
    showGrade = false;
    gradeStamped = false;

    // 演出スキップ
    if ($gameState.skipPresentation) {
      after(50, finish);
      return;
    }

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
    after(t, () => { gradeStamped = true; });

    // ホールド
    t += 2000;

    // フェードアウト
    after(t, () => { phase = 'fade-out'; });
    t += 600;
    after(t, finish);
  }

  function finish() {
    visible = false;
    phase = 'idle';
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

{#if visible && data}
  <div
    class="cutscene-overlay"
    class:entering={phase === 'fade-in'}
    class:leaving={phase === 'fade-out'}
  >
    <!-- 背景: イベントCG -->
    <div class="bg-image" class:visible={phase !== 'fade-in'}>
      <img src="/images/events/inspection_evaluation.png" alt="" />
      <div class="bg-dim" />
    </div>

    <!-- コンテンツ -->
    <div class="content">
      <!-- タイトル -->
      {#if phase === 'title' || phase === 'criteria' || phase === 'grade'}
        <div class="header" class:visible={true}>
          <div class="header-sub">師匠組合 定期査察</div>
          <div class="header-main">{data.month}月末 — {data.title}</div>
        </div>
      {/if}

      <!-- 評価項目 -->
      {#if phase === 'criteria' || phase === 'grade'}
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
        <div class="grade-stamp" class:stamped={gradeStamped} class:fail={!data.passed}>
          <div class="grade-label">総合評価</div>
          <div class="grade-value" style="color: {gradeColor(data.overallGrade)}">{data.overallGrade}</div>
          <div class="grade-result">{data.passed ? '合格' : '不合格'}</div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .cutscene-overlay {
    position: fixed;
    inset: 0;
    z-index: 1050;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    pointer-events: all;
    opacity: 1;
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

  /* コンテンツ */
  .content {
    position: relative;
    z-index: 1;
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
