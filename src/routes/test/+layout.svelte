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
