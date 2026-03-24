'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api'

async function uploadAuth(token: string, passcode: string) {
  const res = await fetch(`${API}/owner-upload/${token}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Authentication failed')
  }
  return res.json()
}

async function uploadPhoto(token: string, sessionToken: string, file: File) {
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`${API}/owner-upload/${token}/photo`, {
    method: 'POST',
    headers: { 'X-Survey-Token': sessionToken },
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}

function Logo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb', letterSpacing: -1 }}>
        NGraph
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>メニュー収集</div>
    </div>
  )
}

function UploadContent() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') || ''
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.body.style.background = '#f8fafc'
  }, [])

  const [step, setStep] = useState<'passcode' | 'upload' | 'done'>('passcode')
  const [sessionToken, setSessionToken] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [photoCount, setPhotoCount] = useState(0)
  const [uploading, setUploading] = useState(false)

  const [passcode, setPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePasscodeSubmit = async () => {
    if (!passcode.trim()) return
    setLoading(true)
    setPasscodeError('')
    try {
      const data = await uploadAuth(token, passcode.trim())
      setSessionToken(data.session_token)
      setRestaurantName(data.restaurant_name)
      setStep('upload')
    } catch (e: unknown) {
      setPasscodeError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const result = await uploadPhoto(token, sessionToken, files[i])
        setPhotoCount(result.photo_count)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'アップロードに失敗しました')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: 480, margin: '0 auto', padding: '24px 16px',
    minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    background: '#f8fafc',
  }
  const cardStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 12, padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 16,
  }
  const btnPrimary: React.CSSProperties = {
    width: '100%', padding: '14px 0', background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 16, boxSizing: 'border-box',
  }

  const fileInput = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </>
  )

  if (!token) {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, marginTop: 60, textAlign: 'center' }}>
          <Logo />
          <p style={{ color: '#dc2626' }}>無効なURLです</p>
        </div>
      </div>
    )
  }

  if (step === 'passcode') {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, marginTop: 60 }}>
          <Logo />
          <p style={{ textAlign: 'center', color: '#475569', marginBottom: 24, fontSize: 14 }}>
            パスコードを入力してください
          </p>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="パスコード"
            value={passcode}
            onChange={e => setPasscode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && handlePasscodeSubmit()}
            style={{ ...inputStyle, textAlign: 'center', fontSize: 24, letterSpacing: 8, marginBottom: 16 }}
            autoFocus
          />
          {passcodeError && (
            <p style={{ color: '#dc2626', fontSize: 14, textAlign: 'center', margin: '0 0 12px' }}>
              {passcodeError}
            </p>
          )}
          <button
            onClick={handlePasscodeSubmit}
            disabled={loading || !passcode}
            style={{ ...btnPrimary, opacity: loading || !passcode ? 0.6 : 1 }}
          >
            {loading ? '確認中...' : '確認する'}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, marginTop: 60, textAlign: 'center' }}>
          <Logo />
          <div style={{ fontSize: 48, marginBottom: 16, color: '#16a34a' }}>&#10003;</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>ありがとうございました</h2>
          <p style={{ color: '#475569', marginBottom: 4 }}>
            {restaurantName}
          </p>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {photoCount}枚の写真を受け付けました。AIが自動でメニューを登録します。
          </p>
        </div>
      </div>
    )
  }

  // Upload step
  return (
    <div style={containerStyle}>
      {fileInput}
      <Logo />
      <p style={{ textAlign: 'center', fontWeight: 600, fontSize: 16, marginBottom: 24, color: '#1e293b' }}>
        {restaurantName}
      </p>

      <div style={cardStyle}>
        <div style={{ textAlign: 'center' }}>
          {uploading ? (
            <>
              <div style={{
                width: 40, height: 40, border: '3px solid #e2e8f0',
                borderTopColor: '#2563eb', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <p style={{ color: '#64748b', fontSize: 14 }}>アップロード中...</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 16, color: '#94a3b8' }}>&#128194;</div>
              <p style={{ color: '#475569', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
                メニュー表の画像をアップロードしてください。
                <br />複数枚まとめて選択できます。
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={btnPrimary}
              >
                ファイルから選ぶ
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  width: '100%', padding: '14px 0', background: 'transparent', color: '#2563eb',
                  border: '1px solid #2563eb', borderRadius: 8, fontSize: 16, fontWeight: 600,
                  cursor: 'pointer', marginTop: 10,
                }}
              >
                カメラで撮影
              </button>
            </>
          )}
        </div>
      </div>

      {photoCount > 0 && (
        <>
          <div style={{
            background: '#ecfdf5', borderRadius: 12, padding: 16,
            textAlign: 'center', marginBottom: 16, border: '1px solid #a7f3d0',
          }}>
            <p style={{ color: '#16a34a', fontWeight: 600, fontSize: 15 }}>
              {photoCount}枚アップロード済み
            </p>
          </div>
          <button
            onClick={() => setStep('done')}
            style={{
              ...btnPrimary, background: '#16a34a',
            }}
          >
            完了する
          </button>
        </>
      )}
    </div>
  )
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ color: '#64748b' }}>読み込み中...</div>
      </div>
    }>
      <UploadContent />
    </Suspense>
  )
}
