<svelte:options runes={true} />

<script lang="ts">
  import { inspections } from '$lib/data/inspection';
  import type { InspectionDef } from '$lib/data/inspection';
  import { calcLevelFromExp } from '$lib/data/balance';
  import InspectionTracker from '../../../components/InspectionTracker.svelte';

  let levelExp = $state(0);      // 錬金 生XP
  let quests = $state(0);
  let villageDev = $state(0);    // 村発展Lv (discrete)
  let reputationExp = $state(0); // 名声 生XP
  let daysUntil = $state(78);

  // XPからレベルを自動計算
  let level = $derived(calcLevelFromExp(levelExp));
  let reputation = $derived(calcLevelFromExp(reputationExp));

  // 査察選択
  let inspectionIndex = $state(5); // デフォルト: 9月末（全4項目）
  let inspection: InspectionDef = $derived(inspections[inspectionIndex]);

  // 初回登場エフェクトテスト用
  let showTracker = $state(true);
  let firstReveal = $state(false);
  let revealKey = $state(0);

  function triggerReveal() {
    showTracker = false;
    firstReveal = true;
    revealKey++;
    // 次のフレームで表示
    requestAnimationFrame(() => {
      showTracker = true;
    });
  }
</script>

<div class="test-page">
  <h2>InspectionTracker Test</h2>

  <div class="controls">
    <label>
      <span>査察:</span>
      <select bind:value={inspectionIndex}>
        {#each inspections as insp, i}
          <option value={i}>{insp.month}月末 - {insp.title}（{insp.criteria.length}項目）</option>
        {/each}
      </select>
    </label>
    <label>
      <span>錬金Exp: {levelExp} (Lv.{level})</span>
      <input type="range" min="0" max="8000" step="10" bind:value={levelExp} />
    </label>
    <label>
      <span>依頼完了: {quests}</span>
      <input type="range" min="0" max="50" bind:value={quests} />
    </label>
    <label>
      <span>村発展Lv: {villageDev}</span>
      <input type="range" min="0" max="10" bind:value={villageDev} />
    </label>
    <label>
      <span>名声Exp: {reputationExp} (Lv.{reputation})</span>
      <input type="range" min="0" max="8000" step="10" bind:value={reputationExp} />
    </label>
    <label>
      <span>残り日数: {daysUntil}</span>
      <input type="range" min="1" max="90" bind:value={daysUntil} />
    </label>
  </div>

  <div class="reveal-controls">
    <button class="reveal-btn" onclick={triggerReveal}>
      初回登場エフェクトを再生
    </button>
  </div>

  <div class="preview">
    {#if showTracker}
      {#key revealKey}
        <InspectionTracker
          {inspection}
          values={{ level, quests, villageDev, reputation }}
          expValues={{ level: levelExp, reputation: reputationExp }}
          {daysUntil}
          {firstReveal}
        />
      {/key}
    {/if}
  </div>
</div>

<style>
  .test-page {
    max-width: 700px;
    margin: 2rem auto;
    padding: 1rem;
    color: #e0e0f0;
    background: #1a1a2e;
    min-height: 100vh;
  }

  h2 {
    color: #c9a959;
    margin-bottom: 1.5rem;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  label span {
    min-width: 180px;
    font-size: 0.9rem;
    font-weight: bold;
  }

  select {
    flex: 1;
    padding: 0.4rem;
    background: #2a2a3e;
    color: #e0e0f0;
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  input[type="range"] {
    flex: 1;
    accent-color: #c9a959;
  }

  .reveal-controls {
    margin-bottom: 1rem;
  }

  .reveal-btn {
    padding: 0.6rem 1.2rem;
    background: linear-gradient(135deg, #8b6914, #c9a959);
    border: none;
    border-radius: 6px;
    color: #1a1a2e;
    font-weight: bold;
    font-size: 0.95rem;
    cursor: pointer;
  }

  .reveal-btn:hover {
    filter: brightness(1.1);
  }

  .preview {
    padding: 1rem;
    background: rgba(0,0,0,0.3);
    border-radius: 8px;
    min-height: 200px;
  }
</style>
