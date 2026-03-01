import { writable } from 'svelte/store';

export interface ConfirmDialogData {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  eventImage?: string;
}

export const pendingConfirm = writable<ConfirmDialogData | null>(null);

let confirmResolver: ((result: boolean) => void) | null = null;

/**
 * ゲーム内確認ダイアログを表示して結果を待つ
 */
export function showConfirmAndWait(data: ConfirmDialogData): Promise<boolean> {
  pendingConfirm.set(data);

  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

/**
 * 確認ダイアログの結果を返す
 */
export function resolveConfirm(result: boolean): void {
  pendingConfirm.set(null);
  if (confirmResolver) {
    confirmResolver(result);
    confirmResolver = null;
  }
}
