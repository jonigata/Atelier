<script lang="ts">
  import CraftResultDialog from '../../../components/alchemy/CraftResultDialog.svelte';
  import type { CraftMultipleResult } from '$lib/services/alchemy';
  import type { GaugeData } from '$lib/models/types';

  let testKey = 0;
  let activeCase: string = 'newAlbum';

  function replay() {
    testKey++;
  }

  const drawIcon = '<img class="draw-icon" src="/icons/ui/draw_lightning.png" alt="">';

  // ケース1: 新規アルバム登録（成功1個）
  const newAlbumResult: CraftMultipleResult = {
    successCount: 1,
    failCount: 0,
    items: [{ itemId: 'potion_01', quality: 69 }],
    duplicatedCount: 0,
    totalExpGained: 4,
    totalReputationExpGained: 2,
    isNewDiscovery: true,
    isNewQualityRecord: false,
    message: '',
    alchemyLevelUp: null,
    reputationDrawInfo: null,
  };
  const newAlbumExpGauge: GaugeData = {
    before: 0, after: 4, max: 14, label: 'Lv.1',
  };
  const newAlbumRepGauge: GaugeData = {
    before: 0, after: 2, max: 14, label: '名声 Lv.1',
    subtext: `NEXT${drawIcon}Lv.3`,
  };
  const newAlbumStaminaGauge: GaugeData = {
    before: 80, after: 72, max: 100, label: '体力',
  };

  // ケース2: 既知アイテム（アルバム登録なし）
  const knownResult: CraftMultipleResult = {
    successCount: 1,
    failCount: 0,
    items: [{ itemId: 'potion_01', quality: 85 }],
    duplicatedCount: 0,
    totalExpGained: 6,
    totalReputationExpGained: 0,
    isNewDiscovery: false,
    isNewQualityRecord: false,
    message: '',
    alchemyLevelUp: null,
    reputationDrawInfo: null,
  };
  const knownExpGauge: GaugeData = {
    before: 10, after: 16, max: 30, label: 'Lv.2',
  };
  const knownStaminaGauge: GaugeData = {
    before: 72, after: 64, max: 100, label: '体力',
  };

  // ケース3: 高品質S + 新規アルバム
  const highQualityResult: CraftMultipleResult = {
    successCount: 1,
    failCount: 0,
    items: [{ itemId: 'potion_01', quality: 95 }],
    duplicatedCount: 0,
    totalExpGained: 8,
    totalReputationExpGained: 4,
    isNewDiscovery: true,
    isNewQualityRecord: false,
    message: '',
    alchemyLevelUp: null,
    reputationDrawInfo: null,
  };
  const highQualityExpGauge: GaugeData = {
    before: 5, after: 13, max: 14, label: 'Lv.1',
  };
  const highQualityRepGauge: GaugeData = {
    before: 0, after: 4, max: 14, label: '名声 Lv.1',
    subtext: `NEXT${drawIcon}Lv.3`,
  };
  const highQualityStaminaGauge: GaugeData = {
    before: 80, after: 72, max: 100, label: '体力',
  };

  // ケース4: 複数個 + 新規アルバム
  const multiResult: CraftMultipleResult = {
    successCount: 3,
    failCount: 0,
    items: [
      { itemId: 'potion_01', quality: 65 },
      { itemId: 'potion_01', quality: 65 },
      { itemId: 'potion_01', quality: 65 },
    ],
    duplicatedCount: 0,
    totalExpGained: 12,
    totalReputationExpGained: 2,
    isNewDiscovery: true,
    isNewQualityRecord: false,
    message: '',
    alchemyLevelUp: null,
    reputationDrawInfo: null,
  };
  const multiExpGauge: GaugeData = {
    before: 2, after: 14, max: 14, label: 'Lv.1',
    segments: [
      { from: 2, to: 14, max: 14, label: 'Lv.1' },
      { from: 0, to: 0, max: 16, label: 'Lv.2' },
    ],
  };
  const multiRepGauge: GaugeData = {
    before: 0, after: 2, max: 14, label: '名声 Lv.1',
    subtext: `NEXT${drawIcon}Lv.3`,
  };
  const multiStaminaGauge: GaugeData = {
    before: 80, after: 56, max: 100, label: '体力',
  };

  // ケース5: 全失敗
  const failResult: CraftMultipleResult = {
    successCount: 0,
    failCount: 1,
    items: [],
    duplicatedCount: 0,
    totalExpGained: 1,
    totalReputationExpGained: 0,
    isNewDiscovery: false,
    isNewQualityRecord: false,
    message: '',
    alchemyLevelUp: null,
    reputationDrawInfo: null,
  };
  const failExpGauge: GaugeData = {
    before: 10, after: 11, max: 30, label: 'Lv.2',
  };
  const failStaminaGauge: GaugeData = {
    before: 72, after: 64, max: 100, label: '体力',
  };

  // ケース6: 品質新記録
  const recordResult: CraftMultipleResult = {
    successCount: 1,
    failCount: 0,
    items: [{ itemId: 'potion_01', quality: 78 }],
    duplicatedCount: 0,
    totalExpGained: 6,
    totalReputationExpGained: 0,
    isNewDiscovery: false,
    isNewQualityRecord: true,
    message: '',
    alchemyLevelUp: null,
    reputationDrawInfo: null,
  };
  const recordExpGauge: GaugeData = {
    before: 10, after: 16, max: 30, label: 'Lv.2',
  };
  const recordStaminaGauge: GaugeData = {
    before: 72, after: 64, max: 100, label: '体力',
  };

  type TestCase = {
    label: string;
    key: string;
    result: CraftMultipleResult;
    recipeName: string;
    expGauge: GaugeData;
    repGauge: GaugeData | null;
    staminaGauge: GaugeData;
  };

  const cases: TestCase[] = [
    { label: '新規アルバム登録', key: 'newAlbum', result: newAlbumResult, recipeName: '回復薬', expGauge: newAlbumExpGauge, repGauge: newAlbumRepGauge, staminaGauge: newAlbumStaminaGauge },
    { label: '既知アイテム（A品質）', key: 'known', result: knownResult, recipeName: '回復薬', expGauge: knownExpGauge, repGauge: null, staminaGauge: knownStaminaGauge },
    { label: '高品質S + 新規', key: 'highQuality', result: highQualityResult, recipeName: '回復薬', expGauge: highQualityExpGauge, repGauge: highQualityRepGauge, staminaGauge: highQualityStaminaGauge },
    { label: '複数個 + 新規', key: 'multi', result: multiResult, recipeName: '回復薬', expGauge: multiExpGauge, repGauge: multiRepGauge, staminaGauge: multiStaminaGauge },
    { label: '品質新記録', key: 'record', result: recordResult, recipeName: '回復薬', expGauge: recordExpGauge, repGauge: null, staminaGauge: recordStaminaGauge },
    { label: '全失敗', key: 'fail', result: failResult, recipeName: '回復薬', expGauge: failExpGauge, repGauge: null, staminaGauge: failStaminaGauge },
  ];

  $: current = cases.find(c => c.key === activeCase) || cases[0];

  function noop() {}
</script>

<div class="toolbar">
  <h1>CraftResultDialog テスト</h1>

  <div class="controls">
    <button class="replay-btn" on:click={replay}>再生し直す</button>
    <div class="case-buttons">
      {#each cases as c}
        <button
          class="case-btn"
          class:active={activeCase === c.key}
          on:click={() => { activeCase = c.key; testKey++; }}
        >
          {c.label}
        </button>
      {/each}
    </div>
  </div>

  <p class="desc">
    現在: {current.label}
    {#if current.result.isNewDiscovery}
      <span class="tag new">NEW</span>
    {/if}
    {#if current.result.isNewQualityRecord}
      <span class="tag record">RECORD</span>
    {/if}
    | 品質: {current.result.items[0]?.quality ?? '---'}
    | 成功: {current.result.successCount} 失敗: {current.result.failCount}
  </p>
</div>

{#key testKey}
  <CraftResultDialog
    result={current.result}
    recipeName={current.recipeName}
    expGaugeData={current.expGauge}
    reputationExpGaugeData={current.repGauge}
    staminaGaugeData={current.staminaGauge}
    onClose={noop}
  />
{/key}

<style>
  .toolbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2000;
    background: #1a1a2e;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #4a4a6a;
    color: #e0e0f0;
    font-family: sans-serif;
  }

  h1 {
    color: #f4e4bc;
    margin-bottom: 1rem;
    font-size: 1.3rem;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 1rem;
  }

  .case-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .case-btn {
    padding: 0.3rem 0.7rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #a0a0b0;
    cursor: pointer;
    font-size: 0.8rem;
  }

  .case-btn.active {
    background: rgba(201, 169, 89, 0.2);
    border-color: #c9a959;
    color: #f4e4bc;
  }

  .replay-btn {
    padding: 0.4rem 1rem;
    background: rgba(201, 169, 89, 0.2);
    border: 1px solid #c9a959;
    border-radius: 6px;
    color: #f4e4bc;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .replay-btn:hover {
    background: rgba(201, 169, 89, 0.4);
  }

  .desc {
    font-size: 0.8rem;
    color: #808090;
    margin-bottom: 0.5rem;
  }

  .tag.new {
    background: #6a4c93;
    color: #fff;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
  }

  .tag.record {
    background: #b8860b;
    color: #fff;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
  }
</style>
