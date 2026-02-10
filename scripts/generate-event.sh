#!/bin/bash
# イベントCG画像生成ラッパー
# Usage: bash scripts/generate-event.sh --name <id> --prompt "..." [--chars heroine,liene] [--size landscape_4_3]
#
# Examples:
#   bash scripts/generate-event.sh --name first_meeting_liene \
#     --chars heroine,liene \
#     --prompt "Liene on left, arms crossed, cold expression. Protagonist on right, nervous smile."
#
#   bash scripts/generate-event.sh --name village_crisis \
#     --prompt "Village square in the rain, villagers gathered around the well looking worried."

set -e

SKILL_DIR="/home/hirayama/.claude/skills/fal-generate/scripts"
CHARS_DIR="documents/characters"
OUTPUT_DIR="static/images/events"
CACHE_DIR="/tmp/fal-upload-cache"
MODEL="fal-ai/bytedance/seedream/v4.5/edit"
T2I_MODEL="fal-ai/bytedance/seedream/v4.5/text-to-image"
SIZE="landscape_4_3"
NAME=""
PROMPT=""
CHARS=""

# アップロードキャッシュ（ファイルの更新日時ベース、24時間有効）
get_cached_url() {
  local file="$1"
  local basename=$(basename "$file")
  local mtime=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
  local cache_file="$CACHE_DIR/${basename}.${mtime}"

  if [ -f "$cache_file" ]; then
    local cache_age=$(( $(date +%s) - $(stat -c %Y "$cache_file" 2>/dev/null || stat -f %m "$cache_file" 2>/dev/null) ))
    if [ "$cache_age" -lt 86400 ]; then
      cat "$cache_file"
      return 0
    fi
  fi
  return 1
}

save_cache() {
  local file="$1"
  local url="$2"
  local basename=$(basename "$file")
  local mtime=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
  mkdir -p "$CACHE_DIR"
  # 同じファイルの古いキャッシュを削除
  rm -f "$CACHE_DIR/${basename}."* 2>/dev/null
  echo "$url" > "$CACHE_DIR/${basename}.${mtime}"
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --name|-n)  NAME="$2"; shift 2 ;;
    --prompt|-p) PROMPT="$2"; shift 2 ;;
    --chars|-c)  CHARS="$2"; shift 2 ;;
    --size|-s)   SIZE="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: bash scripts/generate-event.sh --name <id> --prompt \"...\" [--chars heroine,liene] [--size landscape_4_3]"
      echo ""
      echo "Options:"
      echo "  --name, -n    Output filename (without extension). Required."
      echo "  --prompt, -p  Generation prompt. Required."
      echo "  --chars, -c   Comma-separated character image names (e.g. heroine,liene)."
      echo "                Files are loaded from documents/characters/{name}.png"
      echo "                Referenced as Figure 1, Figure 2, ... in prompt."
      echo "                If omitted, uses text-to-image model instead."
      echo "  --size, -s    Image size (default: landscape_4_3)"
      echo ""
      echo "Available characters:"
      ls -1 "$CHARS_DIR"/*.png 2>/dev/null | xargs -I{} basename {} .png | sed 's/^/  /'
      echo ""
      echo "Upload cache: $CACHE_DIR (24h TTL, invalidated on file change)"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [ -z "$NAME" ] || [ -z "$PROMPT" ]; then
  echo "Error: --name and --prompt are required" >&2
  echo "Run with --help for usage" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
OUTPUT_FILE="$OUTPUT_DIR/${NAME}.png"

if [ -n "$CHARS" ]; then
  # --- キャラ参照あり: edit モデル ---
  echo "Preparing character images..." >&2
  IFS=',' read -ra CHAR_ARRAY <<< "$CHARS"
  IMAGE_URLS=""

  for char in "${CHAR_ARRAY[@]}"; do
    char=$(echo "$char" | xargs)  # trim
    FILE="$CHARS_DIR/${char}.png"
    if [ ! -f "$FILE" ]; then
      echo "Error: Character image not found: $FILE" >&2
      exit 1
    fi

    # キャッシュ確認
    URL=$(get_cached_url "$FILE" 2>/dev/null || echo "")
    if [ -n "$URL" ]; then
      echo "  $char: cached -> $URL" >&2
    else
      echo "  $char: uploading..." >&2
      URL=$(bash "$SKILL_DIR/upload.sh" --file "$FILE" 2>/dev/null | head -1)
      if [ -z "$URL" ]; then
        echo "Error: Failed to upload $FILE" >&2
        exit 1
      fi
      save_cache "$FILE" "$URL"
      echo "  $char: uploaded -> $URL" >&2
    fi

    if [ -n "$IMAGE_URLS" ]; then
      IMAGE_URLS="$IMAGE_URLS, "
    fi
    IMAGE_URLS="${IMAGE_URLS}\"$URL\""
  done

  echo "Generating with character references (edit model)..." >&2
  RESULT=$(bash "$SKILL_DIR/generate.sh" \
    --prompt "$PROMPT" \
    --model "$MODEL" \
    --size "$SIZE" \
    --extra "{\"image_urls\": [$IMAGE_URLS], \"enable_safety_checker\": false}" \
    --timeout 180 2>/dev/null)
else
  # --- キャラ参照なし: text-to-image モデル ---
  echo "Generating without character references (text-to-image model)..." >&2
  RESULT=$(bash "$SKILL_DIR/generate.sh" \
    --prompt "$PROMPT" \
    --model "$T2I_MODEL" \
    --size "$SIZE" \
    --timeout 180 2>/dev/null)
fi

# 結果からURLを取得
IMG_URL=$(echo "$RESULT" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$IMG_URL" ]; then
  echo "Error: Failed to get image URL from result" >&2
  echo "$RESULT" >&2
  exit 1
fi

# ダウンロード
echo "Downloading to $OUTPUT_FILE..." >&2
curl -sL "$IMG_URL" -o "$OUTPUT_FILE"
echo "Done! Saved to $OUTPUT_FILE" >&2
echo "$OUTPUT_FILE"
