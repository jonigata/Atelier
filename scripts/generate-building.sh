#!/bin/bash
# 村施設（building）画像生成ラッパー
# Usage: bash scripts/generate-building.sh --name <id> --desc "building description"
#
# 生成フロー:
#   1. fal.ai で高解像度画像を生成 (seedream v4.5)
#   2. documents/images/buildings/<name>.png に原寸保存
#   3. static/images/buildings/<name>.png に 200x200 リサイズ
#
# Examples:
#   bash scripts/generate-building.sh --name herb_garden \
#     --desc "A small herb garden behind an alchemy workshop"

set -e

SKILL_DIR="/home/hirayama/.claude/skills/fal-generate/scripts"
MODEL="fal-ai/bytedance/seedream/v4.5/text-to-image"
STYLE_PROMPT="painterly illustration style with warm earth tones, storybook fantasy art, cozy fantasy village aesthetic, soft lighting"
ORIG_DIR="documents/images/buildings"
STATIC_DIR="static/images/buildings"
THUMB_SIZE=200
SIZE="square_hd"
NAME=""
DESC=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --name|-n)  NAME="$2"; shift 2 ;;
    --desc|-d)  DESC="$2"; shift 2 ;;
    --size|-s)  SIZE="$2"; shift 2 ;;
    --model|-m) MODEL="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: bash scripts/generate-building.sh --name <id> --desc \"building description\" [options]"
      echo ""
      echo "Options:"
      echo "  --name, -n   Building ID / output filename (without extension). Required."
      echo "  --desc, -d   Building description in English. Required."
      echo "  --size, -s   Image size (default: square_hd)"
      echo "  --model, -m  Model ID (default: seedream v4.5)"
      echo ""
      echo "Output:"
      echo "  $ORIG_DIR/<name>.png     (original)"
      echo "  $STATIC_DIR/<name>.png   (200x200 thumbnail)"
      echo ""
      echo "Existing buildings:"
      ls -1 "$STATIC_DIR"/*.png 2>/dev/null | xargs -I{} basename {} .png | sed 's/^/  /' || echo "  (none)"
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

mkdir -p "$ORIG_DIR" "$STATIC_DIR"

ORIG_FILE="$ORIG_DIR/${NAME}.png"
THUMB_FILE="$STATIC_DIR/${NAME}.png"
FULL_PROMPT="$DESC, $STYLE_PROMPT"

echo "Generating building image: $NAME" >&2
echo "  Desc: $DESC" >&2
echo "  Model: $MODEL" >&2

RESULT=$(bash "$SKILL_DIR/generate.sh" \
  --prompt "$FULL_PROMPT" \
  --model "$MODEL" \
  --size "$SIZE" \
  --timeout 180 2>/dev/null)

IMG_URL=$(echo "$RESULT" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$IMG_URL" ]; then
  echo "Error: Failed to get image URL from result" >&2
  echo "$RESULT" >&2
  exit 1
fi

# 原寸ダウンロード
curl -sL "$IMG_URL" -o "$ORIG_FILE"
echo "  Original: $ORIG_FILE" >&2

# 200x200 リサイズ
convert "$ORIG_FILE" -resize ${THUMB_SIZE}x${THUMB_SIZE} "$THUMB_FILE"
echo "  Thumbnail: $THUMB_FILE (${THUMB_SIZE}x${THUMB_SIZE})" >&2

# プロンプト保存
PROMPT_DIR="documents/image-prompts/buildings"
PROMPT_FILE="$PROMPT_DIR/${NAME}.txt"
mkdir -p "$PROMPT_DIR"
echo "$FULL_PROMPT" > "$PROMPT_FILE"
echo "  Prompt: $PROMPT_FILE" >&2

echo "" >&2
echo "Done! $THUMB_FILE" >&2
echo "$THUMB_FILE"
