# Image Prompts

画像生成時のスタイルプロンプト記録。同じ種別のものには同じスタイル・手順を使用すること。

---

## 錬金素材アイコン (Material Icons)

**モデル**: `fal-ai/gpt-image-1.5`
**出力先**: `static/icons/materials/`

**スタイルプロンプト**:
```
[アイテム名], simple alchemy game item illustration, cute fantasy RPG item, flat vector style, clean shapes, subtle highlights, centered single object, die-cut sticker / cutout, isolated, transparent background (alpha), no UI, no frame, no border, no rounded square tile, no panel, no card, no button, no badge, no text, no watermark
```

**生成コマンド**:
```bash
# 単体生成
bash scripts/generate-icon.sh --name herb_03 --desc "glowing blue herb with spiral leaves"

# 一括生成（既存スキップ）
bash scripts/generate-icons.sh
```

### 生成済みアイコン

| ID | アイテム | プロンプト | ファイル |
|----|---------|----------|----------|
| herb_01 | ハルマム草 | medicinal herb, green leaves | static/icons/materials/herb_01.png |
| herb_02 | 毒消し草 | antidote herb, purple leaves with white spots | static/icons/materials/herb_02.png |
| ore_01 | 鉄鉱石 | iron ore, rough grey metallic rock | static/icons/materials/ore_01.png |
| ore_02 | 銀鉱石 | silver ore, shiny white metallic rock | static/icons/materials/ore_02.png |
| water_01 | 清水 | pure clear water in a glass bottle | static/icons/materials/water_01.png |
| water_02 | 聖水 | holy water in a crystal vial, glowing golden | static/icons/materials/water_02.png |
| misc_01 | 獣の皮 | animal hide, brown leather pelt | static/icons/materials/misc_01.png |
| misc_02 | 魔獣の牙 | magical beast fang, glowing purple tooth | static/icons/materials/misc_02.png |
| potion_01 | 回復薬 | red healing potion in a round flask | static/icons/materials/potion_01.png |
| potion_02 | 上級回復薬 | superior red healing potion in an ornate flask, glowing | static/icons/materials/potion_02.png |
| antidote | 解毒薬 | green antidote potion in a small bottle | static/icons/materials/antidote.png |
| bomb_01 | 爆弾 | round black bomb with fuse, cartoon style | static/icons/materials/bomb_01.png |
| ingot_01 | 鉄インゴット | iron ingot, grey metal bar | static/icons/materials/ingot_01.png |
| ingot_02 | 銀インゴット | silver ingot, shiny white metal bar | static/icons/materials/ingot_02.png |
| elixir | エリクサー | golden elixir in a fancy crystal bottle, magical sparkles | static/icons/materials/elixir.png |
| unknown | 未発見アイテム | mysterious question mark symbol wrapped in swirling mist and shadows, unknown item | static/icons/materials/unknown.png |
| fallback | フォールバック | broken cracked empty bottle or flask, missing item placeholder | static/icons/materials/fallback.png |

---

## アクションアイコン (Action Icons)

**モデル**: `fal-ai/gpt-image-1.5`（素材アイコンと同じスタイル）
**出力先**: `static/icons/actions/`

**生成コマンド**:
```bash
bash scripts/generate-icon.sh --name shop --type actions --desc "small wooden shop stall with awning"
```

### 生成済みアイコン

| ID | アクション | プロンプト | ファイル |
|----|----------|----------|----------|
| album | アルバム | old leather-bound album book with golden clasp, item encyclopedia journal | static/icons/actions/album.png |

---

## イベント画像 (Event CG)

**モデル**: `fal-ai/bytedance/seedream/v4.5/edit`（キャラクター参照あり） / `text-to-image`（参照なし）
**出力先**: `static/images/events/`
**キャラクター参照画像**: `documents/characters/` 配下の立ち絵

**生成コマンド**:
```bash
# キャラ参照あり（edit モデル）
bash scripts/generate-event.sh \
  --name first_meeting_liene \
  --chars heroine,liene \
  --prompt "Figure 1 is protagonist, Figure 2 is Liene. ..."

# キャラ参照なし（text-to-image モデル）
bash scripts/generate-event.sh \
  --name village_crisis \
  --prompt "Village square in the rain, villagers gathered..."

# ヘルプ（利用可能キャラ一覧も表示）
bash scripts/generate-event.sh --help
```

### スタイル指定（統一用）

プロンプトの末尾に必ず以下のスタイル指定を付けること:
```
soft watercolor anime style, hand-painted illustrated background,
NOT photorealistic, painted style like Studio Ghibli or Atelier game series,
muted earthy tones, visual novel event CG quality.
```

### プロンプト規約

- `--chars` で指定した順に `Figure 1`, `Figure 2`, ... でプロンプト内から参照する
- 各キャラの配置（左/右）、表情、ポーズを明示する
- 背景は `documents/setting_designs.md` のビジュアルキーワードを使う
- 参照画像のポーズと矛盾する指示は避ける（例: 帽子を被った参照画像で「帽子を手に持つ」は競合する）
- `single unified illustration, no split screen` を入れて一枚絵を保証する

### 生成済みイベント画像

| ID | シーン | --chars | プロンプト要約 | ファイル |
|----|--------|---------|--------------|----------|
| first_meeting_liene | リーネとの初対面（冷たい視線） | heroine,liene | Liene(左)腕組み冷たい表情、主人公(右)ベレー帽のつばに手をかけ挨拶、辺境の寂れた農村・土の道・茅葺き屋根・丘と森・曇り空 | static/images/events/first_meeting_liene.png |
| arrival_village | 村到着・村長の出迎え | heroine,mayor | 村長(左)笑顔で工房を示す、主人公(右)驚き・革リュック背負い、朽ちた石造りの工房・蔦・茅葺き屋根・土の道・夕方の光 | static/images/events/arrival_village.png |

---

## キャラクター画像 (Character Images)

**出力先**: `documents/design/characters/<name>/`
**参照テンプレート**: `documents/design/characters/character_sheet.png`

4ステップで立ち絵・キャラクターシート・表情画像を生成する。`--chibi` でデフォルメ版も生成可能。

| Step | モデル | 内容 | 出力 |
|------|--------|------|------|
| 1 | `fal-ai/bytedance/seedream/v4.5/edit` | 参照画像のスタイルに合わせた全身立ち絵 (1920x1920) | `<name>/<name>-1.png` |
| 2 | `fal-ai/bytedance/seedream/v4.5/edit` | 正面向き・手を下ろした設定画ポーズに修正 | (中間データ) |
| 3 | `fal-ai/nano-banana-pro/edit` | キャラクターシート（正面・横・背面 + 表情3種） | `<name>/<name>.png` |
| 4a | `fal-ai/bytedance/seedream/v4.5/edit` | -1.png からneutral（証明写真画角）を生成 | `<name>/<name>-face-neutral.png` |
| 4b | `fal-ai/bytedance/seedream/v4.5/edit` | neutralから表情差し替えで8枚派生 | `<name>/<name>-face-*.png` |
| chibi | `fal-ai/bytedance/seedream/v4.5/edit` | -1.png からデフォルメ/チビ版を生成 | `<name>/<name>-chibi.png` |

#### 表情一覧（9種）

neutral, happy, angry, sad, surprised, embarrassed, smug, worried, determined

#### 生成コマンド

```bash
# 全ステップ実行（新規キャラ）
bash scripts/generate-character.sh --name melda \
  --desc "A plump, cheerful bakery woman in her late 40s. ..."

# Step 1 が完了済み → Step 2 から実行
bash scripts/generate-character.sh --name melda --from 2

# 表情画像だけ全部生成（neutral → 派生8枚）
bash scripts/generate-character.sh --name melda --from 4

# 特定の表情だけ再生成（既存neutralから派生）
bash scripts/generate-character.sh --name melda --expr angry

# neutralだけ再生成
bash scripts/generate-character.sh --name melda --expr neutral

# スタイル参照画像を変更（デフォルト: heroine/heroine-1.png）
bash scripts/generate-character.sh --name ren --desc "..." --ref liene/liene-1.png

# チビ（デフォルメ）版を生成（立ち絵が必要）
bash scripts/generate-character.sh --name melda --chibi

# ヘルプ
bash scripts/generate-character.sh --help
```

### --desc の書き方

- `documents/design/characters/character_designs.md` の容姿設定を英訳して使う
- 年齢・髪・目・体格・服装・靴・小物を含める
- スタイル指定（線・背景・質感）はスクリプト側で自動付与されるため不要

### 生成済みキャラクター画像

| ID | キャラクター | ディレクトリ | チビ画像 |
|----|------------|------------|---------|
| heroine | コレット（主人公） | `documents/design/characters/heroine/` | あり |
| liene | リーネ（村娘） | `documents/design/characters/liene/` | あり |
| mayor | 村長 | `documents/design/characters/mayor/` | |
| marco | マルコ（旅商人） | `documents/design/characters/marco/` | |
| melda | メルダ（パン屋） | `documents/design/characters/melda/` | あり |
| ren | レン（冒険者・剣士） | `documents/design/characters/ren/` | あり |
| fee | フィー（冒険者・斥候） | `documents/design/characters/fee/` | あり |
| irina | イリーナ（師匠） | `documents/design/characters/irina/` | |
| vict | ヴィクト（ライバル錬金術師） | `documents/design/characters/vict/` | |
| gord | ゴルド（鍛冶屋） | `documents/design/characters/gord/` | |
| inspector | 査察官 | `documents/design/characters/inspector/` | |

---

## アクションバナー画像 (Action Banners)

**モデル**: `fal-ai/bytedance/seedream/v4.5/edit`（デフォルメキャラ参照あり）
**出力先**: `static/images/actions/`
**チビ参照画像**: `documents/design/characters/<name>/<name>-chibi.png`

コマンドボタン用の横長バナー画像。2段階で生成する:
1. **Phase 1**: 各キャラの立ち絵からデフォルメ版を生成（`--chibi`）
2. **Phase 2**: デフォルメ版を参照画像として、シーンバナーを生成

**生成コマンド**:
```bash
# Phase 1: チビ参照画像生成（generate-character.sh --chibi を使用）
bash scripts/generate-character.sh --name heroine --chibi

# Phase 2: バナー生成（全8種 or 指定のみ）
bash scripts/generate-action-banners.sh --phase2
bash scripts/generate-action-banners.sh --phase2 alchemy

# 全行程（Phase 1 + Phase 2）
bash scripts/generate-action-banners.sh
```

### 生成済みバナー

| ID | アクション | 参照キャラ | ファイル |
|----|----------|----------|----------|
| alchemy | 調合 | heroine | `static/images/actions/alchemy.png` |
| quest | 依頼 | heroine, liene | `static/images/actions/quest.png` |
| expedition | 採取 | heroine, ren, fee | `static/images/actions/expedition.png` |
| shop | ショップ | heroine, melda | `static/images/actions/shop.png` |
| inventory | 所持品 | heroine | `static/images/actions/inventory.png` |
| rest | 休息 | heroine | `static/images/actions/rest.png` |
| study | 勉強 | heroine | `static/images/actions/study.png` |
| album | アルバム | heroine, liene | `static/images/actions/album.png` |

---

## スクリプト一覧

| スクリプト | 用途 | 使い方 |
|-----------|------|--------|
| `scripts/generate-icon.sh` | アイコン単体生成（素材・アクション） | `--name ID --desc "説明"` |
| `scripts/generate-icons.sh` | 素材アイコン一括生成（既存スキップ） | 引数なし |
| `scripts/generate-event.sh` | イベントCG生成（キャラ参照対応） | `--name ID --prompt "..." [--chars a,b]` |
| `scripts/generate-character.sh` | キャラクター立ち絵＋シート＋チビ画像生成 | `--name ID --desc "..." [--from N] [--ref img] [--chibi]` |
| `scripts/generate-action-banners.sh` | コマンドボタン用バナー画像生成 | `[--phase1] [--phase2 [action]]` |
