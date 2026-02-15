<script lang="ts">
  import { inspections } from '$lib/data/inspection';
  import type { InspectionDef } from '$lib/data/inspection';
  import InspectionTracker from '../../../components/InspectionTracker.svelte';

  let level = 1;
  let quests = 0;
  let villageDev = 0;
  let reputation = 0;
  let daysUntil = 78;

  // Q3（全4項目）を表示
  const inspection: InspectionDef = inspections[2];

  $: values = {
    level,
    quests,
    villageDev,
    reputation,
  };
</script>

<div class="test-page">
  <h2>InspectionTracker Test</h2>

  <div class="controls">
    <label>
      <span>錬金Lv: {level}</span>
      <input type="range" min="1" max="15" bind:value={level} />
    </label>
    <label>
      <span>依頼完了: {quests}</span>
      <input type="range" min="0" max="50" bind:value={quests} />
    </label>
    <label>
      <span>村発展: {villageDev}</span>
      <input type="range" min="0" max="80" bind:value={villageDev} />
    </label>
    <label>
      <span>名声: {reputation}</span>
      <input type="range" min="0" max="80" bind:value={reputation} />
    </label>
    <label>
      <span>残り日数: {daysUntil}</span>
      <input type="range" min="1" max="90" bind:value={daysUntil} />
    </label>
  </div>

  <div class="preview">
    <InspectionTracker {inspection} {values} {daysUntil} />
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
    margin-bottom: 2rem;
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
    min-width: 120px;
    font-size: 0.9rem;
    font-weight: bold;
  }

  input[type="range"] {
    flex: 1;
    accent-color: #c9a959;
  }

  .preview {
    padding: 1rem;
    background: rgba(0,0,0,0.3);
    border-radius: 8px;
  }
</style>
