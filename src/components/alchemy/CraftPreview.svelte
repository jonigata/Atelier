<script lang="ts">
  export let successRate: number;
  export let expectedQuality: { min: number; max: number } | null;
  export let craftQuantity: number;
  export let daysRequired: number;
  export let onCraft: () => void;
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
</style>
