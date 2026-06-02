'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronDown, ChevronUp, Heart, MessageCircle, Wine, AlertTriangle } from 'lucide-react'
import { MenuSearchApi, type MenuNFGCard } from '../services/api'
import { useAppContext } from './AppProvider'
import { getUiCopy } from '../i18n/uiCopy'
import { getLikedMenuUids, toggleMenuLike } from '../services/menuLikes'

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
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
}

function getCategoryLabel(cat: string, lang: string): string {
  const labels = CATEGORY_LABELS[lang] || CATEGORY_LABELS.en
  return labels[cat] || cat
}

type MenuListDrawerProps = {
  open: boolean
  onClose: () => void
  restaurantSlug: string | null
  businessType?: string | null
  /** chat に質問を投入する callback（CapturePage 提供）。設定時はチップ行表示。 */
  onAskAbout?: (query: string) => void
}

const BAR_TYPES = ['バー', 'カクテルバー', 'ワインバー', 'ダイニングバー', 'bar', 'cocktail bar', 'wine bar', 'dining bar']

export default function MenuListDrawer({ open, onClose, restaurantSlug, businessType, onAskAbout }: MenuListDrawerProps) {
  const { language } = useAppContext()
  const copy = getUiCopy(language)
  const nfgCopy = (copy as any).nfg || {}

  const [menus, setMenus] = useState<MenuNFGCard[]>([])
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [expandedUid, setExpandedUid] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  // ♡ 状態（NFGCard と同じ localStorage を読み書き）
  const [likedMenus, setLikedMenus] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  useEffect(() => {
    if (open) setLikedMenus(getLikedMenuUids())
  }, [open])

  /** チップ click → drawer 閉じる + chat にクエリ投入 */
  const sendToChat = (query: string) => {
    onAskAbout?.(query)
    onClose()
  }

  /** ♡ トグル: Optimistic UI + API */
  const handleLike = async (menuUid: string, currentCount: number) => {
    const next = new Set(likedMenus)
    const isAdding = !next.has(menuUid)
    if (isAdding) next.add(menuUid); else next.delete(menuUid)
    setLikedMenus(next)
    setLikeCounts((prev) => ({
      ...prev,
      [menuUid]: Math.max(0, currentCount + (isAdding ? 1 : -1)),
    }))
    try {
      const res = await toggleMenuLike(menuUid)
      setLikeCounts((prev) => ({ ...prev, [menuUid]: res.like_count }))
    } catch {
      // revert
      const revert = new Set(likedMenus)
      if (isAdding) revert.delete(menuUid); else revert.add(menuUid)
      setLikedMenus(revert)
      setLikeCounts((prev) => ({ ...prev, [menuUid]: currentCount }))
    }
  }

  const fetchMenus = useCallback(async () => {
    if (!restaurantSlug) return
    setLoading(true)
    try {
      const res = await MenuSearchApi.search({
        restaurant_slug: restaurantSlug,
        nfg: true,
        size: 100,
        lang: language,
      })
      const items = res.result.menus as MenuNFGCard[]
      setMenus(items)

      // Extract categories that have menus, preserve order
      const isBar = BAR_TYPES.some(t => (businessType || '').toLowerCase().includes(t.toLowerCase()))
      const ORDER = isBar
        ? ['drink', 'cocktail', 'main', 'appetizer', 'sashimi', 'sushi', 'tempura', 'nabe',
           'rice', 'ramen', 'soba', 'yakitori', 'steamed', 'vinegared',
           'chinmi', 'salad', 'soup', 'side', 'dessert', 'course',
           'bento', 'bread', 'other']
        : ['main', 'appetizer', 'sashimi', 'sushi', 'tempura', 'nabe',
           'rice', 'ramen', 'soba', 'yakitori', 'steamed', 'vinegared',
           'chinmi', 'salad', 'soup', 'side', 'dessert', 'course',
           'bento', 'bread', 'drink', 'other']
      const catSet = new Set(items.map(m => m.category || 'other'))
      const sorted = ORDER.filter(c => catSet.has(c))
      setCategories(sorted)
    } catch (e) {
      console.error('MenuListDrawer fetch error', e)
    } finally {
      setLoading(false)
    }
  }, [restaurantSlug, language])

  // Re-fetch when language changes or drawer opens
  const lastLangRef = useRef(language)
  useEffect(() => {
    if (!open) return
    if (menus.length === 0 || lastLangRef.current !== language) {
      lastLangRef.current = language
      fetchMenus()
    }
  }, [open, fetchMenus, language])

  // Reset when drawer closes
  useEffect(() => {
    if (!open) {
      setExpandedUid(null)
    }
  }, [open])

  const filtered = activeCategory === 'all'
    ? menus
    : menus.filter(m => (m.category || 'other') === activeCategory)

  // Sort "all" tab: bar→drink first, otherwise drink last
  const isBar = BAR_TYPES.some(t => (businessType || '').toLowerCase().includes(t.toLowerCase()))
  const sorted = activeCategory === 'all'
    ? [...filtered].sort((a, b) => {
        const aIsDrink = a.category === 'drink' ? 1 : 0
        const bIsDrink = b.category === 'drink' ? 1 : 0
        return isBar ? (bIsDrink - aIsDrink) : (aIsDrink - bIsDrink)
      })
    : filtered

  const displayName = (m: MenuNFGCard) => {
    if (language !== 'ja' && m.name_en) return m.name_en
    return m.name_jp
  }

  const subName = (m: MenuNFGCard) => {
    if (language !== 'ja') return m.name_jp
    return m.name_en || null
  }

  const tasteLabels: Record<string, string> = {
    umami: nfgCopy.tasteUmami || 'Umami',
    richness: nfgCopy.tasteRichness || 'Rich',
    saltiness: nfgCopy.tasteSaltiness || 'Salty',
    sweetness: nfgCopy.tasteSweetness || 'Sweet',
    spiciness: nfgCopy.tasteSpiciness || 'Spicy',
    lightness: nfgCopy.tasteLightness || 'Light',
    sourness: nfgCopy.tasteSourness || 'Sour',
    bitterness: nfgCopy.tasteBitterness || 'Bitter',
    volume: nfgCopy.tasteVolume || 'Volume',
    locality: nfgCopy.tasteLocality || 'Local',
  }

  return (
    <div className={`menu-list-overlay${open ? ' open' : ''}`} onClick={onClose}>
      <div
        className={`menu-list-panel${open ? ' open' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="menu-list-header">
          <span className="menu-list-title">
            {(copy as any).webLanding?.exploreMenu || 'Menu'}
          </span>
          <button className="menu-list-close" type="button" onClick={onClose}>
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {/* Category tabs */}
        <div className="menu-list-tabs">
          <button
            className={`menu-list-tab${activeCategory === 'all' ? ' active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            {getCategoryLabel('all', language)}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`menu-list-tab${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {getCategoryLabel(cat, language)}
            </button>
          ))}
        </div>

        {/* Menu list */}
        <div className="menu-list-body">
          {loading ? (
            <div className="menu-list-loading">
              <div className="menu-list-spinner" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="menu-list-empty">No menus found</div>
          ) : (
            sorted.map(m => {
              const isOpen = expandedUid === m.uid
              const hasDetails = m.narrative_full || m.taste_values || m.allergens?.length || m.ingredients?.length
              return (
                <div
                  key={m.uid}
                  className={`menu-list-item${isOpen ? ' expanded' : ''}`}
                  onClick={() => setExpandedUid(isOpen ? null : m.uid)}
                >
                  {/* Compact row */}
                  <div className="menu-list-item-row">
                    <div className="menu-list-item-info">
                      <span className="menu-list-item-name">
                        {m.is_daily && <span className="menu-list-daily-badge">本日の献立</span>}
                        {displayName(m)}
                      </span>
                      {subName(m) && (
                        <span className="menu-list-item-sub">{subName(m)}</span>
                      )}
                    </div>
                    <div className="menu-list-item-right">
                      {m.price > 0 && (
                        <span className="menu-list-item-price">
                          ¥{m.price.toLocaleString()}
                        </span>
                      )}
                      {hasDetails && (
                        isOpen
                          ? <ChevronUp size={16} className="menu-list-chevron" />
                          : <ChevronDown size={16} className="menu-list-chevron" />
                      )}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="menu-list-detail">
                      {m.image_url && (
                        <div className="menu-list-detail-image">
                          <img src={m.image_url} alt={m.name_jp} loading="lazy" />
                        </div>
                      )}

                      {m.description && (
                        <p className="menu-list-detail-desc">{m.description}</p>
                      )}

                      {m.narrative_full?.story && (
                        <p className="menu-list-detail-story">{m.narrative_full.story}</p>
                      )}

                      {m.allergens && m.allergens.length > 0 && (
                        <div className="menu-list-detail-tags">
                          <span className="menu-list-detail-label">{nfgCopy.allergens || 'Allergens'}</span>
                          <div className="menu-list-detail-tag-list">
                            {m.allergens.map((a, i) => (
                              <span key={i} className="menu-list-tag allergen">{a}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.ingredients && m.ingredients.length > 0 && (
                        <div className="menu-list-detail-tags">
                          <span className="menu-list-detail-label">{nfgCopy.ingredients || 'Ingredients'}</span>
                          <div className="menu-list-detail-tag-list">
                            {m.ingredients.map((ing, i) => (
                              <span key={i} className="menu-list-tag ingredient">{ing}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.restrictions && m.restrictions.length > 0 && (
                        <div className="menu-list-detail-tags">
                          <span className="menu-list-detail-label">{nfgCopy.restrictions || 'Diet'}</span>
                          <div className="menu-list-detail-tag-list">
                            {m.restrictions.map((r, i) => (
                              <span key={i} className="menu-list-tag restriction">{r}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {m.narrative_full?.how_to_eat && (
                        <div className="menu-list-detail-field">
                          <span className="menu-list-detail-label">{nfgCopy.howToEat || 'How to eat'}</span>
                          <span>{m.narrative_full.how_to_eat}</span>
                        </div>
                      )}

                      {m.narrative_full?.pairing && (
                        <div className="menu-list-detail-field">
                          <span className="menu-list-detail-label">{nfgCopy.pairing || 'Pairing'}</span>
                          <span>{m.narrative_full.pairing}</span>
                        </div>
                      )}

                      {m.serving && (m.serving as any).style && (
                        <div className="menu-list-detail-field">
                          <span className="menu-list-detail-label">{nfgCopy.servingStyle || 'Serving'}</span>
                          <span>
                            {[(m.serving as any).style, (m.serving as any).portion, (m.serving as any).temperature]
                              .filter(Boolean).join(' / ')}
                          </span>
                        </div>
                      )}

                      {/* ── Action chips: chat 直結 + ♡ ── */}
                      <div className="menu-list-detail-actions">
                        <button
                          type="button"
                          className={`menu-list-action-chip menu-list-action-like${likedMenus.has(m.uid) ? ' liked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            const cur = likeCounts[m.uid] ?? (m as any).like_count ?? 0
                            handleLike(m.uid, cur)
                          }}
                          aria-label={likedMenus.has(m.uid) ? 'Unlike' : 'Like'}
                        >
                          <Heart size={14} fill={likedMenus.has(m.uid) ? '#ff5050' : 'none'} />
                          {(() => {
                            const cnt = likeCounts[m.uid] ?? (m as any).like_count ?? 0
                            return cnt > 0 ? <span>{cnt}</span> : null
                          })()}
                        </button>
                        {onAskAbout && (
                          <>
                            <button
                              type="button"
                              className="menu-list-action-chip"
                              onClick={(e) => {
                                e.stopPropagation()
                                sendToChat(`${m.name_jp}について教えて`)
                              }}
                            >
                              <MessageCircle size={14} />
                              <span>もっと知る</span>
                            </button>
                            <button
                              type="button"
                              className="menu-list-action-chip"
                              onClick={(e) => {
                                e.stopPropagation()
                                sendToChat(`${m.name_jp}に合う飲み物は？`)
                              }}
                            >
                              <Wine size={14} />
                              <span>合う飲み物</span>
                            </button>
                            <button
                              type="button"
                              className="menu-list-action-chip"
                              onClick={(e) => {
                                e.stopPropagation()
                                sendToChat(`${m.name_jp}のアレルゲンを詳しく教えて`)
                              }}
                            >
                              <AlertTriangle size={14} />
                              <span>アレルゲン</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
