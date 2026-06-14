/**
 * アレルゲンのカラーピクトグラム。
 *
 * カードに来る allergens は表示文字列(バックエンドのアレルゲンマスタの name_jp / name_en)
 * なので、それを正準アイコンkeyに逆引きして public/allergens/{key}.svg を出す。
 * 信頼性のためテキストは消さない(呼び出し側でアイコン+テキストのチップにする)。
 * アイコンが無い品目(ごま・いくら・セロリ等)は null を返し、テキストだけで担保する。
 *
 * アイコン素材: OpenMoji (CC BY-SA 4.0) を public/allergens/ にバンドル。
 */

// 表示文字列(小文字) -> アイコンkey。jp/en 両方を登録(=ja表示でも多言語表示でも引ける)。
const STRING_TO_ICON: Record<string, string> = {}
const add = (icon: string, ...labels: string[]): void => {
  for (const l of labels) STRING_TO_ICON[l.trim().toLowerCase()] = icon
}

add('shrimp', 'えび', 'shrimp')
add('crab', 'かに', 'crab')
add('wheat', '小麦', 'wheat')
add('soba', 'そば', 'buckwheat', 'soba')
add('egg', '卵', 'egg', 'たまご', 'tamago', '卵 / たまご')
add('milk', '乳', 'milk', 'dairy', '乳製品', '牛乳')
add('peanut', '落花生', 'peanut')
add('walnut', 'くるみ', 'walnut')
add('almond', 'アーモンド', 'almond')
add('cashew', 'カシューナッツ', 'cashew nut', 'cashew')
add('soy', '大豆', 'soybean', 'soy')
add('yam', 'やまいも', 'yam')
add('matsutake', 'まつたけ', 'matsutake mushroom', 'matsutake')
add('abalone', 'あわび', 'abalone')
add('squid', 'いか', 'squid')
add('salmon', 'さけ', 'salmon', '魚', 'fish') // 汎用の魚アイコン
add('mackerel', 'さば', 'mackerel')
add('chicken', '鶏肉', 'chicken')
add('pork', '豚肉', 'pork')
add('beef', '牛肉', 'beef')
add('gelatin', 'ゼラチン', 'gelatin')
add('apple', 'りんご', 'apple')
add('orange', 'オレンジ', 'orange')
add('kiwi', 'キウイフルーツ', 'kiwi fruit', 'kiwi')
add('banana', 'バナナ', 'banana')
add('peach', 'もも', 'peach')

export function allergenIconKey(label: string): string | null {
  if (!label) return null
  return STRING_TO_ICON[label.trim().toLowerCase()] ?? null
}

export function AllergenIcon({ label, size = 18 }: { label: string; size?: number }) {
  const key = allergenIconKey(label)
  if (!key) return null
  return (
    <img
      className="nfgcard-allergen-icon"
      src={`/allergens/${key}.svg`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      loading="lazy"
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}
