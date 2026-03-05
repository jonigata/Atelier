<script lang="ts">
  export let value: string;
  export let options: { value: string; label: string }[];
  export let label: string = '';
  export let id: string = '';

  let open = false;
  let containerEl: HTMLDivElement;

  function toggle() {
    open = !open;
  }

  function select(v: string) {
    value = v;
    open = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      open = false;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  }

  function handleOptionKeydown(e: KeyboardEvent, v: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(v);
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (open && containerEl && !containerEl.contains(e.target as Node)) {
      open = false;
    }
  }

  $: selectedLabel = options.find(o => o.value === value)?.label ?? value;
</script>

<svelte:window on:click={handleClickOutside} />

<div class="custom-select" bind:this={containerEl} class:open>
  <button
    type="button"
    class="select-trigger"
    {id}
    on:click={toggle}
    on:keydown={handleKeydown}
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label={label}
  >
    <span class="select-value">{selectedLabel}</span>
    <span class="select-arrow">▼</span>
  </button>

  {#if open}
    <ul class="select-dropdown" role="listbox">
      {#each options as opt}
        <li
          class="select-option"
          class:selected={opt.value === value}
          role="option"
          aria-selected={opt.value === value}
          tabindex="0"
          on:click={() => select(opt.value)}
          on:keydown={(e) => handleOptionKeydown(e, opt.value)}
        >
          {opt.label}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .custom-select {
    position: relative;
    display: inline-block;
    min-width: 7rem;
  }

  .select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
    padding: 0.4rem 0.6rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #e0e0f0;
    font-size: 0.9rem;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
  }

  .select-trigger:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: #6a6a8a;
  }

  .custom-select.open .select-trigger {
    border-color: #c9a959;
    box-shadow: 0 0 0 1px rgba(201, 169, 89, 0.3);
  }

  .select-arrow {
    font-size: 0.55rem;
    color: #a0a0b0;
    transition: transform 0.2s;
  }

  .custom-select.open .select-arrow {
    transform: rotate(180deg);
  }

  .select-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 100%;
    margin: 0;
    padding: 0.35rem 0;
    list-style: none;
    background: #2a2a40;
    border: 1px solid #5a5a7a;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    z-index: 100;
    max-height: none;
  }

  .select-option {
    padding: 0.75rem 1rem;
    white-space: nowrap;
    color: #c0c0d0;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .select-option:hover {
    background: rgba(201, 169, 89, 0.15);
    color: #f0e0c0;
  }

  .select-option.selected {
    color: #c9a959;
    font-weight: bold;
  }

  .select-option:focus {
    outline: none;
    background: rgba(201, 169, 89, 0.15);
  }
</style>
