<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { afterUpdate } from 'svelte';

  let logContainer: HTMLDivElement;

  afterUpdate(() => {
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  });
</script>

<div class="message-log" bind:this={logContainer}>
  {#each $gameState.messageLog as message, i}
    <div class="message" class:latest={i === $gameState.messageLog.length - 1}>
      {message}
    </div>
  {/each}
</div>

<style>
  .message-log {
    height: 120px;
    overflow-y: auto;
    padding: 0.75rem;
    background: #1a1a2e;
    border-top: 2px solid #4a4a6a;
    font-size: 0.9rem;
    color: #b0b0c0;
  }

  .message {
    padding: 0.25rem 0;
    border-bottom: 1px solid #2a2a4a;
  }

  .message.latest {
    color: #e0e0f0;
    font-weight: bold;
  }

  .message-log::-webkit-scrollbar {
    width: 8px;
  }

  .message-log::-webkit-scrollbar-track {
    background: #1a1a2e;
  }

  .message-log::-webkit-scrollbar-thumb {
    background: #4a4a6a;
    border-radius: 4px;
  }
</style>
