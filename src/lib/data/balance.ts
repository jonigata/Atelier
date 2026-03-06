/**
 * ゲームバランス定数
 * マジックナンバーを一箇所に集約し、調整を容易にする
 */

// =====================================
// 経験値・レベル（3軸共通）
// =====================================

/** 3軸共通のレベル設定 */
export const LEVEL = {
  /** レベルアップ基本経験値 */
  EXP_BASE: 14,
  /** レベルごとの経験値成長率 */
  EXP_GROWTH: 1.15,
  /** 最大レベル */
  MAX_LEVEL: 30,
} as const;

/** 錬金術固有の設定 */
export const ALCHEMY = {
  ...LEVEL,
  /** 失敗時の経験値係数（成功時の30%） */
  FAIL_EXP_RATE: 0.3,
  /** 高品質ボーナスの閾値 */
  HIGH_QUALITY_THRESHOLD: 70,
  /** 高品質時の経験値ボーナス係数 */
  HIGH_QUALITY_EXP_BONUS: 1.2,
  /** 初回アルバム登録時の追加経験値倍率（レシピ基本経験値の100%） */
  ALBUM_FIRST_CRAFT_EXP_BONUS: 1.0,
  /** 錬金経験値の獲得倍率 */
  EXP_RATE: 0.67,
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
  LEVEL_BONUS: 0.02,
  /** レベル不足1ごとの成功率ペナルティ */
  LEVEL_DEFICIT_PENALTY: 0.08,
  /** 最大成功率 */
  MAX_RATE: 1.0,
} as const;

// =====================================
// 品質計算
// =====================================

export const QUALITY = {
  /** 品質計算時のレベルボーナス（レベル超過1ごと） */
  LEVEL_BONUS: 1,
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
  /** 1日あたりの基本ドロップ数 */
  DROPS_PER_DAY: 6,
  /** 1日あたりのドロップ数のランダム幅（±） */
  DROPS_PER_DAY_VARIANCE: 2,
} as const;

// =====================================
// 依頼
// =====================================

export const QUEST = {
  /** 新依頼が生成される確率 */
  NEW_QUEST_CHANCE: 0.6,
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
// 週替わりショップ特売
// =====================================

export const SHOP_DEALS = {
  /** バーゲンセール割引率（0.5 = 50%OFF） */
  BARGAIN_DISCOUNT: 0.5,
  /** 高価買取倍率（1.5 = 通常売価の1.5倍） */
  PREMIUM_MULTIPLIER: 1.5,
  /** バーゲン対象アイテム数/週 */
  BARGAIN_COUNT: 1,
  /** 高価買取対象アイテム数/週 */
  PREMIUM_COUNT: 3,
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
 * 指定レベルから次のレベルに必要な経験値を計算
 */
export function calcExpForLevel(level: number): number {
  return Math.floor(LEVEL.EXP_BASE * Math.pow(LEVEL.EXP_GROWTH, level - 1));
}

/**
 * 累計経験値からレベルを算出
 */
export function calcLevelFromExp(totalExp: number): number {
  let level = 1;
  let remaining = totalExp;
  while (level < LEVEL.MAX_LEVEL) {
    const needed = calcExpForLevel(level);
    if (remaining < needed) break;
    remaining -= needed;
    level++;
  }
  return level;
}

/**
 * 指定レベルに到達するために必要な累計経験値を算出
 */
export function calcTotalExpForLevel(targetLevel: number): number {
  let total = 0;
  for (let lv = 1; lv < targetLevel; lv++) {
    total += calcExpForLevel(lv);
  }
  return total;
}

/**
 * 累計経験値から現在レベル内の進捗（現在レベルで溜まったXP）を算出
 */
export function calcExpProgress(totalExp: number): number {
  let remaining = totalExp;
  let level = 1;
  while (level < LEVEL.MAX_LEVEL) {
    const needed = calcExpForLevel(level);
    if (remaining < needed) break;
    remaining -= needed;
    level++;
  }
  return remaining;
}

/**
 * レベルアップを跨ぐゲージアニメーション用セグメントを構築
 * レベルが上がるたびにバーが左から右へ繰り返されるデータを生成
 */
export function buildExpGaugeSegments(
  levelBefore: number,
  progressBefore: number,
  levelAfter: number,
  progressAfter: number,
  labelPrefix: string = 'Lv.'
): import('$lib/models/types').GaugeSegment[] {
  if (levelAfter <= levelBefore) {
    return [{
      from: progressBefore,
      to: progressAfter,
      max: calcExpForLevel(levelBefore),
      label: `${labelPrefix}${levelBefore}`
    }];
  }

  const segments: import('$lib/models/types').GaugeSegment[] = [];

  // 最初のセグメント: 現在レベルを100%まで埋める
  segments.push({
    from: progressBefore,
    to: calcExpForLevel(levelBefore),
    max: calcExpForLevel(levelBefore),
    label: `${labelPrefix}${levelBefore}`
  });

  // 中間レベル: 0%→100%のフル表示
  for (let lv = levelBefore + 1; lv < levelAfter; lv++) {
    segments.push({
      from: 0,
      to: calcExpForLevel(lv),
      max: calcExpForLevel(lv),
      label: `${labelPrefix}${lv}`
    });
  }

  // 最後のセグメント: 0%→新レベルでの進捗
  segments.push({
    from: 0,
    to: progressAfter,
    max: calcExpForLevel(levelAfter),
    label: `${labelPrefix}${levelAfter}`
  });

  return segments;
}

/**
 * 経験値タイプごとのラベルプレフィックス
 */
export type ExpType = 'alchemy' | 'reputation' | 'village';

const EXP_LABEL_PREFIX: Record<ExpType, string> = {
  alchemy: '錬金 Lv.',
  reputation: '名声 Lv.',
  village: '村 Lv.',
};

/**
 * 経験値ゲージ用データを構築する共通関数
 * totalBefore/totalAfter は累計経験値（進捗ではなく）
 */
export function buildExpGaugeData(
  type: ExpType,
  totalBefore: number,
  totalAfter: number,
): import('$lib/models/types').GaugeData {
  const labelPrefix = EXP_LABEL_PREFIX[type];
  const levelBefore = calcLevelFromExp(totalBefore);
  const levelAfter = calcLevelFromExp(totalAfter);
  const progressBefore = calcExpProgress(totalBefore);
  const progressAfter = calcExpProgress(totalAfter);
  const max = calcExpForLevel(levelBefore);
  const leveledUp = levelAfter > levelBefore;
  return {
    before: progressBefore,
    after: leveledUp ? max : progressAfter,
    max,
    label: `${labelPrefix}${levelBefore}`,
    segments: leveledUp
      ? buildExpGaugeSegments(levelBefore, progressBefore, levelAfter, progressAfter, labelPrefix)
      : undefined,
  };
}
