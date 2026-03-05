<script lang="ts">
  import { onMount } from 'svelte';
  import { initZoom } from '$lib/services/zoomController';

  let { children } = $props();

  onMount(() => {
    const cleanup = initZoom();
    return cleanup;
  });
</script>

{@render children()}

<style>
  :global(html) {
    font-size: 30px;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    background: #0a0a14;
  }
</style>
