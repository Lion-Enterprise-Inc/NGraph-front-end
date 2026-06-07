'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { apiClient, TokenService } from '../../../services/api'
import { useToast } from '../../../components/admin/Toast'
import type { KitchenQuestion, SurveyPreview } from './questions'
import { useAdminLang } from '../../../hooks/useAdminLang'

function ProgressBar({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? (filled / total) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 8, background: '#1E293B', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: 'linear-gradient(90deg, #3B82F6, #06B6D4)',
          borderRadius: 4, transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{ fontSize: 13, color: '#94A3B8', whiteSpace: 'nowrap' }}>{filled}/{total}</span>
    </div>
  )
}

export default function StoreKnowledgePage() {
  const { t } = useAdminLang()
  const FIELD_LABELS: Record<string, string> = {
    allergens: t.storeKnowledge.fieldAllergens,
    ingredients: t.storeKnowledge.fieldIngredients,
    cooking_methods: t.storeKnowledge.fieldCookingMethods,
    restrictions: t.storeKnowledge.fieldRestrictions,
  }
  const [loading, setLoading] = useState(true)
  const [slug, setSlug] = useState<string | null>(null)
  const [preview, setPreview] = useState<SurveyPreview | null>(null)
  const [kitchenAnswers, setKitchenAnswers] = useState<Record<string, string | string[]>>({})
  const [dishTexts, setDishTexts] = useState<Record<number, string>>({})
  const [dishSelects, setDishSelects] = useState<Record<number, string[]>>({})
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [savingDish, setSavingDish] = useState(false)
  const toast = useToast()

  const [showSurveyModal, setShowSurveyModal] = useState(false)
  const [surveyLimit, setSurveyLimit] = useState(20)
  const [surveyExpDays, setSurveyExpDays] = useState(7)
  const [creatingSurvey, setCreatingSurvey] = useState(false)
  const [surveyResult, setSurveyResult] = useState<{ url: string; passcode: string } | null>(null)

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadExpDays, setUploadExpDays] = useState(7)
  const [creatingUpload, setCreatingUpload] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ url: string; passcode: string } | null>(null)

  useEffect(() => {
    const user = TokenService.getUser()
    if (!user) return
    let rs = user.restaurant_slug
    if (!rs && (user.role === 'superadmin' || user.role === 'platform_owner')) {
      const params = new URLSearchParams(window.location.search)
      rs = params.get('slug') || ''
    }
    if (rs) {
      setSlug(rs)
      loadPreview(rs)
    } else {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadPreview = async (s: string) => {
    try {
      const resp = await apiClient.get(`/owner-survey/admin/preview/${encodeURIComponent(s)}`) as any
      const raw = resp?.result || resp
      const data: SurveyPreview = {
        restaurant_name: raw.restaurant_name || '',
        kitchen_questions: raw.kitchen_questions || [],
        dish_questions: raw.dish_questions || [],
        existing_answers: raw.existing_answers || {},
      }
      setPreview(data)
      if (data.existing_answers) {
        const ka: Record<string, string | string[]> = {}
        const dt: Record<number, string> = {}
        const ds: Record<number, string[]> = {}
        for (const [key, val] of Object.entries(data.existing_answers)) {
          if (key.startsWith('dish_')) {
            try {
              const parsed = JSON.parse(val)
              const idx = parseInt(key.replace('dish_', ''))
              if (!isNaN(idx)) {
                if (parsed.text_note) dt[idx] = parsed.text_note
                if (parsed.selected) ds[idx] = parsed.selected
              }
            } catch { /* ignore */ }
          } else {
            try {
              const parsed = JSON.parse(val)
              ka[key] = Array.isArray(parsed) ? parsed : val
            } catch {
              ka[key] = val
            }
          }
        }
        setKitchenAnswers(ka)
        setDishTexts(dt)
        setDishSelects(ds)
      }
    } catch (err) {
      console.error(err)
      toast('error', t.storeKnowledge.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  // Phase 1: immediate save
  const handleKitchenRadio = async (qid: string, value: string) => {
    if (!slug) return
    const current = kitchenAnswers[qid]
    const newVal = current === value ? '' : value
    setKitchenAnswers(prev => ({ ...prev, [qid]: newVal }))
    if (!newVal) return

    setApplyingId(qid)
    try {
      const resp = await apiClient.post(`/owner-survey/admin/kitchen-answer/${encodeURIComponent(slug)}`, {
        question_id: qid,
        selected_value: newVal,
      }) as any
      const r = resp?.result || resp
      const added = r.allergens_added?.length || 0
      const removed = r.allergens_removed?.length || 0
      if (added > 0 || removed > 0) {
        toast('success', t.storeKnowledge.propagatedAllergens(r.affected_menus, added, removed))
      } else {
        toast('success', t.storeKnowledge.savedAffected(r.affected_menus))
      }
    } catch {
      toast('error', t.storeKnowledge.saveFailed)
    } finally {
      setApplyingId(null)
    }
  }

  const handleKitchenCheckbox = async (qid: string, value: string) => {
    if (!slug) return
    const current = (kitchenAnswers[qid] as string[]) || []
    const idx = current.indexOf(value)
    const newArr = idx >= 0 ? current.filter(v => v !== value) : [...current, value]
    setKitchenAnswers(prev => ({ ...prev, [qid]: newArr }))
    if (newArr.length === 0) return

    setApplyingId(qid)
    try {
      const resp = await apiClient.post(`/owner-survey/admin/kitchen-answer/${encodeURIComponent(slug)}`, {
        question_id: qid,
        selected_value: newArr,
      }) as any
      const r = resp?.result || resp
      toast('success', t.storeKnowledge.propagatedAffected(r.affected_menus))
    } catch {
      toast('error', t.storeKnowledge.saveFailed)
    } finally {
      setApplyingId(null)
    }
  }

  // Phase 1: menu_select（自慢の料理など）immediate save
  const handleKitchenMenuSelect = async (qid: string, uid: string, maxSelect: number) => {
    if (!slug) return
    const current = (kitchenAnswers[qid] as string[]) || []
    const has = current.includes(uid)
    if (!has && current.length >= maxSelect) return
    const newArr = has ? current.filter(v => v !== uid) : [...current, uid]
    setKitchenAnswers(prev => ({ ...prev, [qid]: newArr }))
    if (newArr.length === 0) return

    setApplyingId(qid)
    try {
      await apiClient.post(`/owner-survey/admin/kitchen-answer/${encodeURIComponent(slug)}`, {
        question_id: qid,
        selected_value: newArr,
      })
      toast('success', t.storeKnowledge.savedCount(newArr.length))
    } catch {
      toast('error', t.storeKnowledge.saveFailed)
    } finally {
      setApplyingId(null)
    }
  }

  // Phase 2: batch save
  const saveDishAnswers = async () => {
    if (!slug || !preview) return
    setSavingDish(true)
    let count = 0
    try {
      const promises = (preview.dish_questions || []).map(q => {
        const selected = dishSelects[q.index]
        const text_note = dishTexts[q.index]
        if (!selected?.length && !text_note) return null
        count++
        return apiClient.post(`/owner-survey/admin/dish-answer/${encodeURIComponent(slug)}`, {
          question_index: q.index,
          template: q.template,
          menu_uids: q.menu_uids,
          selected: selected || null,
          text_note: text_note || null,
          target_field: q.target_field || null,
        })
      }).filter(Boolean)
      await Promise.allSettled(promises)
      toast('success', t.storeKnowledge.savedCount(count))
    } catch {
      toast('error', t.storeKnowledge.saveFailed)
    } finally {
      setSavingDish(false)
    }
  }

  // Survey & upload handlers
  const handleCreateSurvey = async () => {
    if (!slug) return
    setCreatingSurvey(true)
    try {
      const data = await apiClient.post('/owner-survey/create', {
        restaurant_slug: slug,
        question_limit: surveyLimit,
        expires_in_days: surveyExpDays,
      }) as any
      const r = data?.result || data
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      setSurveyResult({ url: `${baseUrl}/verify?token=${r.token}`, passcode: r.passcode })
      toast('success', t.storeKnowledge.surveyCreated)
    } catch {
      toast('error', t.storeKnowledge.surveyFailed)
    } finally {
      setCreatingSurvey(false)
    }
  }

  const handleCreateUploadLink = async () => {
    if (!slug) return
    setCreatingUpload(true)
    try {
      const data = await apiClient.post('/owner-upload/create', {
        restaurant_slug: slug,
        expires_in_days: uploadExpDays,
      }) as any
      const r = data?.result || data
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      setUploadResult({ url: `${baseUrl}/upload?token=${r.token}`, passcode: r.passcode })
      toast('success', t.storeKnowledge.uploadCreated)
    } catch {
      toast('error', t.storeKnowledge.uploadFailed)
    } finally {
      setCreatingUpload(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast('success', t.storeKnowledge.copied)
  }

  // Counts
  const kitchenTotal = preview?.kitchen_questions?.length || 0
  const kitchenAnswered = preview?.kitchen_questions?.filter(q => {
    const a = kitchenAnswers[q.id]
    return (q.type === 'checkbox' || q.type === 'menu_select')
      ? (Array.isArray(a) && a.length > 0)
      : (typeof a === 'string' && a !== '')
  }).length || 0
  const dishTotal = preview?.dish_questions?.length || 0
  const dishAnswered = preview?.dish_questions?.filter(q =>
    !!(dishTexts[q.index] || dishSelects[q.index]?.length)
  ).length || 0
  const total = kitchenTotal + dishTotal
  const answered = kitchenAnswered + dishAnswered

  // Branch visibility
  const showBranch = (q: KitchenQuestion) => {
    if (!q.is_branch || !q.parent_id) return true
    const parentVal = kitchenAnswers[q.parent_id]
    return typeof parentVal === 'string' && parentVal !== '' && parentVal !== 'unknown'
  }

  if (loading) {
    return <AdminLayout title={t.storeKnowledge.title}><div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>{t.layout.loading}</div></AdminLayout>
  }
  if (!slug || !preview) {
    return <AdminLayout title={t.storeKnowledge.title}><div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>{t.storeKnowledge.notFound}</div></AdminLayout>
  }

  return (
    <AdminLayout title={t.storeKnowledge.title}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '20px 24px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{t.storeKnowledge.headerTitle}</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              {preview.restaurant_name} — {slug}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setUploadResult(null); setShowUploadModal(true) }} style={{
              padding: '10px 16px', background: 'transparent', color: '#16A34A',
              border: '1px solid #16A34A', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>{t.storeKnowledge.uploadLinkBtn}</button>
            <button onClick={() => { setSurveyResult(null); setShowSurveyModal(true) }} style={{
              padding: '10px 16px', background: 'transparent', color: '#3B82F6',
              border: '1px solid #3B82F6', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>{t.storeKnowledge.surveyBtn}</button>
          </div>
        </div>
        <ProgressBar filled={answered} total={total} />
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
          {answered === 0 ? t.storeKnowledge.notAnswered : t.storeKnowledge.progressLabel(answered, total)}
        </div>
      </div>

      {/* Phase 1: 厨房プロファイル */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 20, marginBottom: 16,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>{t.storeKnowledge.phase1Title}</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 16px' }}>
          {t.storeKnowledge.phase1Hint}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(preview.kitchen_questions || []).filter(showBranch).map(q => {
            const currentVal = kitchenAnswers[q.id]
            const isApplying = applyingId === q.id
            return (
              <div key={q.id} style={{
                background: 'var(--bg-input, #0F172A)', borderRadius: 10, padding: '14px 18px',
                border: currentVal && currentVal !== '' ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--border)',
                opacity: isApplying ? 0.7 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>
                    {q.is_branch && '↳ '}{q.question}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {t.storeKnowledge.affectedSuffix(q.affected_menu_count)}
                  </span>
                </div>
                {q.type === 'menu_select' ? (
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {(q.menu_list || []).map(m => {
                      const sel = Array.isArray(currentVal) ? currentVal : []
                      const isSelected = sel.includes(m.uid)
                      const maxReached = (q.max_select || 999) <= sel.length && !isSelected
                      return (
                        <button
                          key={m.uid}
                          disabled={isApplying || maxReached}
                          onClick={() => handleKitchenMenuSelect(q.id, m.uid, q.max_select || 3)}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '8px 12px', marginBottom: 2,
                            borderRadius: 6, fontSize: 13, cursor: maxReached ? 'not-allowed' : 'pointer',
                            border: 'none',
                            background: isSelected ? 'rgba(59,130,246,0.15)' : 'transparent',
                            color: isSelected ? '#60A5FA' : 'var(--text-body)',
                            opacity: maxReached ? 0.4 : 1,
                          }}
                        >
                          {isSelected ? '● ' : '○ '}{m.name}
                        </button>
                      )
                    })}
                    {q.max_select && (
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                        {t.storeKnowledge.maxSelectHint(q.max_select, Array.isArray(currentVal) ? currentVal.length : 0)}
                      </div>
                    )}
                    {(q.menu_list || []).length === 0 && (
                      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t.storeKnowledge.phase2NoQuestions}</div>
                    )}
                  </div>
                ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(q.options || []).map(opt => {
                    const isSelected = q.type === 'checkbox'
                      ? (Array.isArray(currentVal) && currentVal.includes(opt.value))
                      : currentVal === opt.value
                    return (
                      <button
                        key={opt.value}
                        disabled={isApplying}
                        onClick={() => q.type === 'checkbox'
                          ? handleKitchenCheckbox(q.id, opt.value)
                          : handleKitchenRadio(q.id, opt.value)
                        }
                        style={{
                          padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                          border: isSelected ? '1px solid #3B82F6' : '1px solid var(--border-strong)',
                          background: isSelected ? 'rgba(59,130,246,0.15)' : 'transparent',
                          color: isSelected ? '#60A5FA' : 'var(--text-body)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {q.type === 'checkbox' && isSelected && '✓ '}{opt.label}
                      </button>
                    )
                  })}
                </div>
                )}
                {isApplying && <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 6 }}>{t.storeKnowledge.propagating}</div>}
              </div>
            )
          })}
          {preview.kitchen_questions.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              {t.storeKnowledge.phase1NoQuestions}
            </div>
          )}
        </div>
      </div>

      {/* Phase 2: 料理ヒアリング */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 20, marginBottom: 80,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>{t.storeKnowledge.phase2Title}</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{t.storeKnowledge.phase2Hint}</p>
          </div>
          <button
            onClick={saveDishAnswers}
            disabled={savingDish || dishAnswered === 0}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: savingDish ? '#475569' : '#3B82F6', color: '#fff', border: 'none',
              cursor: savingDish || dishAnswered === 0 ? 'not-allowed' : 'pointer',
              opacity: dishAnswered === 0 ? 0.5 : 1,
            }}
          >
            {savingDish ? t.storeKnowledge.saving : t.storeKnowledge.saveLabel(dishAnswered)}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(preview.dish_questions || []).map(q => (
            <div key={q.index} style={{
              background: 'var(--bg-input, #0F172A)', borderRadius: 10, padding: '14px 18px',
              border: (dishTexts[q.index] || dishSelects[q.index]?.length)
                ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{q.question}</span>
                <span style={{
                  fontSize: 10, color: '#64748B', whiteSpace: 'nowrap', marginLeft: 8,
                  padding: '2px 6px', background: 'rgba(100,116,139,0.2)', borderRadius: 4,
                }}>{FIELD_LABELS[q.target_field || ''] || t.storeKnowledge.fieldDefault}</span>
              </div>

              {q.type === 'text' && (
                <textarea
                  value={dishTexts[q.index] || ''}
                  onChange={e => setDishTexts(prev => ({ ...prev, [q.index]: e.target.value }))}
                  placeholder={t.storeKnowledge.answerInputPlaceholder}
                  rows={2}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'var(--bg-surface)', color: 'var(--text)',
                    border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 13, resize: 'vertical',
                  }}
                />
              )}

              {q.type === 'multi_select' && q.options && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {q.options.map(opt => {
                    const sel = dishSelects[q.index] || []
                    const isSelected = sel.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          const arr = [...sel]
                          const i = arr.indexOf(opt.value)
                          if (i >= 0) arr.splice(i, 1); else arr.push(opt.value)
                          setDishSelects(prev => ({ ...prev, [q.index]: arr }))
                        }}
                        style={{
                          padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                          border: isSelected ? '1px solid #10B981' : '1px solid var(--border-strong)',
                          background: isSelected ? 'rgba(16,185,129,0.15)' : 'transparent',
                          color: isSelected ? '#34D399' : 'var(--text-body)',
                        }}
                      >
                        {isSelected ? '✓ ' : ''}{opt.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {q.type === 'menu_select' && (
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {q.menu_names.map((name, i) => {
                    const uid = q.menu_uids[i]
                    const sel = dishSelects[q.index] || []
                    const isSelected = sel.includes(uid)
                    const maxReached = (q.max_select || 999) <= sel.length && !isSelected
                    return (
                      <button
                        key={uid}
                        disabled={maxReached}
                        onClick={() => {
                          const arr = [...sel]
                          const idx = arr.indexOf(uid)
                          if (idx >= 0) arr.splice(idx, 1); else arr.push(uid)
                          setDishSelects(prev => ({ ...prev, [q.index]: arr }))
                        }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '8px 12px', marginBottom: 2,
                          borderRadius: 6, fontSize: 13, cursor: maxReached ? 'not-allowed' : 'pointer',
                          border: 'none',
                          background: isSelected ? 'rgba(59,130,246,0.15)' : 'transparent',
                          color: isSelected ? '#60A5FA' : 'var(--text-body)',
                          opacity: maxReached ? 0.4 : 1,
                        }}
                      >
                        {isSelected ? '● ' : '○ '}{name}
                      </button>
                    )
                  })}
                  {q.max_select && (
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                      {t.storeKnowledge.maxSelectHint(q.max_select, (dishSelects[q.index] || []).length)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {preview.dish_questions.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t.storeKnowledge.phase2NoQuestions}</div>
          )}
        </div>
      </div>

      {/* Floating save for Phase 2 */}
      {dishAnswered > 0 && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 50 }}>
          <button
            onClick={saveDishAnswers}
            disabled={savingDish}
            style={{
              padding: '12px 28px',
              background: savingDish ? '#475569' : 'linear-gradient(135deg, #3B82F6, #06B6D4)',
              color: '#fff', border: 'none', borderRadius: 28, cursor: 'pointer',
              fontSize: 14, fontWeight: 600, boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
            }}
          >
            {savingDish ? t.storeKnowledge.saving : t.storeKnowledge.phase2FloatingSave(dishAnswered)}
          </button>
        </div>
      )}

      {/* Survey modal */}
      {showSurveyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowSurveyModal(false)}>
          <div style={{
            background: 'var(--bg-surface, #1E293B)', borderRadius: 12,
            padding: 24, width: 400, maxWidth: '90vw',
            border: '1px solid var(--border, #334155)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>{t.storeKnowledge.surveyModalTitle}</h3>
            <p style={{ fontSize: 13, color: 'var(--muted, #94A3B8)', marginBottom: 16 }}>
              {t.storeKnowledge.surveyModalDesc(slug)}
            </p>
            {!surveyResult ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{t.storeKnowledge.fieldQuestionLimit}</label>
                  <input type="number" min={5} max={50} value={surveyLimit}
                    onChange={e => setSurveyLimit(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '8px 12px',
                      background: 'var(--bg-input, #0F172A)', color: 'var(--text, #fff)',
                      border: '1px solid var(--border-strong, #475569)', borderRadius: 8, fontSize: 14,
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{t.storeKnowledge.fieldExpiresDays}</label>
                  <input type="number" min={1} max={30} value={surveyExpDays}
                    onChange={e => setSurveyExpDays(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '8px 12px',
                      background: 'var(--bg-input, #0F172A)', color: 'var(--text, #fff)',
                      border: '1px solid var(--border-strong, #475569)', borderRadius: 8, fontSize: 14,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowSurveyModal(false)} style={{
                    padding: '8px 16px', background: 'transparent', color: 'var(--muted)',
                    border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  }}>{t.storeKnowledge.cancel}</button>
                  <button onClick={handleCreateSurvey} disabled={creatingSurvey} style={{
                    padding: '8px 16px', background: '#3B82F6', color: '#fff',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    opacity: creatingSurvey ? 0.6 : 1,
                  }}>{creatingSurvey ? t.storeKnowledge.creating : t.storeKnowledge.create}</button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  background: 'var(--bg-input, #0F172A)', borderRadius: 8, padding: 16, marginBottom: 12,
                }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t.storeKnowledge.urlLabel}</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ fontSize: 12, flex: 1, wordBreak: 'break-all', color: '#3B82F6' }}>
                        {surveyResult.url}
                      </code>
                      <button onClick={() => copyToClipboard(surveyResult.url)} style={{
                        padding: '4px 10px', background: '#334155', color: '#fff', border: 'none',
                        borderRadius: 6, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
                      }}>{t.storeKnowledge.copyBtn}</button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t.storeKnowledge.passcodeLabel}</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4 }}>
                        {surveyResult.passcode}
                      </code>
                      <button onClick={() => copyToClipboard(surveyResult.passcode)} style={{
                        padding: '4px 10px', background: '#334155', color: '#fff', border: 'none',
                        borderRadius: 6, cursor: 'pointer', fontSize: 12,
                      }}>{t.storeKnowledge.copyBtn}</button>
                    </div>
                  </div>
                </div>
                <button onClick={() => {
                  const msg = t.storeKnowledge.lineMsgSurvey(surveyResult.url, surveyResult.passcode)
                  copyToClipboard(msg)
                }} style={{
                  width: '100%', padding: '10px', background: '#16A34A', color: '#fff',
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  marginBottom: 8,
                }}>{t.storeKnowledge.lineCopyBtn}</button>
                <button onClick={() => setShowSurveyModal(false)} style={{
                  width: '100%', padding: '8px', background: 'transparent', color: 'var(--muted)',
                  border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                }}>{t.storeKnowledge.close}</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowUploadModal(false)}>
          <div style={{
            background: 'var(--bg-surface, #1E293B)', borderRadius: 12,
            padding: 24, width: 400, maxWidth: '90vw',
            border: '1px solid var(--border, #334155)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>{t.storeKnowledge.uploadModalTitle}</h3>
            <p style={{ fontSize: 13, color: 'var(--muted, #94A3B8)', marginBottom: 16 }}>
              {t.storeKnowledge.uploadModalDesc(slug)}
            </p>
            {!uploadResult ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>{t.storeKnowledge.fieldExpiresDays}</label>
                  <input type="number" min={1} max={30} value={uploadExpDays}
                    onChange={e => setUploadExpDays(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '8px 12px',
                      background: 'var(--bg-input, #0F172A)', color: 'var(--text, #fff)',
                      border: '1px solid var(--border-strong, #475569)', borderRadius: 8, fontSize: 14,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowUploadModal(false)} style={{
                    padding: '8px 16px', background: 'transparent', color: 'var(--muted)',
                    border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  }}>{t.storeKnowledge.cancel}</button>
                  <button onClick={handleCreateUploadLink} disabled={creatingUpload} style={{
                    padding: '8px 16px', background: '#16A34A', color: '#fff',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    opacity: creatingUpload ? 0.6 : 1,
                  }}>{creatingUpload ? t.storeKnowledge.creating : t.storeKnowledge.create}</button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  background: 'var(--bg-input, #0F172A)', borderRadius: 8, padding: 16, marginBottom: 12,
                }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t.storeKnowledge.urlLabel}</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ fontSize: 12, flex: 1, wordBreak: 'break-all', color: '#16A34A' }}>
                        {uploadResult.url}
                      </code>
                      <button onClick={() => copyToClipboard(uploadResult.url)} style={{
                        padding: '4px 10px', background: '#334155', color: '#fff', border: 'none',
                        borderRadius: 6, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
                      }}>{t.storeKnowledge.copyBtn}</button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{t.storeKnowledge.passcodeLabel}</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4 }}>
                        {uploadResult.passcode}
                      </code>
                      <button onClick={() => copyToClipboard(uploadResult.passcode)} style={{
                        padding: '4px 10px', background: '#334155', color: '#fff', border: 'none',
                        borderRadius: 6, cursor: 'pointer', fontSize: 12,
                      }}>{t.storeKnowledge.copyBtn}</button>
                    </div>
                  </div>
                </div>
                <button onClick={() => {
                  const msg = t.storeKnowledge.lineMsgUpload(uploadResult.url, uploadResult.passcode)
                  copyToClipboard(msg)
                }} style={{
                  width: '100%', padding: '10px', background: '#16A34A', color: '#fff',
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  marginBottom: 8,
                }}>{t.storeKnowledge.lineCopyBtn}</button>
                <button onClick={() => setShowUploadModal(false)} style={{
                  width: '100%', padding: '8px', background: 'transparent', color: 'var(--muted)',
                  border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                }}>{t.storeKnowledge.close}</button>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
