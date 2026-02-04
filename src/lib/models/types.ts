// アイテムカテゴリ
export type ItemCategory = 'herb' | 'ore' | 'water' | 'misc' | 'product';

// アイテム定義（マスタ）
export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  basePrice: number;
  description: string;
}

// 所持アイテム（品質付き）
export interface OwnedItem {
  itemId: string;
  quality: number; // 1-100
}

// レシピの素材要件
export interface Ingredient {
  itemId?: string;         // 特定アイテム指定
  category?: ItemCategory; // カテゴリ指定（どちらか一方）
  quantity: number;
}

// レシピ定義（マスタ）
export interface RecipeDef {
  id: string;
  name: string;
  resultItemId: string;
  ingredients: Ingredient[];
  requiredLevel: number;
  daysRequired: number;
  difficulty: number; // 1-10
  expReward: number;
}

// 依頼タイプ
export type QuestType = 'deliver' | 'quality' | 'bulk';

// 依頼定義（マスタ）
export interface QuestDef {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  requiredItemId: string;
  requiredQuantity: number;
  requiredQuality?: number; // undefinedなら品質不問
  rewardMoney: number;
  rewardReputation: number;
  deadlineDays: number;
}

// アクティブな依頼
export interface ActiveQuest extends QuestDef {
  acceptedDay: number;
  deliveredCount: number;
}

// 採取地のドロップ定義
export interface DropEntry {
  itemId: string;
  weight: number;
  qualityRange: [number, number];
}

// 採取地定義（マスタ）
export interface AreaDef {
  id: string;
  name: string;
  costPerDay: number;
  drops: DropEntry[];
  rareDrops: DropEntry[];
  rareChance: number; // 0-1
}

// 採取隊の派遣状態
export interface Expedition {
  areaId: string;
  startDay: number;
  duration: number;
}

// ゲームフェーズ
export type GamePhase =
  | 'morning'      // 朝のフェーズ
  | 'action'       // 行動選択
  | 'processing'   // 処理中
  | 'ending';      // エンディング

// 朝のイベント
export interface MorningEvent {
  type: 'expedition_return' | 'new_quest' | 'quest_expired' | 'tutorial';
  message: string;
  data?: unknown;
}

// チュートリアル会話
export interface TutorialDialogue {
  characterName: string;
  characterTitle: string;
  lines: string[];
  achievementTitle?: string;  // アチーブメント達成時のタイトル
  rewards?: string[];         // 報酬詳細リスト
}

// チュートリアル進行状態
export interface TutorialProgress {
  isActive: boolean;
  currentMilestone: number;
  unlockedActions: ActionType[];
  pendingDialogue: TutorialDialogue | null;
}

// ゲーム状態
export interface GameState {
  playerName: string;
  day: number;              // 1-365
  money: number;
  reputation: number;       // 0-100
  villageDevelopment: number; // 0-100 村発展度
  alchemyLevel: number;
  alchemyExp: number;
  stamina: number;          // 0-100
  maxStamina: number;

  inventory: OwnedItem[];
  knownRecipes: string[];

  activeQuests: ActiveQuest[];
  availableQuests: QuestDef[];
  completedQuestCount: number;
  failedQuestCount: number;

  expedition: Expedition | null;

  craftedItems: string[];

  phase: GamePhase;
  morningEvents: MorningEvent[];
  messageLog: string[];

  // 日付演出用（null以外の時に演出表示）
  pendingDayTransition: { toDay: number; daysAdvanced: number } | null;

  tutorialProgress: TutorialProgress;
  achievementProgress: AchievementProgress;
  stats: GameStats;
}

// 行動タイプ
export type ActionType =
  | 'alchemy'
  | 'quest'
  | 'expedition'
  | 'shop'
  | 'rest'
  | 'study'
  | 'inventory';

// =====================================
// アチーブメントシステム
// =====================================

// ナラティブの種類（報酬の出所）
export type AchievementNarrative =
  | 'master_gift'         // 師匠からの贈り物
  | 'master_teaching'     // 師匠の教え（手紙）
  | 'villager_gift'       // 村人からの差し入れ
  | 'patron_support'      // 匿名の支援者
  | 'workshop_discovery'  // 工房の発掘
  | 'village_growth'      // 村の発展ボーナス
  | 'character_trial'     // キャラクターからの試練
  | 'client_gratitude'    // 依頼主からの特別謝礼
  | 'village_festival'    // 村の祭りでの表彰
  | 'self_investment';    // 自分への投資が実る

// アチーブメントカテゴリ
export type AchievementCategory =
  | 'tutorial'   // チュートリアル
  | 'alchemy'    // 調合系
  | 'quest'      // 依頼系
  | 'expedition' // 採取系
  | 'economy'    // 経済系
  | 'mastery';   // 熟練系

// アチーブメント報酬
export interface AchievementReward {
  money?: number;
  items?: { itemId: string; quality: number; quantity: number }[];
  reputation?: number;
  recipes?: string[];
}

// アチーブメント条件の種類
export type AchievementConditionType =
  | 'level'
  | 'reputation'
  | 'money'
  | 'quest_count'
  | 'craft_count'
  | 'craft_item'
  | 'craft_quality'
  | 'expedition_count'
  | 'recipe_count'
  | 'consecutive_quests'
  | 'total_sales';

// アチーブメント条件
export interface AchievementCondition {
  type: AchievementConditionType;
  target: number | string;
  comparison?: '>=' | '>' | '==' | '<=' | '<';
}

// アチーブメント定義（マスタ）
export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  hint: string;
  category: AchievementCategory;
  narrative: AchievementNarrative;
  narrativeCharacter?: { name: string; title: string };
  narrativeMessage: string;
  conditions: AchievementCondition[];
  reward: AchievementReward;
  prerequisite?: string[];
  priority: number;
  tutorialMilestone?: number;  // チュートリアルとの連携用
  important?: boolean;  // HUDに目標として表示するか
}

// アチーブメント進行状態
export interface AchievementProgress {
  completed: string[];
  pendingReward: string | null;
}

// トースト通知
export type ToastType = 'unlock' | 'goal_active' | 'goal_complete';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

// ゲーム統計
export interface GameStats {
  totalCraftCount: number;
  totalExpeditionCount: number;
  consecutiveQuestSuccess: number;
  highestQualityCrafted: number;
  totalSalesAmount: number;
}
