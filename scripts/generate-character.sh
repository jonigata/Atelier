#!/bin/bash
# キャラクター画像生成ラッパー（立ち絵 + キャラクターシート）
# Usage: bash scripts/generate-character.sh --name <id> --desc "character appearance" [--from 2]
#
# 3ステップで生成:
#   Step 1: seedream v4.5/edit — 参照画像のスタイルに合わせた立ち絵生成 → <name>-1.png
#   Step 2: seedream v4.5/edit — 正面向き・手を下ろした設定画ポーズに修正
#   Step 3: nano-banana-pro/edit — キャラクターシート生成（3方向 + 3表情） → <name>.png
#
# Examples:
#   # 全ステップ実行
#   bash scripts/generate-character.sh --name melda \
#     --desc "A plump, cheerful bakery woman in her late 40s. Fluffy flax-colored hair in a bun..."
#
#   # Step 1 完了済み → Step 2 から実行（既存の <name>-1.png を使用）
#   bash scripts/generate-character.sh --name melda --from 2

set -e

SKILL_DIR="/home/hirayama/.claude/skills/fal-generate/scripts"
CHARS_DIR="documents/design/characters"
CACHE_DIR="/tmp/fal-upload-cache"
EDIT_MODEL="fal-ai/bytedance/seedream/v4.5/edit"
SHEET_MODEL="fal-ai/nano-banana-pro/edit"

NAME=""
DESC=""
FROM_STEP=1
REF_IMAGE="heroine-1.png"

# --- アップロードキャッシュ（generate-event.sh と同じ仕組み） ---
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
  rm -f "$CACHE_DIR/${basename}."* 2>/dev/null
  echo "$url" > "$CACHE_DIR/${basename}.${mtime}"
}

upload_file() {
  local file="$1"
  local label="$2"
  local url
  url=$(get_cached_url "$file" 2>/dev/null || echo "")
  if [ -n "$url" ]; then
    echo "  $label: cached -> $url" >&2
  else
    echo "  $label: uploading..." >&2
    url=$(bash "$SKILL_DIR/upload.sh" --file "$file" 2>/dev/null | head -1)
    if [ -z "$url" ]; then
      echo "Error: Failed to upload $file" >&2
      exit 1
    fi
    save_cache "$file" "$url"
    echo "  $label: uploaded -> $url" >&2
  fi
  echo "$url"
}

# --- 引数パース ---
while [[ $# -gt 0 ]]; do
  case $1 in
    --name|-n)  NAME="$2"; shift 2 ;;
    --desc|-d)  DESC="$2"; shift 2 ;;
    --from|-f)  FROM_STEP="$2"; shift 2 ;;
    --ref|-r)   REF_IMAGE="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: bash scripts/generate-character.sh --name <id> --desc \"...\" [options]"
      echo ""
      echo "Options:"
      echo "  --name, -n   Character ID (e.g. melda). Required."
      echo "  --desc, -d   Character appearance in English. Required for step 1."
      echo "  --from, -f   Start from step N (default: 1)."
      echo "               Use --from 2 to skip step 1 (requires existing <name>-1.png)."
      echo "               Use --from 3 to skip step 1-2 (requires existing <name>-1.png)."
      echo "  --ref, -r    Style reference image filename (default: heroine-1.png)."
      echo "               Looked up in $CHARS_DIR/"
      echo ""
      echo "Steps:"
      echo "  1: Generate character standing image (seedream v4.5/edit, 1920x1920)"
      echo "     Output: $CHARS_DIR/<name>-1.png"
      echo "  2: Edit to front-facing pose (seedream v4.5/edit)"
      echo "  3: Generate character sheet (nano-banana-pro/edit)"
      echo "     Output: $CHARS_DIR/<name>.png"
      echo ""
      echo "Existing characters:"
      ls -1 "$CHARS_DIR"/*-1.png 2>/dev/null | xargs -I{} basename {} -1.png | sed 's/^/  /'
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# --- バリデーション ---
if [ -z "$NAME" ]; then
  echo "Error: --name is required" >&2
  exit 1
fi

if [ "$FROM_STEP" -le 1 ] && [ -z "$DESC" ]; then
  echo "Error: --desc is required for step 1" >&2
  echo "Use --from 2 to skip step 1 (requires existing ${NAME}-1.png)" >&2
  exit 1
fi

mkdir -p "$CHARS_DIR"

STEP1_FILE="$CHARS_DIR/${NAME}-1.png"
SHEET_FILE="$CHARS_DIR/${NAME}.png"
SHEET_TEMPLATE="$CHARS_DIR/character_sheet.png"

# ================================================================
# Step 1: 立ち絵生成
# ================================================================
if [ "$FROM_STEP" -le 1 ]; then
  echo "=== Step 1/3: Generating standing image ===" >&2

  REF_FILE="$CHARS_DIR/$REF_IMAGE"
  if [ ! -f "$REF_FILE" ]; then
    echo "Error: Reference image not found: $REF_FILE" >&2
    exit 1
  fi

  REF_URL=$(upload_file "$REF_FILE" "ref($REF_IMAGE)")

  STEP1_PROMPT="Generate a new character in the exact same art style as Figure 1. Simple lines, high-saturation outlines, white background, subtle expression, healing/comforting style, matte texture, light shadows, full body standing pose. Match the touch and style of Figure 1 exactly. The new character is: $DESC"

  echo "  Generating..." >&2
  RESULT=$(bash "$SKILL_DIR/generate.sh" \
    --prompt "$STEP1_PROMPT" \
    --model "$EDIT_MODEL" \
    --extra "{\"image_urls\": [\"$REF_URL\"], \"image_size\": {\"width\": 1920, \"height\": 1920}, \"enable_safety_checker\": false}" \
    --timeout 180 2>/dev/null)

  IMG_URL=$(echo "$RESULT" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -z "$IMG_URL" ]; then
    echo "Error: Step 1 failed" >&2
    echo "$RESULT" >&2
    exit 1
  fi

  curl -sL "$IMG_URL" -o "$STEP1_FILE"
  echo "  Saved: $STEP1_FILE" >&2
else
  echo "=== Step 1/3: Skipped (using existing $STEP1_FILE) ===" >&2
fi

# Step 2 以降で -1.png が必要
if [ ! -f "$STEP1_FILE" ]; then
  echo "Error: $STEP1_FILE not found. Run step 1 first or create it manually." >&2
  exit 1
fi

# ================================================================
# Step 2: 正面ポーズ修正
# ================================================================
if [ "$FROM_STEP" -le 2 ]; then
  echo "=== Step 2/3: Editing to front-facing pose ===" >&2

  STEP1_URL=$(upload_file "$STEP1_FILE" "${NAME}-1.png")

  STEP2_PROMPT="Character design reference pose. Modify Figure 1 to face directly forward (front view). The character should be standing in a completely straight, front-facing full body pose with arms relaxed and hanging naturally at her sides. Keep the exact same character design, clothing, colors, and art style. White background. Simple natural standing pose suitable for a character reference sheet."

  echo "  Generating..." >&2
  RESULT=$(bash "$SKILL_DIR/generate.sh" \
    --prompt "$STEP2_PROMPT" \
    --model "$EDIT_MODEL" \
    --extra "{\"image_urls\": [\"$STEP1_URL\"], \"image_size\": {\"width\": 1920, \"height\": 1920}, \"enable_safety_checker\": false}" \
    --timeout 180 2>/dev/null)

  STEP2_URL=$(echo "$RESULT" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ -z "$STEP2_URL" ]; then
    echo "Error: Step 2 failed" >&2
    echo "$RESULT" >&2
    exit 1
  fi

  echo "  Done (intermediate, not saved to disk)" >&2
else
  echo "=== Step 2/3: Skipped ===" >&2
  # Step 3 で -1.png をそのまま使う
  STEP2_URL=$(upload_file "$STEP1_FILE" "${NAME}-1.png")
fi

# ================================================================
# Step 3: キャラクターシート生成
# ================================================================
echo "=== Step 3/3: Generating character sheet ===" >&2

if [ ! -f "$SHEET_TEMPLATE" ]; then
  echo "Error: Character sheet template not found: $SHEET_TEMPLATE" >&2
  exit 1
fi

TEMPLATE_URL=$(upload_file "$SHEET_TEMPLATE" "character_sheet.png")

STEP3_PROMPT="Character design sheet. Use Figure 1 as the character reference and Figure 2 as the layout template. Fill the template with the character from Figure 1: FRONT view (front-facing full body), SIDE view (side profile full body), BACK view (rear full body) in the top row. FACE - HAPPY (cheerful smiling expression close-up), FACE - ANGRY (upset expression close-up), FACE - SAD (sad expression close-up) in the bottom row. Keep the exact same character design, outfit, and art style throughout all views. Clean white background in each panel."

echo "  Generating..." >&2
RESULT=$(bash "$SKILL_DIR/generate.sh" \
  --prompt "$STEP3_PROMPT" \
  --model "$SHEET_MODEL" \
  --extra "{\"image_urls\": [\"$STEP2_URL\", \"$TEMPLATE_URL\"]}" \
  --timeout 240 2>/dev/null)

IMG_URL=$(echo "$RESULT" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$IMG_URL" ]; then
  echo "Error: Step 3 failed" >&2
  echo "$RESULT" >&2
  exit 1
fi

curl -sL "$IMG_URL" -o "$SHEET_FILE"
echo "  Saved: $SHEET_FILE" >&2

# --- プロンプト保存 ---
PROMPT_DIR="documents/image-prompts/characters"
mkdir -p "$PROMPT_DIR"
if [ -n "$DESC" ]; then
  echo "$DESC" > "$PROMPT_DIR/${NAME}.txt"
  echo "Prompt saved to $PROMPT_DIR/${NAME}.txt" >&2
fi

echo "" >&2
echo "Done! Generated files:" >&2
echo "  Standing image: $STEP1_FILE" >&2
echo "  Character sheet: $SHEET_FILE" >&2
echo "$SHEET_FILE"
