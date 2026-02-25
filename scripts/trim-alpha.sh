#!/bin/bash
# 透過でないピクセルの最小外接矩形でトリムする
# Usage: bash scripts/trim-alpha.sh <input.png> [output.png]
set -e

INPUT="$1"
OUTPUT="${2:-$1}"

if [ -z "$INPUT" ]; then
  echo "Usage: bash scripts/trim-alpha.sh <input.png> [output.png]"
  exit 1
fi

# アルファチャンネルを抽出→しきい値で二値化→不透明部分の境界を取得
# alpha>=50%のピクセルを「不透明」とみなす
FUZZ="${FUZZ:-10}"
BBOX=$(convert "$INPUT" -alpha extract -negate -threshold "${FUZZ}%" -trim -format '%wx%h%O' info:-)
echo "Bounding box: $BBOX"

convert "$INPUT" -crop "$BBOX" +repage "$OUTPUT"
echo "Saved: $OUTPUT ($(identify -format '%wx%h' "$OUTPUT"))"
