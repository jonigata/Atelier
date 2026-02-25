<script lang="ts">
  import AnimatedGauge from '../../../components/common/AnimatedGauge.svelte';
  import type { GaugeSegment } from '$lib/models/types';

  let testKey = 0;

  function replay() {
    testKey++;
  }

  // 1) レベルアップなし: 30% → 70%
  const noLevelUp = {
    before: 5,
    after: 10,
    max: 14,
    label: 'Lv.3',
    text: '+5 Exp',
  };

  // 2) 1レベルアップ: Lv.1(50%) → Lv.2(30%)
  const oneLevelUp: GaugeSegment[] = [
    { from: 7, to: 14, max: 14, label: 'Lv.1' },
    { from: 0, to: 5, max: 16, label: 'Lv.2' },
  ];

  // 3) 2レベルアップ: Lv.1(0%) → Lv.3(40%)
  const twoLevelUp: GaugeSegment[] = [
    { from: 0, to: 14, max: 14, label: 'Lv.1' },
    { from: 0, to: 16, max: 16, label: 'Lv.2' },
    { from: 0, to: 7, max: 18, label: 'Lv.3' },
  ];

  // 4) 3レベルアップ: Lv.2(80%) → Lv.5(20%)
  const threeLevelUp: GaugeSegment[] = [
    { from: 13, to: 16, max: 16, label: 'Lv.2' },
    { from: 0, to: 18, max: 18, label: 'Lv.3' },
    { from: 0, to: 21, max: 21, label: 'Lv.4' },
    { from: 0, to: 5, max: 24, label: 'Lv.5' },
  ];

  // 5) 名声ゲージ: 1レベルアップ
  const reputationLevelUp: GaugeSegment[] = [
    { from: 10, to: 14, max: 14, label: '名声 Lv.1' },
    { from: 0, to: 8, max: 16, label: '名声 Lv.2' },
  ];

  // 6) 体力ゲージ（レベルアップなし、減少）
  const staminaDrain = {
    before: 80,
    after: 32,
    max: 100,
    label: '体力',
    text: '-48',
  };
</script>

<div class="test-page">
  <h1>AnimatedGauge テスト</h1>
  <button class="replay-btn" on:click={replay}>再生し直す</button>

  {#key testKey}
    <section>
      <h2>1. レベルアップなし（通常）</h2>
      <p class="desc">Lv.3: 5/14 → 10/14</p>
      <div class="gauge-wrapper">
        <AnimatedGauge
          before={noLevelUp.before}
          after={noLevelUp.after}
          max={noLevelUp.max}
          label={noLevelUp.label}
          text={noLevelUp.text}
          color="blue"
        />
      </div>
    </section>

    <section>
      <h2>2. 1レベルアップ (Lv.1 → Lv.2)</h2>
      <p class="desc">Lv.1(50%) → 100% → フラッシュ → Lv.2(31%)</p>
      <div class="gauge-wrapper">
        <AnimatedGauge
          before={7}
          after={5}
          max={14}
          label="Lv.1"
          text="+12 Exp"
          color="blue"
          segments={oneLevelUp}
        />
      </div>
    </section>

    <section>
      <h2>3. 2レベルアップ (Lv.1 → Lv.3)</h2>
      <p class="desc">Lv.1(0→100%) → Lv.2(0→100%) → Lv.3(0→39%)</p>
      <div class="gauge-wrapper">
        <AnimatedGauge
          before={0}
          after={7}
          max={14}
          label="Lv.1"
          text="+46 Exp"
          color="blue"
          segments={twoLevelUp}
        />
      </div>
    </section>

    <section>
      <h2>4. 3レベルアップ (Lv.2 → Lv.5)</h2>
      <p class="desc">Lv.2(81→100%) → Lv.3(0→100%) → Lv.4(0→100%) → Lv.5(0→21%)</p>
      <div class="gauge-wrapper">
        <AnimatedGauge
          before={13}
          after={5}
          max={16}
          label="Lv.2"
          text="+72 Exp"
          color="blue"
          segments={threeLevelUp}
        />
      </div>
    </section>

    <section>
      <h2>5. 名声ゲージ 1レベルアップ (green)</h2>
      <p class="desc">名声 Lv.1(71→100%) → 名声 Lv.2(0→50%)</p>
      <div class="gauge-wrapper">
        <AnimatedGauge
          before={10}
          after={8}
          max={14}
          label="名声 Lv.1"
          text="+12 名声Exp"
          color="green"
          segments={reputationLevelUp}
        />
      </div>
    </section>

    <section>
      <h2>6. 体力ゲージ（減少、セグメントなし）</h2>
      <p class="desc">80/100 → 32/100</p>
      <div class="gauge-wrapper">
        <AnimatedGauge
          before={staminaDrain.before}
          after={staminaDrain.after}
          max={staminaDrain.max}
          label={staminaDrain.label}
          text={staminaDrain.text}
          color="orange"
        />
      </div>
    </section>
  {/key}
</div>

<style>
  .test-page {
    max-width: 600px;
    margin: 2rem auto;
    padding: 1.5rem;
    background: #1a1a2e;
    color: #e0e0f0;
    font-family: sans-serif;
    min-height: 100vh;
  }

  h1 {
    color: #f4e4bc;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  h2 {
    color: #c9a959;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .desc {
    font-size: 0.8rem;
    color: #808090;
    margin-bottom: 0.5rem;
  }

  section {
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
  }

  .gauge-wrapper {
    padding: 0.5rem 0;
  }

  .replay-btn {
    padding: 0.5rem 1.5rem;
    background: rgba(201, 169, 89, 0.2);
    border: 1px solid #c9a959;
    border-radius: 6px;
    color: #f4e4bc;
    cursor: pointer;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .replay-btn:hover {
    background: rgba(201, 169, 89, 0.4);
  }
</style>
