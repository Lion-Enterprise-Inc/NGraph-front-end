'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { DailyMenuApi, TokenService } from '../../../services/api'
import type { DailyDraftItem, DailyActiveItem } from '../../../services/api'
import { useToast } from '../../../components/admin/Toast'
import { useAdminLang } from '../../../hooks/useAdminLang'

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
  const { t } = useAdminLang()
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
      toast('error', t.dailySpecials.toastLoadFailed)
    } finally {
      setLoadingLists(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        toast('warning', t.dailySpecials.toastNoMenuDetected)
      } else {
        toast('success', t.dailySpecials.toastExtracted(resp.result.items.length))
      }
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t.dailySpecials.toastExtractFailed)
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
      toast('warning', t.dailySpecials.toastEnterText)
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

  // 未入力欄のライブ警告（店主が埋めると即消える）。AIの意味取り違え確認は
  // サーバーの clarification_needed 側で別途表示する。
  const liveWarnings = (d: DailyDraftItem): string[] => {
    const w: string[] = []
    if (!d.price || d.price <= 0) w.push(t.dailySpecials.warnPriceMissing)
    if (!d.ingredients || d.ingredients.length === 0) w.push(t.dailySpecials.warnIngredientsMissing)
    return w
  }

  const handleConfirm = async () => {
    if (drafts.length === 0) return
    const missing = drafts.filter(d => !d.name_jp?.trim())
    if (missing.length > 0) {
      toast('warning', t.dailySpecials.toastNameEmpty)
      return
    }
    setConfirming(true)
    try {
      const resp = await DailyMenuApi.confirm(drafts, restaurantUid)
      toast('success', t.dailySpecials.toastConfirmed(resp.result.items_saved))
      setDrafts([])
      setTextInput('')
      await loadLists(restaurantUid)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t.dailySpecials.toastConfirmFailed)
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
      toast('success', t.dailySpecials.toastReused(resp.result.reactivated))
      setSelectedStock([])
      await loadLists(restaurantUid)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : t.dailySpecials.toastReuseFailed)
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
    <AdminLayout title={t.dailySpecials.title}>
      {/* Header */}
      <div style={card}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{t.dailySpecials.title}</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, lineHeight: 1.6 }}>
          {t.dailySpecials.headerDesc}
        </p>
      </div>

      {/* 入力 */}
      <div style={card}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>{t.dailySpecials.section1}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <label style={{
            padding: '10px 18px', background: '#3B82F6', color: '#fff', borderRadius: 8,
            cursor: extracting ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
            opacity: extracting ? 0.6 : 1,
          }}>
            {t.dailySpecials.takePhoto}
            <input type="file" accept="image/*" capture="environment"
              onChange={handleFile} disabled={extracting}
              style={{ display: 'none' }} />
          </label>
        </div>
        <textarea
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          placeholder={t.dailySpecials.textPlaceholder}
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
          {extracting ? t.dailySpecials.extracting : t.dailySpecials.extractFromText}
        </button>
        {extracting && (
          <div style={{ fontSize: 12, color: '#F59E0B', marginTop: 10 }}>{t.dailySpecials.aiReading}</div>
        )}
      </div>

      {/* ドラフト確認 */}
      {drafts.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t.dailySpecials.section2(drafts.length)}</h3>
            <button onClick={handleConfirm} disabled={confirming} style={{
              padding: '10px 22px', background: confirming ? '#475569' : '#16A34A', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: confirming ? 'not-allowed' : 'pointer',
            }}>
              {confirming ? t.dailySpecials.confirming : t.dailySpecials.confirmBtn}
            </button>
          </div>
          {active.length > 0 && (
            <div style={{
              fontSize: 12, color: '#F59E0B', background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8,
              padding: '8px 12px', marginBottom: 12, lineHeight: 1.5,
            }}>
              {t.dailySpecials.replaceWarning(active.length)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {drafts.map((d, idx) => {
              const warnings = liveWarnings(d)
              const meaningQs = d.clarification_needed ?? []
              const flagged = warnings.length > 0 || meaningQs.length > 0
              return (
              <div key={idx} style={{
                background: 'var(--bg-input)', borderRadius: 10, padding: 16,
                border: flagged
                  ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <input value={d.name_jp || ''} placeholder={t.dailySpecials.namePlaceholder}
                    onChange={e => updateDraft(idx, { name_jp: e.target.value })}
                    style={{ ...inputStyle, flex: 2 }} />
                  <input type="number" value={d.price ? d.price : ''} placeholder={t.dailySpecials.pricePlaceholder}
                    onChange={e => updateDraft(idx, { price: Number(e.target.value) })}
                    style={{ ...inputStyle, flex: 1 }} />
                  <input value={d.category || ''} placeholder={t.dailySpecials.categoryPlaceholder}
                    onChange={e => updateDraft(idx, { category: e.target.value })}
                    style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={() => removeDraft(idx)} style={{
                    padding: '0 12px', background: 'transparent', color: 'var(--error)',
                    border: '1px solid var(--border-strong)', borderRadius: 8, cursor: 'pointer', fontSize: 18,
                  }} title={t.common.delete}>×</button>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <input value={(d.ingredients || []).join('、')} placeholder={t.dailySpecials.ingredientsPlaceholder}
                    onChange={e => updateDraft(idx, { ingredients: splitList(e.target.value) })}
                    style={{ ...inputStyle, flex: 1 }} />
                  <input value={(d.allergens || []).join('、')} placeholder={t.dailySpecials.allergensPlaceholder}
                    onChange={e => updateDraft(idx, { allergens: splitList(e.target.value) })}
                    style={{ ...inputStyle, flex: 1 }} />
                </div>
                {(warnings.length > 0 || meaningQs.length > 0) && (
                  <div style={{ marginTop: 8 }}>
                    {meaningQs.map((q, qi) => (
                      <div key={`q${qi}`} style={{ fontSize: 12, color: '#F59E0B', marginTop: 2 }}>
                        ⚠ {q.question}
                      </div>
                    ))}
                    {warnings.map((w, wi) => (
                      <div key={`w${wi}`} style={{ fontSize: 12, color: '#F59E0B', marginTop: 2 }}>
                        ⚠ {w}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 今アクティブ */}
      <div style={card}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>{t.dailySpecials.sectionActive}</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px' }}>
          {t.dailySpecials.activeDesc}
        </p>
        {loadingLists ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t.layout.loading}</div>
        ) : active.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t.dailySpecials.notRegistered}</div>
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
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t.dailySpecials.sectionStock}</h3>
          {selectedStock.length > 0 && (
            <button onClick={handleReuse} disabled={reusing} style={{
              padding: '8px 18px', background: reusing ? '#475569' : '#3B82F6', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: reusing ? 'not-allowed' : 'pointer',
            }}>
              {reusing ? t.dailySpecials.reusing : t.dailySpecials.reuseToToday(selectedStock.length)}
            </button>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px' }}>
          {t.dailySpecials.stockDesc}
        </p>
        {loadingLists ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t.layout.loading}</div>
        ) : stock.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t.dailySpecials.noStock}</div>
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
                    {m.valid_until ? `  ${t.dailySpecials.lastShown(m.valid_until)}` : ''}
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
