import type { EquipmentDef, EquipmentCategory } from '$lib/models/types';

export const equipment: Record<string, EquipmentDef> = {
  // === 錬金釜（排他枠）=== 4個
  cauldron_double_distill: {
    id: 'cauldron_double_distill',
    name: '二重蒸留釜',
    description: '調合成功時、30%の確率で同じアイテムがもう1個生成される（品質±10のブレ）',
    category: 'cauldron',
    price: 800,
    effectDescription: '成功時30%で複製（品質±10）',
  },
  cauldron_spirit: {
    id: 'cauldron_spirit',
    name: '精霊の錬金釜',
    description: '品質上限が100→150に突破。ただし品質50以下の素材を使うと爆発（失敗確定）',
    category: 'cauldron',
    price: 1000,
    effectDescription: '品質上限150、低品質素材で失敗確定',
  },
  cauldron_reflux: {
    id: 'cauldron_reflux',
    name: '還流の坩堝',
    description: '調合失敗時、素材が消費されない。さらに失敗ごとに同レシピの成功率+10%累積',
    category: 'cauldron',
    price: 900,
    effectDescription: '失敗時素材保全＋成功率蓄積',
  },
  cauldron_chain: {
    id: 'cauldron_chain',
    name: '連鎖の大釜',
    description: '調合成功のたびにコンボカウンタ+1。コンボ数×5%が品質に加算。失敗でリセット',
    category: 'cauldron',
    price: 850,
    effectDescription: 'コンボ×5%品質ボーナス',
  },

  // === 時間・行動系 === 3個
  hourglass: {
    id: 'hourglass',
    name: '時渡りの砂時計',
    description: '全ての調合日数が半減（切り上げ）。5日→3日、3日→2日',
    category: 'time',
    price: 1200,
    effectDescription: '調合日数半減',
  },
  auto_stirrer: {
    id: 'auto_stirrer',
    name: '自動攪拌機',
    description: '1日に2回行動できる。ただし2回目の行動は体力消費2倍',
    category: 'time',
    price: 1500,
    effectDescription: '1日2回行動（2回目体力2倍）',
  },
  knowledge_ledge: {
    id: 'knowledge_ledge',
    name: '知恵の書見台',
    description: 'レシピ習得が即日完了（通常3〜7日）',
    category: 'time',
    price: 700,
    effectDescription: '勉強が即日完了',
  },

  // === 素材・調合補助系 === 4個
  universal_scale: {
    id: 'universal_scale',
    name: '万物の秤',
    description: '全レシピの必要素材数が1個減る（最低1）',
    category: 'material',
    price: 1100,
    effectDescription: '必要素材-1（最低1）',
  },
  mimic_mirror: {
    id: 'mimic_mirror',
    name: '模倣の鏡',
    description: '調合時、素材1種類を同カテゴリの別素材で代用可能',
    category: 'material',
    price: 800,
    effectDescription: '素材1種の代用可能',
  },
  refinement_flask: {
    id: 'refinement_flask',
    name: '精製フラスコ',
    description: '投入する素材の品質が50未満なら自動的に50に底上げ',
    category: 'material',
    price: 600,
    effectDescription: '低品質素材を品質50に底上げ',
  },
  abundant_jar: {
    id: 'abundant_jar',
    name: '豊穣の壺',
    description: '採取遠征の獲得素材数が2倍。さらに15%の確率でレア素材が混入',
    category: 'material',
    price: 900,
    effectDescription: '採取素材2倍＋レア15%',
  },

  // === 経済・報酬系 === 2個
  golden_athanor: {
    id: 'golden_athanor',
    name: '黄金のアタノール',
    description: '調合品の売却価格が2倍',
    category: 'economy',
    price: 1000,
    effectDescription: '売却価格2倍',
  },
  appraisal_monocle: {
    id: 'appraisal_monocle',
    name: '鑑定の単眼鏡',
    description: '依頼報酬（金銭・名声）が1.5倍。品質70以上の納品でさらに追加名声+1',
    category: 'economy',
    price: 800,
    effectDescription: '依頼報酬1.5倍＋高品質ボーナス',
  },

  // === 変わり種（ルールを曲げる特殊枠）=== 2個
  crystal_ball: {
    id: 'crystal_ball',
    name: '予言者の水晶球',
    description: '3日先までの依頼内容を事前に確認できる',
    category: 'special',
    price: 750,
    effectDescription: '3日先の依頼を先読み',
  },
  decomposition_grimoire: {
    id: 'decomposition_grimoire',
    name: '分解の魔導書',
    description: '完成品を分解して素材に戻せる（品質は少し劣化）。分解時に10%でレシピのヒント獲得',
    category: 'special',
    price: 650,
    effectDescription: '完成品を素材に分解（品質劣化）',
  },
};

export function getEquipment(id: string): EquipmentDef | undefined {
  return equipment[id];
}

export function getAllEquipment(): EquipmentDef[] {
  return Object.values(equipment);
}

export function getEquipmentByCategory(category: EquipmentCategory): EquipmentDef[] {
  return Object.values(equipment).filter((e) => e.category === category);
}
