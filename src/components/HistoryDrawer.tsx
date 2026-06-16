'use client'

import { useEffect } from 'react'
import { X, SquarePen, UtensilsCrossed, MessageSquare, Store, AlertCircle, Star, ClipboardCheck, CalendarDays, Pencil, Receipt, Eye, Share2, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useChatHistory } from '../hooks/useChatHistory'
import { getUiCopy } from '../i18n/uiCopy'
import { useAppContext } from './AppProvider'
import { EventApi } from '../services/api'

type StaffMenuProp = {
  pending: number
  onRegisterMenu: () => void
  onQuestions: () => void
  onDailyMenu: () => void
  onBulkEdit: () => void
  onMenuFix: () => void
  onProcurement: () => void
  onShareLinks: () => void
  onPreviewAsCustomer: () => void
} | null

type HistoryDrawerProps = {
  open: boolean
  onClose?: () => void
  restaurantSlug?: string | null
  onNewChat?: () => void
  onSelectThread?: (threadUid: string) => void
  staffMenu?: StaffMenuProp
}

export default function HistoryDrawer({
  open,
  onClose,
  restaurantSlug,
  onNewChat,
  onSelectThread,
  staffMenu,
}: HistoryDrawerProps) {
  const router = useRouter()
  const { language, openMenuList, openPreferences, googleReviewUrl } = useAppContext()
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

        {/* ── スタッフ（owner token がある時だけ。客には一切出ない）── */}
        {staffMenu && (
          <div className="sidebar-section">
            <div
              className="sidebar-section-label"
              style={{
                fontWeight: 700,
                background: 'linear-gradient(90deg, #3B82F6, #06B6D4)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('staffSection', 'Staff')}
            </div>
            <button className="sidebar-row" onClick={() => { staffMenu.onRegisterMenu(); onClose?.(); }}>
              <Camera size={16} strokeWidth={1.75} />
              <span>{t('staffRegisterMenu', 'Add menu (photo)')}</span>
            </button>
            <button className="sidebar-row" onClick={() => { staffMenu.onQuestions(); onClose?.(); }}>
              <ClipboardCheck size={16} strokeWidth={1.75} />
              <span>{staffMenu.pending > 0 ? `${t('staffAnswerQuestions', 'Answer questions')} (${staffMenu.pending})` : t('staffCheckItems', 'Review checklist')}</span>
            </button>
            <button className="sidebar-row" onClick={() => { staffMenu.onDailyMenu(); onClose?.(); }}>
              <CalendarDays size={16} strokeWidth={1.75} />
              <span>{t('staffTodayMenu', "Today's menu")}</span>
            </button>
            <button className="sidebar-row" onClick={() => { staffMenu.onBulkEdit(); onClose?.(); }}>
              <MessageSquare size={16} strokeWidth={1.75} />
              <span>{t('staffBulkEdit', 'Fix in bulk (chat)')}</span>
            </button>
            <button className="sidebar-row" onClick={() => { staffMenu.onMenuFix(); onClose?.(); }}>
              <Pencil size={16} strokeWidth={1.75} />
              <span>{t('staffMenuFix', 'Edit menus')}</span>
            </button>
            <button className="sidebar-row" onClick={() => { staffMenu.onProcurement(); onClose?.(); }}>
              <Receipt size={16} strokeWidth={1.75} />
              <span>{t('staffProcurement', 'Scan delivery slip')}</span>
            </button>
            <button className="sidebar-row" onClick={() => { staffMenu.onShareLinks(); onClose?.(); }}>
              <Share2 size={16} strokeWidth={1.75} />
              <span>{t('staffShareLinks', 'Share link')}</span>
            </button>
            <button className="sidebar-row" onClick={() => { staffMenu.onPreviewAsCustomer(); onClose?.(); }}>
              <Eye size={16} strokeWidth={1.75} />
              <span>{t('staffPreviewCustomer', 'Preview as customer')}</span>
            </button>
          </div>
        )}

        {/* ── メニューを見る（一番上の主要動線）── */}
        {inRestaurantContext && (
          <div className="sidebar-section">
            <button className="sidebar-row" onClick={() => { openMenuList(); onClose?.(); }}>
              <UtensilsCrossed size={16} strokeWidth={1.75} />
              <span>{(copy as any).webLanding?.exploreMenu || 'メニュー一覧'}</span>
            </button>
          </div>
        )}

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
                      {new Date(th.updatedAt).toLocaleDateString(language || 'en', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* お気に入り・人気ランキングは利用が少ないため非表示（増えたら再表示） */}

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
            {googleReviewUrl && (
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-row"
                onClick={() => {
                  if (restaurantSlug) {
                    EventApi.log({ restaurant_slug: restaurantSlug, event: 'review', message_uid: null, thread_uid: null, lang: language, source: 'hamburger' } as any)
                  }
                  onClose?.()
                }}
              >
                <Star size={16} strokeWidth={1.75} />
                <span>{t('writeReview', 'クチコミを書く')}</span>
              </a>
            )}
          </div>
        )}

        {/* ── セクション 4: 個人設定 ── */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">{t('sectionPreferences', '個人設定')}</div>
          <button
            className="sidebar-row"
            onClick={() => { openPreferences(); onClose?.(); }}
          >
            <AlertCircle size={16} strokeWidth={1.75} />
            <span>{t('preferencesAllergy', 'アレルギー・食事スタイル')}</span>
          </button>
        </div>

        {/* ── セクション 5: 他 ── */}
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
