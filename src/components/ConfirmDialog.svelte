<script lang="ts">
  import { pendingConfirm, resolveConfirm } from '$lib/stores/confirmDialog';

  $: data = $pendingConfirm;

  function handleConfirm() {
    resolveConfirm(true);
  }

  function handleCancel() {
    resolveConfirm(false);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!data) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      handleConfirm();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleCancel();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if data}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="confirm-overlay" role="dialog" tabindex="-1">
    <div class="confirm-box">
      {#if data.eventImage}
        <div class="confirm-image-container">
          <img class="confirm-image" src={data.eventImage} alt="" />
        </div>
      {/if}
      <div class="confirm-message">{data.message}</div>
      <div class="confirm-buttons">
        <button class="confirm-btn cancel" on:click={handleCancel}>
          {data.cancelLabel ?? 'やめる'}
        </button>
        <button class="confirm-btn ok" on:click={handleConfirm}>
          {data.confirmLabel ?? 'はい'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    user-select: none;
    animation: overlayFadeIn 0.2s ease-out;
  }

  @keyframes overlayFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .confirm-box {
    background: linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%);
    border: 2px solid #8b7355;
    border-radius: 12px;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    animation: boxPopIn 0.2s ease-out;
  }

  @keyframes boxPopIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .confirm-image-container {
    width: 100%;
  }

  .confirm-image {
    width: 100%;
    display: block;
    border-bottom: 2px solid #8b7355;
  }

  .confirm-message {
    padding: 1.5rem 2rem;
    font-size: 1.05rem;
    line-height: 1.7;
    color: #e0e0f0;
    white-space: pre-line;
  }

  .confirm-buttons {
    display: flex;
    gap: 0.75rem;
    padding: 0 2rem 1.5rem;
    justify-content: center;
  }

  .confirm-btn {
    flex: 1;
    max-width: 160px;
    padding: 0.7rem 1.5rem;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .confirm-btn:hover {
    transform: translateY(-1px);
  }

  .confirm-btn.ok {
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    color: #1a1a2e;
  }

  .confirm-btn.ok:hover {
    box-shadow: 0 2px 12px rgba(201, 169, 89, 0.4);
  }

  .confirm-btn.cancel {
    background: transparent;
    border: 1px solid #6a6a8a;
    color: #a0a0b0;
  }

  .confirm-btn.cancel:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: #8a8aaa;
    color: #c0c0d0;
  }
</style>
