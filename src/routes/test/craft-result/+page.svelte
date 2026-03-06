<script lang="ts">
  import CraftResultDialog from '../../../components/alchemy/CraftResultDialog.svelte';
  import type { CraftMultipleResult } from '$lib/services/alchemy';
  import type { GaugeData } from '$lib/models/types';

  let testKey = 0;
  let activeCase: string = 'newAlbum';

  function replay() {
    testKey++;
  }

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

  type TestCase = {
    label: string;
    key: string;
    result: CraftMultipleResult;
    recipeName: string;
    alchemyExpBefore: number;
    alchemyExpAfter: number;
    reputationExpBefore: number;
    reputationExpAfter: number;
    staminaGauge: GaugeData;
  };

  const cases: TestCase[] = [
    { label: '新規アルバム登録', key: 'newAlbum', result: newAlbumResult, recipeName: '回復薬', alchemyExpBefore: 0, alchemyExpAfter: 4, reputationExpBefore: 0, reputationExpAfter: 2, staminaGauge: { before: 80, after: 72, max: 100, label: '体力' } },
    { label: '既知アイテム（A品質）', key: 'known', result: knownResult, recipeName: '回復薬', alchemyExpBefore: 10, alchemyExpAfter: 16, reputationExpBefore: 0, reputationExpAfter: 0, staminaGauge: { before: 72, after: 64, max: 100, label: '体力' } },
    { label: '高品質S + 新規', key: 'highQuality', result: highQualityResult, recipeName: '回復薬', alchemyExpBefore: 5, alchemyExpAfter: 13, reputationExpBefore: 0, reputationExpAfter: 4, staminaGauge: { before: 80, after: 72, max: 100, label: '体力' } },
    { label: '複数個 + 新規', key: 'multi', result: multiResult, recipeName: '回復薬', alchemyExpBefore: 2, alchemyExpAfter: 14, reputationExpBefore: 0, reputationExpAfter: 2, staminaGauge: { before: 80, after: 56, max: 100, label: '体力' } },
    { label: '品質新記録', key: 'record', result: recordResult, recipeName: '回復薬', alchemyExpBefore: 10, alchemyExpAfter: 16, reputationExpBefore: 0, reputationExpAfter: 0, staminaGauge: { before: 72, after: 64, max: 100, label: '体力' } },
    { label: '全失敗', key: 'fail', result: failResult, recipeName: '回復薬', alchemyExpBefore: 10, alchemyExpAfter: 11, reputationExpBefore: 0, reputationExpAfter: 0, staminaGauge: { before: 72, after: 64, max: 100, label: '体力' } },
  ];

  $: current = cases.find(c => c.key === activeCase) || cases[0];

  function noop() {
    // onClose は無効化
  }
</script>

<div class="toolbar">
  {#each cases as c}
    <button
      class:active={activeCase === c.key}
      on:click={() => { activeCase = c.key; replay(); }}
    >
      {c.label}
    </button>
  {/each}
  <button class="replay" on:click={replay}>🔄 Replay</button>

  <p class="info">
    {current.label}
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
    alchemyExpBefore={current.alchemyExpBefore}
    alchemyExpAfter={current.alchemyExpAfter}
    reputationExpBefore={current.reputationExpBefore}
    reputationExpAfter={current.reputationExpAfter}
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
    padding: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    border-bottom: 1px solid #4a4a6a;
  }

  button {
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    border: 1px solid #4a4a6a;
    background: #2a2a3e;
    color: #e0e0f0;
    cursor: pointer;
    font-size: 0.8rem;
  }

  button.active {
    background: #c9a959;
    color: #1a1a2e;
    border-color: #c9a959;
  }

  .replay {
    background: #3a3a5e;
    border-color: #6a6a8a;
  }

  .info {
    font-size: 0.8rem;
    color: #a0a0b0;
    margin: 0;
  }

  .tag {
    display: inline-block;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
  }

  .tag.new {
    background: #6a4c93;
    color: #fff;
  }

  .tag.record {
    background: #b8860b;
    color: #1a1a2e;
  }
</style>
