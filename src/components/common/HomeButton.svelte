<script lang="ts">
  export let onClick: () => void;
</script>

<div class="home-button-bar">
  <button id="btn-home" class="home-btn" on:click={onClick} aria-label="ホームに戻る">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12L12 3l9 9" />
      <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  </button>
</div>

<style>
  .home-button-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 6rem;
    background: linear-gradient(to bottom, rgba(26, 26, 46, 0) 0%, rgba(26, 26, 46, 0.85) 35%, rgba(26, 26, 46, 0.95) 100%);
    pointer-events: none;
    z-index: 10;
  }

  .home-btn {
    pointer-events: auto;
    width: 4.8rem;
    height: 4.8rem;
    padding: 0.9rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid #4a4a6a;
    border-radius: 50%;
    color: #c0c0d0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }

  .home-btn:hover,
  .home-btn:active {
    background: rgba(255, 255, 255, 0.2);
    color: #f4e4bc;
  }

  .home-btn svg {
    width: 2.4rem;
    height: 2.4rem;
  }
</style>
