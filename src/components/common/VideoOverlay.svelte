<script lang="ts">
  export let src: string;
  export let text: string = '';
  export let onEnd: () => void;

  let canSkip = false;

  import { onMount } from 'svelte';

  onMount(() => {
    const timer = setTimeout(() => {
      canSkip = true;
    }, 500);
    return () => clearTimeout(timer);
  });

  function handleSkip() {
    if (!canSkip) return;
    onEnd();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!canSkip) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      onEnd();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="video-overlay" class:clickable={canSkip} on:click={handleSkip} role="button" tabindex="-1">
  <div class="video-container">
    <!-- svelte-ignore a11y_media_has_caption -->
    <video class="video-player" autoplay muted on:ended={onEnd}>
      <source {src} type="video/mp4" />
    </video>
    {#if text}
      <div class="video-text">{text}</div>
    {/if}
    <div class="video-hint" class:visible={canSkip}>クリック または Enter でスキップ</div>
  </div>
</div>

<style>
  .video-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    user-select: none;
    animation: fadeIn 0.5s ease-out;
  }

  .video-overlay.clickable {
    cursor: pointer;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .video-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
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

  @keyframes textPulse {
    from { opacity: 0.5; }
    to { opacity: 1; }
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
</style>
