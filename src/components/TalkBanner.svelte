<script lang="ts">
  import { gameState } from '$lib/stores/game';

  interface Monologue {
    text: string;
    expression: string;
    priority: number;
  }

  $: monologues = (() => {
    const list: Monologue[] = [];
    const unlocked = $gameState.tutorialProgress.unlockedActions;

    if (!unlocked.includes('study')) {
      list.push({
        text: '荷解きしなくっちゃ',
        expression: 'neutral',
        priority: 1,
      });
    }

    if (!unlocked.includes('alchemy') && $gameState.stamina < 20) {
      list.push({
        text: '長旅疲れたな～。今日は休んで、明日からがんばろう',
        expression: 'worried',
        priority: 2,
      });
    }

    return list;
  })();

  $: activeMonologue = monologues.length > 0
    ? monologues.reduce((best, m) => m.priority < best.priority ? m : best)
    : null;
</script>

{#if activeMonologue}
  <div class="monologue-panel">
    <img
      class="face"
      src="/images/characters/heroine/heroine-face-{activeMonologue.expression}.png"
      alt="コレット"
    />
    <div class="bubble">
      <span class="text">{activeMonologue.text}</span>
    </div>
  </div>
{/if}

<style>
  .monologue-panel {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(30, 30, 50, 0.8);
    border-top: 1px solid rgba(201, 169, 89, 0.4);
  }

  .face {
    width: 160px;
    height: 160px;
    flex-shrink: 0;
    object-fit: cover;
  }

  .bubble {
    position: relative;
    background: rgba(40, 40, 65, 0.9);
    border: 1px solid rgba(201, 169, 89, 0.3);
    border-radius: 8px;
    padding: 0.8rem 1rem;
    flex: 1;
  }

  .bubble::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 8px solid rgba(201, 169, 89, 0.3);
  }

  .bubble::after {
    content: '';
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 7px solid rgba(40, 40, 65, 0.9);
  }

  .text {
    color: #e8dcc8;
    font-size: 1.3rem;
    line-height: 1.4;
  }
</style>
