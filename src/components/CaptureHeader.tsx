import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Menu, X, MapPin, Clock, Phone, Instagram, ExternalLink, Sun, Moon, SquarePen, Globe, Share2, CalendarCheck } from 'lucide-react'
import { getUiCopy } from '../i18n/uiCopy'
import { useAppContext } from './AppProvider'

const LANG_BADGES: Record<string, string> = {
  ja: 'JP', en: 'US', 'zh-Hans': 'CN', 'zh-Hant': 'TW',
  ko: 'KR', es: 'ES', fr: 'FR', de: 'DE', it: 'IT',
  pt: 'PT', ru: 'RU', th: 'TH', vi: 'VN', id: 'ID',
  ms: 'MY', ar: 'SA', hi: 'IN', tr: 'TR', bn: 'BD',
  my: 'MM', tl: 'PH', lo: 'LA', km: 'KH', ne: 'NP',
  mn: 'MN', fa: 'IR', uk: 'UA', pl: 'PL',
}

interface RestaurantInfo {
  name?: string
  address?: string | null
  city?: string | null
  phone_number?: string | null
  opening_hours?: string | null
  holidays?: string | null
  access_info?: string | null
  budget?: string | null
  instagram_url?: string | null
  business_type?: string | null
  reservation_url?: string | null
}

interface CaptureHeaderProps {
  onMenu: () => void
  onLanguage: () => void
  onNewChat?: () => void
  restaurantName?: string | null
  restaurantData?: RestaurantInfo | null
}

// 住所から Google Maps URL を構築する utility (空白のみ等の境界ケースも safe)
const getGoogleMapsUrl = (address: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`

export default function CaptureHeader({ onMenu, onLanguage, onNewChat, restaurantName, restaurantData }: CaptureHeaderProps) {
  const router = useRouter()
  const { language, theme, toggleTheme } = useAppContext()
  const copy = getUiCopy(language)
  const badge = LANG_BADGES[language] || language.slice(0, 2).toUpperCase()
  const [showInfo, setShowInfo] = useState(false)
  const [shareToast, setShareToast] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const isJa = language === 'ja'
  const toastTimerRef = useRef<number | null>(null)
  // drag-to-close 防止: backdrop で pointerdown 起点した時のみ close する
  const backdropPointerDownRef = useRef(false)
  // restaurantData の最新値を listener から参照する用 (race condition 防止)
  const restaurantDataRef = useRef(restaurantData)
  // focus restoration: 開く前の active element を覚えておく
  const triggerRef = useRef<HTMLElement | null>(null)
  // panel への ref (open 時に内部 focus 移動するため)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // SSR ガード: createPortal は document.body が必要
  useEffect(() => { setMounted(true) }, [])

  // restaurantData の最新値を ref に同期 (listener の stale closure 回避)
  useEffect(() => { restaurantDataRef.current = restaurantData }, [restaurantData])

  // HistoryDrawer の「店舗情報」ボタンから dispatch されるカスタムイベントで開く
  // race condition fix: restaurantData が null の間は open しない
  useEffect(() => {
    const handler = () => {
      if (restaurantDataRef.current) {
        setShowInfo(true)
      }
    }
    window.addEventListener('omiseai:open-store-info', handler)
    return () => window.removeEventListener('omiseai:open-store-info', handler)
  }, [])

  // unmount 時に shareToast の setTimeout を必ずクリア (React state-on-unmounted 警告防止)
  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current)
        toastTimerRef.current = null
      }
    }
  }, [])

  // モーダル open 中の副作用: ESC で閉じる / body scroll lock / focus 管理
  useEffect(() => {
    if (!showInfo) return
    // 1. ESC キーで閉じる
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowInfo(false)
    }
    window.addEventListener('keydown', onKey)
    // 2. body scroll lock (背景の scroll chaining 防止)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // 3. focus: 開く前の active element を保存して、 panel 内 close ボタンに移動
    triggerRef.current = (document.activeElement as HTMLElement | null) ?? null
    const rafId = window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>('.store-info-close')?.focus()
    })
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      window.cancelAnimationFrame(rafId)
      // close 時に元の trigger に focus を返す
      const trigger = triggerRef.current
      triggerRef.current = null
      if (trigger && typeof trigger.focus === 'function') {
        trigger.focus()
      }
    }
  }, [showInfo])

  const showToast = (message: string, ms = 1800) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current)
    }
    setShareToast(message)
    toastTimerRef.current = window.setTimeout(() => {
      setShareToast(null)
      toastTimerRef.current = null
    }, ms)
  }

  const handleShare = async () => {
    if (!restaurantData) return
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = restaurantData.name || 'OMISEAI'
    const text = isJa
      ? `${title} — AI で何でも聞ける店舗ガイド`
      : `${title} — Ask the AI guide anything`
    try {
      if (typeof navigator !== 'undefined' && typeof (navigator as Navigator).share === 'function') {
        await (navigator as Navigator).share({ title, text, url })
        return
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        showToast(isJa ? 'リンクをコピーしました' : 'Link copied')
        return
      }
      // share も clipboard も無い古いブラウザ (in-app webview 等): fallback prompt
      if (typeof window !== 'undefined') {
        window.prompt(isJa ? 'URL を手動でコピーしてください' : 'Copy this URL manually', url)
      }
    } catch {
      // ユーザーが share シートをキャンセルしたケースは無視
    }
  }

  // モーダル本体 (createPortal で document.body 直下に出す)
  const modal = showInfo && restaurantData ? (
    <>
      <div
        className="store-info-backdrop"
        aria-hidden="true"
        onPointerDown={() => { backdropPointerDownRef.current = true }}
        onPointerUp={() => {
          if (backdropPointerDownRef.current) {
            setShowInfo(false)
          }
          backdropPointerDownRef.current = false
        }}
        onPointerCancel={() => { backdropPointerDownRef.current = false }}
      />
      <div
        ref={panelRef}
        className="store-info-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-info-title"
      >
        <div className="store-info-header">
          <span id="store-info-title" className="store-info-title">{restaurantData.name}</span>
          <button className="store-info-close" type="button" onClick={() => setShowInfo(false)} aria-label={isJa ? '閉じる' : 'Close'}>
            <X size={16} />
          </button>
        </div>
        {restaurantData.business_type && (
          <span className="store-info-type">{restaurantData.business_type}</span>
        )}
        <div className="store-info-rows">
          {restaurantData.address && (
            <div className="store-info-row">
              <MapPin size={14} />
              <span>{restaurantData.address}</span>
              <a
                href={getGoogleMapsUrl(restaurantData.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="store-info-map-link"
              >
                <ExternalLink size={12} />
                {copy.captureHeader.map}
              </a>
            </div>
          )}
          {restaurantData.access_info && (
            <div className="store-info-row store-info-sub">
              <span>{restaurantData.access_info}</span>
            </div>
          )}
          {restaurantData.opening_hours && (
            <div className="store-info-row">
              <Clock size={14} />
              <span>{restaurantData.opening_hours}</span>
            </div>
          )}
          {restaurantData.holidays && (
            <div className="store-info-row store-info-sub">
              <span>{isJa ? '定休日: ' : 'Closed: '}{restaurantData.holidays}</span>
            </div>
          )}
          {restaurantData.phone_number && (
            <div className="store-info-row">
              <Phone size={14} />
              <a href={`tel:${restaurantData.phone_number}`} className="store-info-link">{restaurantData.phone_number}</a>
            </div>
          )}
          {restaurantData.instagram_url && (
            <div className="store-info-row">
              <Instagram size={14} />
              <a href={restaurantData.instagram_url} target="_blank" rel="noopener noreferrer" className="store-info-link">Instagram</a>
            </div>
          )}
          {restaurantData.budget && (
            <div className="store-info-row">
              <span className="store-info-budget">{isJa ? '予算' : 'Budget'}: ~{restaurantData.budget}{isJa ? '円' : '??'}</span>
            </div>
          )}
        </div>

        {/* ── Quick actions: 予約 / Map / 電話 / 共有 ── */}
        <div className="store-info-actions">
          {restaurantData.reservation_url && (
            <a
              className="store-info-action"
              href={restaurantData.reservation_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <CalendarCheck size={16} strokeWidth={1.75} />
              <span>{isJa ? '予約' : 'Reserve'}</span>
            </a>
          )}
          {restaurantData.address && (
            <a
              className="store-info-action"
              href={getGoogleMapsUrl(restaurantData.address)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={16} strokeWidth={1.75} />
              <span>{copy.captureHeader.map}</span>
            </a>
          )}
          {restaurantData.phone_number && (
            <a
              className="store-info-action"
              href={`tel:${restaurantData.phone_number}`}
            >
              <Phone size={16} strokeWidth={1.75} />
              <span>{isJa ? '電話' : 'Call'}</span>
            </a>
          )}
          <button
            type="button"
            className="store-info-action"
            onClick={handleShare}
          >
            <Share2 size={16} strokeWidth={1.75} />
            <span>{isJa ? '共有' : 'Share'}</span>
          </button>
        </div>
      </div>
      {shareToast && (
        <div className="store-info-toast" role="status">{shareToast}</div>
      )}
    </>
  ) : null

  return (
    <>
      <header className="capture-header sticky">
        <div className="capture-header-left">
          <button className="icon-button" type="button" aria-label={copy.captureHeader.menu} onClick={onMenu}>
            <Menu size={22} strokeWidth={1.75} color="currentColor" />
          </button>
          {onNewChat && (
            <button
              className="icon-button"
              type="button"
              aria-label={(copy.history as any).newChat || 'New chat'}
              title={(copy.history as any).newChat || 'New chat'}
              onClick={onNewChat}
            >
              <SquarePen size={20} strokeWidth={1.75} color="currentColor" />
            </button>
          )}
        </div>
        <div className="capture-header-center">
          {restaurantName ? (
            <span className="capture-header-name">{restaurantName}</span>
          ) : (
            <span className="capture-header-name">NGraph</span>
          )}
        </div>
        <div className="capture-header-actions">
          <button className="icon-button" type="button" aria-label="Toggle theme" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} strokeWidth={1.75} color="currentColor" /> : <Moon size={18} strokeWidth={1.75} color="currentColor" />}
          </button>
          <button
            className="header-lang-badge"
            type="button"
            onClick={onLanguage}
            aria-label="Change language"
            title="Change language"
          >
            <Globe size={14} strokeWidth={1.75} />
            <span>{badge}</span>
          </button>
        </div>
      </header>
      {mounted && modal && createPortal(modal, document.body)}
    </>
  )
}
