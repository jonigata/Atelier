<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { getEquipment, getEquipmentIcon } from '$lib/data/equipment';
  import type { EquipmentDef } from '$lib/models/types';

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

  /** タップ/クリックで表示するツールチップ */
  let activeTooltip: EquipmentDef | null = null;
  let tooltipTimer: ReturnType<typeof setTimeout> | null = null;
  let tooltipX = 0;
  let tooltipY = 0;

  function showTooltip(eq: EquipmentDef, event: Event) {
    if (tooltipTimer) clearTimeout(tooltipTimer);

    if (activeTooltip?.id === eq.id) {
      activeTooltip = null;
      return;
    }

    // アイコン要素の位置からツールチップ座標を計算
    const target = (event.currentTarget || event.target) as HTMLElement;
    const rect = target.getBoundingClientRect();
    tooltipX = rect.left + rect.width / 2;
    tooltipY = rect.top - 6;
    activeTooltip = eq;

    tooltipTimer = setTimeout(() => { activeTooltip = null; }, 3000);
  }

  function hideTooltip() {
    if (tooltipTimer) clearTimeout(tooltipTimer);
    activeTooltip = null;
  }
</script>

<svelte:window on:scroll={hideTooltip} />

{#if relevantEquipment.length > 0}
  <span class="active-equip-icons">
    {#each relevantEquipment as eq}
      <span
        class="equip-icon-wrap"
        on:click|stopPropagation={(e) => showTooltip(eq, e)}
        on:pointerenter={(e) => showTooltip(eq, e)}
        on:pointerleave={hideTooltip}
        role="img"
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
      </span>
    {/each}
  </span>
{/if}

{#if activeTooltip}
  <div
    class="equip-tooltip-fixed"
    style="left:{tooltipX}px;top:{tooltipY}px"
  >
    <strong>{activeTooltip.name}</strong>
    <span class="equip-tooltip-desc">{activeTooltip.effectDescription}</span>
  </div>
{/if}

<style>
  .active-equip-icons {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin-left: 0.5rem;
    vertical-align: middle;
  }

  .equip-icon-wrap {
    position: relative;
    display: inline-flex;
    width: 22px;
    height: 22px;
    border-radius: 3px;
    border: 1px solid rgba(76, 175, 80, 0.4);
    background: rgba(0, 0, 0, 0.3);
    cursor: help;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }

  .equip-mini-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 2px;
  }

  .mini-rare-dot {
    position: absolute;
    top: 1px;
    right: 1px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #e8a840;
    box-shadow: 0 0 3px rgba(232, 168, 64, 0.6);
    pointer-events: none;
  }

  .equip-tooltip-fixed {
    position: fixed;
    transform: translate(-50%, -100%);
    background: rgba(20, 20, 40, 0.95);
    border: 1px solid rgba(76, 175, 80, 0.6);
    border-radius: 5px;
    padding: 0.35rem 0.5rem;
    white-space: nowrap;
    z-index: 1200;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }

  .equip-tooltip-fixed::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: rgba(76, 175, 80, 0.6);
  }

  .equip-tooltip-fixed strong {
    font-size: 0.75rem;
    color: #e0e0f0;
    line-height: 1.2;
  }

  .equip-tooltip-desc {
    font-size: 0.7rem;
    color: #81c784;
    line-height: 1.2;
  }
</style>
