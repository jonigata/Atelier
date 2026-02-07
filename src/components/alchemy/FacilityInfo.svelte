<script lang="ts">
  import { getAllFacilities } from '$lib/data/facilities';
  import { isFacilityActive } from '$lib/services/facility';

  const facilities = getAllFacilities();
</script>

<div class="facility-info">
  <h4>工房の設備</h4>
  <div class="facility-list">
    {#each facilities as facility}
      {@const active = isFacilityActive(facility.id)}
      <div class="facility-item" class:active class:locked={!active}>
        <div class="facility-header">
          <span class="facility-icon">{active ? '✅' : '🔒'}</span>
          <span class="facility-name">{facility.name}</span>
          {#if facility.type === 'inventory'}
            <span class="facility-type">所持品</span>
          {/if}
        </div>
        <p class="facility-desc">{facility.description}</p>
        {#if facility.effects.length > 0}
          <div class="facility-effects">
            {#each facility.effects as effect}
              <span class="effect-tag" class:active>
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

  .facility-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .facility-item {
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
  }

  .facility-item.active {
    border-color: #4caf50;
    background: rgba(76, 175, 80, 0.08);
  }

  .facility-item.locked {
    opacity: 0.6;
  }

  .facility-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .facility-icon {
    font-size: 0.9rem;
  }

  .facility-name {
    font-weight: bold;
    color: #e0e0f0;
    font-size: 0.95rem;
  }

  .facility-type {
    margin-left: auto;
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    background: rgba(130, 177, 255, 0.2);
    border: 1px solid #82b1ff;
    border-radius: 3px;
    color: #82b1ff;
  }

  .facility-desc {
    font-size: 0.8rem;
    color: #a0a0b0;
    margin: 0.25rem 0;
  }

  .facility-effects {
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
