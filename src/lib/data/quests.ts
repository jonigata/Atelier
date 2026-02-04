import type { QuestDef } from '$lib/models/types';

// 依頼テンプレート（ゲーム中にランダム生成の元になる）
export const questTemplates: QuestDef[] = [
  // 初級依頼
  {
    id: 'quest_potion_basic',
    title: '回復薬を届けて！',
    description: '村の診療所で回復薬が足りないんだ。',
    type: 'deliver',
    requiredItemId: 'potion_01',
    requiredQuantity: 3,
    rewardMoney: 200,
    rewardReputation: 5,
    deadlineDays: 10,
  },
  {
    id: 'quest_antidote_basic',
    title: '解毒薬が必要です',
    description: '山菜採りで毒草に当たった村人がいるんだ。',
    type: 'deliver',
    requiredItemId: 'antidote',
    requiredQuantity: 2,
    rewardMoney: 180,
    rewardReputation: 5,
    deadlineDays: 8,
  },

  // 品質指定依頼
  {
    id: 'quest_potion_quality',
    title: '良質な回復薬を',
    description: '村長への贈り物にしたいんだ。品質の良いものを頼む。',
    type: 'quality',
    requiredItemId: 'potion_01',
    requiredQuantity: 1,
    requiredQuality: 50,
    rewardMoney: 300,
    rewardReputation: 8,
    deadlineDays: 12,
  },
  {
    id: 'quest_antidote_quality',
    title: '高品質な解毒薬',
    description: '近隣の領主様からの依頼だ。恥ずかしくないものを。',
    type: 'quality',
    requiredItemId: 'antidote',
    requiredQuantity: 1,
    requiredQuality: 60,
    rewardMoney: 500,
    rewardReputation: 10,
    deadlineDays: 15,
  },

  // 大量依頼
  {
    id: 'quest_potion_bulk',
    title: '回復薬の大量注文',
    description: '隣村との共同作業があるんだ。備えておきたい。',
    type: 'bulk',
    requiredItemId: 'potion_01',
    requiredQuantity: 10,
    rewardMoney: 600,
    rewardReputation: 12,
    deadlineDays: 20,
  },
  {
    id: 'quest_bomb_bulk',
    title: '爆弾の納品依頼',
    description: '開墾作業で岩を砕きたいんだ。爆弾が必要だ。',
    type: 'bulk',
    requiredItemId: 'bomb_01',
    requiredQuantity: 5,
    rewardMoney: 700,
    rewardReputation: 15,
    deadlineDays: 25,
  },

  // 中級依頼
  {
    id: 'quest_ingot_iron',
    title: '鉄インゴットの注文',
    description: '農具の修理に使いたいんだ。鍛冶の心得がある者がいてね。',
    type: 'deliver',
    requiredItemId: 'ingot_01',
    requiredQuantity: 2,
    rewardMoney: 400,
    rewardReputation: 10,
    deadlineDays: 15,
  },

  // 上級依頼
  {
    id: 'quest_potion_advanced',
    title: '上級回復薬の依頼',
    description: '村を出て遠出する者がいるんだ。道中の備えに。',
    type: 'deliver',
    requiredItemId: 'potion_02',
    requiredQuantity: 3,
    rewardMoney: 800,
    rewardReputation: 15,
    deadlineDays: 20,
  },
  {
    id: 'quest_ingot_silver',
    title: '銀インゴットが必要',
    description: '村の祭りで使う飾りを作りたいんだ。',
    type: 'deliver',
    requiredItemId: 'ingot_02',
    requiredQuantity: 1,
    rewardMoney: 600,
    rewardReputation: 12,
    deadlineDays: 18,
  },

  // 最上級依頼
  {
    id: 'quest_elixir',
    title: '伝説のエリクサー',
    description: '村の長老が病に伏している。どうか助けてほしい。',
    type: 'quality',
    requiredItemId: 'elixir',
    requiredQuantity: 1,
    requiredQuality: 70,
    rewardMoney: 3000,
    rewardReputation: 30,
    deadlineDays: 30,
  },
];

// 現在のレベルと名声に応じた依頼を取得
export function getAvailableQuestTemplates(level: number, reputation: number): QuestDef[] {
  return questTemplates.filter(q => {
    // アイテムに応じたレベル制限
    if (q.requiredItemId === 'elixir' && level < 15) return false;
    if (q.requiredItemId === 'potion_02' && level < 5) return false;
    if (q.requiredItemId === 'ingot_02' && level < 8) return false;
    if (q.requiredItemId === 'ingot_01' && level < 4) return false;
    if (q.requiredItemId === 'bomb_01' && level < 3) return false;
    if (q.requiredItemId === 'antidote' && level < 2) return false;

    // 名声による制限
    if (q.rewardReputation >= 15 && reputation < 20) return false;
    if (q.rewardReputation >= 30 && reputation < 50) return false;

    return true;
  });
}
