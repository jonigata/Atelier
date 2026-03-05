<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { getFatigueLabel } from '$lib/services/alchemy';
  import { executeRest } from '$lib/services/restSequence';
  import type { RestEventDef, ResolvedReward } from '$lib/data/restEvents';
  import RestEventDialog from './RestEventDialog.svelte';
  import ContinueMarker from './common/ContinueMarker.svelte';

  export let onBack: () => void;

  $: fatigueLabel = getFatigueLabel($gameState.stamina);
  $: staminaPercent = Math.round(($gameState.stamina / $gameState.maxStamina) * 100);
  $: isFullStamina = $gameState.stamina >= $gameState.maxStamina;

  // --- シーケンス用の状態 ---
  let backdrop = false;
  let playingVideo = false;
  let canSkipVideo = false;
  let restEvent: { event: RestEventDef; rewards: ResolvedReward[] } | null = null;
  let eventDialogResolver: (() => void) | null = null;
  let videoResolver: (() => void) | null = null;

  function handleRest() {
    executeRest({
      showBackdrop() {
        backdrop = true;
      },
      showEventDialog(event, rewards) {
        return new Promise<void>((resolve) => {
          restEvent = { event, rewards };
          eventDialogResolver = resolve;
        });
      },
      hideEventDialog() {
        restEvent = null;
        eventDialogResolver = null;
      },
      playVideo() {
        return new Promise<void>((resolve) => {
          playingVideo = true;
          videoResolver = resolve;
          setTimeout(() => { canSkipVideo = true; }, 500);
        });
      },
      leave() {
        onBack();
      },
    });
  }

  function onEventClose() {
    if (eventDialogResolver) {
      eventDialogResolver();
    }
  }

  function endVideo() {
    if (!videoResolver) return;
    videoResolver();
    videoResolver = null;
    playingVideo = false;
    canSkipVideo = false;
  }

  function handleVideoClick() {
    if (canSkipVideo) endVideo();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!canSkipVideo) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      endVideo();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="rest-panel">
  <p>体力を全回復します。1日経過します。</p>
  <div class="stamina-display">
    <div class="stamina-header">
      <span>現在の体力: {$gameState.stamina} / {$gameState.maxStamina}</span>
      {#if fatigueLabel}
        <span class="fatigue-badge">{fatigueLabel}</span>
      {/if}
    </div>
    <div class="stamina-bar-container">
      <div
        class="stamina-bar"
        class:high={staminaPercent >= 50}
        class:medium={staminaPercent >= 30 && staminaPercent < 50}
        class:low={staminaPercent >= 10 && staminaPercent < 30}
        class:critical={staminaPercent < 10}
        style="width: {staminaPercent}%"
      ></div>
    </div>
    {#if fatigueLabel}
      <p class="fatigue-note">疲労状態では調合の成功率が低下します。</p>
    {/if}
  </div>
  <button class="action-btn" on:click={handleRest}>
    休息する
  </button>
</div>

<!-- 休息シーケンス専用オーバーレイ（z-1000: DayTransition z-1100 の下） -->
<!-- RestPanel unmount まで維持 → DayTransition に引き継ぐ -->
{#if backdrop}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="rest-backdrop" class:clickable={canSkipVideo} on:click={handleVideoClick} role="button" tabindex="-1">
    {#if playingVideo}
      <div class="video-container">
        <!-- svelte-ignore a11y_media_has_caption -->
        <video class="video-player" autoplay muted on:ended={endVideo}>
          <source src="/movies/rest.mp4" type="video/mp4" />
        </video>
        <div class="video-text">休息中...</div>
        {#if canSkipVideo}<div class="video-hint"><ContinueMarker /></div>{/if}
      </div>
    {/if}
  </div>
{/if}

{#if restEvent}
  <RestEventDialog event={restEvent.event} rewards={restEvent.rewards} onClose={onEventClose} />
{/if}

<style>
  .rest-panel {
  }


  h2 {
    font-size: 1.5rem;
    color: #f4e4bc;
    margin-bottom: 1rem;
  }

  p {
    color: #e0e0f0;
  }

  .stamina-display {
    margin: 1rem 0;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .stamina-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #c0c0d0;
    margin-bottom: 0.5rem;
  }

  .fatigue-badge {
    padding: 0.15rem 0.5rem;
    background: rgba(255, 107, 107, 0.2);
    border: 1px solid rgba(255, 107, 107, 0.5);
    border-radius: 4px;
    color: #ff6b6b;
    font-size: 1rem;
    font-weight: bold;
  }

  .stamina-bar-container {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }

  .stamina-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .stamina-bar.high {
    background: linear-gradient(90deg, #4caf50, #81c784);
  }

  .stamina-bar.medium {
    background: linear-gradient(90deg, #ff9800, #ffc107);
  }

  .stamina-bar.low {
    background: linear-gradient(90deg, #ff5722, #ff9800);
  }

  .stamina-bar.critical {
    background: linear-gradient(90deg, #f44336, #ff5722);
  }

  .fatigue-note {
    margin-top: 0.5rem;
    font-size: 1rem;
    color: #ff9800;
  }

  .action-btn {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 6px;
    color: #1a1a2e;
    font-weight: bold;
    cursor: pointer;
    margin-top: 1rem;
  }

  .action-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(201, 169, 89, 0.4);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.1);
    color: #808090;
  }

  /* --- 休息シーケンス専用オーバーレイ --- */
  .rest-backdrop {
    position: fixed;
    inset: 0;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    user-select: none;
  }

  .rest-backdrop.clickable {
    cursor: pointer;
  }

  .video-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    animation: fadeIn 0.5s ease-out;
  }

  .video-player {
    max-width: 480px;
    width: 90vw;
    border-radius: 12px;
    box-shadow: 0 0 40px rgba(201, 169, 89, 0.2);
  }

  .video-text {
    font-size: 1.3rem;
    color: #f4e4bc;
    font-weight: bold;
    animation: textPulse 1.5s ease-in-out infinite alternate;
  }

  .video-hint {
    font-size: 0.85rem;
    color: #6a6a8a;
    visibility: hidden;
  }

  .video-hint.visible {
    visibility: visible;
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes textPulse {
    from { opacity: 0.5; }
    to { opacity: 1; }
  }
</style>
