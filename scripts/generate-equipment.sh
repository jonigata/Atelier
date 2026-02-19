#!/bin/bash
# 機材画像生成ラッパー（seedream v4.5 text-to-image）
# Usage: bash scripts/generate-equipment.sh --name <id> --desc "item description"
#
# Examples:
#   bash scripts/generate-equipment.sh --name cauldron_lucky_pot --desc "small lucky copper pot with clover engravings"

set -e

SKILL_DIR="/home/hirayama/.claude/skills/fal-generate/scripts"
MODEL="fal-ai/bytedance/seedream/v4.5/text-to-image"
STYLE_PROMPT="flat cel-shaded illustration, bold clean black outlines, simple flat color fills with sharp cel-shading shadows, anime game item artwork, single centered object on plain white background, no scenery, no room, no table, no shelf, no text, no watermark"
RAW_DIR="documents/images/equipments"
STATIC_DIR="static/images/equipments"
PROMPT_DIR="documents/image-prompts/equipments"
NAME=""
DESC=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --name|-n)  NAME="$2"; shift 2 ;;
    --desc|-d)  DESC="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: bash scripts/generate-equipment.sh --name <id> --desc \"item description\""
      echo ""
      echo "Options:"
      echo "  --name, -n   Equipment ID (filename without extension). Required."
      echo "  --desc, -d   Item description in English. Required."
      echo ""
      echo "Model: seedream v4.5 text-to-image (square_hd)"
      echo "Output: documents/images/equipments/{name}.png (raw)"
      echo "        static/images/equipments/{name}.png (1024x1024)"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [ -z "$NAME" ] || [ -z "$DESC" ]; then
  echo "Error: --name and --desc are required" >&2
  echo "Run with --help for usage" >&2
  exit 1
fi

mkdir -p "$RAW_DIR" "$STATIC_DIR" "$PROMPT_DIR"

RAW_FILE="$RAW_DIR/${NAME}.png"
STATIC_FILE="$STATIC_DIR/${NAME}.png"

# 既存ファイルがあればスキップ
if [ -f "$STATIC_FILE" ]; then
  echo "[$NAME] Skip (already exists)" >&2
  echo "$STATIC_FILE"
  exit 0
fi

FULL_PROMPT="$DESC, $STYLE_PROMPT"

echo "[$NAME] Generating..." >&2
echo "  Desc: $DESC" >&2

RESULT=$(bash "$SKILL_DIR/generate.sh" \
  --prompt "$FULL_PROMPT" \
  --model "$MODEL" \
  --extra '{"image_size": "square_hd"}' \
  --timeout 120 2>/dev/null)

IMG_URL=$(echo "$RESULT" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$IMG_URL" ]; then
  echo "[$NAME] Error: Failed to get image URL" >&2
  echo "$RESULT" >&2
  exit 1
fi

# 原画保存
curl -sL "$IMG_URL" -o "$RAW_FILE"
echo "[$NAME] Raw saved: $RAW_FILE" >&2

# プロンプト保存
echo "$FULL_PROMPT" > "$PROMPT_DIR/${NAME}.txt"

# 1024x1024にリサイズ
convert "$RAW_FILE" -resize 1024x1024 "$STATIC_FILE"
echo "[$NAME] Resized: $STATIC_FILE" >&2

echo "[$NAME] Done!" >&2
echo "$STATIC_FILE"
