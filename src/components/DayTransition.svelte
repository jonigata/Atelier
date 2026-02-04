<script lang="ts">
  import { gameState } from '$lib/stores/game';

  let visible = false;
  let daysAdvanced = 0;
  let previousDay = 1;
  let timeoutId: number | undefined;

  // 日付の変更を監視
  $: {
    const currentDay = $gameState.day;
    if (currentDay > previousDay && previousDay > 0) {
      daysAdvanced = currentDay - previousDay;
      showTransition();
    }
    previousDay = currentDay;
  }

  function showTransition() {
    // 既存のタイマーをクリア
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    visible = true;

    // 1.5秒後にフェードアウト
    timeoutId = setTimeout(() => {
      visible = false;
    }, 1500) as unknown as number;
  }
</script>

{#if visible}
  <div class="day-transition" class:fade-out={!visible}>
    <div class="transition-content">
      <div class="days-passed">
        {#if daysAdvanced === 1}
          1日が経過...
        {:else}
          {daysAdvanced}日が経過...
        {/if}
      </div>
      <div class="current-day">
        {$gameState.day}日目
      </div>
    </div>
  </div>
{/if}

<style>
  .day-transition {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 900;
    pointer-events: none;
    animation: fadeInOut 1.5s ease-in-out;
  }

  .transition-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem 3rem;
    background: rgba(26, 26, 46, 0.95);
    border: 2px solid #c9a959;
    border-radius: 12px;
    box-shadow: 0 0 30px rgba(201, 169, 89, 0.3);
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

  @keyframes fadeInOut {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.9);
    }
    15% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    85% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(1.05);
    }
  }
</style>
