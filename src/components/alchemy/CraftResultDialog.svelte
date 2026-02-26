<script lang="ts">
  import { getItem } from '$lib/data/items';
  import AnimatedGauge from '../common/AnimatedGauge.svelte';
  import StampRush from '../common/StampRush.svelte';
  import type { CraftMultipleResult } from '$lib/services/alchemy';
  import type { GaugeData } from '$lib/models/types';

  export let result: CraftMultipleResult;
  export let recipeName: string;
  export let expGaugeData: GaugeData | null = null;
  export let reputationExpGaugeData: GaugeData | null = null;
  export let staminaGaugeData: GaugeData | null = null;
  export let onClose: () => void;

  $: allSuccess = result.failCount === 0 && result.successCount > 0;
  $: allFail = result.successCount === 0;
  $: mixed = result.successCount > 0 && result.failCount > 0;
  $: resultItemDef = result.items.length > 0 ? getItem(result.items[0].itemId) : null;
  $: firstQuality = result.items.length > 0 ? result.items[0].quality : 0;
  // 品質ランク判定
  function getQualityRank(q: number): { label: string; cssClass: string } {
    if (q >= 90) return { label: 'S', cssClass: 'rank-s' };
    if (q >= 70) return { label: 'A', cssClass: 'rank-a' };
    if (q >= 50) return { label: 'B', cssClass: 'rank-b' };
    if (q >= 30) return { label: 'C', cssClass: 'rank-c' };
    return { label: 'D', cssClass: 'rank-d' };
  }

  $: qualityRank = getQualityRank(firstQuality);

  // アニメーション段階制御
  let phase: 'brewing' | 'reveal' | 'done' = 'brewing';
  // マウント直後のクリックイベント伝搬を防止
  let mounted = false;

  import { onMount } from 'svelte';
  import { skipPresentation } from '$lib/stores/game';

  function onVideoEnded() {
    phase = 'reveal';
    setTimeout(() => {
      phase = 'done';
      mounted = true;
    }, 600);
  }

  function skipVideo() {
    if (phase !== 'brewing') return;
    onVideoEnded();
  }

  onMount(() => {
    // 演出スキップ時は動画をスキップして即座に結果表示
    if ($skipPresentation) {
      onVideoEnded();
      return;
    }

    // マウント後に少し遅延してからクリック受付開始
    const mountGuard = setTimeout(() => {
      // brewingフェーズ中はスキップ可能にするためmountedを立てる
      if (phase === 'brewing') mounted = true;
    }, 500);

    return () => {
      clearTimeout(mountGuard);
    };
  });

  function canClose(): boolean {
    return phase === 'done' && mounted;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      if (phase === 'brewing' && mounted) {
        skipVideo();
      } else if (canClose()) {
        onClose();
      }
    }
  }

  function handleOverlayClick(event: MouseEvent) {
    if (phase === 'brewing' && mounted) {
      skipVideo();
    } else if (canClose()) {
      onClose();
    }
  }

  function handleBoxClick(event: MouseEvent) {
    event.stopPropagation();
    if (canClose()) {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="dialog-overlay" class:clickable={phase === 'done' && mounted} on:click={handleOverlayClick} role="button" tabindex="-1">
  <!-- 醸造中: 動画 -->
  {#if phase === 'brewing'}
    <div class="brewing-effect">
      <!-- svelte-ignore a11y_media_has_caption -->
      <video class="craft-video" autoplay muted on:ended={onVideoEnded}>
        <source src="/movies/craft.mp4" type="video/mp4" />
      </video>
      <p class="brewing-text">調合中...</p>
      <p class="skip-hint" class:visible={mounted}>クリック または Enter でスキップ</p>
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
          <StampRush
            items={[{ itemId: resultItemDef.id, quantity: result.successCount }]}
            active={phase !== 'brewing'}
          />

          <!-- 情報を横並び -->
          <div class="item-info-row">
            {#if result.isNewDiscovery}
              <span class="new-album-badge">NEW</span>
            {/if}
            <span class="item-name">{resultItemDef.name}</span>
            <span class="info-sep"></span>
            <span class="quality-label">品質</span>
            <span class="quality-value {qualityRank.cssClass}">{result.items[0].quality}</span>
            <span class="quality-rank {qualityRank.cssClass}">{qualityRank.label}</span>
          </div>
        </div>

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
            segments={expGaugeData.segments}
          />
        {:else}
          <div class="exp-row">
            <span class="exp-label">獲得経験値</span>
            <span class="exp-value">+{result.totalExpGained} Exp</span>
          </div>
        {/if}
        {#if reputationExpGaugeData}
          <AnimatedGauge
            before={reputationExpGaugeData.before}
            after={reputationExpGaugeData.after}
            max={reputationExpGaugeData.max}
            label={reputationExpGaugeData.label}
            text="+{result.totalReputationExpGained} 名声Exp"
            color="green"
            segments={reputationExpGaugeData.segments}
            subtext={reputationExpGaugeData.subtext ?? ''}
          />
        {:else if result.totalReputationExpGained > 0}
          <div class="exp-row">
            <span class="exp-label">名声経験値</span>
            <span class="exp-value">+{result.totalReputationExpGained} 名声Exp</span>
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
      <div class="dialog-footer" class:visible={phase === 'done'}>
        <span class="hint-text">クリック または Enter で閉じる</span>
      </div>
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



  /* === 醸造中: 動画 === */
  .brewing-effect {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .craft-video {
    max-width: 480px;
    width: 90vw;
    border-radius: 12px;
    box-shadow: 0 0 40px rgba(201, 169, 89, 0.2);
  }

  .skip-hint {
    font-size: 0.85rem;
    color: #6a6a8a;
    visibility: hidden;
  }

  .skip-hint.visible {
    visibility: visible;
  }

  .brewing-text {
    color: #c9a959;
    font-size: 1.2rem;
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
    margin-bottom: 1rem;
    position: relative;
  }


  /* === 2段目: 情報横並び === */
  .item-info-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    animation: fadeUp 0.3s ease-out 0.4s both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* === 新規アルバム登録バッジ === */
  .new-album-badge {
    display: inline-block;
    padding: 0.15rem 0.45rem;
    font-size: 0.7rem;
    font-weight: bold;
    color: #fff;
    background: linear-gradient(135deg, #6a4c93 0%, #9b59b6 50%, #6a4c93 100%);
    border: 1px solid #b07cd8;
    border-radius: 3px;
    box-shadow: 0 0 8px rgba(155, 89, 182, 0.5);
    animation: albumBadgeAppear 0.5s ease-out 0.3s both;
    letter-spacing: 0.05em;
  }

  @keyframes albumBadgeAppear {
    0% { opacity: 0; transform: scale(0.5); }
    60% { transform: scale(1.1); }
    100% { opacity: 1; transform: scale(1); }
  }

  .item-name {
    font-size: 1.25rem;
    font-weight: bold;
    color: #f4e4bc;
  }

  .info-sep {
    width: 1px;
    height: 1.2em;
    background: rgba(255, 255, 255, 0.15);
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
    border-top: 1px solid transparent;
    visibility: hidden;
  }

  .dialog-footer.visible {
    border-top-color: #4a4a6a;
    visibility: visible;
    animation: fadeUp 0.3s ease-out;
  }

  .hint-text {
    font-size: 0.85rem;
    color: #6a6a8a;
  }
</style>
