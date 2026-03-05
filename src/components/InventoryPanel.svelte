<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { getItem, getItemIcon, handleIconError } from '$lib/data/items';
  import { getArea } from '$lib/data/areas';
  import { formatOrigin } from '$lib/data/flavorTexts';
  import type { OwnedItem, EquipmentDef } from '$lib/models/types';
  import { CATEGORY_NAMES, getCategoryName } from '$lib/data/categories';
  import { getEquipment, getEquipmentIcon } from '$lib/data/equipment';
  import { getHelper } from '$lib/data/helpers';
  import { getBuilding } from '$lib/data/buildings';
  import type { HelperDef, BuildingDef } from '$lib/models/types';
  import ItemCard from './common/ItemCard.svelte';
  import CustomSelect from './common/CustomSelect.svelte';

  export let onBack: () => void;

  type SortKey = 'name' | 'quality' | 'category';
  let sortKey: SortKey = 'category';
  let filterCategory: string = 'all';
  let showDetails = false; // 詳細表示モード
  let expandedItems: Set<string> = new Set(); // 展開中のアイテムID

  // まとめ表示用（同一アイテムをまとめる）
  interface SummaryItem {
    itemId: string;
    name: string;
    category: string;
    count: number;
    avgQuality: number;
    minQuality: number;
    maxQuality: number;
    qualities: { quality: number; count: number }[]; // 品質ごとの内訳
    items: OwnedItem[]; // 個別アイテム（来歴表示用）
  }

  // 詳細表示用（同一アイテム・同一品質ごと）
  interface DetailedItem {
    itemId: string;
    quality: number;
    count: number;
    name: string;
    category: string;
  }

  // まとめ表示用のグルーピング
  function groupItemsSummary(items: OwnedItem[]): SummaryItem[] {
    const grouped = new Map<string, SummaryItem>();

    for (const item of items) {
      const def = getItem(item.itemId);
      if (!def) continue;

      const existing = grouped.get(item.itemId);

      if (existing) {
        existing.count++;
        existing.minQuality = Math.min(existing.minQuality, item.quality);
        existing.maxQuality = Math.max(existing.maxQuality, item.quality);
        existing.items.push(item);
        // 品質ごとの内訳を更新
        const qualityEntry = existing.qualities.find(q => q.quality === item.quality);
        if (qualityEntry) {
          qualityEntry.count++;
        } else {
          existing.qualities.push({ quality: item.quality, count: 1 });
        }
      } else {
        grouped.set(item.itemId, {
          itemId: item.itemId,
          name: def.name,
          category: def.category,
          count: 1,
          avgQuality: 0, // 後で計算
          minQuality: item.quality,
          maxQuality: item.quality,
          qualities: [{ quality: item.quality, count: 1 }],
          items: [item],
        });
      }
    }

    // 平均品質を計算し、品質内訳をソート
    for (const item of grouped.values()) {
      const totalQuality = item.qualities.reduce((sum, q) => sum + q.quality * q.count, 0);
      item.avgQuality = Math.round(totalQuality / item.count);
      item.qualities.sort((a, b) => b.quality - a.quality); // 品質の高い順
    }

    return Array.from(grouped.values());
  }

  // 詳細表示用のグルーピング（従来通り）
  function groupItemsDetailed(items: OwnedItem[]): DetailedItem[] {
    const grouped = new Map<string, DetailedItem>();

    for (const item of items) {
      const def = getItem(item.itemId);
      if (!def) continue;

      const key = `${item.itemId}_${item.quality}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.count++;
      } else {
        grouped.set(key, {
          itemId: item.itemId,
          quality: item.quality,
          count: 1,
          name: def.name,
          category: def.category,
        });
      }
    }

    return Array.from(grouped.values());
  }

  // 展開トグル
  function toggleExpand(itemId: string) {
    if (expandedItems.has(itemId)) {
      expandedItems.delete(itemId);
    } else {
      expandedItems.add(itemId);
    }
    expandedItems = expandedItems; // リアクティビティ
  }

  // ソートとフィルター（まとめ表示）
  $: summaryItems = groupItemsSummary($gameState.inventory);

  $: filteredSummaryItems = filterCategory === 'all'
    ? summaryItems
    : summaryItems.filter(item => item.category === filterCategory);

  $: sortedSummaryItems = [...filteredSummaryItems].sort((a, b) => {
    switch (sortKey) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'quality':
        return b.avgQuality - a.avgQuality;
      case 'category':
        return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // ソートとフィルター（詳細表示）
  $: detailedItems = groupItemsDetailed($gameState.inventory);

  $: filteredDetailedItems = filterCategory === 'all'
    ? detailedItems
    : detailedItems.filter(item => item.category === filterCategory);

  $: sortedDetailedItems = [...filteredDetailedItems].sort((a, b) => {
    switch (sortKey) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'quality':
        return b.quality - a.quality;
      case 'category':
        return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // カテゴリ一覧（実際に持っているアイテムのカテゴリのみ）
  $: availableCategories = [...new Set(summaryItems.map(item => item.category))];

  // 合計アイテム数
  $: totalItems = $gameState.inventory.length;

  // 所持機材
  const EQUIP_CATEGORY_NAMES: Record<string, string> = {
    time: '時間・行動',
    material: '素材・調合',
    economy: '経済・報酬',
    special: '特殊',
  };

  $: ownedEquipmentDefs = $gameState.ownedEquipment
    .map((id) => getEquipment(id))
    .filter((def): def is EquipmentDef => def !== undefined);

  $: equipmentByCategory = ownedEquipmentDefs.reduce(
    (acc, def) => {
      if (!acc[def.category]) acc[def.category] = [];
      acc[def.category].push(def);
      return acc;
    },
    {} as Record<string, EquipmentDef[]>,
  );

  // 所持助手
  $: ownedHelperDefs = $gameState.ownedHelpers
    .map((h) => {
      const def = getHelper(h.helperId);
      return def ? { def, level: h.level } : null;
    })
    .filter((h): h is { def: HelperDef; level: number } => h !== null);

  // 村の建物
  $: ownedBuildingDefs = $gameState.buildings
    .map((b) => {
      const def = getBuilding(b.buildingId);
      return def ? { def, level: b.level } : null;
    })
    .filter((b): b is { def: BuildingDef; level: number } => b !== null);
</script>

<div class="inventory-panel">
  <button class="back-btn" on:click={onBack}>← 戻る</button>
  <h2>📦 インベントリ</h2>

  <div class="inventory-header">
    <span class="total-count">所持アイテム: {totalItems}個</span>

    <div class="controls">
      <div class="filter-group">
        <span class="control-label">カテゴリ:</span>
        <CustomSelect
          bind:value={filterCategory}
          options={[
            { value: 'all', label: 'すべて' },
            ...availableCategories.map(cat => ({
              value: cat,
              label: CATEGORY_NAMES[cat as keyof typeof CATEGORY_NAMES] || cat
            }))
          ]}
          label="カテゴリ"
        />
      </div>

      <div class="sort-group">
        <span class="control-label">並び替え:</span>
        <CustomSelect
          bind:value={sortKey}
          options={[
            { value: 'category', label: 'カテゴリ' },
            { value: 'name', label: '名前' },
            { value: 'quality', label: '品質' },
          ]}
          label="並び替え"
        />
      </div>

      <label class="detail-toggle">
        <input type="checkbox" bind:checked={showDetails} />
        品質別に表示
      </label>
    </div>
  </div>

  {#if totalItems === 0}
    <div class="empty-inventory">
      <p>アイテムがありません</p>
      <p class="hint">採取に行ってアイテムを集めましょう</p>
    </div>
  {:else if showDetails}
    <!-- 詳細表示（品質別） -->
    <div class="item-grid">
      {#each sortedDetailedItems as item}
        <div class="item-card">
          <img class="item-icon" src={getItemIcon(item.itemId)} alt={item.name} on:error={handleIconError} />
          <div class="item-header">
            <span class="item-name">{item.name}</span>
            {#if item.count > 1}
              <span class="item-count">×{item.count}</span>
            {/if}
          </div>
          <div class="item-details">
            <span class="item-category">{CATEGORY_NAMES[item.category as keyof typeof CATEGORY_NAMES] || item.category}</span>
            <span class="item-quality" class:high={item.quality >= 70} class:low={item.quality < 30}>
              品質 {item.quality}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- まとめ表示 -->
    <div class="item-list">
      {#each sortedSummaryItems as item}
        <div class="item-row" class:expanded={expandedItems.has(item.itemId)}>
          <button class="item-main" on:click={() => toggleExpand(item.itemId)}>
            <span class="expand-icon">{expandedItems.has(item.itemId) ? '▼' : '▶'}</span>
            <img class="item-icon-small" src={getItemIcon(item.itemId)} alt={item.name} on:error={handleIconError} />
            <span class="item-name">{item.name}</span>
            <span class="item-count">×{item.count}</span>
            <span class="item-category">{CATEGORY_NAMES[item.category as keyof typeof CATEGORY_NAMES] || item.category}</span>
            <span class="item-quality-summary" class:high={item.avgQuality >= 70} class:low={item.avgQuality < 30}>
              平均 {item.avgQuality}
              {#if item.minQuality !== item.maxQuality}
                <span class="quality-range">({item.minQuality}~{item.maxQuality})</span>
              {/if}
            </span>
          </button>
          {#if expandedItems.has(item.itemId)}
            <div class="item-breakdown-list">
              {#each item.items.sort((a, b) => b.quality - a.quality) as ownedItem}
                <div class="item-detail-row">
                  <span class="detail-quality" class:high={ownedItem.quality >= 70} class:low={ownedItem.quality < 30}>
                    品質 {ownedItem.quality}
                  </span>
                  {#if ownedItem.origin}
                    <span class="detail-origin">
                      {#if ownedItem.origin.type === 'initial'}
                        師匠からの餞別
                      {:else if ownedItem.origin.type === 'expedition' && ownedItem.origin.areaId}
                        {getArea(ownedItem.origin.areaId)?.name ?? ownedItem.origin.areaId}
                      {:else if ownedItem.origin.type === 'shop'}
                        ショップ
                      {:else if ownedItem.origin.type === 'crafted'}
                        調合
                      {:else if ownedItem.origin.type === 'reward' && ownedItem.origin.flavorText}
                        {ownedItem.origin.flavorText}
                      {:else if ownedItem.origin.type === 'reward'}
                        報酬
                      {/if}
                    </span>
                    {#if ownedItem.origin.flavorText && ownedItem.origin.type !== 'reward'}
                      <span class="detail-flavor">「{ownedItem.origin.flavorText}」</span>
                    {/if}
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- 所持機材セクション -->
  {#if ownedEquipmentDefs.length > 0}
    <div class="equipment-section">
      <h3 class="equipment-header">所持機材 ({ownedEquipmentDefs.length})</h3>
      <div class="equip-grid">
        {#each ownedEquipmentDefs as def}
          <div class="equip-card" class:rare={def.rarity === 'rare'}>
            <div class="equip-img-wrap">
              <img class="equip-icon" src={getEquipmentIcon(def.id)} alt={def.name} />
              {#if def.rarity === 'rare'}
                <span class="equip-rarity-badge">RARE</span>
              {/if}
            </div>
            <div class="equip-info">
              <span class="equip-category-label">{EQUIP_CATEGORY_NAMES[def.category] || def.category}</span>
              <span class="equip-name">{def.name}</span>
              <span class="equip-effect">{def.effectDescription}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- 助手セクション -->
  {#if ownedHelperDefs.length > 0}
    <div class="equipment-section">
      <h3 class="equipment-header">助手 ({ownedHelperDefs.length})</h3>
      <div class="equip-grid">
        {#each ownedHelperDefs as { def, level }}
          <div class="equip-card">
            <div class="equip-img-wrap">
              <img class="equip-icon" src="/images/helpers/{def.id}.png" alt={def.name} />
            </div>
            <div class="equip-info">
              <span class="equip-category-label">{def.species}</span>
              <span class="equip-name">{def.name}</span>
              <span class="helper-level">Lv.{level}</span>
              <span class="equip-effect">{def.levelEffects[level - 1].description}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- 村の建物セクション -->
  {#if ownedBuildingDefs.length > 0}
    <div class="equipment-section">
      <h3 class="equipment-header">村の建物 ({ownedBuildingDefs.length})</h3>
      <div class="equip-grid">
        {#each ownedBuildingDefs as { def, level }}
          <div class="equip-card">
            <div class="equip-img-wrap">
              <img class="equip-icon" src="/images/buildings/{def.id}.png" alt={def.name} />
            </div>
            <div class="equip-info">
              <span class="equip-name">{def.name}</span>
              <span class="building-level">Lv.{level}{#if level < def.maxLevel} / {def.maxLevel}{/if}</span>
              <span class="equip-effect">{def.levels[level - 1].effectDescription}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .inventory-panel {
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

  .inventory-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
  }

  .total-count {
    font-size: 1rem;
    color: #c9a959;
  }

  .controls {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .filter-group,
  .sort-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  label {
    font-size: 0.85rem;
    color: #a0a0b0;
  }

  .control-label {
    font-size: 0.85rem;
    color: #a0a0b0;
  }

  .empty-inventory {
    padding: 2rem;
    text-align: center;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .empty-inventory p {
    color: #e0e0f0;
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 0.9rem;
    color: #a0a0b0 !important;
  }

  .item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  .item-card {
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    transition: all 0.2s;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .item-icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .item-icon-small {
    width: 28px;
    height: 28px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .item-card:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #6a6a8a;
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .item-name {
    font-weight: bold;
    color: #e0e0f0;
  }

  .item-count {
    background: #c9a959;
    color: #1a1a2e;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-size: 0.8rem;
    font-weight: bold;
  }

  .item-details {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
  }

  .item-category {
    color: #808090;
  }

  .item-quality {
    color: #a0a0b0;
  }

  .item-quality.high {
    color: #81c784;
  }

  .item-quality.low {
    color: #ff6b6b;
  }

  /* 詳細表示トグル */
  .detail-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    font-size: 0.85rem;
    color: #a0a0b0;
  }

  .detail-toggle input {
    cursor: pointer;
  }

  /* まとめ表示 */
  .item-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .item-row {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    overflow: hidden;
  }

  .item-row.expanded {
    border-color: #6a6a8a;
  }

  .item-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: #e0e0f0;
    cursor: pointer;
    text-align: left;
    font-size: 0.95rem;
  }

  .item-main:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .expand-icon {
    font-size: 0.7rem;
    color: #808090;
    width: 1rem;
    flex-shrink: 0;
  }

  .item-main .item-name {
    font-weight: bold;
    flex: 1;
  }

  .item-main .item-count {
    background: #c9a959;
    color: #1a1a2e;
    padding: 0.1rem 0.5rem;
    border-radius: 3px;
    font-size: 0.85rem;
    font-weight: bold;
  }

  .item-main .item-category {
    color: #808090;
    font-size: 0.85rem;
    min-width: 4rem;
  }

  .item-quality-summary {
    color: #a0a0b0;
    font-size: 0.9rem;
    min-width: 6rem;
    text-align: right;
  }

  .item-quality-summary.high {
    color: #81c784;
  }

  .item-quality-summary.low {
    color: #ff6b6b;
  }

  .quality-range {
    font-size: 0.8rem;
    color: #808090;
    margin-left: 0.25rem;
  }

  .item-breakdown-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 1rem 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-top: 1px solid #3a3a5a;
  }

  .item-detail-row {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    padding: 0.3rem 0.5rem;
    border-radius: 3px;
  }

  .item-detail-row:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .detail-quality {
    font-size: 0.85rem;
    color: #a0a0b0;
    min-width: 4rem;
    flex-shrink: 0;
  }

  .detail-quality.high {
    color: #81c784;
  }

  .detail-quality.low {
    color: #ff6b6b;
  }

  .detail-origin {
    font-size: 0.8rem;
    color: #808090;
    flex-shrink: 0;
  }

  .detail-flavor {
    font-size: 0.8rem;
    color: #6a7a6a;
    font-style: italic;
  }

  /* 所持機材セクション */
  .equipment-section {
    margin-top: 1.5rem;
    border-top: 1px solid #4a4a6a;
    padding-top: 1rem;
  }

  .equipment-header {
    font-size: 1.1rem;
    color: #e8a840;
    margin-bottom: 0.75rem;
  }

  .equip-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  .equip-card {
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid #3a3a5a;
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .equip-card:hover {
    border-color: #6a6a8a;
  }

  .equip-card.rare {
    border-color: rgba(232, 168, 64, 0.3);
  }

  .equip-img-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 3;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .equip-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .equip-rarity-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    font-size: 0.6rem;
    font-weight: bold;
    letter-spacing: 0.05em;
    background: rgba(232, 168, 64, 0.85);
    color: #1a1a2e;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
  }

  .equip-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.5rem 0.65rem 0.65rem;
  }

  .equip-category-label {
    font-size: 0.7rem;
    color: #808090;
  }

  .equip-name {
    font-weight: bold;
    color: #e0e0f0;
    font-size: 0.95rem;
    line-height: 1.2;
  }

  .equip-effect {
    font-size: 0.8rem;
    color: #8a9a8a;
    line-height: 1.3;
  }

  .helper-level {
    align-self: flex-start;
    font-size: 0.7rem;
    font-weight: bold;
    background: rgba(100, 180, 255, 0.2);
    color: #8ac4ff;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
  }

  .building-level {
    align-self: flex-start;
    font-size: 0.7rem;
    font-weight: bold;
    background: rgba(201, 169, 89, 0.2);
    color: #c9a959;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
  }
</style>
