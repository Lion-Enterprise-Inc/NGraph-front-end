export type QuestionType = 'single' | 'multi' | 'table' | 'text'

export interface Question {
  id: string
  key: string
  label: string
  type: QuestionType
  options?: string[]
  tableRows?: string[]
  tableColumns?: string[]
  category?: string
  applies_to_categories?: string[]
  note?: string
}

export interface Phase {
  id: number
  title: string
  description: string
  questions: Question[]
}

// ============================================================
// Phase 1: 調理環境（共通）
// ============================================================
const COMMON_PHASE_1: Phase = {
  id: 1,
  title: 'Phase 1: 調理環境',
  description: 'Q1-Q9 — 回答1つで全品に波及',
  questions: [
    {
      id: 'q1a',
      key: 'frying_oil_shared',
      label: 'Q1. 揚げ物の油は全メニュー同じですか？',
      type: 'single',
      options: ['全部同じ油', '海鮮と肉で分けてる', 'メニューごとに専用', '揚げ物メニューはない', 'わからない'],
      category: 'cooking_environment',
      applies_to_categories: ['main', 'appetizer', 'tempura', 'side'],
    },
    {
      id: 'q1b',
      key: 'frying_oil_type',
      label: 'Q2. 油の種類は？',
      type: 'single',
      options: ['キャノーラ油（菜種油）', '大豆油', '米油', 'ラード（動物性）', 'わからない', 'その他'],
      category: 'cooking_environment',
      applies_to_categories: ['main', 'appetizer', 'tempura', 'side'],
    },
    {
      id: 'q1b2',
      key: 'frying_oil_shellfish',
      label: 'Q3. その油で、えび・かにも揚げますか？',
      type: 'single',
      options: ['はい', 'いいえ（甲殻類だけは別）', 'わからない'],
      category: 'cooking_environment',
      applies_to_categories: ['main', 'appetizer', 'tempura', 'side'],
    },
    {
      id: 'q1d',
      key: 'peanut_oil',
      label: 'Q4. 落花生油（ピーナッツオイル）は使ってますか？',
      type: 'single',
      options: ['使ってない', '使ってる', 'わからない'],
      category: 'cooking_environment',
      applies_to_categories: ['main', 'appetizer', 'tempura', 'side'],
    },
    {
      id: 'q2a',
      key: 'utensil_sharing',
      label: 'Q5. えび・かにを扱う道具（まな板・包丁・鍋等）は？',
      type: 'single',
      options: ['他の料理と共有してる', '甲殻類専用の道具がある', '特に意識して分けてない', 'わからない'],
      category: 'cooking_environment',
      applies_to_categories: ['main', 'appetizer', 'sashimi', 'sushi', 'tempura', 'nabe', 'side'],
    },
    {
      id: 'q2b',
      key: 'utensil_wash_timing',
      label: 'Q6. 洗浄のタイミングは？',
      type: 'single',
      options: ['使うたびに洗う', 'まとめて洗う', '特に決めてない', 'わからない'],
      category: 'cooking_environment',
      applies_to_categories: ['main', 'appetizer', 'sashimi', 'sushi', 'tempura', 'nabe', 'side'],
    },
    {
      id: 'q3a',
      key: 'boiling_water_shared',
      label: 'Q7. 蕎麦とうどんの茹で湯は？',
      type: 'single',
      options: ['同じ鍋で茹でてる', '鍋を分けてる', '蕎麦は外注', 'わからない'],
      category: 'cooking_environment',
      applies_to_categories: ['soba', 'ramen'],
    },
    {
      id: 'q3b',
      key: 'soba_wheat_binder',
      label: 'Q8. 蕎麦のつなぎに小麦は入ってますか？',
      type: 'single',
      options: ['十割蕎麦（小麦なし）', '二八蕎麦（小麦入り）', 'わからない'],
      category: 'cooking_environment',
      applies_to_categories: ['soba'],
    },
    {
      id: 'q4a',
      key: 'grill_sharing',
      label: 'Q9. 炭火焼き・鉄板は、肉と魚で分けてますか？',
      type: 'single',
      options: ['同じグリルで焼いてる', '肉と魚で分けてる', 'メニューごとに違う', 'わからない'],
      category: 'cooking_environment',
      applies_to_categories: ['main', 'yakitori'],
    },
  ],
}

// ============================================================
// Phase 2: 調味料・ベース（共通）
// ============================================================
const COMMON_PHASE_2: Phase = {
  id: 2,
  title: 'Phase 2: 調味料・ベース',
  description: 'Q1-Q8 — 数十品に波及',
  questions: [
    {
      id: 'q5a',
      key: 'soy_sauce_type',
      label: 'Q1. 使ってる醤油はどれですか？',
      type: 'single',
      options: ['普通の醤油（小麦入り）のみ', 'たまり醤油（小麦なし）のみ', '両方使い分けてる', 'わからない'],
      category: 'seasoning',
      applies_to_categories: ['main', 'appetizer', 'sashimi', 'sushi', 'yakitori', 'nabe', 'side'],
    },
    {
      id: 'q5b',
      key: 'tamari_usage',
      label: 'Q2. たまり醤油を使うのは？（複数OK）',
      type: 'multi',
      options: ['刺身のつけ醤油', '寿司', '焼き鳥のタレ', '煮物', '茶漬け', 'その他'],
      category: 'seasoning',
      applies_to_categories: ['main', 'sashimi', 'sushi', 'yakitori'],
      note: 'Q1で「普通の醤油のみ」なら回答不要',
    },
    {
      id: 'q6a',
      key: 'dashi_type',
      label: 'Q3. メインで使ってる出汁は？（複数OK）',
      type: 'multi',
      options: ['鰹出汁', '昆布出汁', '合わせ出汁（鰹+昆布）', '鶏ガラ', '豚骨', 'あごだし', '化学調味料・顆粒だし', 'わからない'],
      category: 'seasoning',
      applies_to_categories: ['main', 'nabe', 'soup', 'soba', 'ramen'],
    },
    {
      id: 'q6b',
      key: 'dashi_by_dish',
      label: 'Q4. 料理によって出汁を使い分けてますか？',
      type: 'single',
      options: ['全部同じ', '使い分けてる'],
      category: 'seasoning',
      applies_to_categories: ['main', 'nabe', 'soup', 'soba', 'ramen'],
    },
    {
      id: 'q7a',
      key: 'barley_miso',
      label: 'Q5. 麦味噌（小麦・大麦入り）を使ってますか？',
      type: 'single',
      options: ['使ってない', '使ってる', 'わからない'],
      category: 'seasoning',
      applies_to_categories: ['main', 'nabe', 'soup'],
    },
    {
      id: 'q7b',
      key: 'miso_dashi_included',
      label: 'Q6. 味噌にだし入りのものを使ってますか？',
      type: 'single',
      options: ['だし入り味噌を使ってる', 'だしなし（別で出汁をとってる）', 'わからない'],
      category: 'seasoning',
      applies_to_categories: ['main', 'nabe', 'soup'],
    },
    {
      id: 'q8a',
      key: 'dressing_type',
      label: 'Q7. ドレッシングやソースは自家製ですか？既製品ですか？',
      type: 'single',
      options: ['ほぼ自家製', 'ほぼ既製品', 'ものによる', 'わからない'],
      category: 'seasoning',
      applies_to_categories: ['salad', 'main', 'side'],
    },
    {
      id: 'q8b',
      key: 'caesar_ingredients',
      label: 'Q8. シーザードレッシングに入ってるものは？（複数OK）',
      type: 'multi',
      options: ['マヨネーズ', '卵黄', 'アンチョビ（魚介）', 'パルメザンチーズ', 'にんにく', 'わからない', 'その他', '使ってない/該当なし'],
      category: 'seasoning',
      applies_to_categories: ['salad'],
    },
  ],
}

// ============================================================
// Phase 6: お店の強み（共通 — 「居酒屋」→「お店」に一般化）
// ============================================================
const COMMON_PHASE_6: Phase = {
  id: 6,
  title: 'Phase 6: お店の強み',
  description: 'Q1-Q6 — narrative用',
  questions: [
    {
      id: 'q29a',
      key: 'popular_top3',
      label: 'Q1. 一番出るメニューベスト3は？',
      type: 'text',
      category: 'store_strength',
      applies_to_categories: ['main'],
      note: '1位、2位、3位',
    },
    {
      id: 'q29b',
      key: 'chef_recommend',
      label: 'Q2. 店長が自信あるメニューは？',
      type: 'text',
      category: 'store_strength',
      applies_to_categories: ['main'],
    },
    {
      id: 'q30a',
      key: 'fish_source',
      label: 'Q3. 食材の仕入れは？',
      type: 'single',
      options: ['産地から直送', '市場経由', '業者から仕入れ', 'その他'],
      category: 'store_strength',
      applies_to_categories: ['sashimi', 'sushi', 'main'],
      note: '仕入れ先の詳細',
    },
    {
      id: 'q30b',
      key: 'charcoal_type',
      label: 'Q4. 炭火焼きの炭は？',
      type: 'single',
      options: ['備長炭', 'オガ炭', 'その他', 'わからない'],
      category: 'store_strength',
      applies_to_categories: ['yakitori', 'main'],
      note: 'narrative用（アレルゲンとは無関係）',
    },
    {
      id: 'q31a',
      key: 'store_uniqueness',
      label: 'Q5. お店が他と一番違うところは？',
      type: 'text',
      category: 'store_strength',
    },
    {
      id: 'q31b',
      key: 'local_ingredient',
      label: 'Q6. 地元の食材で特にこだわってるものは？',
      type: 'text',
      category: 'store_strength',
    },
  ],
}

// ============================================================
// ぼんた Phase 3: 特定原材料8品目（海鮮居酒屋向け）
// ============================================================
const BONTA_PHASE_3: Phase = {
  id: 3,
  title: 'Phase 3: 特定原材料8品目',
  description: 'Q1-Q19 — 表示義務のある8品目',
  questions: [
    {
      id: 'q9a',
      key: 'shrimp_hidden',
      label: 'Q1. えびを直接使う料理以外で、えびを使う料理はありますか？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['main', 'appetizer', 'tempura', 'sashimi'],
      note: '料理名',
    },
    {
      id: 'q9b',
      key: 'shrimp_in_tempura',
      label: 'Q2. 季節の天婦羅盛り合わせにえびは入りますか？',
      type: 'single',
      options: ['必ず入る', '日によって変わる', '入らない'],
      category: 'allergen_8',
      applies_to_categories: ['tempura'],
    },
    {
      id: 'q9c',
      key: 'shrimp_in_sashimi',
      label: 'Q3. 旬のお刺身盛合せ7種にえびは入りますか？',
      type: 'single',
      options: ['必ず入る', '日によって変わる', '入らない'],
      category: 'allergen_8',
      applies_to_categories: ['sashimi'],
    },
    {
      id: 'q10a',
      key: 'crab_hidden',
      label: 'Q4. かにを直接使う料理以外で、かにを使う料理はありますか？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['main', 'appetizer', 'nabe'],
      note: '料理名',
    },
    {
      id: 'q10b',
      key: 'crab_extract',
      label: 'Q5. かに味噌やかにエキスを使う料理はありますか？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['main', 'appetizer', 'nabe'],
      note: '料理名',
    },
    {
      id: 'q11a',
      key: 'wheat_batter',
      label: 'Q6. 天婦羅・唐揚げの衣は小麦粉ですか？',
      type: 'single',
      options: ['全部小麦粉', '一部片栗粉', '全部片栗粉', 'コンスターチ（片栗粉以外）', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['main', 'appetizer', 'tempura'],
      note: '片栗粉のメニュー名',
    },
    {
      id: 'q11b',
      key: 'breadcrumb_usage',
      label: 'Q7. パン粉を使うメニューは？（複数OK）',
      type: 'multi',
      options: ['レアアジフライ', '紅ズワイ蟹クリームコロッケ', '酒粕香るクリームチーズとレーズンの春巻き', '他にもある', 'パン粉は使ってない'],
      category: 'allergen_8',
      applies_to_categories: ['main'],
    },
    {
      id: 'q12a',
      key: 'soba_flour_hidden',
      label: 'Q8. 蕎麦以外でそば粉を使うメニューはありますか？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['soba', 'main'],
      note: '料理名',
    },
    {
      id: 'q13a',
      key: 'egg_state',
      label: 'Q9. 以下の料理、卵の状態は？',
      type: 'table',
      tableRows: ['海鮮ごまだれユッケ', '割烹だし巻き', 'セイコ蟹の茶碗蒸し', 'ズワイ蟹天おろし蕎麦', '純けいのつくね（つなぎ）'],
      tableColumns: ['生', '半熟', '加熱', '卵不使用'],
      category: 'allergen_8',
      applies_to_categories: ['main', 'sashimi', 'soba', 'ramen', 'salad', 'nabe', 'yakitori'],
    },
    {
      id: 'q13b',
      key: 'mayo_type',
      label: 'Q10. マヨネーズは市販品ですか？自家製ですか？',
      type: 'single',
      options: ['市販品（キューピー等）', '自家製', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['main', 'salad'],
    },
    {
      id: 'q13c',
      key: 'tempura_egg',
      label: 'Q11. 天婦羅の衣に卵を使ってますか？',
      type: 'single',
      options: ['使ってる', '使ってない（水と小麦粉のみ）', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['tempura'],
    },
    {
      id: 'q13d',
      key: 'egg_hidden',
      label: 'Q12. 天婦羅・だし巻き・茶碗蒸し以外で卵を使う料理はありますか？',
      type: 'single',
      options: ['ない', 'ある'],
      category: 'allergen_8',
      applies_to_categories: ['main', 'appetizer', 'dessert'],
      note: '料理名',
    },
    {
      id: 'q14a',
      key: 'dairy_hidden',
      label: 'Q13. バター・クリーム・チーズの隠れ使用はありますか？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['main', 'appetizer', 'dessert', 'bread'],
      note: '料理名',
    },
    {
      id: 'q14c',
      key: 'habutae_ice_dairy',
      label: 'Q14. 羽二重アイス最中のアイスは？',
      type: 'single',
      options: ['乳製品入り（普通のアイス）', '豆乳・植物性ベース', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['dessert'],
    },
    {
      id: 'q15a',
      key: 'peanut_usage',
      label: 'Q15. 落花生（ピーナッツ）を使う料理はありますか？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['main', 'appetizer', 'dessert'],
      note: '五月ヶ瀬等の落花生含有品も含む',
    },
    {
      id: 'q16a',
      key: 'walnut_usage',
      label: 'Q16. くるみを使う料理はありますか？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['main', 'dessert', 'salad'],
      note: '料理名',
    },
    {
      id: 'q16b',
      key: 'walnut_salad_topping',
      label: 'Q17. サラダのトッピング等に入る可能性は？',
      type: 'single',
      options: ['ない', '時期やメニューによってはある', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['salad'],
    },
    {
      id: 'q16c',
      key: 'crab_boil_shared',
      label: 'Q18. 蟹を茹でる鍋は他の料理にも使いますか？',
      type: 'single',
      options: ['蟹専用', '他の料理と共有', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['main', 'nabe'],
    },
    {
      id: 'q16d',
      key: 'spring_roll_batter',
      label: 'Q19. 春巻きの皮に卵は入ってますか？',
      type: 'single',
      options: ['入ってる', '入ってない', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['main', 'appetizer'],
    },
  ],
}

// ============================================================
// ぼんた Phase 4: 推奨表示品目（海鮮居酒屋向け）
// ============================================================
const BONTA_PHASE_4: Phase = {
  id: 4,
  title: 'Phase 4: 推奨表示品目',
  description: 'Q1-Q8 — アレルギー事故が多い品目',
  questions: [
    {
      id: 'q17a',
      key: 'nuts_usage',
      label: 'Q1. アーモンド・カシューナッツ等を使う料理はありますか？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_recommended',
      applies_to_categories: ['main', 'dessert', 'salad'],
      note: '料理名',
    },
    {
      id: 'q17b',
      key: 'nuts_dessert_topping',
      label: 'Q2. デザートのトッピングにナッツ類は？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_recommended',
      applies_to_categories: ['dessert'],
      note: '料理名',
    },
    {
      id: 'q18a',
      key: 'sesame_usage',
      label: 'Q3. 海鮮ごまだれユッケ以外で、ごまを使う料理はありますか？（複数OK）',
      type: 'multi',
      options: ['ドレッシングに入ってる', '焼き鳥のタレに入ってる', '和え物に使ってる', 'ごま油だけ（粒ごまは使わない）', '他にもある', '使ってない（ユッケのごまだれのみ）'],
      category: 'allergen_recommended',
      applies_to_categories: ['main', 'salad', 'yakitori', 'appetizer'],
    },
    {
      id: 'q19a',
      key: 'yam_hidden',
      label: 'Q4. 割烹だし巻き以外に山芋・長芋・とろろを使う料理はありますか？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_recommended',
      applies_to_categories: ['main', 'soba'],
      note: '料理名',
    },
    {
      id: 'q20a',
      key: 'gelatin_usage',
      label: 'Q5. デザートにゼラチンを使ってますか？',
      type: 'single',
      options: ['使ってる', '使ってない（寒天等を使用）', 'わからない'],
      category: 'allergen_recommended',
      applies_to_categories: ['dessert'],
      note: 'ゼラチン=動物由来（牛・豚）。宗教制約の確認用',
    },
    {
      id: 'q21a',
      key: 'squid_usage',
      label: 'Q6. いかを使う料理はありますか？',
      type: 'single',
      options: ['ない', 'ある'],
      category: 'allergen_recommended',
      applies_to_categories: ['main', 'sashimi', 'tempura'],
      note: '料理名',
    },
    {
      id: 'q21b',
      key: 'squid_in_sashimi',
      label: 'Q7. 旬のお刺身盛合せ7種にいかは入りますか？',
      type: 'single',
      options: ['必ず入る', '日によって変わる', '入らない'],
      category: 'allergen_recommended',
      applies_to_categories: ['sashimi'],
    },
    {
      id: 'q21c',
      key: 'squid_in_tempura',
      label: 'Q8. 季節の天婦羅盛り合わせにいかは入りますか？',
      type: 'single',
      options: ['必ず入る', '日によって変わる', '入らない'],
      category: 'allergen_recommended',
      applies_to_categories: ['tempura'],
    },
  ],
}

// ============================================================
// ぼんた Phase 5: 個別メニュー確認（海鮮居酒屋向け）
// ============================================================
const BONTA_PHASE_5: Phase = {
  id: 5,
  title: 'Phase 5: 個別メニュー確認',
  description: 'Q1-Q12 — Aランク品の詳細確認',
  questions: [
    {
      id: 'q23a',
      key: 'course_allergens',
      label: 'Q1. 各コースに必ず入るアレルゲン食材は？',
      type: 'table',
      tableRows: ['越前ズワイ蟹とセイコ蟹のフルコース ¥55,000', '越前ズワイ蟹と福井の幸堪能コース ¥34,100', '越前紅ズワイ蟹と福井の幸コース ¥15,400', '極、福井コース ¥8,800', '福井美味いもんコース ¥6,600', '越前コース ¥3,850'],
      tableColumns: ['えび・かに', '小麦', '卵', '乳', 'そば'],
      category: 'individual_menu',
      applies_to_categories: ['course'],
    },
    {
      id: 'q23b',
      key: 'course_seasonal',
      label: 'Q2. コース内容は季節で変わりますか？',
      type: 'single',
      options: ['固定（通年同じ）', '季節で一部入れ替え', '毎回違う（おまかせ）'],
      category: 'individual_menu',
      applies_to_categories: ['course'],
      note: '変わる内容',
    },
    {
      id: 'q23c',
      key: 'course_allergy_response',
      label: 'Q3. コースでアレルギー対応はしてますか？',
      type: 'single',
      options: ['事前に言ってもらえれば対応する', '対応していない', 'その他'],
      category: 'individual_menu',
      applies_to_categories: ['course'],
      note: '詳細',
    },
    {
      id: 'q24a',
      key: 'winter_period',
      label: 'Q4. 冬限定メニューの提供期間は？',
      type: 'single',
      options: ['11月〜2月', '11月〜3月', '品によって違う', 'その他'],
      category: 'individual_menu',
      applies_to_categories: ['main', 'nabe'],
      note: '詳細',
    },
    {
      id: 'q24c',
      key: 'seiko_crab_period',
      label: 'Q5. セイコ蟹はいつまで？',
      type: 'single',
      options: ['解禁期間のみ（11月〜12月末）', '冷凍ストックで冬の間ずっと', 'その他'],
      category: 'individual_menu',
      applies_to_categories: ['main'],
    },
    {
      id: 'q27c',
      key: 'yukke_sauce',
      label: 'Q6. ユッケのタレに入ってるものは？（複数OK）',
      type: 'multi',
      options: ['卵黄（生）', 'ごま油', '醤油', 'コチュジャン', 'にんにく', 'その他'],
      category: 'individual_menu',
      applies_to_categories: ['main', 'sashimi'],
    },
    {
      id: 'q28a',
      key: 'sashimi_assort',
      label: 'Q7. 旬のお刺身盛合せ7種、通常どんなネタが入りますか？（複数OK）',
      type: 'multi',
      options: ['まぐろ', 'サーモン', 'ぶり/はまち', '甘海老', 'いか', 'たこ', '白身魚', '貝類', 'カンパチ', '福井サーモン', '水たこ', 'のどぐろ', '日によって全然違う', 'その他'],
      category: 'individual_menu',
      applies_to_categories: ['sashimi'],
    },
    {
      id: 'q28b',
      key: 'tempura_assort',
      label: 'Q8. 季節の天婦羅盛り合わせ、通常どんなネタが入りますか？（複数OK）',
      type: 'multi',
      options: ['えび', 'いか', '白身魚', 'ズワイ蟹', 'なす', 'さつまいも', 'しいたけ', '大葉', '日によって変わる', 'その他'],
      category: 'individual_menu',
      applies_to_categories: ['tempura'],
    },
    {
      id: 'q28d',
      key: 'crab_nabe_ingredients',
      label: 'Q9. 蟹と海鮮鍋の具材は固定？日替わり？',
      type: 'single',
      options: ['固定', '日替わり', '季節で変わる'],
      category: 'individual_menu',
      applies_to_categories: ['nabe'],
    },
    {
      id: 'q28f',
      key: 'pizza_allergens',
      label: 'Q10. ピッツァの生地に卵・乳は入ってますか？',
      type: 'single',
      options: ['入ってない', '卵が入ってる', '乳が入ってる', '両方入ってる', 'わからない'],
      category: 'individual_menu',
      applies_to_categories: ['main'],
    },
    {
      id: 'q28g',
      key: 'cream_croquette',
      label: 'Q11. 蟹クリームコロッケの中身は？（複数OK）',
      type: 'multi',
      options: ['蟹身', '牛乳/生クリーム', 'バター', '小麦粉（ホワイトソース）', '卵（衣）', 'パン粉', 'その他'],
      category: 'individual_menu',
      applies_to_categories: ['main'],
    },
    {
      id: 'q28h',
      key: 'dessert_gogatsu',
      label: 'Q12. 五月ヶ瀬アイスの原材料は？（複数OK）',
      type: 'multi',
      options: ['五月ヶ瀬（小麦・落花生）', '牛乳/生クリーム', '卵', '砂糖', 'その他'],
      category: 'individual_menu',
      applies_to_categories: ['dessert'],
    },
  ],
}

// ============================================================
// ジョルノ Phase 3: 特定原材料8品目（カクテルバー向け）
// ============================================================
const GIORNO_PHASE_3: Phase = {
  id: 3,
  title: 'Phase 3: 特定原材料8品目',
  description: 'Q1-Q8 — 表示義務のある8品目',
  questions: [
    {
      id: 'g9a',
      key: 'bar_shrimp_usage',
      label: 'Q1. ガーニッシュや前菜にえびを使いますか？',
      type: 'single',
      options: ['使わない', '使う', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['appetizer', 'main'],
      note: 'メニュー名',
    },
    {
      id: 'g10a',
      key: 'bar_crab_usage',
      label: 'Q2. かにを使う料理やドリンクはありますか？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['appetizer', 'main'],
      note: 'メニュー名',
    },
    {
      id: 'g11a',
      key: 'bar_wheat_usage',
      label: 'Q3. パスタ以外で小麦を使うメニューは？',
      type: 'single',
      options: ['パスタのみ', 'ピザ生地も自家製', '他にもある', '小麦メニューなし', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['main', 'appetizer', 'side'],
      note: 'メニュー名',
    },
    {
      id: 'g12a',
      key: 'bar_soba_usage',
      label: 'Q4. そば粉を使うメニューはありますか？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['main'],
      note: 'メニュー名',
    },
    {
      id: 'g13a',
      key: 'bar_egg_usage',
      label: 'Q5. 卵を使うメニューは？（複数OK）',
      type: 'multi',
      options: ['デザート（プリン・ケーキ等）', 'カクテル（サワー系の卵白）', '前菜・フード', '使ってない', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['dessert', 'cocktail', 'main', 'appetizer'],
      note: 'メニュー名',
    },
    {
      id: 'g14a',
      key: 'bar_dairy_usage',
      label: 'Q6. 乳製品を使うメニューは？（複数OK）',
      type: 'multi',
      options: ['クリーム系カクテル', 'デザート（アイス・チーズケーキ等）', 'チーズ盛り合わせ', 'パスタソース', '使ってない', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['cocktail', 'dessert', 'appetizer', 'main'],
      note: 'メニュー名',
    },
    {
      id: 'g15a',
      key: 'bar_peanut_usage',
      label: 'Q7. 落花生（ピーナッツ）を使うメニューは？（複数OK）',
      type: 'multi',
      options: ['おつまみナッツに含まれる', 'ガーニッシュに使用', '料理に使用', 'ない', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['appetizer', 'cocktail'],
      note: 'メニュー名',
    },
    {
      id: 'g16a',
      key: 'bar_walnut_usage',
      label: 'Q8. くるみを使うメニューやドリンクは？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_8',
      applies_to_categories: ['appetizer', 'dessert', 'cocktail'],
      note: 'メニュー名',
    },
  ],
}

// ============================================================
// ジョルノ Phase 4: 推奨表示品目（カクテルバー向け）
// ============================================================
const GIORNO_PHASE_4: Phase = {
  id: 4,
  title: 'Phase 4: 推奨表示品目',
  description: 'Q1-Q6 — アレルギー事故が多い品目',
  questions: [
    {
      id: 'g17a',
      key: 'bar_nuts_snack',
      label: 'Q1. おつまみナッツの種類は？（複数OK）',
      type: 'multi',
      options: ['アーモンド', 'カシューナッツ', 'マカダミア', 'ピスタチオ', 'くるみ', '落花生', 'ミックス（詳細不明）', 'ナッツ提供なし'],
      category: 'allergen_recommended',
      applies_to_categories: ['appetizer'],
    },
    {
      id: 'g17b',
      key: 'bar_nuts_garnish',
      label: 'Q2. ガーニッシュにナッツを使うカクテルは？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'allergen_recommended',
      applies_to_categories: ['cocktail'],
      note: 'カクテル名',
    },
    {
      id: 'g18a',
      key: 'bar_sesame_usage',
      label: 'Q3. 前菜でゴマ油やゴマを使いますか？（複数OK）',
      type: 'multi',
      options: ['ごま油を使うメニューがある', '粒ゴマ・すりゴマを使うメニューがある', '全メニューで不使用', 'わからない'],
      category: 'allergen_recommended',
      applies_to_categories: ['appetizer', 'main'],
      note: 'メニュー名',
    },
    {
      id: 'g19a',
      key: 'bar_fruit_list',
      label: 'Q4. フルーツカクテルに使う果物は？（複数OK）',
      type: 'multi',
      options: ['キウイ', 'もも', 'りんご', 'バナナ', 'オレンジ', 'グレープフルーツ', 'レモン', 'ライム', 'パイナップル', 'マンゴー', 'いちご', 'ぶどう', 'その他'],
      category: 'allergen_recommended',
      applies_to_categories: ['cocktail'],
      note: '他にあれば記載',
    },
    {
      id: 'g19b',
      key: 'bar_fruit_fresh',
      label: 'Q5. フルーツは生を使いますか？冷凍/缶詰ですか？',
      type: 'single',
      options: ['全部生', '一部冷凍/缶詰', 'ほぼ冷凍/缶詰', 'ものによる'],
      category: 'allergen_recommended',
      applies_to_categories: ['cocktail'],
    },
    {
      id: 'g20a',
      key: 'bar_gelatin_usage',
      label: 'Q6. デザートにゼラチンを使ってますか？',
      type: 'single',
      options: ['使ってる', '使ってない（寒天等）', 'デザートなし', 'わからない'],
      category: 'allergen_recommended',
      applies_to_categories: ['dessert'],
      note: 'メニュー名',
    },
  ],
}

// ============================================================
// ジョルノ Phase 5: 個別メニュー確認（カクテルバー向け）
// ============================================================
const GIORNO_PHASE_5: Phase = {
  id: 5,
  title: 'Phase 5: 個別メニュー確認',
  description: 'Q1-Q7 — THEシリーズ・フード・デザートの詳細',
  questions: [
    {
      id: 'g22a',
      key: 'the_series_base',
      label: 'Q1. THEシリーズ13種の共通ベースは？（複数OK）',
      type: 'multi',
      options: ['ウォッカ', 'シロップ', 'フレッシュフルーツ', '炭酸', 'その他'],
      category: 'individual_menu',
      applies_to_categories: ['cocktail'],
    },
    {
      id: 'g22b',
      key: 'the_series_hidden_allergen',
      label: 'Q2. THEシリーズで乳製品やナッツリキュールを使うものは？',
      type: 'single',
      options: ['ない', 'ある', 'わからない'],
      category: 'individual_menu',
      applies_to_categories: ['cocktail'],
      note: 'カクテル名と使用リキュール',
    },
    {
      id: 'g22c',
      key: 'cream_cocktails',
      label: 'Q3. クリーム系カクテル（乳製品使用）はどれですか？（複数OK）',
      type: 'multi',
      options: ['ホワイトルシアン', 'カルーアミルク', 'アレキサンダー', 'グラスホッパー', '他にもある', 'クリーム系はない'],
      category: 'individual_menu',
      applies_to_categories: ['cocktail'],
      note: '他にあれば記載',
    },
    {
      id: 'g23a',
      key: 'food_appetizer_allergens',
      label: 'Q4. 前菜（ナッツ/生ハム/チーズ等）のアレルゲンは？',
      type: 'multi',
      options: ['ナッツ類', '乳製品（チーズ）', '卵', '小麦（クラッカー等）', '魚介', 'わからない'],
      category: 'individual_menu',
      applies_to_categories: ['appetizer'],
    },
    {
      id: 'g23b',
      key: 'pasta_sauce_allergens',
      label: 'Q5. パスタソースの原材料は？（複数OK）',
      type: 'multi',
      options: ['トマトソース', 'クリームソース（乳）', 'オイルベース', 'チーズ', '卵', 'アンチョビ（魚介）', 'その他'],
      category: 'individual_menu',
      applies_to_categories: ['main'],
    },
    {
      id: 'g24a',
      key: 'table_charge_content',
      label: 'Q6. テーブルチャージ/お通しの内容は？',
      type: 'single',
      options: ['固定（いつも同じ）', '日によって変わる', 'お通しなし'],
      category: 'individual_menu',
      applies_to_categories: ['appetizer'],
      note: '内容とアレルゲン',
    },
    {
      id: 'g25a',
      key: 'dessert_detail',
      label: 'Q7. 各デザートの主な原材料は？',
      type: 'text',
      category: 'individual_menu',
      applies_to_categories: ['dessert'],
      note: 'デザート名と原材料（例: チーズケーキ→クリームチーズ・卵・小麦粉・砂糖）',
    },
  ],
}

// ============================================================
// 後方互換: 既存のPHASES定数（デフォルト=ぼんた）
// ============================================================
export const PHASES: Phase[] = [
  COMMON_PHASE_1,
  COMMON_PHASE_2,
  BONTA_PHASE_3,
  BONTA_PHASE_4,
  BONTA_PHASE_5,
  COMMON_PHASE_6,
]

// ============================================================
// 業種別質問セット選択
// ============================================================
export function getPhases(businessType?: string | null): Phase[] {
  if (businessType === 'カクテルバー' || businessType === 'バー' || businessType === 'bar') {
    return [
      COMMON_PHASE_1,
      COMMON_PHASE_2,
      GIORNO_PHASE_3,
      GIORNO_PHASE_4,
      GIORNO_PHASE_5,
      COMMON_PHASE_6,
    ]
  }
  // デフォルト: 海鮮居酒屋（ぼんた）
  return PHASES
}
