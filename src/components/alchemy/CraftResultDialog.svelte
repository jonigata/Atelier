<script lang="ts">
  import { getItem, getItemIcon, handleIconError } from '$lib/data/items';
  import AnimatedGauge from '../common/AnimatedGauge.svelte';
  import type { CraftMultipleResult } from '$lib/services/alchemy';

  export let result: CraftMultipleResult;
  export let recipeName: string;
  export let expGaugeData: { before: number; after: number; max: number; label: string } | null = null;
  export let staminaGaugeData: { before: number; after: number; max: number; label: string } | null = null;
  export let onClose: () => void;

  $: allSuccess = result.failCount === 0 && result.successCount > 0;
  $: allFail = result.successCount === 0;
  $: mixed = result.successCount > 0 && result.failCount > 0;
  $: resultItemDef = result.items.length > 0 ? getItem(result.items[0].itemId) : null;
  $: avgQuality = result.items.length > 0
    ? Math.round(result.items.reduce((sum, item) => sum + item.quality, 0) / result.items.length)
    : 0;
  // 品質ランク判定
  function getQualityRank(q: number): { label: string; cssClass: string } {
    if (q >= 90) return { label: 'S', cssClass: 'rank-s' };
    if (q >= 70) return { label: 'A', cssClass: 'rank-a' };
    if (q >= 50) return { label: 'B', cssClass: 'rank-b' };
    if (q >= 30) return { label: 'C', cssClass: 'rank-c' };
    return { label: 'D', cssClass: 'rank-d' };
  }

  $: qualityRank = getQualityRank(avgQuality);

  // アニメーション段階制御
  let phase: 'brewing' | 'reveal' | 'done' = 'brewing';
  // マウント直後のクリックイベント伝搬を防止
  let mounted = false;

  import { onMount } from 'svelte';

  onMount(() => {
    // マウント後に少し遅延してからクリック受付開始
    const mountGuard = setTimeout(() => {
      mounted = true;
    }, 50);

    // 醸造エフェクト → 結果表示
    const timer1 = setTimeout(() => {
      phase = 'reveal';
    }, 800);

    const timer2 = setTimeout(() => {
      phase = 'done';
    }, 1400);

    return () => {
      clearTimeout(mountGuard);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  });

  function canClose(): boolean {
    return phase === 'done' && mounted;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!canClose()) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  }

  function handleOverlayClick(event: MouseEvent) {
    if (!canClose()) return;
    onClose();
  }

  function handleBoxClick(event: MouseEvent) {
    event.stopPropagation();
    if (!canClose()) return;
    onClose();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="dialog-overlay" class:clickable={phase === 'done' && mounted} on:click={handleOverlayClick} role="button" tabindex="-1">
  <!-- 醸造中エフェクト -->
  {#if phase === 'brewing'}
    <div class="brewing-effect">
      <div class="cauldron-glow" class:fail-glow={allFail}></div>
      <div class="bubble b1"></div>
      <div class="bubble b2"></div>
      <div class="bubble b3"></div>
      <div class="bubble b4"></div>
      <div class="bubble b5"></div>
      <p class="brewing-text">調合中...</p>
    </div>
  {/if}

  <!-- 結果ダイアログ -->
  {#if phase === 'reveal' || phase === 'done'}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="dialog-box"
      class:success={allSuccess}
      class:fail={allFail}
      class:mixed
      on:click={handleBoxClick}
      role="button"
      tabindex="-1"
    >
      <!-- ヘッダー -->
      <div class="dialog-header">
        {#if allFail}
          <span class="result-badge fail-badge">失敗</span>
        {:else if allSuccess}
          <span class="result-badge success-badge">成功!</span>
        {:else}
          <span class="result-badge mixed-badge">完了</span>
        {/if}
        <span class="recipe-name">{recipeName}</span>
      </div>

      <!-- 成功時: アイテム表示 -->
      {#if !allFail && resultItemDef}
        <div class="result-item-area">
          <!-- パーティクル -->
          {#if allSuccess}
            <div class="sparkle s1"></div>
            <div class="sparkle s2"></div>
            <div class="sparkle s3"></div>
            <div class="sparkle s4"></div>
            <div class="sparkle s5"></div>
            <div class="sparkle s6"></div>
          {/if}

          <div class="item-showcase" class:high-quality={avgQuality >= 70}>
            <img
              class="result-icon"
              src={getItemIcon(resultItemDef.id)}
              alt={resultItemDef.name}
              on:error={handleIconError}
            />
          </div>

          <div class="item-info">
            <span class="item-name">{resultItemDef.name}</span>
            {#if result.items.length === 1}
              <div class="quality-display">
                <span class="quality-label">品質</span>
                <span class="quality-value {qualityRank.cssClass}">{result.items[0].quality}</span>
                <span class="quality-rank {qualityRank.cssClass}">{qualityRank.label}</span>
              </div>
            {:else}
              <div class="quality-display">
                <span class="quality-label">平均品質</span>
                <span class="quality-value {qualityRank.cssClass}">{avgQuality}</span>
                <span class="quality-rank {qualityRank.cssClass}">{qualityRank.label}</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- 複数個の場合: アイテム一覧 -->
        {#if result.items.length > 1}
          <div class="items-grid">
            {#each result.items as item, i}
              <div class="grid-item" style="animation-delay: {i * 0.08}s">
                <img
                  class="grid-icon"
                  src={getItemIcon(item.itemId)}
                  alt={getItem(item.itemId)?.name}
                  on:error={handleIconError}
                />
                <span class="grid-quality" class:high={item.quality >= 70} class:low={item.quality < 30}>
                  {item.quality}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      {/if}

      <!-- 失敗時 -->
      {#if allFail}
        <div class="fail-area">
          <div class="fail-icon-wrap">
            <span class="fail-smoke"></span>
            <span class="fail-x">X</span>
          </div>
          <p class="fail-message">
            {#if result.failCount === 1}
              調合に失敗しました...
            {:else}
              {result.failCount}回すべて失敗しました...
            {/if}
          </p>
        </div>
      {/if}

      <!-- サマリー -->
      <div class="summary">
        {#if mixed}
          <div class="summary-row">
            <span class="summary-label">成功</span>
            <span class="summary-value success-text">{result.successCount}個</span>
            <span class="summary-sep">/</span>
            <span class="summary-label">失敗</span>
            <span class="summary-value fail-text">{result.failCount}個</span>
          </div>
        {:else if allSuccess && result.successCount > 1}
          <div class="summary-row">
            <span class="summary-label">作成数</span>
            <span class="summary-value success-text">{result.successCount}個</span>
          </div>
        {/if}
        {#if expGaugeData}
          <AnimatedGauge
            before={expGaugeData.before}
            after={expGaugeData.after}
            max={expGaugeData.max}
            label={expGaugeData.label}
            text="+{result.totalExpGained} Exp"
            color="blue"
          />
        {:else}
          <div class="exp-row">
            <span class="exp-label">獲得経験値</span>
            <span class="exp-value">+{result.totalExpGained} Exp</span>
          </div>
        {/if}
        {#if staminaGaugeData}
          <AnimatedGauge
            before={staminaGaugeData.before}
            after={staminaGaugeData.after}
            max={staminaGaugeData.max}
            label={staminaGaugeData.label}
            text="-{staminaGaugeData.before - staminaGaugeData.after}"
            color="orange"
          />
        {/if}
      </div>

      <!-- フッター -->
      {#if phase === 'done'}
        <div class="dialog-footer">
          <span class="hint-text">クリック または Enter で閉じる</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    user-select: none;
  }

  .dialog-overlay.clickable {
    cursor: pointer;
  }



  /* === 醸造中エフェクト === */
  .brewing-effect {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .cauldron-glow {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(201, 169, 89, 0.6) 0%, rgba(201, 169, 89, 0) 70%);
    animation: pulse 0.6s ease-in-out infinite alternate;
  }

  .cauldron-glow.fail-glow {
    background: radial-gradient(circle, rgba(180, 80, 80, 0.6) 0%, rgba(180, 80, 80, 0) 70%);
  }

  @keyframes pulse {
    from { transform: scale(0.8); opacity: 0.5; }
    to { transform: scale(1.2); opacity: 1; }
  }

  .bubble {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(201, 169, 89, 0.5);
    animation: bubbleUp 0.8s ease-out infinite;
  }

  .b1 { left: 45%; animation-delay: 0s; }
  .b2 { left: 55%; animation-delay: 0.15s; }
  .b3 { left: 40%; animation-delay: 0.3s; width: 8px; height: 8px; }
  .b4 { left: 60%; animation-delay: 0.45s; width: 10px; height: 10px; }
  .b5 { left: 50%; animation-delay: 0.6s; width: 6px; height: 6px; }

  @keyframes bubbleUp {
    0% { transform: translateY(0); opacity: 0.8; }
    100% { transform: translateY(-80px); opacity: 0; }
  }

  .brewing-text {
    color: #c9a959;
    font-size: 1.2rem;
    margin-top: 1rem;
    animation: textPulse 0.6s ease-in-out infinite alternate;
  }

  @keyframes textPulse {
    from { opacity: 0.5; }
    to { opacity: 1; }
  }

  /* === ダイアログボックス === */
  .dialog-box {
    background: linear-gradient(180deg, #2a2a3e 0%, #1a1a2e 100%);
    border: 3px solid #4a4a6a;
    border-radius: 16px;
    padding: 2rem;
    max-width: 420px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    animation: resultReveal 0.5s ease-out;
  }

  .dialog-box.success {
    border-color: #c9a959;
    box-shadow:
      0 0 40px rgba(201, 169, 89, 0.3),
      0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .dialog-box.fail {
    border-color: #6a3a3a;
    box-shadow:
      0 0 20px rgba(150, 50, 50, 0.2),
      0 8px 32px rgba(0, 0, 0, 0.5);
    animation: resultReveal 0.5s ease-out, shake 0.4s ease-out 0.1s;
  }

  .dialog-box.mixed {
    border-color: #8b7355;
    box-shadow:
      0 0 30px rgba(139, 115, 85, 0.3),
      0 8px 32px rgba(0, 0, 0, 0.5);
  }

  @keyframes resultReveal {
    0% { opacity: 0; transform: scale(0.8) translateY(20px); }
    60% { transform: scale(1.02) translateY(-5px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }

  /* === ヘッダー === */
  .dialog-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  }

  .result-badge {
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: bold;
  }

  .success-badge {
    background: linear-gradient(135deg, #8b7355 0%, #c9a959 50%, #8b7355 100%);
    color: #1a1a2e;
  }

  .fail-badge {
    background: linear-gradient(135deg, #6a3030 0%, #a04040 50%, #6a3030 100%);
    color: #ffd0d0;
  }

  .mixed-badge {
    background: linear-gradient(135deg, #5a5a3a 0%, #8b8355 50%, #5a5a3a 100%);
    color: #1a1a2e;
  }

  .recipe-name {
    font-size: 1.3rem;
    font-weight: bold;
    color: #f4e4bc;
  }

  /* === 成功時アイテム表示 === */
  .result-item-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1.5rem;
    position: relative;
  }

  .item-showcase {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    border: 2px solid #4a4a6a;
    border-radius: 12px;
    margin-bottom: 0.75rem;
    animation: itemAppear 0.4s ease-out 0.2s both;
  }

  .item-showcase.high-quality {
    border-color: #c9a959;
    box-shadow: 0 0 20px rgba(201, 169, 89, 0.4);
  }

  @keyframes itemAppear {
    0% { opacity: 0; transform: scale(0.5); }
    70% { transform: scale(1.1); }
    100% { opacity: 1; transform: scale(1); }
  }

  .result-icon {
    width: 56px;
    height: 56px;
    object-fit: contain;
  }

  .item-info {
    text-align: center;
    animation: fadeUp 0.3s ease-out 0.4s both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .item-name {
    display: block;
    font-size: 1.2rem;
    font-weight: bold;
    color: #f4e4bc;
    margin-bottom: 0.5rem;
  }

  .quality-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .quality-label {
    font-size: 0.85rem;
    color: #a0a0b0;
  }

  .quality-value {
    font-size: 1.4rem;
    font-weight: bold;
  }

  .quality-rank {
    font-size: 1.1rem;
    font-weight: bold;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    border: 1px solid currentColor;
  }

  .rank-s { color: #ffd700; }
  .rank-a { color: #81c784; }
  .rank-b { color: #82b1ff; }
  .rank-c { color: #e0e0f0; }
  .rank-d { color: #a0a0b0; }

  /* === パーティクル === */
  .sparkle {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ffd700;
    animation: sparkleAnim 1.2s ease-out infinite;
    pointer-events: none;
  }

  .s1 { top: 10%; left: 20%; animation-delay: 0s; }
  .s2 { top: 5%; right: 25%; animation-delay: 0.2s; }
  .s3 { top: 40%; left: 10%; animation-delay: 0.4s; }
  .s4 { top: 35%; right: 10%; animation-delay: 0.6s; }
  .s5 { top: 60%; left: 25%; animation-delay: 0.3s; width: 4px; height: 4px; }
  .s6 { top: 55%; right: 20%; animation-delay: 0.5s; width: 4px; height: 4px; }

  @keyframes sparkleAnim {
    0% { opacity: 0; transform: scale(0) rotate(0deg); }
    30% { opacity: 1; transform: scale(1.5) rotate(180deg); }
    100% { opacity: 0; transform: scale(0) rotate(360deg); }
  }

  /* === 複数アイテムグリッド === */
  .items-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .grid-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.35rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    animation: gridItemPop 0.3s ease-out both;
  }

  @keyframes gridItemPop {
    from { opacity: 0; transform: scale(0.7); }
    to { opacity: 1; transform: scale(1); }
  }

  .grid-icon {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  .grid-quality {
    font-size: 0.75rem;
    font-weight: bold;
    color: #a0a0b0;
  }

  .grid-quality.high { color: #81c784; }
  .grid-quality.low { color: #ff6b6b; }

  /* === 失敗表示 === */
  .fail-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1.5rem;
  }

  .fail-icon-wrap {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    margin-bottom: 1rem;
  }

  .fail-smoke {
    position: absolute;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(100, 60, 60, 0.6) 0%, transparent 70%);
    animation: smokeExpand 1s ease-out;
  }

  @keyframes smokeExpand {
    from { transform: scale(0.5); opacity: 1; }
    to { transform: scale(1.5); opacity: 0.3; }
  }

  .fail-x {
    font-size: 2.5rem;
    font-weight: bold;
    color: #ff6b6b;
    z-index: 1;
    animation: failX 0.4s ease-out 0.2s both;
  }

  @keyframes failX {
    0% { opacity: 0; transform: scale(2) rotate(-15deg); }
    70% { transform: scale(0.9) rotate(3deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }

  .fail-message {
    font-size: 1.1rem;
    color: #ff8a80;
    text-align: center;
  }

  /* === サマリー === */
  .summary {
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .summary-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .summary-label {
    font-size: 0.85rem;
    color: #a0a0b0;
  }

  .summary-value {
    font-size: 1rem;
    font-weight: bold;
  }

  .summary-sep {
    color: #4a4a6a;
    margin: 0 0.25rem;
  }

  .success-text { color: #81c784; }
  .fail-text { color: #ff6b6b; }

  .exp-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .exp-label {
    font-size: 0.85rem;
    color: #a0a0b0;
  }

  .exp-value {
    font-size: 1.1rem;
    font-weight: bold;
    color: #ffc107;
  }


  /* === フッター === */
  .dialog-footer {
    text-align: center;
    padding-top: 0.75rem;
    border-top: 1px solid #4a4a6a;
    animation: fadeUp 0.3s ease-out;
  }

  .hint-text {
    font-size: 0.85rem;
    color: #6a6a8a;
  }
</style>
