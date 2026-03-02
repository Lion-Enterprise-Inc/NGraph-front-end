'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api'

interface UploadItem {
  uid: string
  raw_data: Record<string, unknown>
  edited_data: Record<string, unknown> | null
  image_url: string | null
  status: string
  menu_uid: string | null
  created_at: string
}

// --- API helpers ---
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

async function analyzeImage(token: string, sessionToken: string, file: File) {
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`${API}/owner-upload/${token}/analyze`, {
    method: 'POST',
    headers: { 'X-Survey-Token': sessionToken },
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Analysis failed')
  }
  return res.json()
}

async function editItem(
  token: string,
  sessionToken: string,
  itemUid: string,
  body: { edited_data?: Record<string, unknown>; status?: string }
) {
  const res = await fetch(`${API}/owner-upload/${token}/items/${itemUid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Survey-Token': sessionToken },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to edit item')
  return res.json()
}

async function fetchItems(token: string, sessionToken: string) {
  const res = await fetch(`${API}/owner-upload/${token}/items`, {
    headers: { 'X-Survey-Token': sessionToken },
  })
  if (!res.ok) throw new Error('Failed to fetch items')
  return res.json()
}

async function saveItems(token: string, sessionToken: string) {
  const res = await fetch(`${API}/owner-upload/${token}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Survey-Token': sessionToken },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Save failed')
  }
  return res.json()
}

// --- Components ---
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

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40 }}>
      <div style={{
        width: 40, height: 40, border: '3px solid #e2e8f0',
        borderTopColor: '#2563eb', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ color: '#64748b', fontSize: 14 }}>AI解析中...</p>
    </div>
  )
}

function MenuItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: UploadItem
  onEdit: (uid: string, field: string, value: string) => void
  onDelete: (uid: string) => void
}) {
  const data = (item.edited_data || item.raw_data) as Record<string, unknown>
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEdit = (field: string) => {
    setEditing(field)
    setEditValue(String(data[field] || ''))
  }

  const confirmEdit = () => {
    if (editing) {
      onEdit(item.uid, editing, editValue)
      setEditing(null)
    }
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 12,
      border: item.status === 'deleted' ? '1px solid #fca5a5' : '1px solid #e2e8f0',
      opacity: item.status === 'deleted' ? 0.5 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {/* Name */}
          {editing === 'name_jp' ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                style={{ flex: 1, padding: '6px 10px', border: '1px solid #2563eb', borderRadius: 6, fontSize: 15 }}
                autoFocus
              />
              <button onClick={confirmEdit} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13 }}>OK</button>
            </div>
          ) : (
            <p
              onClick={() => item.status !== 'deleted' && startEdit('name_jp')}
              style={{ fontWeight: 600, fontSize: 16, margin: '0 0 4px', cursor: 'pointer' }}
            >
              {String(data.name_jp || '不明')}
            </p>
          )}

          {/* Price */}
          {editing === 'price' ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="number"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                style={{ width: 100, padding: '6px 10px', border: '1px solid #2563eb', borderRadius: 6, fontSize: 14 }}
                autoFocus
              />
              <span style={{ lineHeight: '34px', color: '#64748b' }}>円</span>
              <button onClick={confirmEdit} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13 }}>OK</button>
            </div>
          ) : (
            <p
              onClick={() => item.status !== 'deleted' && startEdit('price')}
              style={{ fontSize: 14, color: '#475569', margin: '0 0 4px', cursor: 'pointer' }}
            >
              {data.price ? `¥${Number(data.price).toLocaleString()}` : '価格不明'}
            </p>
          )}

          {/* Category & Description */}
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
            {String(data.category || '')}
            {data.description ? ` — ${String(data.description).slice(0, 40)}` : ''}
          </p>

          {/* Ingredients */}
          {Array.isArray(data.ingredients) && data.ingredients.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {(data.ingredients as string[]).slice(0, 6).map((ing, i) => (
                <span key={i} style={{
                  padding: '2px 8px', background: '#f1f5f9', borderRadius: 12,
                  fontSize: 11, color: '#475569',
                }}>{ing}</span>
              ))}
              {(data.ingredients as string[]).length > 6 && (
                <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: '22px' }}>
                  +{(data.ingredients as string[]).length - 6}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Delete button */}
        {item.status !== 'deleted' && (
          <button
            onClick={() => onDelete(item.uid)}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '1px solid #e2e8f0', background: '#fff',
              color: '#94a3b8', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginLeft: 8,
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

function UploadContent() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') || ''
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.documentElement.style.overflow = 'auto'
    document.documentElement.style.height = 'auto'
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.body.style.background = '#f8fafc'
    const root = document.getElementById('root')
    if (root) { root.style.overflow = 'auto'; root.style.height = 'auto' }
  }, [])

  const [step, setStep] = useState<'passcode' | 'upload' | 'review' | 'done'>('passcode')
  const [sessionToken, setSessionToken] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantSlug, setRestaurantSlug] = useState('')
  const [items, setItems] = useState<UploadItem[]>([])
  const [savedCount, setSavedCount] = useState(0)

  // Passcode
  const [passcode, setPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)

  // --- Passcode ---
  const handlePasscodeSubmit = async () => {
    if (!passcode.trim()) return
    setLoading(true)
    setPasscodeError('')
    try {
      const data = await uploadAuth(token, passcode.trim())
      setSessionToken(data.session_token)
      setRestaurantName(data.restaurant_name)
      setRestaurantSlug(data.restaurant_slug)

      // Check for existing items (resume)
      const existing = await fetchItems(token, data.session_token)
      if (existing.items && existing.items.length > 0) {
        setItems(existing.items)
        setStep('review')
      } else {
        setStep('upload')
      }
    } catch (e: unknown) {
      setPasscodeError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // --- Upload ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAnalyzing(true)
    try {
      const result = await analyzeImage(token, sessionToken, file)
      const newItems = result.items || []
      setItems(prev => [...prev, ...newItems])
      setStep('review')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '解析に失敗しました')
    } finally {
      setAnalyzing(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // --- Edit item ---
  const handleEdit = async (uid: string, field: string, value: string) => {
    const item = items.find(i => i.uid === uid)
    if (!item) return
    const currentData = { ...(item.edited_data || item.raw_data) }
    if (field === 'price') {
      currentData[field] = parseInt(value) || 0
    } else {
      currentData[field] = value
    }
    try {
      await editItem(token, sessionToken, uid, { edited_data: currentData })
      setItems(prev => prev.map(i => i.uid === uid ? { ...i, edited_data: currentData } : i))
    } catch {
      alert('編集に失敗しました')
    }
  }

  // --- Delete item ---
  const handleDelete = async (uid: string) => {
    try {
      await editItem(token, sessionToken, uid, { status: 'deleted' })
      setItems(prev => prev.map(i => i.uid === uid ? { ...i, status: 'deleted' } : i))
    } catch {
      alert('削除に失敗しました')
    }
  }

  // --- Save ---
  const handleSave = async () => {
    const activeItems = items.filter(i => i.status !== 'deleted')
    if (activeItems.length === 0) {
      alert('保存するメニューがありません')
      return
    }
    setSaving(true)
    try {
      const result = await saveItems(token, sessionToken)
      setSavedCount(result.saved_count)
      setStep('done')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // --- Add more photos ---
  const handleAddMore = () => {
    fileInputRef.current?.click()
  }

  // --- Back to upload from done ---
  const handleContinue = () => {
    setItems([])
    setStep('upload')
  }

  // Styles
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
    border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600,
    cursor: 'pointer',
  }
  const btnSuccess: React.CSSProperties = {
    ...btnPrimary, background: '#16a34a',
  }
  const btnGhost: React.CSSProperties = {
    ...btnPrimary, background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 16, boxSizing: 'border-box',
  }

  // Hidden file input (shared)
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      onChange={handleFileSelect}
      style={{ display: 'none' }}
    />
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

  // --- STEP 1: Passcode ---
  if (step === 'passcode') {
    return (
      <div style={containerStyle}>
        {fileInput}
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

  // --- STEP 2: Upload ---
  if (step === 'upload') {
    return (
      <div style={containerStyle}>
        {fileInput}
        <Logo />
        <p style={{ textAlign: 'center', fontWeight: 600, fontSize: 16, marginBottom: 24, color: '#1e293b' }}>
          {restaurantName}
        </p>

        {analyzing ? (
          <div style={cardStyle}>
            <Spinner />
          </div>
        ) : (
          <div style={cardStyle}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16, color: '#94a3b8' }}>&#128247;</div>
              <p style={{ color: '#475569', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
                メニュー表の写真を撮影またはアルバムから選んでください。
                <br />AIが自動でメニューを読み取ります。
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={btnPrimary}
              >
                写真を撮る / 選ぶ
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // --- STEP 4: Done ---
  if (step === 'done') {
    return (
      <div style={containerStyle}>
        {fileInput}
        <div style={{ ...cardStyle, marginTop: 60, textAlign: 'center' }}>
          <Logo />
          <div style={{ fontSize: 48, marginBottom: 16, color: '#16a34a' }}>&#10003;</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>ありがとうございました</h2>
          <p style={{ color: '#475569', marginBottom: 8 }}>
            {restaurantName} のメニューを{savedCount}件登録しました。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
            <button onClick={handleContinue} style={btnPrimary}>
              追加でアップロード
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- STEP 3: Review ---
  const activeItems = items.filter(i => i.status !== 'deleted')
  const deletedCount = items.filter(i => i.status === 'deleted').length

  return (
    <div style={containerStyle}>
      {fileInput}
      <Logo />
      <p style={{ textAlign: 'center', fontWeight: 600, fontSize: 16, marginBottom: 4, color: '#1e293b' }}>
        {restaurantName}
      </p>
      <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginBottom: 16 }}>
        {activeItems.length}件のメニュー
        {deletedCount > 0 && `（${deletedCount}件削除）`}
      </p>

      {/* Analyzing overlay */}
      {analyzing && <Spinner />}

      {/* Item list */}
      {items.filter(i => i.status !== 'deleted').map(item => (
        <MenuItemCard
          key={item.uid}
          item={item}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, paddingBottom: 40 }}>
        <button onClick={handleAddMore} disabled={analyzing} style={btnGhost}>
          写真を追加
        </button>
        <button
          onClick={handleSave}
          disabled={saving || activeItems.length === 0}
          style={{ ...btnSuccess, opacity: saving || activeItems.length === 0 ? 0.6 : 1 }}
        >
          {saving ? '保存中...' : `登録する（${activeItems.length}件）`}
        </button>
      </div>
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
