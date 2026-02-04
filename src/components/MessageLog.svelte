<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { afterUpdate } from 'svelte';

  let logContainer: HTMLDivElement;
  let isExpanded = false;

  afterUpdate(() => {
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });

  // メッセージのタイプを判定
  function getMessageType(message: string): 'success' | 'error' | 'reward' | 'info' {
    if (message.includes('作成しました') || message.includes('成功') || message.includes('習得しました') || message.includes('完了')) {
      return 'success';
    }
    if (message.includes('失敗') || message.includes('期限切れ') || message.includes('足りません')) {
      return 'error';
    }
    if (message.includes('+') || message.includes('獲得') || message.includes('報酬') || message.includes('入手')) {
      return 'reward';
    }
    return 'info';
  }

  function toggleExpanded() {
    isExpanded = !isExpanded;
  }
</script>

<div class="message-log-wrapper" class:expanded={isExpanded}>
  <div class="log-header">
    <span class="log-title">メッセージログ</span>
    <button class="toggle-btn" on:click={toggleExpanded}>
      {isExpanded ? '▼ 縮小' : '▲ 展開'}
    </button>
  </div>
  <div class="message-log" bind:this={logContainer}>
    {#each $gameState.messageLog as message, i}
      {@const type = getMessageType(message)}
      <div
        class="message {type}"
        class:latest={i === $gameState.messageLog.length - 1}
      >
        <span class="message-bullet"></span>
        <span class="message-text">{message}</span>
      </div>
    {/each}
    {#if $gameState.messageLog.length === 0}
      <div class="no-messages">まだメッセージがありません</div>
    {/if}
  </div>
</div>

<style>
  .message-log-wrapper {
    background: #1a1a2e;
    border-top: 2px solid #4a4a6a;
  }

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.75rem;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid #2a2a4a;
  }

  .log-title {
    font-size: 0.8rem;
    color: #808090;
  }

  .toggle-btn {
    padding: 0.2rem 0.5rem;
    background: transparent;
    border: 1px solid #4a4a6a;
    border-radius: 3px;
    color: #808090;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #a0a0b0;
  }

  .message-log {
    height: 80px;
    overflow-y: auto;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
    color: #b0b0c0;
    transition: height 0.3s ease;
  }

  .message-log-wrapper.expanded .message-log {
    height: 200px;
  }

  .message {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.3rem 0;
    border-bottom: 1px solid #2a2a4a;
  }

  .message-bullet {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #606070;
    flex-shrink: 0;
    margin-top: 0.4rem;
  }

  .message-text {
    flex: 1;
  }

  .message.info .message-bullet {
    background: #808090;
  }

  .message.success .message-bullet {
    background: #4caf50;
  }

  .message.success .message-text {
    color: #81c784;
  }

  .message.error .message-bullet {
    background: #f44336;
  }

  .message.error .message-text {
    color: #ff6b6b;
  }

  .message.reward .message-bullet {
    background: #ffc107;
  }

  .message.reward .message-text {
    color: #ffd54f;
  }

  .message.latest {
    background: rgba(255, 255, 255, 0.05);
    margin: 0 -0.5rem;
    padding: 0.3rem 0.5rem;
    border-radius: 3px;
  }

  .message.latest .message-text {
    font-weight: bold;
  }

  .no-messages {
    color: #606070;
    font-style: italic;
    text-align: center;
    padding: 1rem;
  }

  .message-log::-webkit-scrollbar {
    width: 6px;
  }

  .message-log::-webkit-scrollbar-track {
    background: #1a1a2e;
  }

  .message-log::-webkit-scrollbar-thumb {
    background: #4a4a6a;
    border-radius: 3px;
  }
</style>
