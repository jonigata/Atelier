<script lang="ts">
  interface Stamp {
    id: number;
    x: number;
    y: number;
    delay: number;
    rotation: number;
  }

  let stamps: Stamp[] = [];
  let idCounter = 0;
  let playing = false;

  // パラメータ
  let count = 5;
  let spreadX = 300;
  let spreadY = 200;
  let delayPerStamp = 0.05;
  let maxRotation = 30;
  let stampSize = 170;
  let animDuration = 0.15;

  // アイテム画像
  const itemOptions = [
    { id: 'herb_01', label: 'ハルマム草' },
    { id: 'herb_02', label: 'ミスティハーブ' },
    { id: 'ore_01', label: '鉄鉱石' },
    { id: 'water_01', label: '清水' },
  ];
  let selectedItem = 'herb_01';

  function play() {
    stamps = [];
    playing = true;

    const newStamps: Stamp[] = [];

    if (count === 1) {
      newStamps.push({ id: idCounter++, x: 0, y: 0, delay: 0, rotation: 0 });
    } else {
      const cols = Math.max(1, Math.round(Math.sqrt(count * (spreadX / spreadY))));
      const rows = Math.max(1, Math.ceil(count / cols));
      const cellW = spreadX / cols;
      const cellH = spreadY / rows;

      let placed = 0;
      for (let row = 0; row < rows && placed < count; row++) {
        for (let col = 0; col < cols && placed < count; col++) {
          const centerX = -spreadX / 2 + (col + 0.5) * cellW;
          const centerY = -spreadY / 2 + (row + 0.5) * cellH;
          newStamps.push({
            id: idCounter++,
            x: centerX + (Math.random() - 0.5) * cellW * 0.8,
            y: centerY + (Math.random() - 0.5) * cellH * 0.8,
            delay: placed * delayPerStamp,
            rotation: (Math.random() - 0.5) * maxRotation,
          });
          placed++;
        }
      }
    }
    // 出現順シャッフル
    for (let i = newStamps.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmpDelay = newStamps[i].delay;
      newStamps[i].delay = newStamps[j].delay;
      newStamps[j].delay = tmpDelay;
    }
    stamps = newStamps;
  }

  function clear() {
    stamps = [];
    playing = false;
  }
</script>

<div class="page">
  <h1>Stamp Effect Test</h1>
  <a href="/">&larr; Back to Game</a>

  <div class="controls">
    <label>
      Count: <strong>{count}</strong>
      <input type="range" min="1" max="100" bind:value={count} />
    </label>
    <label>
      Spread X: <strong>{spreadX}px</strong>
      <input type="range" min="50" max="800" bind:value={spreadX} />
    </label>
    <label>
      Spread Y: <strong>{spreadY}px</strong>
      <input type="range" min="50" max="600" bind:value={spreadY} />
    </label>
    <label>
      Delay/stamp: <strong>{delayPerStamp.toFixed(3)}s</strong>
      <input type="range" min="0" max="0.3" step="0.005" bind:value={delayPerStamp} />
    </label>
    <label>
      Max Rotation: <strong>{maxRotation}&deg;</strong>
      <input type="range" min="0" max="90" bind:value={maxRotation} />
    </label>
    <label>
      Stamp Size: <strong>{stampSize}px</strong>
      <input type="range" min="30" max="200" bind:value={stampSize} />
    </label>
    <label>
      Anim Duration: <strong>{animDuration.toFixed(2)}s</strong>
      <input type="range" min="0.05" max="0.5" step="0.01" bind:value={animDuration} />
    </label>
    <label>
      Item:
      <select bind:value={selectedItem}>
        {#each itemOptions as opt}
          <option value={opt.id}>{opt.label}</option>
        {/each}
      </select>
    </label>
    <div class="buttons">
      <button class="play-btn" on:click={play}>Play</button>
      <button class="clear-btn" on:click={clear}>Clear</button>
    </div>
  </div>

  <div class="stage">
    <div class="center-mark">+</div>
    <div class="spread-guide" style="width: {spreadX}px; height: {spreadY}px;"></div>
    {#each stamps as s (s.id)}
      <img
        class="stamp"
        src="/icons/materials/{selectedItem}.png"
        alt=""
        style="
          left: calc(50% + {s.x}px);
          top: calc(50% + {s.y}px);
          --delay: {s.delay}s;
          --rot: {s.rotation}deg;
          --size: {stampSize}px;
          --dur: {animDuration}s;
        "
      />
    {/each}
  </div>
</div>

<style>
  .page {
    background: #1a1a2e;
    color: #e0e0f0;
    min-height: 100vh;
    padding: 1rem 2rem;
    font-family: sans-serif;
  }

  h1 {
    color: #f4e4bc;
    margin-bottom: 0.25rem;
  }

  a {
    color: #6a8abf;
    font-size: 0.9rem;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 1.5rem 0;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid #4a4a6a;
  }

  .controls label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.85rem;
    color: #a0a0b0;
    min-width: 160px;
  }

  .controls strong {
    color: #f4e4bc;
  }

  .controls input[type="range"] {
    width: 100%;
  }

  .controls select {
    padding: 0.3rem;
    background: #2a2a3e;
    color: #e0e0f0;
    border: 1px solid #4a4a6a;
    border-radius: 4px;
  }

  .buttons {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
  }

  .play-btn {
    padding: 0.5rem 2rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 6px;
    color: #1a1a2e;
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
  }

  .play-btn:hover {
    transform: translateY(-1px);
  }

  .clear-btn {
    padding: 0.5rem 1.5rem;
    background: transparent;
    border: 1px solid #6a6a8a;
    border-radius: 6px;
    color: #a0a0b0;
    cursor: pointer;
  }

  .stage {
    position: relative;
    width: 100%;
    height: 60vh;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 12px;
    border: 1px solid #4a4a6a;
    overflow: hidden;
  }

  .center-mark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #4a4a6a;
    font-size: 2rem;
    pointer-events: none;
    z-index: 1;
  }

  .spread-guide {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: 1px dashed #3a3a5a;
    border-radius: 4px;
    pointer-events: none;
  }

  .stamp {
    position: absolute;
    width: var(--size);
    height: var(--size);
    object-fit: contain;
    transform: translate(-50%, -50%) rotate(var(--rot)) scale(0);
    animation: stampIn var(--dur) ease-out forwards;
    animation-delay: var(--delay);
    pointer-events: none;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
    opacity: 0;
  }

  @keyframes stampIn {
    0% {
      transform: translate(-50%, -50%) rotate(var(--rot)) scale(0);
      opacity: 0;
    }
    40% {
      opacity: 0.85;
    }
    60% {
      transform: translate(-50%, -50%) rotate(var(--rot)) scale(1.15);
      opacity: 0.85;
    }
    100% {
      transform: translate(-50%, -50%) rotate(var(--rot)) scale(1);
      opacity: 0.8;
    }
  }
</style>
