'use client'

// スタッフモードのリンク共有。
// お客様用(QR+URL)を常連客や卓上QRに、スタッフ招待(URL+パスコード)を別スタッフに。
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { OwnerChatApi } from '../services/api'
import { renderStyledQR } from '../utils/qrCode'

type StaffShareModalProps = {
  open: boolean
  onClose: () => void
  sessionToken: string
}

export default function StaffShareModal({ open, onClose, sessionToken }: StaffShareModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [customerUrl, setCustomerUrl] = useState('')
  const [staffUrl, setStaffUrl] = useState('')
  const [passcode, setPasscode] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(false)
    OwnerChatApi.share(sessionToken)
      .then(async (d) => {
        setCustomerUrl(d.customer_url)
        setStaffUrl(d.staff_url)
        setPasscode(d.passcode)
        try { setQrDataUrl(await renderStyledQR(d.customer_url)) } catch { /* QR失敗でもURLは出す */ }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [open, sessionToken])

  if (!open) return null

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const shareCustomer = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ url: customerUrl }) } catch { /* キャンセルは無視 */ }
    } else {
      copy(customerUrl, 'customer')
    }
  }

  const staffLineMsg = `スタッフモードのご案内\n\nURL: ${staffUrl}\nパスコード: ${passcode}\n\n上のURLを開いてパスコードを入力するとスタッフモードに入れます。`

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  }
  const panel: React.CSSProperties = {
    background: 'var(--bg-surface, #1E293B)', borderRadius: 14, padding: 20,
    width: 380, maxWidth: '100%', maxHeight: '90dvh', overflowY: 'auto',
    border: '1px solid var(--border, #334155)', color: 'var(--text, #fff)',
  }
  const sectionLabel: React.CSSProperties = { fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text, #fff)' }
  const urlBox: React.CSSProperties = { fontSize: 12, wordBreak: 'break-all', color: '#60A5FA', flex: 1 }
  const copyBtn: React.CSSProperties = {
    padding: '4px 10px', background: '#334155', color: '#fff', border: 'none',
    borderRadius: 6, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>リンクを共有</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: 24, color: 'var(--muted, #94A3B8)' }}>読み込み中…</p>
        ) : error ? (
          <p style={{ textAlign: 'center', padding: 24, color: '#F87171' }}>取得に失敗しました。もう一度お試しください。</p>
        ) : (
          <>
            {/* お客様用 */}
            <div style={{ background: 'var(--bg-input, #0F172A)', borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <div style={sectionLabel}>お客様用（常連客・卓上QR）</div>
              {qrDataUrl && (
                <img src={qrDataUrl} alt="お客様用QR" style={{ width: 180, height: 180, display: 'block', margin: '0 auto 12px', borderRadius: 8 }} />
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <code style={urlBox}>{customerUrl}</code>
                <button style={copyBtn} onClick={() => copy(customerUrl, 'customer')}>{copied === 'customer' ? '✓' : 'コピー'}</button>
              </div>
              <button
                onClick={shareCustomer}
                style={{ width: '100%', padding: '10px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                共有する
              </button>
            </div>

            {/* スタッフ招待 */}
            <div style={{ background: 'var(--bg-input, #0F172A)', borderRadius: 10, padding: 16 }}>
              <div style={sectionLabel}>スタッフを招待</div>
              <label style={{ fontSize: 11, color: 'var(--muted, #94A3B8)', display: 'block', marginBottom: 4 }}>URL</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <code style={urlBox}>{staffUrl}</code>
                <button style={copyBtn} onClick={() => copy(staffUrl, 'staff')}>{copied === 'staff' ? '✓' : 'コピー'}</button>
              </div>
              <label style={{ fontSize: 11, color: 'var(--muted, #94A3B8)', display: 'block', marginBottom: 4 }}>パスコード（全スタッフ共通）</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <code style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4 }}>{passcode}</code>
                <button style={copyBtn} onClick={() => copy(passcode, 'pass')}>{copied === 'pass' ? '✓' : 'コピー'}</button>
              </div>
              <button
                onClick={() => copy(staffLineMsg, 'msg')}
                style={{ width: '100%', padding: '10px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                {copied === 'msg' ? 'コピーしました' : 'LINE送信用テキストをコピー'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
