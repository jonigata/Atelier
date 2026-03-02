<script lang="ts" context="module">
  // モジュールレベル変数：コンポーネント再マウントでもリセットされない
  let lastShopDealWeekSeen = 0;
</script>

<script lang="ts">
  import { gameState, addMessage, addMoney, addItem, addBook } from '$lib/stores/game';
  import { addSalesAmount } from '$lib/stores/stats';
  import { items, getItem, getItemIcon, handleIconError } from '$lib/data/items';
  import { getAllEquipment, getEquipment, getEquipmentIcon } from '$lib/data/equipment';
  import { getShopBooks } from '$lib/data/books';
  import { removeItemFromInventory } from '$lib/services/inventory';
  import { SHOP, SHOP_DEALS } from '$lib/data/balance';
  import { shopFlavors, pickRandom } from '$lib/data/flavorTexts';
  import { getSellPriceMult, getBuyPriceMult, recordSell } from '$lib/services/equipmentEffects';
  import { getBargainItems, getPremiumPurchaseItems } from '$lib/services/shopDeals';
  import { getWeek, getDaysLeftInWeek } from '$lib/services/calendar';
  import type { OwnedItem, ItemDef, EquipmentDef } from '$lib/models/types';
  import { isCraftedCategory } from '$lib/data/categories';
  import ActiveEquipmentIcons from './common/ActiveEquipmentIcons.svelte';

  export let onBack: () => void;

  type Tab = 'buy' | 'sell' | 'parttime';
  let activeTab: Tab = 'buy';

  import { villageLevel, reputationLevel } from '$lib/stores/game';
  import { endTurn } from '$lib/services/gameLoop';
  import { showDialogueAndWait } from '$lib/services/presentation';

  // 村発展レベルに応じた購入可能アイテム
  $: buyableItems = getBuyableItems($villageLevel);

  // 週替わり特売
  $: bargainItemIds = getBargainItems($gameState.day, $villageLevel);
  $: premiumItemIds = getPremiumPurchaseItems($gameState.day, $villageLevel);
  $: dealsRemaining = getDaysLeftInWeek($gameState.day);

  // 週初回訪問でメルダのトークを表示
  $: currentWeek = getWeek($gameState.day);
  let showDealsTalk = false;
  $: {
    if (currentWeek !== lastShopDealWeekSeen) {
      showDealsTalk = true;
      lastShopDealWeekSeen = currentWeek;
    }
  }

  function dismissDealsTalk() {
    showDealsTalk = false;
  }

  // メルダのセリフを組み立て
  $: dealsTalkText = (() => {
    const parts: string[] = [];
    if (bargainItemIds.length > 0) {
      const names = bargainItemIds.map(id => getItem(id)?.name).filter(Boolean);
      parts.push(`${names.join('・')}がお安くなってるわよ！`);
    }
    if (premiumItemIds.length > 0) {
      const names = premiumItemIds.map(id => getItem(id)?.name).filter(Boolean);
      parts.push(`${names.join('・')}は高く買い取るからね！`);
    }
    if (parts.length === 0) return '';
    return `あらコレットちゃん！今週は${parts.join(' あと')}`;
  })();

  // 村発展レベルに応じた購入可能レシピ本（未所持のみ）
  $: buyableBooks = getShopBooks($villageLevel)
    .filter(book => !$gameState.ownedBooks.includes(book.id));

  // ショップ機材ラインナップの初期化
  $: if ($gameState.shopEquipment.length === 0) {
    initShopEquipment();
  }

  $: shopEquipmentList = $gameState.shopEquipment
    .map((slot) => ({ slot, def: getEquipment(slot.id) }))
    .filter((e): e is { slot: typeof e.slot; def: EquipmentDef } => e.def !== undefined);

  function initShopEquipment() {
    const all = getAllEquipment();
    const unowned = all.filter((e) => !$gameState.ownedEquipment.includes(e.id));
    // シャッフルして3つ選出
    const shuffled = [...unowned].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    if (selected.length === 0) return;
    gameState.update((s) => ({
      ...s,
      shopEquipment: selected.map((e) => ({ id: e.id, purchased: false })),
    }));
  }

  function getBuyableItems(villageLv: number): ItemDef[] {
    const allMaterials = Object.values(items).filter(
      (item) => !isCraftedCategory(item.category)
    );

    return allMaterials.filter((item) => {
      // Lv1: 基本素材＋序盤レシピ素材（油草の実、麻繊維、魔木の枝）
      if (villageLv <= 1) {
        return ['herb_01', 'water_01', 'oil_seed', 'hemp_fiber', 'magic_wood'].includes(item.id);
      }
      // Lv2-3: 中級素材追加（毒消し草、鉄鉱石）
      if (villageLv <= 3) {
        return ['herb_01', 'herb_02', 'water_01', 'ore_01', 'oil_seed', 'hemp_fiber', 'magic_wood'].includes(item.id);
      }
      // Lv4-6: さらに拡大（獣の皮）
      if (villageLv <= 6) {
        return ['herb_01', 'herb_02', 'water_01', 'ore_01', 'misc_01', 'oil_seed', 'hemp_fiber', 'magic_wood'].includes(item.id);
      }
      // Lv7+: レア素材も購入可能
      return true;
    });
  }

  // 購入処理（機材効果: 購入割引適用）
  function buyItem(item: ItemDef, bargainRate: number = 1) {
    buyItemMultiple(item, 1, bargainRate);
  }

  function buyItemMultiple(item: ItemDef, count: number, bargainRate: number = 1) {
    const buyMult = getBuyPriceMult();
    const unitPrice = Math.max(1, Math.floor(item.basePrice * buyMult * bargainRate));
    const totalCost = unitPrice * count;
    if ($gameState.money < totalCost) {
      addMessage(`所持金が足りません（必要: ${totalCost}G）`);
      return;
    }

    addMoney(-totalCost);
    for (let i = 0; i < count; i++) {
      const quality = Math.floor(Math.random() * 31) + 40;
      addItem({
        itemId: item.id,
        quality,
        origin: {
          type: 'shop',
          day: $gameState.day,
          flavorText: pickRandom(shopFlavors),
        },
      });
    }

    if (count === 1) {
      addMessage(`${item.name}を${totalCost}Gで購入しました`);
    } else {
      addMessage(`${item.name}×${count}を${totalCost}Gで購入しました`);
    }
  }

  // 機材購入処理
  function buyEquipment(slotIndex: number) {
    const slot = $gameState.shopEquipment[slotIndex];
    if (!slot || slot.purchased) return;

    const equipDef = getEquipment(slot.id);
    if (!equipDef) return;

    if ($gameState.money < equipDef.price) {
      addMessage(`所持金が足りません（必要: ${equipDef.price}G）`);
      return;
    }

    if ($gameState.ownedEquipment.includes(slot.id)) {
      addMessage(`${equipDef.name}は既に所持しています`);
      return;
    }

    addMoney(-equipDef.price);
    gameState.update((s) => ({
      ...s,
      ownedEquipment: [...s.ownedEquipment, slot.id],
      shopEquipment: s.shopEquipment.map((sl, i) =>
        i === slotIndex ? { ...sl, purchased: true } : sl,
      ),
    }));
    addMessage(`機材「${equipDef.name}」を購入した！`);
  }

  // レシピ本購入処理
  function buyBook(bookId: string, name: string, price: number) {
    if ($gameState.money < price) {
      addMessage(`所持金が足りません（必要: ${price}G）`);
      return;
    }
    if ($gameState.ownedBooks.includes(bookId)) {
      addMessage(`「${name}」は既に所持しています`);
      return;
    }
    addMoney(-price);
    addBook(bookId);
    addMessage(`レシピ本「${name}」を${price}Gで購入しました！勉強で読むとレシピを習得できます。`);
  }

  // 売却処理（機材効果: 売却価格補正適用 + 高価買取）
  function sellItem(item: OwnedItem) {
    const def = getItem(item.itemId);
    if (!def) return;

    // 売却価格 = 基本価格 × (品質 / 50) × 売却係数 × 機材効果 × 高価買取
    const basePrice = Math.floor(def.basePrice * (item.quality / 50) * SHOP.SELL_PRICE_RATE);
    const premiumMult = premiumItemIds.includes(item.itemId) ? SHOP_DEALS.PREMIUM_MULTIPLIER : 1;
    const price = Math.max(1, Math.floor(basePrice * getSellPriceMult(item) * premiumMult));

    // インベントリから削除
    gameState.update((state) => ({
      ...state,
      inventory: removeItemFromInventory(state.inventory, item.itemId, item.quality),
    }));

    addMoney(price);
    addSalesAmount(price);
    recordSell();
    addMessage(`${def.name}（品質${item.quality}）を${price}Gで売却しました`);
  }

  function sellItemMultiple(itemsToSell: OwnedItem[], count: number) {
    const sorted = [...itemsToSell].sort((a, b) => a.quality - b.quality);
    const targets = sorted.slice(0, count);
    if (targets.length === 0) return;
    const def = getItem(targets[0].itemId);
    if (!def) return;

    let totalPrice = 0;
    const premiumMult = premiumItemIds.includes(targets[0].itemId) ? SHOP_DEALS.PREMIUM_MULTIPLIER : 1;
    for (const item of targets) {
      const basePrice = Math.floor(def.basePrice * (item.quality / 50) * SHOP.SELL_PRICE_RATE);
      const price = Math.max(1, Math.floor(basePrice * getSellPriceMult(item) * premiumMult));
      gameState.update((state) => ({
        ...state,
        inventory: removeItemFromInventory(state.inventory, item.itemId, item.quality),
      }));
      addMoney(price);
      addSalesAmount(price);
      recordSell();
      totalPrice += price;
    }

    if (targets.length === 1) {
      addMessage(`${def.name}（品質${targets[0].quality}）を${totalPrice}Gで売却しました`);
    } else {
      addMessage(`${def.name}×${targets.length}を${totalPrice}Gで売却しました`);
    }
  }

  // インベントリをアイテムIDでグループ化
  $: groupedInventory = $gameState.inventory.reduce(
    (acc, item) => {
      const key = item.itemId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, OwnedItem[]>
  );

  // アルバイト
  $: partTimeEarnings = 100 + $reputationLevel * 10;
  let partTimeProcessing = false;

  async function executePartTimeJob() {
    if (partTimeProcessing) return;
    partTimeProcessing = true;

    addMoney(partTimeEarnings);
    addMessage(`アルバイトで${partTimeEarnings}Gを稼ぎました。`);

    await showDialogueAndWait({
      characterName: 'メルダ',
      characterTitle: '雑貨屋の店主',
      characterFaceId: 'melda',
      eventImage: '/images/events/part_time.png',
      lines: [
        { text: `今日もありがとね！ はい、${partTimeEarnings}Gのお給料よ`, expression: 'happy' },
      ],
    });

    const turnPromise = endTurn(1);
    await new Promise(r => setTimeout(r, 350));
    partTimeProcessing = false;
    onBack();
    await turnPromise;
  }

  function getSellPrice(item: OwnedItem): number {
    const def = getItem(item.itemId);
    if (!def) return 0;
    const basePrice = Math.floor(def.basePrice * (item.quality / 50) * SHOP.SELL_PRICE_RATE);
    const premiumMult = premiumItemIds.includes(item.itemId) ? SHOP_DEALS.PREMIUM_MULTIPLIER : 1;
    return Math.max(1, Math.floor(basePrice * getSellPriceMult(item) * premiumMult));
  }
</script>

<div class="shop-panel">
  <div class="shop-header">
    <button class="back-btn" on:click={onBack}>← 戻る</button>
    <h2>🏪 ショップ <ActiveEquipmentIcons prefixes={['sell_', 'buy_']} /></h2>

    <div class="money-display">
      所持金: <span class="amount">{$gameState.money.toLocaleString()}G</span>
    </div>

    <div class="tabs">
      <button
        class="tab"
        class:active={activeTab === 'buy'}
        on:click={() => (activeTab = 'buy')}
      >
        購入
      </button>
      <button
        class="tab"
        class:active={activeTab === 'sell'}
        on:click={() => (activeTab = 'sell')}
      >
        売却
      </button>
      <button
        class="tab"
        class:active={activeTab === 'parttime'}
        on:click={() => (activeTab = 'parttime')}
      >
        アルバイト
      </button>
    </div>
  </div>

  <div class="shop-content">
  {#if showDealsTalk && dealsTalkText}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="deals-talk" on:click={dismissDealsTalk}>
      <img
        class="deals-talk-face"
        src="/images/characters/melda/melda-face-happy.png"
        alt="メルダ"
      />
      <div class="deals-talk-bubble">
        <span class="deals-talk-name">メルダ</span>
        <span class="deals-talk-text">{dealsTalkText}</span>
      </div>
      <span class="deals-talk-dismiss">click</span>
    </div>
  {/if}

  {#if activeTab === 'buy'}
    {#if bargainItemIds.length > 0}
      <div class="deals-banner bargain-banner">
        <span class="deals-icon bargain-icon">SALE</span>
        今週のバーゲン：対象素材が半額！
        <span class="deals-remaining">残り{dealsRemaining}日</span>
      </div>
    {/if}
    <div class="item-list">
      {#each buyableItems as item}
        {@const isBargain = bargainItemIds.includes(item.id)}
        {@const buyMult = getBuyPriceMult()}
        {@const normalPrice = Math.max(1, Math.floor(item.basePrice * buyMult))}
        {@const displayPrice = isBargain ? Math.max(1, Math.floor(normalPrice * SHOP_DEALS.BARGAIN_DISCOUNT)) : normalPrice}
        {@const canBuy = $gameState.money >= displayPrice}
        {@const canBuy10 = $gameState.money >= displayPrice * 10}
        {@const ownedCount = $gameState.inventory.filter(i => i.itemId === item.id).length}
        {@const bargainRate = isBargain ? SHOP_DEALS.BARGAIN_DISCOUNT : 1}
        <div class="shop-item" class:disabled={!canBuy} class:bargain-item={isBargain}>
          <img class="item-icon" src={getItemIcon(item.id)} alt={item.name} on:error={handleIconError} />
          <div class="item-info">
            <span class="item-name">
              {item.name}
              {#if isBargain}<span class="sale-badge">SALE</span>{/if}
              <span class="owned-count">所持 {ownedCount}</span>
            </span>
            <span class="item-desc">{item.description}</span>
          </div>
          <div class="item-action">
            {#if isBargain}
              <span class="item-price original-price">{normalPrice}G</span>
              <span class="item-price sale-price">{displayPrice}G</span>
            {:else}
              <span class="item-price">{displayPrice}G{buyMult < 1 ? ' (割引)' : ''}</span>
            {/if}
            <button
              class="buy-btn"
              disabled={!canBuy}
              on:click={() => buyItem(item, bargainRate)}
            >
              購入
            </button>
            <button
              class="buy-btn"
              disabled={!canBuy10}
              on:click={() => buyItemMultiple(item, 10, bargainRate)}
            >
              ×10
            </button>
          </div>
        </div>
      {/each}

      {#if buyableBooks.length > 0}
        <h3 class="section-header">レシピ本</h3>
        {#each buyableBooks as book}
          {@const canBuy = $gameState.money >= book.basePrice}
          <div class="shop-item" class:disabled={!canBuy}>
            <span class="book-icon-lg">📖</span>
            <div class="item-info">
              <span class="item-name">{book.name}</span>
              <span class="item-desc">{book.description}</span>
              <span class="item-desc recipe-count">{book.recipeIds.length}種のレシピ収録</span>
            </div>
            <div class="item-action">
              <span class="item-price">{book.basePrice}G</span>
              <button
                class="buy-btn"
                disabled={!canBuy}
                on:click={() => buyBook(book.id, book.name, book.basePrice)}
              >
                購入
              </button>
            </div>
          </div>
        {/each}
      {/if}

      {#if shopEquipmentList.length > 0}
        <h3 class="section-header">機材</h3>
        <div class="equip-grid">
          {#each shopEquipmentList as { slot, def }, i}
            {@const owned = $gameState.ownedEquipment.includes(slot.id)}
            {@const canBuy = !slot.purchased && !owned && $gameState.money >= def.price}
            <div class="equip-card" class:disabled={!canBuy && !slot.purchased && !owned} class:purchased={slot.purchased || owned} class:rare={def.rarity === 'rare'}>
              <div class="equip-img-wrap">
                <img class="equip-card-icon" src={getEquipmentIcon(def.id)} alt={def.name} />
                <div class="equip-badge">機材</div>
                {#if def.rarity === 'rare'}
                  <span class="equip-rarity-tag">RARE</span>
                {/if}
              </div>
              <div class="equip-card-info">
                <span class="item-name">{def.name}</span>
                <span class="item-desc">{def.effectDescription}</span>
              </div>
              <div class="equip-card-action">
                {#if slot.purchased || owned}
                  <span class="sold-label">{owned && !slot.purchased ? '所持済' : '購入済'}</span>
                {:else}
                  <span class="item-price">{def.price.toLocaleString()}G</span>
                  <button
                    class="buy-btn"
                    disabled={!canBuy}
                    on:click={() => buyEquipment(i)}
                  >
                    購入
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

  {:else if activeTab === 'sell'}
    {#if premiumItemIds.length > 0}
      <div class="deals-banner premium-banner">
        <span class="deals-icon premium-icon">高価買取</span>
        <div class="deals-detail" style="flex:1">
          <span>今週の高価買取（1.5倍）</span>
          <div class="deals-items-row">
            {#each premiumItemIds as pid}
              {@const pdef = getItem(pid)}
              {#if pdef}
                <span class="deals-item-chip">
                  <img class="deals-item-icon" src={getItemIcon(pid)} alt={pdef.name} on:error={handleIconError} />
                  {pdef.name}
                </span>
              {/if}
            {/each}
          </div>
        </div>
        <span class="deals-remaining">残り{dealsRemaining}日</span>
      </div>
    {/if}
    <div class="item-list">
      {#if Object.keys(groupedInventory).length === 0}
        <p class="empty">売却できるアイテムがありません</p>
      {:else}
        {#each Object.entries(groupedInventory) as [itemId, items]}
          {@const def = getItem(itemId)}
          {@const isPremium = premiumItemIds.includes(itemId)}
          {#if def}
            <div class="sell-group" class:premium-group={isPremium}>
              <div class="sell-group-header">
                <img class="item-icon" src={getItemIcon(itemId)} alt={def.name} on:error={handleIconError} />
                <div class="sell-group-info">
                  <span class="item-name">
                    {def.name}
                    {#if isPremium}<span class="premium-badge">高価買取</span>{/if}
                  </span>
                  <span class="item-desc">{items.length}個所持</span>
                </div>
                {#if items.length > 1}
                  <button class="sell-bulk-btn" on:click={() => sellItemMultiple(items, 10)}>
                    ×10 まとめ売り
                  </button>
                {/if}
              </div>
              <div class="sell-cards">
                {#each items as item}
                  <div class="sell-card">
                    <span class="sell-card-quality" class:high={item.quality >= 70} class:low={item.quality < 30}>品質 {item.quality}</span>
                    <span class="sell-card-price">{getSellPrice(item)}G</span>
                    <button class="sell-btn" on:click={() => sellItem(item)}>売却</button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  {:else if activeTab === 'parttime'}
    <!-- アルバイト確認（タブ内埋め込み） -->
    <div class="parttime-confirm">
      <div class="parttime-confirm-body">
        <img class="parttime-confirm-face" src="/images/characters/melda/melda-face-happy.png" alt="メルダ" />
        <div class="parttime-confirm-text">
          <span class="parttime-confirm-name">メルダ</span>
          <span class="parttime-confirm-message">今日もお手伝いしてくれるの？ 報酬は{partTimeEarnings}Gよ。1日かかるけどどうする？</span>
        </div>
      </div>
      <div class="parttime-confirm-buttons">
        <button class="confirm-btn cancel" on:click={() => (activeTab = 'buy')}>やめとく</button>
        <button class="confirm-btn ok" on:click={executePartTimeJob} disabled={partTimeProcessing}>働く</button>
      </div>
    </div>
  {/if}

  </div>
</div>

<style>
  .shop-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .shop-header {
    flex-shrink: 0;
    padding: 1.5rem 1.5rem 0.5rem;
  }

  .shop-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 1.5rem 1.5rem;
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
    font-size: 1rem;
    color: #c9a959;
    margin: 0;
  }

  h4 {
    font-size: 1rem;
    color: #c9a959;
    margin-bottom: 0.5rem;
  }

  .money-display {
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    color: #e0e0f0;
    margin-bottom: 1rem;
  }

  .amount {
    font-size: 1.2rem;
    font-weight: bold;
    color: #c9a959;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0;
  }

  .tab {
    flex: 1;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid #4a4a6a;
    border-radius: 6px;
    color: #a0a0b0;
    cursor: pointer;
    font-size: 1rem;
  }

  .tab.active {
    border-color: #c9a959;
    color: #f4e4bc;
    background: rgba(201, 169, 89, 0.2);
  }

  .item-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-header {
    padding-top: 0.5rem;
    border-top: 1px solid #4a4a6a;
  }

  .shop-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
  }

  .equip-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  .equip-card {
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #ff980050;
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .equip-card:hover {
    border-color: #ff9800;
  }

  .equip-card.rare {
    border-color: rgba(232, 168, 64, 0.4);
  }

  .equip-card.disabled {
    opacity: 0.5;
  }

  .equip-card.purchased {
    opacity: 0.5;
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

  .equip-card-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .equip-rarity-tag {
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

  .equip-card-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.5rem 0.65rem;
  }

  .equip-card-action {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 0 0.65rem 0.65rem;
    margin-top: auto;
  }

  .book-icon-lg {
    font-size: 2rem;
    flex-shrink: 0;
    width: 48px;
    text-align: center;
  }

  .recipe-count {
    color: #c9a959;
    font-size: 0.8rem;
  }

  .item-icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .item-icon-small {
    width: 32px;
    height: 32px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .shop-item.disabled {
    opacity: 0.5;
  }

  .shop-item.purchased {
    opacity: 0.5;
  }

  .equip-badge {
    position: absolute;
    top: 6px;
    left: 6px;
    padding: 0.15rem 0.45rem;
    font-size: 0.65rem;
    font-weight: bold;
    border-radius: 3px;
    color: #1a1a2e;
    background: #ff9800;
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 0;
  }

  .item-name {
    color: #e0e0f0;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .owned-count {
    font-size: 0.75rem;
    font-weight: normal;
    color: #8a8a9a;
  }

  .item-desc {
    color: #808090;
    font-size: 0.85rem;
  }

  .item-action {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .item-price {
    color: #c9a959;
    font-weight: bold;
    white-space: nowrap;
  }

  .buy-btn, .sell-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 2rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 4px;
    color: #1a1a2e;
    font-weight: bold;
    cursor: pointer;
  }

  .buy-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .buy-btn:hover:not(:disabled), .sell-btn:hover {
    transform: translateY(-1px);
  }

  .sold-label {
    color: #9e9e9e;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .empty {
    color: #808090;
    text-align: center;
    padding: 2rem;
  }

  /* 売却グループ */
  .sell-group {
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid transparent;
    border-radius: 6px;
  }

  .sell-group-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .sell-group-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1;
    min-width: 0;
  }

  .sell-bulk-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.35rem 0.75rem;
    white-space: nowrap;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 4px;
    color: #1a1a2e;
    font-weight: bold;
    font-size: 0.8rem;
    cursor: pointer;
    flex-shrink: 0;
  }

  .sell-bulk-btn:hover {
    transform: translateY(-1px);
  }

  .sell-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.4rem;
  }

  .sell-card {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid #3a3a5a;
    border-radius: 4px;
  }

  .sell-card-quality {
    color: #a0a0b0;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .sell-card-quality.high {
    color: #81c784;
  }

  .sell-card-quality.low {
    color: #ff6b6b;
  }

  .sell-card-price {
    color: #81c784;
    font-weight: bold;
    margin-left: auto;
    white-space: nowrap;
  }

  /* メルダのトーク */
  .deals-talk {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    margin-bottom: 0.75rem;
    background: rgba(30, 30, 50, 0.85);
    border: 1px solid rgba(201, 169, 89, 0.4);
    border-radius: 8px;
    cursor: pointer;
    animation: deals-talk-in 0.3s ease-out;
  }

  @keyframes deals-talk-in {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .deals-talk-face {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    object-fit: cover;
    border-radius: 50%;
    border: 2px solid rgba(201, 169, 89, 0.4);
  }

  .deals-talk-bubble {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    background: rgba(40, 40, 65, 0.9);
    border: 1px solid rgba(201, 169, 89, 0.3);
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    flex: 1;
  }

  .deals-talk-bubble::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 8px solid rgba(201, 169, 89, 0.3);
  }

  .deals-talk-bubble::after {
    content: '';
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 7px solid rgba(40, 40, 65, 0.9);
  }

  .deals-talk-name {
    font-size: 0.7rem;
    color: #c9a959;
    font-weight: bold;
  }

  .deals-talk-text {
    color: #e8dcc8;
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .deals-talk-dismiss {
    font-size: 0.65rem;
    color: #808090;
    align-self: flex-end;
    flex-shrink: 0;
  }

  /* バーゲン＆高価買取 */
  .deals-banner {
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    margin-bottom: 0.75rem;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .bargain-banner {
    background: rgba(255, 50, 50, 0.12);
    border: 1px solid rgba(255, 100, 100, 0.3);
    color: #ff8a8a;
  }

  .premium-banner {
    background: rgba(50, 200, 50, 0.12);
    border: 1px solid rgba(100, 200, 100, 0.3);
    color: #81c784;
  }

  .deals-icon {
    font-weight: bold;
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    white-space: nowrap;
  }

  .deals-remaining {
    margin-left: auto;
    font-size: 0.8rem;
    opacity: 0.7;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .bargain-icon {
    background: #d32f2f;
    color: white;
  }

  .premium-icon {
    background: #388e3c;
    color: white;
  }

  .deals-detail {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .deals-items-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .deals-item-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
    background: rgba(255, 255, 255, 0.08);
    padding: 0.15rem 0.5rem 0.15rem 0.25rem;
    border-radius: 4px;
  }

  .deals-item-icon {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }

  .sale-badge {
    font-size: 0.65rem;
    font-weight: bold;
    background: #d32f2f;
    color: white;
    padding: 0.05rem 0.3rem;
    border-radius: 3px;
    margin-left: 0.25rem;
  }

  .premium-badge {
    font-size: 0.65rem;
    font-weight: bold;
    background: #388e3c;
    color: white;
    padding: 0.05rem 0.3rem;
    border-radius: 3px;
    margin-left: 0.5rem;
  }

  .original-price {
    text-decoration: line-through;
    color: #808090;
    font-size: 0.8rem;
    font-weight: normal;
  }

  .sale-price {
    color: #ff6666 !important;
  }

  .bargain-item {
    border-color: rgba(255, 100, 100, 0.3);
  }

  .premium-group {
    border: 1px solid rgba(100, 200, 100, 0.3);
  }

  /* アルバイト確認（タブ内埋め込み） */
  .parttime-confirm {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid #4a4a6a;
    border-radius: 8px;
    padding: 1.25rem;
  }

  .parttime-confirm-body {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1.25rem;
  }

  .parttime-confirm-face {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border: 2px solid #8b7355;
    flex-shrink: 0;
  }

  .parttime-confirm-text {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1;
  }

  .parttime-confirm-name {
    font-size: 1.1rem;
    font-weight: bold;
    color: #c9a959;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid #4a4a6a;
  }

  .parttime-confirm-message {
    font-size: 1.05rem;
    line-height: 1.7;
    color: #e0e0f0;
  }

  .parttime-confirm-buttons {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .confirm-btn {
    flex: 1;
    max-width: 160px;
    padding: 0.7rem 1.5rem;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .confirm-btn:hover {
    transform: translateY(-1px);
  }

  .confirm-btn.ok {
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    color: #1a1a2e;
  }

  .confirm-btn.ok:hover {
    box-shadow: 0 2px 12px rgba(201, 169, 89, 0.4);
  }

  .confirm-btn.ok:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .confirm-btn.cancel {
    background: transparent;
    border: 1px solid #6a6a8a;
    color: #a0a0b0;
  }

  .confirm-btn.cancel:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: #8a8aaa;
    color: #c0c0d0;
  }
</style>
