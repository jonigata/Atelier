<!-- タップ/クリック/キー操作で先に進めることを示す点滅▼マーカー -->
<span class="continue-marker">▼</span>

<style>
  .continue-marker {
    display: inline-block;
    font-size: 0.85rem;
    color: #6a6a8a;
    animation: markerBlink 1.2s ease-in-out infinite;
  }

  @keyframes markerBlink {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
</style>
