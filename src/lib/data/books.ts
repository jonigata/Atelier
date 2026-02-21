import type { RecipeBookDef } from '$lib/models/types';

export const books: Record<string, RecipeBookDef> = {
  // ========================================
  // Tier 1: 入門書（Lv1-2）— 村Lv1から購入可
  // ========================================
  book_basics: {
    id: 'book_basics',
    name: '錬金術入門',
    description: '錬金術の基礎を学ぶための教科書。薬や油、基本的な加工品のレシピが載っている。',
    recipeIds: ['potion_01', 'herbal_paste', 'plant_oil', 'charcoal', 'rope'],
    basePrice: 100,
    studyDays: 1,
    requiredVillageLevel: 1,
  },
  book_pharmacy: {
    id: 'book_pharmacy',
    name: '薬学の基礎',
    description: '解毒薬や精製水など、水と薬草を使った調合の基礎を解説した本。',
    recipeIds: ['antidote', 'purified_water', 'dried_herbs', 'basic_catalyst', 'honey_syrup'],
    basePrice: 800,
    studyDays: 1,
    requiredVillageLevel: 1,
  },
  book_materials: {
    id: 'book_materials',
    name: '素材加工読本',
    description: '布や膠、ゴムなど日用素材の加工法をまとめた実用書。',
    recipeIds: ['simple_cloth', 'resin_glue', 'rubber_sheet', 'moss_extract', 'salt_crystal'],
    basePrice: 800,
    studyDays: 1,
    requiredVillageLevel: 1,
  },
  book_minerals_explosives: {
    id: 'book_minerals_explosives',
    name: '鉱物と火薬',
    description: '石や粘土の粉砕から火薬の調合まで。鉱物加工の入門書。',
    recipeIds: ['stone_powder', 'clay_powder', 'sulfur_powder', 'polishing_powder', 'filter_cloth', 'bomb_01'],
    basePrice: 800,
    studyDays: 1,
    requiredVillageLevel: 1,
  },

  // ========================================
  // Tier 2: 初級書（Lv3-4）— 村Lv2から購入可
  // ========================================
  book_advanced_potions: {
    id: 'book_advanced_potions',
    name: '上級調合術',
    description: 'より高度な薬や油の調合法を解説した本。傷薬軟膏のレシピも収録。',
    recipeIds: ['potion_02', 'healing_salve', 'fine_oil', 'lamp_oil', 'cooling_agent'],
    basePrice: 500,
    studyDays: 1,
    requiredVillageLevel: 2,
  },
  book_crafting_materials: {
    id: 'book_crafting_materials',
    name: '工芸素材の技法',
    description: '炭や縄、陶器の素地など、工芸に使う素材の加工技術。',
    recipeIds: ['quality_charcoal', 'black_powder', 'whetstone', 'ceramic_base', 'strong_rope'],
    basePrice: 500,
    studyDays: 1,
    requiredVillageLevel: 2,
  },
  book_glass_crystal: {
    id: 'book_glass_crystal',
    name: 'ガラスと結晶の書',
    description: 'ガラスの精製から結晶の生成、レンズの研磨まで。光学素材の専門書。',
    recipeIds: ['glass_powder', 'basic_glass', 'phosphor_powder', 'water_crystal', 'basic_lens'],
    basePrice: 600,
    studyDays: 1,
    requiredVillageLevel: 2,
  },
  book_applied_processing: {
    id: 'book_applied_processing',
    name: '応用加工術',
    description: 'インクや強化布、断熱材など応用的な加工品の製造法。',
    recipeIds: ['ink_base', 'glowing_ink', 'reinforced_cloth', 'insulation_mat', 'sticky_clay'],
    basePrice: 600,
    studyDays: 1,
    requiredVillageLevel: 2,
  },
  book_metallurgy: {
    id: 'book_metallurgy',
    name: '鍛冶と精錬',
    description: '金属の精錬と加工技術。インゴットから鉄粉、蓄熱石の製法まで。',
    recipeIds: ['ingot_01', 'iron_powder', 'pure_crystal', 'heat_stone'],
    basePrice: 800,
    studyDays: 1,
    requiredVillageLevel: 2,
  },

  // ========================================
  // Tier 3: 中級書（Lv5-6）— 村Lv4から購入可
  // ========================================
  book_precision_crafts: {
    id: 'book_precision_crafts',
    name: '精密工芸論',
    description: '銀の精錬から精密工具、強化ガラスまで。職人技の粋を集めた技術書。',
    recipeIds: ['ingot_02', 'silver_powder', 'precision_tools', 'quality_ceramic', 'reinforced_glass'],
    basePrice: 1000,
    studyDays: 1,
    requiredVillageLevel: 4,
  },
  book_magical_materials: {
    id: 'book_magical_materials',
    name: '魔法素材概論',
    description: '魔力を帯びた素材の扱い方。魔法インクや精霊エッセンスの抽出法を収録。',
    recipeIds: ['magic_ink', 'magic_powder', 'spirit_essence', 'quality_lens', 'waterproof_coating', 'fonte_prototype_01'],
    basePrice: 1200,
    studyDays: 1,
    requiredVillageLevel: 4,
  },
  book_elemental_conversion: {
    id: 'book_elemental_conversion',
    name: '元素変換の理論',
    description: '火と氷、熱と冷の元素を操る理論書。結晶化と濾過の応用技術。',
    recipeIds: ['fire_powder', 'cold_crystal', 'heat_crystal', 'flexible_tube', 'filter_stone'],
    basePrice: 1200,
    studyDays: 1,
    requiredVillageLevel: 4,
  },
  book_crystal_research: {
    id: 'book_crystal_research',
    name: '結晶核の研究',
    description: '結晶核の生成と応用。永遠の炎や雷の結晶など、高度な結晶学の論文集。',
    recipeIds: ['crystal_core', 'frost_core', 'thunder_crystal', 'eternal_flame', 'mirror_glass'],
    basePrice: 1500,
    studyDays: 1,
    requiredVillageLevel: 4,
  },
  book_mana_engineering: {
    id: 'book_mana_engineering',
    name: '導魔工学',
    description: '魔力の伝導と制御に関する工学書。導線から浄化核、温度調整弁まで。',
    recipeIds: ['conductive_wire', 'purification_core', 'enchanted_clay', 'life_essence', 'heat_regulator', 'conductor_core'],
    basePrice: 1500,
    studyDays: 1,
    requiredVillageLevel: 4,
  },

  // ========================================
  // Tier 4: 上級書（Lv7-8）— 村Lv6から購入可
  // ========================================
  book_mana_circuits: {
    id: 'book_mana_circuits',
    name: '魔導回路設計書',
    description: '魔導回路の設計と、それを用いた冷却・加熱・浄化装置の構築法。',
    recipeIds: ['magic_circuit', 'cooling_unit', 'heating_unit', 'purifier_unit', 'power_converter'],
    basePrice: 2000,
    studyDays: 1,
    requiredVillageLevel: 6,
  },
  book_light_sound: {
    id: 'book_light_sound',
    name: '光と音の魔学',
    description: '光核や魔法鏡、音の結晶など、光と音を操る魔法素材の専門書。',
    recipeIds: ['light_core', 'magic_mirror', 'magic_lens', 'communication_crystal', 'sound_crystal'],
    basePrice: 2000,
    studyDays: 1,
    requiredVillageLevel: 6,
  },
  book_advanced_metallurgy: {
    id: 'book_advanced_metallurgy',
    name: '高等冶金術',
    description: '金・ミスリル・ドラコニス合金など、希少金属の精錬と加工の秘伝書。',
    recipeIds: ['silver_frame', 'gold_ingot', 'mithril_ingot', 'bell_alloy', 'dragon_alloy'],
    basePrice: 2500,
    studyDays: 1,
    requiredVillageLevel: 6,
  },
  book_life_earth: {
    id: 'book_life_earth',
    name: '生命と大地の秘術',
    description: '生命の核や月光結晶、ホムンクルス粘土など、命と大地に関わる秘術。',
    recipeIds: ['heat_core', 'golem_clay', 'terrain_clay', 'life_core', 'moon_crystal'],
    basePrice: 2500,
    studyDays: 1,
    requiredVillageLevel: 6,
  },

  // ========================================
  // Tier 5-6: 最上級書（Lv9-10）— 村Lv8から購入可
  // ========================================
  book_legendary_elixirs: {
    id: 'book_legendary_elixirs',
    name: '伝説の秘薬',
    description: '古代から伝わる万能薬と癒しの究極技法。エリクシールの製法も収録。',
    recipeIds: ['elixir', 'healing_incense', 'healing_censer', 'life_support'],
    basePrice: 3000,
    studyDays: 1,
    requiredVillageLevel: 8,
  },
  book_perpetual_machines: {
    id: 'book_perpetual_machines',
    name: '永久機関の設計',
    description: '消えずの灯、魔法水ポンプ、永久保冷櫃……永遠に動き続ける装置の設計図集。',
    recipeIds: ['eternal_lamp', 'eternal_light', 'eternal_cooler', 'water_pump', 'great_purifier', 'purifying_stone'],
    basePrice: 3500,
    studyDays: 1,
    requiredVillageLevel: 8,
  },
  book_power_climate: {
    id: 'book_power_climate',
    name: '動力と気候の制御',
    description: 'アタノールの炉心を中心とした動力機構と、気候制御の最先端理論。',
    recipeIds: ['magic_reactor', 'magic_generator', 'power_core', 'climate_core', 'climate_orb'],
    basePrice: 4000,
    studyDays: 1,
    requiredVillageLevel: 8,
  },
  book_construction: {
    id: 'book_construction',
    name: '建造と自動化',
    description: 'ゴーレム核の製造から道の整備まで。村の発展を支える建造技術の集大成。',
    recipeIds: ['golem_core', 'advanced_golem_core', 'road_clay', 'road_stone', 'harvest_golem'],
    basePrice: 4000,
    studyDays: 1,
    requiredVillageLevel: 8,
  },
  book_clockwork_comm: {
    id: 'book_clockwork_comm',
    name: '時計仕掛けと遠話',
    description: '精密な時計機構と遠隔通信装置の製造法。竜骨格の鋳造技術も収録。',
    recipeIds: ['clock_mechanism', 'bell_mechanism', 'bell_tower', 'communication_pair', 'far_mirror', 'dragon_frame'],
    basePrice: 4500,
    studyDays: 1,
    requiredVillageLevel: 8,
  },
};

export function getBook(id: string): RecipeBookDef | undefined {
  return books[id];
}

export function getBooksContainingRecipe(recipeId: string): RecipeBookDef[] {
  return Object.values(books).filter(book => book.recipeIds.includes(recipeId));
}

export function getShopBooks(villageLevel: number): RecipeBookDef[] {
  return Object.values(books).filter(book => villageLevel >= book.requiredVillageLevel);
}
