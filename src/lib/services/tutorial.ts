/**
 * 後方互換性のため残す（使われていない場合は削除可能）
 */
export function onDialogueClosed(): void {
  // presentation.ts の resolveDialogue が使われるようになったので
  // この関数は空にする（古いコードからの呼び出し対策）
}
