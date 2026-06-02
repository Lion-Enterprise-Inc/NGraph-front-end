'use client'

import { useEffect } from 'react'

interface AdminErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error('Admin page crashed:', error)
  }, [error])

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg, #0F172A)' }}>
      <div style={{ maxWidth: 480, width: '100%', background: 'var(--bg-surface, #1E293B)', border: '1px solid var(--border, #334155)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #F1F5F9)', margin: '0 0 8px' }}>
          画面の表示でエラーが発生しました
        </h2>
        <p style={{ fontSize: 14, color: 'var(--muted, #94A3B8)', margin: '0 0 16px', lineHeight: 1.7 }}>
          お手数ですが、もう一度お試しください。繰り返し発生する場合は、下のエラー内容をお知らせください。
        </p>
        <pre style={{ fontSize: 12, color: '#FCA5A5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: 12, margin: '0 0 16px', textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 160, overflow: 'auto' }}>
          {error.message || '不明なエラー'}
        </pre>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={reset}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            再試行
          </button>
          <button
            onClick={() => { window.location.href = '/admin' }}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border, #334155)', background: 'transparent', color: 'var(--text, #F1F5F9)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            管理トップへ戻る
          </button>
        </div>
      </div>
    </div>
  )
}
