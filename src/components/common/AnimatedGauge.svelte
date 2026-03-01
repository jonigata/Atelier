<script lang="ts">
  import { onMount } from 'svelte';
  import type { GaugeSegment } from '$lib/models/types';

  export let before: number = 0;
  export let after: number = 0;
  export let max: number = 100;
  export let label: string = '';
  export let text: string = '';
  export let color: 'gold' | 'blue' | 'green' | 'orange' = 'blue';
  export let segments: GaugeSegment[] | undefined = undefined;
  export let subtext: string = '';

  // アニメーション状態
  let displayLabel = label;
  let fromPct = 0;
  let toPct = 0;
  let animKey = 0;
  let duration = 1000;
  let delay = 500;
  let flashVisible = false;

  function sleep(ms: number) {
    return new Promise<void>(r => setTimeout(r, ms));
  }

  onMount(() => {
    if (segments && segments.length > 1) {
      playMultiSegment(segments);
    } else if (segments && segments.length === 1) {
      const seg = segments[0];
      displayLabel = seg.label;
      fromPct = (seg.from / seg.max) * 100;
      toPct = (seg.to / seg.max) * 100;
      duration = 1000;
      delay = 500;
    } else {
      // 従来動作: before/after/maxで単一アニメーション
      fromPct = (before / max) * 100;
      toPct = (after / max) * 100;
      duration = 1000;
      delay = 500;
    }
  });

  async function playMultiSegment(segs: GaugeSegment[]) {
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      const fillPct = ((seg.to - seg.from) / seg.max) * 100;

      displayLabel = seg.label;
      fromPct = (seg.from / seg.max) * 100;
      toPct = (seg.to / seg.max) * 100;
      delay = i === 0 ? 500 : 0;
      // 充填量に比例した時間（最低250ms、100%で800ms）
      duration = Math.max(250, Math.round(fillPct * 8));
      animKey++;

      // delay + アニメーション完了を待つ
      await sleep(delay + duration);

      if (i < segs.length - 1) {
        // セグメント間のフラッシュ（レベルアップ演出）
        flashVisible = true;
        await sleep(200);
        flashVisible = false;
        await sleep(50);
      }
    }
  }
</script>

<div class="gauge-row gauge-{color}">
  <div class="gauge-label-col">
    <div class="gauge-label">{displayLabel}</div>
    {#if subtext}
      <div class="gauge-subtext">{@html subtext}</div>
    {/if}
  </div>
  <div class="gauge-track">
    {#key animKey}
      <div
        class="gauge-fill"
        style="--from: {fromPct}%; --to: {toPct}%; --duration: {duration}ms; --delay: {delay}ms"
      ></div>
    {/key}
    {#if flashVisible}
      <div class="gauge-flash"></div>
    {/if}
  </div>
  <div class="gauge-text">{text}</div>
</div>

<style>
  .gauge-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .gauge-label-col {
    min-width: 4.5em;
    flex-shrink: 0;
    text-align: right;
  }

  .gauge-label {
    font-size: 0.8rem;
    font-weight: bold;
    color: #a0a0b0;
    transition: color 0.15s;
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
    animation: gaugeFill var(--duration) ease-out var(--delay) both;
  }

  @keyframes gaugeFill {
    from { width: var(--from); }
    to { width: var(--to); }
  }

  .gauge-flash {
    position: absolute;
    inset: 0;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.6);
    animation: gaugeFlash 0.2s ease-out both;
  }

  @keyframes gaugeFlash {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }

  .gauge-text {
    font-size: 0.85rem;
    font-weight: bold;
    color: #e0e0f0;
    width: 7em;
    text-align: right;
    flex-shrink: 0;
  }

  .gauge-subtext {
    font-size: 0.7rem;
    color: #e0e0f0;
    margin-top: 1px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  /* ゴールド（名声） */
  .gauge-gold .gauge-fill {
    background: linear-gradient(90deg, #c9a959, #ffd700);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
  }
  .gauge-gold .gauge-label { color: #ffd700; }
  .gauge-gold .gauge-subtext { color: #ffe766; }

  /* ブルー（経験値） */
  .gauge-blue .gauge-fill {
    background: linear-gradient(90deg, #4a80b0, #64b5f6);
    box-shadow: 0 0 10px rgba(100, 181, 246, 0.6);
  }
  .gauge-blue .gauge-label { color: #64b5f6; }
  .gauge-blue .gauge-subtext { color: #a0d4ff; }

  /* グリーン（村発展度） */
  .gauge-green .gauge-fill {
    background: linear-gradient(90deg, #4a8a4a, #81c784);
    box-shadow: 0 0 10px rgba(129, 199, 132, 0.6);
  }
  .gauge-green .gauge-label { color: #81c784; }
  .gauge-green .gauge-subtext { color: #b0e8b3; }

  /* オレンジ（体力） */
  .gauge-orange .gauge-fill {
    background: linear-gradient(90deg, #b07040, #e09050);
    box-shadow: 0 0 10px rgba(224, 144, 80, 0.6);
  }
  .gauge-orange .gauge-label { color: #e09050; }
</style>
