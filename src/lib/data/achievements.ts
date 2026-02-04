import type { AchievementDef, AchievementNarrative } from '$lib/models/types';

// ナラティブごとのキャラクター設定
export const narrativeCharacters: Record<
  AchievementNarrative,
  { name: string; title: string } | null
> = {
  academy_grant: { name: 'マルタ', title: 'アカデミー事務員' },
  senior_handdown: { name: 'エルザ', title: '先輩錬金術士' },
  townspeople_gift: { name: 'トーマス', title: '酒場の主人' },
  patron_support: { name: '???', title: '匿名の後援者' },
  workshop_discovery: null, // システムメッセージ
  guild_rank_bonus: { name: 'ギルドマスター', title: '錬金術士ギルド長' },
  character_trial: null, // アチーブメントごとに指定
  client_gratitude: { name: '依頼主', title: '' },
  seasonal_award: { name: '市長', title: '街の代表' },
  self_investment: null, // システムメッセージ
};

// アチーブメント定義
export const achievements: Record<string, AchievementDef> = {
  // =====================================
  // チュートリアル系 (priority: 1-100)
  // =====================================
  ach_first_recipe: {
    id: 'ach_first_recipe',
    title: '知識の扉',
    description: '最初のレシピを習得した',
    hint: 'レシピを勉強して習得しよう',
    category: 'tutorial',
    narrative: 'senior_handdown',
    narrativeMessage:
      'エルザ「あら、レシピ覚えたのね。私が見習いの頃使ってた素材、あげるわ」',
    conditions: [{ type: 'recipe_count', target: 1 }],
    reward: { items: [{ itemId: 'herb_01', quality: 50, quantity: 3 }] },
    priority: 10,
    tutorialMilestone: 1,
  },

  ach_first_craft: {
    id: 'ach_first_craft',
    title: '錬金術士の目覚め',
    description: '初めて調合に成功した',
    hint: 'アイテムを調合してみよう',
    category: 'tutorial',
    narrative: 'academy_grant',
    narrativeMessage: 'アカデミーより調合成功奨励金が届きました',
    conditions: [{ type: 'craft_count', target: 1 }],
    reward: { money: 100 },
    priority: 20,
    prerequisite: ['ach_first_recipe'],
    tutorialMilestone: 2,
  },

  ach_first_quest: {
    id: 'ach_first_quest',
    title: '街との繋がり',
    description: '初めて依頼を受注した',
    hint: '掲示板で依頼を受けてみよう',
    category: 'tutorial',
    narrative: 'townspeople_gift',
    narrativeCharacter: { name: 'トーマス', title: '酒場の主人' },
    narrativeMessage: 'トーマス「頑張ってるな。これ持ってけ」',
    conditions: [{ type: 'quest_count', target: 0, comparison: '>' }], // 受注のみ
    reward: { items: [{ itemId: 'water_01', quality: 50, quantity: 2 }] },
    priority: 30,
    prerequisite: ['ach_first_craft'],
    tutorialMilestone: 3,
  },

  ach_first_complete: {
    id: 'ach_first_complete',
    title: '信頼の芽生え',
    description: '初めて依頼を完了した',
    hint: '依頼を達成して納品しよう',
    category: 'tutorial',
    narrative: 'client_gratitude',
    narrativeMessage: '依頼主から心付けが届きました',
    conditions: [{ type: 'quest_count', target: 1 }],
    reward: { money: 50, reputation: 2 },
    priority: 40,
    prerequisite: ['ach_first_quest'],
    tutorialMilestone: 4,
  },

  ach_first_expedition: {
    id: 'ach_first_expedition',
    title: '仲間との協力',
    description: '初めて採取隊を派遣した',
    hint: '採取隊を派遣して素材を集めよう',
    category: 'tutorial',
    narrative: 'character_trial',
    narrativeCharacter: { name: 'ガルド', title: '採取隊リーダー' },
    narrativeMessage: 'ガルド「...見込みがあるな。次も頼んでくれ」',
    conditions: [{ type: 'expedition_count', target: 1 }],
    reward: { items: [{ itemId: 'herb_01', quality: 60, quantity: 2 }] },
    priority: 50,
    prerequisite: ['ach_first_complete'],
  },

  // =====================================
  // 調合系 (priority: 101-200)
  // =====================================
  ach_craft_10: {
    id: 'ach_craft_10',
    title: '駆け出し調合士',
    description: '調合を10回達成した',
    hint: '調合を重ねて経験を積もう',
    category: 'alchemy',
    narrative: 'guild_rank_bonus',
    narrativeMessage: 'ギルドより見習い認定証を授与されました',
    conditions: [{ type: 'craft_count', target: 10 }],
    reward: { money: 200, reputation: 5 },
    priority: 110,
  },

  ach_craft_50: {
    id: 'ach_craft_50',
    title: '熟練調合士',
    description: '調合を50回達成した',
    hint: '更なる高みを目指そう',
    category: 'alchemy',
    narrative: 'guild_rank_bonus',
    narrativeMessage: 'ギルドランクが昇格しました',
    conditions: [{ type: 'craft_count', target: 50 }],
    reward: { money: 500, reputation: 10 },
    priority: 120,
    prerequisite: ['ach_craft_10'],
  },

  ach_craft_100: {
    id: 'ach_craft_100',
    title: '達人調合士',
    description: '調合を100回達成した',
    hint: '調合の道を極めよう',
    category: 'alchemy',
    narrative: 'guild_rank_bonus',
    narrativeMessage: '一流錬金術士として正式に認定されました',
    conditions: [{ type: 'craft_count', target: 100 }],
    reward: { money: 1000, reputation: 15 },
    priority: 130,
    prerequisite: ['ach_craft_50'],
  },

  ach_quality_70: {
    id: 'ach_quality_70',
    title: '品質へのこだわり',
    description: '品質70以上のアイテムを調合した',
    hint: '高品質な素材で調合しよう',
    category: 'alchemy',
    narrative: 'self_investment',
    narrativeMessage: '高品質な調合ができるようになった証として、工房の棚から良質な素材を発見した',
    conditions: [{ type: 'craft_quality', target: 70 }],
    reward: { items: [{ itemId: 'water_02', quality: 80, quantity: 1 }] },
    priority: 140,
  },

  ach_quality_90: {
    id: 'ach_quality_90',
    title: '至高の一品',
    description: '品質90以上のアイテムを調合した',
    hint: '最高品質を目指そう',
    category: 'alchemy',
    narrative: 'patron_support',
    narrativeMessage: '匿名の後援者「素晴らしい腕前です。これからも期待しています」',
    conditions: [{ type: 'craft_quality', target: 90 }],
    reward: { money: 500, recipes: ['ingot_02'] },
    priority: 150,
    prerequisite: ['ach_quality_70'],
  },

  ach_craft_elixir: {
    id: 'ach_craft_elixir',
    title: '伝説への到達',
    description: 'エリクサーを調合した',
    hint: '最高峰のレシピに挑戦しよう',
    category: 'alchemy',
    narrative: 'workshop_discovery',
    narrativeMessage: '工房の奥から前の主が残した日記を発見した。そこには錬金術の奥義が記されていた...',
    conditions: [{ type: 'craft_item', target: 'elixir' }],
    reward: { money: 1000, reputation: 20 },
    priority: 160,
  },

  // =====================================
  // 依頼系 (priority: 201-300)
  // =====================================
  ach_quest_5: {
    id: 'ach_quest_5',
    title: '頼れる存在',
    description: '依頼を5件完了した',
    hint: '依頼をこなして信頼を得よう',
    category: 'quest',
    narrative: 'townspeople_gift',
    narrativeMessage: '街の住人たちから感謝の品が届きました',
    conditions: [{ type: 'quest_count', target: 5 }],
    reward: {
      items: [
        { itemId: 'herb_01', quality: 50, quantity: 5 },
        { itemId: 'herb_02', quality: 50, quantity: 3 },
      ],
    },
    priority: 210,
  },

  ach_quest_15: {
    id: 'ach_quest_15',
    title: '街の名士',
    description: '依頼を15件完了した',
    hint: '街の人々の役に立とう',
    category: 'quest',
    narrative: 'seasonal_award',
    narrativeMessage: '収穫祭で功労者として表彰されました',
    conditions: [{ type: 'quest_count', target: 15 }],
    reward: { money: 800, reputation: 10 },
    priority: 220,
    prerequisite: ['ach_quest_5'],
  },

  ach_quest_30: {
    id: 'ach_quest_30',
    title: '救いの手',
    description: '依頼を30件完了した',
    hint: '街になくてはならない存在になろう',
    category: 'quest',
    narrative: 'client_gratitude',
    narrativeMessage: '長年の顧客から特別な謝礼が届きました',
    conditions: [{ type: 'quest_count', target: 30 }],
    reward: { money: 1500, reputation: 15 },
    priority: 230,
    prerequisite: ['ach_quest_15'],
  },

  ach_quest_streak_5: {
    id: 'ach_quest_streak_5',
    title: '信頼の証',
    description: '5件連続で依頼を成功させた',
    hint: '失敗せずに依頼を達成しよう',
    category: 'quest',
    narrative: 'patron_support',
    narrativeMessage: '後援者「確実な仕事ぶりに感銘を受けました」',
    conditions: [{ type: 'consecutive_quests', target: 5 }],
    reward: { money: 300 },
    priority: 240,
  },

  ach_quest_streak_10: {
    id: 'ach_quest_streak_10',
    title: '完璧主義者',
    description: '10件連続で依頼を成功させた',
    hint: '完璧な仕事を続けよう',
    category: 'quest',
    narrative: 'character_trial',
    narrativeCharacter: { name: 'マルタ', title: 'アカデミー事務員' },
    narrativeMessage: 'マルタ「アカデミーの模範となる錬金術士です」',
    conditions: [{ type: 'consecutive_quests', target: 10 }],
    reward: { money: 1000, reputation: 10 },
    priority: 250,
    prerequisite: ['ach_quest_streak_5'],
  },

  // =====================================
  // 採取系 (priority: 301-400)
  // =====================================
  ach_expedition_5: {
    id: 'ach_expedition_5',
    title: '探索者',
    description: '採取隊を5回派遣した',
    hint: '採取隊を活用しよう',
    category: 'expedition',
    narrative: 'character_trial',
    narrativeCharacter: { name: 'ガルド', title: '採取隊リーダー' },
    narrativeMessage: 'ガルド「いい依頼主だ。これは俺からだ」',
    conditions: [{ type: 'expedition_count', target: 5 }],
    reward: { items: [{ itemId: 'ore_01', quality: 60, quantity: 3 }] },
    priority: 310,
  },

  ach_expedition_15: {
    id: 'ach_expedition_15',
    title: '資源管理者',
    description: '採取隊を15回派遣した',
    hint: '継続的に素材を確保しよう',
    category: 'expedition',
    narrative: 'guild_rank_bonus',
    narrativeMessage: '採取ギルドとの提携が認められました',
    conditions: [{ type: 'expedition_count', target: 15 }],
    reward: {
      items: [
        { itemId: 'ore_02', quality: 70, quantity: 2 },
        { itemId: 'misc_02', quality: 70, quantity: 1 },
      ],
    },
    priority: 320,
    prerequisite: ['ach_expedition_5'],
  },

  // =====================================
  // 経済系 (priority: 401-500)
  // =====================================
  ach_money_5000: {
    id: 'ach_money_5000',
    title: '堅実な経営',
    description: '所持金5,000Gを達成した',
    hint: '依頼報酬やアイテム販売でお金を稼ごう',
    category: 'economy',
    narrative: 'self_investment',
    narrativeMessage: '貯蓄の成果で設備が改善された',
    conditions: [{ type: 'money', target: 5000 }],
    reward: { items: [{ itemId: 'water_01', quality: 60, quantity: 5 }] },
    priority: 410,
  },

  ach_money_20000: {
    id: 'ach_money_20000',
    title: '繁盛店',
    description: '所持金20,000Gを達成した',
    hint: '更なる資産を築こう',
    category: 'economy',
    narrative: 'patron_support',
    narrativeMessage: '後援者「経営手腕を高く評価しています」',
    conditions: [{ type: 'money', target: 20000 }],
    reward: { reputation: 10 },
    priority: 420,
    prerequisite: ['ach_money_5000'],
  },

  ach_money_50000: {
    id: 'ach_money_50000',
    title: '富豪錬金術士',
    description: '所持金50,000Gを達成した',
    hint: '経済的な成功を収めよう',
    category: 'economy',
    narrative: 'seasonal_award',
    narrativeMessage: '商工会から表彰されました',
    conditions: [{ type: 'money', target: 50000 }],
    reward: { money: 2000, reputation: 15 },
    priority: 430,
    prerequisite: ['ach_money_20000'],
  },

  ach_sales_10000: {
    id: 'ach_sales_10000',
    title: '商売繁盛',
    description: '累計売上10,000Gを達成した',
    hint: 'アイテムを販売して稼ごう',
    category: 'economy',
    narrative: 'townspeople_gift',
    narrativeCharacter: { name: 'ハンナ', title: '雑貨屋の店主' },
    narrativeMessage: 'ハンナ「いいお客さんね。これからもよろしく」',
    conditions: [{ type: 'total_sales', target: 10000 }],
    reward: {
      items: [
        { itemId: 'herb_01', quality: 55, quantity: 2 },
        { itemId: 'water_01', quality: 55, quantity: 2 },
      ],
    },
    priority: 440,
  },

  // =====================================
  // 熟練系 (priority: 501-600)
  // =====================================
  ach_level_5: {
    id: 'ach_level_5',
    title: '成長の実感',
    description: '錬金術レベル5に到達した',
    hint: '調合を重ねてレベルを上げよう',
    category: 'mastery',
    narrative: 'academy_grant',
    narrativeMessage: '中級課程への進級奨励金が届きました',
    conditions: [{ type: 'level', target: 5 }],
    reward: { money: 300, recipes: ['bomb_01'] },
    priority: 510,
  },

  ach_level_10: {
    id: 'ach_level_10',
    title: '一人前',
    description: '錬金術レベル10に到達した',
    hint: '見習い卒業を目指そう',
    category: 'mastery',
    narrative: 'guild_rank_bonus',
    narrativeMessage: '正式な錬金術士として認定されました',
    conditions: [{ type: 'level', target: 10 }],
    reward: { money: 800, reputation: 10, recipes: ['ingot_01'] },
    priority: 520,
    prerequisite: ['ach_level_5'],
  },

  ach_level_15: {
    id: 'ach_level_15',
    title: '熟練者',
    description: '錬金術レベル15に到達した',
    hint: '一流を目指して精進しよう',
    category: 'mastery',
    narrative: 'character_trial',
    narrativeCharacter: { name: 'エルザ', title: '先輩錬金術士' },
    narrativeMessage: 'エルザ「もう私に並んだわね。これからは同僚として頑張りましょう」',
    conditions: [{ type: 'level', target: 15 }],
    reward: { money: 1500, reputation: 15 },
    priority: 530,
    prerequisite: ['ach_level_10'],
  },

  ach_level_20: {
    id: 'ach_level_20',
    title: '究極の境地',
    description: '錬金術レベル20に到達した',
    hint: '最高峰の錬金術士になろう',
    category: 'mastery',
    narrative: 'guild_rank_bonus',
    narrativeMessage: 'ギルドマスターとして認定されました',
    conditions: [{ type: 'level', target: 20 }],
    reward: { money: 3000, reputation: 20 },
    priority: 540,
    prerequisite: ['ach_level_15'],
  },

  ach_reputation_50: {
    id: 'ach_reputation_50',
    title: '名声を馳せる',
    description: '名声50に到達した',
    hint: '依頼を達成して名声を上げよう',
    category: 'mastery',
    narrative: 'seasonal_award',
    narrativeMessage: '街の名誉市民に選出されました',
    conditions: [{ type: 'reputation', target: 50 }],
    reward: {
      money: 1000,
      items: [{ itemId: 'water_02', quality: 80, quantity: 2 }],
    },
    priority: 550,
  },

  ach_reputation_80: {
    id: 'ach_reputation_80',
    title: '伝説の錬金術士',
    description: '名声80に到達した',
    hint: '街一番の錬金術士になろう',
    category: 'mastery',
    narrative: 'seasonal_award',
    narrativeMessage: '年間最優秀錬金術士として表彰されました',
    conditions: [{ type: 'reputation', target: 80 }],
    reward: { money: 2000, reputation: 5 },
    priority: 560,
    prerequisite: ['ach_reputation_50'],
  },
};

// アチーブメントをIDで取得
export function getAchievementById(id: string): AchievementDef | undefined {
  return achievements[id];
}

// 全アチーブメントをリストで取得（優先度順）
export function getAllAchievements(): AchievementDef[] {
  return Object.values(achievements).sort((a, b) => a.priority - b.priority);
}

// カテゴリでフィルタ
export function getAchievementsByCategory(
  category: AchievementDef['category']
): AchievementDef[] {
  return getAllAchievements().filter((a) => a.category === category);
}

// チュートリアルマイルストーンに対応するアチーブメントを取得
export function getAchievementByMilestone(
  milestoneId: number
): AchievementDef | undefined {
  return getAllAchievements().find((a) => a.tutorialMilestone === milestoneId);
}
