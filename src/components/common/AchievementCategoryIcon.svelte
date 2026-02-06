<script lang="ts">
  import type { AchievementCategory } from '$lib/models/types';

  export let category: AchievementCategory;
  export let size: 'small' | 'medium' | 'large' = 'medium';

  function getIconPath(category: AchievementCategory): string {
    return `/icons/achievements/${category}.png`;
  }

  function getLabel(category: AchievementCategory): string {
    switch (category) {
      case 'tutorial':
        return 'チュートリアル';
      case 'alchemy':
        return '調合';
      case 'quest':
        return '依頼';
      case 'expedition':
        return '採取';
      case 'economy':
        return '経済';
      case 'mastery':
        return '熟練';
      default:
        return category;
    }
  }

  function handleError(e: Event) {
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
  }
</script>

<span class="category-icon" class:small={size === 'small'} class:large={size === 'large'}>
  <img
    src={getIconPath(category)}
    alt={getLabel(category)}
    class="icon"
    on:error={handleError}
  />
</span>

<style>
  .category-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  .category-icon.small .icon {
    width: 32px;
    height: 32px;
  }

  .category-icon.large .icon {
    width: 64px;
    height: 64px;
  }
</style>
