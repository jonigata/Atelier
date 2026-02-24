<script lang="ts">
  import { onDestroy } from 'svelte';
  import {
    gameState,
    pendingVillageLevelUp,
    pendingReputationLevelUp,
    addVillageFacility,
    addHelper,
    upgradeHelper,
    addMessage,
  } from '$lib/stores/game';
  import { generateFacilityChoices, generateHelperChoices } from '$lib/services/draw';
  import type { VillageFacilityDef, HelperDef } from '$lib/models/types';

  type DrawMode = 'none' | 'facility' | 'helper';
  let drawMode: DrawMode = 'none';
  let facilityChoices: VillageFacilityDef[] = [];
  let helperChoices: { def: HelperDef; currentLevel: number }[] = [];

  // 村発展度レベルアップ → 施設ドロー
  const unsubVillage = pendingVillageLevelUp.subscribe((info) => {
    if (!info || drawMode !== 'none') return;
    const state = $gameState;
    const choices = generateFacilityChoices(state.villageFacilities);
    if (choices.length > 0) {
      facilityChoices = choices;
      drawMode = 'facility';
    } else {
      addMessage('村発展度がレベルアップしたが、建設できる施設がもうない');
      pendingVillageLevelUp.set(null);
    }
  });

  // 名声レベルアップ → 助手ドロー
  const unsubReputation = pendingReputationLevelUp.subscribe((info) => {
    if (!info || drawMode !== 'none') return;
    const state = $gameState;
    const choices = generateHelperChoices(state.ownedHelpers);
    if (choices.length > 0) {
      helperChoices = choices;
      drawMode = 'helper';
    } else {
      pendingReputationLevelUp.set(null);
    }
  });

  onDestroy(() => {
    unsubVillage();
    unsubReputation();
  });

  function selectFacility(facility: VillageFacilityDef) {
    addVillageFacility(facility.id);
    addMessage(`施設「${facility.name}」を建設した！ ${facility.effectDescription}`);
    facilityChoices = [];
    drawMode = 'none';
    pendingVillageLevelUp.set(null);
  }

  function selectHelper(choice: { def: HelperDef; currentLevel: number }) {
    const { def, currentLevel } = choice;
    if (currentLevel === 0) {
      addHelper(def.id);
      addMessage(`助手「${def.name}」が仲間になった！ ${def.levelEffects[0].description}`);
    } else if (currentLevel < def.maxLevel) {
      upgradeHelper(def.id);
      const newLevel = currentLevel + 1;
      addMessage(`助手「${def.name}」がLv.${newLevel}になった！ ${def.levelEffects[newLevel - 1].description}`);
    } else {
      addMessage(`助手「${def.name}」は既にLv.MAX`);
    }
    helperChoices = [];
    drawMode = 'none';
    pendingReputationLevelUp.set(null);
  }
</script>

{#if drawMode === 'facility'}
  <div class="draw-overlay" role="dialog">
    <div class="draw-dialog">
      <div class="draw-header">
        <span class="draw-badge facility">村発展度UP!</span>
        <p class="draw-subtitle">建設する施設を1つ選んでください</p>
      </div>

      <div class="cards">
        {#each facilityChoices as facility}
          <button class="card facility-card" on:click={() => selectFacility(facility)}>
            <span class="card-icon">{facility.icon}</span>
            <span class="card-name">{facility.name}</span>
            <span class="card-desc">{facility.description}</span>
            <span class="card-effect">{facility.effectDescription}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

{#if drawMode === 'helper'}
  <div class="draw-overlay" role="dialog">
    <div class="draw-dialog">
      <div class="draw-header">
        <span class="draw-badge helper">名声UP!</span>
        <p class="draw-subtitle">助手を1人選んでください</p>
      </div>

      <div class="cards">
        {#each helperChoices as choice}
          {@const isNew = choice.currentLevel === 0}
          {@const isMaxed = choice.currentLevel >= choice.def.maxLevel}
          {@const nextLevel = isNew ? 1 : choice.currentLevel + 1}
          <button
            class="card helper-card"
            class:maxed={isMaxed}
            on:click={() => selectHelper(choice)}
          >
            <span class="card-icon">{choice.def.icon}</span>
            <span class="card-name">{choice.def.name}</span>
            <span class="card-species">{choice.def.species}</span>

            {#if isNew}
              <span class="card-level new">NEW</span>
              <span class="card-effect">{choice.def.levelEffects[0].description}</span>
            {:else if isMaxed}
              <span class="card-level max">Lv.MAX</span>
              <span class="card-effect dimmed">これ以上成長できない</span>
            {:else}
              <span class="card-level upgrade">Lv.{choice.currentLevel} → Lv.{nextLevel}</span>
              <span class="card-effect">{choice.def.levelEffects[nextLevel - 1].description}</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .draw-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    user-select: none;
  }

  .draw-dialog {
    max-width: 700px;
    width: 95%;
    padding: 1.5rem;
  }

  .draw-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .draw-badge {
    display: inline-block;
    padding: 0.5rem 1.5rem;
    border-radius: 6px;
    font-size: 1.3rem;
    font-weight: bold;
    letter-spacing: 0.1em;
  }

  .draw-badge.facility {
    background: linear-gradient(135deg, #2e7d32, #4caf50);
    color: #fff;
  }

  .draw-badge.helper {
    background: linear-gradient(135deg, #1565c0, #42a5f5);
    color: #fff;
  }

  .draw-subtitle {
    color: #c0c0d0;
    margin-top: 0.75rem;
    font-size: 1rem;
  }

  .cards {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .card {
    flex: 1;
    max-width: 200px;
    background: linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%);
    border: 2px solid #4a4a6a;
    border-radius: 12px;
    padding: 1.25rem 1rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    text-align: center;
  }

  .card:hover {
    border-color: #c9a959;
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(201, 169, 89, 0.3);
  }

  .card.maxed {
    opacity: 0.5;
  }

  .card.maxed:hover {
    border-color: #6a6a8a;
    box-shadow: none;
    transform: none;
  }

  .card-icon {
    font-size: 2rem;
  }

  .card-name {
    font-size: 1.1rem;
    font-weight: bold;
    color: #f4e4bc;
  }

  .card-species {
    font-size: 0.8rem;
    color: #808090;
  }

  .card-desc {
    font-size: 0.8rem;
    color: #a0a0b0;
    line-height: 1.4;
  }

  .card-effect {
    font-size: 0.85rem;
    color: #4caf50;
    font-weight: bold;
    padding: 0.25rem 0.5rem;
    background: rgba(76, 175, 80, 0.1);
    border: 1px solid rgba(76, 175, 80, 0.3);
    border-radius: 4px;
    margin-top: auto;
  }

  .card-effect.dimmed {
    color: #808090;
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .card-level {
    font-size: 0.85rem;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-weight: bold;
  }

  .card-level.new {
    background: rgba(255, 215, 0, 0.2);
    color: #ffd700;
    border: 1px solid rgba(255, 215, 0, 0.4);
  }

  .card-level.upgrade {
    background: rgba(66, 165, 245, 0.2);
    color: #42a5f5;
    border: 1px solid rgba(66, 165, 245, 0.4);
  }

  .card-level.max {
    background: rgba(128, 128, 144, 0.2);
    color: #808090;
    border: 1px solid rgba(128, 128, 144, 0.4);
  }

  @media (max-width: 600px) {
    .cards {
      flex-direction: column;
      align-items: center;
    }
    .card {
      max-width: 100%;
      width: 100%;
    }
  }
</style>
