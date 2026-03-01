import { writable } from 'svelte/store';
import type { LevelUpInfo } from '$lib/stores/game';

export interface DrawRequest {
  type: 'facility' | 'helper';
  levelUpInfo: LevelUpInfo;
}

export const pendingDraw = writable<DrawRequest | null>(null);
let drawResolver: (() => void) | null = null;

/** ドローダイアログを表示し、選択完了まで待つ */
export function showDrawAndWait(request: DrawRequest): Promise<void> {
  pendingDraw.set(request);
  return new Promise((resolve) => {
    drawResolver = resolve;
  });
}

/** DrawDialog側から呼ぶ: ドロー完了を通知 */
export function resolveDraw(): void {
  pendingDraw.set(null);
  if (drawResolver) {
    drawResolver();
    drawResolver = null;
  }
}
