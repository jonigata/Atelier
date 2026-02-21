import { MERCHANT } from '$lib/data/balance';

/** 月番号(1-12)を取得。28日/月 */
export function getMonth(day: number): number {
  return Math.ceil(day / 28);
}

/** 月内の日数(1-28)を取得 */
export function getDayOfMonth(day: number): number {
  return ((day - 1) % 28) + 1;
}

/** マルコが来訪中かどうか */
export function isMerchantVisiting(day: number): boolean {
  const dayOfMonth = getDayOfMonth(day);
  return dayOfMonth >= MERCHANT.VISIT_START_DAY && dayOfMonth <= MERCHANT.VISIT_END_DAY;
}

/** 指定月のマルコ来訪開始日（ゲーム内日数） */
export function getMerchantArrivalDay(month: number): number {
  return (month - 1) * 28 + MERCHANT.VISIT_START_DAY;
}

/** 週番号(1-48)を取得。7日/週 */
export function getWeek(day: number): number {
  return Math.ceil(day / 7);
}

/** 今週の残り日数を取得 */
export function getDaysLeftInWeek(day: number): number {
  return 7 - ((day - 1) % 7);
}

/** 日付表示用フォーマット */
export function formatDate(day: number): string {
  const month = getMonth(day);
  const dayOfMonth = getDayOfMonth(day);
  return `${month}月${dayOfMonth}日`;
}
