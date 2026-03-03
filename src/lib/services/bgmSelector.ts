import type { GameState } from '$lib/models/types';
import { INSPECTION_DAYS } from '$lib/data/inspection';

export type BgmTrack = 'city' | 'inspection' | 'wait_for_inspection' | 'marco';

const trackFiles: Record<BgmTrack, string> = {
  city: '/bgm/city.mp3',
  inspection: '/bgm/inspection.mp3',
  wait_for_inspection: '/bgm/wait_for_inspection.mp3',
  marco: '/bgm/marco.mp3',
};

/**
 * ゲーム状態からBGMトラックを選択する。
 * 優先順位: 査察中 > マルコ滞在 > 査察7日前 > 通常
 */
export function selectBgmTrack(state: GameState): BgmTrack {
  if (state.inspectionBackdrop) {
    return 'inspection';
  }

  if (state.merchantLineup) {
    return 'marco';
  }

  const nextInspDay = INSPECTION_DAYS.find((d) => d >= state.day) ?? null;
  if (nextInspDay !== null && nextInspDay - state.day <= 7) {
    return 'wait_for_inspection';
  }

  return 'city';
}

export function getTrackFile(track: BgmTrack): string {
  return trackFiles[track];
}
