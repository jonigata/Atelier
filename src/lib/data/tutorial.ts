import type { ActionType, TutorialDialogue } from '$lib/models/types';

// マイルストーン定義
export interface Milestone {
  id: number;
  trigger: string;
  unlocks: ActionType[];
  character: { name: string; title: string };
  dialogue: string[];
}

export const milestones: Milestone[] = [
  {
    id: 0,
    trigger: 'game_start',
    unlocks: ['rest', 'study'],
    character: { name: 'マルタ', title: 'アカデミー事務員' },
    dialogue: [
      'はい、これが工房の鍵です。1年間、ここがあなたの拠点になります',
      '初期支給品は工房に届けてあります。足りないものは自分で調達してください',
      'まずはレシピの勉強から始めるといいでしょう。疲れたら休むことも大事です',
      'それでは、良い1年を',
    ],
  },
  {
    id: 1,
    trigger: 'first_recipe_learned',
    unlocks: ['alchemy'],
    character: { name: 'エルザ', title: '先輩錬金術士' },
    dialogue: [
      'あら、新入りさん？私はエルザ。隣の工房で錬金術やってるの',
      '回復薬のレシピ覚えたのね。私も最初はそれだった',
      'レシピを覚えただけじゃダメよ。実際に手を動かさないと',
      '最初は失敗するかもしれないけど、それも勉強。やってみなさい',
    ],
  },
  {
    id: 2,
    trigger: 'first_craft_success',
    unlocks: ['quest'],
    character: { name: 'トーマス', title: '酒場の主人' },
    dialogue: [
      'おう、新しい錬金術士が来たって聞いてな。俺はトーマス、駅前の酒場をやってる',
      'お、もう何か作ったのか。なかなかやるじゃねえか',
      'なあ、街の掲示板見たことあるか？困ってる奴らが依頼を出してるんだ',
      '腕を磨くにもちょうどいい。暇なとき覗いてみな',
    ],
  },
  {
    id: 3,
    trigger: 'first_quest_accepted',
    unlocks: ['shop'],
    character: { name: 'ハンナ', title: '雑貨屋の店主' },
    dialogue: [
      'あなた、さっき掲示板で依頼受けてたわね。私はハンナ、この店の主人よ',
      '依頼をこなすなら、素材の調達も大事になってくるわ',
      'うちで素材を買うこともできるし、いらないものは売ってくれてもいいのよ',
      'お金は大事。上手にやりくりしなさいな',
    ],
  },
  {
    id: 4,
    trigger: 'first_quest_completed',
    unlocks: ['expedition'],
    character: { name: 'ガルド', title: '採取隊リーダー' },
    dialogue: [
      '...あんたが新しい錬金術士か。俺はガルド、採取隊をまとめてる',
      '依頼をこなしてるなら、そのうち素材が足りなくなる',
      '俺たちに依頼してくれれば、森や山から素材を集めてくる',
      '金はかかるが、自分で行けない場所のものも手に入る。必要なら声をかけろ',
    ],
  },
];

// 全アクション（チュートリアル完了時の状態）
export const ALL_ACTIONS: ActionType[] = ['rest', 'study', 'alchemy', 'quest', 'shop', 'expedition'];

// 経験者モード用ダイアログ
export const veteranDialogue: TutorialDialogue = {
  characterName: 'マルタ',
  characterTitle: 'アカデミー事務員',
  lines: [
    '経験者の方ですね。では手短に。工房の鍵です',
    '全ての機能が使えます。良い1年を',
  ],
};

// マイルストーンIDからダイアログを生成
export function getMilestoneDialogue(milestoneId: number): TutorialDialogue | null {
  const milestone = milestones.find((m) => m.id === milestoneId);
  if (!milestone) return null;

  return {
    characterName: milestone.character.name,
    characterTitle: milestone.character.title,
    lines: milestone.dialogue,
  };
}

// マイルストーンIDまでの累積解放アクションを取得
export function getUnlockedActionsUpTo(milestoneId: number): ActionType[] {
  const unlocked: ActionType[] = [];
  for (const milestone of milestones) {
    if (milestone.id <= milestoneId) {
      unlocked.push(...milestone.unlocks);
    }
  }
  return unlocked;
}
