/**
 * ゲームバランス定数
 * マジックナンバーを一箇所に集約し、調整を容易にする
 */

// =====================================
// 経験値・レベル
// =====================================

export const ALCHEMY = {
  /** レベルアップ基本経験値 */
  EXP_BASE: 100,
  /** レベルごとの経験値成長率 */
  EXP_GROWTH: 1.5,
  /** 最大レベル */
  MAX_LEVEL: 20,
  /** 失敗時の経験値係数（成功時の30%） */
  FAIL_EXP_RATE: 0.3,
  /** 高品質ボーナスの閾値 */
  HIGH_QUALITY_THRESHOLD: 70,
  /** 高品質時の経験値ボーナス係数 */
  HIGH_QUALITY_EXP_BONUS: 1.2,
} as const;

// =====================================
// 調合成功率
// =====================================

export const CRAFT_SUCCESS = {
  /** 難易度1での基本成功率 */
  BASE_RATE: 1.0,
  /** 難易度1上昇ごとの成功率減少 */
  DIFFICULTY_PENALTY: 0.05,
  /** レベル超過1ごとの成功率ボーナス */
  LEVEL_BONUS: 0.05,
  /** 最大成功率 */
  MAX_RATE: 0.99,
} as const;

// =====================================
// 品質計算
// =====================================

export const QUALITY = {
  /** 品質計算時のレベルボーナス（レベル超過1ごと） */
  LEVEL_BONUS: 2,
  /** 品質ランダム幅の下限 */
  RANDOM_MIN: -10,
  /** 品質ランダム幅の上限 */
  RANDOM_MAX: 10,
  /** 品質の最小値 */
  MIN: 1,
  /** 品質の最大値 */
  MAX: 100,
} as const;

// =====================================
// 採取隊
// =====================================

export const EXPEDITION = {
  /** 1日あたりのドロップ数 */
  DROPS_PER_DAY: 2,
} as const;

// =====================================
// 依頼
// =====================================

export const QUEST = {
  /** 新依頼が生成される確率 */
  NEW_QUEST_CHANCE: 0.3,
  /** 期限切れ時の名声ペナルティ */
  EXPIRED_REPUTATION_PENALTY: 5,
} as const;

// =====================================
// ショップ
// =====================================

export const SHOP = {
  /** 売却価格係数（基本価格に対する割合） */
  SELL_PRICE_RATE: 0.7,
  /** 購入品質の基本値 */
  BUY_QUALITY_BASE: 40,
  /** 購入品質のランダム幅 */
  BUY_QUALITY_RANGE: 30,
} as const;

// =====================================
// スタミナ
// =====================================

export const STAMINA = {
  /** 休息で回復するスタミナ量 */
  REST_RECOVERY: 50,
  /** 初期最大スタミナ */
  INITIAL_MAX: 100,

  /** 調合時の体力消費基礎値 */
  CRAFT_BASE_COST: 5,
  /** 調合時の体力消費（難易度1あたり） */
  CRAFT_DIFFICULTY_COST: 3,
  /** 勉強時の体力消費 */
  STUDY_COST: 20,

  /** 疲労なし閾値（この値以上なら成功率ペナルティなし） */
  FATIGUE_THRESHOLD_NONE: 50,
  /** 軽度疲労閾値 */
  FATIGUE_THRESHOLD_MILD: 30,
  /** 中度疲労閾値 */
  FATIGUE_THRESHOLD_MODERATE: 10,

  /** 軽度疲労時の成功率ペナルティ */
  FATIGUE_PENALTY_MILD: 0.10,
  /** 中度疲労時の成功率ペナルティ */
  FATIGUE_PENALTY_MODERATE: 0.20,
  /** 重度疲労時の成功率ペナルティ */
  FATIGUE_PENALTY_SEVERE: 0.35,
} as const;

// =====================================
// 設備
// =====================================

export const FACILITY = {
  /** 所持設備が機能する最低品質 */
  INVENTORY_QUALITY_MIN: 50,
} as const;

// =====================================
// 旅商人マルコ
// =====================================

export const MERCHANT = {
  /** マルコ来訪開始日（月内） */
  VISIT_START_DAY: 8,
  /** マルコ来訪終了日（月内） */
  VISIT_END_DAY: 14,
  /** レア素材の品質範囲（最小） */
  RARE_MATERIAL_QUALITY_MIN: 60,
  /** レア素材の品質範囲（最大） */
  RARE_MATERIAL_QUALITY_MAX: 90,
  /** レア素材の価格係数（basePrice に対して） */
  RARE_MATERIAL_PRICE_RATE: 2.5,
  /** レシピ本の価格係数（basePrice に対して） */
  RECIPE_BOOK_PRICE_RATE: 1.2,
  /** 4枠目が出現する確率 */
  EXTRA_SLOT_CHANCE: 0.5,
} as const;

// =====================================
// ヘルパー関数
// =====================================

/**
 * レベルアップに必要な経験値を計算
 */
export function calcExpForLevel(level: number): number {
  return Math.floor(ALCHEMY.EXP_BASE * Math.pow(ALCHEMY.EXP_GROWTH, level - 1));
}
