'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { apiClient, TokenService } from '../../../services/api'
import { useToast } from '../../../components/admin/Toast'
import { PHASES, Question, Phase, getPhases } from './questions'

interface StoreKnowledgeItem {
  uid: string
  key: string
  value: string
  category: string | null
  applies_to_categories: string[] | null
  source: string
  verified: boolean
}

interface Answer {
  value: string | string[]
  note: string
}

function parseStoredValue(raw: string): { value: string | string[], note: string } {
  const parts = raw.split('||')
  const mainVal = parts[0] || ''
  const note = parts.slice(1).join('||') || ''
  if (mainVal.includes(',') && !mainVal.includes('¥')) {
    return { value: mainVal.split(','), note }
  }
  return { value: mainVal, note }
}

function serializeAnswer(answer: Answer): string {
  const val = Array.isArray(answer.value) ? answer.value.join(',') : answer.value
  if (answer.note) return `${val}||${answer.note}`
  return val
}

function ProgressBar({ filled, total, color = '#3B82F6' }: { filled: number; total: number; color?: string }) {
  const pct = total > 0 ? (filled / total) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 8, background: '#1E293B', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}, #06B6D4)`,
          borderRadius: 4,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{ fontSize: 13, color: '#94A3B8', whiteSpace: 'nowrap' }}>{filled}/{total}</span>
    </div>
  )
}

function TableQuestion({ q, answer, onChange }: {
  q: Question
  answer: Answer | undefined
  onChange: (val: string | string[], note: string) => void
}) {
  const rows = q.tableRows || []
  const cols = q.tableColumns || []
  // Store as JSON object: { "row_name": "col_name", ... }
  const currentVal: Record<string, string> = (() => {
    try {
      const raw = answer?.value
      if (typeof raw === 'string' && raw.startsWith('{')) return JSON.parse(raw)
    } catch { /* ignore */ }
    return {}
  })()

  const handleCellClick = (row: string, col: string) => {
    const updated = { ...currentVal }
    if (updated[row] === col) {
      delete updated[row]
    } else {
      updated[row] = col
    }
    onChange(JSON.stringify(updated), answer?.note || '')
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 500 }}></th>
            {cols.map(c => (
              <th key={c} style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row}>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', color: 'var(--text-body)', fontSize: 13 }}>{row}</td>
              {cols.map(col => {
                const isSelected = currentVal[row] === col
                return (
                  <td key={col} style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                    <button
                      onClick={() => handleCellClick(row, col)}
                      style={{
                        width: 28, height: 28,
                        borderRadius: '50%',
                        border: isSelected ? '2px solid #3B82F6' : '1px solid var(--border-strong)',
                        background: isSelected ? 'rgba(59,130,246,0.2)' : 'transparent',
                        cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        color: isSelected ? '#3B82F6' : 'transparent',
                        fontSize: 14,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected ? '●' : ''}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function QuestionCard({ q, answer, onAnswer }: {
  q: Question
  answer: Answer | undefined
  onAnswer: (questionId: string, value: string | string[], note: string) => void
}) {
  const currentVal = answer?.value || (q.type === 'multi' ? [] : '')
  const currentNote = answer?.note || ''

  const handleSingleClick = (opt: string) => {
    const newVal = currentVal === opt ? '' : opt
    onAnswer(q.id, newVal, currentNote)
  }

  const handleMultiClick = (opt: string) => {
    const arr = Array.isArray(currentVal) ? [...currentVal] : []
    const idx = arr.indexOf(opt)
    if (idx >= 0) arr.splice(idx, 1)
    else arr.push(opt)
    onAnswer(q.id, arr, currentNote)
  }

  const hasValue = q.type === 'multi'
    ? (Array.isArray(currentVal) && currentVal.length > 0)
    : (q.type === 'table'
      ? (typeof currentVal === 'string' && currentVal !== '' && currentVal !== '{}')
      : (typeof currentVal === 'string' && currentVal !== ''))

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${hasValue ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
      borderRadius: 10,
      padding: '16px 20px',
      transition: 'border-color 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
          background: hasValue ? '#10B981' : '#475569',
        }} />
        <span style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{q.label}</span>
      </div>

      {q.type === 'single' && q.options && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginLeft: 16 }}>
          {q.options.map(opt => {
            const isSelected = currentVal === opt
            return (
              <button
                key={opt}
                onClick={() => handleSingleClick(opt)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: isSelected ? '1px solid #3B82F6' : '1px solid var(--border-strong)',
                  background: isSelected ? 'rgba(59,130,246,0.15)' : 'var(--bg-input)',
                  color: isSelected ? '#60A5FA' : 'var(--text-body)',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.15s ease',
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'multi' && q.options && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginLeft: 16 }}>
          {q.options.map(opt => {
            const arr = Array.isArray(currentVal) ? currentVal : []
            const isSelected = arr.includes(opt)
            return (
              <button
                key={opt}
                onClick={() => handleMultiClick(opt)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: isSelected ? '1px solid #10B981' : '1px solid var(--border-strong)',
                  background: isSelected ? 'rgba(16,185,129,0.15)' : 'var(--bg-input)',
                  color: isSelected ? '#34D399' : 'var(--text-body)',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.15s ease',
                }}
              >
                {isSelected ? '✓ ' : ''}{opt}
              </button>
            )
          })}
        </div>
      )}

      {q.type === 'table' && (
        <div style={{ marginLeft: 16 }}>
          <TableQuestion q={q} answer={answer} onChange={(val, note) => onAnswer(q.id, val, note)} />
        </div>
      )}

      {q.type === 'text' && (
        <div style={{ marginLeft: 16 }}>
          <textarea
            value={typeof currentVal === 'string' ? currentVal : ''}
            onChange={e => onAnswer(q.id, e.target.value, currentNote)}
            placeholder={q.note || '自由記述'}
            rows={2}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--bg-input)',
              color: 'var(--text)',
              border: '1px solid var(--border-strong)',
              borderRadius: 8,
              fontSize: 13,
              resize: 'vertical',
            }}
          />
        </div>
      )}

      {/* Note field for non-text questions */}
      {q.type !== 'text' && (
        <div style={{ marginTop: 10, marginLeft: 16 }}>
          <input
            type="text"
            value={currentNote}
            onChange={e => onAnswer(q.id, currentVal, e.target.value)}
            placeholder={q.note ? `📝 ${q.note}` : '📝 補足'}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--bg-input)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </div>
      )}
    </div>
  )
}

function PhaseSection({ phase, answers, onAnswer, defaultOpen }: {
  phase: Phase
  answers: Record<string, Answer>
  onAnswer: (questionId: string, value: string | string[], note: string) => void
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const filled = phase.questions.filter(q => {
    const a = answers[q.id]
    if (!a) return false
    if (q.type === 'multi') return Array.isArray(a.value) && a.value.length > 0
    if (q.type === 'table') return typeof a.value === 'string' && a.value !== '' && a.value !== '{}'
    return typeof a.value === 'string' && a.value !== ''
  }).length
  const total = phase.questions.length

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text)',
        }}
      >
        <span style={{ fontSize: 16, transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▶</span>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{phase.title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{phase.description}</div>
        </div>
        <div style={{ width: 120 }}>
          <ProgressBar filled={filled} total={total} />
        </div>
        {filled === total && total > 0 && (
          <span style={{ color: '#10B981', fontSize: 16 }}>✓</span>
        )}
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {phase.questions.map(q => (
            <QuestionCard
              key={q.id}
              q={q}
              answer={answers[q.id]}
              onAnswer={onAnswer}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function StoreKnowledgePage() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [existingItems, setExistingItems] = useState<StoreKnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [slug, setSlug] = useState<string | null>(null)
  const [businessType, setBusinessType] = useState<string | null>(null)
  const toast = useToast()

  // Survey modal state
  const [showSurveyModal, setShowSurveyModal] = useState(false)
  const [surveyLimit, setSurveyLimit] = useState(20)
  const [surveyExpDays, setSurveyExpDays] = useState(7)
  const [creatingSurvey, setCreatingSurvey] = useState(false)
  const [surveyResult, setSurveyResult] = useState<{ url: string; passcode: string } | null>(null)

  const phases = getPhases(businessType)

  // Build key→question lookup
  const keyToQuestion = new Map<string, Question>()
  for (const phase of phases) {
    for (const q of phase.questions) {
      keyToQuestion.set(q.key, q)
    }
  }

  // Build question id→key lookup
  const idToKey = new Map<string, string>()
  for (const phase of phases) {
    for (const q of phase.questions) {
      idToKey.set(q.id, q.key)
    }
  }

  useEffect(() => {
    const user = TokenService.getUser()
    if (!user) return

    // For restaurant owners, use their slug. For admin, check URL params or use first restaurant
    let restaurantSlug = user.restaurant_slug
    if (!restaurantSlug && (user.role === 'superadmin' || user.role === 'platform_owner')) {
      const params = new URLSearchParams(window.location.search)
      restaurantSlug = params.get('slug') || 'bonta-honten'
    }

    if (restaurantSlug) {
      setSlug(restaurantSlug)
      loadData(restaurantSlug)
    } else {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async (restaurantSlug: string) => {
    try {
      // Fetch restaurant info to get business_type
      try {
        const restaurantInfo = await apiClient.get<{ business_type?: string }>(`/restaurants/public/${restaurantSlug}`)
        if (restaurantInfo?.business_type) {
          setBusinessType(restaurantInfo.business_type)
        }
      } catch {
        // Non-critical: fall back to default questions
      }

      const items = await apiClient.get<StoreKnowledgeItem[]>(`/store-knowledge/${restaurantSlug}`)
      setExistingItems(items)

      // Prefill answers from existing data — use all possible phases to match keys
      const allPhases = [...getPhases(null), ...getPhases('カクテルバー')]
      const prefilled: Record<string, Answer> = {}
      for (const item of items) {
        let questionId: string | null = null
        for (const phase of allPhases) {
          for (const q of phase.questions) {
            if (q.key === item.key) {
              questionId = q.id
              break
            }
          }
          if (questionId) break
        }
        if (questionId) {
          const parsed = parseStoredValue(item.value)
          prefilled[questionId] = parsed
        }
      }
      setAnswers(prefilled)
    } catch (err) {
      console.error('Failed to load store knowledge:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = useCallback((questionId: string, value: string | string[], note: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { value, note },
    }))
  }, [])

  const handleSave = async () => {
    if (!slug) return
    setSaving(true)

    try {
      const promises: Promise<unknown>[] = []

      for (const [questionId, answer] of Object.entries(answers)) {
        const key = idToKey.get(questionId)
        if (!key) continue

        const question = keyToQuestion.get(key)
        const serialized = serializeAnswer(answer)
        if (!serialized) continue

        // Check if this key already exists
        const existing = existingItems.find(item => item.key === key)

        if (existing) {
          promises.push(
            apiClient.put(`/store-knowledge/${existing.uid}`, {
              value: serialized,
              source: 'mtg',
              verified: true,
            })
          )
        } else {
          promises.push(
            apiClient.post(`/store-knowledge/${slug}`, {
              key,
              value: serialized,
              category: question?.category || null,
              applies_to_categories: question?.applies_to_categories || null,
              source: 'mtg',
            })
          )
        }
      }

      const results = await Promise.allSettled(promises)
      const failed = results.filter(r => r.status === 'rejected').length
      if (failed > 0) {
        toast('warning', `${results.length - failed}件保存、${failed}件失敗`)
      } else {
        toast('success', `${results.length}件保存しました`)
      }

      // Reload to get updated UIDs
      await loadData(slug)
    } catch (err) {
      console.error('Save failed:', err)
      toast('error', '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // Survey creation
  const handleCreateSurvey = async () => {
    if (!slug) return
    setCreatingSurvey(true)
    try {
      const data = await apiClient.post<{ url: string; passcode: string; token: string }>('/owner-survey/create', {
        restaurant_slug: slug,
        question_limit: surveyLimit,
        expires_in_days: surveyExpDays,
      })
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      setSurveyResult({ url: `${baseUrl}/verify/${data.token}`, passcode: data.passcode })
      toast('success', 'サーベイを作成しました')
    } catch (err) {
      console.error('Survey creation failed:', err)
      toast('error', 'サーベイ作成に失敗しました')
    } finally {
      setCreatingSurvey(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast('success', 'コピーしました')
  }

  // Overall progress
  const allQuestions = phases.flatMap(p => p.questions)
  const totalQuestions = allQuestions.length
  const answeredCount = allQuestions.filter(q => {
    const a = answers[q.id]
    if (!a) return false
    if (q.type === 'multi') return Array.isArray(a.value) && a.value.length > 0
    if (q.type === 'table') return typeof a.value === 'string' && a.value !== '' && a.value !== '{}'
    return typeof a.value === 'string' && a.value !== ''
  }).length

  if (loading) {
    return (
      <AdminLayout title="店舗知識">
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>読み込み中...</div>
      </AdminLayout>
    )
  }

  if (!slug) {
    return (
      <AdminLayout title="店舗知識">
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>レストランが見つかりません</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="店舗知識">
      {/* Header */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>NFG構築ヒアリングシート</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              {slug}{businessType ? ` (${businessType})` : ''} — 回答するとアレルゲン精度が向上します
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setSurveyResult(null); setShowSurveyModal(true) }}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                color: '#3B82F6',
                border: '1px solid #3B82F6',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              オーナーサーベイ作成
            </button>
            <button
              onClick={handleSave}
              disabled={saving || answeredCount === 0}
              style={{
                padding: '10px 24px',
                background: saving ? '#475569' : '#3B82F6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: saving || answeredCount === 0 ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                opacity: answeredCount === 0 ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
        <ProgressBar filled={answeredCount} total={totalQuestions} />
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
          {answeredCount === 0 ? '未回答' : `${answeredCount}問回答済み / 全${totalQuestions}問`}
          {existingItems.length > 0 && ` (DB: ${existingItems.length}件)`}
        </div>
      </div>

      {/* Phases */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {phases.map((phase, i) => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            answers={answers}
            onAnswer={handleAnswer}
            defaultOpen={i === 0}
          />
        ))}
      </div>

      {/* Floating save button on mobile */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 50,
      }}>
        <button
          onClick={handleSave}
          disabled={saving || answeredCount === 0}
          style={{
            padding: '12px 28px',
            background: saving ? '#475569' : 'linear-gradient(135deg, #3B82F6, #06B6D4)',
            color: '#fff',
            border: 'none',
            borderRadius: 28,
            cursor: saving || answeredCount === 0 ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
            opacity: answeredCount === 0 ? 0.5 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          {saving ? '保存中...' : `保存 (${answeredCount}問)`}
        </button>
      </div>
      {/* Survey creation modal */}
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
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>オーナーサーベイ作成</h3>
            <p style={{ fontSize: 13, color: 'var(--muted, #94A3B8)', marginBottom: 16 }}>
              {slug} のメニュー確認URLを発行します
            </p>

            {!surveyResult ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>質問数</label>
                  <input
                    type="number" min={5} max={50} value={surveyLimit}
                    onChange={e => setSurveyLimit(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '8px 12px',
                      background: 'var(--bg-input, #0F172A)', color: 'var(--text, #fff)',
                      border: '1px solid var(--border-strong, #475569)', borderRadius: 8, fontSize: 14,
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>有効期限（日数）</label>
                  <input
                    type="number" min={1} max={30} value={surveyExpDays}
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
                  }}>キャンセル</button>
                  <button onClick={handleCreateSurvey} disabled={creatingSurvey} style={{
                    padding: '8px 16px', background: '#3B82F6', color: '#fff',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    opacity: creatingSurvey ? 0.6 : 1,
                  }}>{creatingSurvey ? '作成中...' : '作成'}</button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  background: 'var(--bg-input, #0F172A)', borderRadius: 8, padding: 16, marginBottom: 12,
                }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>URL</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ fontSize: 12, flex: 1, wordBreak: 'break-all', color: '#3B82F6' }}>
                        {surveyResult.url}
                      </code>
                      <button onClick={() => copyToClipboard(surveyResult.url)} style={{
                        padding: '4px 10px', background: '#334155', color: '#fff', border: 'none',
                        borderRadius: 6, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
                      }}>コピー</button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>パスコード</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ fontSize: 20, fontWeight: 700, letterSpacing: 4 }}>
                        {surveyResult.passcode}
                      </code>
                      <button onClick={() => copyToClipboard(surveyResult.passcode)} style={{
                        padding: '4px 10px', background: '#334155', color: '#fff', border: 'none',
                        borderRadius: 6, cursor: 'pointer', fontSize: 12,
                      }}>コピー</button>
                    </div>
                  </div>
                </div>
                <button onClick={() => {
                  const msg = `メニュー確認のお願い\n\nURL: ${surveyResult.url}\nパスコード: ${surveyResult.passcode}\n\n上のURLを開いてパスコードを入力すると、メニューの確認ができます。`
                  copyToClipboard(msg)
                }} style={{
                  width: '100%', padding: '10px', background: '#16A34A', color: '#fff',
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  marginBottom: 8,
                }}>LINE送信用テキストをコピー</button>
                <button onClick={() => setShowSurveyModal(false)} style={{
                  width: '100%', padding: '8px', background: 'transparent', color: 'var(--muted)',
                  border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                }}>閉じる</button>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
