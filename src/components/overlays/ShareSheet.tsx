'use client'

import { Link2, MessageCircle, Share2 } from 'lucide-react'
import { useState } from 'react'

type ShareSheetProps = {
  open: boolean
  onClose: () => void
  shareText?: string
  shareUrl?: string
}

export default function ShareSheet({ open, onClose, shareText, shareUrl }: ShareSheetProps) {
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const text = shareText || ''
  const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '')

  const handleShare = async (target: string) => {
    if (target === 'copy') {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`)
        setCopied(true)
        setTimeout(() => { setCopied(false); onClose() }, 1200)
      } catch { /* ignore */ }
      return
    }

    if (target === 'native' && navigator.share) {
      try {
        await navigator.share({ text, url })
        onClose()
      } catch { /* cancelled */ }
      return
    }

    const encoded = encodeURIComponent(`${text}\n${url}`)
    let shareLink = ''
    if (target === 'line') shareLink = `https://line.me/R/share?text=${encoded}`
    else if (target === 'x') shareLink = `https://twitter.com/intent/tweet?text=${encoded}`

    if (shareLink) window.open(shareLink, '_blank')
    onClose()
  }

  return (
    <>
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet share-sheet">
        <div className="bottom-sheet-handle" />
        <div className="share-grid">
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button className="share-item" onClick={() => handleShare('native')}>
              <Share2 size={22} />
              <span>シェア</span>
            </button>
          )}
          <button className="share-item" onClick={() => handleShare('line')}>
            <MessageCircle size={22} />
            <span>LINE</span>
          </button>
          <button className="share-item" onClick={() => handleShare('x')}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>𝕏</span>
            <span>X</span>
          </button>
          <button className="share-item" onClick={() => handleShare('copy')}>
            <Link2 size={22} />
            <span>{copied ? 'コピー済み' : 'コピー'}</span>
          </button>
        </div>
      </div>
    </>
  )
}
