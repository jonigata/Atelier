# Image Prompts

画像生成のワークフロー・スタイル規約。同じ種別のものには同じスタイル・手順を使用すること。
各画像のプロンプト本文は `documents/image-prompts/<種別>/<name>.txt` に自動保存される。

---

## 錬金素材アイコン (Material Icons)

**モデル**: `fal-ai/gpt-image-1.5`
**出力先**: `static/icons/materials/`
**プロンプト**: `documents/image-prompts/icons/materials/`

```bash
bash scripts/generate-icon.sh --name herb_03 --desc "glowing blue herb with spiral leaves"
bash scripts/generate-icons.sh   # 一括生成（既存スキップ）
```

---

## アクションアイコン (Action Icons)

**モデル**: `fal-ai/gpt-image-1.5`（素材アイコンと同じスタイル）
**出力先**: `static/icons/actions/`
**プロンプト**: `documents/image-prompts/icons/actions/`

```bash
bash scripts/generate-icon.sh --name shop --type actions --desc "small wooden shop stall with awning"
```

---

## イベント画像 (Event CG)

**モデル**: `fal-ai/bytedance/seedream/v4.5/edit`（キャラ参照あり） / `text-to-image`（参照なし）
**出力先**: `static/images/events/`
**キャラクター参照画像**: `documents/images/characters/` 配下の立ち絵
**プロンプト**: `documents/image-prompts/events/`

```bash
bash scripts/generate-event.sh --name <id> --prompt "..." [--chars heroine,liene]
bash scripts/generate-event.sh --help   # 利用可能キャラ一覧
```

### プロンプト規約

- `--chars` で指定した順に `Figure 1`, `Figure 2`, ... でプロンプト内から参照
- 各キャラの配置（左/右）、表情、ポーズを明示
- 背景は `documents/design/setting_designs.md` のビジュアルキーワードを使う
- 参照画像のポーズと矛盾する指示は避ける
- `single unified illustration, no split screen` を入れて一枚絵を保証
- キャラの目線に気をつけてください。指定しないとカメラ目線になってしまいます。

---

## キャラクター画像 (Character Images)

**原画**: `documents/images/characters/<name>/` → **縮小版**: `static/images/characters/<name>/`（表情 512x512）
**参照テンプレート**: `documents/images/characters/character_sheet.png`
**プロンプト**: `documents/image-prompts/characters/`

4ステップで立ち絵・キャラクターシート・表情画像を生成。`--chibi` でデフォルメ版も可能。

| Step | モデル | 内容 |
|------|--------|------|
| 1 | seedream v4.5 edit | 参照画像のスタイルに合わせた全身立ち絵 (1920x1920) |
| 2 | seedream v4.5 edit | 正面向き・手を下ろした設定画ポーズに修正 |
| 3 | nano-banana-pro edit | キャラクターシート（正面・横・背面 + 表情3種） |
| 4a | seedream v4.5 edit | 立ち絵からneutral（証明写真画角）を生成 |
| 4b | seedream v4.5 edit | neutralから表情差し替えで8枚派生 |
| chibi | seedream v4.5 edit | 立ち絵からデフォルメ/チビ版を生成 |

表情一覧（9種）: neutral, happy, angry, sad, surprised, embarrassed, smug, worried, determined

```bash
bash scripts/generate-character.sh --name melda --desc "A plump, cheerful bakery woman..."
bash scripts/generate-character.sh --name melda --from 4    # 表情だけ全生成
bash scripts/generate-character.sh --name melda --expr angry # 特定表情だけ再生成
bash scripts/generate-character.sh --name melda --chibi      # デフォルメ版
bash scripts/generate-character.sh --help
```

### --desc の書き方

- `documents/design/characters/character_designs.md` の容姿設定を英訳して使う
- 年齢・髪・目・体格・服装・靴・小物を含める
- スタイル指定はスクリプト側で自動付与されるため不要

---

## アクションバナー画像 (Action Banners)

**モデル**: `fal-ai/bytedance/seedream/v4.5/edit`（デフォルメキャラ参照あり）
**出力先**: `static/images/actions/`
**チビ参照画像**: `documents/images/characters/<name>/<name>-chibi.png`
**プロンプト**: `documents/image-prompts/actions/`

2段階で生成:
1. **Phase 1**: 各キャラの立ち絵からデフォルメ版を生成（`--chibi`）
2. **Phase 2**: デフォルメ版を参照画像として、シーンバナーを生成

```bash
bash scripts/generate-action-banners.sh            # 全行程
bash scripts/generate-action-banners.sh --phase2 alchemy  # 指定のみ
```

---

## 機材画像 (Equipment Images)

**モデル**: `fal-ai/bytedance/seedream/v4.5/text-to-image`
**原画**: `documents/images/equipments/`（生成サイズそのまま）→ **縮小版**: `static/images/equipments/`（1024x1024）
**プロンプト**: `documents/image-prompts/equipments/`

### ワークフロー

1. seedream text-to-image で `square_hd` サイズの原画を生成
2. 原画を `documents/images/equipments/<name>.png` に保存
3. プロンプトを `documents/image-prompts/equipments/<name>.txt` に保存
4. リサイズして `static/images/equipments/<name>.png` に配置

```bash
convert documents/images/equipments/<name>.png -resize 1024x1024 static/images/equipments/<name>.png
```

### スタイル規約

- フラット・セルシェーディング・太い黒アウトライン
- 単体オブジェクト・白背景・背景の部屋や小物なし
- 固有名詞（作品名・スタジオ名など）をプロンプトに入れない

---

## スクリプト一覧

| スクリプト | 用途 | 使い方 |
|-----------|------|--------|
| `scripts/generate-icon.sh` | アイコン単体生成（素材・アクション） | `--name ID --desc "説明"` |
| `scripts/generate-icons.sh` | 素材アイコン一括生成（既存スキップ） | 引数なし |
| `scripts/generate-event.sh` | イベントCG生成（キャラ参照対応） | `--name ID --prompt "..." [--chars a,b]` |
| `scripts/generate-character.sh` | キャラクター立ち絵＋シート＋チビ画像生成 | `--name ID --desc "..." [--from N] [--ref img] [--chibi]` |
| `scripts/generate-action-banners.sh` | コマンドボタン用バナー画像生成 | `[--phase1] [--phase2 [action]]` |
