'use client'

import { X, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useChatHistory } from '../hooks/useChatHistory'
import { getUiCopy } from '../i18n/uiCopy'
import { useAppContext } from './AppProvider'

type HistoryDrawerProps = {
  open: boolean
  onClose?: () => void
  restaurantSlug?: string | null
  onNewChat?: () => void
}

export default function HistoryDrawer({
  open,
  onClose,
  restaurantSlug,
  onNewChat,
}: HistoryDrawerProps) {
  const router = useRouter()
  const { language } = useAppContext()
  const copy = getUiCopy(language)
  const { threads } = useChatHistory(restaurantSlug ?? null)

  const tagline = (copy.history as any).brandTagline
    || "Data infrastructure for authentic food knowledge."

  return (
    <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose}>
      <aside
        className={`drawer-panel${open ? ' open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-left">
            <img src="/ngraph-logo.svg" alt="NGraph" className="sidebar-brand-logo" />
            <div className="sidebar-brand-info">
              <span className="sidebar-brand-name">NGraph</span>
              <span className="sidebar-brand-tagline">{tagline}</span>
            </div>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            <X size={20} strokeWidth={1.75} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        <div className="sidebar-top">
          <span className="sidebar-title">履歴</span>
        </div>

        <button className="sidebar-new-chat" onClick={() => { onNewChat?.(); onClose?.(); }}>
          <Plus size={16} strokeWidth={2} />
          新しい会話
        </button>

        <div className="sidebar-threads">
          {threads.length === 0 ? (
            <p className="sidebar-empty">まだ会話がありません</p>
          ) : (
            threads.map(t => (
              <div key={t.thread_uid} className="sidebar-thread-item">
                <div className="sidebar-thread-title">{t.title || t.preview}</div>
                <div className="sidebar-thread-date">
                  {new Date(t.updatedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-powered">Powered by NGraph</div>
        </div>
      </aside>
    </div>
  )
}
