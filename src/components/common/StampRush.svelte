<script lang="ts">
  import { getItemIcon, handleIconError } from '$lib/data/items';

  /** スタンプするアイテム一覧（quantity分展開済みでなくてよい） */
  export let items: { itemId: string; quantity: number }[] = [];
  /** スタンプ開始トリガー */
  export let active = false;
  /** 完了時コールバック */
  export let onComplete: (() => void) | null = null;
  /** 配置グリッドの幅(px) */
  export let areaWidth = 300;
  /** 配置グリッドの高さ(px) */
  export let areaHeight = 200;
  /** アイコンサイズ(px) — 1個のときはこのサイズでデカく表示 */
  export let iconSize = 240;
  /** スタンプ開始までの初期遅延(秒) */
  export let initialDelay = 0;
  /** 1スタンプあたりの遅延(秒) */
  export let delayPerStamp = 0.1;

  interface Stamp {
    id: number;
    itemId: string;
    x: number;      // px (中央からのオフセット)
    y: number;      // px
    delay: number;   // s
    rotation: number; // deg
  }

  let stamps: Stamp[] = [];
  let idCounter = 0;
  let started = false;
  let completeTimer: ReturnType<typeof setTimeout> | null = null;
  let effectiveIconSize = iconSize;
  let zoneHeight = iconSize + 20;

  $: if (active && !started) {
    started = true;
    buildStamps();
  }

  function buildStamps() {
    // items を quantity 分展開
    const expanded: string[] = [];
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        expanded.push(item.itemId);
      }
    }

    const count = expanded.length;
    if (count === 0) return;

    // 1つならiconSizeでデカく、複数なら元サイズ(170)
    effectiveIconSize = count === 1 ? iconSize : Math.min(iconSize, 170);
    zoneHeight = count === 1 ? iconSize + 20 : 250;

    const newStamps: Stamp[] = [];

    if (count === 1) {
      newStamps.push({ id: idCounter++, itemId: expanded[0], x: 0, y: 0, delay: initialDelay, rotation: 0 });
    } else {
      const cols = Math.max(1, Math.round(Math.sqrt(count * (areaWidth / areaHeight))));
      const rows = Math.max(1, Math.ceil(count / cols));
      const cellW = areaWidth / cols;
      const cellH = areaHeight / rows;

      let placed = 0;
      for (let row = 0; row < rows && placed < count; row++) {
        for (let col = 0; col < cols && placed < count; col++) {
          const cx = -areaWidth / 2 + (col + 0.5) * cellW;
          const cy = -areaHeight / 2 + (row + 0.5) * cellH;
          newStamps.push({
            id: idCounter++,
            itemId: expanded[placed],
            x: cx + (Math.random() - 0.5) * cellW * 0.8,
            y: cy + (Math.random() - 0.5) * cellH * 0.8,
            delay: initialDelay + placed * delayPerStamp,
            rotation: (Math.random() - 0.5) * 30,
          });
          placed++;
        }
      }
    }

    // delay をシャッフル（Fisher-Yates）
    for (let i = newStamps.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = newStamps[i].delay;
      newStamps[i].delay = newStamps[j].delay;
      newStamps[j].delay = tmp;
    }

    stamps = newStamps;

    // 完了コールバック
    if (onComplete) {
      const totalTime = (count * delayPerStamp + 0.15) * 1000;
      completeTimer = setTimeout(() => onComplete!(), totalTime);
    }
  }

  /** 親からリセット用 */
  export function reset() {
    if (completeTimer) clearTimeout(completeTimer);
    completeTimer = null;
    stamps = [];
    started = false;
  }
</script>

<div class="stamps-zone" style="--icon-size: {effectiveIconSize}px; height: {zoneHeight}px;">
  {#each stamps as s (s.id)}
    <img
      class="stamp"
      src={getItemIcon(s.itemId)}
      alt=""
      style="left: calc(50% + {s.x}px); top: calc(50% + {s.y}px); --delay: {s.delay}s; --rot: {s.rotation}deg;"
      on:error={handleIconError}
    />
  {/each}
</div>

<style>
  .stamps-zone {
    position: relative;
    width: 100%;
    pointer-events: none;
  }

  .stamp {
    position: absolute;
    width: var(--icon-size, 170px);
    height: var(--icon-size, 170px);
    object-fit: contain;
    transform: translate(-50%, -50%) rotate(var(--rot)) scale(0);
    animation: stampIn 0.15s ease-out forwards;
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
