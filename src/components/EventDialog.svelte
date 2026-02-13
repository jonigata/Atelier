<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { resolveDialogue } from '$lib/services/presentation';
  import ItemCard from './common/ItemCard.svelte';
  import AnimatedGauge from './common/AnimatedGauge.svelte';
  import AchievementCategoryIcon from './common/AchievementCategoryIcon.svelte';
  import type { NarrativeLine } from '$lib/models/types';

  function getLineText(line: NarrativeLine): string {
    return typeof line === 'string' ? line : line.text;
  }

  function getLineExpression(line: NarrativeLine): string {
    return typeof line === 'string' ? 'neutral' : line.expression;
  }

  function getFaceImageUrl(faceId: string | undefined, expression: string): string | undefined {
    if (!faceId) return undefined;
    return `/images/characters/${faceId}/${faceId}-face-${expression}.png`;
  }

  type GaugeColor = 'gold' | 'blue' | 'green';
  function getGaugeColor(type: string): GaugeColor {
    switch (type) {
      case 'reputation': return 'gold';
      case 'exp': return 'blue';
      case 'villageDevelopment': return 'green';
      default: return 'blue';
    }
  }

  let currentLine = 0;
  let showingRewards = false;
  let closing = false;

  // ダイアログは pendingDialogue がセットされたら即座に表示
  // 日数表示との同期は presentation サービスが async/await で制御する
  $: dialogue = $gameState.tutorialProgress.pendingDialogue;
  $: hasRewards = dialogue?.structuredRewards && dialogue.structuredRewards.length > 0;

  // ゲージ報酬と通常報酬を分離
  $: gaugeRewards = dialogue?.structuredRewards?.filter(r => r.gaugeData) ?? [];
  $: normalRewards = dialogue?.structuredRewards?.filter(r => !r.gaugeData) ?? [];

  // ダイアログが変わったらリセット
  $: if (dialogue) {
    currentLine = 0;
    showingRewards = false;
    closing = false;
  }

  function nextLine() {
    if (!dialogue || closing) return;

    if (showingRewards) {
      closeDialogue();
    } else if (currentLine < dialogue.lines.length - 1) {
      currentLine++;
    } else if (hasRewards) {
      showingRewards = true;
    } else {
      closeDialogue();
    }
  }

  function closeDialogue() {
    if (closing) return;
    closing = true;
  }

  function handleFadeOutEnd() {
    closing = false;
    currentLine = 0;
    showingRewards = false;
    resolveDialogue();
  }

  function skipDialogue(event: MouseEvent) {
    event.stopPropagation();
    if (!showingRewards && hasRewards) {
      showingRewards = true;
    } else {
      closeDialogue();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!dialogue || closing) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      nextLine();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (!showingRewards && hasRewards) {
        showingRewards = true;
      } else {
        closeDialogue();
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if dialogue}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="dialogue-overlay" class:closing on:click={nextLine} on:animationend={closing ? handleFadeOutEnd : undefined} role="button" tabindex="0">
    {#if showingRewards && dialogue.structuredRewards}
      <!-- 報酬画面 -->
      <div class="rewards-screen" class:quest-reward={!!dialogue.rewardsTitle}>
        <div class="rewards-header">
          <span class="rewards-title">{dialogue.rewardsTitle ?? '目標達成！'}</span>
          {#if dialogue.achievementTitle}
            <span class="achievement-subtitle">{dialogue.achievementTitle}</span>
          {/if}
        </div>
        {#if normalRewards.length > 0}
          <div class="rewards-grid">
            {#each normalRewards as reward}
              <ItemCard
                itemId={reward.itemId}
                label={reward.text}
                iconUrl={reward.iconUrl}
                emoji={!reward.itemId && !reward.iconUrl ? (reward.type === 'money' ? '💰' : '🎁') : null}
              />
            {/each}
          </div>
        {/if}
        {#if gaugeRewards.length > 0}
          <div class="gauge-rewards">
            {#each gaugeRewards as reward}
              {#if reward.gaugeData}
                <AnimatedGauge
                  before={reward.gaugeData.before}
                  after={reward.gaugeData.after}
                  max={reward.gaugeData.max}
                  label={reward.gaugeData.label}
                  text={reward.text}
                  color={getGaugeColor(reward.type)}
                />
              {/if}
            {/each}
          </div>
        {/if}
        <div class="rewards-footer">
          <span class="hint-text">クリック または Enter で閉じる</span>
        </div>
      </div>
    {:else}
      <!-- 通常のダイアログ -->
      <div class="dialogue-box" class:has-event-image={!!dialogue.eventImage}>
        {#if dialogue.eventImage}
          <div class="event-image-container">
            <img class="event-image" src={dialogue.eventImage} alt="イベント" />
          </div>
        {/if}
        {#if dialogue.achievementTitle}
          <div class="achievement-header">
            {#if dialogue.achievementCategory}
              <div class="achievement-icon">
                <AchievementCategoryIcon category={dialogue.achievementCategory} size="large" />
              </div>
            {/if}
            <div class="achievement-info">
              <span class="achievement-badge">達成</span>
              <span class="achievement-title">{dialogue.achievementTitle}</span>
            </div>
          </div>
        {/if}
        <div class="dialogue-body" class:has-face={!!dialogue.characterFaceId}>
          {#if dialogue.characterFaceId}
            <div class="face-column">
              <img class="character-face" src={getFaceImageUrl(dialogue.characterFaceId, getLineExpression(dialogue.lines[currentLine]))} alt={dialogue.characterName} />
            </div>
          {/if}
          <div class="text-column">
            <div class="character-info">
              <span class="character-name">{dialogue.characterName}</span>
              <span class="character-title">{dialogue.characterTitle}</span>
            </div>
            <div class="dialogue-text">
              「{getLineText(dialogue.lines[currentLine])}」
            </div>
          </div>
        </div>
        <div class="continue-hint">
          <span class="hint-text">クリック または Enter で続ける</span>
          <div class="hint-right">
            <span class="progress">{currentLine + 1} / {dialogue.lines.length}{hasRewards ? ' + 報酬' : ''}</span>
            {#if dialogue.lines.length > 1 || hasRewards}
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
    align-items: center;
    justify-content: center;
    z-index: 1000;
    cursor: pointer;
    user-select: none;
    animation: overlayFadeIn 0.2s ease-out;
  }

  .dialogue-overlay.closing {
    animation: overlayFadeOut 0.2s ease-out forwards;
    pointer-events: none;
  }

  @keyframes overlayFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes overlayFadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
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

  .dialogue-box.has-event-image {
    padding-top: 0;
    overflow: hidden;
  }

  .event-image-container {
    margin: 0 -2rem;
    margin-bottom: 1rem;
  }

  .event-image {
    width: 100%;
    display: block;
    border-bottom: 2px solid #8b7355;
  }

  .achievement-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #c9a959;
  }

  .achievement-icon {
    flex-shrink: 0;
  }

  .achievement-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .achievement-badge {
    display: inline-block;
    width: fit-content;
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

  .dialogue-body {
    display: flex;
    gap: 1.25rem;
    min-height: 120px;
  }

  .face-column {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
  }

  .character-face {
    width: 120px;
    height: 120px;
    border: 2px solid #8b7355;
    object-fit: cover;
  }

  .text-column {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .character-info {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
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
    flex: 1;
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

  /* 依頼達成 */
  .rewards-screen.quest-reward {
    border-color: #5a8abf;
    box-shadow:
      0 0 30px rgba(90, 138, 191, 0.25),
      0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .quest-reward .rewards-title {
    color: #7ab8f5;
    text-shadow: 0 0 15px rgba(122, 184, 245, 0.4);
  }

  .quest-reward .achievement-subtitle {
    color: #5a8abf;
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
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .rewards-footer {
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid #4a4a6a;
  }

  /* ゲージ報酬 */
  .gauge-rewards {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
</style>
