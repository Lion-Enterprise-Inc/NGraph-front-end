// メニューカテゴリの多言語ラベル。DB は英語キー(main/appetizer 等)で持つので
// 表示時にこの辞書で各言語に変換する。未対応言語・未知キーは en or キーそのまま。
export const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  ja: {
    all: 'すべて', main: 'メイン', appetizer: '前菜', sashimi: '刺身',
    sushi: '寿司', tempura: '天ぷら', nabe: '鍋物', rice: 'ご飯もの',
    ramen: 'ラーメン', soba: 'そば・うどん', yakitori: '焼き鳥',
    steamed: '蒸し物', vinegared: '酢の物', chinmi: '珍味',
    salad: 'サラダ', soup: 'スープ', side: '一品料理',
    drink: 'ドリンク', dessert: 'デザート', course: 'コース',
    bento: '弁当', bread: 'パン', other: 'その他',
  },
  en: {
    all: 'All', main: 'Main', appetizer: 'Appetizer', sashimi: 'Sashimi',
    sushi: 'Sushi', tempura: 'Tempura', nabe: 'Hot Pot', rice: 'Rice',
    ramen: 'Ramen', soba: 'Noodles', yakitori: 'Yakitori',
    steamed: 'Steamed', vinegared: 'Vinegared', chinmi: 'Delicacy',
    salad: 'Salad', soup: 'Soup', side: 'Side',
    drink: 'Drink', dessert: 'Dessert', course: 'Course',
    bento: 'Bento', bread: 'Bread', other: 'Other',
  },
};

export function getCategoryLabel(cat: string, lang: string): string {
  if (!cat) return '';
  const labels = CATEGORY_LABELS[lang] || CATEGORY_LABELS.en;
  return labels[cat] || cat;
}
