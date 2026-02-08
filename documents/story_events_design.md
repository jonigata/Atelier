# ストーリーイベント設計書

setting_sketch.md の物語設定を、plot_insertion_manual.md のアチーブメントシステムに基づいて具体化したストーリーイベント設計書。

---

## 1. キャラクター定義表

### 1.1 既存キャラクターのマッピング

| 既存キャラ | → | 新キャラ | narrative 種別 | 備考 |
|-----------|---|---------|---------------|------|
| オルト（村長） | → | エルダ村長 | `village_growth` | 村娘の父。名前は作中で「村長」呼びを基本とし、村娘が「お父さん」と呼ぶ |
| イリーナ（師匠） | → | イリーナ（師匠） | `master_gift` / `master_teaching` | 役割維持。手紙での登場。主人公を「座学は優秀だが実践不足」と評価 |
| カリン（よろず屋） | → | マルコ（旅商人） | `merchant_visit`（新規） | 胡散臭い旅商人。定期的に村を訪問。素材を売りつけ/買い叩く |
| ガルド（冒険者） | → | 冒険者パーティー | `character_trial` | リーダー: レン（剣士）、メンバー: ピィ（斥候） の2人構成 |
| ???（匿名支援者） | → | 削除 | - | ライバルの伏線として再編。`patron_support` は査察官の匿名評価として転用 |
| 村人（農夫） | → | 村人（汎用） | `villager_gift` | 既存のまま |
| 依頼主（汎用） | → | 依頼主（汎用） | `client_gratitude` | 既存のまま |

### 1.2 新規キャラクター

| キャラクター | 肩書き | narrative 種別 | 性格・特徴 |
|------------|-------|---------------|-----------|
| **リーネ** | 村娘（村長の娘） | `village_girl`（新規） | 村への愛着が強いが「田舎のつまらなさ」にうんざりもしている。過去に「村を助ける」と言って来た人が全員帰った経験から、主人公を警戒。祖母が民間療法の担い手で、薬草・自然素材に詳しい。主人公と対照的に「知識はあるが活かし方を知らない」立場 |
| **ヴィクト** | ライバル錬金術師 | `rival_pressure`（新規） | 主人公と同じ師匠組合の派遣錬金術師。先輩格。隣村に赴任中で、半年後の査察で同時評価。主人公を見下すが直接妨害はしない。「どうせ無理でしょ」と余裕を見せる。存在自体がプレッシャー |
| **ゴルド** | 鍛冶屋のおやじ | `villager_gift` | 無口だが面倒見がいい。錬成器具の修理を担当 |
| **メルダ** | パン屋のおばちゃん | `client_gratitude` | おしゃべりで情報源。依頼の多くはここから始まる。噂話でライバルの存在を示唆する役割 |
| **査察官** | 師匠組合査察官 | `patron_support`（転用） | 四半期ごとの関門で登場。厳格だが公正 |

### 1.3 narrativeCharacter 定義（実装用）

```typescript
// 新規 narrativeCharacters エントリ
village_girl: { name: 'リーネ', title: '村娘' },
merchant_visit: { name: 'マルコ', title: '旅商人' },
rival_pressure: { name: 'ヴィクト', title: 'ライバル錬金術師' },

// 既存の更新
village_growth: { name: '村長', title: 'エルダ村長' },
character_trial: null,  // パーティーごとに個別指定（維持）
patron_support: { name: '査察官', title: '師匠組合' },  // 匿名支援者→査察官に転用
```

---

## 2. 四半期ストーリーアーク

### 2.1 タイムライン概要

| 期間 | アーク名 | テーマ | 関門 |
|------|---------|-------|------|
| Q1 (Day 1-90) | 「先生と呼ばれて」 | 到着と期待のギャップ、初めての信頼構築 | Day 90: 師匠組合への経過報告 |
| Q2 (Day 91-180) | 「この村の錬金術師」 | 居場所の意識、ライバルとの対比 | Day 180: 中間査察（ライバルとの直接比較） |
| Q3 (Day 181-270) | 「エルダの宝」 | 特産品開発、挫折と再起 | Day 270: 査察官の予告訪問 |
| Q4 (Day 271-365) | 「自分の居場所」 | 完成と証明、帰属 | Day 365: 最終査察（エンディング分岐） |

---

## 3. アチーブメント設計

### priority 帯域の拡張

既存の帯域を維持しつつ、ストーリーイベント用の帯域を新設する。

| カテゴリ | priority 範囲 | 用途 |
|---------|-------------|------|
| チュートリアル | 1 - 100 | 既存（一部書き換え） |
| 調合系 | 101 - 200 | 既存維持 |
| 依頼系 | 201 - 300 | 既存維持 |
| 採取系 | 301 - 400 | 既存維持 |
| 経済系 | 401 - 500 | 既存維持 |
| 熟練系 | 501 - 600 | 既存維持 |
| **ストーリー: Q1** | **601 - 700** | **新設** |
| **ストーリー: Q2** | **701 - 800** | **新設** |
| **ストーリー: Q3** | **801 - 900** | **新設** |
| **ストーリー: Q4** | **901 - 1000** | **新設** |
| **エンディング** | **1001 - 1100** | **新設** |

> 既存アチーブメント（priority 1-600）はそのまま残し、ストーリーイベントは 601 以降に追加する。
> ストーリーイベントは既存の汎用イベントより後に評価されるため、同フレームで両方発火した場合は汎用→ストーリーの順に表示される。

---

### 3.1 チュートリアル系の書き換え（priority: 1-100）

既存のチュートリアルイベントを setting_sketch のキャラクターに合わせて**セリフのみ更新**する。IDやconditions、rewardは変更しない。

#### ach_game_start（到着イベント — 書き換え）

```typescript
ach_game_start: {
  id: 'ach_game_start',
  title: '新しい日々',
  description: 'エルダ村に到着した',
  hint: '物語が始まる',
  category: 'tutorial',
  narrative: 'village_growth',
  narrativeCharacter: { name: '村長', title: 'エルダ村長' },
  narrativeLines: [
    'おお、ついに来てくれたか！ 君がイリーナ先生の弟子だな',
    '私はこの村の村長をやっている。もう何年も組合に頼み続けてな……',
    'ここが君の工房だ。少し古いが、娘と一緒に掃除しておいた',
    'エルダ村を頼む。君が来てくれるのを、村のみんなが待っていたんだ',
  ],
  conditions: [{ type: 'day', target: 1 }],
  reward: { unlocks: ['rest', 'study'] },
  priority: 1,
  autoComplete: true,
},
```

#### ach_first_recipe（知識の扉 — 書き換え）

```typescript
ach_first_recipe: {
  // ...ID, title, description, hint, category, conditions, reward, priority, important: 既存維持
  narrative: 'master_teaching',
  narrativeCharacter: { name: 'イリーナ', title: '師匠（手紙）' },
  narrativeLines: [
    '師匠からの手紙が届いた――',
    '「まずは基本を思い出しなさい。あなたの座学は誰にも負けないはずよ」',
    '「これは餞別。実地でこそ錬金術は身につくもの。頑張りなさい」',
  ],
  // ...以下既存維持
},
```

#### ach_first_craft（錬金術士の目覚め — 書き換え）

```typescript
ach_first_craft: {
  // ...既存維持
  narrative: 'villager_gift',
  narrativeCharacter: { name: 'メルダ', title: 'パン屋のおばちゃん' },
  narrativeLines: [
    'あらあら、あんたが噂の先生かい？ 私はメルダ、パン屋をやってるのよ',
    'もう薬が作れるの？ すごいねえ！',
    '実はちょっと頼みたいことがあるんだけど……',
    '村長んとこに言ってあるから、依頼を見てちょうだいな',
  ],
  // ...conditions, reward, priority, prerequisite: 既存維持
},
```

#### ach_first_quest（村との繋がり — 書き換え）

```typescript
ach_first_quest: {
  // ...既存維持
  narrative: 'merchant_visit',
  narrativeCharacter: { name: 'マルコ', title: '旅商人' },
  narrativeLines: [
    'よぉ、新しい先生ってのはあんたかい。俺はマルコ、旅商人さ',
    '依頼を受けたなら素材がいるだろ？ ちょうどいいのがあるぜ',
    'まぁ……ちょっとだけ色をつけさせてもらうがね。商売だからな',
    'これはご挨拶代わりだ。困ったらいつでも声かけな',
  ],
  // ...conditions, reward, priority, prerequisite: 既存維持
},
```

#### ach_first_complete / ach_adventurer_arrival / ach_first_expedition

```typescript
ach_first_complete: {
  // ...既存維持
  narrativeCharacter: { name: '村長', title: 'エルダ村長' },
  narrativeLines: [
    '聞いたぞ、依頼を達成したそうだな。やるじゃないか',
    '村の者が喜んでいたよ。これは心付けだ、受け取ってくれ',
    'こうして一つずつ……この村の役に立ってくれれば嬉しい',
  ],
  // ...
},

ach_adventurer_arrival: {
  // ...既存維持
  narrativeCharacter: { name: 'レン', title: '冒険者' },
  narrativeLines: [
    'あんたがこの村の錬金術師か。俺はレン、こいつはピィ。冒険者をやってる',
    '面白い村があると聞いてな。錬金術師がいるなら素材の需要もあるだろ？',
    '森の奥まで行ける。金は貰うが、悪い取引にはならないさ',
    'ピィ「よろしくねー！ 珍しいもの見つけたら教えるから！」',
  ],
  // ...
},

ach_first_expedition: {
  // ...既存維持
  narrativeCharacter: { name: 'レン', title: '冒険者' },
  narrativeLines: [
    'ピィ「これ、帰り道で見つけたの！ おまけだよー」',
    'レン「……見込みがあるな。次も頼んでくれ」',
  ],
  // ...
},
```

---

### 3.2 Q1 ストーリーイベント (Day 1-90):「先生と呼ばれて」

テーマ: 過大な期待 vs 素人の現実、初めての信頼構築

#### ach_story_village_girl_cold（村娘の冷たい出迎え）

```typescript
ach_story_village_girl_cold: {
  id: 'ach_story_village_girl_cold',
  title: '冷たい視線',
  description: '村娘リーネに出会った',
  hint: '村での生活を始めよう',
  category: 'quest',
  narrative: 'village_girl',
  narrativeCharacter: { name: 'リーネ', title: '村娘' },
  narrativeLines: [
    '……あなたが、錬金術師の「先生」？',
    'ふうん。思ってたより……普通ね',
    'どうせまたすぐ帰るんでしょ。前にもそういう人、何人も来たから',
    '……期待なんてしないわ。勝手にすれば',
  ],
  conditions: [{ type: 'day', target: 3, comparison: '>=' }],
  reward: {},
  prerequisite: ['ach_game_start'],
  priority: 605,
},
```

#### ach_story_merchant_first（旅商人の初訪問）

```typescript
ach_story_merchant_first: {
  id: 'ach_story_merchant_first',
  title: '胡散臭い来客',
  description: '旅商人マルコが初めてやって来た',
  hint: '旅商人と取引しよう',
  category: 'quest',
  narrative: 'merchant_visit',
  narrativeCharacter: { name: 'マルコ', title: '旅商人' },
  narrativeLines: [
    'いやぁ、辺境にも錬金術師が来たって聞いてさ',
    'こいつは「霧草の種」ってやつだ。この辺じゃ珍しいぞ？',
    '特別価格で……まぁ、ちょーっとだけ上乗せさせてもらうがな',
    'これからもちょくちょく顔を出すぜ。いい商売しようや、先生',
  ],
  conditions: [
    { type: 'day', target: 10, comparison: '>=' },
    { type: 'craft_count', target: 3 },
  ],
  reward: {
    items: [{ itemId: 'herb_02', quality: 55, quantity: 2 }],
  },
  prerequisite: ['ach_first_craft'],
  priority: 610,
},
```

#### ach_story_girl_soften（村娘の軟化 — 祖母の民間療法）

```typescript
ach_story_girl_soften: {
  id: 'ach_story_girl_soften',
  title: 'おばあちゃんの知恵',
  description: 'リーネが少し態度を軟化させた',
  hint: '調合を続けて村での暮らしを定着させよう',
  category: 'quest',
  narrative: 'village_girl',
  narrativeCharacter: { name: 'リーネ', title: '村娘' },
  narrativeLines: [
    '……ねえ。あんた、この薬草の使い方知ってるの？',
    'うちのおばあちゃんが昔、これで傷薬を作ってたんだけど……',
    'あんたの錬金術と、おばあちゃんの知恵……似てるところ、あるのかも',
    '……べっ、別に認めたわけじゃないから。ただの興味よ',
  ],
  conditions: [
    { type: 'day', target: 25, comparison: '>=' },
    { type: 'craft_count', target: 10 },
  ],
  reward: {
    reputation: 3,
  },
  prerequisite: ['ach_story_village_girl_cold'],
  priority: 620,
  important: true,
},
```

#### ach_story_baker_rumor（パン屋の噂話 — ライバルの伏線）

```typescript
ach_story_baker_rumor: {
  id: 'ach_story_baker_rumor',
  title: '隣村の噂',
  description: 'メルダからライバルの存在を聞いた',
  hint: '村での評判を築こう',
  category: 'quest',
  narrative: 'client_gratitude',
  narrativeCharacter: { name: 'メルダ', title: 'パン屋のおばちゃん' },
  narrativeLines: [
    'ねえ先生、聞いた？ 隣の村にも錬金術師が来たんだって',
    'なんでもすごい腕前で、もう村おこしが始まってるとか……',
    'でもね、あたしはあんたの方を応援してるからね！',
    'はい、パンのおすそ分け。頑張んなさいよ！',
  ],
  conditions: [
    { type: 'day', target: 40, comparison: '>=' },
    { type: 'quest_count', target: 3 },
  ],
  reward: {
    money: 50,
  },
  prerequisite: ['ach_first_complete'],
  priority: 630,
},
```

#### ach_story_q1_checkpoint（Q1関門: 経過報告要求）

```typescript
ach_story_q1_checkpoint: {
  id: 'ach_story_q1_checkpoint',
  title: '最初の報告書',
  description: '師匠組合への90日目の経過報告',
  hint: '90日目までに基礎を固めよう',
  category: 'quest',
  narrative: 'patron_support',
  narrativeCharacter: { name: '査察官', title: '師匠組合' },
  narrativeLines: [
    '師匠組合からの書簡が届いた――',
    '「派遣錬金術師 各位。90日目の経過報告を求む」',
    '「到着後の活動実績、村との関係構築状況を書面にて提出のこと」',
    '……ひとまず、やってきたことを報告すればいいのかな',
    '（※ 現在の実績が自動的に報告されます）',
  ],
  conditions: [
    { type: 'day', target: 90, comparison: '>=' },
    { type: 'quest_count', target: 5 },
  ],
  reward: {
    money: 300,
    reputation: 5,
  },
  prerequisite: ['ach_story_girl_soften'],
  priority: 690,
  important: true,
},
```

---

### 3.3 Q2 ストーリーイベント (Day 91-180):「この村の錬金術師」

テーマ: 居場所の意識、ライバルとの対比

#### ach_story_rival_appear（ライバルの初登場）

```typescript
ach_story_rival_appear: {
  id: 'ach_story_rival_appear',
  title: '不穏な来訪者',
  description: 'ライバル錬金術師ヴィクトが現れた',
  hint: 'Q1関門を突破しよう',
  category: 'quest',
  narrative: 'rival_pressure',
  narrativeCharacter: { name: 'ヴィクト', title: 'ライバル錬金術師' },
  narrativeLines: [
    'ああ、君がここの担当か。僕はヴィクト、隣村の錬金術師だ',
    'イリーナ先生の弟子だって？ ふうん……回復薬は作れるようになった？',
    '僕の村はもう特産品の目処が立ってるよ。君はどう？',
    'まぁ、頑張ってね。半年後の査察、楽しみにしてるよ',
  ],
  conditions: [
    { type: 'day', target: 100, comparison: '>=' },
  ],
  reward: {},
  prerequisite: ['ach_story_q1_checkpoint'],
  priority: 705,
},
```

#### ach_story_girl_partner（村娘とのパートナーシップ確立）

```typescript
ach_story_girl_partner: {
  id: 'ach_story_girl_partner',
  title: '素材採りの相棒',
  description: 'リーネが素材採取のパートナーになった',
  hint: '採取隊を活用し、調合を重ねよう',
  category: 'quest',
  narrative: 'village_girl',
  narrativeCharacter: { name: 'リーネ', title: '村娘' },
  narrativeLines: [
    '……ねえ、あんた。この前の薬草のこと、もっと教えてくれない？',
    'おばあちゃんが昔集めてた場所、私なら案内できるけど',
    '別にあんたのためじゃないわよ。おばあちゃんの知恵が役に立つなら……嬉しいってだけ',
    'これからは一緒に採りに行ってあげる。……感謝しなさいよね',
  ],
  conditions: [
    { type: 'day', target: 110, comparison: '>=' },
    { type: 'expedition_count', target: 5 },
    { type: 'craft_count', target: 20 },
  ],
  reward: {
    reputation: 5,
    items: [{ itemId: 'herb_01', quality: 70, quantity: 3 }],
  },
  prerequisite: ['ach_story_girl_soften', 'ach_story_rival_appear'],
  priority: 715,
  important: true,
},
```

#### ach_story_elda_spring（エルダの泉の痕跡発見）

```typescript
ach_story_elda_spring: {
  id: 'ach_story_elda_spring',
  title: 'エルダの泉の記憶',
  description: '枯れた泉の周辺で独自の薬草を発見した',
  hint: 'リーネと共に採取を続けよう',
  category: 'expedition',
  narrative: 'workshop_discovery',
  narrativeLines: [
    'リーネに案内された泉の跡地で、見たこともない薬草を見つけた',
    '泉は枯れたが、土壌にはまだ不思議な成分が染み込んでいるようだ',
    'この薬草は他の場所では育たない……エルダ村だけの固有種かもしれない',
    '（※ 新しい採取エリア「枯泉の丘」が解放されました）',
  ],
  conditions: [
    { type: 'day', target: 130, comparison: '>=' },
    { type: 'expedition_count', target: 8 },
  ],
  reward: {
    items: [{ itemId: 'herb_03', quality: 65, quantity: 2 }],
    villageDevelopment: 5,
  },
  prerequisite: ['ach_story_girl_partner'],
  priority: 725,
  important: true,
},
```

#### ach_story_smith_repair（鍛冶屋の好意）

```typescript
ach_story_smith_repair: {
  id: 'ach_story_smith_repair',
  title: '頑固おやじの好意',
  description: '鍛冶屋のゴルドが器具を修理してくれた',
  hint: '調合設備を活用しよう',
  category: 'quest',
  narrative: 'villager_gift',
  narrativeCharacter: { name: 'ゴルド', title: '鍛冶屋' },
  narrativeLines: [
    '……おい、錬金術師。お前の大釜、見せてみろ',
    '……ひどいな。こんなんでよく調合できたもんだ',
    '……直しといてやる。礼はいらん',
    '……この村に、ちゃんと根を張れよ',
  ],
  conditions: [
    { type: 'day', target: 140, comparison: '>=' },
    { type: 'craft_count', target: 30 },
  ],
  reward: {
    facilities: ['reinforced_cauldron'],
  },
  prerequisite: ['ach_craft_10'],
  priority: 735,
},
```

#### ach_story_neighbor_pressure（隣村の発展の噂）

```typescript
ach_story_neighbor_pressure: {
  id: 'ach_story_neighbor_pressure',
  title: '焦りの種',
  description: '隣村の発展ぶりを聞いた',
  hint: '村の発展に貢献しよう',
  category: 'quest',
  narrative: 'client_gratitude',
  narrativeCharacter: { name: 'メルダ', title: 'パン屋のおばちゃん' },
  narrativeLines: [
    '先生、大変よ！ 隣村の錬金術師、もう特産品を売り出してるんだって！',
    'お客さんがみんなあっちに行っちゃうかもしれないって、村長が心配してて……',
    '先生も何か……この村ならではのもの、作れないかしら？',
    'あたしは信じてるからね、先生のこと！',
  ],
  conditions: [
    { type: 'day', target: 160, comparison: '>=' },
    { type: 'village_development', target: 30 },
  ],
  reward: {
    reputation: 3,
  },
  prerequisite: ['ach_story_rival_appear'],
  priority: 745,
},
```

#### ach_story_q2_checkpoint（Q2関門: 中間査察）

```typescript
ach_story_q2_checkpoint: {
  id: 'ach_story_q2_checkpoint',
  title: '中間査察',
  description: '師匠組合の中間査察を受けた',
  hint: '180日目までに実績を積もう',
  category: 'quest',
  narrative: 'patron_support',
  narrativeCharacter: { name: '査察官', title: '師匠組合' },
  narrativeLines: [
    '師匠組合の査察官が村を訪れた',
    '「ふむ……半年の折り返し地点ですね。活動報告を確認しました」',
    '「正直に申し上げると、隣村のヴィクト君の方が進捗は良い」',
    '「しかし、村との関係構築は評価に値します。残り半分、期待していますよ」',
    '「特に……この村ならではの何か、を見つけてほしい」',
  ],
  conditions: [
    { type: 'day', target: 180, comparison: '>=' },
    { type: 'quest_count', target: 10 },
    { type: 'level', target: 5 },
  ],
  reward: {
    money: 500,
    reputation: 5,
    exp: 200,
  },
  prerequisite: ['ach_story_q1_checkpoint'],
  priority: 790,
  important: true,
},
```

---

### 3.4 Q3 ストーリーイベント (Day 181-270):「エルダの宝」

テーマ: 独自の価値の創造、挫折と再起

#### ach_story_specialty_start（特産品の試作開始）

```typescript
ach_story_specialty_start: {
  id: 'ach_story_specialty_start',
  title: '挑戦の始まり',
  description: '特産品の開発を開始した',
  hint: 'エルダ固有の素材を使った調合に挑戦しよう',
  category: 'alchemy',
  narrative: 'village_girl',
  narrativeCharacter: { name: 'リーネ', title: '村娘' },
  narrativeLines: [
    'ねえ、この薬草……おばあちゃんが「エルダの恵み」って呼んでた種類よ',
    '普通の使い方じゃダメみたい。錬金術で何かできないかな',
    '私の知ってる薬草の特性と、あなたの錬金術を合わせたら……',
    '……一緒に、この村だけの何かを作りましょうよ！',
  ],
  conditions: [
    { type: 'day', target: 190, comparison: '>=' },
    { type: 'level', target: 8 },
    { type: 'craft_count', target: 40 },
  ],
  reward: {
    recipes: ['elda_prototype_01'],
    reputation: 5,
  },
  prerequisite: ['ach_story_elda_spring', 'ach_story_q2_checkpoint'],
  priority: 805,
  important: true,
},
```

#### ach_story_specialty_fail（試作品の失敗）

```typescript
ach_story_specialty_fail: {
  id: 'ach_story_specialty_fail',
  title: '苦い教訓',
  description: '特産品の試作に失敗した',
  hint: '特産品のレシピを調合してみよう',
  category: 'alchemy',
  narrative: 'village_girl',
  narrativeCharacter: { name: 'リーネ', title: '村娘' },
  narrativeLines: [
    '……ダメだったね',
    '薬草の配合が足りないのか、それとも手順が違うのか……',
    'でも、おばあちゃんも言ってた。「良い薬は、何度も失敗した先にある」って',
    '……もう一回、やってみよ。私も手伝うから',
  ],
  conditions: [
    { type: 'craft_count', target: 50 },
    { type: 'day', target: 210, comparison: '>=' },
  ],
  reward: {
    exp: 150,
  },
  prerequisite: ['ach_story_specialty_start'],
  priority: 815,
},
```

#### ach_story_merchant_rare（旅商人がレア素材をもたらす）

```typescript
ach_story_merchant_rare: {
  id: 'ach_story_merchant_rare',
  title: '転機の素材',
  description: 'マルコがレアな素材を持ってきた',
  hint: '旅商人の来訪を待とう',
  category: 'quest',
  narrative: 'merchant_visit',
  narrativeCharacter: { name: 'マルコ', title: '旅商人' },
  narrativeLines: [
    'よぉ先生、久しぶりだな！ 今日はとっておきを持ってきたぜ',
    'こいつは「月光の露」ってやつだ。この辺じゃまず手に入らない',
    '実はな、あんたの噂を聞いてわざわざ仕入れてきたんだ',
    '高くつくがね……まぁ、先生への投資ってやつさ。期待してるぜ？',
  ],
  conditions: [
    { type: 'day', target: 220, comparison: '>=' },
    { type: 'total_sales', target: 5000 },
  ],
  reward: {
    items: [{ itemId: 'misc_02', quality: 80, quantity: 1 }],
  },
  prerequisite: ['ach_story_specialty_fail'],
  priority: 825,
  important: true,
},
```

#### ach_story_rival_taunt（ライバルの本格的な嫌味）

```typescript
ach_story_rival_taunt: {
  id: 'ach_story_rival_taunt',
  title: '不敵な笑み',
  description: 'ヴィクトに嫌味を言われた',
  hint: '特産品開発を進めよう',
  category: 'quest',
  narrative: 'rival_pressure',
  narrativeCharacter: { name: 'ヴィクト', title: 'ライバル錬金術師' },
  narrativeLines: [
    'やあ、まだここでやってたんだ？ 感心するよ',
    '僕の特産品はもう量産体制に入ったけど……君はまだ試作段階？',
    'イリーナ先生もお気の毒に。期待の弟子がこれじゃあね',
    '……まぁ、無理はしない方がいいよ。身の丈に合ったことをしなよ',
  ],
  conditions: [
    { type: 'day', target: 230, comparison: '>=' },
  ],
  reward: {},
  prerequisite: ['ach_story_specialty_fail'],
  priority: 835,
},
```

#### ach_story_village_crisis（村の危機イベント）

```typescript
ach_story_village_crisis: {
  id: 'ach_story_village_crisis',
  title: '村を守る力',
  description: '村の危機に錬金術で立ち向かった',
  hint: '高品質な回復薬を作れるようにしておこう',
  category: 'quest',
  narrative: 'village_growth',
  narrativeCharacter: { name: '村長', title: 'エルダ村長' },
  narrativeLines: [
    '先生、大変だ！ 村に病が広がっている',
    '症状は軽いが、このままでは秋の収穫に響く……',
    '頼む、お前さんの錬金術で何とかならないか',
    '……この村には、お前さんしかいないんだ',
  ],
  conditions: [
    { type: 'day', target: 245, comparison: '>=' },
    { type: 'level', target: 10 },
    { type: 'craft_quality', target: 60 },
  ],
  reward: {
    money: 800,
    reputation: 15,
    villageDevelopment: 10,
  },
  prerequisite: ['ach_story_specialty_fail'],
  priority: 845,
  important: true,
},
```

#### ach_story_crisis_resolved（危機解決後 — 村人の感謝）

```typescript
ach_story_crisis_resolved: {
  id: 'ach_story_crisis_resolved',
  title: 'この村の錬金術師',
  description: '村の危機を救い、皆から感謝された',
  hint: '村の危機を乗り越えよう',
  category: 'quest',
  narrative: 'village_girl',
  narrativeCharacter: { name: 'リーネ', title: '村娘' },
  narrativeLines: [
    '……助かったわ。みんな、本当に感謝してる',
    '正直に言うとね……最初、あなたのこと全然信用してなかった',
    'でも今は違う。あなたは――この村の、錬金術師よ',
    '……だから、特産品のこと……絶対に諦めないでね。私も一緒だから',
  ],
  conditions: [
    { type: 'quest_count', target: 20 },
  ],
  reward: {
    reputation: 10,
  },
  prerequisite: ['ach_story_village_crisis'],
  priority: 855,
  important: true,
},
```

#### ach_story_q3_checkpoint（Q3関門: 査察官の予告訪問）

```typescript
ach_story_q3_checkpoint: {
  id: 'ach_story_q3_checkpoint',
  title: '審判の予告',
  description: '査察官が予告訪問に来た',
  hint: '270日目までに特産品の方向性を固めよう',
  category: 'quest',
  narrative: 'patron_support',
  narrativeCharacter: { name: '査察官', title: '師匠組合' },
  narrativeLines: [
    '「お久しぶりです。最終査察の前に、経過確認に参りました」',
    '「特産品の開発状況はいかがですか？ 方向性だけでも見せていただきたい」',
    '「ヴィクト君はすでに成果を上げています。率直に言って、あなたは厳しい」',
    '「しかし……この村の人々は、あなたを信頼している。それは事実です」',
    '「残り3ヶ月。結果を出してください。期待しています」',
  ],
  conditions: [
    { type: 'day', target: 270, comparison: '>=' },
    { type: 'level', target: 12 },
    { type: 'quest_count', target: 20 },
  ],
  reward: {
    money: 500,
    reputation: 5,
  },
  prerequisite: ['ach_story_crisis_resolved'],
  priority: 890,
  important: true,
},
```

---

### 3.5 Q4 ストーリーイベント (Day 271-365):「自分の居場所」

テーマ: 完成と証明、帰属

#### ach_story_specialty_complete（特産品の完成）

```typescript
ach_story_specialty_complete: {
  id: 'ach_story_specialty_complete',
  title: 'エルダの恵み',
  description: 'エルダ村の特産品を完成させた',
  hint: '最高のレシピを完成させよう',
  category: 'alchemy',
  narrative: 'workshop_discovery',
  narrativeLines: [
    '長い試行錯誤の末……ついに、完成した',
    'エルダの泉の成分を含んだ薬草と、リーネの教えてくれた民間療法の知恵',
    'それを錬金術で昇華させた、この村でしか作れない一品',
    '「エルダの恵み」―― これが、私の答え',
  ],
  conditions: [
    { type: 'day', target: 300, comparison: '>=' },
    { type: 'level', target: 15 },
    { type: 'craft_quality', target: 80 },
    { type: 'craft_count', target: 80 },
  ],
  reward: {
    money: 2000,
    reputation: 20,
    villageDevelopment: 15,
  },
  prerequisite: ['ach_story_q3_checkpoint'],
  priority: 905,
  important: true,
},
```

#### ach_story_girl_friendship（村娘との友情の完成）

```typescript
ach_story_girl_friendship: {
  id: 'ach_story_girl_friendship',
  title: '親友',
  description: 'リーネと真の友情を結んだ',
  hint: '特産品を完成させよう',
  category: 'quest',
  narrative: 'village_girl',
  narrativeCharacter: { name: 'リーネ', title: '村娘' },
  narrativeLines: [
    '……ねえ、覚えてる？ 最初に会った日のこと',
    '「どうせまた帰るんでしょ」って……ひどいこと言ったわよね',
    'ごめんね。でも……あなたが残ってくれて、本当に良かった',
    'あなたはもうこの村の人よ。……ううん、私の一番の友達',
    '……これからも、ずっとここにいてね',
  ],
  conditions: [
    { type: 'day', target: 320, comparison: '>=' },
    { type: 'reputation', target: 60 },
  ],
  reward: {
    reputation: 10,
    items: [{ itemId: 'herb_03', quality: 90, quantity: 1 }],
  },
  prerequisite: ['ach_story_specialty_complete'],
  priority: 920,
  important: true,
},
```

#### ach_story_rival_final（ライバルとの最終対面）

```typescript
ach_story_rival_final: {
  id: 'ach_story_rival_final',
  title: '決着',
  description: 'ヴィクトと最後の対面を果たした',
  hint: '特産品を完成させよう',
  category: 'quest',
  narrative: 'rival_pressure',
  narrativeCharacter: { name: 'ヴィクト', title: 'ライバル錬金術師' },
  narrativeLines: [
    '……これが、君の特産品か',
    '正直……驚いたよ。こんなもの、僕には作れない',
    'この村でしか作れない、この村の人と一緒じゃなきゃ作れない薬……',
    '……ふん。今回は君の勝ちだ。認めるよ',
    '次は負けないからな。……覚えておけ',
  ],
  conditions: [
    { type: 'day', target: 340, comparison: '>=' },
  ],
  reward: {
    reputation: 5,
  },
  prerequisite: ['ach_story_specialty_complete'],
  priority: 930,
},
```

#### ach_story_master_letter（師匠からの手紙）

```typescript
ach_story_master_letter: {
  id: 'ach_story_master_letter',
  title: '師匠の言葉',
  description: 'イリーナから最後の手紙が届いた',
  hint: '査察の日を待とう',
  category: 'mastery',
  narrative: 'master_teaching',
  narrativeCharacter: { name: 'イリーナ', title: '師匠（手紙）' },
  narrativeLines: [
    '師匠からの手紙が届いた――',
    '「あなたの噂は聞いています。エルダ村の錬金術師、と」',
    '「最初は心配したけれど……やっぱり、あなたを送り出して正解だったわ」',
    '「査察では、あなたの答えを見せてもらいます。楽しみにしていますよ」',
    '「――お前の師匠であることを、誇りに思う。イリーナ」',
  ],
  conditions: [
    { type: 'day', target: 350, comparison: '>=' },
  ],
  reward: {
    exp: 500,
  },
  prerequisite: ['ach_story_specialty_complete'],
  priority: 940,
},
```

#### ach_story_final_inspection（最終査察 — エンディング分岐）

```typescript
ach_story_final_inspection: {
  id: 'ach_story_final_inspection',
  title: '査察の日',
  description: '師匠組合の最終査察を受けた',
  hint: '365日目を迎えよう',
  category: 'quest',
  narrative: 'patron_support',
  narrativeCharacter: { name: '査察官', title: '師匠組合' },
  narrativeLines: [
    '「さて……1年が経ちました。最終査察を行います」',
    '「あなたの活動実績、村への貢献、そして特産品の出来栄え」',
    '「すべてを総合的に評価し、錬金術師としての認定を判断します」',
    '「では、あなたの成果を見せてください」',
  ],
  conditions: [
    { type: 'day', target: 365, comparison: '>=' },
  ],
  reward: {},
  prerequisite: ['ach_story_q3_checkpoint'],
  priority: 990,
  important: true,
},
```

---

## 4. エンディング分岐設計

最終査察（Day 365）時点でのパラメータに基づき、エンディングを分岐させる。

### 4.1 エンディング条件一覧

| エンディング | 条件 | 概要 |
|-------------|------|------|
| **真エンド: 「この村の錬金術師」** | 特産品完成 + reputation ≥ 70 + level ≥ 15 + village_development ≥ 60 | 査察合格。エルダ村に正式赴任。師匠の承認。リーネとの友情 |
| **好エンド: 「芽吹きの日」** | 特産品完成 + reputation ≥ 50 + level ≥ 10 | 査察合格。特産品は認められるが改善の余地あり。1年延長赴任 |
| **普通エンド: 「旅立ちの朝」** | reputation ≥ 30 + level ≥ 8 + quest_count ≥ 15 | 査察は不合格だが温情で免許維持。別の村への再赴任 |
| **バッドエンド: 「帰り道」** | 上記いずれも満たさない | 査察不合格。免許剥奪。村を去る |

### 4.2 エンディングアチーブメント

```typescript
// 真エンド
ach_ending_true: {
  id: 'ach_ending_true',
  title: 'この村の錬金術師',
  description: '真のエンディングに到達した',
  hint: '',
  category: 'mastery',
  narrative: 'village_growth',
  narrativeCharacter: { name: '村長', title: 'エルダ村長' },
  narrativeLines: [
    '「査察の結果……合格です。おめでとうございます」',
    '村長「やったぞ……！ 先生、本当にありがとう！」',
    'リーネ「……言ったでしょ？ あなたはこの村の人だって」',
    'マルコ「いやぁ、俺の目に狂いはなかったな！ これからも贔屓にしてくれよ？」',
    'ゴルド「……よくやった」',
    '師匠からの最後の手紙「――お前の居場所を、お前自身で見つけたのね。誇りに思うわ」',
    'こうして私は「エルダ村の錬金術師」になった。',
    'この小さな村で、大切な人たちと一緒に。',
  ],
  conditions: [
    { type: 'day', target: 365, comparison: '>=' },
    { type: 'reputation', target: 70 },
    { type: 'level', target: 15 },
    { type: 'village_development', target: 60 },
  ],
  reward: { money: 5000, reputation: 30 },
  prerequisite: ['ach_story_final_inspection', 'ach_story_specialty_complete'],
  priority: 1001,
},

// 好エンド
ach_ending_good: {
  id: 'ach_ending_good',
  title: '芽吹きの日',
  description: '好エンディングに到達した',
  hint: '',
  category: 'mastery',
  narrative: 'village_growth',
  narrativeCharacter: { name: '査察官', title: '師匠組合' },
  narrativeLines: [
    '「査察の結果……条件付き合格です」',
    '「特産品は認められますが、まだ改善の余地があります」',
    '「赴任期間を1年延長します。さらなる発展を期待しています」',
    'リーネ「……まだいてくれるんだ。よかった」',
    '物語はまだ続く。この村で、もう少しだけ――。',
  ],
  conditions: [
    { type: 'day', target: 365, comparison: '>=' },
    { type: 'reputation', target: 50 },
    { type: 'level', target: 10 },
  ],
  reward: { money: 3000, reputation: 15 },
  prerequisite: ['ach_story_final_inspection', 'ach_story_specialty_complete'],
  priority: 1010,
},

// 普通エンド
ach_ending_normal: {
  id: 'ach_ending_normal',
  title: '旅立ちの朝',
  description: '普通のエンディングに到達した',
  hint: '',
  category: 'mastery',
  narrative: 'village_growth',
  narrativeCharacter: { name: '査察官', title: '師匠組合' },
  narrativeLines: [
    '「査察の結果……残念ながら、不合格です」',
    '「しかし、村との関係構築は評価できます。免許は維持とします」',
    '「次の赴任先で、この経験を活かしてください」',
    'リーネ「……行っちゃうんだ。……また、来てね」',
    '村長「ありがとう、先生。短い間だったが……忘れないよ」',
    '別れの朝。また会える日を信じて、私は次の村へ向かう。',
  ],
  conditions: [
    { type: 'day', target: 365, comparison: '>=' },
    { type: 'reputation', target: 30 },
    { type: 'level', target: 8 },
    { type: 'quest_count', target: 15 },
  ],
  reward: { money: 1000, reputation: 5 },
  prerequisite: ['ach_story_final_inspection'],
  priority: 1020,
},

// バッドエンド
ach_ending_bad: {
  id: 'ach_ending_bad',
  title: '帰り道',
  description: 'バッドエンディングに到達した',
  hint: '',
  category: 'mastery',
  narrative: 'village_growth',
  narrativeCharacter: { name: '査察官', title: '師匠組合' },
  narrativeLines: [
    '「査察の結果……不合格。錬金術師免許の剥奪を通知します」',
    '……こうして、私の錬金術師としての日々は終わった。',
    '村長が見送りに来てくれた。「君のことは忘れないよ」',
    '……もっと頑張れたはずだった。後悔だけが、胸に残る。',
  ],
  conditions: [
    { type: 'day', target: 365, comparison: '>=' },
  ],
  reward: {},
  prerequisite: ['ach_story_final_inspection'],
  priority: 1030,
},
```

### 4.3 エンディング分岐の優先度制御

エンディングは **priority の小さい順に評価**される。条件を満たす最初のエンディングが表示され、残りは prerequisite が未達成として評価されないため、**排他的に1つだけ発火する**ことが保証される。

ただし、現在のシステムでは「条件を満たす最初のもの」ではなく「条件を満たすすべて」が発火するため、**エンディング間の排他制御には追加実装が必要**（後述のシステム拡張提言を参照）。

実装上の回避策:
- 各エンディングの `prerequisite` に、より上位のエンディングIDを**含めない**
- 代わりに、上位エンディングの条件を**否定条件として下位に含める**
- 現在のシステムでは否定条件がないため、**ゲームループ側でエンディング判定ロジックを別途実装する**ことを推奨

---

## 5. アチーブメント一覧（priority 順）

### 既存アチーブメント（セリフ書き換え対象）

| ID | title | priority | 書き換え内容 |
|----|-------|----------|------------|
| `ach_game_start` | 新しい日々 | 1 | キャラ→村長、セリフ全面書き換え |
| `ach_first_recipe` | 知識の扉 | 10 | キャラ→イリーナ（手紙）、セリフ全面書き換え |
| `ach_first_craft` | 錬金術士の目覚め | 20 | キャラ→メルダ、セリフ全面書き換え |
| `ach_first_quest` | 村との繋がり | 30 | キャラ→マルコ、セリフ全面書き換え |
| `ach_first_complete` | 信頼の芽生え | 40 | キャラ→村長、セリフ微修正 |
| `ach_adventurer_arrival` | 冒険者の到来 | 45 | キャラ→レン、セリフ全面書き換え |
| `ach_first_expedition` | 仲間との協力 | 50 | キャラ→レン/ピィ、セリフ全面書き換え |
| `ach_sales_10000` | 商売繁盛 | 440 | キャラ→マルコ、セリフ書き換え |

### 新規ストーリーアチーブメント

| ID | title | priority | narrative | 主要条件 |
|----|-------|----------|-----------|---------|
| `ach_story_village_girl_cold` | 冷たい視線 | 605 | `village_girl` | day ≥ 3 |
| `ach_story_merchant_first` | 胡散臭い来客 | 610 | `merchant_visit` | day ≥ 10, craft ≥ 3 |
| `ach_story_girl_soften` | おばあちゃんの知恵 | 620 | `village_girl` | day ≥ 25, craft ≥ 10 |
| `ach_story_baker_rumor` | 隣村の噂 | 630 | `client_gratitude` | day ≥ 40, quest ≥ 3 |
| `ach_story_q1_checkpoint` | 最初の報告書 | 690 | `patron_support` | day ≥ 90, quest ≥ 5 |
| `ach_story_rival_appear` | 不穏な来訪者 | 705 | `rival_pressure` | day ≥ 100 |
| `ach_story_girl_partner` | 素材採りの相棒 | 715 | `village_girl` | day ≥ 110, expedition ≥ 5, craft ≥ 20 |
| `ach_story_elda_spring` | エルダの泉の記憶 | 725 | `workshop_discovery` | day ≥ 130, expedition ≥ 8 |
| `ach_story_smith_repair` | 頑固おやじの好意 | 735 | `villager_gift` | day ≥ 140, craft ≥ 30 |
| `ach_story_neighbor_pressure` | 焦りの種 | 745 | `client_gratitude` | day ≥ 160, village_dev ≥ 30 |
| `ach_story_q2_checkpoint` | 中間査察 | 790 | `patron_support` | day ≥ 180, quest ≥ 10, level ≥ 5 |
| `ach_story_specialty_start` | 挑戦の始まり | 805 | `village_girl` | day ≥ 190, level ≥ 8, craft ≥ 40 |
| `ach_story_specialty_fail` | 苦い教訓 | 815 | `village_girl` | craft ≥ 50, day ≥ 210 |
| `ach_story_merchant_rare` | 転機の素材 | 825 | `merchant_visit` | day ≥ 220, sales ≥ 5000 |
| `ach_story_rival_taunt` | 不敵な笑み | 835 | `rival_pressure` | day ≥ 230 |
| `ach_story_village_crisis` | 村を守る力 | 845 | `village_growth` | day ≥ 245, level ≥ 10, quality ≥ 60 |
| `ach_story_crisis_resolved` | この村の錬金術師 | 855 | `village_girl` | quest ≥ 20 |
| `ach_story_q3_checkpoint` | 審判の予告 | 890 | `patron_support` | day ≥ 270, level ≥ 12, quest ≥ 20 |
| `ach_story_specialty_complete` | エルダの恵み | 905 | `workshop_discovery` | day ≥ 300, level ≥ 15, quality ≥ 80, craft ≥ 80 |
| `ach_story_girl_friendship` | 親友 | 920 | `village_girl` | day ≥ 320, reputation ≥ 60 |
| `ach_story_rival_final` | 決着 | 930 | `rival_pressure` | day ≥ 340 |
| `ach_story_master_letter` | 師匠の言葉 | 940 | `master_teaching` | day ≥ 350 |
| `ach_story_final_inspection` | 査察の日 | 990 | `patron_support` | day ≥ 365 |
| `ach_ending_true` | この村の錬金術師 | 1001 | `village_growth` | day ≥ 365, rep ≥ 70, lv ≥ 15, vd ≥ 60 |
| `ach_ending_good` | 芽吹きの日 | 1010 | `village_growth` | day ≥ 365, rep ≥ 50, lv ≥ 10 |
| `ach_ending_normal` | 旅立ちの朝 | 1020 | `village_growth` | day ≥ 365, rep ≥ 30, lv ≥ 8, quest ≥ 15 |
| `ach_ending_bad` | 帰り道 | 1030 | `village_growth` | day ≥ 365 |

---

## 6. prerequisite チェーン図

```
ach_game_start (1)
├─ ach_first_recipe (10)
│  └─ ach_first_craft (20)
│     └─ ach_first_quest (30)
│        └─ ach_first_complete (40)
│           ├─ ach_adventurer_arrival (45)
│           │  └─ ach_first_expedition (50)
│           ├─ ach_craft_10 (110) → ...既存チェーン
│           ├─ ach_quest_5 (210) → ...既存チェーン
│           └─ ach_level_5 (510) → ...既存チェーン
│
├─ ach_story_village_girl_cold (605)
│  └─ ach_story_girl_soften (620)
│     └─ ach_story_q1_checkpoint (690)
│        ├─ ach_story_rival_appear (705)
│        │  ├─ ach_story_girl_partner (715) [also requires girl_soften]
│        │  │  └─ ach_story_elda_spring (725)
│        │  │     └─ ach_story_specialty_start (805) [also requires q2_checkpoint]
│        │  │        └─ ach_story_specialty_fail (815)
│        │  │           ├─ ach_story_merchant_rare (825)
│        │  │           ├─ ach_story_rival_taunt (835)
│        │  │           └─ ach_story_village_crisis (845)
│        │  │              └─ ach_story_crisis_resolved (855)
│        │  │                 └─ ach_story_q3_checkpoint (890)
│        │  │                    ├─ ach_story_specialty_complete (905)
│        │  │                    │  ├─ ach_story_girl_friendship (920)
│        │  │                    │  ├─ ach_story_rival_final (930)
│        │  │                    │  ├─ ach_story_master_letter (940)
│        │  │                    │  ├─ ach_ending_true (1001) [also requires final_inspection]
│        │  │                    │  └─ ach_ending_good (1010) [also requires final_inspection]
│        │  │                    └─ ach_story_final_inspection (990)
│        │  │                       ├─ ach_ending_normal (1020)
│        │  │                       └─ ach_ending_bad (1030)
│        │  └─ ach_story_neighbor_pressure (745)
│        └─ ach_story_q2_checkpoint (790) [also requires q1_checkpoint]
│
├─ ach_story_merchant_first (610) [requires first_craft]
└─ ach_story_baker_rumor (630) [requires first_complete]
```

---

## 7. 必要なシステム拡張の提言

plot_insertion_manual.md セクション7に基づき、本設計の実装に必要な拡張を整理する。

### 7.1 新規 AchievementNarrative 型の追加

```typescript
// types.ts に追加
export type AchievementNarrative =
  | ... 既存 ...
  | 'village_girl'      // 村娘リーネのイベント
  | 'merchant_visit'    // 旅商人マルコの訪問
  | 'rival_pressure';   // ライバル ヴィクトの圧力
```

### 7.2 既存 narrative の転用

| narrative | 旧デフォルトキャラ | → | 新デフォルトキャラ |
|-----------|---------------|---|---------------|
| `village_growth` | オルト（村長） | → | 村長（エルダ村長） |
| `patron_support` | ???（匿名の支援者） | → | 査察官（師匠組合） |

### 7.3 複数キャラの掛け合い

現在の制約: 1つのダイアログに1キャラのみ。

**回避策（現システム内）**:
- `narrativeLines` の中にキャラ名を含める（例: `'ピィ「よろしくねー！」'`）
- 話者の切り替わりを `narrativeLines` のテキストで表現する

**将来的な拡張案**:
```typescript
// narrativeLines を拡張し、行ごとにキャラを指定できるようにする
interface DialogueLine {
  speaker?: { name: string; title: string };  // 省略時は前の行と同じ
  text: string;
}
// narrativeLines: string[] → (string | DialogueLine)[]
```

### 7.4 エンディング分岐の排他制御

現在の制約: 条件を満たすアチーブメントはすべて発火する。

**必要な拡張**:
- エンディング判定は通常のアチーブメントシステムとは別に、**専用のエンディング判定関数**を実装する
- または、アチーブメントに `exclusive_group` プロパティを追加し、同一グループ内では最初に条件を満たしたものだけが発火する仕組みにする

```typescript
// 案1: AchievementDef に exclusive_group を追加
interface AchievementDef {
  ...
  exclusiveGroup?: string;  // 同一グループ内で排他的に1つだけ発火
}

// 案2: エンディング専用関数
function determineEnding(state: GameState): string {
  if (state.reputation >= 70 && state.level >= 15 && ...) return 'ach_ending_true';
  if (state.reputation >= 50 && state.level >= 10 && ...) return 'ach_ending_good';
  if (state.reputation >= 30 && ...) return 'ach_ending_normal';
  return 'ach_ending_bad';
}
```

### 7.5 新規アイテム・レシピの追加

本設計で前提とする新規データ:

| 種別 | ID（仮） | 名前 | 用途 |
|------|---------|------|------|
| レシピ | `elda_prototype_01` | エルダの試作薬 | 特産品の試作版。Q3で解放 |
| アイテム | `herb_03` | エルダの恵み草 | エルダ固有の薬草。枯泉の丘で採取 |
| 設備 | `reinforced_cauldron` | 強化大釜 | ゴルドが修理した大釜。調合品質+5 |
| 採取エリア | `dried_spring_hill` | 枯泉の丘 | エルダの泉跡。固有素材が採取可能 |

### 7.6 day == N 条件の活用

四半期関門は `day >= N` を使用。これは既存システムで対応可能。

**注意**: `day == 90` のように厳密な日付指定は避ける。プレイヤーがその日に特定のアクションを取らない可能性があるため、`day >= 90` + 他の条件の複合で発火させる。

### 7.7 村名の変更

既存コード内の「ハイデル村」を「エルダ村」に変更する必要がある。
- `ach_game_start` の description: `'ハイデル村に到着した'` → `'エルダ村に到着した'`
- その他、村名がハードコードされている箇所を全検索して修正

---

## 8. plot_insertion_manual.md の更新案

### 8.1 セクション4「登場キャラクター一覧」の書き換え

```markdown
## 4. 登場キャラクター一覧

| キャラクター | 肩書き | 登場イベント | 性格・特徴 |
|------------|-------|------------|-----------|
| 村長 | エルダ村長 | 到着、依頼完了、村発展、危機、エンディング | 穏やか、村の将来を憂う。村娘の父 |
| イリーナ | 師匠（手紙で登場） | レベルアップ、熟練時、最終手紙 | 厳しくも温かい。主人公の基礎力を見抜いた |
| マルコ | 旅商人 | 初依頼受注、定期訪問、レア素材 | 胡散臭い、商売上手。主人公の成功を望む |
| レン | 冒険者（リーダー） | 村発展度20、採取系 | 実力者、面倒見がいい |
| ピィ | 冒険者（斥候） | レンと共に登場 | 明るい、好奇心旺盛 |
| リーネ | 村娘（村長の娘） | Q1冷たい出迎え〜Q4友情完成 | 気難しいが情深い。薬草に詳しい |
| ヴィクト | ライバル錬金術師 | Q2初登場〜Q4決着 | 先輩格、見下すが妨害はしない |
| ゴルド | 鍛冶屋 | Q2器具修理 | 無口、面倒見がいい |
| メルダ | パン屋のおばちゃん | 初調合成功、噂話、依頼 | おしゃべり、情報源 |
| 査察官 | 師匠組合 | Q1/Q2/Q3関門、最終査察 | 厳格だが公正 |
| 村人 | 農夫など | 初調合成功、依頼完了 | 素朴、感謝深い |
| 依頼主 | （汎用） | 依頼系アチーブメント | 多様 |
```

### 8.2 セクション3.3「narrative の選択」への追記

```markdown
| narrative | デフォルトキャラ | 説明 |
|-----------|-------------|------|
| ... 既存 ... |
| `village_girl` | リーネ（村娘） | 村娘リーネのイベント |
| `merchant_visit` | マルコ（旅商人） | 旅商人マルコの訪問 |
| `rival_pressure` | ヴィクト（ライバル錬金術師） | ライバルの圧力 |
```

### 8.3 priority 帯域の更新

```markdown
| カテゴリ | priority 範囲 | 例 |
|---------|-------------|-----|
| チュートリアル | 1 - 100 | `ach_game_start`(1), `ach_first_expedition`(50) |
| 調合系 | 101 - 200 | `ach_craft_10`(110), `ach_craft_elixir`(160) |
| 依頼系 | 201 - 300 | `ach_quest_5`(210), `ach_quest_streak_10`(250) |
| 採取系 | 301 - 400 | `ach_expedition_5`(310) |
| 経済系 | 401 - 500 | `ach_money_5000`(410), `ach_sales_10000`(440) |
| 熟練系 | 501 - 600 | `ach_level_5`(510), `ach_reputation_80`(560) |
| ストーリー: Q1 | 601 - 700 | `ach_story_village_girl_cold`(605), `ach_story_q1_checkpoint`(690) |
| ストーリー: Q2 | 701 - 800 | `ach_story_rival_appear`(705), `ach_story_q2_checkpoint`(790) |
| ストーリー: Q3 | 801 - 900 | `ach_story_specialty_start`(805), `ach_story_q3_checkpoint`(890) |
| ストーリー: Q4 | 901 - 1000 | `ach_story_specialty_complete`(905), `ach_story_final_inspection`(990) |
| エンディング | 1001 - 1100 | `ach_ending_true`(1001), `ach_ending_bad`(1030) |
```

---

## 9. setting_sketch との対応チェック

### 9.1 キャラクター網羅性

| setting_sketch のキャラ | 設計書での対応 | 状態 |
|----------------------|-------------|------|
| 駆け出し錬金術師の少女（主人公） | プレイヤーキャラクター | OK |
| 気難しい村娘 | リーネ | OK |
| 旅商人 | マルコ | OK |
| 冒険者パーティー | レン & ピィ | OK |
| 村長（親友の父） | 村長（エルダ村長） | OK |
| 鍛冶屋のおやじ | ゴルド | OK |
| パン屋のおばちゃん | メルダ | OK |
| ライバル錬金術師 | ヴィクト | OK |
| 師匠（イリーナ） | イリーナ（手紙） | OK |

### 9.2 プロット要素網羅性

| setting_sketch の要素 | 設計書での対応 | 状態 |
|---------------------|-------------|------|
| 師匠組合の派遣制度 | 全体の前提として反映 | OK |
| 回復薬しか作れない素人 | チュートリアルの段階的学習で表現 | OK |
| 村人の過大な期待 | ach_game_start, ach_story_village_girl_cold | OK |
| エルダの泉（枯れた） | ach_story_elda_spring | OK |
| 独自の薬草群 | herb_03（エルダの恵み草）、枯泉の丘 | OK |
| 特産品開発 | Q3-Q4 ストーリーアーク | OK |
| ライバルとの比較 | Q2-Q4 ヴィクト関連イベント | OK |
| 半年の時間制限 | 365日（1年）に拡張。四半期関門で段階管理 | OK（※） |
| 村娘との関係構築 | Q1冷たい出迎え → Q4友情完成の全アーク | OK |
| 祖母の民間療法 | ach_story_girl_soften | OK |
| 工房の発展 | facilities によるアンロック | OK |

> ※ setting_sketch では「半年」だが、ゲームが365日（1年）のため適宜調整。ログラインの「半年」は作中設定として維持し、ゲーム内の1年をフィクション上の半年として扱う。

### 9.3 整合性検証

| 検証項目 | 結果 | 備考 |
|---------|------|------|
| priority 衝突なし | OK | 既存 1-600、新規 601-1100 で帯域分離 |
| prerequisite 循環なし | OK | 一方向のチェーン構造 |
| day 条件の自然な進行 | OK | 四半期ごとに day ≥ N で制御 |
| 既存アチーブメントへの影響 | 最小 | セリフのみ書き換え、ID/条件/報酬は維持 |
| 条件型の範囲内 | OK | すべて既存の AchievementConditionType で実現可能 |
