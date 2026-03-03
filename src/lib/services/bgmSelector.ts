import type { GameState } from '$lib/models/types';
import { INSPECTION_DAYS } from '$lib/data/inspection';

export type BgmTrack = 'city' | 'inspection' | 'wait_for_inspection';

const trackFiles: Record<BgmTrack, string> = {
  city: '/bgm/city.mp3',
  inspection: '/bgm/inspection.mp3',
  wait_for_inspection: '/bgm/wait_for_inspection.mp3',
};

/**
 * ゲーム状態からBGMトラックを選択する。
 * 今後ゲーム状態に応じた分岐をここに追加していく。
 */
export function selectBgmTrack(state: GameState): BgmTrack {
  if (state.inspectionBackdrop) {
    return 'inspection';
  }

  const nextInspDay = INSPECTION_DAYS.find((d) => d >= state.day) ?? null;
  if (nextInspDay !== null && nextInspDay - state.day + 1 <= 7) {
    return 'wait_for_inspection';
  }

  return 'city';
}

export function getTrackFile(track: BgmTrack): string {
  return trackFiles[track];
}
