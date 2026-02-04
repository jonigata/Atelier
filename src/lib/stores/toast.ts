import { writable } from 'svelte/store';
import type { Toast, ToastType } from '$lib/models/types';

let toastId = 0;

export const toasts = writable<Toast[]>([]);

export function showToast(type: ToastType, title: string, message: string): void {
  const id = ++toastId;
  const toast: Toast = { id, type, title, message };

  toasts.update((current) => [...current, toast]);

  // 自動で消える
  setTimeout(() => {
    dismissToast(id);
  }, 3000);
}

export function dismissToast(id: number): void {
  toasts.update((current) => current.filter((t) => t.id !== id));
}

// 便利関数
export function showUnlockToast(actionName: string): void {
  showToast('unlock', '機能解放', `「${actionName}」が使えるようになった！`);
}

export function showGoalActiveToast(goalTitle: string): void {
  showToast('goal_active', '新しい目標', `「${goalTitle}」に挑戦できるようになった！`);
}

export function showGoalCompleteToast(goalTitle: string): void {
  showToast('goal_complete', '目標達成', `「${goalTitle}」を達成した！`);
}
