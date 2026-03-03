import { writable, get } from 'svelte/store';
import { gameState } from '$lib/stores/game';
import { selectBgmTrack, getTrackFile, type BgmTrack } from '$lib/services/bgmSelector';

export const bgmEnabled = writable(true);

let audio: HTMLAudioElement | null = null;
let currentTrack: BgmTrack | null = null;
const FADE_MS = 600;

function crossfadeTo(track: BgmTrack) {
  if (track === currentTrack) return;
  const file = getTrackFile(track);

  const next = new Audio(file);
  next.loop = true;
  next.volume = 0;

  const prev = audio;
  audio = next;
  currentTrack = track;

  if (!get(bgmEnabled)) return;

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
    if (!audio) return;
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
