<script lang="ts">
  import type { RecipeDef } from '$lib/models/types';
  import { getFacilityBonuses } from '$lib/services/facility';

  export let successRate: number;
  export let expectedQuality: { min: number; max: number } | null;
  export let craftQuantity: number;
  export let daysRequired: number;
  export let recipe: RecipeDef;
  export let staminaCost: number;
  export let totalStaminaCost: number;
  export let currentStamina: number;
  export let fatiguePenalty: number;
  export let fatigueLabel: string | null;
  export let onCraft: () => void;

  $: bonuses = getFacilityBonuses(recipe);
  $: hasBonuses = bonuses.successRateBonus > 0 || bonuses.qualityBonus > 0;
</script>

<div class="craft-action">
  <p>素材の選択が完了しました。調合を開始しますか？</p>

  <div class="craft-preview">
    <div class="preview-item">
      <span class="preview-label">成功率（1個あたり）</span>
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
      <span class="stamina-label">体力消費</span>
      <span class="stamina-value" class:over-budget={totalStaminaCost > currentStamina}>
        {staminaCost}{#if craftQuantity > 1} × {craftQuantity} = {totalStaminaCost}{/if}
      </span>
      <span class="stamina-current">（残り: {currentStamina}）</span>
    </div>
    {#if fatigueLabel}
      <div class="fatigue-warning">
        {fatigueLabel}: 成功率 -{Math.round(fatiguePenalty * 100)}%
      </div>
    {/if}
  </div>

  {#if hasBonuses}
    <div class="facility-bonuses">
      {#if bonuses.successRateBonus > 0}
        <span class="bonus-tag">成功率 +{Math.round(bonuses.successRateBonus * 100)}%</span>
      {/if}
      {#if bonuses.qualityBonus > 0}
        <span class="bonus-tag">品質 +{bonuses.qualityBonus}</span>
      {/if}
    </div>
  {/if}

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
    font-size: 0.85rem;
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

  .facility-bonuses {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .bonus-tag {
    padding: 0.2rem 0.6rem;
    background: rgba(76, 175, 80, 0.2);
    border: 1px solid #4caf50;
    border-radius: 4px;
    color: #81c784;
    font-size: 0.8rem;
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
    font-size: 0.9rem;
  }

  .stamina-label {
    color: #a0a0b0;
  }

  .stamina-value {
    color: #e0e0f0;
    font-weight: bold;
  }

  .stamina-value.over-budget {
    color: #ff9800;
  }

  .stamina-current {
    color: #808090;
    font-size: 0.85rem;
  }

  .fatigue-warning {
    margin-top: 0.4rem;
    padding: 0.3rem 0.6rem;
    background: rgba(255, 107, 107, 0.15);
    border: 1px solid rgba(255, 107, 107, 0.4);
    border-radius: 4px;
    color: #ff6b6b;
    font-size: 0.8rem;
  }
</style>
