<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { purchaseMerchantSlot } from '$lib/services/merchant';
  import { getEquipment } from '$lib/data/equipment';
  import { getBook } from '$lib/data/books';
  import { getItem, getItemIcon, handleIconError } from '$lib/data/items';
  import { getMonth } from '$lib/services/calendar';
  import type { MerchantSlot } from '$lib/models/types';

  export let onBack: () => void;

  $: lineup = $gameState.merchantLineup;
  $: currentMonth = getMonth($gameState.day);

  function getSlotInfo(slot: MerchantSlot): {
    name: string;
    description: string;
    icon: string;
    typeLabel: string;
  } {
    switch (slot.type) {
      case 'equipment': {
        const equip = getEquipment(slot.id);
        return {
          name: equip?.name ?? '???',
          description: equip?.effectDescription ?? '',
          icon: '/icons/actions/alchemy.png',
          typeLabel: '機材',
        };
      }
      case 'recipe_book': {
        const book = getBook(slot.id);
        return {
          name: book?.name ?? '???',
          description: book?.description ?? '',
          icon: '/icons/actions/study.png',
          typeLabel: 'レシピ本',
        };
      }
      case 'rare_material': {
        const item = getItem(slot.id);
        return {
          name: item?.name ?? '???',
          description: item?.description ?? '',
          icon: getItemIcon(slot.id),
          typeLabel: 'レア素材',
        };
      }
    }
  }

  function handlePurchase(index: number) {
    purchaseMerchantSlot(index);
  }
</script>

<div class="merchant-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>マルコの行商 ── {currentMonth}月の品揃え</h2>

  <div class="money-display">
    所持金: <span class="amount">{$gameState.money.toLocaleString()}G</span>
  </div>

  {#if lineup && lineup.slots.length > 0}
    <div class="merchant-message">
      <img class="marco-face" src="/images/characters/marco/marco-face-happy.png" alt="マルコ" on:error={handleIconError} />
      <p>「やあやあ先生！ 今月もいい品を持ってきたよ」</p>
    </div>

    <div class="slot-list">
      {#each lineup.slots as slot, i}
        {@const info = getSlotInfo(slot)}
        {@const canBuy = !slot.purchased && $gameState.money >= slot.price}
        <div class="slot-item" class:purchased={slot.purchased} class:cant-afford={!canBuy && !slot.purchased}>
          <div class="slot-type-badge" class:badge-equipment={slot.type === 'equipment'}
               class:badge-recipe={slot.type === 'recipe_book'}
               class:badge-material={slot.type === 'rare_material'}>
            {info.typeLabel}
          </div>
          <img class="slot-icon" src={info.icon} alt={info.name} on:error={handleIconError} />
          <div class="slot-info">
            <span class="slot-name">{info.name}</span>
            <span class="slot-desc">{info.description}</span>
          </div>
          <div class="slot-action">
            {#if slot.purchased}
              <span class="sold-label">購入済</span>
            {:else}
              <span class="slot-price">{slot.price.toLocaleString()}G</span>
              <button
                class="buy-btn"
                disabled={!canBuy}
                on:click={() => handlePurchase(i)}
              >
                購入
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <div class="merchant-footer">
      <img class="marco-face-small" src="/images/characters/marco/marco-face-smug.png" alt="マルコ" on:error={handleIconError} />
      <p>「全部は持っていけないだろう？ よーく選びな」</p>
    </div>
  {:else}
    <p class="empty">マルコの品揃えはすべて売り切れたようです。</p>
  {/if}
</div>

<style>
  .merchant-panel {
    padding: 1.5rem;
  }

  .back-btn {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #c0c0d0;
    cursor: pointer;
    margin-bottom: 1rem;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  h2 {
    font-size: 1.5rem;
    color: #f4e4bc;
    margin-bottom: 1rem;
  }

  .money-display {
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    color: #e0e0f0;
    margin-bottom: 1rem;
  }

  .amount {
    font-size: 1.2rem;
    font-weight: bold;
    color: #c9a959;
  }

  .merchant-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(255, 152, 0, 0.1);
    border: 1px solid rgba(255, 152, 0, 0.3);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .merchant-message p {
    color: #f4e4bc;
    font-style: italic;
    margin: 0;
  }

  .marco-face {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .slot-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .slot-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 8px;
    position: relative;
    transition: all 0.2s;
  }

  .slot-item:hover:not(.purchased):not(.cant-afford) {
    border-color: #ff9800;
    background: rgba(255, 152, 0, 0.08);
  }

  .slot-item.purchased {
    opacity: 0.5;
  }

  .slot-item.cant-afford {
    opacity: 0.6;
  }

  .slot-type-badge {
    position: absolute;
    top: -0.5rem;
    left: 0.75rem;
    padding: 0.15rem 0.5rem;
    font-size: 0.7rem;
    font-weight: bold;
    border-radius: 3px;
    color: #1a1a2e;
  }

  .badge-equipment {
    background: #ff9800;
  }

  .badge-recipe {
    background: #2196f3;
  }

  .badge-material {
    background: #4caf50;
  }

  .slot-icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .slot-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 0;
  }

  .slot-name {
    color: #e0e0f0;
    font-weight: bold;
  }

  .slot-desc {
    color: #808090;
    font-size: 0.85rem;
  }

  .slot-action {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .slot-price {
    color: #c9a959;
    font-weight: bold;
    white-space: nowrap;
  }

  .buy-btn {
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #e65100 0%, #ff9800 100%);
    border: none;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .buy-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .buy-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .sold-label {
    color: #9e9e9e;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .merchant-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
  }

  .merchant-footer p {
    color: #a0a0b0;
    font-style: italic;
    font-size: 0.9rem;
    margin: 0;
  }

  .marco-face-small {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .empty {
    color: #808090;
    text-align: center;
    padding: 2rem;
  }
</style>
