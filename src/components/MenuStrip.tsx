'use client'

import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { TopMenusApi } from '../services/api'
import { useAppContext } from './AppProvider'

// hero に静かに置く「テーブルの上のメニュー」: 写真ミニカードの横スクロール
// AI からは喋らない。タップで MenuListDrawer の該当カードが開く。

const STRIP_LABELS: Record<string, { menu: string; seeAll: string }> = {
  ja: { menu: 'メニュー', seeAll: 'すべて見る' },
  en: { menu: 'Menu', seeAll: 'See all' },
  ko: { menu: '메뉴', seeAll: '전체 보기' },
  'zh-Hans': { menu: '菜单', seeAll: '查看全部' },
  'zh-Hant': { menu: '菜單', seeAll: '查看全部' },
  es: { menu: 'Menú', seeAll: 'Ver todo' },
  fr: { menu: 'Menu', seeAll: 'Tout voir' },
}

type StripItem = {
  uid: string
  name: string
  price: number
  imageUrl: string | null
}

type MenuStripProps = {
  restaurantSlug: string | null
  onCardTap: (menuUid: string) => void
  onSeeAll: () => void
}

export default function MenuStrip({ restaurantSlug, onCardTap, onSeeAll }: MenuStripProps) {
  const { language } = useAppContext()
  const labels = STRIP_LABELS[language] || STRIP_LABELS.en
  const [items, setItems] = useState<StripItem[]>([])

  useEffect(() => {
    if (!restaurantSlug) return
    let cancelled = false
    TopMenusApi.fetch(restaurantSlug, 12, language)
      .then((data) => {
        if (cancelled) return
        const menus = Array.isArray(data?.result?.menus) ? data.result.menus : []
        // 写真があれば写真カード、無ければ品書き風の文字タイル(導入店の写真登録はまだ疎ら)
        const mapped: StripItem[] = menus
          .filter((m: any) => m.menu_uid && m.name_jp)
          .slice(0, 10)
          .map((m: any) => ({
            uid: m.menu_uid,
            name: language !== 'ja' && m.name_en ? m.name_en : m.name_jp,
            price: m.price || 0,
            imageUrl: m.image_url || null,
          }))
        setItems(mapped)
      })
      .catch(() => {
        // 取得失敗時は何も出さない(hero を汚さない)
      })
    return () => { cancelled = true }
  }, [restaurantSlug, language])

  if (items.length < 2) return null

  return (
    <div className="menu-strip">
      <div className="menu-strip-head">
        <span className="menu-strip-label">{labels.menu}</span>
        <button type="button" className="menu-strip-seeall" onClick={onSeeAll}>
          {labels.seeAll}
          <ChevronRight size={13} strokeWidth={2} />
        </button>
      </div>
      <div className="menu-strip-row">
        {items.map((item) => (
          <button
            key={item.uid}
            type="button"
            className="menu-strip-card"
            onClick={() => onCardTap(item.uid)}
          >
            {item.imageUrl ? (
              <>
                <img
                  className="menu-strip-img"
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                />
                <span className="menu-strip-name">{item.name}</span>
              </>
            ) : (
              <span className="menu-strip-tile">
                <span className="menu-strip-tile-name">{item.name}</span>
              </span>
            )}
            {item.price > 0 && (
              <span className="menu-strip-price">¥{item.price.toLocaleString()}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
