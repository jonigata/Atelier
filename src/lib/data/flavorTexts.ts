// 採取地ごとのフレーバーテキスト（ガルドの報告風）
export const expeditionFlavors: Record<string, string[]> = {
  forest: [
    '木漏れ日の差す小道沿いに生えていた',
    '苔むした倒木の根元で見つけた',
    '小川のほとりに群生していた',
    '鳥の巣の近く、高い枝の下にあった',
    '獣道を外れた茂みの奥で発見した',
    '朝露に濡れた草むらから採った',
    '古い切り株の周りに生えていた',
  ],
  mountain: [
    '切り立った岩壁の隙間に埋まっていた',
    '山頂近くの風の強い岩場で見つけた',
    '鉱脈の露出した崖から削り出した',
    '落石跡の瓦礫の中に混ざっていた',
    '山道の脇、地層がむき出しの場所にあった',
  ],
  lake: [
    '湖底の砂地から汲み上げた',
    '岸辺の岩の間から湧き出ていた',
    '朝もやの立ち込める水面から採った',
    '葦の茂みの奥、水が特に澄んでいた場所のもの',
    '湖に注ぐ小さな滝つぼの近くで汲んだ',
  ],
};

// ショップ購入時のフレーバーテキスト
export const shopFlavors: string[] = [
  'カリンが棚から出してくれた',
  '「これ、最近入ったばかりよ」とカリンが言っていた',
  'カリンのおすすめ品',
  '店の奥から引っ張り出してきたもの',
  '「まとめ買いなら少しおまけするわよ」と言われた',
];

// 調合品のフレーバーテキスト
export const craftedFlavors: string[] = [
  '慎重に仕上げた一品',
  '手応えのある調合だった',
  '配合に集中して作り上げた',
  '工房に良い香りが漂った',
];

export function pickRandom(texts: string[]): string {
  return texts[Math.floor(Math.random() * texts.length)];
}

/**
 * ItemOriginから表示用テキストを生成
 */
export function formatOrigin(origin: import('$lib/models/types').ItemOrigin): string {
  const dayStr = `${origin.day}日目`;
  switch (origin.type) {
    case 'expedition': {
      // areas の import は呼び出し側で解決し、areaId をそのまま表示名に使う
      // InventoryPanel 等で getArea() を使って名前解決すること
      const areaName = origin.areaId ?? '不明な場所';
      const base = `${dayStr} ガルドが持ち帰った`;
      return origin.flavorText ? `${base} — ${origin.flavorText}` : base;
    }
    case 'shop':
      return origin.flavorText
        ? `${dayStr} — ${origin.flavorText}`
        : `${dayStr} ショップで購入`;
    case 'crafted':
      return origin.flavorText
        ? `${dayStr} — ${origin.flavorText}`
        : `${dayStr} 自分で調合`;
    case 'reward':
      return `${dayStr} 報酬として入手`;
    case 'initial':
      return '師匠から受け取った';
    default:
      return dayStr;
  }
}
