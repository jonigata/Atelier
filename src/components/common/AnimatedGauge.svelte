<script lang="ts">
  export let before: number;
  export let after: number;
  export let max: number;
  export let label: string;
  export let text: string;
  export let color: 'gold' | 'blue' | 'green' = 'blue';

  $: beforePct = (before / max) * 100;
  $: afterPct = (after / max) * 100;
</script>

<div class="gauge-row gauge-{color}">
  <div class="gauge-label">{label}</div>
  <div class="gauge-track">
    <div class="gauge-fill" style="--from: {beforePct}%; --to: {afterPct}%"></div>
  </div>
  <div class="gauge-text">{text}</div>
</div>

<style>
  .gauge-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .gauge-label {
    font-size: 0.8rem;
    font-weight: bold;
    color: #a0a0b0;
    min-width: 4.5em;
    text-align: right;
    flex-shrink: 0;
  }

  .gauge-track {
    flex: 1;
    height: 14px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 7px;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .gauge-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: 6px;
    width: var(--to);
    animation: gaugeFill 1s ease-out 0.5s both;
  }

  @keyframes gaugeFill {
    from { width: var(--from); }
    to { width: var(--to); }
  }

  .gauge-text {
    font-size: 0.85rem;
    font-weight: bold;
    color: #e0e0f0;
    width: 7em;
    text-align: right;
    flex-shrink: 0;
  }

  /* ゴールド（名声） */
  .gauge-gold .gauge-fill {
    background: linear-gradient(90deg, #c9a959, #ffd700);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
  }
  .gauge-gold .gauge-label { color: #ffd700; }

  /* ブルー（経験値） */
  .gauge-blue .gauge-fill {
    background: linear-gradient(90deg, #4a80b0, #64b5f6);
    box-shadow: 0 0 10px rgba(100, 181, 246, 0.6);
  }
  .gauge-blue .gauge-label { color: #64b5f6; }

  /* グリーン（村発展度） */
  .gauge-green .gauge-fill {
    background: linear-gradient(90deg, #4a8a4a, #81c784);
    box-shadow: 0 0 10px rgba(129, 199, 132, 0.6);
  }
  .gauge-green .gauge-label { color: #81c784; }
</style>
