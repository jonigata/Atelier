<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { skipPresentation, toggleSkipPresentation, setPhase } from '$lib/stores/game';
  import { bgmEnabled } from '$lib/stores/bgm';
  import { showConfirmAndWait } from '$lib/stores/confirmDialog';

  const dispatch = createEventDispatcher<{ close: void }>();

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      dispatch('close');
    }
  }

  async function handleRetire() {
    dispatch('close');
    const ok = await showConfirmAndWait({
      message: 'リタイアしてゲームを終了しますか？\n現在のスコアでエンディングになります。',
      confirmLabel: 'リタイアする',
      cancelLabel: 'キャンセル',
    });
    if (ok) {
      setPhase('ending');
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="overlay" on:click={handleOverlayClick} role="dialog" aria-modal="true">
  <div class="config-dialog">
    <div class="config-header">
      <span class="config-title">設定</span>
      <button class="close-btn" on:click={() => dispatch('close')}>✕</button>
    </div>

    <div class="config-body">
      <label class="config-toggle">
        <input
          type="checkbox"
          checked={$bgmEnabled}
          on:change={() => bgmEnabled.update(v => !v)}
        />
        <span>BGM</span>
      </label>

      <label class="config-toggle">
        <input
          type="checkbox"
          checked={$skipPresentation}
          on:change={toggleSkipPresentation}
        />
        <span>演出スキップ</span>
      </label>

      <div class="config-divider"></div>

      <button class="retire-btn" on:click={handleRetire}>リタイアする</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .config-dialog {
    background: linear-gradient(135deg, #3c2415 0%, #5a3820 100%);
    border: 2px solid #8b6914;
    border-radius: 8px;
    min-width: 240px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }

  .config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 1rem;
    border-bottom: 1px solid rgba(139, 105, 20, 0.4);
  }

  .config-title {
    font-size: 1rem;
    font-weight: bold;
    color: #f4e4bc;
  }

  .close-btn {
    background: none;
    border: none;
    color: #a08060;
    font-size: 1rem;
    cursor: pointer;
    padding: 0.1rem 0.3rem;
    line-height: 1;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: #f4e4bc;
  }

  .config-body {
    padding: 0.8rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .config-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: #d4c4a0;
    user-select: none;
    padding: 0.3rem 0.4rem;
    border-radius: 4px;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .config-toggle:has(input:checked) {
    color: #f4e4bc;
  }

  .config-toggle:hover {
    background-color: rgba(201, 169, 89, 0.1);
  }

  .config-toggle input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    cursor: pointer;
    border: 1px solid rgba(160, 128, 96, 0.5);
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.3);
    position: relative;
    transition: border-color 0.2s, background-color 0.2s;
    flex-shrink: 0;
  }

  .config-toggle input[type="checkbox"]:checked {
    border-color: #c9a959;
    background: rgba(201, 169, 89, 0.25);
  }

  .config-toggle input[type="checkbox"]:checked::after {
    content: '\2713';
    position: absolute;
    top: -1px;
    left: 2px;
    font-size: 13px;
    color: #c9a959;
    line-height: 16px;
  }

  .config-divider {
    height: 1px;
    background: rgba(139, 105, 20, 0.3);
    margin: 0.2rem 0;
  }

  .retire-btn {
    font-size: 0.85rem;
    color: #a08060;
    background: none;
    border: 1px solid rgba(160, 128, 96, 0.4);
    border-radius: 4px;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s, background-color 0.2s;
    text-align: center;
  }

  .retire-btn:hover {
    color: #e07050;
    border-color: rgba(224, 112, 80, 0.6);
    background-color: rgba(224, 112, 80, 0.1);
  }
</style>
