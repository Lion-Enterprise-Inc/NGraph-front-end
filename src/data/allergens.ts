/**
 * アレルゲン・食事スタイルのマスタ定義。
 *
 * PreferencesModal (ハンバーガー → 個人設定) と OnboardingModal (初回 step 2)
 * で同じ選択肢を表示するため、共通化。
 *
 * 構成:
 * - NONE (1): 「アレルギーなし」排他選択用 (UI 上は chip だが、内部 state には含めない)
 * - MANDATORY (8): 日本食品表示法「特定原材料」(義務表示)
 * - RECOMMENDED (21): 同「特定原材料に準ずる」(推奨表示、2024年マカダミア追加で 21)
 * - RELIGIOUS (4): ハラール / ヒンドゥー / ベジタリアン / ヴィーガン
 *
 * key 名は backend (router.py の forced_allergens / system prompt) と整合させる。
 */

export type AllergenChoice = {
  key: string
  jp: string
  en: string
  emoji: string
}

export type AllergenCategory = {
  /** カテゴリ識別子 (i18n key 等で使う) */
  id: string
  /** 日本語ラベル */
  label_ja: string
  /** 英語ラベル */
  label_en: string
  items: AllergenChoice[]
}

// ── 特定原材料 (義務表示 8 品目) ────────────────────────
export const ALLERGENS_MANDATORY: AllergenChoice[] = [
  { key: 'egg',    jp: '卵',     en: 'Egg',       emoji: '🥚' },
  { key: 'milk',   jp: '乳製品', en: 'Dairy',     emoji: '🥛' },
  { key: 'wheat',  jp: '小麦',   en: 'Wheat',     emoji: '🌾' },
  { key: 'shrimp', jp: 'えび',   en: 'Shrimp',    emoji: '🦐' },
  { key: 'crab',   jp: 'かに',   en: 'Crab',      emoji: '🦀' },
  { key: 'soba',   jp: 'そば',   en: 'Buckwheat', emoji: '🍜' },
  { key: 'peanut', jp: '落花生', en: 'Peanut',    emoji: '🥜' },
  { key: 'walnut', jp: 'くるみ', en: 'Walnut',    emoji: '🌰' },
]

// ── 特定原材料に準ずる (推奨表示 21 品目) ──────────────
// カテゴリ別に並べる (UI 表示順)

const NUTS_SEEDS: AllergenChoice[] = [
  { key: 'almond',    jp: 'アーモンド',     en: 'Almond',    emoji: '🌰' },
  { key: 'cashew',    jp: 'カシューナッツ', en: 'Cashew',    emoji: '🥜' },
  { key: 'macadamia', jp: 'マカダミア',     en: 'Macadamia', emoji: '🥜' },
  { key: 'sesame',    jp: 'ごま',           en: 'Sesame',    emoji: '⚫' },
]

const PLANTS_FUNGI: AllergenChoice[] = [
  { key: 'soy',       jp: '大豆',     en: 'Soy',       emoji: '🫘' },
  { key: 'yam',       jp: 'やまいも', en: 'Yam',       emoji: '🥔' },
  { key: 'matsutake', jp: 'まつたけ', en: 'Matsutake', emoji: '🍄' },
]

const SEAFOOD: AllergenChoice[] = [
  { key: 'abalone',    jp: 'あわび',  en: 'Abalone',    emoji: '🐚' },
  { key: 'squid',      jp: 'いか',    en: 'Squid',      emoji: '🦑' },
  { key: 'salmon_roe', jp: 'いくら',  en: 'Salmon roe', emoji: '🟠' },
  { key: 'salmon',     jp: 'さけ',    en: 'Salmon',     emoji: '🐟' },
  { key: 'mackerel',   jp: 'さば',    en: 'Mackerel',   emoji: '🐟' },
]

const MEAT_ANIMAL: AllergenChoice[] = [
  { key: 'chicken', jp: '鶏肉',     en: 'Chicken', emoji: '🐔' },
  { key: 'beef',    jp: '牛肉',     en: 'Beef',    emoji: '🐄' },
  { key: 'pork',    jp: '豚肉',     en: 'Pork',    emoji: '🐖' },
  { key: 'gelatin', jp: 'ゼラチン', en: 'Gelatin', emoji: '🍮' },
]

const FRUITS: AllergenChoice[] = [
  { key: 'apple',  jp: 'りんご',   en: 'Apple',  emoji: '🍎' },
  { key: 'orange', jp: 'オレンジ', en: 'Orange', emoji: '🍊' },
  { key: 'kiwi',   jp: 'キウイ',   en: 'Kiwi',   emoji: '🥝' },
  { key: 'banana', jp: 'バナナ',   en: 'Banana', emoji: '🍌' },
  { key: 'peach',  jp: 'もも',     en: 'Peach',  emoji: '🍑' },
]

export const ALLERGENS_RECOMMENDED: AllergenChoice[] = [
  ...NUTS_SEEDS,
  ...PLANTS_FUNGI,
  ...SEAFOOD,
  ...MEAT_ANIMAL,
  ...FRUITS,
]

// ── 食事スタイル (宗教・倫理ベース) ────────────────────
export const DIETARY_STYLES: AllergenChoice[] = [
  { key: 'halal',      jp: 'ハラール',     en: 'Halal',      emoji: '☪️' },
  { key: 'hindu',      jp: 'ヒンドゥー',   en: 'Hindu',      emoji: '🕉️' },
  { key: 'vegetarian', jp: 'ベジタリアン', en: 'Vegetarian', emoji: '🥗' },
  { key: 'vegan',      jp: 'ヴィーガン',   en: 'Vegan',      emoji: '🌱' },
]

// ── UI カテゴリ (表示順 + ラベル) ───────────────────────
export const ALLERGEN_CATEGORIES: AllergenCategory[] = [
  {
    id: 'mandatory',
    label_ja: '特定原材料（8 品目）',
    label_en: 'Mandatory allergens (8)',
    items: ALLERGENS_MANDATORY,
  },
  {
    id: 'nuts_seeds',
    label_ja: 'ナッツ・種実',
    label_en: 'Nuts & seeds',
    items: NUTS_SEEDS,
  },
  {
    id: 'plants_fungi',
    label_ja: '豆・山菜・キノコ',
    label_en: 'Plants & fungi',
    items: PLANTS_FUNGI,
  },
  {
    id: 'seafood',
    label_ja: '魚介',
    label_en: 'Seafood',
    items: SEAFOOD,
  },
  {
    id: 'meat_animal',
    label_ja: '肉・動物性',
    label_en: 'Meat & animal',
    items: MEAT_ANIMAL,
  },
  {
    id: 'fruits',
    label_ja: 'フルーツ',
    label_en: 'Fruits',
    items: FRUITS,
  },
  {
    id: 'dietary',
    label_ja: '食事スタイル',
    label_en: 'Dietary style',
    items: DIETARY_STYLES,
  },
]

/** 全アレルゲン+食事スタイル (key の解決等で使う) */
export const ALL_ALLERGENS: AllergenChoice[] = ALLERGEN_CATEGORIES.flatMap((c) => c.items)

/** 「なし」chip 用 (内部 state には含めない、 UI 上の排他選択用) */
export const NONE_CHIP = {
  key: 'none',
  jp: 'アレルギーなし',
  en: 'No allergies',
  emoji: '✓',
}
