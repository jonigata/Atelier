<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { startActionPhase } from '$lib/services/gameLoop';
</script>

<div class="morning-panel">
  <h2>{$gameState.day}日目の朝</h2>

  {#if $gameState.morningEvents.length > 0}
    <div class="events">
      <h3>お知らせ</h3>
      {#each $gameState.morningEvents as event}
        <div class="event" class:expedition={event.type === 'expedition_return'}
             class:quest={event.type === 'new_quest'}
             class:expired={event.type === 'quest_expired'}>
          {#if event.type === 'expedition_return'}
            <span class="icon">📦</span>
          {:else if event.type === 'new_quest'}
            <span class="icon">📜</span>
          {:else if event.type === 'quest_expired'}
            <span class="icon">⚠️</span>
          {/if}
          <span class="text">{event.message}</span>
        </div>
      {/each}
    </div>
  {:else}
    <p class="no-events">特にお知らせはありません。</p>
  {/if}

  <button class="start-btn" on:click={startActionPhase}>
    行動を開始する
  </button>
</div>

<style>
  .morning-panel {
    padding: 2rem;
    text-align: center;
  }

  h2 {
    font-size: 1.8rem;
    color: #f4e4bc;
    margin-bottom: 1.5rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  .events {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    text-align: left;
  }

  h3 {
    color: #c9a959;
    font-size: 1rem;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid #4a4a6a;
    padding-bottom: 0.5rem;
  }

  .event {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    margin: 0.5rem 0;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.05);
  }

  .event.expedition {
    border-left: 3px solid #4caf50;
  }

  .event.quest {
    border-left: 3px solid #2196f3;
  }

  .event.expired {
    border-left: 3px solid #f44336;
  }

  .icon {
    font-size: 1.2rem;
  }

  .text {
    color: #e0e0f0;
    line-height: 1.4;
  }

  .no-events {
    color: #a0a0b0;
    font-style: italic;
    margin: 2rem 0;
  }

  .start-btn {
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 8px;
    color: #1a1a2e;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .start-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(201, 169, 89, 0.4);
  }
</style>
