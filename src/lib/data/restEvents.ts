import type { GameState } from '$lib/models/types';

export interface RestEventReward {
  type: 'item' | 'gold' | 'alchemyExp' | 'reputationExp' | 'villageExp';
  itemId?: string;
  count?: number;
  amount?: number;
  quality?: number;
}

export interface ResolvedReward {
  description: string;
  type: 'item' | 'gold' | 'exp';
  // 実際に適用するデータ
  apply: {
    type: RestEventReward['type'];
    itemId?: string;
    count?: number;
    amount?: number;
    quality?: number;
  };
  // ゲージアニメーション用データ（applyRestEventRewards で設定される）
  gaugeData?: import('$lib/models/types').GaugeData;
  gaugeColor?: 'gold' | 'blue' | 'green';
}

export interface RestEventDef {
  id: string;
  name: string;
  narrative: string;
  weight: number;
  /** イベント画像ファイル名（拡張子なし）。static/images/events/ に配置 */
  eventImage?: string;
  condition?: (state: GameState) => boolean;
  /**
   * 静的報酬。special がなければこれが使われる。
   * resolveRewards で具体値（ランダム範囲の確定等）に変換される。
   */
  rewards?: RestEventRewardTemplate[];
  /**
   * 動的報酬生成。condition と合わせて使う特殊イベント用。
   */
  special?: 'helperLevelUp' | 'randomEquipment' | 'duplicateItem';
}

/** テンプレート報酬（ランダム範囲を含む） */
export interface RestEventRewardTemplate {
  type: RestEventReward['type'];
  itemId?: string;
  /** アイテムIDのプール（ランダムに1つ選ばれる） */
  itemPool?: string[];
  /** アイテム個数の範囲 [min, max] */
  countRange?: [number, number];
  /** 金額・経験値の範囲 [min, max] */
  amountRange?: [number, number];
  /** 固定値 */
  amount?: number;
  /** 品質範囲 [min, max] */
  qualityRange?: [number, number];
}

// =============================================
// 全30イベント定義
// =============================================

export const restEvents: RestEventDef[] = [
  // ===== コモンイベント (weight: 5) =====

  {
    id: 'garden_herbs',
    name: '庭先の薬草',
    narrative: '工房の裏手に見覚えのない草が生えている。イリーナ師匠の本で調べると、使える薬草だった。',
    weight: 5,
    eventImage: 'rest_garden_herbs',
    rewards: [
      { type: 'item', itemPool: ['herb_01', 'herb_02'], countRange: [2, 3], qualityRange: [25, 50] },
    ],
  },
  {
    id: 'liene_gift',
    name: 'リエネの差し入れ',
    narrative: '「べ、別にあんたが倒れたら村が困るからよ」リエネが焼き菓子と薬草茶を持ってきてくれた。',
    weight: 5,
    eventImage: 'rest_liene_gift',
    rewards: [
      { type: 'reputationExp', amount: 5 },
      { type: 'item', itemId: 'herb_01', countRange: [1, 1], qualityRange: [30, 45] },
    ],
  },
  {
    id: 'mayor_story',
    name: '村長の昔話',
    narrative: '村長が夕食に招いてくれた。かつての村の繁栄と泉の話を聞くうちに、この村への理解が深まった。',
    weight: 5,
    eventImage: 'rest_mayor_story',
    rewards: [
      { type: 'villageExp', amount: 8 },
    ],
  },
  {
    id: 'riverside_find',
    name: '川辺の拾いもの',
    narrative: '気分転換に川辺を歩いていたら、上流から流れてきた鉱石の欠片を見つけた。',
    weight: 5,
    eventImage: 'rest_riverside_find',
    rewards: [
      { type: 'item', itemPool: ['ore_01', 'crystal_ore', 'whetstone_ore'], countRange: [1, 2], qualityRange: [20, 45] },
    ],
  },
  {
    id: 'well_gossip',
    name: '井戸端の評判',
    narrative: '水汲みに行ったら村人たちが「最近の錬金術士さんは頑張ってる」と話しているのが聞こえた。少し照れくさい。',
    weight: 5,
    eventImage: 'rest_well_gossip',
    rewards: [
      { type: 'reputationExp', amount: 8 },
    ],
  },
  {
    id: 'attic_find',
    name: '屋根裏の忘れ物',
    narrative: '工房の屋根裏を整理していたら、前の住人が残した素材が箱に入っていた。まだ使えそうだ。',
    weight: 5,
    eventImage: 'rest_attic_find',
    rewards: [
      { type: 'item', itemPool: ['herb_01', 'ore_01', 'water_01', 'oil_seed', 'coal', 'forest_moss'], countRange: [2, 3], qualityRange: [20, 40] },
    ],
  },
  {
    id: 'sunny_reading',
    name: '日向ぼっこ読書',
    narrative: '工房前の椅子で専門書を広げたら、いつの間にか寝落ち。でも夢の中でヒントを得た気がする。',
    weight: 5,
    eventImage: 'rest_sunny_reading',
    rewards: [
      { type: 'alchemyExp', amount: 12 },
    ],
  },
  {
    id: 'kids_visit',
    name: '子供たちの見学',
    narrative: '村の子供たちが「錬金術みせて！」と押しかけてきた。簡単な実験を見せたら大喜びされた。',
    weight: 5,
    eventImage: 'rest_kids_visit',
    rewards: [
      { type: 'reputationExp', amount: 10 },
    ],
  },
  {
    id: 'market_help',
    name: '市場の手伝い',
    narrative: '市場の荷下ろしを手伝ったらお駄賃をもらった。力仕事は得意じゃないけど、たまにはいい運動。',
    weight: 5,
    eventImage: 'rest_market_help',
    rewards: [
      { type: 'gold', amountRange: [80, 120] },
    ],
  },
  {
    id: 'rainy_experiment',
    name: '雨音の実験',
    narrative: '雨で外に出られない日。手持ちの素材で小さな実験をしてみたら、ちょっとした発見があった。',
    weight: 5,
    eventImage: 'rest_rainy_experiment',
    rewards: [
      { type: 'alchemyExp', amount: 15 },
    ],
  },
  {
    id: 'evening_walk',
    name: '夕暮れの散歩',
    narrative: '夕方の涼しい風に誘われて村の周りを散歩。道端に使えそうな素材が落ちていた。',
    weight: 5,
    eventImage: 'rest_evening_walk',
    rewards: [
      { type: 'item', itemPool: ['herb_01', 'herb_02', 'oil_seed', 'forest_moss', 'hemp_fiber'], countRange: [1, 2], qualityRange: [20, 45] },
    ],
  },
  {
    id: 'cat_nap',
    name: '猫の来客',
    narrative: '工房に野良猫が入り込んできた。追い出そうとしたけど、膝に乗られて動けなくなった。……まあいいか。',
    weight: 5,
    eventImage: 'rest_cat_nap',
    rewards: [
      { type: 'alchemyExp', amount: 5 },
      { type: 'reputationExp', amount: 5 },
    ],
  },
  {
    id: 'letter_to_master',
    name: '師匠への手紙',
    narrative: 'イリーナ師匠に近況報告の手紙を書いた。自分の成長を文字にすると、意外と進歩しているのがわかる。',
    weight: 5,
    eventImage: 'rest_letter_to_master',
    rewards: [
      { type: 'alchemyExp', amount: 10 },
    ],
  },
  {
    id: 'sweets_sharing',
    name: 'お菓子作り',
    narrative: '余った素材でお菓子を作って村人に配った。錬金術とは違うけど、喜んでもらえると嬉しい。',
    weight: 5,
    eventImage: 'rest_sweets_sharing',
    rewards: [
      { type: 'reputationExp', amount: 10 },
      { type: 'gold', amount: 50 },
    ],
  },
  {
    id: 'mushroom_hunt',
    name: 'きのこ狩り',
    narrative: '工房の裏の木陰にきのこが群生していた。食用かどうか慎重に選別して収穫。',
    weight: 5,
    eventImage: 'rest_mushroom_hunt',
    rewards: [
      { type: 'item', itemId: 'glow_mushroom', countRange: [2, 3], qualityRange: [25, 50] },
    ],
  },
  {
    id: 'stargazing',
    name: '星空観察',
    narrative: '夜更かしして星を眺めた。田舎の空は本当にきれいだ。都会では見えなかった星座が見える。',
    weight: 5,
    eventImage: 'rest_stargazing',
    rewards: [
      { type: 'villageExp', amount: 5 },
      { type: 'alchemyExp', amount: 5 },
    ],
  },
  {
    id: 'tool_maintenance',
    name: '器具の手入れ',
    narrative: '休みを利用して道具を磨き上げた。ピカピカになった釜を見ると、やる気が湧いてくる。',
    weight: 5,
    eventImage: 'rest_tool_maintenance',
    rewards: [
      { type: 'alchemyExp', amount: 8 },
    ],
  },
  {
    id: 'lost_item_thanks',
    name: '落とし物のお礼',
    narrative: '以前届けた落とし物のお礼を村人が持ってきてくれた。「遅くなってごめんね」と素材の詰め合わせ。',
    weight: 5,
    eventImage: 'rest_lost_item_thanks',
    rewards: [
      { type: 'item', itemPool: ['herb_01', 'ore_01', 'water_01', 'honey', 'oil_seed'], countRange: [1, 1], qualityRange: [30, 50] },
      { type: 'gold', amountRange: [50, 80] },
    ],
  },
  {
    id: 'laundry_day',
    name: '洗濯日和',
    narrative: '天気がいいのでシーツも全部洗った。パリッと乾いた布団で眠ると、翌朝の目覚めが違う。',
    weight: 5,
    eventImage: 'rest_laundry_day',
    rewards: [
      { type: 'gold', amountRange: [30, 60] },
    ],
  },
  {
    id: 'glowing_bugs',
    name: '虫の光',
    narrative: '夜、窓の外で何かが光っている。光る虫の群れだった。一匹だけ瓶に入れてみた。きれいだ。',
    weight: 5,
    eventImage: 'rest_glowing_bugs',
    rewards: [
      { type: 'item', itemPool: ['honey', 'glow_mushroom', 'glow_moss'], countRange: [1, 1], qualityRange: [30, 55] },
    ],
  },

  // ===== レアイベント (weight: 1) =====

  {
    id: 'irina_package',
    name: 'イリーナの小包',
    narrative: 'マルコ経由で師匠から荷物が届いた。中には手紙と、見たことのない素材が詰まっている。「次の査察までに使いこなしなさい」……相変わらず厳しい。',
    weight: 1,
    eventImage: 'rest_irina_package',
    rewards: [
      { type: 'item', itemPool: ['herb_03', 'spirit_flower', 'thunder_shard', 'beast_blood', 'glow_moss'], countRange: [3, 5], qualityRange: [40, 70] },
      { type: 'alchemyExp', amount: 30 },
    ],
  },
  {
    id: 'traveling_alchemist',
    name: '旅の錬金術師',
    narrative: '村を通りかかった老錬金術師が一晩泊めてほしいと言う。お礼に古い技法を教えてくれた。目から鱗が落ちる思いだ。',
    weight: 1,
    eventImage: 'rest_traveling_alchemist',
    rewards: [
      { type: 'alchemyExp', amount: 50 },
    ],
  },
  {
    id: 'helper_training',
    name: '助手の自主練',
    narrative: 'ふと工房を覗くと、助手が一人で素材の扱いを練習していた。「もっと役に立ちたくて……」その言葉に胸が熱くなる。',
    weight: 1,
    eventImage: 'rest_helper_training',
    special: 'helperLevelUp',
    condition: (state) => state.ownedHelpers.some((h) => h.level < 3),
  },
  {
    id: 'floor_treasure',
    name: '床下の宝箱',
    narrative: '工房の床板がきしむので直そうとしたら、床下から古い箱が出てきた。前の住人の蓄えらしい。ありがたく使わせてもらおう。',
    weight: 1,
    eventImage: 'rest_floor_treasure',
    rewards: [
      { type: 'gold', amountRange: [300, 500] },
    ],
  },
  {
    id: 'village_festival',
    name: '村の祭日',
    narrative: '今日は村の伝統的な祭日だった。知らずに休んでいたら、ちょうど祭りに参加できた。村人総出で準備する姿に感動。',
    weight: 1,
    eventImage: 'rest_village_festival',
    rewards: [
      { type: 'reputationExp', amount: 25 },
      { type: 'villageExp', amount: 20 },
    ],
  },
  {
    id: 'spirit_prank',
    name: '精霊の悪戯',
    narrative: '夜中にコトコト音がする。起きてみると、小さな精霊が棚の素材を並べ替えている。怒るどころか……増えてない？',
    weight: 1,
    eventImage: 'rest_spirit_prank',
    special: 'duplicateItem',
    condition: (state) => state.inventory.length > 0,
  },
  {
    id: 'hot_spring',
    name: '温泉の湧出',
    narrative: '裏山を散歩していたら、岩の隙間から温かい水が湧いているのを見つけた。これは……温泉？ 村長に報告したら大喜びされた。',
    weight: 1,
    eventImage: 'rest_hot_spring',
    rewards: [
      { type: 'villageExp', amount: 35 },
    ],
  },
  {
    id: 'liene_herb_notes',
    name: 'リエネの薬草学',
    narrative: 'リエネが「おばあちゃんの薬草ノート」を見せてくれた。普段は絶対見せないのに。「……一回だけよ」 そこには貴重な知識が詰まっていた。',
    weight: 1,
    eventImage: 'rest_liene_herb_notes',
    rewards: [
      { type: 'reputationExp', amount: 15 },
      { type: 'alchemyExp', amount: 30 },
      { type: 'item', itemPool: ['herb_01', 'herb_02', 'herb_03'], countRange: [3, 3], qualityRange: [40, 65] },
    ],
  },
  {
    id: 'marco_special',
    name: 'マルコの特別便',
    narrative: '「いいモノ入ったよ、お嬢ちゃん」マルコが予定外の訪問。見せてくれたのは掘り出し物の機材だった。「今日だけの特別価格だよ」',
    weight: 1,
    eventImage: 'rest_marco_special',
    special: 'randomEquipment',
    // condition はサービス層で判定（未所持の機材があるか）
  },
  {
    id: 'moonlit_cauldron',
    name: '満月の釜',
    narrative: '満月の夜、釜が淡く光っている。恐る恐る覗き込むと、底に透明な液体が溜まっていた。——純粋なエーテル。こんなことがあるのか。',
    weight: 1,
    eventImage: 'rest_moonlit_cauldron',
    rewards: [
      { type: 'item', itemPool: ['spirit_flower', 'thunder_shard', 'ice_crystal', 'moon_stone'], countRange: [1, 1], qualityRange: [90, 99] },
    ],
  },
];
