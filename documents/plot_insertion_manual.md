# プロット挿入マニュアル

本ゲームにナラティブ（プロット・ストーリーイベント）を追加する際のリファレンス。

---

## 1. ナラティブ配置マップ

### 1.1 ファイル一覧と役割

| レイヤー | ファイル | 役割 |
|---------|--------|------|
| **型定義** | `src/lib/models/types.ts` | `EventDialogue`, `AchievementDef` 等の構造定義 |
| **データ** | `src/lib/data/achievements.ts` | セリフ・キャラクター・報酬の定義（**ナラティブの中核**） |
| **データ** | `src/lib/data/quests.ts` | 依頼のタイトル・説明文 |
| **データ** | `src/lib/data/items.ts` | アイテムの名前・説明（ロアテキスト） |
| **データ** | `src/lib/data/books.ts` | レシピ本の名前・説明 |
| **サービス** | `src/lib/services/achievement.ts` | 条件評価・ダイアログ生成・報酬付与 |
| **サービス** | `src/lib/services/presentation.ts` | 演出の非同期進行制御 |
| **ストア** | `src/lib/stores/tutorial.ts` | `pendingDialogue` のセット・アクションアンロック |
| **ストア** | `src/lib/stores/achievements.ts` | アチーブメント達成状態の管理 |
| **UI** | `src/components/EventDialog.svelte` | ダイアログ表示コンポーネント |
| **UI** | `src/components/DayTransition.svelte` | 日付演出（ダイアログの前に表示） |

### 1.2 集約度

- セリフ・キャラクター情報は **`achievements.ts` に集約**されている
- 依頼テキスト・アイテム説明は各マスターデータファイルに分散（設計上妥当）
- UI層にはハードコードされたテキストは最小限（ボタンラベル程度）

---

## 2. ナラティブシステムの仕組み

### 2.1 現在のアーキテクチャ

すべてのストーリーイベントは **アチーブメントシステム** を通じて発火する。

```
プレイヤー行動（調合・依頼達成など）
  ↓
processActionComplete()          ← presentation.ts
  ↓
checkAchievements()              ← achievement.ts（条件を評価）
  ↓
processAchievementPresentation() ← presentation.ts
  ├─ 1. waitForDayTransition()   日付演出を待つ
  ├─ 2. showDialogueAndWait()    ダイアログ表示＆待機
  ├─ 3. claimReward()            報酬付与
  ├─ 4. showUnlockToasts()       アンロック演出
  ├─ 5. showGoalCompleteToast()  目標達成トースト
  └─ 6. checkNewActiveGoals()    次の目標トースト
  ↓
再帰的に processActionComplete() → 連鎖アチーブメントをチェック
```

### 2.2 ダイアログの表示フロー

```
achievement.ts: getAchievementDialogue(id)
  → EventDialogue オブジェクトを生成
    ↓
presentation.ts: showDialogueAndWait(dialogue)
  → tutorial.ts: setEventDialogue(dialogue)
    → gameState.tutorialProgress.pendingDialogue にセット
      ↓
EventDialog.svelte が reactiveに表示
  → ユーザーがクリック/Enterで進行
  → 最終行まで読んだら報酬画面へ遷移
  → 閉じると resolveDialogue() で Promise を解決
```

### 2.3 トリガー条件

アチーブメントの `conditions` で使用可能な条件型（`AchievementConditionType`）:

| 条件型 | 評価対象 | 例 |
|-------|---------|-----|
| `day` | ゲーム内日数 | `{ type: 'day', target: 1 }` |
| `level` | 錬金術レベル | `{ type: 'level', target: 5 }` |
| `reputation` | 名声値 | `{ type: 'reputation', target: 50 }` |
| `money` | 所持金 | `{ type: 'money', target: 5000 }` |
| `quest_count` | 完了依頼数 | `{ type: 'quest_count', target: 5 }` |
| `active_quest_count` | 受注中の依頼数 | `{ type: 'active_quest_count', target: 1 }` |
| `craft_count` | 調合回数 | `{ type: 'craft_count', target: 10 }` |
| `craft_item` | 特定アイテムの調合 | `{ type: 'craft_item', target: 'elixir' }` |
| `craft_quality` | 最高調合品質 | `{ type: 'craft_quality', target: 70 }` |
| `expedition_count` | 派遣回数 | `{ type: 'expedition_count', target: 5 }` |
| `recipe_count` | 習得レシピ数 | `{ type: 'recipe_count', target: 1 }` |
| `consecutive_quests` | 連続依頼成功数 | `{ type: 'consecutive_quests', target: 5 }` |
| `total_sales` | 累計売上額 | `{ type: 'total_sales', target: 10000 }` |
| `village_development` | 村発展度 | `{ type: 'village_development', target: 20 }` |

比較演算子: `>=`（デフォルト）, `>`, `==`, `<=`, `<`

---

## 3. プロット追加の手順

### 3.1 新しいアチーブメント（イベント）を追加する

最も基本的な方法。既存のシステムだけで完結する。

#### ステップ1: `src/lib/data/achievements.ts` にエントリを追加

```typescript
ach_my_new_event: {
  id: 'ach_my_new_event',
  title: 'イベントタイトル',           // 達成バッジに表示
  description: 'このイベントの説明',    // アルバム等に表示
  hint: 'ヒント文',                    // 目標表示に使用
  category: 'quest',                   // tutorial|alchemy|quest|expedition|economy|mastery
  narrative: 'village_growth',         // ナラティブ種別（後述）
  narrativeCharacter: { name: 'オルト', title: '村長' },  // 省略可能
  narrativeLines: [
    'セリフ1行目',
    'セリフ2行目',
    'セリフ3行目',
  ],
  conditions: [{ type: 'quest_count', target: 10 }],  // 発火条件
  reward: {                            // 報酬（すべて省略可能）
    money: 500,
    items: [{ itemId: 'herb_01', quality: 60, quantity: 3 }],
    reputation: 5,
    exp: 100,
    villageDevelopment: 5,
    recipes: ['recipe_id'],
    unlocks: ['expedition'],           // ActionType
    facilities: ['improved_cauldron'],
  },
  prerequisite: ['ach_first_complete'], // 前提アチーブメントID（省略可能）
  priority: 215,                       // 実行優先度（小さいほど先に評価）
  important: true,                     // HUDに目標として表示するか
  autoComplete: false,                 // ゲーム開始時に自動達成するか
},
```

#### ステップ2: priority の決め方

既存の priority 帯域:

| カテゴリ | priority 範囲 | 例 |
|---------|-------------|-----|
| チュートリアル | 1 - 100 | `ach_game_start`(1), `ach_first_expedition`(50) |
| 調合系 | 101 - 200 | `ach_craft_10`(110), `ach_craft_elixir`(160) |
| 依頼系 | 201 - 300 | `ach_quest_5`(210), `ach_quest_streak_10`(250) |
| 採取系 | 301 - 400 | `ach_expedition_5`(310) |
| 経済系 | 401 - 500 | `ach_money_5000`(410), `ach_sales_10000`(440) |
| 熟練系 | 501 - 600 | `ach_level_5`(510), `ach_reputation_80`(560) |

同じフレームで複数のアチーブメントが達成条件を満たした場合、**priority が小さいものが先に処理**される。連鎖的に `processActionComplete()` が再帰呼出しされるため、1つずつ順番に表示される。

#### ステップ3: narrative の選択

`AchievementNarrative` 型で定義済みの種別と、デフォルトキャラクター:

| narrative | デフォルトキャラ | 説明 |
|-----------|-------------|------|
| `master_gift` | イリーナ（師匠・手紙） | 師匠からの贈り物 |
| `master_teaching` | イリーナ（師匠・手紙） | 師匠の教え |
| `villager_gift` | 村人 | 村人からの差し入れ |
| `patron_support` | ???（匿名の支援者） | 匿名の支援 |
| `workshop_discovery` | なし（システムメッセージ） | 工房での発見 |
| `village_growth` | オルト（村長） | 村の発展 |
| `character_trial` | なし（個別指定必須） | キャラからの試練 |
| `client_gratitude` | 依頼主 | 依頼主からの感謝 |
| `village_festival` | オルト（村長） | 村の祭り |
| `self_investment` | なし（システムメッセージ） | 自己投資の成果 |

`narrativeCharacter` を個別指定すればデフォルトを上書きできる。

### 3.2 新キャラクターを登場させる

1. `achievements.ts` の該当エントリで `narrativeCharacter` を指定するだけ
2. 使い回すなら `narrativeCharacters` オブジェクトに追加し、新しい `AchievementNarrative` 値を `types.ts` に追加

```typescript
// types.ts に追加
export type AchievementNarrative =
  | ... 既存 ...
  | 'new_character_event';  // 新しいnarrative種別

// achievements.ts に追加
export const narrativeCharacters: Record<AchievementNarrative, ...> = {
  ...既存...,
  new_character_event: { name: '新キャラ名', title: '肩書き' },
};
```

---

## 4. 登場キャラクター一覧

| キャラクター | 肩書き | 登場イベント | 性格・特徴 |
|------------|-------|------------|-----------|
| オルト | 村長 | 到着、依頼完了、村発展 | 温厚、面倒見が良い |
| イリーナ | 師匠（手紙で登場） | レベルアップ、熟練時 | 厳しくも温かい |
| カリン | よろず屋 | 初依頼受注、累計売上 | 商人気質、世話好き |
| ガルド | 冒険者 | 村発展度20達成、採取系 | 寡黙、実力者 |
| 村人 | 農夫など | 初調合成功、依頼完了 | 素朴、感謝深い |
| 依頼主 | （汎用） | 依頼系アチーブメント | 多様 |
| ??? | 匿名の支援者 | 高品質調合、経済系 | 謎の人物 |

---

## 5. EventDialogue の構造

ダイアログ表示に使われる型定義。`getAchievementDialogue()` が自動生成するが、構造を理解しておくと拡張時に有用。

```typescript
interface EventDialogue {
  characterName: string;        // キャラ名（空文字でシステムメッセージ）
  characterTitle: string;       // 肩書き
  lines: string[];              // セリフ行（1行ずつクリックで進行）
  achievementTitle?: string;    // 達成バッジのタイトル
  achievementCategory?: AchievementCategory;  // カテゴリアイコン表示用
  rewardsTitle?: string;        // 報酬画面タイトル（デフォルト: "目標達成！"）
  rewards?: string[];           // 報酬テキスト（後方互換）
  structuredRewards?: RewardDisplay[];  // 構造化報酬（アイコン・ゲージ付き）
}
```

EventDialog.svelte の表示フロー:
1. セリフを1行ずつ表示（クリック/Enterで進行）
2. 全セリフ読了後、報酬画面に自動遷移
3. 報酬画面を閉じると `resolveDialogue()` → 次の処理へ

---

## 6. 制約と注意事項

### 6.1 現在の制約

- **トリガーはアチーブメント条件のみ**: 時間経過のみのイベント（例: 90日目に特定イベント）を作りたい場合は `{ type: 'day', target: 90 }` を使う
- **1フレームにつき1つずつ表示**: 複数アチーブメント同時達成時は priority 順に1つずつ連鎖処理
- **条件は AND 結合**: `conditions` 配列内の全条件を満たす必要がある
- **OR 条件は未対応**: 「AまたはB」という条件は現状サポートされていない
- **再表示不可**: 一度達成したアチーブメントは二度と表示されない

### 6.2 prerequisite の使い方

`prerequisite` はストーリーの順序制御に重要。

```
ach_game_start (priority: 1)
  └─ ach_first_recipe (priority: 10)
      └─ ach_first_craft (priority: 20)
          └─ ach_first_quest (priority: 30)
              └─ ach_first_complete (priority: 40)
                  └─ ach_adventurer_arrival (priority: 45)
```

- 前提が未達成なら条件を満たしても発火しない
- 複数の前提を指定可能（すべて満たす必要あり）
- チェーン構造でストーリーの進行順序を保証できる

### 6.3 autoComplete について

`autoComplete: true` はゲーム開始時（1日目）に `processAutoCompleteAchievements()` で自動的に達成される。現在は `ach_game_start` のみが使用。

---

## 7. 拡張が必要になるケース

以下のようなプロットを実装する場合、現行システムの拡張が必要になる可能性がある。

| やりたいこと | 現状 | 必要な拡張 |
|------------|------|----------|
| OR条件のイベント | 未対応 | `AchievementCondition` に `operator: 'or'` 追加 |
| 繰り返しイベント | 1回限り | 達成リセット機構 or 別システム |
| 選択肢付きダイアログ | セリフ一方通行 | `EventDialogue` に `choices` 追加、UI拡張 |
| 時限イベント（特定日だけ） | `day` 条件は `>=` がデフォルト | `comparison: '=='` を明示的に指定すれば対応可能 |
| 複数キャラの掛け合い | 1キャラのみ | セリフ行にキャラ切替情報を持たせる |
| エンディング分岐 | 固定エンディング | EndingScreen + 条件分岐ロジック |
