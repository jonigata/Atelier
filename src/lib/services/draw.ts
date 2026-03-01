import { getAllBuildings } from '$lib/data/buildings';
import { getAllHelpers } from '$lib/data/helpers';
import type { BuildingDef, HelperDef, OwnedBuilding, OwnedHelper } from '$lib/models/types';

/**
 * 施設ドローの選択肢を生成（未所有+レベルアップ可能な施設から最大3つ）
 * 既所有はレベルアップ候補として表示される
 */
export function generateBuildingChoices(ownedBuildings: OwnedBuilding[]): { def: BuildingDef; currentLevel: number }[] {
  const all = getAllBuildings();
  // 未所有 or レベルアップ可能な施設を候補に
  const available = all.filter((b) => {
    const owned = ownedBuildings.find((o) => o.buildingId === b.id);
    if (!owned) return true; // 未所有
    return owned.level < b.maxLevel; // レベルアップ可能
  });
  if (available.length === 0) return [];
  const choices = shuffleArray(available).slice(0, Math.min(3, available.length));
  return choices.map((def) => {
    const owned = ownedBuildings.find((o) => o.buildingId === def.id);
    return { def, currentLevel: owned ? owned.level : 0 };
  });
}

/**
 * 助手ドローの選択肢を生成（全7体からランダム3体）
 * 既所有はレベルアップ候補として表示される
 */
export function generateHelperChoices(
  ownedHelpers: OwnedHelper[]
): { def: HelperDef; currentLevel: number }[] {
  const all = getAllHelpers();
  const choices = shuffleArray(all).slice(0, Math.min(3, all.length));
  return choices.map((def) => {
    const owned = ownedHelpers.find((h) => h.helperId === def.id);
    return { def, currentLevel: owned ? owned.level : 0 };
  });
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
