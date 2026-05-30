'use client'

import { useEffect } from 'react'
import { X, SquarePen, UtensilsCrossed, Heart, Flame, MessageSquare, Store } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useChatHistory } from '../hooks/useChatHistory'
import { getUiCopy } from '../i18n/uiCopy'
import { useAppContext } from './AppProvider'

type HistoryDrawerProps = {
  open: boolean
  onClose?: () => void
  restaurantSlug?: string | null
  onNewChat?: () => void
  onSelectThread?: (threadUid: string) => void
}

export default function HistoryDrawer({
  open,
  onClose,
  restaurantSlug,
  onNewChat,
  onSelectThread,
}: HistoryDrawerProps) {
  const router = useRouter()
  const { language, openMenuList, onOpenLiked, onOpenPopular } = useAppContext()
  const copy = getUiCopy(language)
  const { threads, refresh } = useChatHistory(restaurantSlug ?? null)

  useEffect(() => {
    if (open) refresh()
  }, [open])

  const t = (key: string, fallback: string): string =>
    ((copy.history as any)?.[key] as string) || fallback

  const inRestaurantContext = Boolean(restaurantSlug)

  return (
    <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose}>
      <aside
        className={`drawer-panel${open ? ' open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sidebar-brand">
          <span
            className="sidebar-omiseai-logo"
            style={{ cursor: 'pointer' }}
            onClick={() => { router.push('/'); onClose?.(); }}
          >
            OMISEAI
          </span>
          <button className="icon-button" type="button" onClick={onClose}>
            <X size={20} strokeWidth={1.75} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* ── セクション 1: 会話 ── */}
        <div className="sidebar-section sidebar-section-grow">
          <div className="sidebar-section-label">{t('sectionConversation', '会話')}</div>
          <button className="sidebar-row" onClick={() => { onNewChat?.(); onClose?.(); }}>
            <SquarePen size={16} strokeWidth={1.75} />
            <span>{t('newChat', 'New chat')}</span>
          </button>

          <div className="sidebar-threads">
            {threads.length === 0 ? (
              <p className="sidebar-empty">{t('empty', 'No conversations yet')}</p>
            ) : (
              threads.map((th) => (
                <div
                  key={th.thread_uid}
                  className="sidebar-thread-item"
                  onClick={() => { onSelectThread?.(th.thread_uid); onClose?.() }}
                >
                  <MessageSquare size={14} strokeWidth={1.5} className="sidebar-thread-icon" />
                  <div className="sidebar-thread-text">
                    <div className="sidebar-thread-title">{th.title || th.preview}</div>
                    <div className="sidebar-thread-date">
                      {new Date(th.updatedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── セクション 2: メニュー探索 ── */}
        {inRestaurantContext && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">{t('sectionExplore', 'メニュー探索')}</div>
            <button className="sidebar-row" onClick={() => { openMenuList(); onClose?.(); }}>
              <UtensilsCrossed size={16} strokeWidth={1.75} />
              <span>{(copy as any).webLanding?.exploreMenu || 'メニュー一覧'}</span>
            </button>
            {onOpenLiked && (
              <button className="sidebar-row" onClick={() => { onOpenLiked(); onClose?.(); }}>
                <Heart size={16} strokeWidth={1.75} />
                <span>{t('favorites', 'お気に入り')}</span>
              </button>
            )}
            {onOpenPopular && (
              <button className="sidebar-row" onClick={() => { onOpenPopular(); onClose?.(); }}>
                <Flame size={16} strokeWidth={1.75} />
                <span>{t('popular', '人気ランキング')}</span>
              </button>
            )}
          </div>
        )}

        {/* ── セクション 3: 店舗 ── */}
        {inRestaurantContext && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">{t('sectionStore', '店舗')}</div>
            <button
              className="sidebar-row"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('omiseai:open-store-info'))
                onClose?.()
              }}
            >
              <Store size={16} strokeWidth={1.75} />
              <span>{t('storeInfo', '店舗情報')}</span>
            </button>
          </div>
        )}

        {/* ── セクション 4: 他 ── */}
        <div className="sidebar-section sidebar-section-bottom">
          <button
            className="sidebar-row sidebar-row-muted"
            onClick={() => { router.push('/explore'); onClose?.(); }}
          >
            <span>{t('exploreOther', '他の店舗を見る')}</span>
          </button>
        </div>
      </aside>
    </div>
  )
}
