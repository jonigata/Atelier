<script lang="ts">
  import { onDestroy } from 'svelte';
  import { gameState, resetGame, addVillageDevelopment, addExp, consumeStamina, restoreStamina } from '$lib/stores/game';
  import { unlockActions } from '$lib/stores/tutorial';
  import type { ActionType } from '$lib/models/types';
  import {
    startAutoplay,
    stopAutoplay,
    getAutoplayState,
    clearLogs,
    type AutoplayLog,
  } from '$lib/services/autoplay';

  let isOpen = false;
  let isRunning = false;
  let logs: AutoplayLog[] = [];
  let speed = 100;
  let maxDays = 30;
  let updateInterval: ReturnType<typeof setInterval>;

  // 状態を定期更新
  $: if (isOpen) {
    updateInterval = setInterval(() => {
      const state = getAutoplayState();
      isRunning = state.isRunning;
      logs = state.logs;
    }, 100);
  }

  onDestroy(() => {
    if (updateInterval) clearInterval(updateInterval);
  });

  async function handleStart() {
    clearLogs();
    try {
      await startAutoplay({ speed, maxDays });
    } catch (e) {
      console.error('Autoplay error:', e);
    }
  }

  function handleStop() {
    stopAutoplay();
  }

  function handleReset() {
    stopAutoplay();
    resetGame();
    clearLogs();
  }

  function handleAddDevelopment(amount: number) {
    addVillageDevelopment(amount);
  }

  const allActions: ActionType[] = ['alchemy', 'quest', 'expedition', 'shop', 'rest', 'study', 'inventory', 'album'];

  function handleUnlockAll() {
    unlockActions(allActions);
  }

  function togglePanel() {
    isOpen = !isOpen;
  }
</script>

<!-- デバッグボタン（常に表示） -->
<button class="debug-toggle" on:click={togglePanel} title="デバッグパネル">
  {isOpen ? '×' : '🔧'}
</button>

{#if isOpen}
  <div class="debug-panel">
    <h3>デバッグパネル</h3>

    <div class="section">
      <h4>自動プレイ</h4>
      <div class="controls">
        <label>
          速度(ms):
          <input type="number" bind:value={speed} min="10" max="1000" step="10" />
        </label>
        <label>
          日数:
          <input type="number" bind:value={maxDays} min="1" max="360" />
        </label>
      </div>
      <div class="buttons">
        {#if isRunning}
          <button class="stop" on:click={handleStop}>停止</button>
        {:else}
          <button class="start" on:click={handleStart}>開始</button>
        {/if}
        <button on:click={handleReset}>リセット</button>
      </div>
    </div>

    <div class="section">
      <h4>コマンド解放</h4>
      <div class="buttons">
        <button class="unlock-all" on:click={handleUnlockAll}>全コマンド解放</button>
      </div>
      <p class="info">解放済み: {$gameState.tutorialProgress.unlockedActions.length} / {allActions.length}</p>
    </div>

    <div class="section">
      <h4>村発展度操作</h4>
      <div class="buttons">
        <button on:click={() => handleAddDevelopment(10)}>+10</button>
        <button on:click={() => handleAddDevelopment(20)}>+20</button>
        <button on:click={() => handleAddDevelopment(-10)}>-10</button>
      </div>
      <p class="info">現在: {$gameState.villageDevelopment}</p>
    </div>

    <div class="section">
      <h4>経験値操作</h4>
      <div class="buttons">
        <button on:click={() => addExp(50)}>+50 Exp</button>
        <button on:click={() => addExp(90)}>+90 Exp</button>
        <button on:click={() => addExp(100)}>+100 Exp</button>
      </div>
      <p class="info">現在: {$gameState.alchemyExp} / Lv.{$gameState.alchemyLevel}</p>
    </div>

    <div class="section">
      <h4>体力操作</h4>
      <div class="buttons">
        <button on:click={() => consumeStamina(30)}>-30</button>
        <button on:click={() => consumeStamina(50)}>-50</button>
        <button on:click={() => consumeStamina(80)}>-80</button>
        <button on:click={() => restoreStamina(100)}>全回復</button>
      </div>
      <p class="info">現在: {$gameState.stamina} / {$gameState.maxStamina}</p>
    </div>

    <div class="section">
      <h4>ステータス</h4>
      <div class="status-grid">
        <span>日数:</span><span>{$gameState.day}</span>
        <span>所持金:</span><span>{$gameState.money}G</span>
        <span>村発展:</span><span>{$gameState.villageDevelopment}</span>
        <span>名声:</span><span>{$gameState.reputation}</span>
        <span>Lv:</span><span>{$gameState.alchemyLevel}</span>
        <span>依頼完了:</span><span>{$gameState.completedQuestCount}</span>
      </div>
    </div>

    <div class="section logs">
      <h4>ログ ({logs.length})</h4>
      <div class="log-container">
        {#each logs.slice(-20).reverse() as log}
          <div class="log-entry" class:error={log.result === 'error'} class:success={log.result === 'success'}>
            <span class="day">[{log.day}]</span>
            <span class="action">{log.action}</span>
            <span class="message">{log.message}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .debug-toggle {
    position: fixed;
    bottom: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #333;
    color: white;
    border: 2px solid #666;
    font-size: 1.2rem;
    cursor: pointer;
    z-index: 9999;
  }

  .debug-toggle:hover {
    background: #444;
  }

  .debug-panel {
    position: fixed;
    bottom: 60px;
    right: 10px;
    width: 320px;
    max-height: 80vh;
    background: rgba(20, 20, 30, 0.95);
    border: 2px solid #555;
    border-radius: 8px;
    padding: 1rem;
    color: #ddd;
    font-size: 0.85rem;
    z-index: 9998;
    overflow-y: auto;
  }

  h3 {
    margin: 0 0 0.75rem 0;
    color: #c9a959;
    font-size: 1rem;
    border-bottom: 1px solid #444;
    padding-bottom: 0.5rem;
  }

  h4 {
    margin: 0 0 0.5rem 0;
    color: #aaa;
    font-size: 0.85rem;
  }

  .section {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #333;
  }

  .controls {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
  }

  input[type="number"] {
    width: 60px;
    padding: 0.25rem;
    background: #222;
    border: 1px solid #444;
    color: #ddd;
    border-radius: 3px;
  }

  .buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  button {
    padding: 0.35rem 0.75rem;
    background: #444;
    border: 1px solid #666;
    color: #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  }

  button:hover {
    background: #555;
  }

  button.start {
    background: #2e7d32;
  }

  button.start:hover {
    background: #388e3c;
  }

  button.stop {
    background: #c62828;
  }

  button.stop:hover {
    background: #d32f2f;
  }

  button.unlock-all {
    background: #1565c0;
  }

  button.unlock-all:hover {
    background: #1976d2;
  }

  .info {
    margin: 0.5rem 0 0 0;
    color: #888;
    font-size: 0.8rem;
  }

  .status-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }

  .status-grid span:nth-child(odd) {
    color: #888;
  }

  .logs {
    border-bottom: none;
  }

  .log-container {
    max-height: 150px;
    overflow-y: auto;
    background: #111;
    border-radius: 4px;
    padding: 0.5rem;
  }

  .log-entry {
    display: flex;
    gap: 0.5rem;
    padding: 0.15rem 0;
    font-size: 0.75rem;
    font-family: monospace;
  }

  .log-entry.error {
    color: #ef5350;
  }

  .log-entry.success {
    color: #81c784;
  }

  .day {
    color: #666;
    min-width: 30px;
  }

  .action {
    color: #90caf9;
    min-width: 50px;
  }

  .message {
    color: inherit;
  }
</style>
