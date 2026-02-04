import { writable } from 'svelte/store';
import type { Toast, ToastType, ActionType } from '$lib/models/types';

let toastId = 0;

export const toasts = writable<Toast[]>([]);

// アクションタイプの日本語ラベル
const actionLabels: Record<ActionType, string> = {
  alchemy: '調合',
  quest: '依頼',
  expedition: '採取',
  shop: 'ショップ',
  inventory: '所持品',
  rest: '休息',
  study: '勉強',
};

// 新しくアンロックされたアクション（演出用）
export const pendingUnlockActions = writable<ActionType[]>([]);
export const showingUnlockActions = writable<Set<ActionType>>(new Set());

export function queueUnlockAction(action: ActionType): void {
  pendingUnlockActions.update(actions => [...actions, action]);
}

export function triggerUnlockAnimations(): void {
  pendingUnlockActions.update(actions => {
    if (actions.length > 0) {
      showingUnlockActions.set(new Set(actions));
      // アニメーション後にクリア
      setTimeout(() => {
        showingUnlockActions.set(new Set());
      }, 2000);
    }
    return [];
  });
}

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
export function showUnlockToast(action: ActionType): void {
  const label = actionLabels[action] ?? action;
  showToast('unlock', '機能解放', `「${label}」が使えるようになった！`);
}

export function showGoalActiveToast(goalTitle: string): void {
  showToast('goal_active', '新しい目標', `「${goalTitle}」に挑戦できるようになった！`);
}

export function showGoalCompleteToast(goalTitle: string): void {
  showToast('goal_complete', '目標達成', `「${goalTitle}」を達成した！`);
}
