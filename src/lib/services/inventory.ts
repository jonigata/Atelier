import type { OwnedItem } from '$lib/models/types';

/**
 * インベントリから指定したアイテムを1つ削除（不変更新）
 * @returns 削除後の新しいインベントリ配列（見つからない場合は元の配列を返す）
 */
export function removeItemFromInventory(
  inventory: OwnedItem[],
  itemId: string,
  quality: number
): OwnedItem[] {
  const index = inventory.findIndex(
    (i) => i.itemId === itemId && i.quality === quality
  );
  if (index === -1) return inventory;
  return [...inventory.slice(0, index), ...inventory.slice(index + 1)];
}

/**
 * インベントリから複数アイテムを削除（不変更新）
 * 同一アイテム・品質のものが複数ある場合、それぞれ1つずつ削除
 */
export function removeItemsFromInventory(
  inventory: OwnedItem[],
  itemsToRemove: OwnedItem[]
): OwnedItem[] {
  let result = [...inventory];
  for (const item of itemsToRemove) {
    const index = result.findIndex(
      (i) => i.itemId === item.itemId && i.quality === item.quality
    );
    if (index !== -1) {
      result = [...result.slice(0, index), ...result.slice(index + 1)];
    }
  }
  return result;
}

/**
 * インベントリにアイテムが存在するかチェック
 */
export function hasItem(inventory: OwnedItem[], itemId: string, quality?: number): boolean {
  return inventory.some(
    (i) => i.itemId === itemId && (quality === undefined || i.quality === quality)
  );
}

/**
 * インベントリ内の指定アイテムの個数をカウント
 */
export function countItem(inventory: OwnedItem[], itemId: string, quality?: number): number {
  return inventory.filter(
    (i) => i.itemId === itemId && (quality === undefined || i.quality === quality)
  ).length;
}
