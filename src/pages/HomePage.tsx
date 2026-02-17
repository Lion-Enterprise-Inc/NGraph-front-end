'use client'

import { useRouter } from 'next/navigation'
import { QrCode } from 'lucide-react'
import { useVisitedStores } from '../hooks/useVisitedStores'

export default function HomePage() {
  const router = useRouter()
  const { stores } = useVisitedStores()

  return (
    <div className="hub-page">
      <header className="hub-header">
        <span className="hub-brand">NGraph</span>
      </header>

      {stores.length === 0 ? (
        <div className="hub-empty">
          <div className="hub-empty-icon">
            <QrCode size={48} strokeWidth={1.2} />
          </div>
          <p className="hub-empty-text">お店のQRコードを<br />読み取ってください</p>
        </div>
      ) : (
        <div className="hub-list">
          {stores.map(store => (
            <button
              key={store.slug}
              className="hub-card"
              onClick={() => router.push(`/capture?restaurant=${encodeURIComponent(store.slug)}`)}
            >
              <div className="hub-card-name">{store.name}</div>
              <div className="hub-card-meta">
                <span>{store.threadCount} 会話</span>
                <span>·</span>
                <span>{new Date(store.lastVisited).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
