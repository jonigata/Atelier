import type { AchievementDef, AchievementNarrative } from '$lib/models/types';

// ナラティブごとのキャラクター設定
export const narrativeCharacters: Record<
  AchievementNarrative,
  { name: string; title: string } | null
> = {
  master_gift: { name: 'イリーナ', title: '師匠（手紙）' },
  master_teaching: { name: 'イリーナ', title: '師匠（手紙）' },
  villager_gift: { name: '村人', title: '' },
  patron_support: { name: '???', title: '匿名の支援者' },
  workshop_discovery: null, // システムメッセージ
  village_growth: { name: '村長', title: 'フォンテ村長' },
  character_trial: null, // アチーブメントごとに指定
  client_gratitude: { name: '依頼主', title: '' },
  village_festival: { name: '村長', title: 'フォンテ村長' },
  self_investment: null, // システムメッセージ
  village_girl: { name: 'リーネ', title: '村娘' },
  merchant_visit: { name: 'マルコ', title: '旅商人' },
  rival_pressure: { name: 'ヴィクト', title: 'ライバル錬金術師' },
};

// アチーブメント定義
export const achievements: Record<string, AchievementDef> = {
  // =====================================
  // チュートリアル系 (priority: 1-100)
  // =====================================
  ach_game_start: {
    id: 'ach_game_start',
    title: '新しい日々',
    description: 'フォンテ村に到着した',
    hint: '物語が始まる',
    category: 'tutorial',
    narrative: 'village_growth',
    narrativeCharacter: { name: '村長', title: 'フォンテ村長' },
    narrativeLines: [
      'おお、ついに来てくれたか！ 君がイリーナ先生の弟子だな',
      '私はこの村の村長をやっている。もう何年も組合に頼み続けてな……',
      'ここが君の工房だ。少し古いが、娘と一緒に掃除しておいた',
      'フォンテ村を頼む。君が来てくれるのを、村のみんなが待っていたんだ',
    ],
    conditions: [{ type: 'day', target: 1 }],
    reward: {
      unlocks: ['rest'],
    },
    priority: 1,
    autoComplete: true,
  },

  ach_first_recipe: {
    id: 'ach_first_recipe',
    title: '知識の扉',
    description: '最初のレシピを習得した',
    hint: 'レシピを勉強して習得しよう',
    category: 'tutorial',
    narrative: 'master_teaching',
    narrativeCharacter: { name: 'イリーナ', title: '師匠（手紙）' },
    narrativeLines: [
      '師匠からの手紙が届いた――',
      '「まずは基本を思い出しなさい。あなたの座学は誰にも負けないはずよ」',
      '「これは餞別。実地でこそ錬金術は身につくもの。頑張りなさい」',
    ],
    conditions: [{ type: 'recipe_count', target: 1 }],
    reward: {
      items: [{ itemId: 'herb_01', quality: 50, quantity: 3 }],
      unlocks: ['alchemy', 'inventory', 'album'],
    },
    prerequisite: ['ach_story_village_girl_cold'],
    priority: 10,
    important: true,
  },

  ach_first_craft: {
    id: 'ach_first_craft',
    title: '錬金術士の目覚め',
    description: '初めて調合に成功した',
    hint: 'アイテムを調合してみよう',
    category: 'tutorial',
    narrative: 'villager_gift',
    narrativeCharacter: { name: 'メルダ', title: 'パン屋のおばちゃん' },
    narrativeLines: [
      'あらあら、あんたが噂の先生かい？ 私はメルダ、パン屋をやってるのよ',
      'もう薬が作れるの？ すごいねえ！',
      '実はちょっと頼みたいことがあるんだけど……',
      '村長んとこに言ってあるから、依頼を見てちょうだいな',
    ],
    conditions: [{ type: 'craft_count', target: 1 }],
    reward: {
      money: 100,
      unlocks: ['quest'],
    },
    priority: 20,
    prerequisite: ['ach_first_recipe'],
    important: true,
  },

  ach_first_quest: {
    id: 'ach_first_quest',
    title: '村との繋がり',
    description: '初めて依頼を受注した',
    hint: '依頼を受けてみよう',
    category: 'tutorial',
    narrative: 'merchant_visit',
    narrativeCharacter: { name: 'マルコ', title: '旅商人' },
    narrativeLines: [
      'よぉ、新しい先生ってのはあんたかい。俺はマルコ、旅商人さ',
      '依頼を受けたなら素材がいるだろ？ ちょうどいいのがあるぜ',
      'まぁ……ちょっとだけ色をつけさせてもらうがね。商売だからな',
      'これはご挨拶代わりだ。困ったらいつでも声かけな',
    ],
    conditions: [{ type: 'active_quest_count', target: 1 }],
    reward: {
      items: [{ itemId: 'water_01', quality: 50, quantity: 2 }],
      unlocks: ['shop'],
    },
    priority: 30,
    prerequisite: ['ach_first_craft'],
    important: true,
  },

  ach_first_complete: {
    id: 'ach_first_complete',
    title: '信頼の芽生え',
    description: '初めて依頼を完了した',
    hint: '依頼を達成して納品しよう',
    category: 'tutorial',
    narrative: 'village_growth',
    narrativeCharacter: { name: '村長', title: 'フォンテ村長' },
    narrativeLines: [
      '聞いたぞ、依頼を達成したそうだな。やるじゃないか',
      '村の者が喜んでいたよ。これは心付けだ、受け取ってくれ',
      'こうして一つずつ……この村の役に立ってくれれば嬉しい',
    ],
    conditions: [{ type: 'quest_count', target: 1 }],
    reward: { money: 50, reputation: 2 },
    priority: 40,
    prerequisite: ['ach_first_quest'],
    important: true,
  },

  ach_adventurer_arrival: {
    id: 'ach_adventurer_arrival',
    title: '冒険者の到来',
    description: '村発展度が20に達した',
    hint: '依頼を達成して村を発展させよう',
    category: 'tutorial',
    narrative: 'character_trial',
    narrativeCharacter: { name: 'レン', title: '冒険者' },
    narrativeLines: [
      'あんたがこの村の錬金術師か。俺はレン、こいつはピィ。冒険者をやってる',
      '面白い村があると聞いてな。錬金術師がいるなら素材の需要もあるだろ？',
      '森の奥まで行ける。金は貰うが、悪い取引にはならないさ',
      'ピィ「よろしくねー！ 珍しいもの見つけたら教えるから！」',
    ],
    conditions: [{ type: 'village_development', target: 20 }],
    reward: {
      unlocks: ['expedition'],
    },
    priority: 45,
    prerequisite: ['ach_first_complete'],
    important: true,
  },

  ach_first_expedition: {
    id: 'ach_first_expedition',
    title: '仲間との協力',
    description: '初めて採取隊を派遣した',
    hint: '採取隊を派遣して素材を集めよう',
    category: 'tutorial',
    narrative: 'character_trial',
    narrativeCharacter: { name: 'レン', title: '冒険者' },
    narrativeLines: [
      'ピィ「これ、帰り道で見つけたの！ おまけだよー」',
      'レン「……見込みがあるな。次も頼んでくれ」',
    ],
    conditions: [{ type: 'expedition_count', target: 1 }],
    reward: { items: [{ itemId: 'herb_01', quality: 60, quantity: 2 }] },
    priority: 50,
    prerequisite: ['ach_adventurer_arrival'],
    important: true,
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
    narrative: 'workshop_discovery',
    narrativeLines: [
      '工房の奥を整理していると、前の住人が残した大釜と魔法陣の設計図を見つけた',
      '大釜を改良すれば調合の成功率が上がり、魔法陣があれば魔法系の調合ができるようになる',
    ],
    conditions: [{ type: 'craft_count', target: 10 }],
    reward: { money: 200, reputation: 5, facilities: ['improved_cauldron', 'magic_circle'] },
    priority: 110,
    important: true,
    prerequisite: ['ach_first_complete'],
  },

  ach_craft_50: {
    id: 'ach_craft_50',
    title: '熟練調合士',
    description: '調合を50回達成した',
    hint: '更なる高みを目指そう',
    category: 'alchemy',
    narrative: 'village_growth',
    narrativeLines: ['村の評判が近隣にも広まり始めた'],
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
    narrative: 'master_teaching',
    narrativeLines: ['師匠からの手紙「一人前になったようだな。誇りに思う」'],
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
    narrativeLines: ['高品質な調合ができるようになった証として、工房の棚から良質な素材を発見した'],
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
    narrativeLines: ['匿名の支援者「素晴らしい腕前です。これからも期待しています」'],
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
    narrativeLines: ['工房の奥から前の住人が残した日記を発見した。そこには錬金術の奥義が記されていた...'],
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
    narrative: 'villager_gift',
    narrativeLines: ['村人たちから感謝の品が届いた'],
    conditions: [{ type: 'quest_count', target: 5 }],
    reward: {
      items: [
        { itemId: 'herb_01', quality: 50, quantity: 5 },
        { itemId: 'herb_02', quality: 50, quantity: 3 },
      ],
    },
    priority: 210,
    important: true,
    prerequisite: ['ach_first_complete'],
  },

  ach_quest_15: {
    id: 'ach_quest_15',
    title: '村の名士',
    description: '依頼を15件完了した',
    hint: '村の人々の役に立とう',
    category: 'quest',
    narrative: 'village_festival',
    narrativeLines: ['収穫祭で村長から功労者として表彰された'],
    conditions: [{ type: 'quest_count', target: 15 }],
    reward: { money: 800, reputation: 10 },
    priority: 220,
    prerequisite: ['ach_quest_5'],
    important: true,
  },

  ach_quest_30: {
    id: 'ach_quest_30',
    title: '救いの手',
    description: '依頼を30件完了した',
    hint: '村になくてはならない存在になろう',
    category: 'quest',
    narrative: 'client_gratitude',
    narrativeLines: ['いつも依頼してくれる村人から特別な謝礼が届いた'],
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
    narrativeLines: ['支援者「確実な仕事ぶりに感銘を受けました」'],
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
    narrative: 'master_teaching',
    narrativeCharacter: { name: 'イリーナ', title: '師匠（手紙）' },
    narrativeLines: ['師匠からの手紙「噂は聞いている。流石は私の弟子だ」'],
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
    narrativeCharacter: { name: 'ガルド', title: '冒険者' },
    narrativeLines: ['ガルド「いい依頼主だ。これは俺からだ」'],
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
    narrative: 'village_growth',
    narrativeLines: ['採取隊との連携が村の評判を高めている'],
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
    narrativeLines: ['貯蓄の成果で設備が改善された'],
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
    narrativeLines: ['支援者「経営手腕を高く評価しています」'],
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
    narrative: 'village_festival',
    narrativeLines: ['村の発展への貢献が表彰された'],
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
    narrative: 'merchant_visit',
    narrativeCharacter: { name: 'マルコ', title: '旅商人' },
    narrativeLines: ['マルコ「いやぁ、先生は商売上手だな！ これからも贔屓にしてくれよ」'],
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
    narrative: 'master_gift',
    narrativeLines: ['師匠から成長を祝う仕送りが届いた。「そろそろ蒸留器の使い方も覚える頃だ」'],
    conditions: [{ type: 'level', target: 5 }],
    reward: { money: 300, recipes: ['bomb_01'], facilities: ['distiller'] },
    priority: 510,
    important: true,
    prerequisite: ['ach_first_complete'],
  },

  ach_level_10: {
    id: 'ach_level_10',
    title: '一人前',
    description: '錬金術レベル10に到達した',
    hint: '見習い卒業を目指そう',
    category: 'mastery',
    narrative: 'master_teaching',
    narrativeLines: ['師匠からの手紙「一人前と認めよう。工房の炉も使いこなせるだろう」'],
    conditions: [{ type: 'level', target: 10 }],
    reward: { money: 800, reputation: 10, recipes: ['ingot_01'], facilities: ['furnace'] },
    priority: 520,
    prerequisite: ['ach_level_5'],
    important: true,
  },

  ach_level_15: {
    id: 'ach_level_15',
    title: '熟練者',
    description: '錬金術レベル15に到達した',
    hint: '一流を目指して精進しよう',
    category: 'mastery',
    narrative: 'village_growth',
    narrativeCharacter: { name: 'オルト', title: '村長' },
    narrativeLines: [
      'オルト「もう立派な錬金術士だな。イリーナも喜んでいるだろう」',
      '「工房の作業台も新調してやろう。これでもっと精密な仕事ができるはずだ」',
    ],
    conditions: [{ type: 'level', target: 15 }],
    reward: { money: 1500, reputation: 15, facilities: ['advanced_workbench'] },
    priority: 530,
    prerequisite: ['ach_level_10'],
  },

  ach_level_20: {
    id: 'ach_level_20',
    title: '究極の境地',
    description: '錬金術レベル20に到達した',
    hint: '最高峰の錬金術士になろう',
    category: 'mastery',
    narrative: 'master_teaching',
    narrativeLines: ['師匠からの手紙「お前はもう私を超えた。誇りに思う」'],
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
    narrative: 'village_festival',
    narrativeLines: ['村の祭りで名誉村民に選出された'],
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
    hint: '村一番の錬金術士になろう',
    category: 'mastery',
    narrative: 'village_festival',
    narrativeLines: ['年末の祭りで最優秀貢献者として表彰された'],
    conditions: [{ type: 'reputation', target: 80 }],
    reward: { money: 2000, reputation: 5 },
    priority: 560,
    prerequisite: ['ach_reputation_50'],
  },

  // =====================================
  // ストーリー: Q1 (priority: 601-700)
  // 「先生と呼ばれて」
  // =====================================
  ach_story_village_girl_cold: {
    id: 'ach_story_village_girl_cold',
    title: '冷たい視線',
    description: '村娘リーネに出会った',
    hint: '村での生活を始めよう',
    category: 'quest',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      '……あなたが、錬金術師の「先生」？',
      'ふうん。思ってたより……普通ね',
      'どうせまたすぐ帰るんでしょ。前にもそういう人、何人も来たから',
      '……期待なんてしないわ。勝手にすれば',
      'お父さんが「これを渡せ」って。レシピ本？ ……知らないわよ、勝手に読めば',
    ],
    conditions: [{ type: 'day', target: 2, comparison: '>=' }],
    reward: {
      unlocks: ['study'],
    },
    prerequisite: ['ach_game_start'],
    priority: 605,
    important: true,
  },

  ach_story_merchant_first: {
    id: 'ach_story_merchant_first',
    title: '胡散臭い来客',
    description: '旅商人マルコが初めてやって来た',
    hint: '旅商人と取引しよう',
    category: 'quest',
    narrative: 'merchant_visit',
    narrativeCharacter: { name: 'マルコ', title: '旅商人' },
    narrativeLines: [
      'いやぁ、辺境にも錬金術師が来たって聞いてさ',
      'こいつは「霧草の種」ってやつだ。この辺じゃ珍しいぞ？',
      '特別価格で……まぁ、ちょーっとだけ上乗せさせてもらうがな',
      'これからもちょくちょく顔を出すぜ。いい商売しようや、先生',
    ],
    conditions: [
      { type: 'day', target: 10, comparison: '>=' },
      { type: 'craft_count', target: 3 },
    ],
    reward: {
      items: [{ itemId: 'herb_02', quality: 55, quantity: 2 }],
    },
    prerequisite: ['ach_first_craft'],
    priority: 610,
  },

  ach_story_girl_soften: {
    id: 'ach_story_girl_soften',
    title: 'おばあちゃんの知恵',
    description: 'リーネが少し態度を軟化させた',
    hint: '調合を続けて村での暮らしを定着させよう',
    category: 'quest',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      '……ねえ。あんた、この薬草の使い方知ってるの？',
      'うちのおばあちゃんが昔、これで傷薬を作ってたんだけど……',
      'あんたの錬金術と、おばあちゃんの知恵……似てるところ、あるのかも',
      '……べっ、別に認めたわけじゃないから。ただの興味よ',
    ],
    conditions: [
      { type: 'craft_count', target: 1 },
    ],
    reward: {
      reputation: 3,
    },
    prerequisite: ['ach_story_village_girl_cold', 'ach_first_craft'],
    priority: 620,
  },

  ach_story_baker_rumor: {
    id: 'ach_story_baker_rumor',
    title: '隣村の噂',
    description: 'メルダからライバルの存在を聞いた',
    hint: '村での評判を築こう',
    category: 'quest',
    narrative: 'client_gratitude',
    narrativeCharacter: { name: 'メルダ', title: 'パン屋のおばちゃん' },
    narrativeLines: [
      'ねえ先生、聞いた？ 隣の村にも錬金術師が来たんだって',
      'なんでもすごい腕前で、もう村おこしが始まってるとか……',
      'でもね、あたしはあんたの方を応援してるからね！',
      'はい、パンのおすそ分け。頑張んなさいよ！',
    ],
    conditions: [
      { type: 'day', target: 40, comparison: '>=' },
      { type: 'quest_count', target: 3 },
    ],
    reward: {
      money: 50,
    },
    prerequisite: ['ach_first_complete'],
    priority: 630,
  },

  ach_story_q1_checkpoint: {
    id: 'ach_story_q1_checkpoint',
    title: '最初の報告書',
    description: '師匠組合への90日目の経過報告',
    hint: '90日目までに基礎を固めよう',
    category: 'quest',
    narrative: 'patron_support',
    narrativeCharacter: { name: '査察官', title: '師匠組合' },
    narrativeLines: [
      '師匠組合からの書簡が届いた――',
      '「派遣錬金術師 各位。90日目の経過報告を求む」',
      '「到着後の活動実績、村との関係構築状況を書面にて提出のこと」',
      '……ひとまず、やってきたことを報告すればいいのかな',
      '（※ 現在の実績が自動的に報告されます）',
    ],
    conditions: [
      { type: 'day', target: 90, comparison: '>=' },
      { type: 'quest_count', target: 5 },
    ],
    reward: {
      money: 300,
      reputation: 5,
    },
    prerequisite: ['ach_story_girl_soften'],
    priority: 690,
    important: true,
  },

  // =====================================
  // ストーリー: Q2 (priority: 701-800)
  // 「この村の錬金術師」
  // =====================================
  ach_story_rival_appear: {
    id: 'ach_story_rival_appear',
    title: '不穏な来訪者',
    description: 'ライバル錬金術師ヴィクトが現れた',
    hint: 'Q1関門を突破しよう',
    category: 'quest',
    narrative: 'rival_pressure',
    narrativeCharacter: { name: 'ヴィクト', title: 'ライバル錬金術師' },
    narrativeLines: [
      'ああ、君がここの担当か。僕はヴィクト、隣村の錬金術師だ',
      'イリーナ先生の弟子だって？ ふうん……回復薬は作れるようになった？',
      '僕の村はもう特産品の目処が立ってるよ。君はどう？',
      'まぁ、頑張ってね。半年後の査察、楽しみにしてるよ',
    ],
    conditions: [
      { type: 'day', target: 100, comparison: '>=' },
    ],
    reward: {},
    prerequisite: ['ach_story_q1_checkpoint'],
    priority: 705,
  },

  ach_story_girl_partner: {
    id: 'ach_story_girl_partner',
    title: '素材採りの相棒',
    description: 'リーネが素材採取のパートナーになった',
    hint: '採取隊を活用し、調合を重ねよう',
    category: 'quest',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      '……ねえ、あんた。この前の薬草のこと、もっと教えてくれない？',
      'おばあちゃんが昔集めてた場所、私なら案内できるけど',
      '別にあんたのためじゃないわよ。おばあちゃんの知恵が役に立つなら……嬉しいってだけ',
      'これからは一緒に採りに行ってあげる。……感謝しなさいよね',
    ],
    conditions: [
      { type: 'day', target: 110, comparison: '>=' },
      { type: 'expedition_count', target: 5 },
      { type: 'craft_count', target: 20 },
    ],
    reward: {
      reputation: 5,
      items: [{ itemId: 'herb_01', quality: 70, quantity: 3 }],
    },
    prerequisite: ['ach_story_girl_soften', 'ach_story_rival_appear'],
    priority: 715,
    important: true,
  },

  ach_story_fonte_spring: {
    id: 'ach_story_fonte_spring',
    title: 'フォンテの泉の記憶',
    description: '枯れた泉の周辺で独自の薬草を発見した',
    hint: 'リーネと共に採取を続けよう',
    category: 'expedition',
    narrative: 'workshop_discovery',
    narrativeLines: [
      'リーネに案内された泉の跡地で、見たこともない薬草を見つけた',
      '泉は枯れたが、土壌にはまだ不思議な成分が染み込んでいるようだ',
      'この薬草は他の場所では育たない……フォンテ村だけの固有種かもしれない',
      '（※ 新しい採取エリア「枯泉の丘」が解放されました）',
    ],
    conditions: [
      { type: 'day', target: 130, comparison: '>=' },
      { type: 'expedition_count', target: 8 },
    ],
    reward: {
      items: [{ itemId: 'herb_03', quality: 65, quantity: 2 }],
      villageDevelopment: 5,
    },
    prerequisite: ['ach_story_girl_partner'],
    priority: 725,
    important: true,
  },

  ach_story_smith_repair: {
    id: 'ach_story_smith_repair',
    title: '頑固おやじの好意',
    description: '鍛冶屋のゴルドが器具を修理してくれた',
    hint: '調合設備を活用しよう',
    category: 'quest',
    narrative: 'villager_gift',
    narrativeCharacter: { name: 'ゴルド', title: '鍛冶屋' },
    narrativeLines: [
      '……おい、錬金術師。お前の大釜、見せてみろ',
      '……ひどいな。こんなんでよく調合できたもんだ',
      '……直しといてやる。礼はいらん',
      '……この村に、ちゃんと根を張れよ',
    ],
    conditions: [
      { type: 'day', target: 140, comparison: '>=' },
      { type: 'craft_count', target: 30 },
    ],
    reward: {
      facilities: ['reinforced_cauldron'],
    },
    prerequisite: ['ach_craft_10'],
    priority: 735,
  },

  ach_story_neighbor_pressure: {
    id: 'ach_story_neighbor_pressure',
    title: '焦りの種',
    description: '隣村の発展ぶりを聞いた',
    hint: '村の発展に貢献しよう',
    category: 'quest',
    narrative: 'client_gratitude',
    narrativeCharacter: { name: 'メルダ', title: 'パン屋のおばちゃん' },
    narrativeLines: [
      '先生、大変よ！ 隣村の錬金術師、もう特産品を売り出してるんだって！',
      'お客さんがみんなあっちに行っちゃうかもしれないって、村長が心配してて……',
      '先生も何か……この村ならではのもの、作れないかしら？',
      'あたしは信じてるからね、先生のこと！',
    ],
    conditions: [
      { type: 'day', target: 160, comparison: '>=' },
      { type: 'village_development', target: 30 },
    ],
    reward: {
      reputation: 3,
    },
    prerequisite: ['ach_story_rival_appear'],
    priority: 745,
  },

  ach_story_q2_checkpoint: {
    id: 'ach_story_q2_checkpoint',
    title: '中間査察',
    description: '師匠組合の中間査察を受けた',
    hint: '180日目までに実績を積もう',
    category: 'quest',
    narrative: 'patron_support',
    narrativeCharacter: { name: '査察官', title: '師匠組合' },
    narrativeLines: [
      '師匠組合の査察官が村を訪れた',
      '「ふむ……半年の折り返し地点ですね。活動報告を確認しました」',
      '「正直に申し上げると、隣村のヴィクト君の方が進捗は良い」',
      '「しかし、村との関係構築は評価に値します。残り半分、期待していますよ」',
      '「特に……この村ならではの何か、を見つけてほしい」',
    ],
    conditions: [
      { type: 'day', target: 180, comparison: '>=' },
      { type: 'quest_count', target: 10 },
      { type: 'level', target: 5 },
    ],
    reward: {
      money: 500,
      reputation: 5,
      exp: 200,
    },
    prerequisite: ['ach_story_q1_checkpoint'],
    priority: 790,
    important: true,
  },

  // =====================================
  // ストーリー: Q3 (priority: 801-900)
  // 「フォンテの宝」
  // =====================================
  ach_story_specialty_start: {
    id: 'ach_story_specialty_start',
    title: '挑戦の始まり',
    description: '特産品の開発を開始した',
    hint: 'フォンテ固有の素材を使った調合に挑戦しよう',
    category: 'alchemy',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      'ねえ、この薬草……おばあちゃんが「フォンテの恵み」って呼んでた種類よ',
      '普通の使い方じゃダメみたい。錬金術で何かできないかな',
      '私の知ってる薬草の特性と、あなたの錬金術を合わせたら……',
      '……一緒に、この村だけの何かを作りましょうよ！',
    ],
    conditions: [
      { type: 'day', target: 190, comparison: '>=' },
      { type: 'level', target: 8 },
      { type: 'craft_count', target: 40 },
    ],
    reward: {
      recipes: ['fonte_prototype_01'],
      reputation: 5,
    },
    prerequisite: ['ach_story_fonte_spring', 'ach_story_q2_checkpoint'],
    priority: 805,
    important: true,
  },

  ach_story_specialty_fail: {
    id: 'ach_story_specialty_fail',
    title: '苦い教訓',
    description: '特産品の試作に失敗した',
    hint: '特産品のレシピを調合してみよう',
    category: 'alchemy',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      '……ダメだったね',
      '薬草の配合が足りないのか、それとも手順が違うのか……',
      'でも、おばあちゃんも言ってた。「良い薬は、何度も失敗した先にある」って',
      '……もう一回、やってみよ。私も手伝うから',
    ],
    conditions: [
      { type: 'craft_count', target: 50 },
      { type: 'day', target: 210, comparison: '>=' },
    ],
    reward: {
      exp: 150,
    },
    prerequisite: ['ach_story_specialty_start'],
    priority: 815,
  },

  ach_story_merchant_rare: {
    id: 'ach_story_merchant_rare',
    title: '転機の素材',
    description: 'マルコがレアな素材を持ってきた',
    hint: '旅商人の来訪を待とう',
    category: 'quest',
    narrative: 'merchant_visit',
    narrativeCharacter: { name: 'マルコ', title: '旅商人' },
    narrativeLines: [
      'よぉ先生、久しぶりだな！ 今日はとっておきを持ってきたぜ',
      'こいつは「月光の露」ってやつだ。この辺じゃまず手に入らない',
      '実はな、あんたの噂を聞いてわざわざ仕入れてきたんだ',
      '高くつくがね……まぁ、先生への投資ってやつさ。期待してるぜ？',
    ],
    conditions: [
      { type: 'day', target: 220, comparison: '>=' },
      { type: 'total_sales', target: 5000 },
    ],
    reward: {
      items: [{ itemId: 'misc_02', quality: 80, quantity: 1 }],
    },
    prerequisite: ['ach_story_specialty_fail'],
    priority: 825,
    important: true,
  },

  ach_story_rival_taunt: {
    id: 'ach_story_rival_taunt',
    title: '不敵な笑み',
    description: 'ヴィクトに嫌味を言われた',
    hint: '特産品開発を進めよう',
    category: 'quest',
    narrative: 'rival_pressure',
    narrativeCharacter: { name: 'ヴィクト', title: 'ライバル錬金術師' },
    narrativeLines: [
      'やあ、まだここでやってたんだ？ 感心するよ',
      '僕の特産品はもう量産体制に入ったけど……君はまだ試作段階？',
      'イリーナ先生もお気の毒に。期待の弟子がこれじゃあね',
      '……まぁ、無理はしない方がいいよ。身の丈に合ったことをしなよ',
    ],
    conditions: [
      { type: 'day', target: 230, comparison: '>=' },
    ],
    reward: {},
    prerequisite: ['ach_story_specialty_fail'],
    priority: 835,
  },

  ach_story_village_crisis: {
    id: 'ach_story_village_crisis',
    title: '村を守る力',
    description: '村の危機に錬金術で立ち向かった',
    hint: '高品質な回復薬を作れるようにしておこう',
    category: 'quest',
    narrative: 'village_growth',
    narrativeCharacter: { name: '村長', title: 'フォンテ村長' },
    narrativeLines: [
      '先生、大変だ！ 村に病が広がっている',
      '症状は軽いが、このままでは秋の収穫に響く……',
      '頼む、お前さんの錬金術で何とかならないか',
      '……この村には、お前さんしかいないんだ',
    ],
    conditions: [
      { type: 'day', target: 245, comparison: '>=' },
      { type: 'level', target: 10 },
      { type: 'craft_quality', target: 60 },
    ],
    reward: {
      money: 800,
      reputation: 15,
      villageDevelopment: 10,
    },
    prerequisite: ['ach_story_specialty_fail'],
    priority: 845,
    important: true,
  },

  ach_story_crisis_resolved: {
    id: 'ach_story_crisis_resolved',
    title: 'この村の錬金術師',
    description: '村の危機を救い、皆から感謝された',
    hint: '村の危機を乗り越えよう',
    category: 'quest',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      '……助かったわ。みんな、本当に感謝してる',
      '正直に言うとね……最初、あなたのこと全然信用してなかった',
      'でも今は違う。あなたは――この村の、錬金術師よ',
      '……だから、特産品のこと……絶対に諦めないでね。私も一緒だから',
    ],
    conditions: [
      { type: 'quest_count', target: 20 },
    ],
    reward: {
      reputation: 10,
    },
    prerequisite: ['ach_story_village_crisis'],
    priority: 855,
    important: true,
  },

  ach_story_q3_checkpoint: {
    id: 'ach_story_q3_checkpoint',
    title: '審判の予告',
    description: '査察官が予告訪問に来た',
    hint: '270日目までに特産品の方向性を固めよう',
    category: 'quest',
    narrative: 'patron_support',
    narrativeCharacter: { name: '査察官', title: '師匠組合' },
    narrativeLines: [
      '「お久しぶりです。最終査察の前に、経過確認に参りました」',
      '「特産品の開発状況はいかがですか？ 方向性だけでも見せていただきたい」',
      '「ヴィクト君はすでに成果を上げています。率直に言って、あなたは厳しい」',
      '「しかし……この村の人々は、あなたを信頼している。それは事実です」',
      '「残り3ヶ月。結果を出してください。期待しています」',
    ],
    conditions: [
      { type: 'day', target: 270, comparison: '>=' },
      { type: 'level', target: 12 },
      { type: 'quest_count', target: 20 },
    ],
    reward: {
      money: 500,
      reputation: 5,
    },
    prerequisite: ['ach_story_crisis_resolved'],
    priority: 890,
    important: true,
  },

  // =====================================
  // ストーリー: Q4 (priority: 901-1000)
  // 「自分の居場所」
  // =====================================
  ach_story_specialty_complete: {
    id: 'ach_story_specialty_complete',
    title: 'フォンテの恵み',
    description: 'フォンテ村の特産品を完成させた',
    hint: '最高のレシピを完成させよう',
    category: 'alchemy',
    narrative: 'workshop_discovery',
    narrativeLines: [
      '長い試行錯誤の末……ついに、完成した',
      'フォンテの泉の成分を含んだ薬草と、リーネの教えてくれた民間療法の知恵',
      'それを錬金術で昇華させた、この村でしか作れない一品',
      '「フォンテの恵み」―― これが、私の答え',
    ],
    conditions: [
      { type: 'day', target: 300, comparison: '>=' },
      { type: 'level', target: 15 },
      { type: 'craft_quality', target: 80 },
      { type: 'craft_count', target: 80 },
    ],
    reward: {
      money: 2000,
      reputation: 20,
      villageDevelopment: 15,
    },
    prerequisite: ['ach_story_q3_checkpoint'],
    priority: 905,
    important: true,
  },

  ach_story_girl_friendship: {
    id: 'ach_story_girl_friendship',
    title: '親友',
    description: 'リーネと真の友情を結んだ',
    hint: '特産品を完成させよう',
    category: 'quest',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      '……ねえ、覚えてる？ 最初に会った日のこと',
      '「どうせまた帰るんでしょ」って……ひどいこと言ったわよね',
      'ごめんね。でも……あなたが残ってくれて、本当に良かった',
      'あなたはもうこの村の人よ。……ううん、私の一番の友達',
      '……これからも、ずっとここにいてね',
    ],
    conditions: [
      { type: 'day', target: 320, comparison: '>=' },
      { type: 'reputation', target: 60 },
    ],
    reward: {
      reputation: 10,
      items: [{ itemId: 'herb_03', quality: 90, quantity: 1 }],
    },
    prerequisite: ['ach_story_specialty_complete'],
    priority: 920,
    important: true,
  },

  ach_story_rival_final: {
    id: 'ach_story_rival_final',
    title: '決着',
    description: 'ヴィクトと最後の対面を果たした',
    hint: '特産品を完成させよう',
    category: 'quest',
    narrative: 'rival_pressure',
    narrativeCharacter: { name: 'ヴィクト', title: 'ライバル錬金術師' },
    narrativeLines: [
      '……これが、君の特産品か',
      '正直……驚いたよ。こんなもの、僕には作れない',
      'この村でしか作れない、この村の人と一緒じゃなきゃ作れない薬……',
      '……ふん。今回は君の勝ちだ。認めるよ',
      '次は負けないからな。……覚えておけ',
    ],
    conditions: [
      { type: 'day', target: 340, comparison: '>=' },
    ],
    reward: {
      reputation: 5,
    },
    prerequisite: ['ach_story_specialty_complete'],
    priority: 930,
  },

  ach_story_master_letter: {
    id: 'ach_story_master_letter',
    title: '師匠の言葉',
    description: 'イリーナから最後の手紙が届いた',
    hint: '査察の日を待とう',
    category: 'mastery',
    narrative: 'master_teaching',
    narrativeCharacter: { name: 'イリーナ', title: '師匠（手紙）' },
    narrativeLines: [
      '師匠からの手紙が届いた――',
      '「あなたの噂は聞いています。フォンテ村の錬金術師、と」',
      '「最初は心配したけれど……やっぱり、あなたを送り出して正解だったわ」',
      '「査察では、あなたの答えを見せてもらいます。楽しみにしていますよ」',
      '「――お前の師匠であることを、誇りに思う。イリーナ」',
    ],
    conditions: [
      { type: 'day', target: 350, comparison: '>=' },
    ],
    reward: {
      exp: 500,
    },
    prerequisite: ['ach_story_specialty_complete'],
    priority: 940,
  },

  ach_story_final_inspection: {
    id: 'ach_story_final_inspection',
    title: '査察の日',
    description: '師匠組合の最終査察を受けた',
    hint: '360日目を迎えよう',
    category: 'quest',
    narrative: 'patron_support',
    narrativeCharacter: { name: '査察官', title: '師匠組合' },
    narrativeLines: [
      '「さて……1年が経ちました。最終査察を行います」',
      '「あなたの活動実績、村への貢献、そして特産品の出来栄え」',
      '「すべてを総合的に評価し、錬金術師としての認定を判断します」',
      '「では、あなたの成果を見せてください」',
    ],
    conditions: [
      { type: 'day', target: 360, comparison: '>=' },
    ],
    reward: {},
    prerequisite: ['ach_story_q3_checkpoint'],
    priority: 990,
    important: true,
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

// 自動達成アチーブメントを取得
export function getAutoCompleteAchievements(): AchievementDef[] {
  return getAllAchievements().filter((a) => a.autoComplete);
}
