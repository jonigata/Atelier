<script lang="ts">
  import { gameState, clearDayTransition } from '$lib/stores/game';

  let visible = false;
  let displayDay = 0;
  let daysAdvanced = 0;
  let animationKey = 0;

  // pendingDayTransitionを監視して演出を表示
  $: if ($gameState.pendingDayTransition) {
    displayDay = $gameState.pendingDayTransition.toDay;
    daysAdvanced = $gameState.pendingDayTransition.daysAdvanced;
    showTransition();
  }

  function showTransition() {
    animationKey++; // アニメーション再開用
    visible = true;
  }

  function handleAnimationEnd() {
    visible = false;
    clearDayTransition();
  }
</script>

{#if visible}
  {#key animationKey}
    <!-- 全画面オーバーレイ（クリックを吸収して背景への操作を防ぐ） -->
    <div class="day-transition-overlay">
      <div class="day-transition" on:animationend={handleAnimationEnd}>
        <div class="transition-content">
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
        </div>
      </div>
    </div>
  {/key}
{/if}

<style>
  .day-transition-overlay {
    position: fixed;
    inset: 0;
    z-index: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    /* 背景を軽くぼかして演出中であることを視覚的に示す */
    background: rgba(0, 0, 0, 0.3);
    /* クリックを吸収して背景への操作を防ぐ */
    pointer-events: all;
  }

  .day-transition {
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
      transform: scale(0.9);
    }
    15% {
      opacity: 1;
      transform: scale(1);
    }
    85% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.05);
    }
  }
</style>
