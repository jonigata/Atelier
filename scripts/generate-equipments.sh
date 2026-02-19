#!/bin/bash
# 全機材画像一括生成スクリプト
# Usage: bash scripts/generate-equipments.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GENERATE="$SCRIPT_DIR/generate-equipment.sh"

# id|desc（英語の画像説明）
ITEMS=(
  # === レア錬金釜 (4) ===
  "cauldron_double_distill|ornate double-layered distillation cauldron with two glass tubes connecting upper and lower chambers, copper and brass, steam vents"
  "cauldron_spirit|ethereal spirit cauldron glowing with blue magical aura, ornate silver cauldron with floating rune symbols"
  "cauldron_reflux|dark iron crucible with reflux coil tubes wrapped around it, green liquid bubbling inside, alchemical apparatus"
  "cauldron_chain|large black cast iron cauldron with chain links decorating the rim, orange magical flames underneath"

  # === レア時間・行動系 (3) ===
  "hourglass|elegant magical hourglass with golden frame, glowing blue sand flowing upward, time magic artifact"
  "auto_stirrer|mechanical automatic stirring device with brass gears and a wooden spoon, clockwork mechanism, steampunk alchemy tool"
  "knowledge_ledge|ornate wooden book stand with an open glowing spellbook, magical reading lectern with carved runes"

  # === レア素材・調合補助系 (4) ===
  "universal_scale|golden balance scale with magical floating weights, ornate alchemical measuring instrument"
  "mimic_mirror|oval standing mirror with ornate silver frame, surface showing a shimmering magical reflection"
  "refinement_flask|elegant glass flask with golden stopper, swirling purified liquid inside, refined alchemical vessel"
  "abundant_jar|large ceramic jar overflowing with colorful herbs and crystals, abundance motif, golden decorations"

  # === レア経済・報酬系 (2) ===
  "golden_athanor|magnificent golden athanor furnace with ruby gemstones embedded, alchemical gold-making furnace"
  "appraisal_monocle|fancy golden monocle with magnifying lens, jeweler's loupe with chain, appraisal tool"

  # === レア変わり種 (2) ===
  "crystal_ball|mystical crystal ball on ornate silver stand, swirling purple mist inside, fortune telling orb"
  "decomposition_grimoire|ancient leather-bound grimoire with glowing green runes, decomposition magic book, dark magical tome"

  # === コモン錬金釜 (10) ===
  "cauldron_lucky_pot|small copper pot with four-leaf clover engraving, lucky charm cauldron"
  "cauldron_twin|pair of connected twin cauldrons sharing a base, matching set of two small pots"
  "cauldron_echo|rounded cauldron with sound wave patterns etched on surface, resonating pot with ripple designs"
  "cauldron_crystal|transparent crystal cauldron, clear glass cooking pot with faceted surface"
  "cauldron_silver|polished silver cauldron with elegant engravings, shiny metallic pot"
  "cauldron_clay|rustic brown clay crucible, earthenware pot with ceramic texture"
  "cauldron_salvage|well-worn but sturdy cooking pot with patches and repairs, thrifty salvage cauldron"
  "cauldron_rhythm|small hand pot with musical note decorations, rhythmic cooking pan with beat marks"
  "cauldron_tempo|large cooking pot with metronome-like handle, tempo markings on the rim"
  "cauldron_stable|heavy cast iron cauldron with thick walls, stable and solid black pot"

  # === コモン時間・行動系 (8) ===
  "small_hourglass|small simple hourglass with wooden frame, basic sand timer"
  "potion_timer|round potion timer with glass bulb and dripping liquid, alchemical countdown device"
  "quick_sand_watch|pocket watch style sand timer, brass pocket hourglass with chain"
  "helper_imp|cute small imp creature sitting, tiny demon helper with horns and wings, chibi fantasy creature"
  "energy_ring|glowing green energy bracelet, magical stamina armband with gem"
  "study_lamp|warm oil lamp for studying, brass desk lamp with warm orange flame"
  "basic_manual|simple leather-bound instruction manual, beginner's textbook with bookmark"
  "reading_glass|round magnifying glass with wooden handle, simple reading lens"

  # === コモン素材・調合補助系 (12) ===
  "measuring_cup|glass measuring cup with measurement lines, alchemical beaker"
  "efficient_mortar|stone mortar and pestle, efficient grinding tool"
  "herb_swap_pouch|small green herb pouch with drawstring, leather herb bag"
  "cloudy_mirror|small cloudy hand mirror with tarnished silver frame"
  "basic_filter|simple cloth filter stretched over a wooden frame, basic strainer"
  "polish_cloth|folded polishing cloth, soft fabric for cleaning"
  "quality_drop|small crystal vial with a single glowing drop of liquid inside"
  "gathering_bag|canvas gathering bag with shoulder strap, foraging satchel"
  "large_basket|large woven wicker basket, oversized carrying basket"
  "dowsing_rod|Y-shaped wooden dowsing rod, divining rod for finding materials"
  "herb_pouch|green leather pouch with herb leaf emblem, medicinal herb bag"
  "mining_pick|small mining pickaxe with wooden handle, prospector's tool"

  # === コモン経済・報酬系 (10) ===
  "silver_pot|small silver pot with price tag, commercial selling vessel"
  "trade_mark|wooden branding stamp with hot iron tip, trade mark seal"
  "luxury_wrap|roll of elegant wrapping paper with ribbon and bow, luxury gift packaging"
  "quest_badge|bronze quest completion badge, adventurer's pin medal"
  "fame_medal|shiny gold fame medal with star emblem, reputation award"
  "quality_seal|red wax seal stamp with quality mark, certification seal"
  "bargain_book|small haggling guidebook, merchant's bargain handbook with coin bookmark"
  "bulk_tag|bundle of price tags tied together, bulk purchase discount tags"
  "thrifty_box|small wooden savings box with coin slot, frugal storage container"
  "sales_ledger|open accounting ledger book with quill pen, sales record book"

  # === コモン変わり種 (10) ===
  "weather_vane|rooftop weather vane with rooster shape, wind direction indicator"
  "notice_board|small wooden notice board with pinned papers, quest bulletin board"
  "almanac|small pocket almanac notebook, calendar handbook with ribbon"
  "recycle_pot|green recycling pot with arrow symbol, upcycling cauldron"
  "scrap_hammer|small dismantling hammer, salvage tool with flat head"
  "salvage_net|woven salvage net, material recovery mesh net"
  "memo_book|small memo notepad with pencil, crafting notes journal"
  "exploration_compass|brass compass with ornate face, explorer's directional tool"
  "storage_shelf|small wooden storage shelf with compartments, organized shelving unit"
  "lucky_coin|shiny golden lucky coin with four-leaf clover emblem, fortune token"
)

echo "=== 機材画像一括生成 ==="
echo "合計: ${#ITEMS[@]} アイテム"
echo ""

GENERATED=0
SKIPPED=0
FAILED=0

for item in "${ITEMS[@]}"; do
  IFS='|' read -r id desc <<< "$item"

  # 既存ファイルチェック（スキップ時はsleepしない）
  if [ -f "static/images/equipments/${id}.png" ]; then
    echo "[$id] Skip (already exists)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if bash "$GENERATE" --name "$id" --desc "$desc"; then
    GENERATED=$((GENERATED + 1))
  else
    echo "[$id] FAILED" >&2
    FAILED=$((FAILED + 1))
  fi

  # レート制限対策
  sleep 2
done

echo ""
echo "=== 完了 ==="
echo "生成: $GENERATED / スキップ: $SKIPPED / 失敗: $FAILED"
echo ""
ls -la static/images/equipments/
