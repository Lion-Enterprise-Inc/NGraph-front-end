export type MockScanResponseInput = {
  text: string
  attachmentLabel: string
  language?: string
}

type MockScanResponseOutput = {
  title: string
  intro: string
  body: string[]
}

export async function mockScanResponse({
  text,
  attachmentLabel,
  language = 'ja',
}: MockScanResponseInput): Promise<MockScanResponseOutput> {
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  await delay(800)

  const message = text?.trim()
  const intro = message
    ? ` 🍜 メニュー解説: ${message}`
    : attachmentLabel
      ? '塩梅らーめん（しおうめらーめん） - 920円'
      : `さっぱりとした塩味スープに梅の酸味が加わった爽やかなラーメン。
主な材料: 麺、鶏ガラスープ、梅干し、ネギ、チャーシュー、海苔
アレルゲン: 小麦、大豆、豚肉
宗教上の制約: 豚肉使用
調理法: 鶏ガラベースのスープに梅を加え、麺と具材を盛り付ける
味の特徴: あっさり、爽やか、少し酸味あり
推定カロリー: 約550kcal
食べ方ガイド: 梅をスープに溶かして味を変化させながら楽しむのがおすすめ。
背景情報: 梅は日本の伝統的な食材で、さっぱり感を与えるラーメンは女性にも人気。
関連提案: 冷たい緑茶やさっぱり系の餃子と好相性。
塩らーめん（しおらーめん） - 820円`

  return {
    title: '🍜 メニュー解説:',
    intro,
    body: [
      `透明感のある塩ベースの定番ラーメン。
主な材料: 麺、鶏ガラスープ、チャーシュー、メンマ、ネギ
アレルゲン: 小麦、大豆、豚肉
宗教上の制約: 豚肉使用
調理法: 塩ダレを鶏ガラ出汁でのばし、麺と具材を合わせる
味の特徴: あっさり、旨味が強い
推定カロリー: 約500kcal
食べ方ガイド: スープを最初に味わってから麺を食べるのがおすすめ。`,
    ],
  }
}
