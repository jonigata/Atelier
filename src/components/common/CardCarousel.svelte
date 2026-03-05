<script lang="ts">
  export let itemsPerPage: number = 2;
  export let itemCount: number;

  let page = 0;
  $: totalPages = Math.ceil(itemCount / itemsPerPage);
  $: if (page >= totalPages) page = Math.max(0, totalPages - 1);
</script>

<div class="carousel-wrapper">
  <div
    class="carousel-track"
    style="transform: translateX(-{page * 100}%); --items-per-page: {itemsPerPage}"
  >
    <slot />
  </div>
</div>
{#if totalPages > 1}
  <div class="carousel-dots">
    {#each Array(totalPages) as _, i}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <span class="dot" class:active={page === i} on:click={() => page = i}></span>
    {/each}
  </div>
{/if}

<style>
  .carousel-wrapper {
    overflow: hidden;
  }

  .carousel-track {
    display: flex;
    transition: transform 0.3s ease;
  }

  .carousel-track > :global(*) {
    flex: 0 0 calc(100% / var(--items-per-page));
    min-width: 0;
    padding: 0 0.25rem;
    box-sizing: border-box;
  }

  .carousel-dots {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
    margin-top: 0.4rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    cursor: pointer;
    transition: background 0.2s;
  }

  .dot.active {
    background: #c9a959;
  }
</style>
