<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { getEquipment, getEquipmentIcon } from '$lib/data/equipment';
  import type { EquipmentDef } from '$lib/models/types';
  import ContinueMarker from './ContinueMarker.svelte';

  /** このパネルに関係する効果タイプのプレフィックス */
  export let prefixes: string[] = [];

  /** 所持機材のうち、関係する効果を持つものだけ抽出（重複排除） */
  $: relevantEquipment = getRelevantEquipment($gameState.ownedEquipment, prefixes);

  function getRelevantEquipment(owned: string[], pfx: string[]): EquipmentDef[] {
    const seen = new Set<string>();
    const result: EquipmentDef[] = [];
    for (const eqId of owned) {
      if (seen.has(eqId)) continue;
      const def = getEquipment(eqId);
      if (!def) continue;
      const hasRelevant = def.effects.some((e) =>
        pfx.some((p) => e.type.startsWith(p))
      );
      if (hasRelevant) {
        seen.add(eqId);
        result.push(def);
      }
    }
    return result;
  }

  let activePopup: EquipmentDef | null = null;

  function togglePopup(eq: EquipmentDef) {
    if (activePopup?.id === eq.id) {
      activePopup = null;
    } else {
      activePopup = eq;
    }
  }

  function closePopup() {
    activePopup = null;
  }

  function handleOverlayKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      closePopup();
    }
  }
</script>

{#if relevantEquipment.length > 0}
  <span class="active-equip-icons">
    {#each relevantEquipment as eq}
      <button
        class="equip-icon-wrap"
        class:active={activePopup?.id === eq.id}
        on:click|stopPropagation={() => togglePopup(eq)}
        aria-label="{eq.name}：{eq.effectDescription}"
      >
        <img
          class="equip-mini-icon"
          src={getEquipmentIcon(eq.id)}
          alt={eq.name}
        />
        {#if eq.rarity === 'rare'}
          <span class="mini-rare-dot"></span>
        {/if}
      </button>
    {/each}
  </span>
{/if}

{#if activePopup}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="equip-popup-overlay" on:click={closePopup} on:keydown={handleOverlayKeydown}>
    <div class="equip-popup" on:click|stopPropagation>
      <div class="equip-popup-header">
        <img
          class="equip-popup-icon"
          src={getEquipmentIcon(activePopup.id)}
          alt={activePopup.name}
        />
        <div class="equip-popup-title">
          <strong class="equip-popup-name">{activePopup.name}</strong>
          {#if activePopup.rarity === 'rare'}
            <span class="equip-popup-rare">レア</span>
          {/if}
        </div>
      </div>
      <p class="equip-popup-desc">{activePopup.effectDescription}</p>
      <div class="equip-popup-footer">
        <ContinueMarker />
      </div>
    </div>
  </div>
{/if}

<style>
  .active-equip-icons {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: 12px;
    vertical-align: middle;
  }

  .equip-icon-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 10px;
    border: 2px solid rgba(76, 175, 80, 0.5);
    background: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    flex-shrink: 0;
    padding: 4px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .equip-icon-wrap:hover, .equip-icon-wrap.active {
    border-color: rgba(76, 175, 80, 0.8);
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
  }

  .equip-mini-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 7px;
  }

  .mini-rare-dot {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #e8a840;
    box-shadow: 0 0 5px rgba(232, 168, 64, 0.6);
    pointer-events: none;
  }

  .equip-popup-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .equip-popup {
    background: #1e1e36;
    border: 2px solid rgba(76, 175, 80, 0.6);
    border-radius: 14px;
    padding: 28px 32px 20px;
    min-width: 360px;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
  }

  .equip-popup-header {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .equip-popup-icon {
    width: 72px;
    height: 72px;
    object-fit: cover;
    border-radius: 10px;
    border: 2px solid rgba(76, 175, 80, 0.4);
    background: rgba(0, 0, 0, 0.3);
    flex-shrink: 0;
  }

  .equip-popup-title {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .equip-popup-name {
    font-size: 28px;
    color: #e0e0f0;
    line-height: 1.2;
  }

  .equip-popup-rare {
    font-size: 16px;
    color: #e8a840;
    background: rgba(232, 168, 64, 0.15);
    border: 1px solid rgba(232, 168, 64, 0.4);
    border-radius: 4px;
    padding: 2px 8px;
    align-self: flex-start;
  }

  .equip-popup-desc {
    font-size: 24px;
    color: #81c784;
    line-height: 1.5;
    margin: 0;
  }

  .equip-popup-footer {
    text-align: center;
    padding-top: 4px;
  }
</style>
