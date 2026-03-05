# レスポンシブスケーリング設計

## 方針

**960px基準の固定レイアウト + CSS `zoom` による全体スケーリング**

既存の960px基準レイアウトをそのまま維持し、画面幅に応じて `zoom` で等比拡縮する。
960px未満の端末では縮小される。960px以上ではzoom=1のまま従来通りの表示。

## なぜこの方式か

- 既存の960pxレイアウトを変更せずにそのまま使える
- ゲームUIは「固定レイアウトをそのまま拡大」するのが最も自然
- px指定のまま開発でき、レスポンシブ対応のコストが低い
- Firefox も v126（2024年6月）で `zoom` 対応済み
- レイアウト崩れが原理的に発生しない

## スケーリングの挙動

| 端末例 | 画面幅 | zoom値 | 見た目 |
|--------|--------|--------|--------|
| iPhone SE | 320px | 0.33 | 1/3に縮小 |
| 一般スマホ | 375px | 0.39 | 約4割 |
| 大きめスマホ | 430px | 0.45 | 約半分 |
| タブレット | 768px | 0.8 | やや縮小 |
| 基準 | 960px | 1.0 | 等倍 |
| PC | 1200px+ | 1.0 | 等倍（従来通り960px中央表示） |

## 基準値

- **基準幅**: 960px
- **最大zoom**: 1.0（PCでは従来通り960px中央表示を維持）
- **最小zoom**: なし（小さい端末では自然に縮小）

## コンテナ構造

```
<html> ← zoom適用先
  <body>
    .game-container ← max-width: 960px, margin: 0 auto
      HUD ← 固定ヘッダー
      .main-panel ← flex: 1, スクロール領域
      overlays ← ダイアログ等
```

## 高さの扱い

- 横幅は zoom で制御されるが、縦横比は端末ごとに異なる
- 高さは固定せず、HUD（固定）+ メインパネル（スクロール）で対応
- `100vh` は zoom 適用後の値になるため、JSで実ビューポート高さを取得して設定

## zoom計算

```ts
function updateZoom() {
  const BASE_WIDTH = 960;
  const MAX_ZOOM = 1.0;

  // CSS zoomをリセットして素のビューポート幅を取得
  document.documentElement.style.zoom = '1';
  const vw = window.innerWidth;

  const zoom = Math.min(vw / BASE_WIDTH, MAX_ZOOM);
  document.documentElement.style.zoom = `${zoom}`;

  // 高さ補正: zoomされた状態での実ビューポート高さ
  const vh = window.innerHeight / zoom;
  document.documentElement.style.setProperty('--app-height', `${vh}px`);
}
```

初回実行後、DevToolsモバイルエミュレーションのviewport反映遅延対策として
短時間に複数回再計算する（0ms, 80ms, 200ms, 500ms）。
リサイズ時は `window.resize` と `visualViewport.resize` の両方を監視。

## 既存コードからの変更点

### 変更不要なもの

960px基準のため、既存のmax-widthやレイアウトはそのまま維持。

### 高さの変更

- `height: 100vh` → `height: var(--app-height, 100vh)`

## 注意事項

- `zoom` は `transform: scale()` と違い、レイアウトフローに影響する（正しくリフローされる）
- マウス座標やクリック位置もzoomに追従する
- `position: fixed` な要素もzoom内で正しく動作する
- DevToolsでの確認時はzoom値を意識すること
- コンポーネント内のサイズ指定には `rem` ではなく **`px`** を使うこと。`rem` はルートの `font-size` に依存するため、ベースフォントサイズの変更で意図しない膨張・縮小が起きる
