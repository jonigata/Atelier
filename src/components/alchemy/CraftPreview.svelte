<script lang="ts">
  export let successRate: number;
  export let expectedQuality: { min: number; max: number } | null;
  export let craftQuantity: number;
  export let daysRequired: number;
  export let staminaCost: number;
  export let totalStaminaCost: number;
  export let currentStamina: number;
  export let fatiguePenalty: number;
  export let fatigueLabel: string | null;
  export let onCraft: () => void;

  $: maxStamina = 100;
  $: afterStamina = Math.max(0, currentStamina - totalStaminaCost);
  $: remainPct = (afterStamina / maxStamina) * 100;
  $: costPct = (Math.min(totalStaminaCost, currentStamina) / maxStamina) * 100;
</script>

<div class="craft-action">
  <p>素材の選択が完了しました。調合を開始しますか？</p>

  <div class="craft-preview">
    <div class="preview-item">
      <span class="preview-label">成功率</span>
      <span class="preview-value success-rate" class:high={successRate >= 0.8} class:low={successRate < 0.5}>
        {Math.round(successRate * 100)}%
      </span>
    </div>
    {#if expectedQuality}
      <div class="preview-item">
        <span class="preview-label">予想品質</span>
        <span class="preview-value quality">
          {expectedQuality.min} 〜 {expectedQuality.max}
        </span>
      </div>
    {/if}
  </div>

  <div class="stamina-info">
    <div class="stamina-row">
      <span class="stamina-label">体力</span>
      <div class="stamina-gauge-track">
        <div class="stamina-gauge-remain" style="width: {remainPct}%"></div>
        <div class="stamina-gauge-cost" style="left: {remainPct}%; width: {costPct}%"></div>
      </div>
      <span class="stamina-text">{currentStamina} → {afterStamina}</span>
    </div>
    {#if fatigueLabel}
      <div class="fatigue-warning">
        {fatigueLabel}: 成功率 -{Math.round(fatiguePenalty * 100)}%
      </div>
    {/if}
  </div>

  <button class="craft-btn" on:click={onCraft}>
    {craftQuantity}個 調合する ({daysRequired}日)
  </button>
</div>

<style>
  .craft-action {
    padding: 1.5rem;
    background: rgba(201, 169, 89, 0.1);
    border: 2px solid #c9a959;
    border-radius: 8px;
    text-align: center;
  }

  .craft-action p {
    color: #e0e0f0;
    margin-bottom: 1rem;
  }

  .craft-btn {
    padding: 0.75rem 2rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 6px;
    color: #1a1a2e;
    font-weight: bold;
    font-size: 1.1rem;
    cursor: pointer;
  }

  .craft-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(201, 169, 89, 0.4);
  }

  .craft-preview {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin: 1rem 0;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
  }

  .preview-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .preview-label {
    font-size: 1rem;
    color: #a0a0b0;
  }

  .preview-value {
    font-size: 1.1rem;
    font-weight: bold;
  }

  .success-rate {
    color: #ffc107;
  }

  .success-rate.high {
    color: #81c784;
  }

  .success-rate.low {
    color: #ff6b6b;
  }

  .quality {
    color: #82b1ff;
  }

  .stamina-info {
    margin: 0.75rem 0;
    padding: 0.6rem 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
  }

  .stamina-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
  }

  .stamina-label {
    color: #a0a0b0;
    font-size: 0.85rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  .stamina-gauge-track {
    flex: 1;
    height: 14px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 7px;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .stamina-gauge-remain {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, #4a8a4a, #81c784);
    border-radius: 6px 0 0 6px;
  }

  .stamina-gauge-cost {
    position: absolute;
    top: 0;
    height: 100%;
    background: linear-gradient(90deg, #c04040, #ff6b6b);
    box-shadow: 0 0 6px rgba(255, 107, 107, 0.4);
  }

  .stamina-text {
    color: #e0e0f0;
    font-size: 0.85rem;
    font-weight: bold;
    flex-shrink: 0;
    white-space: nowrap;
  }


  .fatigue-warning {
    margin-top: 0.4rem;
    padding: 0.3rem 0.6rem;
    background: rgba(255, 107, 107, 0.15);
    border: 1px solid rgba(255, 107, 107, 0.4);
    border-radius: 4px;
    color: #ff6b6b;
    font-size: 1rem;
  }

</style>
