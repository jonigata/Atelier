<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getAllSlotMeta,
    saveToSlot,
    loadFromSlot,
    deleteSlot,
    updateSlotLabel,
    updateSlotMemo,
    type SaveSlotMeta,
  } from '$lib/services/saveLoad';

  let slotMeta: (SaveSlotMeta | null)[] = [];
  let editingLabel: number | null = null;
  let editLabelValue = '';

  onMount(() => {
    refreshSlots();
  });

  function refreshSlots() {
    slotMeta = getAllSlotMeta();
  }

  function handleSave(index: number) {
    const existing = slotMeta[index];
    saveToSlot(index, existing?.label ?? '', existing?.memo ?? '');
    refreshSlots();
  }

  function handleLoad(index: number) {
    loadFromSlot(index);
  }

  function handleDelete(index: number) {
    deleteSlot(index);
    refreshSlots();
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

  function handleMemoBlur(index: number, value: string) {
    updateSlotMemo(index, value);
    refreshSlots();
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${mi}`;
  }
</script>

<div class="sidebar">
  <div class="sidebar-header">Save / Load</div>

  <div class="slot-list">
    {#each slotMeta as meta, i}
      <div class="slot" class:slot-filled={!!meta}>
        <div class="slot-top-row">
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
                {meta.label || `Day${meta.day} Lv.${meta.alchemyLevel}`}
              </span>
            {/if}
          {:else}
            <span class="slot-empty">---</span>
          {/if}
          <div class="slot-buttons">
            <button class="save-btn" on:click={() => handleSave(i)} title="保存">S</button>
            {#if meta}
              <button class="load-btn" on:click={() => handleLoad(i)} title="読込">L</button>
              <button class="delete-btn" on:click={() => handleDelete(i)} title="削除">×</button>
            {/if}
          </div>
        </div>

        {#if meta}
          <div class="slot-info">
            <span>Day{meta.day} Lv.{meta.alchemyLevel} {meta.money}G</span>
            <span class="slot-date">{formatDate(meta.savedAt)}</span>
          </div>
          <input
            class="memo-input"
            type="text"
            value={meta.memo ?? ''}
            on:blur={(e) => handleMemoBlur(i, e.currentTarget.value)}
            on:keydown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            placeholder="メモ"
          />
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 280px;
    background: rgba(15, 15, 25, 0.95);
    border-right: 1px solid #333;
    z-index: var(--z-panel);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    font-size: 0.95rem;
    color: #ccc;
  }

  .sidebar-header {
    padding: 10px 12px;
    font-size: 1rem;
    font-weight: bold;
    color: #c9a959;
    border-bottom: 1px solid #333;
    flex-shrink: 0;
  }

  .slot-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
  }

  .slot {
    background: #1a1a2a;
    border: 1px solid #2a2a3a;
    border-radius: 4px;
    padding: 6px 8px;
    margin-bottom: 4px;
  }

  .slot-filled {
    border-color: #3a3a5a;
  }

  .slot-top-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .slot-number {
    color: #666;
    font-size: 0.9rem;
    font-weight: bold;
    min-width: 20px;
  }

  .slot-label {
    color: #c9a959;
    font-size: 0.9rem;
    cursor: default;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .slot-empty {
    color: #444;
    font-size: 0.85rem;
    font-style: italic;
    flex: 1;
  }

  .slot-buttons {
    display: flex;
    gap: 2px;
    margin-left: auto;
    flex-shrink: 0;
  }

  .slot-buttons button {
    padding: 1px 7px;
    font-size: 0.85rem;
    border-radius: 3px;
    cursor: pointer;
    border: 1px solid;
    line-height: 1.5;
  }

  .save-btn {
    background: #2e5a2e;
    border-color: #4a8a4a;
    color: #aaddaa;
  }
  .save-btn:hover { background: #3a6e3a; }

  .load-btn {
    background: #1a3a6e;
    border-color: #3a5a9e;
    color: #aaccee;
  }
  .load-btn:hover { background: #2a4a7e; }

  .delete-btn {
    background: #5a2a2a;
    border-color: #8a4a4a;
    color: #ee9999;
  }
  .delete-btn:hover { background: #6e3a3a; }

  .slot-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #777;
    padding-left: 24px;
    margin: 2px 0;
  }

  .slot-date {
    color: #555;
  }

  .memo-input {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid #2a2a3a;
    color: #9a9ab0;
    font-size: 0.8rem;
    padding: 2px 2px 2px 24px;
    outline: none;
    font-family: inherit;
    box-sizing: border-box;
  }

  .memo-input:focus {
    border-bottom-color: #6a5a8e;
    color: #ccc;
  }

  .memo-input::placeholder {
    color: #3a3a4a;
  }

  .label-input {
    background: #222;
    border: 1px solid #c9a959;
    color: #c9a959;
    font-size: 0.9rem;
    padding: 1px 4px;
    border-radius: 2px;
    flex: 1;
    min-width: 0;
    outline: none;
  }

  /* 画面幅が狭い場合は非表示 */
  @media (max-width: 1200px) {
    .sidebar {
      display: none;
    }
  }
</style>
