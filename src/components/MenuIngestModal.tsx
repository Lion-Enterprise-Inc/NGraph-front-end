'use client'

// スタッフモードのメニュー登録。元の /upload と同じ撮影UI(input capture + ファイル選択)。
// 送信先だけ owner-chat セッションに統一。解析は非同期(既存パイプライン流用)。
import { useRef, useState } from 'react'
import { X, FolderOpen, Camera } from 'lucide-react'
import { OwnerChatApi } from '../services/api'

type MenuIngestModalProps = {
  open: boolean
  onClose: () => void
  sessionToken: string
  onOpenMenuList: () => void
}

export default function MenuIngestModal({ open, onClose, sessionToken, onOpenMenuList }: MenuIngestModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const [sentCount, setSentCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    setError(null)
    let ok = 0
    for (let i = 0; i < files.length; i++) {
      try {
        await OwnerChatApi.ingestMenuPhoto(sessionToken, files[i])
        ok++
        setSentCount((c) => c + 1)
      } catch {
        setError('一部の写真の送信に失敗しました。電波状況をご確認ください。')
      }
    }
    setBusy(false)
    if (ok === 0) setError('送信に失敗しました。もう一度お試しください。')
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  }
  const panel: React.CSSProperties = {
    background: 'var(--bg-surface, #1E293B)', borderRadius: 14, padding: 22,
    width: 380, maxWidth: '100%', maxHeight: '90dvh', overflowY: 'auto',
    border: '1px solid var(--border, #334155)', color: 'var(--text, #fff)',
  }
  const btnPrimary: React.CSSProperties = {
    width: '100%', padding: '13px 0', background: '#3B82F6', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }
  const btnGhost: React.CSSProperties = {
    width: '100%', padding: '13px 0', background: 'transparent', color: '#60A5FA',
    border: '1px solid #3B82F6', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer',
    marginTop: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>メニューを登録</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted, #94A3B8)', marginBottom: 16, lineHeight: 1.6 }}>
          メニュー表の写真を撮るか選ぶと、AIが読み取って登録します。複数枚まとめてもOK。
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
          style={{ display: 'none' }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
          style={{ display: 'none' }}
        />

        <button style={btnPrimary} disabled={busy} onClick={() => cameraInputRef.current?.click()}>
          <Camera size={18} /> カメラで撮影
        </button>
        <button style={btnGhost} disabled={busy} onClick={() => fileInputRef.current?.click()}>
          <FolderOpen size={18} /> 写真を選ぶ
        </button>

        {busy && (
          <p style={{ fontSize: 13, color: 'var(--muted, #94A3B8)', textAlign: 'center', marginTop: 16 }}>送信中…</p>
        )}
        {error && (
          <p style={{ fontSize: 13, color: '#F87171', textAlign: 'center', marginTop: 14 }}>{error}</p>
        )}
        {sentCount > 0 && !busy && (
          <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-input, #0F172A)', borderRadius: 10, textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{sentCount}枚 送信しました</p>
            <p style={{ fontSize: 12, color: 'var(--muted, #94A3B8)', marginBottom: 12 }}>
              AIが読み取り中です。数十秒後にメニュー一覧で確認できます。
            </p>
            <button
              onClick={() => { onClose(); onOpenMenuList() }}
              style={{ ...btnGhost, marginTop: 0 }}
            >
              メニュー一覧を見る
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
