<script lang="ts">
  import { onDestroy } from 'svelte';
  import { gameState } from '$lib/stores/game';
  import { resolveDialogue } from '$lib/services/presentation';
  import { skipOpening } from '$lib/services/gameLoop';
  import { getItemIcon, handleIconError } from '$lib/data/items';
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
  let timer: ReturnType<typeof setTimeout> | null = null;

  // ショーケース用（アチーブメント報酬：1つずつ表示）
  let showcaseIndex = 0;
  let showcasePhase: 'in' | 'show' | 'out' = 'in';

  // スタンプ演出（アイテム取得時、個数分ペタペタ表示）
  interface Stamp {
    id: number;
    x: number; // px（中央からのオフセット）
    y: number; // px
    delay: number;
    rotation: number;
  }
  let stamps: Stamp[] = [];
  let stampIdCounter = 0;

  function getRewardQuantity(text: string): number {
    const m = text.match(/[×x](\d+)/);
    return m ? parseInt(m[1], 10) : 1;
  }

  function spawnStamps(count: number) {
    const sX = 300, sY = 200;
    const newStamps: Stamp[] = [];

    if (count === 1) {
      newStamps.push({ id: stampIdCounter++, x: 0, y: 0, delay: 0, rotation: 0 });
    } else {
      const cols = Math.max(1, Math.round(Math.sqrt(count * (sX / sY))));
      const rows = Math.max(1, Math.ceil(count / cols));
      const cellW = sX / cols;
      const cellH = sY / rows;

      let placed = 0;
      for (let row = 0; row < rows && placed < count; row++) {
        for (let col = 0; col < cols && placed < count; col++) {
          const cx = -sX / 2 + (col + 0.5) * cellW;
          const cy = -sY / 2 + (row + 0.5) * cellH;
          newStamps.push({
            id: stampIdCounter++,
            x: cx + (Math.random() - 0.5) * cellW * 0.8,
            y: cy + (Math.random() - 0.5) * cellH * 0.8,
            delay: placed * 0.1,
            rotation: (Math.random() - 0.5) * 30,
          });
          placed++;
        }
      }
    }
    for (let i = newStamps.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = newStamps[i].delay;
      newStamps[i].delay = newStamps[j].delay;
      newStamps[j].delay = tmp;
    }
    stamps = newStamps;
  }

  $: dialogue = $gameState.tutorialProgress.pendingDialogue;
  $: hasRewards = dialogue?.structuredRewards && dialogue.structuredRewards.length > 0;
  $: isOpeningEvent = $gameState.achievementProgress.pendingReward === 'ach_game_start';

  // 依頼報酬かどうか（依頼はボックス形式、それ以外はショーケース形式）
  $: isQuestReward = dialogue?.rewardsTitle === '依頼達成！';

  // 依頼報酬用：ゲージと通常を分離
  $: gaugeRewards = dialogue?.structuredRewards?.filter(r => r.gaugeData) ?? [];
  $: normalRewards = dialogue?.structuredRewards?.filter(r => !r.gaugeData) ?? [];
  // ショーケース用：全報酬リスト
  $: allRewards = dialogue?.structuredRewards ?? [];

  function handleSkipOpening(event: MouseEvent) {
    event.stopPropagation();
    skipOpening();
  }

  // ダイアログが変わったらリセット
  $: if (dialogue) {
    currentLine = 0;
    showingRewards = false;
    closing = false;
    showcaseIndex = 0;
    showcasePhase = 'in';
    stamps = [];
    stopTimer();
  }

  function stopTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  // --- ショーケース（アチーブメント報酬）---
  function startShowcase() {
    showingRewards = true;
    showcaseIndex = 0;
    showReward();
  }

  function showReward() {
    showcasePhase = 'in';
    stamps = [];
    timer = setTimeout(() => {
      showcasePhase = 'show';
      // アイテム報酬ならスタンプ演出
      const reward = allRewards[showcaseIndex];
      if (reward && reward.itemId) {
        const qty = getRewardQuantity(reward.text);
        spawnStamps(qty);
      }
      // クリック待ち（自動進行しない）
    }, 100);
  }

  function hideReward() {
    stopTimer();
    showcasePhase = 'out';
    stamps = [];
    timer = setTimeout(() => {
      showcaseIndex++;
      if (showcaseIndex >= allRewards.length) {
        closeDialogue();
      } else {
        showReward();
      }
    }, 120);
  }

  onDestroy(() => stopTimer());

  function nextLine() {
    if (!dialogue || closing) return;

    if (showingRewards) {
      if (isQuestReward) {
        closeDialogue();
      } else {
        // ショーケース：どのフェーズでもクリックで次へ
        if (showcasePhase === 'out') return;
        hideReward();
      }
    } else if (currentLine < dialogue.lines.length - 1) {
      currentLine++;
    } else if (hasRewards) {
      if (isQuestReward) {
        showingRewards = true;
      } else {
        startShowcase();
      }
    } else {
      closeDialogue();
    }
  }

  function closeDialogue() {
    if (closing) return;
    closing = true;
    stopTimer();
  }

  function handleFadeOutEnd() {
    closing = false;
    currentLine = 0;
    showingRewards = false;
    showcaseIndex = 0;
    resolveDialogue();
  }

  function skipDialogue(event: MouseEvent) {
    event.stopPropagation();
    if (!showingRewards && hasRewards) {
      if (isQuestReward) {
        showingRewards = true;
      } else {
        startShowcase();
      }
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
        if (isQuestReward) {
          showingRewards = true;
        } else {
          startShowcase();
        }
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
      {#if isQuestReward}
        <!-- 依頼報酬：ボックス形式（従来通り） -->
        <div class="rewards-screen quest-reward">
          <div class="rewards-header">
            <span class="rewards-title">{dialogue.rewardsTitle}</span>
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
        <!-- アチーブメント報酬：ショーケース形式（1つずつ大きく表示） -->
        {#if showcaseIndex < allRewards.length}
          {@const reward = allRewards[showcaseIndex]}
          <div class="showcase" class:phase-in={showcasePhase === 'in'} class:phase-out={showcasePhase === 'out'}>
            {#if reward.gaugeData}
              <div class="showcase-gauge">
                <AnimatedGauge
                  before={reward.gaugeData.before}
                  after={reward.gaugeData.after}
                  max={reward.gaugeData.max}
                  label={reward.gaugeData.label}
                  text={reward.text}
                  color={getGaugeColor(reward.type)}
                />
              </div>
            {:else if !reward.itemId}
              <div class="showcase-icon">
                {#if reward.iconUrl}
                  <img src={reward.iconUrl} alt="" class:wide-img={reward.type === 'unlock'} on:error={handleIconError} />
                {:else}
                  <span class="showcase-emoji">{reward.type === 'money' ? '💰' : reward.type === 'recipe' ? '📖' : '🎁'}</span>
                {/if}
              </div>
              <div class="showcase-text">{reward.text}</div>
            {:else}
              <div class="stamps-zone">
                {#if stamps.length > 0 && reward.itemId}
                  {#each stamps as s (s.id)}
                    <img
                      class="stamp"
                      src={getItemIcon(reward.itemId)}
                      alt=""
                      style="left: calc(50% + {s.x}px); top: calc(50% + {s.y}px); --delay: {s.delay}s; --rot: {s.rotation}deg;"
                      on:error={handleIconError}
                    />
                  {/each}
                {/if}
              </div>
              <div class="showcase-text">{reward.text}</div>
            {/if}
            <div class="showcase-counter">{showcaseIndex + 1} / {allRewards.length}</div>
          </div>
        {/if}
      {/if}
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
              {getLineText(dialogue.lines[currentLine])}
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
            {#if isOpeningEvent}
              <button class="skip-opening-button" on:click={handleSkipOpening}>全スキップ</button>
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

  .skip-opening-button {
    padding: 0.3rem 0.75rem;
    background: rgba(201, 169, 89, 0.15);
    border: 1px solid #c9a959;
    border-radius: 4px;
    color: #c9a959;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .skip-opening-button:hover {
    background: rgba(201, 169, 89, 0.3);
    border-color: #ffd700;
    color: #ffd700;
  }

  /* ========== 依頼報酬：ボックス形式 ========== */
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
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
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

  .gauge-rewards {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  /* ========== アチーブメント報酬：ショーケース形式 ========== */
  .showcase {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .showcase.phase-in {
    animation: showcaseIn 0.1s ease-out forwards;
  }

  .showcase.phase-out {
    animation: showcaseOut 0.12s ease-in forwards;
  }

  @keyframes showcaseIn {
    from { opacity: 0.5; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes showcaseOut {
    from { opacity: 1; transform: scale(1); }
    to { opacity: 0; transform: scale(1.15); }
  }

  .showcase-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .showcase-icon img {
    width: 120px;
    height: 120px;
    object-fit: contain;
    filter: drop-shadow(0 0 16px rgba(201, 169, 89, 0.5));
  }

  .showcase-icon img.wide-img {
    width: min(400px, 80vw);
    height: auto;
    max-height: 200px;
    border-radius: 10px;
    filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.6));
  }

  .showcase-emoji {
    font-size: 4.5rem;
    filter: drop-shadow(0 0 16px rgba(201, 169, 89, 0.5));
  }

  .showcase-text {
    font-size: 1.5rem;
    font-weight: bold;
    color: #f0e0c0;
    text-shadow: 0 0 15px rgba(240, 224, 192, 0.3);
    text-align: center;
  }

  .showcase-gauge {
    width: min(400px, 85vw);
  }

  .showcase-counter {
    font-size: 0.8rem;
    color: #6a6a8a;
    margin-top: 0.5rem;
  }

  /* ========== スタンプ演出（アイテム取得） ========== */
  .stamps-zone {
    position: relative;
    width: 100%;
    height: 250px;
    pointer-events: none;
  }

  .stamp {
    position: absolute;
    width: 170px;
    height: 170px;
    object-fit: contain;
    transform: translate(-50%, -50%) rotate(var(--rot)) scale(0);
    animation: stampIn 0.15s ease-out forwards;
    animation-delay: var(--delay);
    pointer-events: none;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
    opacity: 0;
  }

  @keyframes stampIn {
    0% {
      transform: translate(-50%, -50%) rotate(var(--rot)) scale(0);
      opacity: 0;
    }
    40% {
      opacity: 0.85;
    }
    60% {
      transform: translate(-50%, -50%) rotate(var(--rot)) scale(1.15);
      opacity: 0.85;
    }
    100% {
      transform: translate(-50%, -50%) rotate(var(--rot)) scale(1);
      opacity: 0.8;
    }
  }
</style>
