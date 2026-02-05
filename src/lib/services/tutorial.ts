import { processActionComplete, processAutoCompleteAchievements } from './presentation';

/**
 * ゲーム開始時にautoCompleteアチーブメントをチェック
 */
export function checkAutoCompleteAchievements(): void {
  // 非同期で処理を開始（awaitしない - UIがブロックされないように）
  processAutoCompleteAchievements();
}

/**
 * マイルストーン/アチーブメント進捗をチェック
 * 各アクション完了時に呼び出す
 */
export function checkMilestoneProgress(): void {
  // 非同期で処理を開始（awaitしない - UIがブロックされないように）
  processActionComplete();
}

/**
 * 後方互換性のため残す（使われていない場合は削除可能）
 */
export function onDialogueClosed(): void {
  // presentation.ts の resolveDialogue が使われるようになったので
  // この関数は空にする（古いコードからの呼び出し対策）
}
