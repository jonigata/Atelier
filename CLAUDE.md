# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

../.bareのworktree構造です。

ゲームデザインに関するオーダーを受けたときは、まず最初にdocuments/design/を読んでください。

mainブランチではサーバは基本的に5473で起動しっぱなしなので、いちいち立ち上げ直す必要はありません
featureブランチでは5474あたりから空いてるポートを探して起動してください
コミットは頼まれたときだけやってください

ブランチを切って～しろ、と指示されたらまず先にブランチを切って、
そのブランチ(worktree)でドキュメント生成や作業を始めてください。

# デバッグ

必要に応じてデバッグウィンドウにテストに必要な機能を実装して構いません。
但しなるべく汎用的な機能にしてください。

デバッグウィンドウの自動実行機能は、そのときどきで好きに変えて構いません。
例えば、調べたいところの直前まで自動実行するシーケンスなど。

UIのテストについては、限定的に、初手でそれが表示されるような改竄をしても構いません。
また独立性の高いコンポーネント設計をして、デバッグウィンドウで表示させるのもよいでしょう。

### デバッグパネルの主な機能 (`src/components/DebugPanel.svelte`)

必ずしも本体に追従しているとは限らないので、バグっていそうだったらその場で修正してください。

- **全コマンド解放**: チュートリアル進行を無視して全行動（調合・依頼・採取・ショップ・休息・勉強・所持品・アルバム）を一括アンロック
- **自動プレイ**: 指定日数・速度で自動的にゲームを進行（テスト用）
- **村発展度操作**: +10/+20/-10 で村発展度を増減
- **経験値操作**: +50/+90/+100 Exp で経験値を追加（レベルアップ確認等に）
- **体力操作**: -30/-50/-80/全回復 で体力を増減

# 画像

画像を作れと言われたらラッパースクリプトを使ってください。
環境変数はsetting.jsonに書いてあります。
プロンプトのスタイルや生成済み一覧は [`documents/technical/image-prompts.md`](documents/technical/image-prompts.md) を参照・更新すること。

```bash
# アイコン（素材・アクション）— gpt-image-1.5, 背景透過
bash scripts/generate-icon.sh --name <id> --desc "item description" [--type materials|actions]

# イベントCG — seedream v4.5, キャラ参照対応
bash scripts/generate-event.sh --name <id> --prompt "..." [--chars heroine,liene]

# キャラクター立ち絵＋シート＋表情 — seedream v4.5 + nano-banana-pro
bash scripts/generate-character.sh --name <id> --desc "character appearance"
bash scripts/generate-character.sh --name <id> --from 2   # step1完了済みならstep2から
bash scripts/generate-character.sh --name <id> --from 4   # 表情だけ全生成
bash scripts/generate-character.sh --name <id> --expr angry  # 特定表情だけ再生成
```

## 画像関連リファレンス

- [`documents/technical/image-prompts.md`](documents/technical/image-prompts.md) — プロンプト規約・生成済み一覧・スクリプト詳細
- [`documents/design/setting_designs.md`](documents/design/setting_designs.md) — ロケーション・背景ビジュアル設定
- [`documents/design/characters/character_designs.md`](documents/design/characters/character_designs.md) — キャラクター容姿設定
- `documents/design/characters/<name>/` — キャラクター画像（立ち絵・シート・表情）

## Project Overview

Atelier-style resource management simulation game (web-based). Player manages an alchemy workshop over 365 in-game days, crafting items, completing quests, and building reputation.

**Stack**: TypeScript, SvelteKit 2.50, Svelte 5, Vite 7

## Commands

```bash
# Development server (http://localhost:5173)
npm run dev

# Type checking
npm run check
npm run check:watch

# Production build
npm run build
npm run preview
```

No automated test suite - manual browser testing only.

## Architecture

```
Morning Phase → Action Phase → End Turn → (loop until day > 365)
```

### Layer Structure

1. **UI Layer** (`src/components/`) - Svelte components for each game system
2. **State Layer** (`src/lib/stores/game.ts`) - Svelte writable/derived stores
3. **Service Layer** (`src/lib/services/`) - Business logic (game loop, alchemy)
4. **Data Layer** (`src/lib/data/`, `src/lib/models/types.ts`) - Master data and types

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/models/types.ts` | Central TypeScript definitions |
| `src/lib/stores/game.ts` | Game state + 30+ action functions |
| `src/lib/services/gameLoop.ts` | Game loop, phase transitions, morning events |
| `src/lib/services/alchemy.ts` | Crafting logic, success rate, quality calculation |
| `src/routes/+page.svelte` | Main page, phase-based rendering |
| `src/components/ActionPanel.svelte` | Dispatches to system-specific panels |

### State Management Pattern

```typescript
// Immutable updates via store.update()
gameState.update((state) => ({
  ...state,
  inventory: [...state.inventory, newItem]
}));

// Reading current value
const currentState = get(gameState);
```

### Master Data Pattern

Data files in `src/lib/data/` export:
- `Record<string, TypeDef>` object with ID keys
- `getById(id)` helper function

ID convention: `category_number` (e.g., `herb_01`, `ore_02`, `potion_01`)

## Adding New Features

1. Define types in `src/lib/models/types.ts`
2. Add store actions in `src/lib/stores/game.ts`
3. Implement business logic in `src/lib/services/`
4. Create UI component in `src/components/`
5. Wire up in `ActionPanel.svelte`

## Game Systems

- **Alchemy**: Crafting with quality (1-100), success rate based on level
- **Quests**: Time-limited deliveries with reputation rewards/penalties
- **Expeditions**: Multi-day gathering missions to areas
- **Shop**: Buy/sell items with quality-based pricing
- **Study**: Learn new recipes (consumes days)
- **Rest**: Restore stamina

## Design Documents

- `documents/design/` - ゲームデザイン・設定・ストーリー関連
- `documents/technical/` - 実装計画・画像生成プロンプト関連
