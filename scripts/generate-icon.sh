#!/bin/bash
# アイコン画像生成ラッパー（素材・アクション・その他）
# Usage: bash scripts/generate-icon.sh --name <id> --desc "item description" [--type materials|actions] [--size 1024x1024]
#
# Examples:
#   bash scripts/generate-icon.sh --name herb_03 --desc "glowing blue herb with spiral leaves"
#   bash scripts/generate-icon.sh --name shop --type actions --desc "small wooden shop stall with awning"

set -e

SKILL_DIR="/home/hirayama/.claude/skills/fal-generate/scripts"
MODEL="fal-ai/gpt-image-1.5"
STYLE_PROMPT="simple alchemy game item illustration, cute fantasy RPG item, flat vector style, clean shapes, subtle highlights, centered single object, die-cut sticker / cutout, isolated, transparent background (alpha), no UI, no frame, no border, no rounded square tile, no panel, no card, no button, no badge, no text, no watermark"
OUTPUT_BASE="static/icons"
TYPE="materials"
SIZE="1024x1024"
NAME=""
DESC=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --name|-n)  NAME="$2"; shift 2 ;;
    --desc|-d)  DESC="$2"; shift 2 ;;
    --type|-t)  TYPE="$2"; shift 2 ;;
    --size|-s)  SIZE="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: bash scripts/generate-icon.sh --name <id> --desc \"item description\" [options]"
      echo ""
      echo "Options:"
      echo "  --name, -n   Output filename (without extension). Required."
      echo "  --desc, -d   Item description in English (appended to style prompt). Required."
      echo "  --type, -t   Icon type: materials (default), actions"
      echo "  --size, -s   Image size (default: 1024x1024)"
      echo ""
      echo "Model: gpt-image-1.5 (transparent background)"
      echo "Output: static/icons/{type}/{name}.png"
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

OUTPUT_DIR="$OUTPUT_BASE/$TYPE"
OUTPUT_FILE="$OUTPUT_DIR/${NAME}.png"
mkdir -p "$OUTPUT_DIR"

FULL_PROMPT="$DESC, $STYLE_PROMPT"

echo "Generating icon: $NAME ($TYPE)..." >&2
echo "  Desc: $DESC" >&2

RESULT=$(bash "$SKILL_DIR/generate.sh" \
  --prompt "$FULL_PROMPT" \
  --model "$MODEL" \
  --extra "{\"background\": \"transparent\", \"quality\": \"medium\", \"image_size\": \"$SIZE\"}" \
  --timeout 120 2>/dev/null)

IMG_URL=$(echo "$RESULT" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$IMG_URL" ]; then
  echo "Error: Failed to get image URL from result" >&2
  echo "$RESULT" >&2
  exit 1
fi

curl -sL "$IMG_URL" -o "$OUTPUT_FILE"

# プロンプト保存
PROMPT_DIR="documents/image-prompts/icons/$TYPE"
PROMPT_FILE="$PROMPT_DIR/${NAME}.txt"
mkdir -p "$PROMPT_DIR"
echo "$FULL_PROMPT" > "$PROMPT_FILE"
echo "Prompt saved to $PROMPT_FILE" >&2

echo "Done! Saved to $OUTPUT_FILE" >&2
echo "$OUTPUT_FILE"
