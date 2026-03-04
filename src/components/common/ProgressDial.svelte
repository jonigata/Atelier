<script lang="ts">
  export let value: number = 0; // 0-100%
  export let label: string = '';
  export let level: number = 1;
  export let color: string = '#9370db';
  export let size: number = 160;

  const strokeWidth = 3.5;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;

  $: clampedValue = Math.max(0, Math.min(100, value));
  $: dashOffset = circumference * (1 - clampedValue / 100);
</script>

<div class="dial" style="width: {size}px">
  <svg viewBox="0 0 40 40" width={size} height={size}>
    <!-- 背景リング -->
    <circle
      cx="20" cy="20" r={radius}
      fill="none"
      stroke="rgba(0,0,0,0.3)"
      stroke-width={strokeWidth}
    />
    <!-- プログレスリング -->
    <circle
      cx="20" cy="20" r={radius}
      fill="none"
      stroke={color}
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-dasharray={circumference}
      stroke-dashoffset={dashOffset}
      transform="rotate(-90 20 20)"
      class="progress-ring"
    />
    <!-- Lv数値 -->
    <text x="20" y="17" text-anchor="middle" dominant-baseline="middle" class="level-text">
      {level}
    </text>
    <!-- ラベル -->
    <text x="20" y="25" text-anchor="middle" dominant-baseline="middle" class="label-text">
      {label}
    </text>
  </svg>
</div>

<style>
  .dial {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .progress-ring {
    transition: stroke-dashoffset 0.3s ease;
  }

  .level-text {
    fill: #f4e4bc;
    font-size: 8px;
    font-weight: bold;
  }

  .label-text {
    fill: #c9a959;
    font-size: 5px;
  }
</style>
