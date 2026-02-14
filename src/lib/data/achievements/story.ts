import type { AchievementDef } from '$lib/models/types';

// =====================================
// ストーリー: Q1 (priority: 601-700)
// 「先生と呼ばれて」
// =====================================
// ストーリー: Q2 (priority: 701-800)
// 「この村の錬金術師」
// =====================================
// ストーリー: Q3 (priority: 801-900)
// 「フォンテの宝」
// =====================================
// ストーリー: Q4 (priority: 901-1000)
// 「自分の居場所」
// =====================================
export const storyAchievements: Record<string, AchievementDef> = {
  // --- Q1: 先生と呼ばれて ---
  ach_story_village_girl_cold: {
    id: 'ach_story_village_girl_cold',
    title: '冷たい視線',
    description: '村娘リーネに出会った',
    hint: '村での<strong>生活</strong>を始めよう',
    category: 'quest',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      '……あなたが、錬金術師の「先生」？',
      'ふうん。思ってたより……普通ね',
      'どうせまたすぐ帰るんでしょ。前にもそういう人、何人も来たから',
      '……期待なんてしないわ。勝手にすれば',
      { text: '……これ、お父さんが「渡せ」って。私が裏山で摘んできたやつだけど', expression: 'embarrassed' },
    ],
    conditions: [{ type: 'day', target: 2, comparison: '>=' }],
    reward: {
      items: [{ itemId: 'herb_01', quality: 70, quantity: 2 }],
    },
    prerequisite: ['ach_game_start'],
    priority: 605,
    eventImage: 'first_meeting_liene',
  },

  ach_story_merchant_first: {
    id: 'ach_story_merchant_first',
    title: '胡散臭い来客',
    description: '旅商人マルコが初めてやって来た',
    hint: '<strong>調合3回</strong>をこなして旅商人を呼ぼう',
    category: 'quest',
    narrative: 'merchant_visit',
    narrativeCharacter: { name: 'マルコ', title: '旅商人' },
    narrativeLines: [
      'いやぁ、辺境にも錬金術師が来たって聞いてさ',
      'こいつは「霧草の種」ってやつだ。この辺じゃ珍しいぞ？',
      { text: '特別価格で……まぁ、ちょーっとだけ上乗せさせてもらうがな', expression: 'smug' },
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
    hint: '<strong>調合</strong>を続けて村での暮らしを定着させよう',
    category: 'quest',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      '……ねえ。あんた、この薬草の使い方知ってるの？',
      'うちのおばあちゃんが昔、これで傷薬を作ってたんだけど……',
      'あんたの錬金術と、おばあちゃんの知恵……似てるところ、あるのかも',
      { text: '……べっ、別に認めたわけじゃないから。ただの興味よ', expression: 'embarrassed' },
    ],
    conditions: [
      { type: 'craft_count', target: 1 },
    ],
    reward: {
      reputation: 3,
      unlocks: ['album'],
    },
    prerequisite: ['ach_story_village_girl_cold', 'ach_first_craft'],
    priority: 620,
  },

  ach_story_master_advice: {
    id: 'ach_story_master_advice',
    title: '師匠の忠告',
    description: '師匠から査察制度について警告を受けた',
    hint: '<strong>依頼</strong>を達成して実績を積もう',
    category: 'quest',
    narrative: 'master_teaching',
    narrativeCharacter: { name: 'イリーナ', title: '師匠（手紙）' },
    narrativeLines: [
      '師匠からの手紙が届いた――',
      'そろそろ生活にも慣れた頃かしら。一つ、大事なことを伝えておくわ',
      '組合は派遣先の錬金術師に、90日ごとの経過報告を求めるの',
      '依頼をこなして実績を積みなさい。報告に書けることが何もない……なんてことにならないように',
      '最初の報告日まで、あと少し。しっかりね',
    ],
    conditions: [
      { type: 'day', target: 14, comparison: '>=' },
      { type: 'quest_count', target: 1 },
    ],
    reward: {},
    prerequisite: ['ach_first_complete'],
    priority: 625,
  },

  ach_story_baker_rumor: {
    id: 'ach_story_baker_rumor',
    title: '隣村の噂',
    description: 'メルダからライバルの存在を聞いた',
    hint: '<strong>依頼3件</strong>を完了して評判を築こう',
    category: 'quest',
    narrative: 'client_gratitude',
    narrativeCharacter: { name: 'メルダ', title: 'よろず屋のおばちゃん' },
    narrativeLines: [
      'ねえ先生、聞いた？ 隣の村にも錬金術師が来たんだって',
      'なんでもすごい腕前で、もう村おこしが始まってるとか……',
      { text: 'でもね、あたしはあんたの方を応援してるからね！', expression: 'happy' },
      'はい、差し入れよ。頑張んなさいよ！',
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

  ach_story_report_notice: {
    id: 'ach_story_report_notice',
    title: '届いた封書',
    description: '師匠組合から経過報告の通知が届いた',
    hint: '<strong>90日目</strong>の報告に備えよう',
    category: 'quest',
    narrative: 'patron_support',
    narrativeCharacter: { name: '査察官', title: '師匠組合' },
    narrativeLines: [
      '工房の郵便受けに、見慣れない封蝋の手紙が入っていた',
      '師匠組合 査察部より通達',
      '派遣錬金術師の経過報告期限が近づいております。活動実績の整理をお願いいたします',
      '……そうだ、師匠が言ってた90日ごとの報告。もうそんな時期なんだ',
    ],
    conditions: [{ type: 'day', target: 75, comparison: '>=' }],
    reward: {},
    prerequisite: ['ach_story_master_advice'],
    priority: 670,
  },

  ach_story_q1_checkpoint: {
    id: 'ach_story_q1_checkpoint',
    title: '最初の報告書',
    description: '師匠組合への90日目の経過報告',
    hint: '<strong>依頼5件</strong>を完了して報告に備えよう',
    category: 'quest',
    narrative: 'patron_support',
    narrativeCharacter: { name: '査察官', title: '師匠組合' },
    narrativeLines: [
      '師匠組合からの書簡が届いた――',
      '派遣錬金術師 各位。90日目の経過報告を求む',
      '到着後の活動実績、村との関係構築状況を書面にて提出のこと',
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
    prerequisite: ['ach_story_report_notice'],
    priority: 690,
    important: true,
  },

  // --- Q2: この村の錬金術師 ---
  ach_story_rival_appear: {
    id: 'ach_story_rival_appear',
    title: '不穏な来訪者',
    description: 'ライバル錬金術師ヴィクトが現れた',
    hint: '<strong>Q1関門</strong>を突破しよう',
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
    hint: '<strong>採取5回</strong>・<strong>調合20回</strong>を達成しよう',
    category: 'quest',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      '……ねえ、あんた。この前の薬草のこと、もっと教えてくれない？',
      'おばあちゃんが昔集めてた場所、私なら案内できるけど',
      { text: '別にあんたのためじゃないわよ。おばあちゃんの知恵が役に立つなら……嬉しいってだけ', expression: 'embarrassed' },
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
    hint: '<strong>採取8回</strong>を達成しよう',
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
    hint: '<strong>調合30回</strong>を達成しよう',
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
    hint: '<strong>村発展度30</strong>を目指そう',
    category: 'quest',
    narrative: 'client_gratitude',
    narrativeCharacter: { name: 'メルダ', title: 'よろず屋のおばちゃん' },
    narrativeLines: [
      { text: '先生、大変よ！ 隣村の錬金術師、もう特産品を売り出してるんだって！', expression: 'worried' },
      'お客さんがみんなあっちに行っちゃうかもしれないって、村長が心配してて……',
      '先生も何か……この村ならではのもの、作れないかしら？',
      { text: 'あたしは信じてるからね、先生のこと！', expression: 'determined' },
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
    hint: '<strong>依頼10件</strong>・<strong>レベル5</strong>を達成しよう',
    category: 'quest',
    narrative: 'patron_support',
    narrativeCharacter: { name: '査察官', title: '師匠組合' },
    narrativeLines: [
      '師匠組合の査察官が村を訪れた',
      'ふむ……半年の折り返し地点ですね。活動報告を確認しました',
      '正直に申し上げると、隣村のヴィクト君の方が進捗は良い',
      'しかし、村との関係構築は評価に値します。残り半分、期待していますよ',
      '特に……この村ならではの何か、を見つけてほしい',
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

  // --- Q3: フォンテの宝 ---
  ach_story_specialty_start: {
    id: 'ach_story_specialty_start',
    title: '挑戦の始まり',
    description: '特産品の開発を開始した',
    hint: '<strong>レベル8</strong>・<strong>調合40回</strong>を達成しよう',
    category: 'alchemy',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      'ねえ、この薬草……おばあちゃんが「フォンテの恵み」って呼んでた種類よ',
      '普通の使い方じゃダメみたい。錬金術で何かできないかな',
      '私の知ってる薬草の特性と、あなたの錬金術を合わせたら……',
      { text: '……一緒に、この村だけの何かを作りましょうよ！', expression: 'determined' },
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
    hint: '<strong>調合50回</strong>を達成しよう',
    category: 'alchemy',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      { text: '……ダメだったね', expression: 'sad' },
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
    hint: '<strong>累計売上5,000G</strong>を達成しよう',
    category: 'quest',
    narrative: 'merchant_visit',
    narrativeCharacter: { name: 'マルコ', title: '旅商人' },
    narrativeLines: [
      'よぉ先生、久しぶりだな！ 今日はとっておきを持ってきたぜ',
      'こいつは「月光の露」ってやつだ。この辺じゃまず手に入らない',
      '実はな、あんたの噂を聞いてわざわざ仕入れてきたんだ',
      { text: '高くつくがね……まぁ、先生への投資ってやつさ。期待してるぜ？', expression: 'smug' },
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
    hint: '<strong>特産品</strong>開発を進めよう',
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
    hint: '<strong>レベル10</strong>・<strong>品質60</strong>を達成しよう',
    category: 'quest',
    narrative: 'village_growth',
    narrativeCharacter: { name: '村長', title: 'フォンテ村長' },
    narrativeLines: [
      { text: '先生、大変だ！ 村に病が広がっている', expression: 'worried' },
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
    hint: '<strong>依頼20件</strong>を完了しよう',
    category: 'quest',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      '……助かったわ。みんな、本当に感謝してる',
      '正直に言うとね……最初、あなたのこと全然信用してなかった',
      { text: 'でも今は違う。あなたは――この村の、錬金術師よ', expression: 'happy' },
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
    hint: '<strong>レベル12</strong>・<strong>依頼20件</strong>を達成しよう',
    category: 'quest',
    narrative: 'patron_support',
    narrativeCharacter: { name: '査察官', title: '師匠組合' },
    narrativeLines: [
      'お久しぶりです。最終査察の前に、経過確認に参りました',
      '特産品の開発状況はいかがですか？ 方向性だけでも見せていただきたい',
      'ヴィクト君はすでに成果を上げています。率直に言って、あなたは厳しい',
      'しかし……この村の人々は、あなたを信頼している。それは事実です',
      '残り3ヶ月。結果を出してください。期待しています',
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

  // --- Q4: 自分の居場所 ---
  ach_story_specialty_complete: {
    id: 'ach_story_specialty_complete',
    title: 'フォンテの恵み',
    description: 'フォンテ村の特産品を完成させた',
    hint: '<strong>レベル15</strong>・<strong>品質80</strong>・<strong>調合80回</strong>を達成しよう',
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
    hint: '<strong>名声60</strong>に到達しよう',
    category: 'quest',
    narrative: 'village_girl',
    narrativeCharacter: { name: 'リーネ', title: '村娘' },
    narrativeLines: [
      '……ねえ、覚えてる？ 最初に会った日のこと',
      '「どうせまた帰るんでしょ」って……ひどいこと言ったわよね',
      'ごめんね。でも……あなたが残ってくれて、本当に良かった',
      'あなたはもうこの村の人よ。……ううん、私の一番の友達',
      { text: '……これからも、ずっとここにいてね', expression: 'happy' },
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
    hint: '<strong>特産品</strong>を完成させよう',
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
    hint: '<strong>査察</strong>の日を待とう',
    category: 'mastery',
    narrative: 'master_teaching',
    narrativeCharacter: { name: 'イリーナ', title: '師匠（手紙）' },
    narrativeLines: [
      '師匠からの手紙が届いた――',
      'あなたの噂は聞いています。フォンテ村の錬金術師、と',
      '最初は心配したけれど……やっぱり、あなたを送り出して正解だったわ',
      '査察では、あなたの答えを見せてもらいます。楽しみにしていますよ',
      '――お前の師匠であることを、誇りに思う。イリーナ',
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
    hint: '<strong>360日目</strong>を迎えよう',
    category: 'quest',
    narrative: 'patron_support',
    narrativeCharacter: { name: '査察官', title: '師匠組合' },
    narrativeLines: [
      'さて……1年が経ちました。最終査察を行います',
      'あなたの活動実績、村への貢献、そして特産品の出来栄え',
      'すべてを総合的に評価し、錬金術師としての認定を判断します',
      'では、あなたの成果を見せてください',
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
