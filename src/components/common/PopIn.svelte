<script lang="ts">
  /** スタンプが押された状態か */
  export let stamped = false;
  /** 初期スケール（大きい値から1に縮む） */
  export let initialScale = 2.5;
  /** アニメーション時間（秒） */
  export let duration = 0.15;
</script>

<div
  class="stamp-effect"
  class:stamped
  style="
    --initial-scale: {initialScale};
    --duration: {duration}s;
  "
>
  <slot />
</div>

<style>
  .stamp-effect {
    transform: scale(var(--initial-scale, 2.5));
    opacity: 0;
    transition:
      transform var(--duration, 0.15s) cubic-bezier(0.2, 0, 0.3, 1),
      opacity calc(var(--duration, 0.15s) * 0.67);
  }

  .stamp-effect.stamped {
    transform: scale(1);
    opacity: 1;
  }
</style>
