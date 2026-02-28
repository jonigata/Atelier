import type { ItemCategory } from '$lib/models/types';

/**
 * カテゴリIDから日本語表示名へのマッピング
 */
export const CATEGORY_NAMES: Record<ItemCategory, string> = {
  herb: 'ハーブ系',
  ore: '鉱石系',
  water: '水系',
  misc: 'その他',
  plant: '植物系',
  wood: '木材系',
  crystal: '結晶系',
  product: '生成物',
} as const;

/**
 * カテゴリの表示名を取得
 */
export function getCategoryName(category: string): string {
  return CATEGORY_NAMES[category as ItemCategory] || category;
}

// =====================================
// アルバム用: 錬成物サブカテゴリ
// =====================================

export type ProductSubcategory = 'medicine' | 'material' | 'metal' | 'magic' | 'device' | 'infrastructure';

export const PRODUCT_SUBCATEGORY_NAMES: Record<ProductSubcategory, string> = {
  medicine: '薬品',
  material: '加工素材',
  metal: '金属・鍛冶',
  magic: '魔法素材',
  device: '装置・機構',
  infrastructure: '村の発展品',
};

export const PRODUCT_SUBCATEGORY_ORDER: ProductSubcategory[] = [
  'medicine', 'material', 'metal', 'magic', 'device', 'infrastructure',
];

/** 錬成物アイテムID → サブカテゴリ */
export const PRODUCT_SUBCATEGORY_MAP: Record<string, ProductSubcategory> = {
  // 薬品
  potion_01: 'medicine',
  potion_02: 'medicine',
  antidote: 'medicine',
  herbal_paste: 'medicine',
  dried_herbs: 'medicine',
  honey_syrup: 'medicine',
  purified_water: 'medicine',
  basic_catalyst: 'medicine',
  moss_extract: 'medicine',
  healing_salve: 'medicine',
  spirit_essence: 'medicine',
  life_essence: 'medicine',
  elixir: 'medicine',
  fonte_prototype: 'medicine',

  // 加工素材
  plant_oil: 'material',
  charcoal: 'material',
  rope: 'material',
  simple_cloth: 'material',
  stone_powder: 'material',
  salt_crystal: 'material',
  clay_powder: 'material',
  sulfur_powder: 'material',
  filter_cloth: 'material',
  polishing_powder: 'material',
  rubber_sheet: 'material',
  resin_glue: 'material',
  lamp_oil: 'material',
  quality_charcoal: 'material',
  fine_oil: 'material',
  reinforced_cloth: 'material',
  strong_rope: 'material',
  black_powder: 'material',
  fire_powder: 'material',
  ceramic_base: 'material',
  sticky_clay: 'material',
  ink_base: 'material',
  insulation_mat: 'material',
  flexible_tube: 'material',
  waterproof_coating: 'material',
  whetstone: 'material',
  filter_stone: 'material',

  // 金属・鍛冶
  ingot_01: 'metal',
  ingot_02: 'metal',
  iron_powder: 'metal',
  silver_powder: 'metal',
  gold_ingot: 'metal',
  mithril_ingot: 'metal',
  bell_alloy: 'metal',
  dragon_alloy: 'metal',
  silver_frame: 'metal',
  precision_tools: 'metal',

  // 魔法素材
  glass_powder: 'magic',
  basic_glass: 'magic',
  reinforced_glass: 'magic',
  basic_lens: 'magic',
  quality_lens: 'magic',
  mirror_glass: 'magic',
  magic_lens: 'magic',
  pure_crystal: 'magic',
  water_crystal: 'magic',
  phosphor_powder: 'magic',
  glowing_ink: 'magic',
  magic_ink: 'magic',
  cold_crystal: 'magic',
  heat_crystal: 'magic',
  thunder_crystal: 'magic',
  crystal_core: 'magic',
  moon_crystal: 'magic',
  sound_crystal: 'magic',
  cooling_agent: 'magic',
  heat_stone: 'magic',
  magic_powder: 'magic',
  enchanted_clay: 'magic',
  eternal_flame: 'magic',
  conductor_core: 'magic',
  conductive_wire: 'magic',
  communication_crystal: 'magic',

  // 装置・機構
  bomb_01: 'device',
  magic_circuit: 'device',
  light_core: 'device',
  heat_core: 'device',
  frost_core: 'device',
  purification_core: 'device',
  heat_regulator: 'device',
  power_converter: 'device',
  cooling_unit: 'device',
  heating_unit: 'device',
  purifier_unit: 'device',
  golem_clay: 'device',
  terrain_clay: 'device',
  road_clay: 'device',
  life_core: 'device',
  clock_mechanism: 'device',
  bell_mechanism: 'device',
  power_core: 'device',
  magic_mirror: 'device',
  communication_pair: 'device',
  golem_core: 'device',
  advanced_golem_core: 'device',
  magic_generator: 'device',
  climate_core: 'device',

  // 村の発展品
  eternal_lamp: 'infrastructure',
  water_pump: 'infrastructure',
  healing_incense: 'infrastructure',
  life_support: 'infrastructure',
  great_purifier: 'infrastructure',
  dragon_frame: 'infrastructure',
  road_stone: 'infrastructure',
  healing_censer: 'infrastructure',
  far_mirror: 'infrastructure',
  eternal_light: 'infrastructure',
  purifying_stone: 'infrastructure',
  eternal_cooler: 'infrastructure',
  climate_orb: 'infrastructure',
  bell_tower: 'infrastructure',
  harvest_golem: 'infrastructure',
  magic_reactor: 'infrastructure',
};
