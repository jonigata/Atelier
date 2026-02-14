// アイテムカテゴリ
export type ItemCategory = 'herb' | 'ore' | 'water' | 'misc' | 'plant' | 'wood' | 'crystal' | 'product';

// アイテム定義（マスタ）
export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  basePrice: number;
  description: string;
}

// アイテムの来歴
export interface ItemOrigin {
  type: 'expedition' | 'shop' | 'crafted' | 'reward' | 'initial' | 'merchant';
  day: number;
  areaId?: string;       // 採取地（expedition時）
  flavorText?: string;   // 短い情景描写
}

// =====================================
// 機材システム
// =====================================

// 機材カテゴリ
export type EquipmentCategory = 'cauldron' | 'time' | 'material' | 'economy' | 'special';

// 機材定義（マスタ）
export interface EquipmentDef {
  id: string;
  name: string;
  description: string;
  category: EquipmentCategory;
  price: number;
  effectDescription: string; // UI表示用の効果説明
}

// =====================================
// 旅商人マルコ
// =====================================

// マルコの商品枠の種類
export type MerchantSlotType = 'equipment' | 'recipe_book' | 'rare_material';

// マルコの商品枠
export interface MerchantSlot {
  type: MerchantSlotType;
  id: string;           // equipmentId, bookId, or itemId
  price: number;
  purchased: boolean;   // この訪問中に購入済みか
}

// マルコの今月のラインナップ
export interface MerchantLineup {
  month: number;        // 何月のラインナップか (1-12)
  slots: MerchantSlot[];
}

// 所持アイテム（品質付き）
export interface OwnedItem {
  itemId: string;
  quality: number; // 1-100
  origin?: ItemOrigin;
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
  requiredFacilities?: string[]; // 必要な設備ID（すべて必要）
}

// 設備効果の種類
type FacilityEffectScope = 'all' | 'category';

// 設備効果
export interface FacilityEffect {
  type: 'success_rate' | 'quality';
  value: number;
  scope: FacilityEffectScope;
  targetCategory?: ItemCategory; // scope='category' の場合
}

// 設備定義（マスタ）
export interface FacilityDef {
  id: string;
  name: string;
  description: string;
  type: 'permanent' | 'inventory'; // permanent=フラグ, inventory=所持品
  itemId?: string; // type='inventory' の場合、対応するアイテムID
  effects: FacilityEffect[];
}

// レシピ本（教科書）定義（マスタ）
export interface RecipeBookDef {
  id: string;
  name: string;
  description: string;
  recipeIds: string[];  // この本に含まれるレシピID
  basePrice: number;    // ショップでの購入価格
  studyDays: number;    // 勉強に必要な日数
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

// 朝のイベント（Union型で型安全に）
export type MorningEvent =
  | { type: 'expedition_return'; message: string; data: OwnedItem[] }
  | { type: 'new_quest'; message: string }
  | { type: 'quest_expired'; message: string }
  | { type: 'merchant_arrival'; message: string }
  | { type: 'merchant_departure'; message: string };

// チュートリアル会話
// 構造化された報酬アイテム（アイコン表示用）
export interface RewardDisplay {
  text: string;
  itemId?: string;  // アイコン表示用（アイテム報酬の場合）
  iconUrl?: string; // カスタムアイコンURL（アクションアンロック等）
  type: 'money' | 'item' | 'reputation' | 'recipe' | 'unlock' | 'exp' | 'villageDevelopment';
  gaugeData?: {     // ゲージ演出用
    before: number;
    after: number;
    max: number;
    label: string;  // ゲージラベル（例: "Lv.3"）
  };
}

// ダイアログ1行分（文字列 or 表情付き）
export type NarrativeLine = string | { text: string; expression: string };

export interface EventDialogue {
  characterName: string;
  characterTitle: string;
  characterFaceId?: string;  // キャラクター顔画像ディレクトリ名
  lines: NarrativeLine[];
  eventImage?: string;  // イベントCG画像パス
  achievementTitle?: string;  // アチーブメント達成時のタイトル
  achievementCategory?: AchievementCategory;  // アチーブメントカテゴリ（アイコン表示用）
  rewardsTitle?: string;      // 報酬画面のメインタイトル（デフォルト: "報酬獲得！"）
  rewards?: string[];         // 報酬詳細リスト（後方互換性のため残す）
  structuredRewards?: RewardDisplay[];  // 構造化された報酬（アイコン付き）
}

// チュートリアル進行状態（アクションアンロック管理）
export interface TutorialProgress {
  unlockedActions: ActionType[];
  pendingDialogue: EventDialogue | null;
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
  ownedBooks: string[];     // 所持しているレシピ本のID
  knownRecipes: string[];   // 勉強して習得したレシピ

  activeQuests: ActiveQuest[];
  availableQuests: QuestDef[];
  completedQuestCount: number;
  failedQuestCount: number;
  newQuestCount: number;       // 未確認の新規依頼数
  selectedQuestId: string | null; // 依頼画面で選択中の依頼ID

  expedition: Expedition | null;

  craftedItems: string[];
  discoveredItems: string[];
  facilities: string[]; // 解放済み永続設備ID

  // 機材システム
  ownedEquipment: string[];          // 所持している機材IDの配列
  activeCauldron: string | null;     // 現在セットしている錬金釜ID

  // 旅商人マルコ
  merchantLineup: MerchantLineup | null;  // 現在の月のラインナップ
  merchantVisitedMonths: number[];         // 訪問があった月の記録

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
  | 'inventory'
  | 'album'
  | 'traveling_merchant';

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
  | 'self_investment'     // 自分への投資が実る
  | 'village_girl'        // 村娘リーネのイベント
  | 'merchant_visit'      // 旅商人マルコの訪問
  | 'rival_pressure';     // ライバル ヴィクトの圧力

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
  exp?: number;              // 錬金経験値
  villageDevelopment?: number; // 村発展度
  recipes?: string[];
  unlocks?: ActionType[];  // アクションアンロック
  facilities?: string[];   // 設備アンロック
  originLabel?: string;    // 報酬アイテムの入手元ラベル（省略時はアチーブメントtitle）
}

// アチーブメント条件の種類
export type AchievementConditionType =
  | 'level'
  | 'reputation'
  | 'money'
  | 'quest_count'
  | 'active_quest_count'    // 受注中の依頼数
  | 'craft_count'
  | 'craft_item'
  | 'craft_quality'
  | 'expedition_count'
  | 'recipe_count'
  | 'consecutive_quests'
  | 'total_sales'
  | 'day'                   // 日付条件（ゲーム開始時など）
  | 'village_development'   // 村発展度
  | 'inventory_opened';     // 所持品を開いた

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
  narrativeLines: NarrativeLine[];  // 複数行のダイアログ（表情指定可）
  conditions: AchievementCondition[];
  reward: AchievementReward;
  prerequisite?: string[];
  priority: number;
  autoComplete?: boolean;  // ゲーム開始時に自動達成
  important?: boolean;  // HUDに目標として表示するか
  eventImage?: string;  // イベントCG画像ID（static/images/events/{id}.png）
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
  inventoryOpened: boolean;
}
