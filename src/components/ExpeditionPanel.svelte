<script lang="ts">
  import { gameState, addMessage, addMoney, setExpedition } from '$lib/stores/game';
  import { getAllAreas } from '$lib/data/areas';
  import { getItem } from '$lib/data/items';
  import type { AreaDef } from '$lib/models/types';
  import ActiveEquipmentIcons from './common/ActiveEquipmentIcons.svelte';

  export let onBack: () => void;

  const areas = getAllAreas().sort((a, b) => a.costPerDay - b.costPerDay);

  function getMainDropNames(area: AreaDef): string {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const drop of area.drops) {
      if (!seen.has(drop.itemId)) {
        seen.add(drop.itemId);
        const item = getItem(drop.itemId);
        if (item) names.push(item.name);
      }
    }
    return names.join('、');
  }
  const durations = [3, 5, 7];

  let selectedArea: AreaDef | null = null;
  let selectedDuration: number = 3;

  $: expeditionActive = $gameState.expedition !== null;
  $: returnDay = expeditionActive
    ? $gameState.expedition!.startDay + $gameState.expedition!.duration
    : 0;
  $: daysUntilReturn = returnDay - $gameState.day;

  $: totalCost = selectedArea ? selectedArea.costPerDay * selectedDuration : 0;
  $: canAfford = $gameState.money >= totalCost;

  function selectArea(area: AreaDef) {
    selectedArea = area;
  }

  function dispatch() {
    if (!selectedArea || !canAfford) return;

    addMoney(-totalCost);
    setExpedition({
      areaId: selectedArea.id,
      startDay: $gameState.day,
      duration: selectedDuration,
    });
    addMessage(
      `採取隊を「${selectedArea.name}」に派遣しました（${selectedDuration}日間、費用: ${totalCost}G）`
    );
    onBack();
  }
</script>

<div class="expedition-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>🏕️ 採取隊派遣 <ActiveEquipmentIcons prefixes={['expedition_', 'all_probability']} /></h2>

  {#if expeditionActive}
    <div class="status-box">
      <h3>派遣中</h3>
      <p>
        現在「{$gameState.expedition?.areaId}」に採取隊を派遣しています。
      </p>
      <p class="return-info">
        帰還予定: {returnDay}日目（あと{daysUntilReturn}日）
      </p>
    </div>
  {:else}
    <p class="description">採取隊を派遣して素材を集めてもらいましょう。</p>

    <div class="area-selection">
      <h3>派遣先を選択</h3>
      <div class="area-list">
        {#each areas as area}
          <button
            class="area-item"
            class:selected={selectedArea?.id === area.id}
            on:click={() => selectArea(area)}
          >
            <div class="area-info">
              <span class="area-name">{area.name}</span>
              <span class="area-drops">{getMainDropNames(area)}</span>
            </div>
            <span class="area-cost">{area.costPerDay}G/日</span>
          </button>
        {/each}
      </div>
    </div>

    {#if selectedArea}
      <div class="duration-selection">
        <h3>派遣日数を選択</h3>
        <div class="duration-list">
          {#each durations as d}
            <button
              class="duration-item"
              class:selected={selectedDuration === d}
              on:click={() => (selectedDuration = d)}
            >
              {d}日間
            </button>
          {/each}
        </div>
      </div>

      <div class="summary">
        <h3>派遣内容</h3>
        <div class="summary-content">
          <p>派遣先: {selectedArea.name}</p>
          <p>期間: {selectedDuration}日間</p>
          <p>費用: {totalCost}G</p>
          <p class="balance" class:insufficient={!canAfford}>
            所持金: {$gameState.money}G {#if !canAfford}(不足){/if}
          </p>
        </div>
        <button class="dispatch-btn" on:click={dispatch} disabled={!canAfford}>
          派遣する
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .expedition-panel {
    padding: 1.5rem;
  }

  .back-btn {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    color: #c0c0d0;
    cursor: pointer;
    margin-bottom: 1rem;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  h2 {
    font-size: 1.5rem;
    color: #f4e4bc;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.1rem;
    color: #c9a959;
    margin-bottom: 0.75rem;
  }

  .description {
    color: #e0e0f0;
    margin-bottom: 1.5rem;
  }

  .status-box {
    padding: 1.5rem;
    background: rgba(76, 175, 80, 0.15);
    border: 2px solid #4caf50;
    border-radius: 8px;
  }

  .status-box p {
    color: #e0e0f0;
    margin: 0.5rem 0;
  }

  .return-info {
    font-size: 1.1rem;
    font-weight: bold;
    color: #81c784 !important;
  }

  .area-selection, .duration-selection {
    margin-bottom: 1.5rem;
  }

  .area-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .area-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #4a4a6a;
    border-radius: 6px;
    color: #e0e0f0;
    cursor: pointer;
  }

  .area-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .area-drops {
    font-size: 0.8rem;
    color: #a0a0b0;
  }

  .area-item:hover {
    background: rgba(201, 169, 89, 0.15);
  }

  .area-item.selected {
    border-color: #c9a959;
    background: rgba(201, 169, 89, 0.2);
  }

  .area-name {
    font-weight: bold;
  }

  .area-cost {
    color: #a0a0b0;
  }

  .duration-list {
    display: flex;
    gap: 0.75rem;
  }

  .duration-item {
    flex: 1;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #4a4a6a;
    border-radius: 6px;
    color: #e0e0f0;
    cursor: pointer;
  }

  .duration-item:hover {
    background: rgba(201, 169, 89, 0.15);
  }

  .duration-item.selected {
    border-color: #c9a959;
    background: rgba(201, 169, 89, 0.2);
  }

  .summary {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
  }

  .summary-content {
    margin-bottom: 1rem;
  }

  .summary-content p {
    color: #e0e0f0;
    margin: 0.3rem 0;
  }

  .balance {
    margin-top: 0.5rem;
    font-weight: bold;
  }

  .balance.insufficient {
    color: #ff6b6b !important;
  }

  .dispatch-btn {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 6px;
    color: #1a1a2e;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
  }

  .dispatch-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(201, 169, 89, 0.4);
  }

  .dispatch-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
