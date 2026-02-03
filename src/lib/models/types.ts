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
  type: 'expedition_return' | 'new_quest' | 'quest_expired';
  message: string;
  data?: unknown;
}

// ゲーム状態
export interface GameState {
  playerName: string;
  day: number;              // 1-365
  money: number;
  reputation: number;       // 0-100
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
}

// 行動タイプ
export type ActionType =
  | 'alchemy'
  | 'quest'
  | 'expedition'
  | 'shop'
  | 'rest'
  | 'study';
