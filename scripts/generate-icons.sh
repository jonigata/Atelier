#!/bin/bash

# 錬金アイテムアイコン一括生成スクリプト

SKILL_DIR="/home/hirayama/.claude/skills/fal-generate/scripts"
OUTPUT_DIR="/home/hirayama/Atelier/static/icons/materials"
STYLE_PROMPT="simple alchemy game item illustration, cute fantasy RPG item, flat vector style, clean shapes, subtle highlights, centered single object, die-cut sticker / cutout, isolated, transparent background (alpha), no UI, no frame, no border, no rounded square tile, no panel, no card, no button, no badge, no text, no watermark"

mkdir -p "$OUTPUT_DIR"

# アイテム定義: id|name|prompt
ITEMS=(
  "herb_01|ハルマム草|medicinal herb, green leaves"
  "herb_02|毒消し草|antidote herb, purple leaves with white spots"
  "ore_01|鉄鉱石|iron ore, rough grey metallic rock"
  "ore_02|銀鉱石|silver ore, shiny white metallic rock"
  "water_01|清水|pure clear water in a glass bottle"
  "water_02|聖水|holy water in a crystal vial, glowing golden"
  "misc_01|獣の皮|animal hide, brown leather pelt"
  "misc_02|魔獣の牙|magical beast fang, glowing purple tooth"
  "potion_01|回復薬|red healing potion in a round flask"
  "potion_02|上級回復薬|superior red healing potion in an ornate flask, glowing"
  "antidote|解毒薬|green antidote potion in a small bottle"
  "bomb_01|爆弾|round black bomb with fuse, cartoon style"
  "ingot_01|鉄インゴット|iron ingot, grey metal bar"
  "ingot_02|銀インゴット|silver ingot, shiny white metal bar"
  "elixir|エリクサー|golden elixir in a fancy crystal bottle, magical sparkles"
)

echo "=== 錬金アイテムアイコン生成 ==="
echo "合計: ${#ITEMS[@]} アイテム"
echo ""

for item in "${ITEMS[@]}"; do
  IFS='|' read -r id name prompt <<< "$item"

  output_file="$OUTPUT_DIR/${id}.png"

  # 既存ファイルがあればスキップ
  if [ -f "$output_file" ]; then
    echo "[$id] $name - スキップ (既存)"
    continue
  fi

  echo "[$id] $name - 生成中..."

  full_prompt="$prompt, $STYLE_PROMPT"

  result=$(bash "$SKILL_DIR/generate.sh" \
    --prompt "$full_prompt" \
    --model "fal-ai/gpt-image-1.5" \
    --extra '{"background": "transparent", "quality": "medium", "image_size": "1024x1024"}' 2>&1)

  # URLを抽出
  url=$(echo "$result" | grep -o 'https://v3b\.fal\.media/files/[^"]*\.png' | head -1)

  if [ -n "$url" ]; then
    curl -s -o "$output_file" "$url"
    echo "[$id] $name - 完了: $output_file"
  else
    echo "[$id] $name - エラー"
    echo "$result"
  fi

  # レート制限対策
  sleep 2
done

echo ""
echo "=== 完了 ==="
ls -la "$OUTPUT_DIR"
