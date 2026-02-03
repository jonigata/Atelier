# 技術設計文書

## 1. 技術スタック

- **言語**: TypeScript
- **フレームワーク**: SvelteKit
- **状態管理**: Svelte Store
- **スタイリング**: CSS
- **永続化**: LocalStorage（ブラウザ）※未実装

---

## 2. プロジェクト構造

```
src/
├── lib/
│   ├── data/                 # 静的データ定義
│   │   ├── items.ts          # アイテム・素材マスタ
│   │   ├── recipes.ts        # レシピマスタ
│   │   ├── areas.ts          # 採取地マスタ
│   │   └── quests.ts         # 依頼テンプレート
│   │
│   ├── models/               # 型定義
│   │   └── types.ts          # 全型定義
│   │
│   ├── stores/               # 状態管理
│   │   └── game.ts           # メインゲーム状態
│   │
│   └── services/             # ゲームロジック
│       └── gameLoop.ts       # ゲームループ処理
│
├── routes/
│   └── +page.svelte          # メインゲーム画面
│
└── components/
    ├── HUD.svelte            # ステータス表示
    ├── ActionMenu.svelte     # 行動選択メニュー
    ├── ActionPanel.svelte    # 各行動の実行画面
    ├── MorningPanel.svelte   # 朝のフェーズ画面
    ├── MessageLog.svelte     # メッセージログ
    └── EndingScreen.svelte   # エンディング画面
```

---

## 3. 実装状況

### Phase 1: 基盤構築 - **完了**
- [x] SvelteKitプロジェクト初期化
- [x] 型定義 (`src/lib/models/types.ts`)
- [x] マスタデータ定義 (`src/lib/data/`)
- [x] ゲーム状態ストア (`src/lib/stores/game.ts`)
- [x] 基本レイアウト（HUD、ActionMenu）
- [x] ゲームループ実装 (`src/lib/services/gameLoop.ts`)
- [x] 朝フェーズ → 行動フェーズの遷移
- [x] メッセージログ
- [x] エンディング画面・判定

### Phase 2: 調合システム - **未実装**
- [ ] AlchemyPanel UI
- [ ] レシピ選択
- [ ] 素材選択
- [ ] 調合処理（成功判定、品質計算）
- [ ] 経験値・レベルアップ

### Phase 3: インベントリ・ショップ - **未実装**
- [ ] InventoryPanel UI
- [ ] ShopPanel UI
- [ ] 売買処理

### Phase 4: 依頼システム - **未実装**
- [ ] QuestBoard UI
- [ ] 依頼生成ロジック（バックエンドは実装済み）
- [ ] 受注・納品処理
- [ ] 期限・ペナルティ（バックエンドは実装済み）

### Phase 5: 採取隊 - **未実装**
- [ ] ExpeditionPanel UI
- [ ] 派遣処理
- [ ] 帰還処理・ドロップ計算（バックエンドは実装済み）

### Phase 6: ゲーム進行 - **一部完了**
- [x] 時間経過の統合
- [ ] セーブ/ロード
- [x] エンディング判定・表示
- [ ] バランス調整

---

## 4. 現在動作する機能

### ゲームループ
```
朝のフェーズ (morning)
  ├─ 採取隊帰還チェック（ロジック実装済み）
  ├─ 依頼期限チェック（ロジック実装済み）
  ├─ 新依頼生成（ロジック実装済み）
  └─「行動を開始する」ボタン
        ↓
行動選択フェーズ (action)
  ├─ 調合（プレースホルダー）
  ├─ 依頼（プレースホルダー）
  ├─ 採取隊（プレースホルダー）
  ├─ ショップ（プレースホルダー）
  ├─ 休息 ← 動作する（1日経過、体力回復）
  └─ 勉強 ← 動作する（3日経過、レシピ習得）
        ↓
    endTurn() で日数加算
        ↓
    365日超過？ → エンディング画面
        ↓ No
    朝のフェーズに戻る
```

### 動作確認済み
- HUD（日付、所持金、名声、錬金術Lv、体力）
- 朝のフェーズ表示（イベント通知）
- 行動選択メニュー
- 休息（体力全回復、1日経過）
- 勉強（レシピ習得、3日経過）
- メッセージログ（最新50件保持）
- エンディング画面（5種類のエンディング判定）

---

## 5. 型定義（実装済み）

`src/lib/models/types.ts` に以下を定義:

- `ItemCategory`, `ItemDef`, `OwnedItem`
- `Ingredient`, `RecipeDef`
- `QuestType`, `QuestDef`, `ActiveQuest`
- `DropEntry`, `AreaDef`, `Expedition`
- `GamePhase`, `MorningEvent`, `GameState`
- `ActionType`

---

## 6. 状態管理（実装済み）

`src/lib/stores/game.ts` に以下を実装:

### ストア
- `gameState` - メインのゲーム状態
- `daysRemaining` - 残り日数（派生）
- `expForNextLevel` - 次レベルまでの経験値（派生）
- `isGameOver` - ゲーム終了判定（派生）

### アクション関数
- `addMessage()`, `addMorningEvent()`, `clearMorningEvents()`
- `setPhase()`, `advanceDay()`
- `addItem()`, `removeItem()`
- `addMoney()`, `addReputation()`, `addExp()`
- `restoreStamina()`, `consumeStamina()`
- `setExpedition()`
- `addActiveQuest()`, `removeActiveQuest()`, `setAvailableQuests()`
- `incrementCompletedQuests()`, `incrementFailedQuests()`
- `learnRecipe()`, `markItemCrafted()`
- `resetGame()`

---

## 7. 次の実装優先度

1. **調合システム** - ゲームのコア機能
2. **採取隊UI** - 素材入手手段
3. **依頼システムUI** - 収入源
4. **ショップ** - 経済の循環
5. **セーブ/ロード** - ゲーム継続性
