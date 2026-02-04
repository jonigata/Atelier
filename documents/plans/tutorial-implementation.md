# チュートリアルナラティブ 実装計画

設計文書: `documents/tutorial_design.md`

---

## Step 0: プランファイル設定

**新規ファイル:** `.claude/settings.json`

```json
{
  "plansDirectory": "./documents/plans"
}
```

`documents/plans/` ディレクトリも作成する。

---

## 概要

マイルストーン型のチュートリアル。プレイヤーの行動に応じて5人のキャラクターと出会い、機能が解放されていく。

**解放フロー:**
1. ゲーム開始 → 休息・勉強（マルタ）
2. 最初のレシピ習得 → 調合（エルザ）
3. 最初の調合成功 → 依頼（トーマス）
4. 最初の依頼受注 → ショップ（ハンナ）
5. 最初の依頼完了 → 採取（ガルド）

---

## 実装ステップ

### Step 1: 型定義の追加

**ファイル:** `src/lib/models/types.ts`

```typescript
// チュートリアル進行状態
export interface TutorialProgress {
  isActive: boolean;                    // チュートリアル中か
  currentMilestone: number;             // 現在のマイルストーン (0-5)
  unlockedActions: ActionType[];        // 解放済みアクション
  pendingDialogue: TutorialDialogue | null;  // 表示待ちの会話
}

// キャラクターとの会話
export interface TutorialDialogue {
  characterName: string;
  characterTitle: string;
  lines: string[];
}

// MorningEvent.type に 'tutorial' を追加
export type MorningEventType =
  | 'expedition_return'
  | 'new_quest'
  | 'quest_expired'
  | 'tutorial';
```

**GameStateに追加:**
```typescript
tutorialProgress: TutorialProgress;
```

---

### Step 2: チュートリアルデータの作成

**新規ファイル:** `src/lib/data/tutorial.ts`

```typescript
// マイルストーン定義
export const milestones = [
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
    dialogue: [...],
  },
  // ... 残り3つ
];

// 経験者モード用
export const veteranDialogue = {
  character: { name: 'マルタ', title: 'アカデミー事務員' },
  lines: [
    '経験者の方ですね。では手短に。工房の鍵です',
    '全ての機能が使えます。良い1年を',
  ],
};
```

---

### Step 3: ストア関数の追加

**ファイル:** `src/lib/stores/game.ts`

```typescript
// 初期状態にtutorialProgressを追加
function createInitialState(isTutorial: boolean = true): GameState {
  return {
    // ... 既存フィールド
    tutorialProgress: {
      isActive: isTutorial,
      currentMilestone: 0,
      unlockedActions: isTutorial ? ['rest', 'study'] : ALL_ACTIONS,
      pendingDialogue: isTutorial ? milestones[0].dialogue : null,
    },
  };
}

// アクション関数
export function advanceTutorialMilestone(milestoneId: number): void;
export function setTutorialDialogue(dialogue: TutorialDialogue | null): void;
export function completeTutorial(): void;
export function isActionUnlocked(action: ActionType): boolean;
```

---

### Step 4: チュートリアルサービスの作成

**新規ファイル:** `src/lib/services/tutorial.ts`

```typescript
// マイルストーン達成チェック（各アクション完了時に呼び出し）
export function checkMilestoneProgress(): void {
  const state = get(gameState);
  if (!state.tutorialProgress.isActive) return;

  const current = state.tutorialProgress.currentMilestone;

  // マイルストーン1: 最初のレシピ習得
  if (current === 0 && state.knownRecipes.length > 0) {
    triggerMilestone(1);
  }
  // マイルストーン2: 最初の調合成功
  else if (current === 1 && state.craftedItems.length > 0) {
    triggerMilestone(2);
  }
  // ... 以下同様
}

function triggerMilestone(id: number): void {
  const milestone = milestones[id];
  advanceTutorialMilestone(id);
  setTutorialDialogue({
    characterName: milestone.character.name,
    characterTitle: milestone.character.title,
    lines: milestone.dialogue,
  });
}
```

---

### Step 5: 会話ダイアログUIの作成

**新規ファイル:** `src/components/TutorialDialogue.svelte`

```svelte
<script>
  import { gameState, setTutorialDialogue } from '$lib/stores/game';

  let currentLine = 0;
  $: dialogue = $gameState.tutorialProgress.pendingDialogue;

  function nextLine() {
    if (currentLine < dialogue.lines.length - 1) {
      currentLine++;
    } else {
      setTutorialDialogue(null);
      currentLine = 0;
    }
  }
</script>

{#if dialogue}
  <div class="dialogue-overlay" on:click={nextLine}>
    <div class="dialogue-box">
      <div class="character-name">
        {dialogue.characterName}
        <span class="title">{dialogue.characterTitle}</span>
      </div>
      <div class="dialogue-text">
        「{dialogue.lines[currentLine]}」
      </div>
      <div class="continue-hint">クリックで続ける</div>
    </div>
  </div>
{/if}

<style>
  .dialogue-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 2rem;
    z-index: 100;
  }
  .dialogue-box {
    background: #2a2a3a;
    border: 2px solid #8b7355;
    border-radius: 8px;
    padding: 1.5rem;
    max-width: 600px;
    width: 90%;
  }
  /* ... */
</style>
```

---

### Step 6: ActionMenuの修正

**ファイル:** `src/components/ActionMenu.svelte`

```svelte
<script>
  import { gameState } from '$lib/stores/game';

  $: unlockedActions = $gameState.tutorialProgress.unlockedActions;

  function isLocked(actionType: ActionType): boolean {
    return $gameState.tutorialProgress.isActive &&
           !unlockedActions.includes(actionType);
  }
</script>

{#each actions as action}
  <button
    class="action-button"
    class:locked={isLocked(action.type)}
    disabled={isLocked(action.type) || ...既存の条件}
    on:click={() => onSelect(action.type)}
  >
    <!-- 既存の内容 -->
    {#if isLocked(action.type)}
      <span class="lock-icon">🔒</span>
    {/if}
  </button>
{/each}
```

---

### Step 7: 既存処理への統合

**ファイル:** `src/lib/stores/game.ts` の各アクション関数末尾に追加

```typescript
// learnRecipe() の末尾
import { checkMilestoneProgress } from '$lib/services/tutorial';
checkMilestoneProgress();

// markItemCrafted() の末尾
checkMilestoneProgress();

// addActiveQuest() の末尾
checkMilestoneProgress();

// completeQuest() などの依頼完了処理末尾
checkMilestoneProgress();
```

---

### Step 8: メインページへの統合

**ファイル:** `src/routes/+page.svelte`

```svelte
<script>
  import TutorialDialogue from '$lib/components/TutorialDialogue.svelte';
</script>

<!-- 既存のコンテンツ -->
{#if $gameState.phase === 'ending'}
  ...
{:else}
  <HUD />
  <main>...</main>
  <MessageLog />
{/if}

<!-- チュートリアルダイアログ（最前面） -->
<TutorialDialogue />
```

---

### Step 9: ゲーム開始画面の追加（任意）

**新規ファイル:** `src/components/GameStartScreen.svelte`

新規ゲーム開始時に「チュートリアル」or「経験者モード」を選択。

---

## 修正ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/lib/models/types.ts` | TutorialProgress型、MorningEventType拡張 |
| `src/lib/stores/game.ts` | 初期状態にtutorialProgress追加、アクション関数追加 |
| `src/lib/data/tutorial.ts` | **新規** マイルストーン・セリフデータ |
| `src/lib/services/tutorial.ts` | **新規** マイルストーン進行ロジック |
| `src/components/TutorialDialogue.svelte` | **新規** 会話ダイアログUI |
| `src/components/ActionMenu.svelte` | ロック状態の表示・制御 |
| `src/routes/+page.svelte` | TutorialDialogueの統合 |

---

## 検証方法

1. `npm run dev` でサーバー起動
2. 新規ゲーム開始 → マルタのダイアログ確認
3. 「勉強」「休息」以外がロックされていることを確認
4. 勉強でレシピ習得 → エルザのダイアログ → 調合解放
5. 調合成功 → トーマスのダイアログ → 依頼解放
6. 依頼受注 → ハンナのダイアログ → ショップ解放
7. 依頼完了 → ガルドのダイアログ → 採取解放（全機能解放）
8. 以降は通常プレイ

---

## 実装順序

1. 型定義 → データ → ストア（基盤）
2. チュートリアルサービス（ロジック）
3. TutorialDialogue.svelte（UI）
4. ActionMenu修正（ロック表示）
5. 既存処理への統合
6. メインページ統合
7. テスト・調整
