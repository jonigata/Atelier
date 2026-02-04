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
    character: { name: 'オルト', title: '村長' },
    dialogue: [
      'おお、君がアルベルトの弟子か。よく来てくれた',
      '私はオルト、この村の村長をやっている。アルベルトとは若い頃からの友人でね',
      'ここが君の工房だ。小さいが、錬金術には十分だろう',
      'まずは師匠から習った知識を思い出すといい。疲れたら遠慮なく休んでくれ',
    ],
  },
  {
    id: 1,
    trigger: 'first_recipe_learned',
    unlocks: ['alchemy'],
    character: { name: 'オルト', title: '村長' },
    dialogue: [
      '勉強は順調かね？',
      'ほう、もうレシピを覚えたのか。さすがアルベルトの弟子だ',
      '知識だけでは錬金術士にはなれん。実際に手を動かしてみるといい',
      '最初は上手くいかなくても気にするな。失敗も経験のうちだ',
    ],
  },
  {
    id: 2,
    trigger: 'first_craft_success',
    unlocks: ['quest'],
    character: { name: '村人', title: '農夫' },
    dialogue: [
      'あんたが新しく来た錬金術士かい？',
      'へえ、もう薬を作れるのか。こりゃあ助かるなあ',
      '実はな、ちょっと困ってることがあるんだ',
      '村長んとこに頼みごとを伝えてある。よかったら聞いてくれないか？',
    ],
  },
  {
    id: 3,
    trigger: 'first_quest_accepted',
    unlocks: ['shop'],
    character: { name: 'カリン', title: 'よろず屋' },
    dialogue: [
      'あら、あなたが噂の錬金術士さんね。私はカリン、よろず屋をやってるの',
      '依頼を受けたなら、素材が必要になるでしょう？',
      'うちで少しなら素材を扱ってるわ。困ったときは寄ってちょうだい',
      'いらないものがあれば買い取りもするわよ',
    ],
  },
  {
    id: 4,
    trigger: 'first_quest_completed',
    unlocks: [],
    character: { name: 'オルト', title: '村長' },
    dialogue: [
      '聞いたぞ、依頼を達成したそうだな',
      '村の者が喜んでいた。ありがとう',
      'こうして一つずつ、村の役に立ってくれれば嬉しい',
      '君のおかげで、この村にも活気が戻ってきそうだ',
    ],
  },
];

// 村発展で解放されるマイルストーン（チュートリアルとは別管理）
export interface VillageMilestone {
  id: string;
  requiredDevelopment: number;
  unlocks: ActionType[];
  character: { name: string; title: string };
  dialogue: string[];
}

export const villageMilestones: VillageMilestone[] = [
  {
    id: 'adventurer_arrival',
    requiredDevelopment: 20,
    unlocks: ['expedition'],
    character: { name: 'ガルド', title: '冒険者' },
    dialogue: [
      '...あんたがこの村の錬金術士か。俺はガルド、冒険者をやっている',
      'この辺りを旅してたら、面白い村があると聞いてな',
      '錬金術士がいるなら素材が必要だろう。俺が採ってきてやろうか',
      '金は貰うが、森や山の奥まで行ける。必要なら声をかけろ',
    ],
  },
];

// 全アクション（最終的に解放される状態）
export const ALL_ACTIONS: ActionType[] = ['rest', 'study', 'alchemy', 'quest', 'shop', 'expedition'];

// 経験者モード用ダイアログ
export const veteranDialogue: TutorialDialogue = {
  characterName: 'オルト',
  characterTitle: '村長',
  lines: [
    'アルベルトから聞いている。手慣れているようだな',
    'では早速頼む。この村をよろしく頼む',
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

// 村発展度から解放されるアクションを取得
export function getVillageUnlockedActions(developmentLevel: number): ActionType[] {
  const unlocked: ActionType[] = [];
  for (const milestone of villageMilestones) {
    if (developmentLevel >= milestone.requiredDevelopment) {
      unlocked.push(...milestone.unlocks);
    }
  }
  return unlocked;
}

// 村発展マイルストーンのダイアログを取得
export function getVillageMilestoneDialogue(milestoneId: string): TutorialDialogue | null {
  const milestone = villageMilestones.find((m) => m.id === milestoneId);
  if (!milestone) return null;

  return {
    characterName: milestone.character.name,
    characterTitle: milestone.character.title,
    lines: milestone.dialogue,
  };
}
