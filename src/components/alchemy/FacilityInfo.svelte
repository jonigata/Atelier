<script lang="ts">
  import { getAllFacilities } from '$lib/data/facilities';
  import { getEquipment } from '$lib/data/equipment';
  import { isFacilityActive } from '$lib/services/facility';
  import { gameState } from '$lib/stores/game';

  const facilities = getAllFacilities();
  $: activePermanent = facilities.filter((f) => f.type === 'permanent' && isFacilityActive(f.id));
  $: activeInventory = facilities.filter((f) => f.type === 'inventory' && isFacilityActive(f.id));
  $: ownedEquipmentDefs = $gameState.ownedEquipment
    .map((id) => getEquipment(id))
    .filter((e): e is NonNullable<typeof e> => e !== undefined);
  $: hasEquipment = activeInventory.length > 0 || ownedEquipmentDefs.length > 0;
  $: hasAnything = activePermanent.length > 0 || hasEquipment;
</script>

<div class="facility-info">
  {#if !hasAnything}
    <p class="empty">なし</p>
  {:else}
    {#if activePermanent.length > 0}
      <h4>設備</h4>
      <div class="item-list">
        {#each activePermanent as facility}
          <div class="item-card">
            <div class="item-header">
              <span class="item-name">{facility.name}</span>
            </div>
            <p class="item-desc">{facility.description}</p>
            {#if facility.effects.length > 0}
              <div class="item-effects">
                {#each facility.effects as effect}
                  <span class="effect-tag active">
                    {#if effect.type === 'success_rate'}
                      成功率 +{Math.round(effect.value * 100)}%
                    {:else if effect.type === 'quality'}
                      品質 +{effect.value}
                    {/if}
                    {#if effect.scope === 'category' && effect.targetCategory}
                      ({effect.targetCategory}系)
                    {/if}
                  </span>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    {#if hasEquipment}
      <h4>機材</h4>
      <div class="item-list">
        {#each activeInventory as facility}
          <div class="item-card">
            <div class="item-header">
              <span class="item-name">{facility.name}</span>
            </div>
            <p class="item-desc">{facility.description}</p>
            {#if facility.effects.length > 0}
              <div class="item-effects">
                {#each facility.effects as effect}
                  <span class="effect-tag active">
                    {#if effect.type === 'success_rate'}
                      成功率 +{Math.round(effect.value * 100)}%
                    {:else if effect.type === 'quality'}
                      品質 +{effect.value}
                    {/if}
                    {#if effect.scope === 'category' && effect.targetCategory}
                      ({effect.targetCategory}系)
                    {/if}
                  </span>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
        {#each ownedEquipmentDefs as eq}
          <div class="item-card">
            <div class="item-header">
              <span class="item-name">{eq.name}</span>
              {#if eq.rarity === 'rare'}
                <span class="rarity-badge rare">レア</span>
              {/if}
            </div>
            <p class="item-desc">{eq.description}</p>
            <div class="item-effects">
              <span class="effect-tag active">{eq.effectDescription}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .facility-info {
    padding: 0.5rem 0;
  }

  h4 {
    font-size: 1rem;
    color: #c9a959;
    margin-bottom: 0.75rem;
  }

  h4:not(:first-child) {
    margin-top: 1rem;
  }

  .empty {
    color: #808090;
    font-size: 0.9rem;
    text-align: center;
    padding: 2rem 0;
  }

  .item-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .item-card {
    padding: 0.75rem;
    background: rgba(76, 175, 80, 0.08);
    border: 1px solid #4caf50;
    border-radius: 6px;
  }

  .item-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .item-name {
    font-weight: bold;
    color: #e0e0f0;
    font-size: 0.95rem;
  }

  .rarity-badge {
    font-size: 0.65rem;
    padding: 0.05rem 0.35rem;
    border-radius: 3px;
  }

  .rarity-badge.rare {
    background: rgba(255, 215, 0, 0.2);
    border: 1px solid #ffd700;
    color: #ffd700;
  }

  .item-desc {
    font-size: 0.8rem;
    color: #a0a0b0;
    margin: 0.25rem 0;
  }

  .item-effects {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.25rem;
  }

  .effect-tag {
    padding: 0.1rem 0.4rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 3px;
    font-size: 0.75rem;
    color: #808090;
  }

  .effect-tag.active {
    background: rgba(76, 175, 80, 0.15);
    border-color: #4caf50;
    color: #81c784;
  }
</style>
