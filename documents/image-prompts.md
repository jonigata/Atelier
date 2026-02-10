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

## スクリプト一覧

| スクリプト | 用途 | 使い方 |
|-----------|------|--------|
| `scripts/generate-icon.sh` | アイコン単体生成（素材・アクション） | `--name ID --desc "説明"` |
| `scripts/generate-icons.sh` | 素材アイコン一括生成（既存スキップ） | 引数なし |
| `scripts/generate-event.sh` | イベントCG生成（キャラ参照対応） | `--name ID --prompt "..." [--chars a,b]` |
