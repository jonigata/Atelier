# アチーブメントシステム実装プラン

## 概要

ゲーム全体を通して「今やるべきこと」を示すアチーブメントシステム。報酬は10種類のナラティブを使い分け、世界観に自然に溶け込ませる。

---

## ナラティブ一覧（報酬の出所）

| ID | 名前 | 使用場面 |
|----|------|---------|
| academy_grant | アカデミー奨励金 | 公式な進捗（Lv、チュートリアル） |
| senior_handdown | 先輩のお下がり | 序盤の補助（エルザ） |
| townspeople_gift | 街の差し入れ | 依頼系、名声 |
| patron_support | パトロン支援 | 経済系、品質系 |
| workshop_discovery | 工房の発掘 | 探索系、隠し要素 |
| guild_rank_bonus | ギルド昇格 | 調合回数、レベル |
| character_trial | キャラの試練 | NPC固有の課題 |
| client_gratitude | 依頼主の謝礼 | 依頼完了系 |
| seasonal_award | 季節イベント | 大きなマイルストーン |
| self_investment | 努力の成果 | 品質向上、貯蓄 |

---

## アチーブメント例（25個）

### チュートリアル統合（既存マイルストーン対応）
| ID | タイトル | 条件 | ナラティブ | 報酬 |
|----|---------|------|-----------|------|
| ach_first_recipe | 知識の扉 | レシピ1個習得 | senior_handdown | ハルマム草x3 |
| ach_first_craft | 錬金術士の目覚め | 初回調合成功 | academy_grant | 100G |
| ach_first_quest | 街との繋がり | 初回依頼受注 | townspeople_gift | 清水x2 |
| ach_first_complete | 信頼の芽生え | 初回依頼完了 | client_gratitude | 50G, 名声+2 |

### 調合系
| ID | タイトル | 条件 | ナラティブ | 報酬 |
|----|---------|------|-----------|------|
| ach_craft_10 | 駆け出し調合士 | 調合10回 | guild_rank_bonus | 200G, 名声+5 |
| ach_craft_50 | 熟練調合士 | 調合50回 | guild_rank_bonus | 500G, 名声+10 |
| ach_quality_70 | 品質へのこだわり | 品質70+調合 | self_investment | 聖水x1 |
| ach_quality_90 | 至高の一品 | 品質90+調合 | patron_support | 500G, レシピ |
| ach_craft_elixir | 伝説への到達 | エリクサー調合 | workshop_discovery | 1000G, 名声+20 |

### 依頼系
| ID | タイトル | 条件 | ナラティブ | 報酬 |
|----|---------|------|-----------|------|
| ach_quest_5 | 頼れる存在 | 依頼5件完了 | townspeople_gift | 素材セット |
| ach_quest_15 | 街の名士 | 依頼15件完了 | seasonal_award | 800G, 名声+10 |
| ach_quest_streak_5 | 信頼の証 | 5件連続成功 | patron_support | 300G |

### レベル系
| ID | タイトル | 条件 | ナラティブ | 報酬 |
|----|---------|------|-----------|------|
| ach_level_5 | 成長の実感 | Lv5 | academy_grant | 300G, レシピ |
| ach_level_10 | 一人前 | Lv10 | guild_rank_bonus | 800G, 名声+10 |
| ach_level_15 | 熟練者 | Lv15 | character_trial | 1500G, 名声+15 |
| ach_level_20 | 究極の境地 | Lv20 | guild_rank_bonus | 3000G, 名声+20 |

### 経済系
| ID | タイトル | 条件 | ナラティブ | 報酬 |
|----|---------|------|-----------|------|
| ach_money_5000 | 堅実な経営 | 所持金5000 | self_investment | 清水x5 |
| ach_money_50000 | 富豪錬金術士 | 所持金50000 | seasonal_award | 2000G, 名声+15 |

---

## 実装ステップ

### Step 1: 型定義追加
**ファイル**: `src/lib/models/types.ts`

```typescript
// ナラティブの種類
export type AchievementNarrative =
  | 'academy_grant' | 'senior_handdown' | 'townspeople_gift'
  | 'patron_support' | 'workshop_discovery' | 'guild_rank_bonus'
  | 'character_trial' | 'client_gratitude' | 'seasonal_award'
  | 'self_investment';

// アチーブメント定義
export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  hint: string;  // 次にやるべきことのヒント
  narrative: AchievementNarrative;
  narrativeMessage: string;
  conditions: AchievementCondition[];
  reward: AchievementReward;
  priority: number;  // 低いほど先に表示
}

// GameStateに追加
export interface AchievementProgress {
  completed: string[];  // 達成済みID
  pendingReward: string | null;  // 報酬受取待ち
}

export interface GameStats {
  totalCraftCount: number;
  consecutiveQuestSuccess: number;
  highestQualityCrafted: number;
  totalSalesAmount: number;
}
```

### Step 2: アチーブメントデータ作成
**新規ファイル**: `src/lib/data/achievements.ts`

- 25個のアチーブメント定義
- ナラティブごとのキャラクター設定
- 報酬データ

### Step 3: ストア拡張
**ファイル**: `src/lib/stores/game.ts`

- GameStateに`achievementProgress`と`stats`追加
- 統計更新関数追加（`incrementCraftCount()`等）

### Step 4: 判定サービス作成
**新規ファイル**: `src/lib/services/achievement.ts`

- `checkAchievements()`: 達成判定
- `getCurrentGoal()`: 次の目標取得
- `claimReward()`: 報酬付与

### Step 5: チュートリアル統合
**ファイル**: `src/lib/services/tutorial.ts`

- 既存マイルストーンをアチーブメントに置き換え
- ダイアログ表示を統一

### Step 6: UI実装
**変更ファイル**: `src/components/HUD.svelte`

- 「現在の目標」セクション追加

**新規ファイル**: `src/components/AchievementNotification.svelte`

- 達成時のダイアログ（TutorialDialogue流用可）

---

## 主要ファイル

| ファイル | 変更内容 |
|---------|---------|
| src/lib/models/types.ts | 型追加 |
| src/lib/data/achievements.ts | 新規: データ定義 |
| src/lib/stores/game.ts | state拡張, 統計関数 |
| src/lib/services/achievement.ts | 新規: 判定ロジック |
| src/lib/services/tutorial.ts | 統合 |
| src/components/HUD.svelte | 目標表示 |
| src/components/AchievementNotification.svelte | 新規: 達成通知 |

---

## 検証方法

1. **チュートリアルフロー確認**
   - ゲーム開始 → 勉強 → レシピ習得 → アチーブメント達成通知 + 報酬
   - 調合 → 依頼受注 → 依頼完了 と進み、各段階で達成通知

2. **報酬付与確認**
   - 達成時にお金/アイテムが正しく付与される
   - ナラティブに応じたキャラクターがダイアログに表示される

3. **目標表示確認**
   - HUDに「次の目標」が表示される
   - 達成後は次の目標に自動更新される

4. **チュートリアル後の継続**
   - 全機能解放後もアチーブメントが続く
   - エンディング条件に向けたガイダンスが提示される
