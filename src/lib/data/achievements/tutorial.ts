import type { AchievementDef } from '$lib/models/types';

// =====================================
// チュートリアル系 (priority: 1-100)
// =====================================
export const tutorialAchievements: Record<string, AchievementDef> = {
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
      unlocks: ['inventory', 'rest'],
    },
    priority: 1,
    autoComplete: true,
  },

  ach_check_inventory: {
    id: 'ach_check_inventory',
    title: '旅の荷ほどき',
    description: '持ち物を確認した',
    hint: '所持品を開いて持ち物を調べよう',
    category: 'tutorial',
    narrative: 'workshop_discovery',
    narrativeLines: [
      '工房に運び込まれた荷物を整理した',
      '師匠が持たせてくれた道具と素材……それに、何冊かの教本',
      'まずはこれで、やれるだけやってみよう',
    ],
    conditions: [{ type: 'inventory_opened', target: 1 }],
    reward: {
      items: [
        { itemId: 'herb_01', quality: 50, quantity: 5 },
        { itemId: 'water_01', quality: 50, quantity: 3 },
      ],
      originLabel: '持参品',
    },
    prerequisite: ['ach_game_start'],
    priority: 2,
    important: true,
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
      unlocks: ['alchemy'],
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
};
