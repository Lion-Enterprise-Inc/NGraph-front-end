'use client'

import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { MenuSearchApi, type MenuNFGCard } from '../services/api'
import { useAppContext } from './AppProvider'
import { getCategoryLabel } from '../i18n/categoryLabels'

// hero に静かに置く「テーブルの上のメニュー」: カテゴリーチップの横スクロール。
// 長い商品名を並べると窮屈で読みにくい(写真未登録店で顕著)ため、まずカテゴリーで全体像を見せ、
// タップで該当カテゴリーの一覧(MenuListDrawer)を開く。AI からは喋らない静的UI。

const STRIP_LABELS: Record<string, { menu: string; seeAll: string }> = {
  ja: { menu: 'メニュー', seeAll: 'すべて見る' },
  en: { menu: 'Menu', seeAll: 'See all' },
  ko: { menu: '메뉴', seeAll: '전체 보기' },
  'zh-Hans': { menu: '菜单', seeAll: '查看全部' },
  'zh-Hant': { menu: '菜單', seeAll: '查看全部' },
  es: { menu: 'Menú', seeAll: 'Ver todo' },
  fr: { menu: 'Menu', seeAll: 'Tout voir' },
}

// MenuListDrawer と同じ並び・判定(カテゴリーの表示順を揃える)
const BAR_TYPES = ['バー', 'カクテルバー', 'ワインバー', 'ダイニングバー', 'bar', 'cocktail bar', 'wine bar', 'dining bar']
const ORDER_BAR = ['drink', 'cocktail', 'main', 'appetizer', 'sashimi', 'sushi', 'tempura', 'nabe',
  'rice', 'ramen', 'soba', 'yakitori', 'steamed', 'vinegared', 'chinmi', 'salad', 'soup', 'side',
  'dessert', 'course', 'bento', 'bread', 'other']
const ORDER_DEFAULT = ['main', 'appetizer', 'sashimi', 'sushi', 'tempura', 'nabe', 'rice', 'ramen',
  'soba', 'yakitori', 'steamed', 'vinegared', 'chinmi', 'salad', 'soup', 'side', 'dessert', 'course',
  'bento', 'bread', 'drink', 'other']

type CategoryChip = { cat: string; count: number }

type MenuStripProps = {
  restaurantSlug: string | null
  businessType?: string | null
  onCategoryTap: (category: string) => void
  onSeeAll: () => void
}

export default function MenuStrip({ restaurantSlug, businessType, onCategoryTap, onSeeAll }: MenuStripProps) {
  const { language } = useAppContext()
  const labels = STRIP_LABELS[language] || STRIP_LABELS.en
  const [chips, setChips] = useState<CategoryChip[]>([])

  useEffect(() => {
    if (!restaurantSlug) return
    let cancelled = false
    MenuSearchApi.search({ restaurant_slug: restaurantSlug, nfg: true, size: 100, lang: language })
      .then((res) => {
        if (cancelled) return
        const menus = (res?.result?.menus as MenuNFGCard[]) || []
        // 提供中のみカウント(停止品はホームに出さない)
        const counts = new Map<string, number>()
        for (const m of menus) {
          const cat = m.category || 'other'
          counts.set(cat, (counts.get(cat) || 0) + 1)
        }
        const isBar = BAR_TYPES.some(t => (businessType || '').toLowerCase().includes(t.toLowerCase()))
        const order = isBar ? ORDER_BAR : ORDER_DEFAULT
        const sorted: CategoryChip[] = order
          .filter(c => counts.has(c))
          .map(c => ({ cat: c, count: counts.get(c)! }))
        setChips(sorted)
      })
      .catch(() => {
        // 取得失敗時は何も出さない(hero を汚さない)
      })
    return () => { cancelled = true }
  }, [restaurantSlug, language, businessType])

  if (chips.length < 2) return null

  return (
    <div className="menu-strip">
      <div className="menu-strip-head">
        <span className="menu-strip-label">{labels.menu}</span>
        <button type="button" className="menu-strip-seeall" onClick={onSeeAll}>
          {labels.seeAll}
          <ChevronRight size={13} strokeWidth={2} />
        </button>
      </div>
      <div className="menu-strip-cats">
        {chips.map((c) => (
          <button
            key={c.cat}
            type="button"
            className="menu-strip-cat"
            onClick={() => onCategoryTap(c.cat)}
          >
            <span className="menu-strip-cat-name">{getCategoryLabel(c.cat, language)}</span>
            <span className="menu-strip-cat-count">{c.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
