<script lang="ts">
  import type { QuestType } from '$lib/models/types';

  export let type: QuestType;
  export let size: 'small' | 'medium' = 'small';
  export let showLabel: boolean = false;

  function getIconPath(type: QuestType): string {
    return `/icons/quests/${type}.png`;
  }

  function getLabel(type: QuestType): string {
    switch (type) {
      case 'deliver':
        return '納品';
      case 'quality':
        return '品質指定';
      case 'bulk':
        return '大量納品';
      default:
        return type;
    }
  }

  function handleError(e: Event) {
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
  }
</script>

<span class="quest-type-icon" class:medium={size === 'medium'}>
  <img
    src={getIconPath(type)}
    alt={getLabel(type)}
    class="icon"
    on:error={handleError}
  />
  {#if showLabel}
    <span class="label">{getLabel(type)}</span>
  {/if}
</span>

<style>
  .quest-type-icon {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .icon {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  .quest-type-icon.medium .icon {
    width: 48px;
    height: 48px;
  }

  .label {
    font-size: 0.8rem;
    color: #90caf9;
  }

  .quest-type-icon.medium .label {
    font-size: 0.9rem;
  }
</style>
