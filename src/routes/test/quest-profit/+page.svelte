<script lang="ts">
  import { questTemplates, questClients } from '$lib/data/quests';
  import { recipes } from '$lib/data/recipes';
  import { items } from '$lib/data/items';

  // カテゴリ別最安アイテム（category指定レシピ用）
  const cheapestByCategory: Record<string, number> = {};
  for (const item of Object.values(items)) {
    const cat = item.category;
    if (!(cat in cheapestByCategory) || item.basePrice < cheapestByCategory[cat]) {
      cheapestByCategory[cat] = item.basePrice;
    }
  }

  // resultItemId → recipeId のマップ
  const recipeByResult: Record<string, string> = {};
  for (const r of Object.values(recipes)) {
    recipeByResult[r.resultItemId] = r.id;
  }

  // === 完全原価（再帰的に末端素材まで分解） ===
  const fullCostCache: Record<string, number> = {};
  function getFullCost(itemId: string): number {
    if (fullCostCache[itemId] !== undefined) return fullCostCache[itemId];
    const recipeId = recipeByResult[itemId];
    if (!recipeId) {
      const cost = items[itemId]?.basePrice ?? 0;
      fullCostCache[itemId] = cost;
      return cost;
    }
    let total = 0;
    for (const ing of recipes[recipeId].ingredients) {
      if (ing.itemId) {
        total += getFullCost(ing.itemId) * ing.quantity;
      } else if (ing.category) {
        total += (cheapestByCategory[ing.category] ?? 0) * ing.quantity;
      }
    }
    fullCostCache[itemId] = total;
    return total;
  }

  // === 直接原価（1段階のみ、材料のbasePriceを合算） ===
  function getDirectCost(itemId: string): number {
    const recipeId = recipeByResult[itemId];
    if (!recipeId) return items[itemId]?.basePrice ?? 0;
    let total = 0;
    for (const ing of recipes[recipeId].ingredients) {
      if (ing.itemId) {
        total += (items[ing.itemId]?.basePrice ?? 0) * ing.quantity;
      } else if (ing.category) {
        total += (cheapestByCategory[ing.category] ?? 0) * ing.quantity;
      }
    }
    return total;
  }

  // === レシピ階層の深さ ===
  const depthCache: Record<string, number> = {};
  function getDepth(itemId: string): number {
    if (depthCache[itemId] !== undefined) return depthCache[itemId];
    const recipeId = recipeByResult[itemId];
    if (!recipeId) { depthCache[itemId] = 0; return 0; }
    let maxChild = 0;
    for (const ing of recipes[recipeId].ingredients) {
      if (ing.itemId) maxChild = Math.max(maxChild, getDepth(ing.itemId));
    }
    depthCache[itemId] = maxChild + 1;
    return maxChild + 1;
  }

  interface QuestAnalysis {
    id: string;
    clientName: string;
    title: string;
    itemName: string;
    quantity: number;
    depth: number;
    // 完全原価
    fullUnit: number;
    fullTotal: number;
    fullRatio: number;
    // 直接原価
    directUnit: number;
    directTotal: number;
    directRatio: number;
    reward: number;
  }

  const analysisData: QuestAnalysis[] = questTemplates.map((q) => {
    const fullUnit = getFullCost(q.requiredItemId);
    const fullTotal = fullUnit * q.requiredQuantity;
    const directUnit = getDirectCost(q.requiredItemId);
    const directTotal = directUnit * q.requiredQuantity;
    const client = q.clientId ? questClients[q.clientId] : undefined;
    const item = items[q.requiredItemId];
    return {
      id: q.id,
      clientName: client?.name ?? '?',
      title: q.title,
      itemName: item?.name ?? q.requiredItemId,
      quantity: q.requiredQuantity,
      depth: getDepth(q.requiredItemId),
      fullUnit,
      fullTotal,
      fullRatio: fullTotal > 0 ? (q.rewardMoney / fullTotal) * 100 : 0,
      directUnit,
      directTotal,
      directRatio: directTotal > 0 ? (q.rewardMoney / directTotal) * 100 : 0,
      reward: q.rewardMoney,
    };
  });

  type SortKey = 'fullRatio' | 'directRatio' | 'reward' | 'fullTotal' | 'directTotal' | 'clientName' | 'title' | 'depth';
  let sortKey = $state<SortKey>('fullRatio');
  let sortAsc = $state(true);

  let sorted = $derived(
    [...analysisData].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    })
  );

  let belowFullCount = $derived(analysisData.filter((d) => d.fullRatio < 120).length);
  let belowDirectCount = $derived(analysisData.filter((d) => d.directRatio < 120).length);
  let totalCount = $derived(analysisData.length);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      sortAsc = !sortAsc;
    } else {
      sortKey = key;
      sortAsc = key === 'fullRatio' || key === 'directRatio' || key === 'depth';
    }
  }

  function si(key: SortKey): string {
    if (sortKey !== key) return '';
    return sortAsc ? ' \u25B2' : ' \u25BC';
  }
</script>

<div class="test-page">
  <h2>依頼利益率分析</h2>
  <div class="summary">
    全 {totalCount} 件 &mdash;
    完全原価120%未満: {#if belowFullCount > 0}<span class="warn">{belowFullCount}件</span>{:else}<span class="ok">なし</span>{/if}
    / 直接原価120%未満: {#if belowDirectCount > 0}<span class="warn">{belowDirectCount}件</span>{:else}<span class="ok">なし</span>{/if}
  </div>
  <div class="legend">
    <span class="legend-item"><span class="swatch full"></span>完全原価 = 末端素材まで再帰分解した原材料費</span>
    <span class="legend-item"><span class="swatch direct"></span>直接原価 = 1段階のみ（材料のbasePrice合算）</span>
    <span class="legend-item"><span class="swatch depth-s"></span>深度 = レシピ階層の深さ（0=素材そのもの）</span>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th class="col-num">#</th>
          <th class="col-client clickable" onclick={() => toggleSort('clientName')}>依頼主{si('clientName')}</th>
          <th class="col-title clickable" onclick={() => toggleSort('title')}>依頼名{si('title')}</th>
          <th class="col-item">納品物</th>
          <th class="col-tiny">数</th>
          <th class="col-tiny clickable" onclick={() => toggleSort('depth')}>深{si('depth')}</th>
          <th class="col-cost clickable full-bg" onclick={() => toggleSort('fullTotal')}>完全原価{si('fullTotal')}</th>
          <th class="col-ratio clickable full-bg" onclick={() => toggleSort('fullRatio')}>完全率{si('fullRatio')}</th>
          <th class="col-cost clickable direct-bg" onclick={() => toggleSort('directTotal')}>直接原価{si('directTotal')}</th>
          <th class="col-ratio clickable direct-bg" onclick={() => toggleSort('directRatio')}>直接率{si('directRatio')}</th>
          <th class="col-reward clickable" onclick={() => toggleSort('reward')}>報酬{si('reward')}</th>
        </tr>
      </thead>
      <tbody>
        {#each sorted as row, i}
          {@const dangerFull = row.fullRatio < 120}
          {@const dangerDirect = row.directRatio < 120}
          <tr class:danger={dangerFull || dangerDirect}>
            <td class="col-num">{i + 1}</td>
            <td class="col-client">{row.clientName}</td>
            <td class="col-title">{row.title}</td>
            <td class="col-item">{row.itemName}</td>
            <td class="col-tiny">{row.quantity}</td>
            <td class="col-tiny depth" class:depth-hi={row.depth >= 3}>{row.depth}</td>
            <td class="col-cost full-bg">{row.fullTotal}G</td>
            <td class="col-ratio full-bg" class:ratio-danger={dangerFull} class:ratio-warn={row.fullRatio >= 120 && row.fullRatio < 150}>{row.fullRatio.toFixed(1)}%</td>
            <td class="col-cost direct-bg">{row.directTotal}G</td>
            <td class="col-ratio direct-bg" class:ratio-danger={dangerDirect} class:ratio-warn={row.directRatio >= 120 && row.directRatio < 150}>{row.directRatio.toFixed(1)}%</td>
            <td class="col-reward">{row.reward}G</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .test-page {
    background: #1a1a2e;
    color: #e0e0f0;
    min-height: 100vh;
    padding: 24px;
    font-family: 'Segoe UI', sans-serif;
  }
  h2 { color: #c9a959; margin-bottom: 8px; }
  .summary { font-size: 1.05em; margin-bottom: 8px; }
  .warn { color: #ff6b6b; font-weight: bold; }
  .ok { color: #6bff8b; font-weight: bold; }
  .legend {
    display: flex; gap: 20px; flex-wrap: wrap;
    color: #888; font-size: 0.82em; margin-bottom: 16px;
  }
  .legend-item { display: flex; align-items: center; gap: 6px; }
  .swatch {
    display: inline-block; width: 12px; height: 12px; border-radius: 2px;
  }
  .swatch.full { background: rgba(100, 160, 255, 0.35); }
  .swatch.direct { background: rgba(160, 255, 100, 0.25); }
  .swatch.depth-s { background: rgba(255, 180, 80, 0.4); }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.88em; }
  th, td {
    padding: 5px 8px; text-align: left;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    white-space: nowrap;
  }
  th {
    background: rgba(255,255,255,0.06); color: #c9a959;
    position: sticky; top: 0; z-index: 1;
  }
  th.clickable { cursor: pointer; user-select: none; }
  th.clickable:hover { background: rgba(255,255,255,0.12); }
  /* カラム幅 */
  .col-num { width: 32px; text-align: center; color: #555; }
  .col-client { width: 72px; }
  .col-title { min-width: 120px; }
  .col-item { min-width: 90px; }
  .col-tiny { width: 32px; text-align: center; }
  .col-cost { width: 72px; text-align: right; }
  .col-reward { width: 64px; text-align: right; }
  .col-ratio { width: 68px; text-align: right; font-weight: bold; }
  /* 完全原価・直接原価の背景色分け */
  .full-bg { background: rgba(100, 160, 255, 0.06); }
  .direct-bg { background: rgba(160, 255, 100, 0.04); }
  th.full-bg { background: rgba(100, 160, 255, 0.15); }
  th.direct-bg { background: rgba(160, 255, 100, 0.12); }
  /* 深度 */
  .depth { color: #b08040; }
  .depth-hi { color: #ff9933; font-weight: bold; }
  /* 利益率の色分け */
  .ratio-danger { color: #ff6b6b; }
  .ratio-warn { color: #ffc83d; }
  /* 行ハイライト */
  tr.danger td { background: rgba(255, 60, 60, 0.08); }
  tr.danger td.full-bg { background: rgba(255, 60, 60, 0.12); }
  tr.danger td.direct-bg { background: rgba(255, 60, 60, 0.10); }
  tbody tr:hover td { background: rgba(255,255,255,0.06); }
</style>
