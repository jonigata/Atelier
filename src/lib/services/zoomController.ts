const BASE_WIDTH = 960;
const MAX_ZOOM = 1.0;

export function initZoom(): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];

  function updateZoom() {
    // CSS zoomをリセットして素のビューポート幅を取得
    document.documentElement.style.zoom = '1';
    const viewportWidth = window.innerWidth;

    // DevToolsモバイルエミュレーションではouterWidthが実表示幅を表さないため、
    // スケーリングは常に現在のviewport幅を基準に計算する
    const zoom = Math.min(viewportWidth / BASE_WIDTH, MAX_ZOOM);
    document.documentElement.style.zoom = String(zoom);

    // zoom後のビューポート高さを補正
    const appHeight = window.innerHeight / zoom;
    document.documentElement.style.setProperty('--app-height', `${appHeight}px`);
  }

  function scheduleReflowSafeUpdates() {
    // DevToolsモバイルエミュレーションはリロード直後にviewport反映が遅れることがある
    // そのため短時間に数回再計算して最終状態に合わせる
    const delays = [0, 80, 200, 500];
    for (const delay of delays) {
      const id = setTimeout(updateZoom, delay);
      timers.push(id);
    }
  }

  updateZoom();
  scheduleReflowSafeUpdates();

  let timer: ReturnType<typeof setTimeout>;
  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(updateZoom, 100);
  };
  window.addEventListener('resize', onResize);

  const viewport = window.visualViewport;
  const onViewportResize = () => {
    clearTimeout(timer);
    timer = setTimeout(updateZoom, 50);
  };
  viewport?.addEventListener('resize', onViewportResize);

  return () => {
    window.removeEventListener('resize', onResize);
    viewport?.removeEventListener('resize', onViewportResize);
    clearTimeout(timer);
    for (const id of timers) clearTimeout(id);
  };
}
