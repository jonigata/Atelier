<script lang="ts">
  import { gameState, addMessage, addMoney, setExpedition } from '$lib/stores/game';
  import { showDialogueAndWait } from '$lib/services/presentation';
  import { getAllAreas } from '$lib/data/areas';
  import { getItem } from '$lib/data/items';
  import type { AreaDef } from '$lib/models/types';


  export let onBack: () => void;

  const areas = getAllAreas().sort((a, b) => a.costPerDay - b.costPerDay);

  const areaBgPosition: Record<string, string> = {
    lake: 'center 90%',
  };

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

  const departureLines: { ren: string; fee: string }[] = [
    { ren: '任せておけ。いい素材を持って帰る', fee: 'いってきまーす！ いいもの見つけてくるね！' },
    { ren: '了解した。期待していろ', fee: 'わくわくする〜！ お土産楽しみにしててね！' },
    { ren: '……行ってくる', fee: 'レンがやる気だ！ あたしも頑張るよー！' },
  ];

  async function dispatch() {
    if (!selectedArea || !canAfford) return;

    const area = selectedArea;
    const duration = selectedDuration;

    addMoney(-totalCost);
    setExpedition({
      areaId: area.id,
      startDay: $gameState.day,
      duration,
    });
    addMessage(
      `採取隊を「${area.name}」に派遣しました（${duration}日間、費用: ${totalCost}G）`
    );

    const lines = departureLines[Math.floor(Math.random() * departureLines.length)];
    await showDialogueAndWait({
      characterName: 'レン',
      characterTitle: '冒険者',
      characterFaceId: 'ren',
      eventImage: '/images/events/expedition_dispatch.png',
      lines: [
        { text: `「${area.name}」か。${duration}日で戻る`, expression: 'determined' },
        { text: lines.ren, expression: 'neutral' },
        { text: `フィー「${lines.fee}」`, expression: 'neutral' },
      ],
    });

    onBack();
  }
</script>

<div class="expedition-panel">
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
          {@const locked = !$gameState.unlockedAreas.includes(area.id)}
          {#if locked}
            <button class="area-item locked" disabled>
              <div class="area-info">
                <span class="area-name">？？？</span>
                <span class="area-drops">未開放の採取地</span>
              </div>
              <span class="area-cost">---</span>
            </button>
          {:else}
            <button
              class="area-item"
              class:selected={selectedArea?.id === area.id}
              on:click={() => selectArea(area)}
              style="background-image: url(/images/areas/{area.id}.png); background-position: {areaBgPosition[area.id] ?? 'center'}"
            >
              <div class="area-info">
                <span class="area-name">{area.name}</span>
                <span class="area-drops">{getMainDropNames(area)}</span>
              </div>
              <span class="area-cost">{area.costPerDay}G/日</span>
            </button>
          {/if}
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
    padding: 1rem 1.2rem;
    background-color: rgba(255, 255, 255, 0.05);
    background-size: cover;
    border: 2px solid #4a4a6a;
    border-radius: 6px;
    color: #e0e0f0;
    cursor: pointer;
    text-align: left;
    position: relative;
    overflow: hidden;
    min-height: 4.5rem;
  }

  .area-item::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgba(10, 10, 25, 0.85) 0%, rgba(10, 10, 25, 0.45) 35%, transparent 60%);
    z-index: 0;
  }

  .area-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    position: relative;
    z-index: 1;
  }

  .area-drops {
    font-size: 1rem;
    color: #b0b0c0;
  }

  .area-item:hover {
    border-color: #6a6a8a;
  }

  .area-item:hover::before {
    background: linear-gradient(to right, rgba(30, 25, 10, 0.85) 0%, rgba(30, 25, 10, 0.35) 35%, transparent 60%);
  }

  .area-item.locked {
    cursor: default;
    opacity: 0.45;
    border-color: #3a3a4a;
    background-color: rgba(0, 0, 0, 0.3);
  }

  .area-item.locked .area-name {
    color: #888;
  }

  .area-item.locked .area-cost {
    color: #666;
    border-color: rgba(100, 100, 100, 0.3);
  }

  .area-item.selected {
    border-color: #c9a959;
  }

  .area-item.selected::before {
    background: linear-gradient(to right, rgba(40, 30, 10, 0.85) 0%, rgba(40, 30, 10, 0.35) 35%, transparent 60%);
  }

  .area-name {
    font-weight: bold;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  }

  .area-cost {
    color: #f4e4bc;
    position: relative;
    z-index: 1;
    font-weight: bold;
    font-size: 1rem;
    background: rgba(0, 0, 0, 0.6);
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    border: 1px solid rgba(201, 169, 89, 0.4);
    white-space: nowrap;
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
