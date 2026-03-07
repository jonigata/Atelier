<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState, skipPresentation } from '$lib/stores/game';
  import { resolveDayTransition } from '$lib/services/presentation';
  import { INSPECTION_DAYS } from '$lib/data/inspection';

  let visible = true; // 初期表示は黒画面から
  let initialLoad = true;
  let transitioning = false;
  let displayDay = 0;
  let daysAdvanced = 0;

  onMount(() => {
    // オートロード時は pendingDayTransition が null のまま → 黒画面を解除
    requestAnimationFrame(() => {
      if (!transitioning && !$gameState.pendingDayTransition) {
        visible = false;
        initialLoad = false;
      }
    });
  });

  $: inspectionKnown = $gameState.achievementProgress.completed.includes('ach_q1_goal_reminder');
  // 未処理の査察が控えている場合（査察シーケンスがこの直後に再生される）はカウントダウンを出さない
  $: hasPendingInspection = INSPECTION_DAYS.some(d => d < displayDay && d !== 336 && !$gameState.completedInspections.includes(d));
  $: nextInspectionDay = hasPendingInspection ? null : (INSPECTION_DAYS.find((d) => d >= displayDay) ?? null);
  $: daysUntilInspection = nextInspectionDay !== null ? nextInspectionDay - displayDay : null;
  $: inspectionUrgency = daysUntilInspection !== null
    ? daysUntilInspection <= 7 ? 'red' : daysUntilInspection <= 21 ? 'yellow' : 'green'
    : 'green';
  let showText = false;
  let fading: 'in' | 'out' | null = null;
  let timers: ReturnType<typeof setTimeout>[] = [];

  // pendingDayTransitionを監視して演出を表示
  $: if ($gameState.pendingDayTransition && !transitioning) {
    displayDay = $gameState.pendingDayTransition.toDay;
    daysAdvanced = $gameState.pendingDayTransition.daysAdvanced;
    startTransition();
  }

  function clearTimers() {
    for (const t of timers) clearTimeout(t);
    timers = [];
  }

  function startTransition() {
    clearTimers();
    transitioning = true;
    visible = true;
    showText = false;

    // 演出スキップがオンの場合
    if ($skipPresentation) {
      timers.push(setTimeout(() => { visible = false; fading = null; transitioning = false; resolveDayTransition(); }, 50));
      return;
    }

    if (initialLoad) {
      // 初回: すでに黒画面なのでフェードイン不要
      initialLoad = false;
      fading = null;
      timers.push(setTimeout(() => { showText = true; }, 100));
      timers.push(setTimeout(() => { showText = false; fading = 'out'; }, 1100));
      timers.push(setTimeout(() => { visible = false; fading = null; transitioning = false; resolveDayTransition(); }, 1600));
    } else {
      // 通常: フェードで暗転してからテキスト表示
      fading = 'in';
      timers.push(setTimeout(() => { fading = null; showText = true; }, 350));
      timers.push(setTimeout(() => { showText = false; fading = 'out'; }, 1350));
      timers.push(setTimeout(() => { visible = false; fading = null; transitioning = false; resolveDayTransition(); }, 1850));
    }
  }
</script>

{#if visible}
  <div
    class="day-transition-overlay"
    class:fade-in={fading === 'in'}
    class:fade-out={fading === 'out'}
  >
    <img class="title-logo" class:visible={showText} src="/images/title-logo.webp" alt="コレットの村おこし工房" />
    <div class="transition-content" class:visible={showText}>
      {#if daysAdvanced > 0}
        <div class="days-passed">
          {#if daysAdvanced === 1}
            1日が経過...
          {:else}
            {daysAdvanced}日が経過...
          {/if}
        </div>
      {/if}
      <div class="current-day">
        {displayDay}日目
      </div>
      {#if inspectionKnown && daysUntilInspection !== null}
        <div class="inspection-countdown {inspectionUrgency}">
          査察まで あと{daysUntilInspection}日
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .day-transition-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-cutscene);
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    pointer-events: all;
    opacity: 1;
  }

  .day-transition-overlay.fade-in {
    animation: fadeToBlack 0.3s ease-in both;
  }

  .day-transition-overlay.fade-out {
    animation: fadeFromBlack 0.5s ease-out forwards;
  }

  @keyframes fadeToBlack {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeFromBlack {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  .title-logo {
    position: absolute;
    top: 25%;
    width: min(640px, 80vw);
    height: auto;
    filter: drop-shadow(0 0 12px rgba(244, 228, 188, 0.3));
    opacity: 0;
    transition: opacity 0.3s ease-out;
  }

  .title-logo.visible {
    opacity: 1;
  }

  .transition-content {
    position: absolute;
    top: 55%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.3s ease-out, transform 0.3s ease-out;
  }

  .transition-content.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .days-passed {
    font-size: 1rem;
    color: #c9a959;
    letter-spacing: 0.1em;
  }

  .current-day {
    font-size: 2rem;
    font-weight: bold;
    color: #f4e4bc;
    text-shadow: 0 0 10px rgba(244, 228, 188, 0.3);
  }

  .inspection-countdown {
    font-size: 1.2rem;
    font-weight: bold;
    letter-spacing: 0.08em;
    margin-top: 0.5rem;
    text-shadow: 0 0 8px currentColor;
  }

  .inspection-countdown.green {
    color: #81c784;
  }

  .inspection-countdown.yellow {
    color: #ffd54f;
  }

  .inspection-countdown.red {
    color: #ff8a65;
  }
</style>
