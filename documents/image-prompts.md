# Image Prompts

素材アイコン生成時のスタイルプロンプト記録。同じ種別のアイテムには同じスタイルを使用すること。

## 錬金素材アイコン (Material Icons)

**モデル**: `fal-ai/gpt-image-1.5`

**スタイルプロンプト**:
```
[アイテム名], simple alchemy game item illustration, cute fantasy RPG item, flat vector style, clean shapes, subtle highlights, centered single object, die-cut sticker / cutout, isolated, transparent background (alpha), no UI, no frame, no border, no rounded square tile, no panel, no card, no button, no badge, no text, no watermark
```

**コマンドライン**:
```bash
bash /home/hirayama/.claude/skills/fal-generate/scripts/generate.sh \
  --prompt "上記プロンプト" \
  --model "fal-ai/gpt-image-1.5" \
  --extra '{"background": "transparent", "quality": "medium", "image_size": "1024x1024"}'
```

**一括生成スクリプト**: `scripts/generate-icons.sh`

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

## アクションアイコン (Action Icons)

**モデル**: `fal-ai/gpt-image-1.5`（同じスタイルプロンプト）

### 生成済みアイコン

| ID | アクション | プロンプト | ファイル |
|----|----------|----------|----------|
| album | アルバム | old leather-bound album book with golden clasp, item encyclopedia journal | static/icons/actions/album.png |
