'use client'

import { useEffect, useState } from 'react'
import { RestaurantApi, type FullMenuCategory } from '../services/api'

interface QRMenuViewProps {
  restaurantSlug: string
  language: string
  onChatMode: () => void
}

const LANG_LABELS: Record<string, string> = {
  ja: '日本語', en: 'English', zh: '中文', 'zh-Hant': '繁體中文',
  ko: '한국어', es: 'Espanol', fr: 'Francais', de: 'Deutsch',
  it: 'Italiano', pt: 'Portugues', ru: 'Русский', th: 'ไทย', vi: 'Tieng Viet', id: 'Indonesia',
}

export default function QRMenuView({ restaurantSlug, language, onChatMode }: QRMenuViewProps) {
  const [categories, setCategories] = useState<FullMenuCategory[]>([])
  const [restaurant, setRestaurant] = useState<{ name: string; name_romaji: string | null; logo_url: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeLang, setActiveLang] = useState(language)
  const [showLangPicker, setShowLangPicker] = useState(false)

  useEffect(() => {
    setLoading(true)
    RestaurantApi.getFullMenu(restaurantSlug, activeLang)
      .then(res => {
        setCategories(res.result.categories)
        setRestaurant(res.result.restaurant)
      })
      .catch(() => setError('Failed to load menu'))
      .finally(() => setLoading(false))
  }, [restaurantSlug, activeLang])

  if (loading) {
    return (
      <div style={s.container}>
        <div style={s.loading}>
          <div style={s.spinner} />
          <p style={{ color: '#94A3B8', marginTop: '12px' }}>Loading menu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={s.container}>
        <p style={{ color: '#EF4444', textAlign: 'center', padding: '40px' }}>{error}</p>
      </div>
    )
  }

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          {restaurant?.logo_url && (
            <img src={restaurant.logo_url} alt="" style={s.logo} />
          )}
          <div>
            <h1 style={s.storeName}>{activeLang !== 'ja' && restaurant?.name_romaji ? restaurant.name_romaji : restaurant?.name}</h1>
            <p style={s.powered}>Powered by NGraph</p>
          </div>
        </div>
        <button style={s.langBtn} onClick={() => setShowLangPicker(!showLangPicker)}>
          {LANG_LABELS[activeLang] || activeLang}
        </button>
      </div>

      {/* Language picker */}
      {showLangPicker && (
        <div style={s.langPicker}>
          {Object.entries(LANG_LABELS).map(([code, label]) => (
            <button
              key={code}
              style={{ ...s.langOption, ...(code === activeLang ? s.langOptionActive : {}) }}
              onClick={() => { setActiveLang(code); setShowLangPicker(false) }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Menu categories */}
      <div style={s.menuBody}>
        {categories.map(cat => (
          <div key={cat.category} style={s.categorySection}>
            <h2 style={s.categoryTitle}>{cat.label}</h2>
            <div style={s.menuGrid}>
              {cat.menus.map((menu, i) => (
                <div key={i} style={s.menuCard}>
                  {menu.image_url && (
                    <img src={menu.image_url} alt="" style={s.menuImage} />
                  )}
                  <div style={s.menuInfo}>
                    <div style={s.menuName}>
                      {activeLang === 'ja' ? menu.name_jp : (menu.name_en || menu.name_jp)}
                    </div>
                    {menu.description_local && (
                      <div style={s.menuDesc}>{menu.description_local}</div>
                    )}
                    {!menu.description_local && menu.description && (
                      <div style={s.menuDesc}>{menu.description}</div>
                    )}
                    <div style={s.menuBottom}>
                      <span style={s.menuPrice}>
                        {menu.price ? `¥${menu.price.toLocaleString()}` : ''}
                      </span>
                      {menu.allergens && menu.allergens.length > 0 && (
                        <div style={s.allergenChips}>
                          {menu.allergens.slice(0, 3).map((a: string, j: number) => (
                            <span key={j} style={s.allergenChip}>{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {menu.price_detail?.variants && (
                      <div style={s.variants}>
                        {menu.price_detail.variants.map((v: { label: string; price: number }, j: number) => (
                          <span key={j} style={s.variantChip}>{v.label} ¥{v.price.toLocaleString()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Chat CTA */}
      <button style={s.chatBtn} onClick={onChatMode}>
        AIに質問する
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0D0D0D',
    color: '#E2E8F0',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '2px solid rgba(255,255,255,0.1)',
    borderTopColor: 'rgba(255,255,255,0.5)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #1E293B',
    position: 'sticky' as const,
    top: 0,
    backgroundColor: '#0D0D0D',
    zIndex: 10,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    objectFit: 'cover' as const,
  },
  storeName: {
    fontSize: '18px',
    fontWeight: 700,
    margin: 0,
  },
  powered: {
    fontSize: '11px',
    color: '#64748B',
    margin: 0,
  },
  langBtn: {
    padding: '6px 12px',
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#E2E8F0',
    fontSize: '13px',
    cursor: 'pointer',
  },
  langPicker: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    padding: '12px 20px',
    borderBottom: '1px solid #1E293B',
    backgroundColor: '#111827',
  },
  langOption: {
    padding: '4px 10px',
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    borderRadius: '4px',
    color: '#94A3B8',
    fontSize: '12px',
    cursor: 'pointer',
  },
  langOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
    color: '#fff',
  },
  menuBody: {
    padding: '12px 16px 80px',
  },
  categorySection: {
    marginBottom: '24px',
  },
  categoryTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#F8FAFC',
    marginBottom: '12px',
    paddingBottom: '6px',
    borderBottom: '1px solid #1E293B',
  },
  menuGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  menuCard: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#111827',
    borderRadius: '8px',
  },
  menuImage: {
    width: '72px',
    height: '72px',
    borderRadius: '6px',
    objectFit: 'cover' as const,
    flexShrink: 0,
  },
  menuInfo: {
    flex: 1,
    minWidth: 0,
  },
  menuName: {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  menuDesc: {
    fontSize: '12px',
    color: '#94A3B8',
    lineHeight: '1.4',
    marginBottom: '6px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  menuBottom: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  menuPrice: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#3B82F6',
  },
  allergenChips: {
    display: 'flex',
    gap: '4px',
  },
  allergenChip: {
    fontSize: '10px',
    padding: '1px 6px',
    backgroundColor: 'rgba(239,68,68,0.15)',
    color: '#FCA5A5',
    borderRadius: '4px',
  },
  variants: {
    display: 'flex',
    gap: '6px',
    marginTop: '4px',
  },
  variantChip: {
    fontSize: '11px',
    padding: '2px 6px',
    backgroundColor: '#1E293B',
    color: '#94A3B8',
    borderRadius: '4px',
  },
  chatBtn: {
    position: 'fixed' as const,
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    backgroundColor: '#3B82F6',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
    zIndex: 20,
  },
}
