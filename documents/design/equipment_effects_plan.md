# 設備・機材の効果 実装状況レポート & 実装計画

## 現状まとめ

機材効果は `equipmentEffects.ts` (521行) に全32種のエフェクトタイプのロジックが**すでに定義・実装済み**。
問題は「それが実際のゲームシステムから呼ばれているか」と「UIに反映されているか」。

---

## A. 効果ロジックの実装状況

### 完全に接続済み（ロジック + UI）

| 効果タイプ | 呼び出し元 | 状態 |
|---|---|---|
| `craft_duplicate` | `alchemy.ts` `tryDuplicate()` | OK |
| `craft_quality_cap` | `alchemy.ts` `calculateQuality()` | OK |
| `craft_fail_save` | `alchemy.ts` 失敗時処理 | OK |
| `craft_fail_accumulate` | `alchemy.ts` `calculateSuccessRate()` | OK |
| `craft_combo` | `alchemy.ts` `calculateQuality()` | OK |
| `craft_quality_variance_mult` | `alchemy.ts` `calculateQuality()` | OK |
| `craft_stamina_mult` | `alchemy.ts` `calculateStaminaCost()` | OK |
| `craft_days_halve` / `reduce` | `AlchemyPanel.svelte` | OK |
| `craft_success_bonus` | `alchemy.ts` `calculateSuccessRate()` | OK |
| `craft_quality_bonus` | `alchemy.ts` `calculateQuality()` | OK |
| `material_quality_floor` | `alchemy.ts` `calculateQuality()` | OK |
| `material_quality_bonus` | `alchemy.ts` `calculateQuality()` | OK |
| `material_count_reduce` | `alchemy.ts` `canCraftRecipe()` / `autoSelectItems()` | OK |
| `study_days_reduce` / `instant` | `StudyPanel.svelte` | OK |
| `expedition_drops_mult` | `gameLoop.ts` 採取帰還処理 | OK |
| `expedition_rare_bonus` | `gameLoop.ts` 採取帰還処理 | OK |
| `sell_price_mult` / `sell_same_day_bonus` | `ShopPanel.svelte` | OK |
| `buy_price_mult` | `ShopPanel.svelte` | OK |
| `quest_money_mult` | `QuestPanel.svelte` | OK |
| `quest_reputation_bonus` | `QuestPanel.svelte` | OK |
| `quest_quality_bonus` | `QuestPanel.svelte` | OK |
| `craft_fail_recover` | `alchemy.ts` 失敗時処理 | OK |
| `all_probability_bonus` | 各確率判定で間接的に使用 | OK |

### ロジックのみ定義済み・**未接続**

| 効果タイプ | 状況 | コメント |
|---|---|---|
| `action_extra` | `canExtraAction()` 定義済み、**どこからも呼ばれていない** | ゲームループに2回行動の仕組み自体がない |
| `inventory_expand` | `getInventoryExpansion()` 定義済み、**どこからも呼ばれていない** | インベントリ上限システム自体がない |
| `preview_quests` | `getPreviewQuestDays()` 定義済み、**どこからも呼ばれていない** | 先読みUIがない |
| `preview_weather` | `getPreviewWeatherDays()` 定義済み、**どこからも呼ばれていない** | 天候システム自体がない |
| `preview_events` | `getPreviewEventDays()` 定義済み、**どこからも呼ばれていない** | 先読みUIがない |
| `decompose` | `canDecompose()` 等定義済み、**どこからも呼ばれていない** | 分解UIがない |
| `decompose_extra` | `getDecomposeExtraCount()` 定義済み、**どこからも呼ばれていない** | 同上 |

---

## B. 実装計画

### Phase 1: ターゲットシステムが存在するもの — すぐ実装可能

#### 1. 分解機能 (`decompose`, `decompose_extra`) — 中規模
- ロジックは完備（`canDecompose()`, `getDecomposeQualityLoss()`, etc.）
- 必要なもの：
  - `InventoryPanel.svelte` に「分解」ボタン追加
  - 分解実行関数を `game.ts` or `inventory.ts` に追加（レシピを逆引きして素材を返却）
  - 分解時のレシピヒント獲得ロジック

#### 2. 依頼先読み (`preview_quests`) — 小規模
- 依頼システムは完備（`QuestPanel.svelte`）
- 必要なもの：
  - 朝のフェーズで「明日以降の依頼」を事前生成して表示するUI
  - `MorningPanel` or 掲示板UIに先読み情報を追加

#### 3. イベント先読み (`preview_events`) — 小規模
- イベントシステムは存在（`gameLoop.ts` の朝フェーズ処理）
- 必要なもの：
  - 先のイベントスケジュールを表示するUI

### Phase 2: ターゲットシステムの構築が必要

#### 4. 2回行動 (`action_extra`) — 大規模
- ゲームループに「同日に2回アクションできる」仕組みがない
- `endTurn()` を呼ぶと即座に日が進む設計
- 必要な変更：
  - `GameState` に `actionsRemaining` フィールド追加
  - `endTurn()` を分岐：残り行動回数 > 0 なら日を進めず `actionPhase` に戻る
  - 2回目のアクション時の体力コスト倍率適用
  - UI上で「2回目の行動」であることを明示

#### 5. インベントリ上限 (`inventory_expand`) — 中規模
- 現状インベントリに上限がない（無制限）
- 必要な変更：
  - インベントリ上限定数を追加（例: 50個）
  - `addItem()` に上限チェック追加
  - 上限超過時のUI（売却/分解を促す）
  - `getInventoryExpansion()` で拡張を反映

### Phase 3: ターゲットシステムが存在しない — スルー

#### 6. 天候先読み (`preview_weather`) — ターゲットなし
- 天候システム自体が存在しない
- 機材データは定義済みだが、天候が実装されるまで放置

---

## C. 機材効果の極小アイコン表示 ✅ 実装済み

ユーザーがアクション時に「今どの機材が効いているか」を視覚的に把握できる仕組み。

### 実装内容

#### 共通コンポーネント `src/components/common/ActiveEquipmentIcons.svelte`
- props: `prefixes: string[]` — 効果タイプのプレフィックスでフィルタ
- 所持機材から該当する効果を持つものだけ抽出し、22x22pxのミニアイコンを横並び表示
- レア機材はオレンジのドット表示
- ツールチップ: `position: fixed`（`<main>`の`overflow: auto`を回避）
  - ホバー（`pointerenter`/`pointerleave`）+ タップ/クリック（トグル）対応
  - 3秒後に自動消去、スクロール時にも消去

#### 各パネルへの組み込み

| パネル | prefixes | 状態 |
|---|---|---|
| AlchemyPanel (調合) | `['craft_', 'material_', 'all_probability']` | ✅ |
| StudyPanel (勉強) | `['study_']` | ✅ |
| ExpeditionPanel (採取) | `['expedition_', 'all_probability']` | ✅ |
| ShopPanel (売買) | `['sell_', 'buy_']` | ✅ |
| QuestPanel (依頼) | `['quest_']` | ✅ |

---

## D. 推奨実装順（残り）

1. ~~**極小アイコン表示**~~ ✅ 実装済み
2. **分解機能** — ロジック完備、UIのみ
3. **依頼先読み / イベント先読み** — 小規模UI追加
4. **2回行動** — ゲームループの構造変更を伴う
5. **インベントリ上限** — ゲームバランスの設計判断が必要

Phase 3 の天候先読みは天候システム実装まで保留。
