<script lang="ts">
  import { gameState, setTutorialDialogue } from '$lib/stores/game';
  import { onDialogueClosed } from '$lib/services/tutorial';

  let currentLine = 0;

  $: dialogue = $gameState.tutorialProgress.pendingDialogue;

  // ダイアログが変わったらリセット
  $: if (dialogue) {
    currentLine = 0;
  }

  function nextLine() {
    if (!dialogue) return;

    if (currentLine < dialogue.lines.length - 1) {
      currentLine++;
    } else {
      // 最後の行を表示し終えたらダイアログを閉じる
      setTutorialDialogue(null);
      currentLine = 0;
      onDialogueClosed();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (dialogue && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      nextLine();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if dialogue}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="dialogue-overlay" on:click={nextLine} role="button" tabindex="0">
    <div class="dialogue-box">
      <div class="character-info">
        <span class="character-name">{dialogue.characterName}</span>
        <span class="character-title">{dialogue.characterTitle}</span>
      </div>
      <div class="dialogue-text">
        「{dialogue.lines[currentLine]}」
      </div>
      <div class="continue-hint">
        <span class="hint-text">クリック または Enter で続ける</span>
        <span class="progress">{currentLine + 1} / {dialogue.lines.length}</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialogue-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 3rem;
    z-index: 1000;
    cursor: pointer;
  }

  .dialogue-box {
    background: linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%);
    border: 2px solid #8b7355;
    border-radius: 12px;
    padding: 1.5rem 2rem;
    max-width: 700px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .character-info {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #4a4a6a;
  }

  .character-name {
    font-size: 1.3rem;
    font-weight: bold;
    color: #c9a959;
  }

  .character-title {
    font-size: 0.9rem;
    color: #8a8aaa;
  }

  .dialogue-text {
    font-size: 1.1rem;
    line-height: 1.8;
    color: #e0e0f0;
    min-height: 3.6rem;
  }

  .continue-hint {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.25rem;
    padding-top: 0.75rem;
    border-top: 1px solid #4a4a6a;
  }

  .hint-text {
    font-size: 0.85rem;
    color: #6a6a8a;
  }

  .progress {
    font-size: 0.85rem;
    color: #6a6a8a;
  }
</style>
