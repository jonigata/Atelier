<!-- タップ/クリック/キー操作で先に進めることを示す点滅▼マーカー -->
<script lang="ts">
  /** false にするとスペースは確保しつつ非表示になる */
  export let visible: boolean = true;
</script>

<span class="continue-marker" class:hidden={!visible}>▼</span>

<style>
  .continue-marker {
    display: inline-block;
    font-size: 0.85rem;
    color: #6a6a8a;
    animation: markerBlink 1.2s ease-in-out infinite;
  }

  .continue-marker.hidden {
    visibility: hidden;
    animation: none;
  }

  @keyframes markerBlink {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
</style>
