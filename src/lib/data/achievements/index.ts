import type { AchievementDef, AchievementNarrative } from '$lib/models/types';
import { tutorialAchievements } from './tutorial';
import { milestoneAchievements } from './milestones';
import { storyAchievements } from './story';

// ナラティブごとのキャラクター設定
export const narrativeCharacters: Record<
  AchievementNarrative,
  { name: string; title: string } | null
> = {
  master_gift: { name: 'イリーナ', title: '師匠（手紙）' },
  master_teaching: { name: 'イリーナ', title: '師匠（手紙）' },
  villager_gift: { name: '村人', title: '' },
  patron_support: { name: '???', title: '匿名の支援者' },
  workshop_discovery: null, // システムメッセージ
  village_growth: { name: '村長', title: 'フォンテ村長' },
  character_trial: null, // アチーブメントごとに指定
  client_gratitude: { name: '依頼主', title: '' },
  village_festival: { name: '村長', title: 'フォンテ村長' },
  self_investment: null, // システムメッセージ
  village_girl: { name: 'リーネ', title: '村娘' },
  merchant_visit: { name: 'マルコ', title: '旅商人' },
  rival_pressure: { name: 'ヴィクト', title: 'ライバル錬金術師' },
};

// 全アチーブメント定義（統合）
export const achievements: Record<string, AchievementDef> = {
  ...tutorialAchievements,
  ...milestoneAchievements,
  ...storyAchievements,
};

// アチーブメントをIDで取得
export function getAchievementById(id: string): AchievementDef | undefined {
  return achievements[id];
}

// 全アチーブメントをリストで取得（優先度順）
export function getAllAchievements(): AchievementDef[] {
  return Object.values(achievements).sort((a, b) => a.priority - b.priority);
}

// カテゴリでフィルタ
export function getAchievementsByCategory(
  category: AchievementDef['category']
): AchievementDef[] {
  return getAllAchievements().filter((a) => a.category === category);
}

// 自動達成アチーブメントを取得
export function getAutoCompleteAchievements(): AchievementDef[] {
  return getAllAchievements().filter((a) => a.autoComplete);
}
