// アイテムカテゴリ
export type ItemCategory = 'herb' | 'ore' | 'water' | 'misc' | 'plant' | 'wood' | 'crystal' | 'medicine' | 'material' | 'metal' | 'magic' | 'device' | 'infrastructure';

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
export type EquipmentCategory = 'time' | 'material' | 'economy' | 'special';

// 機材レアリティ
export type EquipmentRarity = 'common' | 'rare';

// 機材効果（データドリブン）
export type EquipmentEffect =
  // === 調合系 ===
  | { type: 'craft_duplicate'; chance: number; qualityVariance: number }
  | { type: 'craft_quality_cap'; cap: number; failBelowQuality?: number }
  | { type: 'craft_fail_save'; chance: number }
  | { type: 'craft_fail_accumulate'; rate: number }
  | { type: 'craft_combo'; bonusPerCombo: number; maxCombo?: number }
  | { type: 'craft_stamina_mult'; value: number }
  | { type: 'craft_days_halve' }
  | { type: 'craft_days_reduce'; value: number; minOriginalDays?: number }
  // === 素材系 ===
  | { type: 'material_quality_floor'; value: number; materialCategory?: ItemCategory }
  | { type: 'material_quality_bonus'; value: number }
  | { type: 'material_count_reduce'; value: number; minOriginalCount?: number }
  // === 勉強系 ===
  | { type: 'study_days_reduce'; value: number }
  | { type: 'study_instant'; maxLevel?: number }
  // === 行動系 ===
  | { type: 'action_extra'; frequency: number; staminaMult: number }
  | { type: 'craft_success_bonus'; value: number; itemCategory?: ItemCategory }
  | { type: 'craft_quality_bonus'; value: number; itemCategory?: ItemCategory }
  // === 採取系 ===
  | { type: 'expedition_drops_mult'; value: number; materialCategory?: ItemCategory }
  | { type: 'expedition_rare_bonus'; value: number }
  // === 経済系 ===
  | { type: 'sell_price_mult'; value: number; minQuality?: number; itemCategory?: ItemCategory; craftedOnly?: boolean }
  | { type: 'buy_price_mult'; value: number }
  | { type: 'quest_money_mult'; value: number }
  | { type: 'quest_reputation_bonus'; value: number }
  | { type: 'quest_quality_bonus'; qualityThreshold: number; moneyBonus?: number; reputationBonus?: number }
  | { type: 'craft_fail_recover'; count: number }
  | { type: 'sell_same_day_bonus'; minCount: number; value: number }
  // === 特殊系 ===
  | { type: 'preview_quests'; days: number; count?: number }
  | { type: 'preview_weather'; days: number }
  | { type: 'preview_events'; days: number }
  | { type: 'decompose'; qualityLossMult: number; hintChance: number; maxQuality?: number }
  | { type: 'decompose_extra'; count: number }
  | { type: 'inventory_expand'; value: number }
  | { type: 'all_probability_bonus'; value: number };

// 機材定義（マスタ）
export interface EquipmentDef {
  id: string;
  name: string;
  description: string;
  category: EquipmentCategory;
  rarity: EquipmentRarity;
  price: number;
  effectDescription: string; // UI表示用の効果説明
  effects: EquipmentEffect[];
  enabled?: boolean; // false で入手候補から除外（未実装機能の封印用）。省略時は true 扱い
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
  /** 調合日数（0.1日単位）。10=1日, 5=0.5日。craftDaysToActual()で実日数に変換 */
  craftDaysTenths: number;
  difficulty: number; // 1-10
  expReward: number;
}

// =====================================
// 村施設システム（ドロー報酬）
// =====================================

export type BuildingEffectType =
  | 'daily_item'         // 毎朝アイテム入手
  | 'periodic_item'      // N日おきにアイテム入手
  | 'craft_success'      // 調合成功率+
  | 'craft_quality'      // 調合品質+
  | 'craft_days_reduce'  // 調合日数短縮（カテゴリ限定可）
  | 'craft_days_halve'  // 調合日数半減（カテゴリ限定可）
  | 'study_days_reduce'  // 勉強日数-
  | 'max_stamina_bonus'  // 最大体力+
  | 'expedition_bonus'   // 採取ドロップ増
  | 'sell_price'         // 売値+%
  | 'buy_price'          // 買値-%
  | 'reputation_exp_bonus'  // 名声exp+%
  | 'village_exp_bonus';    // 村発展exp+%

export interface BuildingEffect {
  type: BuildingEffectType;
  value: number;
  itemId?: string;           // daily_item/periodic_item用
  itemCategory?: ItemCategory; // カテゴリ限定
  interval?: number;         // periodic_item用（日数間隔）
}

export interface BuildingLevelData {
  effects: BuildingEffect[];
  effectDescription: string;
}

export interface BuildingDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  levels: BuildingLevelData[];  // index 0 = Lv.1
}

export interface OwnedBuilding {
  buildingId: string;
  level: number;
}

// =====================================
// 助手システム（ドロー報酬）
// =====================================

export interface HelperLevelEffect {
  description: string;
}

export interface HelperDef {
  id: string;
  name: string;
  species: string;
  icon: string;
  description: string;
  maxLevel: number;
  levelEffects: HelperLevelEffect[];
  craftSuccessBonus: number[];
  craftQualityBonus: number[];
  expeditionDropBonus: number[];
  expeditionRareBonus: number[];
  buyPriceMult: number[];
  sellPriceMult: number[];
  morningStamina: number[];
  staminaCostReduction: number[];
  rareEventBonus: number[];
  reputationExpBonus: number[];
  villageExpBonus: number[];
  greetings: string[];  // レベルごとの挨拶セリフ（index 0=加入時, 1=Lv2, 2=Lv3）
}

export interface OwnedHelper {
  helperId: string;
  level: number;
}

// レシピ本（教科書）定義（マスタ）
export interface RecipeBookDef {
  id: string;
  name: string;
  description: string;
  recipeIds: string[];  // この本に含まれるレシピID
  basePrice: number;    // ショップでの購入価格
  studyDays: number;    // 勉強に必要な日数
  requiredVillageLevel: number; // ショップに並ぶ最低村レベル
}

// 依頼タイプ
export type QuestType = 'deliver' | 'quality' | 'bulk';

// 依頼クライアント定義
export interface QuestClientDef {
  id: string;
  name: string;
  title: string;
  faceId?: string; // 顔画像ディレクトリ名（顔ありキャラのみ）
}

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
  requiredReputationLevel?: number;
  requiredAchievement?: string; // このアチーブメント完了後にのみ出現
  clientId?: string; // 依頼主ID
  completionMessage?: string; // 達成時のセリフ（未設定時はdescriptionにフォールバック）
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
  | { type: 'building_items'; message: string }
  | { type: 'new_quest'; message: string }
  | { type: 'quest_expired'; message: string }
  | { type: 'merchant_arrival'; message: string }
  | { type: 'merchant_departure'; message: string };

// チュートリアル会話
// ゲージアニメーションのセグメント（レベルアップ時の繰り返し表示用）
export interface GaugeSegment {
  from: number;
  to: number;
  max: number;
  label: string;
}

// ゲージ演出データ
export interface GaugeData {
  before: number;
  after: number;
  max: number;
  label: string;
  segments?: GaugeSegment[]; // レベルアップ時の複数セグメントアニメーション
  subtext?: string;          // ゲージ下の補足テキスト（次のドロー目標など）
}

// 構造化された報酬アイテム（アイコン表示用）
export interface RewardDisplay {
  text: string;
  subtitle?: string; // 補足テキスト（効果説明など、小さめに表示）
  itemId?: string;  // アイコン表示用（アイテム報酬の場合）
  iconUrl?: string; // カスタムアイコンURL（アクションアンロック等）
  type: 'money' | 'item' | 'reputation' | 'recipe' | 'unlock' | 'exp' | 'villageDevelopment';
  gaugeData?: GaugeData;
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
  achievementDescription?: string;  // アチーブメント達成理由（例: "調合を10回達成した"）
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

// 査察項目スコア（全日付で全項目を記録）
export interface InspectionScoreSnapshot {
  album: number;      // discoveredItems.length
  quests: number;     // completedQuestCount
  level: number;      // 錬金Lv (calcLevelFromExp(alchemyExp))
  villageDev: number; // 村発展Lv (calcLevelFromExp(villageExp))
  reputation: number; // 名声Lv (calcLevelFromExp(reputationExp))
}

// スコア履歴エントリ（毎朝記録）
export interface DailyScoreEntry {
  day: number;
  total: number;
  inspection?: InspectionScoreSnapshot;
}

// ゲーム状態
export interface GameState {
  playerName: string;
  day: number;              // 1-336
  money: number;
  reputationExp: number;       // 累計経験値（レベルは関数で算出）
  villageExp: number;          // 累計経験値（レベルは関数で算出）
  alchemyExp: number;          // 累計経験値（レベルは関数で算出）
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
  unlockedAreas: string[];       // アンロック済みの採取エリアID

  craftedItems: string[];
  discoveredItems: string[];
  maxQualityByItem: Record<string, number>; // アイテムごとの入手最大品質

  // 機材システム
  ownedEquipment: string[];          // 所持している機材IDの配列
  shopEquipment: { id: string; purchased: boolean }[]; // ショップの機材ラインナップ

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

  // 村施設・助手システム
  buildings: OwnedBuilding[];       // 所有する村施設
  ownedHelpers: OwnedHelper[];     // 所有する助手

  // 査察システム
  completedInspections: number[];  // 処理済み査察日の配列
  gameOverReason: string | null;   // ゲームオーバー理由（null=通常）
  pendingInspectionCutscene: InspectionCutsceneData | null;  // 査察カットシーン用
  inspectionBackdrop: boolean;  // 査察シーケンス中の黒オーバーレイ
  pendingExpeditionReturn: ExpeditionReturnData | null;  // 派遣帰還演出用

  // スコア履歴（毎朝記録）
  scoreHistory: DailyScoreEntry[];
}

// 派遣帰還演出用データ
export interface ExpeditionReturnData {
  areaId: string;
  areaName: string;
  items: OwnedItem[];
}

// 査察カットシーン用データ
export interface InspectionCutsceneData {
  mode: 'movie' | 'evaluation' | 'reward';
  month: number;
  title: string;
  criteria: { label: string; value: string; grade: string }[];
  overallGrade: string;
  passed: boolean;
  /** reward モード用 */
  rewardItems?: { itemId: string; name: string; quality: number; quantity: number }[];
  rewardMoney?: number;
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
  reputationExp?: number;      // 名声経験値
  exp?: number;                // 錬金経験値
  villageExp?: number;         // 村発展度経験値
  recipes?: string[];
  unlocks?: ActionType[];  // アクションアンロック
  unlockAreas?: string[];  // 採取エリアアンロック
  randomCommonEquipment?: number;  // ランダムコモン機材の付与数
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
  triggerOnMorning?: boolean;  // 条件を満たした次の朝に発動
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
