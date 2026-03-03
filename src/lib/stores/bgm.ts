import { writable, get } from 'svelte/store';
import { gameState } from '$lib/stores/game';
import { selectBgmTrack, getTrackFile, type BgmTrack } from '$lib/services/bgmSelector';

export const bgmEnabled = writable(true);

let audio: HTMLAudioElement | null = null;
let currentTrack: BgmTrack | null = null;
const FADE_MS = 600;

// ファンファーレ再生中はBGMを抑制
let bgmSuppressed = false;
let fanfareAudio: HTMLAudioElement | null = null;

function crossfadeTo(track: BgmTrack) {
  if (track === currentTrack) return;
  const file = getTrackFile(track);

  const next = new Audio(file);
  next.loop = true;
  next.volume = 0;

  const prev = audio;
  audio = next;
  currentTrack = track;

  if (!get(bgmEnabled) || bgmSuppressed) return;

  next.play().catch(() => {});

  // フェードイン / フェードアウト
  const steps = 15;
  const interval = FADE_MS / steps;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    const t = step / steps;
    next.volume = t * 0.3;
    if (prev) prev.volume = Math.max(0, (1 - t) * 0.3);
    if (step >= steps) {
      clearInterval(timer);
      prev?.pause();
    }
  }, interval);
}

/**
 * 査察ランクファンファーレを再生（BGMを一時停止）
 * 尺が足りなくなったら自動的にBGMに戻る
 */
export function playInspectionFanfare(grade: string) {
  stopInspectionFanfare();

  // BGMを抑制
  bgmSuppressed = true;
  if (audio) audio.pause();

  const file = `/bgm/rank_${grade.toLowerCase()}.mp3`;
  fanfareAudio = new Audio(file);
  fanfareAudio.volume = 0.5;
  fanfareAudio.addEventListener('ended', () => {
    // 尺が足りなくなったら通常BGMに戻す
    fanfareAudio = null;
    unsuppressBgm();
  });
  fanfareAudio.play().catch(() => {});
}

/**
 * ファンファーレを停止してBGMを再開
 */
export function stopInspectionFanfare() {
  if (fanfareAudio) {
    fanfareAudio.pause();
    fanfareAudio = null;
  }
  unsuppressBgm();
}

function unsuppressBgm() {
  if (!bgmSuppressed) return;
  bgmSuppressed = false;
  if (audio && get(bgmEnabled)) {
    audio.play().catch(() => {});
  }
}

export function initBgm() {
  const state = get(gameState);
  const track = selectBgmTrack(state);
  currentTrack = track;

  audio = new Audio(getTrackFile(track));
  audio.loop = true;
  audio.volume = 0.3;

  const tryPlay = () => {
    if (!audio) return;
    audio.play().then(() => {
      document.removeEventListener('click', tryPlay);
      document.removeEventListener('keydown', tryPlay);
    }).catch(() => {});
  };
  tryPlay();
  document.addEventListener('click', tryPlay);
  document.addEventListener('keydown', tryPlay);

  const unsubEnabled = bgmEnabled.subscribe((enabled) => {
    if (!audio || bgmSuppressed) return;
    if (enabled) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  const unsubState = gameState.subscribe((s) => {
    const track = selectBgmTrack(s);
    crossfadeTo(track);
  });

  return () => {
    document.removeEventListener('click', tryPlay);
    document.removeEventListener('keydown', tryPlay);
    unsubEnabled();
    unsubState();
    audio?.pause();
    audio = null;
    currentTrack = null;
  };
}
