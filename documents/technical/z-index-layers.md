# z-index レイヤー規約

## レイヤー定義

| レイヤー | CSS変数 | 値 | 用途 |
|---------|---------|-----|------|
| local | (変数不要) | 0〜10 | コンポーネント内部の重なり制御 |
| panel | `--z-panel` | 100 | フローティングUI（サイドバー、ログパネル、ドロップダウン） |
| indicator | `--z-indicator` | 500 | 非モーダルな状態表示（保存インジケータ、金額変動） |
| toast | `--z-toast` | 800 | トースト通知 |
| modal | `--z-modal` | 1000 | モーダルダイアログ（背景暗転+コンテンツ） |
| cutscene | `--z-cutscene` | 1100 | 全画面演出（日付遷移、査察カットシーン、休息シーケンス） |
| debug | `--z-debug` | 9000 | デバッグパネル（開発時のみ） |

変数は `:root` (`+layout.svelte`) で定義。

## 使い方

```css
/* モーダルダイアログ */
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
}

/* 全画面演出 */
.cutscene {
  position: fixed;
  inset: 0;
  z-index: var(--z-cutscene);
}
```

## コンポーネント内部（local層: 0〜10）

コンポーネント内の要素同士の重なりには、CSS変数ではなく直接数値（0〜10）を使ってよい。
これらはコンポーネントのスコープ付きスタイル内で完結し、外部に影響しない。

例: `::before`背景と前景テキスト、星の重なり順、stickyヘッダーなど

## スタッキングコンテキストの罠（重要）

`position: fixed` のオーバーレイが正しく全画面に表示されるには、
**祖先要素がスタッキングコンテキストを作ってはいけない**。

### スタッキングコンテキストを作るプロパティの組み合わせ

- `position: relative/absolute/sticky` + `z-index: (auto以外の値)`
- `transform` (none以外)
- `filter` (none以外)
- `perspective` (none以外)
- `will-change: transform/opacity` 等
- `contain: paint` / `contain: layout`

### 禁止パターン

```css
/* NG: .parentがスタッキングコンテキストを作り、
   子の position:fixed ダイアログが閉じ込められる */
.parent {
  position: relative;
  z-index: 1;           /* ← これが原因 */
}
.parent .dialog-overlay {
  position: fixed;
  z-index: var(--z-modal);  /* 1000だが、parentの外では1として扱われる */
}
```

### 正しいパターン

```css
/* OK: z-indexを指定しない → スタッキングコンテキストを作らない */
.parent {
  position: relative;
  /* z-index なし */
}
.parent .dialog-overlay {
  position: fixed;
  z-index: var(--z-modal);  /* ルートのスタッキングコンテキストで1000として機能 */
}
```

### ルール

- `position: fixed` のオーバーレイを含む可能性のある要素には `z-index` を付けない
- コンポーネント内部の重なり制御でどうしても `z-index` が必要な場合は、
  そのコンポーネント内にモーダルやオーバーレイを配置しない設計にする

## 各レイヤーの判断基準

| 特徴 | 分類 |
|------|------|
| 背景暗転（backdrop）で画面全体を覆い、操作をブロックする | **modal** |
| 画面全体を完全に覆い、ゲーム進行の演出を行う | **cutscene** |
| 画面の一部にフロート表示、他の操作も可能 | **panel** |
| 一時的に表示されて消える通知 | **toast** / **indicator** |

modal と cutscene の違い:
- **modal**: ユーザーの操作（クリック/選択）で閉じる。背景が透けて見える。
- **cutscene**: ゲームループが制御する。背景は不透明（#000）で完全に覆う。
