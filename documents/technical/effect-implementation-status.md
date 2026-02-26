# 効果実装ステータス一覧

調査日: 2026-02-26

機材(65個)・施設(7個)・建物(12個)・助手(7体)の全効果について、
ゲームロジック側で実際に処理されているかを調査した結果。

---

## 凡例

- **実装済**: 効果がゲームロジックで実際に処理されている
- **未実装**: データ定義のみ存在し、ゲームロジックから呼ばれていない
- **部分実装**: 関数は存在するが呼び出し元がない

---

## 1. 機材 (Equipment) — 65個

### 効果タイプ別 実装ステータス

| 効果タイプ | 実装 | 処理場所 | 対象機材数 |
|---|---|---|---|
| `craft_duplicate` | 実装済 | alchemy.ts `tryDuplicate()` | 4 |
| `craft_quality_cap` | 実装済 | alchemy.ts `getQualityCap()` | 3 |
| `craft_fail_save` | 実装済 | alchemy.ts `shouldSaveMaterials()` | 3 |
| `craft_fail_recover` | 実装済 | alchemy.ts `getFailRecoverCount()` | 1 |
| `craft_fail_accumulate` | 実装済 | alchemy.ts `recordFailure()` | 1 |
| `craft_combo` | 実装済 | alchemy.ts `recordSuccess()` / `getComboQualityBonus()` | 3 |
| `craft_quality_variance_mult` | 実装済 | alchemy.ts `getQualityVarianceMult()` | 1 |
| `craft_quality_bonus` | 実装済 | alchemy.ts `getCraftQualityBonus()` | 2 |
| `craft_stamina_mult` | 実装済 | alchemy.ts `getStaminaCostMult()` | 1 |
| `craft_success_bonus` | 実装済 | alchemy.ts `getCraftSuccessBonus()` | 4 |
| `craft_days_halve` | 実装済 | alchemy.ts `getEffectiveCraftDays()` | 1 |
| `craft_days_reduce` | 実装済 | alchemy.ts `getEffectiveCraftDays()` | 2 |
| `material_quality_floor` | 実装済 | alchemy.ts `getEffectiveMaterialQuality()` | 2 |
| `material_quality_bonus` | 実装済 | alchemy.ts `getEffectiveMaterialQuality()` | 1 |
| `material_count_reduce` | 実装済 | alchemy.ts `getEffectiveIngredientCount()` | 2 |
| `study_days_reduce` | 実装済 | equipmentEffects.ts `getEffectiveStudyDays()` | 2 |
| `study_instant` | 実装済 | equipmentEffects.ts `getEffectiveStudyDays()` | 2 |
| `action_extra` | 実装済 | equipmentEffects.ts `canExtraAction()` | 2 |
| `expedition_drops_mult` | 実装済 | gameLoop.ts | 5 |
| `expedition_rare_bonus` | 実装済 | gameLoop.ts | 2 |
| `sell_price_mult` | 実装済 | ShopPanel.svelte | 3 |
| `sell_same_day_bonus` | 実装済 | ShopPanel.svelte | 1 |
| `buy_price_mult` | 実装済 | ShopPanel.svelte | 2 |
| `quest_money_mult` | 実装済 | quest.ts | 2 |
| `quest_reputation_bonus` | 実装済 | quest.ts | 2 |
| `quest_quality_bonus` | 実装済 | quest.ts | 2 |
| `inventory_expand` | 実装済 | equipmentEffects.ts `getInventoryExpansion()` | 1 |
| `all_probability_bonus` | 実装済 | equipmentEffects.ts `getAllProbabilityBonus()` | 1 |
| `decompose` | **未実装** | 関数定義あり・呼び出しなし | 3 |
| `decompose_extra` | **未実装** | 関数定義あり・呼び出しなし | 1 |
| `preview_quests` | **未実装** | 関数定義あり・呼び出しなし | 2 |
| `preview_weather` | **未実装** | 関数定義あり・呼び出しなし | 1 |
| `preview_events` | **未実装** | 関数定義あり・呼び出しなし | 1 |

### 未実装効果の対象機材一覧

| ID | 名前 | レア度 | 効果タイプ | 効果詳細 |
|---|---|---|---|---|
| recycle_pot | リサイクル鍋 | common | `decompose` | 品質劣化0.4倍、ヒント0% |
| scrap_hammer | 解体ハンマー | common | `decompose` | 品質劣化0.8倍、品質40以下のみ |
| decomposition_grimoire | 分解の魔導書 | rare | `decompose` | 品質劣化0.7倍、ヒント10% |
| salvage_net | 回収の網 | common | `decompose_extra` | 分解時追加+1 |
| crystal_ball | 予言者の水晶球 | rare | `preview_quests` | 3日先の依頼を予見 |
| notice_board | 依頼掲示板 | common | `preview_quests` | 1日先の依頼1件予見 |
| weather_vane | 風見鶏 | common | `preview_weather` | 1日先の天気予見 |
| almanac | 暦の手帳 | common | `preview_events` | 2日先のイベント予見 |

---

## 2. 施設 (Facility) — 7個

施設効果は `facility.ts` の `getFacilityBonuses()` で一括処理。

| ID | 名前 | タイプ | 効果 | 実装 |
|---|---|---|---|---|
| furnace | 錬成炉 | permanent | success_rate +5% (ore系) | 実装済 |
| distiller | 蒸留器 | permanent | quality +3 (water系) | 実装済 |
| magic_circle | 魔法陣 | permanent | なし（レシピ要件のみ） | 実装済 |
| improved_cauldron | 改良の大釜 | permanent | success_rate +3% (全体) | 実装済 |
| advanced_workbench | 高等作業台 | permanent | quality +5 (全体) | 実装済 |
| reinforced_cauldron | 強化大釜 | permanent | quality +5 (全体) | 実装済 |
| precision_tools_facility | 精密工具 | inventory | quality +3 (全体) | 実装済 |

**施設は全て実装済。**

---

## 3. 建物 (Building) — 12個

建物効果は `buildingEffects.ts` で処理。

| ID | 名前 | 効果タイプ | 効果詳細 | 実装 |
|---|---|---|---|---|
| herb_garden | 薬草園 | daily_item | 毎朝herb_01 x1 | 実装済 |
| apiary | 養蜂場 | periodic_item | 3日毎にhoney x1 | 実装済 |
| mine | 採掘坑 | periodic_item | 3日毎にore_01 x1 | 実装済 |
| well | 湧き水の井戸 | daily_item | 毎朝water_01 x1 | 実装済 |
| market | 市場 | sell_price / buy_price | 売値+5%、買値-5% | 実装済 |
| warehouse | 倉庫 | expedition_bonus | 採取ドロップ+20% | 実装済 |
| drying_shed | 乾燥小屋 | craft_days_reduce | 調合日数-1 (product系) | 実装済 |
| watermill | 水車小屋 | craft_quality / craft_success | 品質+5、成功率+3% | 実装済 |
| library | 図書館 | study_days_reduce | 勉強日数-1 | 実装済 |
| clock_tower | 時計塔 | reputation_exp_bonus | 名声Exp+20% | 実装済 |
| clinic | 診療所 | rest_bonus | 休息時体力+25 | 実装済 |
| meeting_hall | 集会所 | village_exp_bonus | 村発展Exp+20% | 実装済 |

**建物は全て実装済。**

---

## 4. 助手 (Helper) — 7体

助手効果は `helperEffects.ts` で集計関数を定義。
各関数がゲームロジックから実際に呼ばれているかで判定。

| 効果フィールド | 対象助手 | 呼び出し元 | 実装 |
|---|---|---|---|
| craftSuccessBonus | コロン, シルフ | alchemy.ts | 実装済 |
| craftQualityBonus | コロン, シルフ, ゴロー, ヤドカリ丸 | alchemy.ts | 実装済 |
| expeditionDropBonus | ゴロー | gameLoop.ts | 実装済 |
| expeditionRareBonus | ゴロー | gameLoop.ts | 実装済 |
| morningStamina | ルーチェ | gameLoop.ts | 実装済 |
| reputationExpBonus | ノワール | quest.ts | 実装済 |
| villageExpBonus | ヤドカリ丸 | quest.ts | 実装済 |
| staminaCostReduction | コロン | **呼び出しなし** | **未実装** |
| buyPriceMult | モグ | **呼び出しなし** | **未実装** |
| sellPriceMult | モグ, ノワール | **呼び出しなし** | **未実装** |
| rareEventBonus | (全員0) | **呼び出しなし** | **未実装** (データも全員0) |

### 未実装効果の影響を受ける助手

| ID | 名前 | 未実装の効果 | 影響 |
|---|---|---|---|
| coron | コロン | staminaCostReduction | Lv2-3の「体力消費-5」が機能しない |
| mogu | モグ | buyPriceMult, sellPriceMult | 全レベルの買値・売値効果が機能しない |
| noir | ノワール | sellPriceMult | Lv2-3の「売値+5%/+10%」が機能しない |

---

## 5. サマリー

### 全体統計

| カテゴリ | 総数 | 全効果実装済 | 一部未実装 |
|---|---|---|---|
| 機材 | 65 | 57 | **8** (decompose系3, decompose_extra1, preview系4) |
| 施設 | 7 | 7 | 0 |
| 建物 | 12 | 12 | 0 |
| 助手 | 7 | 4 | **3** (コロン, モグ, ノワール) |

### 未実装機能の分類

#### 分解システム (decompose / decompose_extra)
- 完成品を素材に戻す機能
- `equipmentEffects.ts` に `canDecompose()`, `getDecomposeQualityLoss()` 等の関数定義はあるが、UIからの呼び出しがない
- 対象機材: リサイクル鍋、解体ハンマー、分解の魔導書、回収の網

#### プレビューシステム (preview_quests / preview_weather / preview_events)
- 未来の依頼・天気・イベントを事前に確認できる機能
- `equipmentEffects.ts` に `getPreviewQuestDays()` 等の関数定義はあるが、UIからの呼び出しがない
- 対象機材: 予言者の水晶球、依頼掲示板、風見鶏、暦の手帳

#### 助手の売買価格・体力消費軽減
- `helperEffects.ts` に集計関数はあるが、ShopPanel / alchemy からの呼び出しがない
- 対象助手: コロン(体力消費)、モグ(売買)、ノワール(売値)
