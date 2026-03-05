<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { afterUpdate } from 'svelte';

  let logContainer: HTMLDivElement;
  let isOpen = false;

  afterUpdate(() => {
    if (logContainer && isOpen) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });

  // 購入・売却メッセージのパターン
  const BUY_PATTERN = /^(.+?)（品質(\d+)）を(\d+)Gで購入しました$/;
  const SELL_PATTERN = /^(.+?)（品質(\d+)）を(\d+)Gで売却しました$/;

  interface GroupedMessage {
    text: string;
    count: number;
  }

  // 連続する同種の購入・売却メッセージをまとめる
  function groupMessages(messages: string[]): GroupedMessage[] {
    const result: GroupedMessage[] = [];
    let i = 0;

    while (i < messages.length) {
      const buyMatch = messages[i].match(BUY_PATTERN);
      const sellMatch = messages[i].match(SELL_PATTERN);
      const pattern = buyMatch ? BUY_PATTERN : sellMatch ? SELL_PATTERN : null;
      const match = buyMatch || sellMatch;
      const action = buyMatch ? '購入' : '売却';

      if (match && pattern) {
        const itemName = match[1];
        let count = 1;
        let totalPrice = parseInt(match[3]);
        const qualities = [parseInt(match[2])];

        // 同じアイテム・同じアクションの連続をまとめる
        while (i + 1 < messages.length) {
          const nextMatch = messages[i + 1].match(pattern);
          if (nextMatch && nextMatch[1] === itemName) {
            count++;
            totalPrice += parseInt(nextMatch[3]);
            qualities.push(parseInt(nextMatch[2]));
            i++;
          } else {
            break;
          }
        }

        if (count === 1) {
          result.push({ text: messages[i], count: 1 });
        } else {
          const minQ = Math.min(...qualities);
          const maxQ = Math.max(...qualities);
          result.push({
            text: `${itemName}を${count}個${action}しました（合計${totalPrice}G、品質${minQ}〜${maxQ}）`,
            count,
          });
        }
      } else {
        result.push({ text: messages[i], count: 1 });
      }
      i++;
    }

    return result;
  }

  $: groupedMessages = groupMessages($gameState.messageLog);

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

  function toggleOpen() {
    isOpen = !isOpen;
  }

  function handleOverlayClick() {
    isOpen = false;
  }
</script>

<button class="log-toggle-btn" on:click={toggleOpen} title="メッセージログ">
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
  {#if groupedMessages.length > 0}
    <span class="log-count">{groupedMessages.length}</span>
  {/if}
</button>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="log-overlay" on:click={handleOverlayClick}>
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div class="log-panel" on:click|stopPropagation>
      <div class="log-header">
        <span class="log-title">メッセージログ</span>
        <button class="close-btn" on:click={() => isOpen = false}>✕</button>
      </div>
      <div class="message-log" bind:this={logContainer}>
        {#each groupedMessages as grouped, i}
          {@const type = getMessageType(grouped.text)}
          <div
            class="message {type}"
            class:latest={i === groupedMessages.length - 1}
          >
            <span class="message-bullet"></span>
            <span class="message-text">
              {grouped.text}
              {#if grouped.count > 1}
                <span class="batch-badge">×{grouped.count}</span>
              {/if}
            </span>
          </div>
        {/each}
        {#if groupedMessages.length === 0}
          <div class="no-messages">まだメッセージがありません</div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .log-toggle-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.4rem 0.5rem;
    background: rgba(26, 26, 46, 0.7);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid #3a3a5a;
    border-radius: 6px;
    color: #808090;
    cursor: pointer;
    transition: all 0.2s;
  }

  .log-toggle-btn:hover {
    background: rgba(42, 42, 74, 0.9);
    color: #a0a0b0;
    border-color: #5a5a7a;
  }

  .log-count {
    font-size: 0.7rem;
    font-weight: bold;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
    min-width: 1.2em;
    text-align: center;
  }

  .log-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 3rem;
  }

  .log-panel {
    width: min(90vw, 600px);
    max-height: 60vh;
    background: #1a1a2e;
    border: 1px solid #3a3a5a;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0.75rem;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid #2a2a4a;
  }

  .log-title {
    font-size: 0.85rem;
    color: #a0a0b0;
    font-weight: bold;
  }

  .close-btn {
    padding: 0.2rem 0.5rem;
    background: transparent;
    border: none;
    color: #808090;
    font-size: 0.9rem;
    cursor: pointer;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: #e0e0f0;
  }

  .message-log {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
    color: #b0b0c0;
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

  .batch-badge {
    display: inline-block;
    margin-left: 0.4rem;
    padding: 0 0.35rem;
    font-size: 0.75rem;
    font-weight: bold;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 3px;
    color: #a0a0b0;
    vertical-align: middle;
  }

  .no-messages {
    color: #606070;
    font-style: italic;
    text-align: center;
    padding: 1rem;
  }

</style>
