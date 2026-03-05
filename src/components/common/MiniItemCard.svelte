<script lang="ts">
  import ItemCard from './ItemCard.svelte';

  export let itemId: string | null = null;
  export let quality: number | null = null;
  export let count: number | null = null;
  export let scale: number = 0.7;
</script>

<div class="mini-wrapper" style="zoom: {scale};">
  <ItemCard {itemId} {quality} {count} />
</div>

<style>
  .mini-wrapper {
    pointer-events: none;
  }
</style>
