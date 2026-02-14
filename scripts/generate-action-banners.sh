#!/bin/bash
# コマンドボタン用バナー画像生成（デフォルメキャラ参照版）
# 2段階: Phase1=キャラデフォルメ化, Phase2=デフォルメ参照でバナー生成
#
# Usage:
#   bash scripts/generate-action-banners.sh                    # 全行程
#   bash scripts/generate-action-banners.sh --phase1           # デフォルメ化のみ
#   bash scripts/generate-action-banners.sh --phase2           # バナー生成のみ(デフォルメ済み前提)
#   bash scripts/generate-action-banners.sh --phase2 alchemy   # 特定バナーのみ

set -e

SKILL_DIR="/home/hirayama/.claude/skills/fal-generate/scripts"
EDIT_MODEL="fal-ai/bytedance/seedream/v4.5/edit"
CHARS_DIR="documents/design/characters"
CHIBI_DIR="static/images/actions/chibi-refs"
OUTPUT_DIR="static/images/actions"
PROMPT_DIR="documents/image-prompts/actions"
CACHE_DIR="/tmp/fal-upload-cache"

mkdir -p "$CHIBI_DIR" "$OUTPUT_DIR" "$PROMPT_DIR"

# --- Upload helpers (from generate-event.sh) ---
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
  local url
  url=$(get_cached_url "$file" 2>/dev/null || echo "")
  if [ -n "$url" ]; then
    echo "  $(basename "$file"): cached" >&2
    echo "$url"
    return 0
  fi
  echo "  $(basename "$file"): uploading..." >&2
  url=$(bash "$SKILL_DIR/upload.sh" --file "$file" 2>/dev/null | head -1)
  if [ -z "$url" ]; then
    echo "Error: Failed to upload $file" >&2
    return 1
  fi
  save_cache "$file" "$url"
  echo "$url"
}

# ===========================================================
#  Phase 1: キャラクター画像をデフォルメ化
# ===========================================================
phase1() {
  local CHARS=("heroine" "liene" "ren" "fee" "melda")
  local CHIBI_STYLE="chibi super-deformed anime character, 2.5 head tall proportions, big round head, large cute round eyes, small rounded body, same outfit details and color scheme as Figure 1, full body standing pose, cheerful expression, clean anime illustration, soft pastel colors, simple light background, single character only, no text"

  echo "===== Phase 1: Generating chibi character references =====" >&2

  for char in "${CHARS[@]}"; do
    local SRC="$CHARS_DIR/${char}/${char}-1.png"
    local DST="$CHIBI_DIR/${char}-chibi.png"

    if [ ! -f "$SRC" ]; then
      echo "Warning: $SRC not found, skipping" >&2
      continue
    fi

    echo "" >&2
    echo "--- Deforming: $char ---" >&2
    local IMG_URL
    IMG_URL=$(upload_file "$SRC")

    local RESULT
    RESULT=$(bash "$SKILL_DIR/generate.sh" \
      --prompt "$CHIBI_STYLE" \
      --model "$EDIT_MODEL" \
      --size "square" \
      --extra "{\"image_urls\": [\"$IMG_URL\"], \"enable_safety_checker\": false}" \
      --timeout 180 2>&2)

    local OUT_URL
    OUT_URL=$(echo "$RESULT" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -z "$OUT_URL" ]; then
      echo "Error: Failed for $char" >&2
      echo "$RESULT" >&2
      continue
    fi

    curl -sL "$OUT_URL" -o "$DST"
    echo "Saved: $DST" >&2
  done

  echo "" >&2
  echo "Phase 1 complete!" >&2
}

# ===========================================================
#  Phase 2: デフォルメ参照を使ってバナー生成
# ===========================================================
phase2() {
  local TARGET="$1"
  local STYLE="chibi super-deformed anime style, 2-3 head tall proportions, cute big round eyes, small rounded body, flat cel-shaded coloring, clean solid colors, bold outlines, minimal shading, fantasy RPG game illustration, wide banner composition, no text, no title, no UI elements, no watermark"

  echo "" >&2
  echo "===== Phase 2: Generating action banners =====" >&2

  # Upload chibi refs
  echo "Uploading chibi references..." >&2
  declare -A CHIBI_URLS
  for f in "$CHIBI_DIR"/*-chibi.png; do
    [ -f "$f" ] || continue
    local name=$(basename "$f" | sed 's/-chibi\.png//')
    CHIBI_URLS[$name]=$(upload_file "$f")
  done

  # Banner definitions: action -> chars (comma-separated) and prompt
  # Each banner has distinct color palette and composition
  declare -A BANNER_CHARS
  declare -A BANNER_PROMPTS

  # alchemy: orange/amber warm tones, workshop interior
  BANNER_CHARS[alchemy]="heroine"
  BANNER_PROMPTS[alchemy]="Figure 1 (girl alchemist in blue beret and blue dress) stirring a large bubbling cauldron with a wooden ladle, magical sparkles rising, glass bottles of colorful potions and herbs on table, stone workshop interior, dominant warm orange and amber color palette, candlelight glow, $STYLE"

  # quest: blue/cool sky tones, outdoor village, no protagonist
  BANNER_CHARS[quest]="liene"
  BANNER_PROMPTS[quest]="Figure 1 (village girl with light brown braided hair in green dress and white blouse) pointing at a wooden bulletin board covered with posted request papers and notices, rustic village square, dominant cool blue sky and white cloud tones, bright daylight, $STYLE"

  # expedition: vivid green forest tones, no protagonist
  BANNER_CHARS[expedition]="ren,fee"
  BANNER_PROMPTS[expedition]="Figure 1 (boy swordsman with grey hair and green cloak) leading the way with sword, Figure 2 (girl scout with blonde hair and crossbow) scouting ahead, walking on a lush forest trail with gathering baskets, dominant vivid green and emerald tones, dappled sunlight, $STYLE"

  # shop: warm pink/golden interior, no protagonist
  BANNER_CHARS[shop]="melda"
  BANNER_PROMPTS[shop]="Figure 1 (plump cheerful shopkeeper woman with bun hair and apron) proudly presenting colorful goods behind a shop counter, shelves full of bottles potions and fantasy items, dominant warm pink and golden yellow tones, cozy shop interior lighting, $STYLE"

  # inventory: purple/jewel tones, items focus, no character
  BANNER_CHARS[inventory]="heroine"
  BANNER_PROMPTS[inventory]="Figure 1 (girl in blue beret and blue dress) with open leather shoulder bag, colorful potions crystals herbs ingots and items spread out beautifully on wooden floor, dominant purple and jewel tones, magical sparkles on items, $STYLE"

  # rest: soft sunset yellow/warm tones, pajamas, bed
  BANNER_CHARS[rest]="heroine"
  BANNER_PROMPTS[rest]="Figure 1 (same girl but wearing cozy white pajamas instead of her usual outfit, dark navy bob cut hair loose without beret) peacefully sleeping in a warm fluffy bed with a soft pillow and blanket, dominant soft sunset yellow and warm orange tones, golden evening light through curtain, cozy bedroom atmosphere, $STYLE"

  # study: deep indigo/candlelight, books focus
  BANNER_CHARS[study]="heroine"
  BANNER_PROMPTS[study]="Figure 1 (girl in blue beret and blue dress) reading a large open alchemy recipe book at a desk, surrounded by tall stacks of old books and scrolls, quill pen and ink, dominant deep indigo blue and candlelight amber tones, dark moody study atmosphere, $STYLE"

  # album: light cream/pastel tones, open illustrated book
  BANNER_CHARS[album]="liene"
  BANNER_PROMPTS[album]="Figure 1 (girl with light brown braided hair in green dress) happily flipping through a beautifully illustrated leather-bound encyclopedia showing colorful item drawings, sparkles of discovery, dominant light cream and soft pastel rainbow tones, bright cheerful atmosphere, $STYLE"

  for action in alchemy quest expedition shop inventory rest study album; do
    if [ -n "$TARGET" ] && [ "$action" != "$TARGET" ]; then
      continue
    fi

    local OUTPUT_FILE="$OUTPUT_DIR/${action}.png"
    local PROMPT="${BANNER_PROMPTS[$action]}"
    local CHARS="${BANNER_CHARS[$action]}"

    echo "" >&2
    echo "========================================" >&2
    echo "Generating banner: $action (chars: $CHARS)" >&2
    echo "========================================" >&2

    # Build image_urls array
    IFS=',' read -ra CHAR_ARRAY <<< "$CHARS"
    local IMAGE_URLS=""
    for char in "${CHAR_ARRAY[@]}"; do
      char=$(echo "$char" | xargs)
      local url="${CHIBI_URLS[$char]}"
      if [ -z "$url" ]; then
        echo "Warning: No chibi ref for $char, skipping this banner" >&2
        continue 2
      fi
      if [ -n "$IMAGE_URLS" ]; then
        IMAGE_URLS="$IMAGE_URLS, "
      fi
      IMAGE_URLS="${IMAGE_URLS}\"$url\""
    done

    local RESULT
    RESULT=$(bash "$SKILL_DIR/generate.sh" \
      --prompt "$PROMPT" \
      --model "$EDIT_MODEL" \
      --size "landscape_4_3" \
      --extra "{\"image_urls\": [$IMAGE_URLS], \"enable_safety_checker\": false}" \
      --timeout 180 2>&2)

    local IMG_URL
    IMG_URL=$(echo "$RESULT" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -z "$IMG_URL" ]; then
      echo "Error: Failed for $action" >&2
      echo "$RESULT" >&2
      continue
    fi

    curl -sL "$IMG_URL" -o "$OUTPUT_FILE"
    echo "$PROMPT" > "$PROMPT_DIR/${action}.txt"
    echo "Saved: $OUTPUT_FILE" >&2
  done

  echo "" >&2
  echo "Phase 2 complete!" >&2
}

# ===========================================================
#  Main
# ===========================================================
case "${1:-}" in
  --phase1)
    phase1
    ;;
  --phase2)
    phase2 "$2"
    ;;
  *)
    phase1
    phase2 "$1"
    ;;
esac

echo "All done!" >&2
