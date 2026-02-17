'use client'

import { X, Plus, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useChatHistory } from '../hooks/useChatHistory'

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
  const { threads } = useChatHistory(restaurantSlug ?? null)

  return (
    <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose}>
      <aside
        className={`drawer-panel${open ? ' open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sidebar-top">
          <span className="sidebar-title">履歴</span>
          <button className="icon-button" type="button" onClick={onClose}>
            <X size={20} strokeWidth={1.75} color="rgba(255,255,255,0.6)" />
          </button>
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
          <button
            className="sidebar-hub-btn"
            onClick={() => { router.push('/'); onClose?.(); }}
          >
            <ArrowRight size={14} strokeWidth={2} />
            他のお店を見る
          </button>
          <div className="sidebar-powered">Powered by NGraph</div>
        </div>
      </aside>
    </div>
  )
}
