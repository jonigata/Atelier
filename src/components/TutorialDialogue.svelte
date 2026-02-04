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
      closeDialogue();
    }
  }

  function closeDialogue() {
    setTutorialDialogue(null);
    currentLine = 0;
    onDialogueClosed();
  }

  function skipDialogue(event: MouseEvent) {
    event.stopPropagation();
    closeDialogue();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!dialogue) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      nextLine();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeDialogue();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if dialogue}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="dialogue-overlay" on:click={nextLine} role="button" tabindex="0">
    <div class="dialogue-box">
      {#if dialogue.achievementTitle}
        <div class="achievement-header">
          <span class="achievement-badge">達成</span>
          <span class="achievement-title">{dialogue.achievementTitle}</span>
        </div>
      {/if}
      <div class="character-info">
        <span class="character-name">{dialogue.characterName}</span>
        <span class="character-title">{dialogue.characterTitle}</span>
      </div>
      <div class="dialogue-text">
        「{dialogue.lines[currentLine]}」
      </div>
      {#if dialogue.rewards && dialogue.rewards.length > 0}
        <div class="rewards-section">
          <span class="rewards-label">報酬</span>
          <div class="rewards-list">
            {#each dialogue.rewards as reward}
              <span class="reward-item">{reward}</span>
            {/each}
          </div>
        </div>
      {/if}
      <div class="continue-hint">
        <span class="hint-text">クリック または Enter で続ける</span>
        <div class="hint-right">
          <span class="progress">{currentLine + 1} / {dialogue.lines.length}</span>
          {#if dialogue.lines.length > 1}
            <button class="skip-button" on:click={skipDialogue}>スキップ</button>
          {/if}
        </div>
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

  .achievement-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #c9a959;
  }

  .achievement-badge {
    background: linear-gradient(135deg, #c9a959 0%, #f0d78c 50%, #c9a959 100%);
    color: #1a1a2e;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .achievement-title {
    font-size: 1.2rem;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
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

  .rewards-section {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba(201, 169, 89, 0.1);
    border: 1px solid rgba(201, 169, 89, 0.3);
    border-radius: 6px;
  }

  .rewards-label {
    background: #c9a959;
    color: #1a1a2e;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: bold;
    white-space: nowrap;
  }

  .rewards-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .reward-item {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    font-size: 0.9rem;
    color: #f0d78c;
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

  .hint-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .progress {
    font-size: 0.85rem;
    color: #6a6a8a;
  }

  .skip-button {
    padding: 0.3rem 0.75rem;
    background: transparent;
    border: 1px solid #6a6a8a;
    border-radius: 4px;
    color: #6a6a8a;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .skip-button:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #8a8aaa;
    color: #8a8aaa;
  }
</style>
