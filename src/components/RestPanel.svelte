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

<div class="rest-panel panel">
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
        class="stamina-fill"
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
  <button class="btn-action" on:click={handleRest}>
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
        <div class="video-hint"><ContinueMarker visible={canSkipVideo} /></div>
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

  p {
    color: var(--text-body);
  }

  .stamina-display {
    margin: 1rem 0;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: var(--radius-sm);
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
    border-radius: var(--radius-sm);
    color: var(--accent-red);
    font-size: 1rem;
    font-weight: bold;
  }

  .stamina-bar-container {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .fatigue-note {
    margin-top: 0.5rem;
    font-size: 1rem;
    color: var(--accent-orange);
  }

  .btn-action {
    margin-top: 1rem;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }

  .btn-action:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-dim);
  }

  /* --- 休息シーケンス専用オーバーレイ --- */
  .rest-backdrop {
    position: fixed;
    inset: 0;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
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
    color: var(--text-heading);
    font-weight: bold;
    animation: textPulse 1.5s ease-in-out infinite alternate;
  }

  .video-hint {
    font-size: 0.85rem;
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
