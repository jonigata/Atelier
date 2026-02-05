<script lang="ts">
  import { gameState, setTutorialDialogue } from '$lib/stores/game';
  import { onDialogueClosed } from '$lib/services/tutorial';
  import { getItemIcon, handleIconError } from '$lib/data/items';

  let currentLine = 0;
  let showingRewards = false;  // 報酬画面を表示中かどうか
  let delayedDialogue: typeof $gameState.tutorialProgress.pendingDialogue = null;
  let delayTimeoutId: number | undefined;

  $: dialogue = $gameState.tutorialProgress.pendingDialogue;
  $: pendingTransition = $gameState.pendingDayTransition;
  $: hasRewards = delayedDialogue?.structuredRewards && delayedDialogue.structuredRewards.length > 0;

  // 演出がない、かつダイアログがある場合のみ表示
  $: {
    if (delayTimeoutId) {
      clearTimeout(delayTimeoutId);
      delayTimeoutId = undefined;
    }

    if (dialogue && !pendingTransition) {
      // 演出終了後、少し間を置いて表示
      delayTimeoutId = setTimeout(() => {
        delayedDialogue = dialogue;
        currentLine = 0;
        showingRewards = false;
      }, 100) as unknown as number;
    } else if (!dialogue) {
      delayedDialogue = null;
      showingRewards = false;
    }
  }

  function nextLine() {
    if (!delayedDialogue) return;

    if (showingRewards) {
      // 報酬画面からクリックで閉じる
      closeDialogue();
    } else if (currentLine < delayedDialogue.lines.length - 1) {
      currentLine++;
    } else if (hasRewards) {
      // 最後の行で報酬がある場合は報酬画面へ
      showingRewards = true;
    } else {
      closeDialogue();
    }
  }

  function closeDialogue() {
    setTutorialDialogue(null);
    currentLine = 0;
    showingRewards = false;
    onDialogueClosed();
  }

  function skipDialogue(event: MouseEvent) {
    event.stopPropagation();
    closeDialogue();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!delayedDialogue) return;

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

{#if delayedDialogue}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="dialogue-overlay" class:centered={showingRewards} on:click={nextLine} role="button" tabindex="0">
    {#if showingRewards && delayedDialogue.structuredRewards}
      <!-- 報酬画面 -->
      <div class="rewards-screen">
        <div class="rewards-header">
          <span class="rewards-title">報酬獲得！</span>
          {#if delayedDialogue.achievementTitle}
            <span class="achievement-subtitle">{delayedDialogue.achievementTitle}</span>
          {/if}
        </div>
        <div class="rewards-grid">
          {#each delayedDialogue.structuredRewards as reward}
            <div class="reward-card" class:has-icon={reward.itemId}>
              {#if reward.itemId}
                <img class="reward-card-icon" src={getItemIcon(reward.itemId)} alt="" on:error={handleIconError} />
              {:else if reward.type === 'money'}
                <span class="reward-card-emoji">💰</span>
              {:else if reward.type === 'reputation'}
                <span class="reward-card-emoji">⭐</span>
              {:else}
                <span class="reward-card-emoji">🎁</span>
              {/if}
              <span class="reward-card-text">{reward.text}</span>
            </div>
          {/each}
        </div>
        <div class="rewards-footer">
          <span class="hint-text">クリック または Enter で閉じる</span>
        </div>
      </div>
    {:else}
      <!-- 通常のダイアログ -->
      <div class="dialogue-box">
        {#if delayedDialogue.achievementTitle}
          <div class="achievement-header">
            <span class="achievement-badge">達成</span>
            <span class="achievement-title">{delayedDialogue.achievementTitle}</span>
          </div>
        {/if}
        <div class="character-info">
          <span class="character-name">{delayedDialogue.characterName}</span>
          <span class="character-title">{delayedDialogue.characterTitle}</span>
        </div>
        <div class="dialogue-text">
          「{delayedDialogue.lines[currentLine]}」
        </div>
        <div class="continue-hint">
          <span class="hint-text">クリック または Enter で続ける</span>
          <div class="hint-right">
            <span class="progress">{currentLine + 1} / {delayedDialogue.lines.length}{hasRewards ? ' + 報酬' : ''}</span>
            {#if delayedDialogue.lines.length > 1 || hasRewards}
              <button class="skip-button" on:click={skipDialogue}>スキップ</button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
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

  .dialogue-overlay.centered {
    align-items: center;
    padding-bottom: 0;
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

  /* 報酬画面 */
  .rewards-screen {
    background: linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%);
    border: 3px solid #c9a959;
    border-radius: 16px;
    padding: 2rem 2.5rem;
    max-width: 500px;
    width: 90%;
    box-shadow:
      0 0 40px rgba(201, 169, 89, 0.3),
      0 8px 32px rgba(0, 0, 0, 0.5);
    animation: rewardPopIn 0.3s ease-out;
  }

  @keyframes rewardPopIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .rewards-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .rewards-title {
    display: block;
    font-size: 1.6rem;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
    margin-bottom: 0.5rem;
  }

  .achievement-subtitle {
    font-size: 1rem;
    color: #c9a959;
  }

  .rewards-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .reward-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(201, 169, 89, 0.15);
    border: 2px solid rgba(201, 169, 89, 0.4);
    border-radius: 10px;
  }

  .reward-card-icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .reward-card-emoji {
    font-size: 2rem;
    width: 48px;
    text-align: center;
  }

  .reward-card-text {
    font-size: 1.15rem;
    font-weight: bold;
    color: #f0d78c;
  }

  .rewards-footer {
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid #4a4a6a;
  }
</style>
