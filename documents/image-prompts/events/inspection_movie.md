# 査察ムービー — ストーリーボード & プロンプト

査察イベント冒頭に再生するショートムービー（5〜8秒想定）。
査察官が村の土の道を歩いて工房に向かってくる様子を、足元から煽って撮る。
プレイヤーに「来た……」という緊張感を与えるのが目的。

---

## カット構成

### Cut 1 — 足元クローズアップ（2〜3秒）
**画角**: 超ローアングル、地面すれすれ
**内容**: ぴかぴかに磨かれた黒い革靴が、未舗装の土の道を一歩ずつ歩いてくる。
靴だけが異様にきれい。村の汚れた道との対比。歩調はゆっくり、重い。
土埃がわずかに舞う。画面手前にボケた野草。

```
prompt (Cut 1 / first frame):
Extreme low angle shot at ground level. Polished black leather shoes stepping on
an unpaved dirt road. Only the shoes and the hem of a black frock coat are visible.
Dust motes float in warm afternoon light. Blurred wildflowers and weeds in the
foreground. Rustic rural village road, weathered stone building walls barely visible
in the background. Shallow depth of field. Cinematic anime style, dramatic lighting,
single unified illustration, no split screen.
```

### Cut 2 — 膝下〜腰（1〜2秒）
**画角**: ローアングル、やや引き
**内容**: カメラが少し上がり、黒いフロックコートの裾、書類挟みを持つ手が見える。
まだ顔は映さない。歩みは止まらず、一定のリズムで近づいてくる。

```
prompt (Cut 2):
Low angle shot from knee height. A tall thin man in a long black frock coat walking
on a dirt village road. A clipboard with papers is held at his side. Only the body
from waist down is visible — face not shown. Afternoon sunlight casting long shadows.
Rustic thatched-roof buildings line the road. Cinematic anime style, dramatic
composition, single unified illustration.
```

### Cut 3 — 全身シルエット or 逆光（1〜2秒）
**画角**: 正面やや見上げ
**内容**: 査察官が工房の前で立ち止まる。逆光で顔は暗く、シルエット気味。
眼鏡のレンズだけがキラリと光る。「採点者の圧」を画で表現。

```
prompt (Cut 3):
A tall thin man in a black frock coat standing at the entrance of a rustic alchemy
workshop. Backlit by afternoon sun, his face is in shadow — only his thin
silver-rimmed rectangular glasses catch the light with a sharp glint. He holds a
clipboard. Dramatic silhouette composition, low camera angle looking up. Weathered
stone and timber workshop with potion bottles visible through the window. Cinematic
anime style, single unified illustration.
```

### Cut 4 — 顔アップ（1秒）→ 既存のイベントCG or ダイアログへ遷移
**画角**: バストアップ
**内容**: 査察官の顔。感情を映さない灰色の目。口元が厳しい。
短く「……」と間があり、セリフダイアログに遷移。

```
prompt (Cut 4):
Close-up portrait of a stern middle-aged man with neatly combed silver hair. Gray
emotionless eyes behind thin silver-rimmed rectangular glasses. Gaunt face with
hollow cheeks and a severe mouth. White shirt collar visible under a black frock coat.
A guild crest necktie pin. Neutral expression with an intimidating aura. Warm indoor
lighting from the side. Cinematic anime style, single unified illustration.
```

---

## 技術ノート

- 縦画面（スマホ）前提のため、各カットは **9:16 縦長** で構成する
- 実装時は各カットを縦長静止画+パン/ズームアニメーションで表現するか、
  動画生成AIで1カットずつ作るかは要検討
- 現在はCut 1の静止画をイベント画像として使用（`inspection_approach.png`）
- InspectionCutscene.svelte の背景画像を差し替えれば組み込み可能

## キャラクターリファレンス

- 査察官立ち絵: `documents/images/characters/inspector/inspector-1.png`
- 査察官顔: `documents/images/characters/inspector/inspector-face-*.png`
- 靴の描写: 「ぴかぴかに磨かれた黒い革靴」（character_designs.md）
