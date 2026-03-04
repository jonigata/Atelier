const BASE_WIDTH = 960;
const MAX_ZOOM = 1.0;

export function initZoom(): () => void {
  function updateZoom() {
    // zoom=1に戻して実際のビューポート幅を取得
    document.documentElement.style.zoom = '1';
    const trueWidth = window.innerWidth;
    const zoom = Math.min(trueWidth / BASE_WIDTH, MAX_ZOOM);
    document.documentElement.style.zoom = String(zoom);

    // zoom後のビューポート高さを補正
    const appHeight = window.innerHeight / zoom;
    document.documentElement.style.setProperty('--app-height', `${appHeight}px`);
  }

  updateZoom();
  let timer: ReturnType<typeof setTimeout>;
  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(updateZoom, 100);
  };
  window.addEventListener('resize', onResize);
  return () => {
    window.removeEventListener('resize', onResize);
    clearTimeout(timer);
  };
}
