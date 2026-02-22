<script lang="ts">
  import { onDestroy } from 'svelte';
  import { gameState, resetGame, addVillageExp, addReputationExp, addExp, addMoney, consumeStamina, restoreStamina, alchemyLevel, villageLevel, reputationLevel } from '$lib/stores/game';
  import { unlockActions } from '$lib/stores/tutorial';
  import type { ActionType } from '$lib/models/types';
  import {
    startAutoplay,
    stopAutoplay,
    getAutoplayState,
    clearLogs,
    type AutoplayLog,
  } from '$lib/services/autoplay';
  import {
    getAllSlotMeta,
    saveToSlot,
    loadFromSlot,
    deleteSlot,
    updateSlotLabel,
    type SaveSlotMeta,
  } from '$lib/services/saveLoad';

  let isOpen = false;
  let isRunning = false;
  let logs: AutoplayLog[] = [];
  let speed = 100;
  let maxDays = 27;
  let updateInterval: ReturnType<typeof setInterval>;

  // セーブ・ロード
  let slotMeta: (SaveSlotMeta | null)[] = [];
  let showSaveLoad = false;
  let editingLabel: number | null = null;
  let editLabelValue = '';
  let confirmAction: { type: 'load' | 'overwrite' | 'delete'; index: number } | null = null;

  function refreshSlots() {
    slotMeta = getAllSlotMeta();
  }

  function handleSave(index: number) {
    if (slotMeta[index]) {
      confirmAction = { type: 'overwrite', index };
      return;
    }
    doSave(index);
  }

  function doSave(index: number) {
    const existing = slotMeta[index];
    saveToSlot(index, existing?.label ?? '', existing?.memo ?? '');
    refreshSlots();
    confirmAction = null;
  }

  function handleLoad(index: number) {
    confirmAction = { type: 'load', index };
  }

  function doLoad(index: number) {
    loadFromSlot(index);
    confirmAction = null;
  }

  function handleDelete(index: number) {
    confirmAction = { type: 'delete', index };
  }

  function doDelete(index: number) {
    deleteSlot(index);
    refreshSlots();
    confirmAction = null;
  }

  function confirmYes() {
    if (!confirmAction) return;
    const { type, index } = confirmAction;
    if (type === 'load') doLoad(index);
    else if (type === 'overwrite') doSave(index);
    else if (type === 'delete') doDelete(index);
  }

  function confirmNo() {
    confirmAction = null;
  }

  function startEditLabel(index: number) {
    editingLabel = index;
    editLabelValue = slotMeta[index]?.label ?? '';
  }

  function finishEditLabel(index: number) {
    if (editingLabel === index) {
      updateSlotLabel(index, editLabelValue);
      refreshSlots();
      editingLabel = null;
    }
  }

  function toggleSaveLoad() {
    showSaveLoad = !showSaveLoad;
    if (showSaveLoad) refreshSlots();
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${mi}`;
  }

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
    addVillageExp(amount);
  }

  const allActions: ActionType[] = ['alchemy', 'quest', 'expedition', 'shop', 'rest', 'study', 'inventory', 'album'];

  function handleUnlockAll() {
    unlockActions(allActions);
  }

  function handleAddMoney(amount: number) {
    addMoney(amount);
  }

  function handleAddTestEquipment() {
    const testIds = ['bargain_book', 'silver_pot', 'energy_ring', 'study_lamp', 'gathering_bag', 'quest_badge', 'lucky_coin'];
    gameState.update((s) => ({
      ...s,
      ownedEquipment: [...new Set([...s.ownedEquipment, ...testIds])],
    }));
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
          <input type="number" bind:value={maxDays} min="1" max="336" />
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
      <h4>村発展Exp</h4>
      <div class="buttons">
        <button on:click={() => handleAddDevelopment(10)}>+10</button>
        <button on:click={() => handleAddDevelopment(20)}>+20</button>
        <button on:click={() => handleAddDevelopment(-10)}>-10</button>
      </div>
      <p class="info">Lv.{$villageLevel} (Exp: {$gameState.villageExp})</p>
    </div>

    <div class="section">
      <h4>名声Exp</h4>
      <div class="buttons">
        <button on:click={() => addReputationExp(10)}>+10</button>
        <button on:click={() => addReputationExp(20)}>+20</button>
        <button on:click={() => addReputationExp(-10)}>-10</button>
      </div>
      <p class="info">Lv.{$reputationLevel} (Exp: {$gameState.reputationExp})</p>
    </div>

    <div class="section">
      <h4>錬金術Exp</h4>
      <div class="buttons">
        <button on:click={() => addExp(50)}>+50</button>
        <button on:click={() => addExp(90)}>+90</button>
        <button on:click={() => addExp(100)}>+100</button>
      </div>
      <p class="info">Lv.{$alchemyLevel} (Exp: {$gameState.alchemyExp})</p>
    </div>

    <div class="section">
      <h4>体力</h4>
      <div class="buttons">
        <button on:click={() => consumeStamina(30)}>-30</button>
        <button on:click={() => consumeStamina(50)}>-50</button>
        <button on:click={() => consumeStamina(80)}>-80</button>
        <button on:click={() => restoreStamina(100)}>全回復</button>
      </div>
      <p class="info">現在: {$gameState.stamina} / {$gameState.maxStamina}</p>
    </div>

    <div class="section">
      <h4>所持金</h4>
      <div class="buttons">
        <button on:click={() => handleAddMoney(500)}>+500G</button>
        <button on:click={() => handleAddMoney(2000)}>+2000G</button>
      </div>
    </div>

    <div class="section">
      <h4>機材テスト</h4>
      <div class="buttons">
        <button on:click={handleAddTestEquipment}>テスト機材追加</button>
      </div>
      <p class="info">所持: {$gameState.ownedEquipment.length}個</p>
    </div>

    <div class="section">
      <h4>ステータス</h4>
      <div class="status-grid">
        <span>日数:</span><span>{$gameState.day}</span>
        <span>所持金:</span><span>{$gameState.money}G</span>
        <span>村発展:</span><span>Lv.{$villageLevel}</span>
        <span>名声:</span><span>Lv.{$reputationLevel}</span>
        <span>錬金:</span><span>Lv.{$alchemyLevel}</span>
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

    <div class="section">
      <h4>
        <button class="save-load-toggle" on:click={toggleSaveLoad}>
          {showSaveLoad ? '▼' : '▶'} セーブ・ロード
        </button>
      </h4>
      {#if showSaveLoad}
        {#if confirmAction}
          <div class="confirm-bar">
            <span>
              {#if confirmAction.type === 'load'}スロット{confirmAction.index}をロードしますか？
              {:else if confirmAction.type === 'overwrite'}スロット{confirmAction.index}を上書きしますか？
              {:else}スロット{confirmAction.index}を削除しますか？
              {/if}
            </span>
            <div class="confirm-buttons">
              <button class="confirm-yes" on:click={confirmYes}>はい</button>
              <button class="confirm-no" on:click={confirmNo}>いいえ</button>
            </div>
          </div>
        {/if}
        <div class="save-slots">
          {#each slotMeta as meta, i}
            <div class="slot" class:slot-empty={!meta} class:slot-filled={!!meta}>
              <div class="slot-header">
                <span class="slot-number">#{i}</span>
                {#if meta}
                  {#if editingLabel === i}
                    <input
                      class="label-input"
                      type="text"
                      bind:value={editLabelValue}
                      on:blur={() => finishEditLabel(i)}
                      on:keydown={(e) => { if (e.key === 'Enter') finishEditLabel(i); }}
                      placeholder="ラベル"
                      maxlength="20"
                    />
                  {:else}
                    <span class="slot-label" on:dblclick={() => startEditLabel(i)} title="ダブルクリックで編集">
                      {meta.label || `Day ${meta.day} / Lv.${meta.alchemyLevel}`}
                    </span>
                  {/if}
                {:else}
                  <span class="slot-empty-text">-- 空 --</span>
                {/if}
              </div>
              {#if meta}
                <div class="slot-info">
                  <span>Day {meta.day} / Lv.{meta.alchemyLevel} / {meta.money}G</span>
                  <span class="slot-date">{formatDate(meta.savedAt)}</span>
                </div>
              {/if}
              <div class="slot-actions">
                <button class="save-btn" on:click={() => handleSave(i)}>保存</button>
                {#if meta}
                  <button class="load-btn" on:click={() => handleLoad(i)}>読込</button>
                  <button class="delete-btn" on:click={() => handleDelete(i)}>削除</button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
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

  /* セーブ・ロード */
  .save-load-toggle {
    background: none;
    border: none;
    color: #aaa;
    font-size: 0.85rem;
    cursor: pointer;
    padding: 0;
  }

  .save-load-toggle:hover {
    color: #ddd;
    background: none;
  }

  .save-slots {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 300px;
    overflow-y: auto;
  }

  .slot {
    background: #1a1a2a;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 6px 8px;
  }

  .slot-filled {
    border-color: #4a4a5a;
  }

  .slot-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
  }

  .slot-number {
    color: #666;
    font-size: 0.75rem;
    font-weight: bold;
    min-width: 18px;
  }

  .slot-label {
    color: #c9a959;
    font-size: 0.8rem;
    cursor: default;
  }

  .slot-empty-text {
    color: #555;
    font-size: 0.75rem;
    font-style: italic;
  }

  .slot-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: #888;
    margin-bottom: 4px;
    padding-left: 24px;
  }

  .slot-date {
    color: #666;
  }

  .slot-actions {
    display: flex;
    gap: 4px;
    padding-left: 24px;
  }

  .slot-actions button {
    padding: 2px 8px;
    font-size: 0.7rem;
  }

  .save-btn {
    background: #2e5a2e;
    border-color: #4a8a4a;
  }

  .save-btn:hover {
    background: #3a6e3a;
  }

  .load-btn {
    background: #1a3a6e;
    border-color: #3a5a9e;
  }

  .load-btn:hover {
    background: #2a4a7e;
  }

  .delete-btn {
    background: #5a2a2a;
    border-color: #8a4a4a;
  }

  .delete-btn:hover {
    background: #6e3a3a;
  }

  .label-input {
    background: #222;
    border: 1px solid #c9a959;
    color: #c9a959;
    font-size: 0.8rem;
    padding: 1px 4px;
    border-radius: 2px;
    width: 140px;
    outline: none;
  }

  .confirm-bar {
    background: #2a2a1a;
    border: 1px solid #8a7a3a;
    border-radius: 4px;
    padding: 6px 8px;
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: #dda;
  }

  .confirm-buttons {
    display: flex;
    gap: 4px;
  }

  .confirm-yes {
    background: #6a3a2a;
    border-color: #9a5a3a;
    color: #fca;
    font-size: 0.7rem;
    padding: 2px 10px;
  }

  .confirm-yes:hover {
    background: #7a4a3a;
  }

  .confirm-no {
    font-size: 0.7rem;
    padding: 2px 10px;
  }
</style>
