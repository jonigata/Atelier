<script lang="ts">
  import { getItem, getItemIcon, handleIconError } from '$lib/data/items';

  export let itemId: string | null = null;
  export let quality: number | null = null;
  export let count: number | null = null;
  export let label: string | null = null; // アイテム以外の表示用（お金、名声など）
  export let emoji: string | null = null; // アイコンの代わりにemoji表示
  export let clickable: boolean = false;

  $: def = itemId ? getItem(itemId) : null;
  $: name = label || def?.name || itemId || '';
</script>

<div class="item-card" class:clickable role={clickable ? 'button' : undefined} tabindex={clickable ? 0 : undefined}>
  {#if emoji}
    <span class="item-emoji">{emoji}</span>
  {:else if itemId}
    <img class="item-icon" src={getItemIcon(itemId)} alt={name} on:error={handleIconError} />
  {/if}
  <span class="item-name">{name}</span>
  {#if quality !== null}
    <span class="item-quality" class:high={quality >= 70} class:low={quality < 30}>品質 {quality}</span>
  {/if}
  {#if count !== null && count > 1}
    <span class="item-count">×{count}</span>
  {/if}
</div>

<style>
  .item-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .item-card.clickable {
    cursor: pointer;
  }

  .item-card.clickable:hover {
    background: rgba(201, 169, 89, 0.2);
    border-color: #c9a959;
  }

  .item-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
    margin-bottom: 0.25rem;
  }

  .item-emoji {
    font-size: 1.75rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.25rem;
  }

  .item-name {
    font-weight: bold;
    color: #e0e0f0;
    text-align: center;
  }

  .item-quality {
    color: #a0a0b0;
    font-size: 0.8rem;
  }

  .item-quality.high {
    color: #81c784;
  }

  .item-quality.low {
    color: #ff6b6b;
  }

  .item-count {
    color: #c9a959;
    font-size: 0.8rem;
    font-weight: bold;
  }
</style>
