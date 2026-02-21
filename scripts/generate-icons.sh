#!/bin/bash

# 錬金アイテムアイコン一括生成スクリプト

SKILL_DIR="/home/hirayama/.claude/skills/fal-generate/scripts"
OUTPUT_DIR="/home/hirayama/Atelier/main/static/icons/materials"
PROMPT_DIR="/home/hirayama/Atelier/main/documents/image-prompts/icons/materials"
STYLE_PROMPT="simple alchemy game item illustration, cute fantasy RPG item, flat vector style, clean shapes, subtle highlights, centered single object, die-cut sticker / cutout, isolated, transparent background (alpha), no UI, no frame, no border, no rounded square tile, no panel, no card, no button, no badge, no text, no watermark"

mkdir -p "$OUTPUT_DIR"
mkdir -p "$PROMPT_DIR"

# アイテム定義: id|name|prompt
ITEMS=(
  # === 素材: ハーブ系 ===
  "herb_01|ハルマム草|medicinal herb, green leaves"
  "herb_02|毒消し草|antidote herb, purple leaves with white spots"
  "herb_03|フォンテの恵み草|rare glowing blue-green herb with spiral leaves, magical aura"

  # === 素材: 鉱石系 ===
  "ore_01|鉄鉱石|iron ore, rough grey metallic rock"
  "ore_02|銀鉱石|silver ore, shiny white metallic rock"

  # === 素材: 水系 ===
  "water_01|清水|pure clear water in a glass bottle"
  "water_02|聖水|holy water in a crystal vial, glowing golden"

  # === 素材: その他 ===
  "misc_01|獣の皮|animal hide, brown leather pelt"
  "misc_02|魔獣の牙|magical beast fang, glowing purple tooth"

  # === 素材: 森エリア ===
  "oil_seed|油草の実|oily plant seeds, small round yellow-brown seeds in a cluster"
  "hemp_fiber|麻繊維|bundle of hemp fibers, pale tan plant fibers tied together"
  "magic_wood|魔木の枝|magical tree branch, dark wood with faint purple glow"
  "glow_mushroom|燐光キノコ|bioluminescent mushroom, pale cap glowing green-blue"
  "forest_moss|森苔|soft green forest moss, fluffy moist texture"
  "honey|森蜂蜜|jar of golden forest honey, amber color, honeycomb visible"
  "tree_resin|樹脂|amber tree resin, translucent golden-brown droplet"
  "rubber_sap|ゴム樹液|rubber tree sap, white milky liquid in a small container"
  "spirit_flower|精霊花|ethereal spirit flower, glowing white petals with sparkles"

  # === 素材: 山エリア ===
  "crystal_ore|水晶原石|raw quartz crystal, clear transparent crystal cluster"
  "whetstone_ore|砥石鉱|whetstone mineral, flat grey-brown stone"
  "coal|石炭|piece of black coal, dark shiny surface"
  "sulfur|硫黄|yellow sulfur crystal, bright yellow mineral chunk"
  "thunder_shard|フルグライトの欠片|fulgurite shard, glass-like lightning fossil, branching shape"
  "beast_blood|魔獣の血|vial of magical beast blood, dark red glowing liquid"
  "gold_ore|金鉱石|gold ore, rough rock with golden veins"
  "talc|滑石|talc mineral, smooth white-grey soft stone"
  "magma_stone|熱蓄石|heat-storing red stone, glowing orange-red, warm cracks"

  # === 素材: 湖エリア ===
  "silica_sand|珪砂|silica sand, fine white sparkling sand in a pouch"
  "glow_moss|発光苔|glowing moss, bright green bioluminescent, water droplets"
  "clay|粘土|lump of wet grey clay, smooth texture"
  "salt|岩塩|rock salt crystal, white-pink translucent crystal"
  "ice_crystal|氷晶|magical ice crystal, blue transparent, never-melting ice shard"
  "lotus|蓮の花|lotus flower, pink-white petals, water lily"

  # === 素材: 深部エリア ===
  "mithril_ore|ミスリル鉱石|mithril ore, silvery-blue glowing metallic rock, legendary"
  "dragon_scale|竜鱗の欠片|dragon scale fragment, iridescent dark green-purple scale"
  "moon_stone|月光石|moonstone crystal, pale blue glow, absorbs moonlight"

  # === 生成物（元からある） ===
  "potion_01|回復薬|red healing potion in a round flask"
  "potion_02|上級回復薬|superior red healing potion in an ornate flask, glowing"
  "antidote|解毒薬|green antidote potion in a small bottle"
  "bomb_01|爆弾|round black bomb with fuse, cartoon style"
  "ingot_01|鉄インゴット|iron ingot, grey metal bar"
  "ingot_02|銀インゴット|silver ingot, shiny white metal bar"
  "elixir|エリクサー|golden elixir in a fancy crystal bottle, magical sparkles"

  # === Tier 1: 基礎加工品 ===
  "plant_oil|植物油|small bottle of plant oil, pale yellow liquid"
  "herbal_paste|ハルマム草ペースト|green herbal paste in a small mortar bowl"
  "charcoal|木炭|pieces of black charcoal, rough porous surface"
  "rope|麻縄|coil of hemp rope, tan twisted fibers"
  "simple_cloth|麻布|folded piece of linen cloth, pale natural color"
  "stone_powder|砕石粉|pile of grey stone powder in a small dish"
  "purified_water|精製水|purified water in a clear glass flask, crystal clear"
  "resin_glue|樹脂膠|pot of amber resin glue, sticky translucent"
  "dried_herbs|乾燥ハルマム草|bundle of dried green herbs tied with string"
  "salt_crystal|精製塩|refined white salt crystals in a small bowl"
  "clay_powder|粘土粉|fine brown clay powder in a pouch"
  "honey_syrup|蜂蜜シロップ|bottle of golden honey syrup, thick sweet liquid"
  "sulfur_powder|硫黄粉|pile of bright yellow sulfur powder"
  "filter_cloth|濾過布|white filter cloth, fine mesh fabric"
  "polishing_powder|研磨剤|jar of fine polishing powder, grey-white"
  "basic_catalyst|基礎触媒|small flask of catalyst liquid, bubbling pale green"
  "rubber_sheet|ゴム板|flat sheet of rubber, dark brown elastic material"
  "moss_extract|苔エキス|small vial of green moss extract, cool tone"

  # === Tier 2: 初級錬金品 ===
  "lamp_oil|灯火油|bottle of lamp oil, warm amber fuel"
  "quality_charcoal|ニグレドの炭|high-quality black charcoal, dense and pure, faint glow"
  "glass_powder|ガラス粉|pile of sparkling glass powder, transparent particles"
  "healing_salve|傷薬軟膏|tin of healing salve, green ointment"
  "reinforced_cloth|強化布|piece of reinforced fabric, thick woven cloth"
  "black_powder|黒色火薬|pile of black gunpowder, fine dark grains"
  "whetstone|砥石|flat rectangular whetstone, smooth grey surface"
  "basic_glass|基礎ガラス|piece of basic glass, clear transparent slab"
  "phosphor_powder|フォスフォルの粉|glowing phosphorescent powder, blue-green luminous"
  "water_crystal|水の結晶|water crystal, blue translucent gem, water element"
  "ink_base|インク原液|bottle of dark ink base, deep black liquid"
  "cooling_agent|冷却剤|vial of cooling agent, frosty blue liquid, cold mist"
  "fine_oil|精製油|refined oil in an elegant bottle, clear golden"
  "glowing_ink|発光インク|bottle of glowing ink, luminous green-blue liquid"
  "ceramic_base|陶器素地|unglazed ceramic base, pale clay form"
  "strong_rope|強化縄|reinforced thick rope, sturdy braided fibers"
  "basic_lens|基礎レンズ|simple glass lens, circular transparent optical piece"
  "iron_powder|鉄粉|pile of grey iron powder, metallic particles"
  "insulation_mat|断熱材|heat insulation mat, layered material, white-grey"
  "pure_crystal|純水晶|pure quartz crystal, perfectly clear transparent gem"
  "heat_stone|蓄熱石|heat-storing stone, warm orange glow from within"
  "sticky_clay|粘着粘土|sticky clay, soft malleable brown-grey mass"

  # === Tier 3: 中級錬金品 ===
  "precision_tools|精密工具|set of precision tools, small metal instruments"
  "reinforced_glass|強化ガラス|reinforced glass piece, thick and durable, slight blue tint"
  "magic_ink|グリモワールインク|magical grimoire ink, dark purple glowing bottle, arcane symbols"
  "quality_ceramic|上質陶器|fine quality ceramic bowl, glazed elegant"
  "silver_powder|銀粉|pile of silver powder, shimmering metallic particles"
  "fire_powder|発火粉|fire ignition powder, red-orange sparkling particles"
  "cold_crystal|冷気結晶|cold crystal, icy blue gem emitting frost"
  "flexible_tube|柔軟管|flexible tube, coiled rubber tubing"
  "filter_stone|濾過石|porous filter stone, natural stone with many holes"
  "heat_crystal|熱気結晶|heat crystal, orange-red gem radiating warmth"
  "magic_powder|魔力の粉|magical powder, sparkling purple-blue particles, arcane"
  "spirit_essence|精霊エッセンス|spirit essence in a crystal vial, ethereal glowing white-green"
  "quality_lens|高精度レンズ|high-precision lens, perfectly polished glass disc"
  "waterproof_coating|防水塗料|can of waterproof coating, blue protective liquid"
  "conductive_wire|導線|coil of conductive wire, silver magical cable with faint glow"
  "crystal_core|結晶核|crystal core, hexagonal gem with inner light, magical"
  "eternal_flame|イグニス・ペレニス|eternal flame in a small glass container, never-dying fire"
  "frost_core|冷気核|frost core, icy blue sphere with frozen mist"
  "purification_core|浄化核|purification core, white glowing sphere, pure energy"
  "thunder_crystal|フルグルの結晶|thunder crystal, yellow-white crackling lightning gem"
  "mirror_glass|鏡面ガラス|mirror glass, highly reflective polished glass surface"
  "enchanted_clay|魔法粘土|enchanted clay, glowing purple-grey magical clay"
  "life_essence|ヴィータエッセンス|life essence in a heart-shaped vial, warm golden-pink glow"
  "heat_regulator|温度調整弁|temperature regulator valve, brass mechanical device with dial"
  "conductor_core|導魔核|magic conductor core, dark sphere with arcane circuits"

  # === Tier 4: 上級錬金品 ===
  "magic_circuit|アルカナ回路|arcane circuit board, silver lines on dark crystal, magical patterns"
  "light_core|光核|light core, brilliant white-gold glowing sphere"
  "silver_frame|銀細工枠|ornate silver frame, delicate metalwork"
  "heat_core|熱核|heat core, deep red-orange glowing sphere"
  "gold_ingot|金インゴット|gold ingot, shiny golden metal bar"
  "magic_mirror|魔法鏡|magical mirror, ornate frame with swirling reflections"
  "cooling_unit|冷却装置|cooling unit device, metal box with frost vents"
  "heating_unit|加熱装置|heating unit device, metal box with heat vents, warm glow"
  "purifier_unit|浄化装置|purifier unit, white device with purifying light"
  "mithril_ingot|ミスリルインゴット|mithril ingot, silvery-blue legendary metal bar"
  "golem_clay|ホムンクルス粘土|homunculus clay, magical glowing clay shaped like a figure"
  "magic_lens|魔法レンズ|magical lens, glowing circular lens with arcane runes"
  "sound_crystal|こだまの結晶|echo crystal, vibrating transparent crystal with sound waves"
  "terrain_clay|地形粘土|terrain clay, brown-green clay with miniature landscape pattern"
  "power_converter|変換器|power converter device, mechanical box with glowing dial"
  "bell_alloy|鐘青銅|bell bronze alloy, golden-brown metal with musical resonance"
  "life_core|魂宿りの核|soul-dwelling core, warm golden sphere with inner heartbeat glow"
  "communication_crystal|遠音の結晶|communication crystal, paired blue crystals with connecting light"
  "dragon_alloy|ドラコニス合金|draconic alloy ingot, dark iridescent metal with dragon scale pattern"
  "moon_crystal|月光結晶|moonlight crystal, pale blue gem that glows with lunar light"

  # === Tier 5: 最上級錬金品 ===
  "eternal_lamp|消えずの灯|eternal lamp, ornate lantern with never-dying golden flame"
  "water_pump|魔法水ポンプ|magical water pump, brass mechanical pump with blue glow"
  "healing_incense|治癒の香|healing incense burner, smoking with green fragrant mist"
  "golem_core|ゴーレムコア|golem core, large glowing sphere with earth runes"
  "magic_generator|魔力発生器|magic generator, complex device with spinning arcane crystals"
  "climate_core|気候核|climate core, swirling sphere with wind and temperature"
  "road_clay|道敷き粘土|road-paving clay, smooth brown clay with paving pattern"
  "clock_mechanism|刻律の歯車|clockwork mechanism, intricate golden gears and springs"
  "communication_pair|遠音の双鏡|pair of communication mirrors, two ornate mirrors linked by light"
  "great_purifier|大浄化装置|great purifier, large white device radiating purifying light"
  "dragon_frame|竜骨格|dragon frame, massive dark iridescent structural frame"
  "power_core|動力核|power core, large glowing red-blue sphere with immense energy"
  "bell_mechanism|鐘機構|bell mechanism, ornate bronze bell with clockwork"
  "advanced_golem_core|上級ゴーレムコア|advanced golem core, large ornate sphere with complex runes"
  "life_support|アニマの灯台|anima lighthouse, tower-shaped device with warm healing light"

  # === Tier 6: 最終アイテム ===
  "magic_reactor|アタノールの炉心|athanor reactor core, elaborate alchemical furnace core, intense glow"
  "road_stone|道均しの魔石|road-leveling magic stone, large engraved stone with path runes"
  "healing_censer|パナケイアの香炉|panacea censer, ornate golden incense burner with healing mist"
  "far_mirror|遠話の鏡|far-speaking mirror, elegant oval mirror with swirling portal"
  "eternal_light|ルクス・エテルナ|lux aeterna, magnificent street lamp with eternal golden light"
  "purifying_stone|浄水の泉石|purifying spring stone, large crystal stone with pure water flowing"
  "eternal_cooler|永久保冷櫃|eternal cooler chest, ornate ice-blue storage chest with frost"
  "climate_orb|温調の宝珠|climate control orb, large glass sphere with swirling weather"
  "bell_tower|刻告げの鐘楼|bell tower mechanism, miniature ornate tower with bronze bell"
  "harvest_golem|豊穣のゴーレム核|harvest golem core, large green-gold sphere with nature runes"

  # === ストーリー用 ===
  "fonte_prototype|フォンテの試作薬|prototype potion, unfinished blue-green potion in a rough flask"
)

echo "=== 錬金アイテムアイコン生成 ==="
echo "合計: ${#ITEMS[@]} アイテム"
echo ""

generated=0
skipped=0
failed=0

for item in "${ITEMS[@]}"; do
  IFS='|' read -r id name prompt <<< "$item"

  output_file="$OUTPUT_DIR/${id}.png"

  # 既存ファイルがあればスキップ
  if [ -f "$output_file" ]; then
    echo "[$id] $name - スキップ (既存)"
    skipped=$((skipped + 1))
    continue
  fi

  echo "[$id] $name - 生成中..."

  full_prompt="$prompt, $STYLE_PROMPT"

  result=$(bash "$SKILL_DIR/generate.sh" \
    --prompt "$full_prompt" \
    --model "fal-ai/gpt-image-1.5" \
    --extra '{"background": "transparent", "quality": "medium", "image_size": "1024x1024"}' \
    --timeout 120 2>/dev/null)

  # URLを抽出
  url=$(echo "$result" | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -n "$url" ]; then
    curl -sL "$url" -o "$output_file"
    # プロンプト保存
    echo "$full_prompt" > "$PROMPT_DIR/${id}.txt"
    echo "[$id] $name - 完了"
    generated=$((generated + 1))
  else
    echo "[$id] $name - エラー"
    echo "$result" | tail -5
    failed=$((failed + 1))
  fi

  # レート制限対策
  sleep 2
done

echo ""
echo "=== 完了 ==="
echo "生成: $generated / スキップ: $skipped / 失敗: $failed"
echo "合計アイコン数: $(ls -1 "$OUTPUT_DIR"/*.png 2>/dev/null | wc -l)"
