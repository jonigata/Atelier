#!/bin/bash
# キャラクター画像生成ラッパー（立ち絵 + キャラクターシート + 表情画像）
# Usage: bash scripts/generate-character.sh --name <id> --desc "character appearance" [--from 2]
#
# 4ステップで生成:
#   Step 1: seedream v4.5/edit — 参照画像のスタイルに合わせた立ち絵生成 → <name>-1.png
#   Step 2: seedream v4.5/edit — 正面向き・手を下ろした設定画ポーズに修正
#   Step 3: nano-banana-pro/edit — キャラクターシート生成（3方向 + 3表情） → <name>.png
#   Step 4: seedream v4.5/edit — 表情画像5枚（証明写真画角） → <name>-face-*.png
#
# Examples:
#   # 全ステップ実行
#   bash scripts/generate-character.sh --name melda \
#     --desc "A plump, cheerful bakery woman in her late 40s. Fluffy flax-colored hair in a bun..."
#
#   # Step 1 完了済み → Step 2 から実行（既存の <name>-1.png を使用）
#   bash scripts/generate-character.sh --name melda --from 2
#
#   # 表情画像だけ生成
#   bash scripts/generate-character.sh --name melda --from 4

set -e

SKILL_DIR="/home/hirayama/.claude/skills/fal-generate/scripts"
CHARS_DIR="documents/design/characters"
CACHE_DIR="/tmp/fal-upload-cache"
EDIT_MODEL="fal-ai/bytedance/seedream/v4.5/edit"
SHEET_MODEL="fal-ai/nano-banana-pro/edit"

NAME=""
DESC=""
FROM_STEP=1
REF_IMAGE="heroine/heroine-1.png"
EXPR_ONLY=""  # --expr: 特定表情だけ再生成

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
    --expr|-e)  EXPR_ONLY="$2"; FROM_STEP=4; shift 2 ;;
    --help|-h)
      echo "Usage: bash scripts/generate-character.sh --name <id> --desc \"...\" [options]"
      echo ""
      echo "Options:"
      echo "  --name, -n   Character ID (e.g. melda). Required."
      echo "  --desc, -d   Character appearance in English. Required for step 1."
      echo "  --from, -f   Start from step N (default: 1)."
      echo "               Use --from 2 to skip step 1 (requires existing <name>-1.png)."
      echo "               Use --from 3 to skip step 1-2 (requires existing <name>-1.png)."
      echo "  --ref, -r    Style reference image path relative to $CHARS_DIR/"
      echo "               (default: heroine/heroine-1.png)"
      echo "  --expr, -e   Regenerate a specific expression only (e.g. --expr angry)."
      echo "               Requires existing neutral. Implies --from 4."
      echo ""
      echo "Steps:"
      echo "  1: Generate character standing image (seedream v4.5/edit, 1920x1920)"
      echo "     Output: $CHARS_DIR/<name>/<name>-1.png"
      echo "  2: Edit to front-facing pose (seedream v4.5/edit)"
      echo "  3: Generate character sheet (nano-banana-pro/edit)"
      echo "     Output: $CHARS_DIR/<name>/<name>.png"
      echo "  4: Generate expression portraits (seedream v4.5/edit, 1920x1920)"
      echo "     Step 4a: Generate neutral portrait from -1.png"
      echo "     Step 4b: Derive other expressions from neutral"
      echo "     Output: $CHARS_DIR/<name>/<name>-face-{neutral,happy,angry,...}.png"
      echo ""
      echo "Expressions: neutral, happy, angry, sad, surprised,"
      echo "             embarrassed, smug, worried, determined"
      echo ""
      echo "Existing characters:"
      ls -1d "$CHARS_DIR"/*/ 2>/dev/null | xargs -I{} basename {} | sed 's/^/  /'
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

CHAR_DIR="$CHARS_DIR/${NAME}"
mkdir -p "$CHAR_DIR"

STEP1_FILE="$CHAR_DIR/${NAME}-1.png"
SHEET_FILE="$CHAR_DIR/${NAME}.png"
SHEET_TEMPLATE="$CHARS_DIR/character_sheet.png"

# ================================================================
# Step 1: 立ち絵生成
# ================================================================
if [ "$FROM_STEP" -le 1 ]; then
  echo "=== Step 1/4: Generating standing image ===" >&2

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
  echo "=== Step 1/4: Skipped (using existing $STEP1_FILE) ===" >&2
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
  echo "=== Step 2/4: Editing to front-facing pose ===" >&2

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
  echo "=== Step 2/4: Skipped ===" >&2
  # Step 3 で -1.png をそのまま使う
  STEP2_URL=$(upload_file "$STEP1_FILE" "${NAME}-1.png")
fi

# ================================================================
# Step 3: キャラクターシート生成
# ================================================================
if [ "$FROM_STEP" -le 3 ]; then
echo "=== Step 3/4: Generating character sheet ===" >&2

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

else
  echo "=== Step 3/4: Skipped ===" >&2
fi

# ================================================================
# Step 4: 表情画像生成（neutral → 派生8枚）
# ================================================================
# 各表情に3バリエーション（|区切り）、ランダムで1つ選ばれる
EXPR_VARIANTS=(
  "happy|huge smile, sparkling eyes with star/sparkle highlights, laughing with mouth wide open, manga style joy|warm gentle smile, closed happy eyes (^^), soft blush on cheeks, heartwarming manga expression|big toothy grin, one eye winking, peace sign energy, cheerful manga style happiness"
  "angry|cross-popping vein mark on forehead, sharp fanged teeth, intense glare, manga style anger|furrowed brows, gritted teeth, trembling with rage, fiery aura background effect, manga fury|puffed cheeks, comically angry red face, steam from ears, chibi-style manga tantrum"
  "sad|large glistening teardrop eyes, tear streams down cheeks, wobbly mouth, manga style crying|single tear rolling down cheek, downcast eyes, biting lower lip, quiet manga sadness|waterfall tears flooding down, wailing open mouth, comically exaggerated manga bawling"
  "surprised|white circle eyes, shrunk dot pupils, exclamation mark effect, small open mouth, manga style shock|jaw dropped wide open, popping eyes, sweat drop, double-take manga surprise|frozen stiff, blank white eyes, soul leaving body, comedic manga shock"
  "embarrassed|heavy blush across nose and cheeks, spiral eyes or averted gaze, steam puffs from head, manga style embarrassment|looking away shyly, fingers touching together, light pink blush, bashful manga expression|face completely red, hands covering cheeks, wavy embarrassed mouth, flustered manga style"
  "smug|half-lidded cat-like eyes, smirk with one corner of mouth raised, chin up, manga style smugness|glasses glinting/flashing white, pushing glasses up, confident knowing smile, intellectual manga smug|closed eyes with huge satisfied grin, arms-crossed energy, triumphant manga expression"
  "worried|sweat drop on temple, wavy mouth, upturned eyebrows, nervous manga style anxiety|biting fingernail, shifty darting eyes, multiple small sweat drops, uneasy manga worry|pale blue face, trembling, ghost of soul hovering above, comedic manga dread"
  "determined|flame/sparkle in eyes, clenched teeth showing, intense focused gaze, manga style fighting spirit|glowing eyes with star highlights, confident smirk, wind-swept hair effect, heroic manga resolve|bandana/headband tightening energy, burning background aura, fired-up manga determination"
)

# バリエーションからランダム選択してEXPRESSIONS配列を構築
EXPRESSIONS=()
for VARIANT_LINE in "${EXPR_VARIANTS[@]}"; do
  IFS='|' read -ra PARTS <<< "$VARIANT_LINE"
  EXPR_KEY="${PARTS[0]}"
  # 1,2,3 からランダムに選択
  IDX=$(( (RANDOM % 3) + 1 ))
  EXPR_DESC="${PARTS[$IDX]}"
  EXPRESSIONS+=("${EXPR_KEY}:${EXPR_DESC}")
  echo "  [$EXPR_KEY] Variant $IDX selected" >&2
done

NEUTRAL_FILE="$CHAR_DIR/${NAME}-face-neutral.png"

if [ "$FROM_STEP" -le 4 ]; then
  echo "=== Step 4/4: Generating expression portraits ===" >&2

  # --- Step 4a: neutral 生成（既存がなければ、または全生成モード） ---
  if [ -z "$EXPR_ONLY" ] || [ "$EXPR_ONLY" = "neutral" ]; then
    if [ ! -f "$NEUTRAL_FILE" ] || [ -z "$EXPR_ONLY" ]; then
      echo "  [neutral] Generating from standing image..." >&2
      CHAR_REF_URL=$(upload_file "$STEP1_FILE" "${NAME}-1.png")

      RESULT=$(bash "$SKILL_DIR/generate.sh" \
        --prompt "Close-up portrait of Figure 1, head and shoulders, centered in frame, white background. Calm neutral expression, looking straight ahead. Same character, same art style, same outfit." \
        --model "$EDIT_MODEL" \
        --extra "{\"image_urls\": [\"$CHAR_REF_URL\"], \"image_size\": {\"width\": 1920, \"height\": 1920}, \"enable_safety_checker\": false}" \
        --timeout 180 2>/dev/null)

      IMG_URL=$(echo "$RESULT" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
      if [ -z "$IMG_URL" ]; then
        echo "Error: Failed to generate neutral portrait" >&2
        echo "$RESULT" >&2
        exit 1
      fi

      curl -sL "$IMG_URL" -o "$NEUTRAL_FILE"
      echo "  [neutral] Saved: $NEUTRAL_FILE" >&2
    fi

    # neutral だけ再生成の場合はここで終了
    if [ "$EXPR_ONLY" = "neutral" ]; then
      # neutral の縮小版も生成
      STATIC_DIR="static/images/characters/${NAME}"
      mkdir -p "$STATIC_DIR"
      python3 -c "from PIL import Image; Image.open('$NEUTRAL_FILE').resize((512,512), Image.LANCZOS).save('$STATIC_DIR/${NAME}-face-neutral.png')"
      echo "  [neutral] Resized: $STATIC_DIR/${NAME}-face-neutral.png" >&2
      echo "" >&2
      echo "Done! Regenerated neutral only." >&2
      echo "$NEUTRAL_FILE"
      exit 0
    fi
  fi

  # --- neutral が必要 ---
  if [ ! -f "$NEUTRAL_FILE" ]; then
    echo "Error: $NEUTRAL_FILE not found. Run step 4 without --expr first." >&2
    exit 1
  fi

  NEUTRAL_URL=$(upload_file "$NEUTRAL_FILE" "${NAME}-face-neutral.png")

  # --- Step 4b: neutral から各表情を派生 ---
  for EXPR_ENTRY in "${EXPRESSIONS[@]}"; do
    EXPR_KEY="${EXPR_ENTRY%%:*}"
    EXPR_DESC="${EXPR_ENTRY#*:}"

    # --expr 指定時は該当する表情だけ生成
    if [ -n "$EXPR_ONLY" ] && [ "$EXPR_ONLY" != "$EXPR_KEY" ]; then
      continue
    fi

    FACE_FILE="$CHAR_DIR/${NAME}-face-${EXPR_KEY}.png"
    echo "  [$EXPR_KEY] Generating..." >&2

    RESULT=$(bash "$SKILL_DIR/generate.sh" \
      --prompt "Redraw Figure 1 with a different expression. New expression: ${EXPR_DESC}. Same character, same art style, same outfit. Head and shoulders portrait, white background. The camera angle and head tilt may vary naturally to suit the emotion." \
      --model "$EDIT_MODEL" \
      --extra "{\"image_urls\": [\"$NEUTRAL_URL\"], \"image_size\": {\"width\": 1920, \"height\": 1920}, \"enable_safety_checker\": false}" \
      --timeout 180 2>/dev/null)

    IMG_URL=$(echo "$RESULT" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -z "$IMG_URL" ]; then
      echo "  [$EXPR_KEY] Warning: Failed, skipping" >&2
      echo "$RESULT" >&2
      continue
    fi

    curl -sL "$IMG_URL" -o "$FACE_FILE"
    echo "  [$EXPR_KEY] Saved: $FACE_FILE" >&2
  done

  # --- 縮小版生成 (512x512) ---
  STATIC_DIR="static/images/characters/${NAME}"
  mkdir -p "$STATIC_DIR"
  echo "  Resizing to 512x512..." >&2
  for SRC in "$CHAR_DIR"/${NAME}-face-*.png; do
    [ -f "$SRC" ] || continue
    BASENAME=$(basename "$SRC")
    # --expr 指定時はその表情 + neutral だけリサイズ
    if [ -n "$EXPR_ONLY" ]; then
      case "$BASENAME" in
        *-face-${EXPR_ONLY}.png|*-face-neutral.png) ;;
        *) continue ;;
      esac
    fi
    python3 -c "from PIL import Image; Image.open('$SRC').resize((512,512), Image.LANCZOS).save('$STATIC_DIR/$BASENAME')"
  done
  echo "  Resized: $STATIC_DIR/" >&2
fi

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
echo "  Expressions: $CHAR_DIR/${NAME}-face-*.png" >&2
echo "$SHEET_FILE"
