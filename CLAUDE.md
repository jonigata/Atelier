# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

../.bareのworktree構造です。

ゲームデザインに関するオーダーを受けたときは、まず最初にdocuments/を読んでください。
サーバは基本的に起動しっぱなしなので、いちいち立ち上げ直す必要はありません
コミットは頼まれたときだけやってください

# 画像

falで画像生成するときは
背景透過のもの(アイコンなど)はgpt-image-1.5(medium, transparent)で。
背景透過でないものはflux.2.kleinで。
同じ種別のもの（例えば素材アイコン）を作るときに同じスタイルプロンプトを使うため、image-prompts.mdを参照・更新して下さい。


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

- `documents/game_design.md` - Game concept, systems, balance
- `documents/technical_design.md` - Implementation details, status
