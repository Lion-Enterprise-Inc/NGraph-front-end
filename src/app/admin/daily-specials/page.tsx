'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { DailyMenuApi, TokenService } from '../../../services/api'
import type { DailyDraftItem, DailyActiveItem } from '../../../services/api'
import { useToast } from '../../../components/admin/Toast'

function resolveRestaurantUid(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const sel = sessionStorage.getItem('selectedStoreUid')
  if (sel) return sel
  const user = TokenService.getUser()
  return user?.restaurants?.[0]?.uid
}

function splitList(value: string): string[] {
  return value
    .split(/[,、]/)
    .map(s => s.trim())
    .filter(Boolean)
}

export default function DailySpecialsPage() {
  const toast = useToast()
  const [restaurantUid, setRestaurantUid] = useState<string | undefined>(undefined)

  const [textInput, setTextInput] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [drafts, setDrafts] = useState<DailyDraftItem[]>([])
  const [confirming, setConfirming] = useState(false)

  const [active, setActive] = useState<DailyActiveItem[]>([])
  const [stock, setStock] = useState<DailyActiveItem[]>([])
  const [selectedStock, setSelectedStock] = useState<string[]>([])
  const [reusing, setReusing] = useState(false)
  const [loadingLists, setLoadingLists] = useState(true)

  const loadLists = useCallback(async (uid?: string) => {
    setLoadingLists(true)
    try {
      const [a, s] = await Promise.all([
        DailyMenuApi.active(uid),
        DailyMenuApi.stock(uid),
      ])
      setActive(a.result.items)
      // ストックは「今アクティブでない」過去品だけ流用候補に出す
      setStock(s.result.items.filter(i => !i.active))
    } catch {
      toast('error', '本日の献立の読み込みに失敗しました')
    } finally {
      setLoadingLists(false)
    }
  }, [toast])

  useEffect(() => {
    const uid = resolveRestaurantUid()
    setRestaurantUid(uid)
    loadLists(uid)
    const handler = () => {
      const next = resolveRestaurantUid()
      setRestaurantUid(next)
      setDrafts([])
      setSelectedStock([])
      loadLists(next)
    }
    window.addEventListener('selectedStoreChanged', handler)
    return () => window.removeEventListener('selectedStoreChanged', handler)
  }, [loadLists])

  const handleExtract = async (input: { image?: File; text?: string }) => {
    setExtracting(true)
    try {
      const resp = await DailyMenuApi.draft(input, restaurantUid)
      setDrafts(resp.result.items)
      if (resp.result.items.length === 0) {
        toast('warning', 'メニューが検出されませんでした')
      } else {
        toast('success', `${resp.result.items.length}品を抽出しました。確認して確定してください`)
      }
    } catch (err) {
      toast('error', err instanceof Error ? err.message : '抽出に失敗しました')
    } finally {
      setExtracting(false)
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleExtract({ image: file })
    e.target.value = ''
  }

  const handleTextExtract = () => {
    if (!textInput.trim()) {
      toast('warning', 'テキストを入力してください')
      return
    }
    handleExtract({ text: textInput.trim() })
  }

  const updateDraft = (idx: number, patch: Partial<DailyDraftItem>) => {
    setDrafts(prev => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  }

  const removeDraft = (idx: number) => {
    setDrafts(prev => prev.filter((_, i) => i !== idx))
  }

  const handleConfirm = async () => {
    if (drafts.length === 0) return
    const missing = drafts.filter(d => !d.name_jp?.trim())
    if (missing.length > 0) {
      toast('warning', '料理名が空の品があります')
      return
    }
    setConfirming(true)
    try {
      const resp = await DailyMenuApi.confirm(drafts, restaurantUid)
      toast('success', `本日の献立 ${resp.result.items_saved}品を確定しました`)
      setDrafts([])
      setTextInput('')
      await loadLists(restaurantUid)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : '確定に失敗しました')
    } finally {
      setConfirming(false)
    }
  }

  const toggleStock = (uid: string) => {
    setSelectedStock(prev =>
      prev.includes(uid) ? prev.filter(u => u !== uid) : [...prev, uid]
    )
  }

  const handleReuse = async () => {
    if (selectedStock.length === 0) return
    setReusing(true)
    try {
      const resp = await DailyMenuApi.reuse(selectedStock, restaurantUid)
      toast('success', `${resp.result.reactivated}品を本日の献立に流用しました`)
      setSelectedStock([])
      await loadLists(restaurantUid)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : '流用に失敗しました')
    } finally {
      setReusing(false)
    }
  }

  const card = {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 12, padding: 20, marginBottom: 16,
  } as const
  const inputStyle = {
    width: '100%', padding: '8px 12px', background: 'var(--bg-input)',
    color: 'var(--text)', border: '1px solid var(--border-strong)',
    borderRadius: 8, fontSize: 14,
  } as const

  return (
    <AdminLayout title="本日の献立">
      {/* Header */}
      <div style={card}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>本日の献立</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.6 }}>
          日替わり・本日のおすすめを登録します。撮る/貼ると AI が読み取り、確認・修正して確定。
          確定すると今日の献立としてお客様に表示され、AI が正しく答えられます。
          差し替えると前の品はストックに残り、翌週そのまま流用できます。
        </p>
      </div>

      {/* 入力 */}
      <div style={card}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>1. 撮る / 貼る</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <label style={{
            padding: '10px 18px', background: '#3B82F6', color: '#fff', borderRadius: 8,
            cursor: extracting ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
            opacity: extracting ? 0.6 : 1,
          }}>
            📷 写真を撮る / 選ぶ
            <input type="file" accept="image/*" capture="environment"
              onChange={handleFile} disabled={extracting}
              style={{ display: 'none' }} />
          </label>
        </div>
        <textarea
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          placeholder="または、本日の献立をテキストで貼り付け（例: 五目焼き 800円 / とば酢の五目 700円 ...）"
          rows={3}
          disabled={extracting}
          style={{ ...inputStyle, resize: 'vertical', marginBottom: 10 }}
        />
        <button onClick={handleTextExtract} disabled={extracting || !textInput.trim()} style={{
          padding: '8px 18px', background: 'transparent', color: '#3B82F6',
          border: '1px solid #3B82F6', borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: extracting || !textInput.trim() ? 'not-allowed' : 'pointer',
          opacity: extracting || !textInput.trim() ? 0.5 : 1,
        }}>
          {extracting ? '読み取り中...' : 'テキストから読み取る'}
        </button>
        {extracting && (
          <div style={{ fontSize: 12, color: '#F59E0B', marginTop: 10 }}>AI が読み取っています...</div>
        )}
      </div>

      {/* ドラフト確認 */}
      {drafts.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>2. 確認・修正 ({drafts.length}品)</h3>
            <button onClick={handleConfirm} disabled={confirming} style={{
              padding: '10px 22px', background: confirming ? '#475569' : '#16A34A', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: confirming ? 'not-allowed' : 'pointer',
            }}>
              {confirming ? '確定中...' : 'この内容で確定'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {drafts.map((d, idx) => (
              <div key={idx} style={{
                background: 'var(--bg-input)', borderRadius: 10, padding: 16,
                border: (d.clarification_needed?.length ?? 0) > 0
                  ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <input value={d.name_jp || ''} placeholder="料理名"
                    onChange={e => updateDraft(idx, { name_jp: e.target.value })}
                    style={{ ...inputStyle, flex: 2 }} />
                  <input type="number" value={d.price || 0} placeholder="価格"
                    onChange={e => updateDraft(idx, { price: Number(e.target.value) })}
                    style={{ ...inputStyle, flex: 1 }} />
                  <input value={d.category || ''} placeholder="カテゴリ"
                    onChange={e => updateDraft(idx, { category: e.target.value })}
                    style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => removeDraft(idx)} style={{
                    padding: '0 12px', background: 'transparent', color: 'var(--error)',
                    border: '1px solid var(--border-strong)', borderRadius: 8, cursor: 'pointer', fontSize: 18,
                  }} title="削除">×</button>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <input value={(d.ingredients || []).join('、')} placeholder="材料（、区切り）"
                    onChange={e => updateDraft(idx, { ingredients: splitList(e.target.value) })}
                    style={{ ...inputStyle, flex: 1 }} />
                  <input value={(d.allergens || []).join('、')} placeholder="アレルゲン（、区切り）"
                    onChange={e => updateDraft(idx, { allergens: splitList(e.target.value) })}
                    style={{ ...inputStyle, flex: 1 }} />
                </div>
                {(d.clarification_needed?.length ?? 0) > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {d.clarification_needed!.map((q, qi) => (
                      <div key={qi} style={{ fontSize: 12, color: '#F59E0B', marginTop: 2 }}>
                        ⚠ {q.question}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 今アクティブ */}
      <div style={card}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>今出している本日の献立</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px' }}>
          お客様に表示中。差し替えるには上で新しく確定してください。
        </p>
        {loadingLists ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>読み込み中...</div>
        ) : active.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>まだ登録されていません</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {active.map(m => (
              <div key={m.uid} style={{
                display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                background: 'var(--bg-input)', borderRadius: 8, fontSize: 14,
              }}>
                <span>{m.name_jp}</span>
                <span style={{ color: 'var(--muted)' }}>¥{m.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ストックから流用 */}
      <div style={{ ...card, marginBottom: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>ストックから流用</h3>
          {selectedStock.length > 0 && (
            <button onClick={handleReuse} disabled={reusing} style={{
              padding: '8px 18px', background: reusing ? '#475569' : '#3B82F6', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: reusing ? 'not-allowed' : 'pointer',
            }}>
              {reusing ? '流用中...' : `${selectedStock.length}品を今日に出す`}
            </button>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px' }}>
          過去に出した日替わり品。選んで「今日に出す」で再利用（「昨日と同じ」もここから）。
        </p>
        {loadingLists ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>読み込み中...</div>
        ) : stock.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>流用できるストックがありません</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stock.map(m => {
              const sel = selectedStock.includes(m.uid)
              return (
                <button key={m.uid} onClick={() => toggleStock(m.uid)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
                  border: sel ? '1px solid #3B82F6' : '1px solid var(--border)',
                  background: sel ? 'rgba(59,130,246,0.15)' : 'var(--bg-input)',
                  color: sel ? '#60A5FA' : 'var(--text-body)', textAlign: 'left',
                }}>
                  <span>{sel ? '✓ ' : ''}{m.name_jp}</span>
                  <span style={{ color: 'var(--muted)' }}>
                    ¥{m.price.toLocaleString()}
                    {m.valid_until ? `  (前回 ${m.valid_until})` : ''}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
