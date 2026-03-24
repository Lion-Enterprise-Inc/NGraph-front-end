'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api'

// --- Types ---
interface KitchenQuestionOption {
  value: string
  label: string
}

interface KitchenQuestionMenuItem {
  uid: string
  name: string
}

interface KitchenQuestion {
  id: string
  question: string
  type: string
  options: KitchenQuestionOption[] | null
  affected_menu_count: number
  is_branch: boolean
  parent_id: string | null
  max_select?: number
  menu_list?: KitchenQuestionMenuItem[]
}

interface DishQuestionOption {
  value: string
  label: string
}

interface DishQuestion {
  index: number
  template: string
  question: string
  menu_uids: string[]
  menu_names: string[]
  type: string
  options: DishQuestionOption[] | null
  max_select?: number
}

interface VariesMenuItem {
  menu_uid: string
  menu_name: string
}

interface NamingMenuInfo {
  uid: string
  name: string
  price: number | null
  category: string | null
}

interface NamingQuestion {
  index: number
  pair_id: string
  question: string
  reason: string
  menu_a: NamingMenuInfo
  menu_b: NamingMenuInfo
  options: { value: string; label: string }[]
}

interface CompletionSummaryItem {
  label: string
  value: string
}

interface PhaseResponse {
  restaurant_name: string
  phase: string
  kitchen_questions?: KitchenQuestion[]
  dish_questions?: DishQuestion[]
  naming_questions?: NamingQuestion[]
  varies_menus?: VariesMenuItem[]
  completion_summary?: CompletionSummaryItem[]
}

// --- API helpers ---
async function surveyAuth(token: string, passcode: string) {
  const res = await fetch(`${API}/owner-survey/${token}/auth`, {
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

async function fetchQuestions(token: string, sessionToken: string): Promise<PhaseResponse> {
  const res = await fetch(`${API}/owner-survey/${token}/questions`, {
    headers: { 'X-Survey-Token': sessionToken },
  })
  if (!res.ok) throw new Error('Failed to fetch questions')
  return res.json()
}

async function submitKitchenAnswer(
  token: string, sessionToken: string,
  body: {
    question_id: string
    selected_value: string | string[]
    per_item_answers?: Record<string, string>
    supplement_text?: string
    respondent_name?: string
    respondent_role?: string
  }
) {
  const res = await fetch(`${API}/owner-survey/${token}/kitchen-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Survey-Token': sessionToken },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to submit kitchen answer')
  return res.json()
}

async function submitDishAnswer(
  token: string, sessionToken: string,
  body: {
    question_index: number
    template: string
    menu_uids?: string[]
    selected?: string[]
    text_note?: string
    supplement_text?: string
    respondent_name?: string
    respondent_role?: string
  }
) {
  const res = await fetch(`${API}/owner-survey/${token}/dish-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Survey-Token': sessionToken },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to submit dish answer')
  return res.json()
}

async function submitNamingAnswer(
  token: string, sessionToken: string,
  body: {
    pair_id: string
    answer: string
    keep_uid?: string
    respondent_name?: string
    respondent_role?: string
  }
) {
  const res = await fetch(`${API}/owner-survey/${token}/naming-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Survey-Token': sessionToken },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to submit naming answer')
  return res.json()
}

async function fetchVariesMenus(token: string, sessionToken: string, questionId: string): Promise<VariesMenuItem[]> {
  const res = await fetch(`${API}/owner-survey/${token}/varies-menus/${questionId}`, {
    headers: { 'X-Survey-Token': sessionToken },
  })
  if (!res.ok) return []
  return res.json()
}

// --- Shared Styles ---
const containerStyle: React.CSSProperties = {
  maxWidth: 480, margin: '0 auto', padding: '24px 16px',
  minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  background: '#f8fafc',
}
const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 16,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 16, boxSizing: 'border-box',
}

function btnStyle(bg: string, color = '#fff', border?: string): React.CSSProperties {
  return {
    width: '100%', padding: '14px 0', background: bg, color,
    border: border || 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer',
  }
}

// --- Components ---
function Logo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb', letterSpacing: -1 }}>NGraph</div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>料理ヒアリング</div>
    </div>
  )
}

function PhaseIndicator({ phase, hasNaming }: { phase: string; hasNaming?: boolean }) {
  const phases = [
    { key: 'kitchen', label: '厨房' },
    { key: 'dishes', label: '料理' },
    ...(hasNaming ? [{ key: 'naming', label: 'メニュー名' }] : []),
  ]
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 20 }}>
      {phases.map((p, i) => {
        const active = p.key === phase
        const done = phases.findIndex(x => x.key === phase) > i || phase === 'done'
        return (
          <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600,
              background: done ? '#16a34a' : active ? '#2563eb' : '#e2e8f0',
              color: done || active ? '#fff' : '#94a3b8',
            }}>
              {done ? '\u2713' : i + 1}
            </div>
            <span style={{ fontSize: 12, color: active ? '#1e293b' : '#94a3b8', fontWeight: active ? 600 : 400 }}>
              {p.label}
            </span>
            {i < phases.length - 1 && (
              <div style={{ width: 20, height: 2, background: done ? '#16a34a' : '#e2e8f0', marginLeft: 4 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function VerifyContent() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') || ''

  useEffect(() => {
    document.body.style.background = '#f8fafc'
  }, [])

  const [step, setStep] = useState<'passcode' | 'survey' | 'done'>('passcode')
  const [sessionToken, setSessionToken] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [phase, setPhase] = useState<string>('kitchen')
  const [loading, setLoading] = useState(false)

  // Passcode
  const [passcode, setPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState('')

  // Respondent
  const [respondentName, setRespondentName] = useState('')
  const [respondentRole, setRespondentRole] = useState('')
  const [nameSubmitted, setNameSubmitted] = useState(false)

  // Kitchen (Phase 1)
  const [kitchenQuestions, setKitchenQuestions] = useState<KitchenQuestion[]>([])
  const [kitchenIdx, setKitchenIdx] = useState(0)
  const [kitchenSelection, setKitchenSelection] = useState<string[]>([])
  const [kitchenSupplement, setKitchenSupplement] = useState('')
  const [variesMenus, setVariesMenus] = useState<VariesMenuItem[]>([])
  const [variesAnswers, setVariesAnswers] = useState<Record<string, string>>({})
  const [showVaries, setShowVaries] = useState(false)

  // Dishes (Phase 2)
  const [dishQuestions, setDishQuestions] = useState<DishQuestion[]>([])
  const [dishIdx, setDishIdx] = useState(0)
  const [dishSelection, setDishSelection] = useState<string[]>([])
  const [dishTextNote, setDishTextNote] = useState('')
  const [dishSupplement, setDishSupplement] = useState('')

  // Naming (Phase 3)
  const [namingQuestions, setNamingQuestions] = useState<NamingQuestion[]>([])
  const [namingIdx, setNamingIdx] = useState(0)
  const [namingAnswer, setNamingAnswer] = useState('')
  const [namingKeepUid, setNamingKeepUid] = useState('')

  // Done
  const [completionSummary, setCompletionSummary] = useState<CompletionSummaryItem[]>([])

  const respondentInfo = () => {
    if (nameSubmitted) return {}
    return {
      ...(respondentName ? { respondent_name: respondentName } : {}),
      ...(respondentRole ? { respondent_role: respondentRole } : {}),
    }
  }

  const markNameSubmitted = () => {
    if (!nameSubmitted && respondentName) setNameSubmitted(true)
  }

  const applyPhaseData = (data: PhaseResponse) => {
    setRestaurantName(data.restaurant_name)
    setPhase(data.phase)

    if (data.phase === 'kitchen' && data.kitchen_questions) {
      setKitchenQuestions(data.kitchen_questions)
      setKitchenIdx(0)
      setKitchenSelection([])
      setKitchenSupplement('')
      setShowVaries(false)
      setVariesMenus([])
      setVariesAnswers({})
      setStep('survey')
    } else if (data.phase === 'dishes' && data.dish_questions) {
      setDishQuestions(data.dish_questions)
      setDishIdx(0)
      setDishSelection([])
      setDishTextNote('')
      setDishSupplement('')
      setStep('survey')
    } else if (data.phase === 'naming' && data.naming_questions) {
      setNamingQuestions(data.naming_questions)
      setNamingIdx(0)
      setNamingAnswer('')
      setNamingKeepUid('')
      setStep('survey')
    } else if (data.phase === 'done') {
      setCompletionSummary(data.completion_summary || [])
      setStep('done')
    }
  }

  const reloadQuestions = async () => {
    const data = await fetchQuestions(token, sessionToken)
    applyPhaseData(data)
  }

  // --- Passcode submit ---
  const handlePasscodeSubmit = async () => {
    if (!passcode.trim()) return
    setLoading(true)
    setPasscodeError('')
    try {
      const authData = await surveyAuth(token, passcode.trim())
      setSessionToken(authData.session_token)
      const qData = await fetchQuestions(token, authData.session_token)
      applyPhaseData(qData)
    } catch (e: unknown) {
      setPasscodeError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // --- Kitchen answer ---
  const handleKitchenAnswer = async () => {
    const q = kitchenQuestions[kitchenIdx]
    if (!q || kitchenSelection.length === 0) return

    // 「商品によって違う」を選択した場合
    if (kitchenSelection[0] === 'varies' && !showVaries) {
      setLoading(true)
      try {
        const menus = await fetchVariesMenus(token, sessionToken, q.id)
        setVariesMenus(menus)
        setShowVaries(true)
        setVariesAnswers({})
      } catch {
        alert('メニュー一覧の取得に失敗しました')
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    try {
      const selectedValue = (q.type === 'checkbox' || q.type === 'menu_select') ? kitchenSelection : kitchenSelection[0]
      const result = await submitKitchenAnswer(token, sessionToken, {
        question_id: q.id,
        selected_value: selectedValue,
        ...(showVaries ? { per_item_answers: variesAnswers } : {}),
        ...(kitchenSupplement.trim() ? { supplement_text: kitchenSupplement.trim() } : {}),
        ...respondentInfo(),
      })
      markNameSubmitted()

      if (result.phase_complete) {
        await reloadQuestions()
      } else if (kitchenIdx + 1 < kitchenQuestions.length) {
        setKitchenIdx(i => i + 1)
        setKitchenSelection([])
        setKitchenSupplement('')
        setShowVaries(false)
        setVariesMenus([])
        setVariesAnswers({})
      } else {
        await reloadQuestions()
      }
    } catch {
      alert('送信に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleKitchenSkip = () => {
    if (kitchenIdx + 1 < kitchenQuestions.length) {
      setKitchenIdx(i => i + 1)
      setKitchenSelection([])
      setKitchenSupplement('')
      setShowVaries(false)
    } else {
      reloadQuestions()
    }
  }

  // --- Dish answer ---
  const handleDishAnswer = async () => {
    const q = dishQuestions[dishIdx]
    if (!q) return

    setLoading(true)
    try {
      // T5: menu_selectの場合、selectedがmenu_uid
      const result = await submitDishAnswer(token, sessionToken, {
        question_index: q.index,
        template: q.template,
        menu_uids: q.template === 'T5' ? dishSelection : q.menu_uids,
        selected: q.type !== 'text' ? dishSelection : undefined,
        text_note: q.type === 'text' ? dishTextNote : undefined,
        ...(dishSupplement.trim() ? { supplement_text: dishSupplement.trim() } : {}),
        ...respondentInfo(),
      })
      markNameSubmitted()

      if (result.remaining_count === 0) {
        await reloadQuestions()
      } else {
        // T5回答後はreloadしてT6を含める
        if (q.template === 'T5') {
          await reloadQuestions()
        } else if (dishIdx + 1 < dishQuestions.length) {
          setDishIdx(i => i + 1)
          setDishSelection([])
          setDishTextNote('')
          setDishSupplement('')
        } else {
          await reloadQuestions()
        }
      }
    } catch {
      alert('送信に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleDishSkip = () => {
    if (dishIdx + 1 < dishQuestions.length) {
      setDishIdx(i => i + 1)
      setDishSelection([])
      setDishTextNote('')
      setDishSupplement('')
    } else {
      reloadQuestions()
    }
  }

  // --- Render ---
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

  // Passcode
  if (step === 'passcode') {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, marginTop: 60 }}>
          <Logo />
          <p style={{ textAlign: 'center', color: '#475569', marginBottom: 24, fontSize: 14 }}>
            パスコードを入力してください
          </p>
          <input
            type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={6}
            placeholder="パスコード" value={passcode}
            onChange={e => setPasscode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.key === 'Enter' && handlePasscodeSubmit()}
            style={{ ...inputStyle, textAlign: 'center', fontSize: 24, letterSpacing: 8, marginBottom: 16 }}
            autoFocus
          />
          {passcodeError && (
            <p style={{ color: '#dc2626', fontSize: 14, textAlign: 'center', margin: '0 0 12px' }}>{passcodeError}</p>
          )}
          <button onClick={handlePasscodeSubmit} disabled={loading || !passcode} style={{ ...btnStyle('#2563eb'), opacity: loading ? 0.6 : 1 }}>
            {loading ? '確認中...' : '確認する'}
          </button>
        </div>
      </div>
    )
  }

  // Done
  if (step === 'done') {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, marginTop: 40, textAlign: 'center' }}>
          <Logo />
          <div style={{ fontSize: 48, marginBottom: 16, color: '#16a34a' }}>&#10003;</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>ありがとうございます！</h2>
          <p style={{ color: '#475569', marginBottom: 20, lineHeight: 1.6 }}>
            AIがお店の情報を学習中です。<br />処理が完了したらお知らせします。
          </p>

          {completionSummary.length > 0 && (
            <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: '#1e293b' }}>回答いただいた内容:</p>
              {completionSummary.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 14 }}>
                  <span style={{ color: '#16a34a', flexShrink: 0 }}>&#10003;</span>
                  <span style={{ color: '#475569' }}>{item.label}: <strong>{item.value}</strong></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- Survey (2 phases) ---
  return (
    <div style={containerStyle}>
      <Logo />
      <p style={{ textAlign: 'center', fontWeight: 600, fontSize: 16, marginBottom: 8, color: '#1e293b' }}>
        {restaurantName}
      </p>

      <PhaseIndicator phase={phase} hasNaming={namingQuestions.length > 0 || phase === 'naming'} />

      {/* Respondent name (first time) */}
      {!nameSubmitted && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>回答者情報</p>
          <input
            placeholder="お名前" value={respondentName}
            onChange={e => setRespondentName(e.target.value)}
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <select
            value={respondentRole} onChange={e => setRespondentRole(e.target.value)}
            style={{ ...inputStyle, color: respondentRole ? '#1e293b' : '#94a3b8' }}
          >
            <option value="">役職を選択</option>
            <option value="店長">店長</option>
            <option value="料理長">料理長</option>
            <option value="オーナー">オーナー</option>
            <option value="スタッフ">スタッフ</option>
          </select>
        </div>
      )}

      {/* Phase 1: Kitchen */}
      {phase === 'kitchen' && kitchenQuestions.length > 0 && (() => {
        const q = kitchenQuestions[kitchenIdx]
        if (!q) return null

        return (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              <span>Q{kitchenIdx + 1}/{kitchenQuestions.length}</span>
              <span>{q.affected_menu_count}品に反映</span>
            </div>

            {q.is_branch && (
              <div style={{ fontSize: 12, color: '#2563eb', marginBottom: 8, fontWeight: 600 }}>
                ↳ 分岐質問
              </div>
            )}

            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, color: '#1e293b' }}>{q.question}</p>

            {/* menu_select型（看板メニュー選択） */}
            {q.type === 'menu_select' && q.menu_list && (
              <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                {q.menu_list.map(m => {
                  const selected = kitchenSelection.includes(m.uid)
                  const maxReached = (q.max_select || 3) <= kitchenSelection.length && !selected
                  return (
                    <label key={m.uid} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                      borderBottom: '1px solid #f1f5f9', cursor: maxReached ? 'not-allowed' : 'pointer',
                      background: selected ? '#eff6ff' : 'transparent',
                      opacity: maxReached ? 0.5 : 1,
                    }}>
                      <input
                        type="checkbox" checked={selected} disabled={maxReached}
                        onChange={() => {
                          setKitchenSelection(prev => selected ? prev.filter(u => u !== m.uid) : [...prev, m.uid])
                        }}
                        style={{ accentColor: '#2563eb' }}
                      />
                      <span style={{ fontSize: 14, color: '#1e293b' }}>{m.name}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {/* 通常選択肢（radio/checkbox） */}
            {q.type !== 'menu_select' && !showVaries && q.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {q.options.map(opt => {
                  const selected = kitchenSelection.includes(opt.value)
                  return (
                    <label key={opt.value} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                      borderRadius: 8, cursor: 'pointer',
                      background: selected ? '#eff6ff' : '#f8fafc',
                      border: selected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    }}>
                      <input
                        type={q.type === 'checkbox' ? 'checkbox' : 'radio'}
                        checked={selected}
                        onChange={() => {
                          if (q.type === 'checkbox') {
                            setKitchenSelection(prev => selected ? prev.filter(v => v !== opt.value) : [...prev, opt.value])
                          } else {
                            setKitchenSelection([opt.value])
                          }
                        }}
                        style={{ accentColor: '#2563eb' }}
                      />
                      <span style={{ fontSize: 15, color: '#1e293b' }}>{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {/* 「商品によって違う」→品リスト展開 */}
            {showVaries && variesMenus.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#1e293b' }}>
                  商品ごとに選択してください:
                </p>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {variesMenus.map(m => (
                    <div key={m.menu_uid} style={{
                      padding: '10px 12px', borderBottom: '1px solid #f1f5f9',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ fontSize: 14, color: '#1e293b', flex: 1 }}>{m.menu_name}</span>
                      <select
                        value={variesAnswers[m.menu_uid] || ''}
                        onChange={e => setVariesAnswers(prev => ({ ...prev, [m.menu_uid]: e.target.value }))}
                        style={{ ...inputStyle, width: 'auto', minWidth: 120, fontSize: 14, padding: '8px 12px' }}
                      >
                        <option value="">選択</option>
                        {(q.options || []).filter(o => o.value !== 'varies' && o.value !== 'unknown').map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 補足テキスト */}
            <input
              placeholder="補足（任意）"
              value={kitchenSupplement}
              onChange={e => setKitchenSupplement(e.target.value)}
              style={{ ...inputStyle, fontSize: 14, marginBottom: 16 }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleKitchenAnswer}
                disabled={loading || kitchenSelection.length === 0}
                style={{ ...btnStyle('#2563eb'), opacity: loading || kitchenSelection.length === 0 ? 0.5 : 1 }}
              >
                {loading ? '送信中...' : '次へ'}
              </button>
              <button onClick={handleKitchenSkip} disabled={loading} style={{ ...btnStyle('transparent', '#64748b', '1px solid #e2e8f0'), flex: '0 0 auto', width: 'auto', padding: '14px 20px' }}>
                スキップ
              </button>
            </div>
          </div>
        )
      })()}

      {/* Phase 2: Dishes */}
      {phase === 'dishes' && dishQuestions.length > 0 && (() => {
        const q = dishQuestions[dishIdx]
        if (!q) return null

        return (
          <div>
            {/* Progress */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                <span>{dishIdx + 1} / {dishQuestions.length}</span>
                <span>{q.template}</span>
              </div>
              <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#2563eb', borderRadius: 3, width: `${(dishIdx / dishQuestions.length) * 100}%`, transition: 'width 0.3s' }} />
              </div>
            </div>

            <div style={cardStyle}>
              {/* 対象料理名 */}
              {q.menu_names.length > 0 && q.menu_names.length <= 3 && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  {q.menu_names.map((name, i) => (
                    <span key={i} style={{
                      background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 600,
                      padding: '4px 10px', borderRadius: 16,
                    }}>
                      {name}
                    </span>
                  ))}
                </div>
              )}

              <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, color: '#1e293b', lineHeight: 1.5 }}>
                {q.question}
              </p>

              {/* T1, T4, T7: テキスト入力 */}
              {q.type === 'text' && (
                <textarea
                  value={dishTextNote}
                  onChange={e => setDishTextNote(e.target.value)}
                  rows={3}
                  placeholder="自由に記入してください（スキップ可）"
                  style={{ ...inputStyle, resize: 'vertical' as const, marginBottom: 16 }}
                />
              )}

              {/* T3, T6: multi_select */}
              {q.type === 'multi_select' && q.options && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {q.options.map(opt => {
                    const selected = dishSelection.includes(opt.value)
                    return (
                      <label key={opt.value} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 14px',
                        borderRadius: 20, fontSize: 14, cursor: 'pointer',
                        background: selected ? '#dbeafe' : '#f1f5f9',
                        border: selected ? '1px solid #2563eb' : '1px solid #e2e8f0',
                        color: selected ? '#1d4ed8' : '#475569',
                      }}>
                        <input
                          type="checkbox" checked={selected}
                          onChange={() => {
                            setDishSelection(prev => selected ? prev.filter(v => v !== opt.value) : [...prev, opt.value])
                          }}
                          style={{ display: 'none' }}
                        />
                        {opt.label}
                      </label>
                    )
                  })}
                </div>
              )}

              {/* T5: menu_select */}
              {q.type === 'menu_select' && (
                <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                  {q.menu_names.map((name, i) => {
                    const uid = q.menu_uids[i]
                    const selected = dishSelection.includes(uid)
                    const maxReached = (q.max_select || 3) <= dishSelection.length && !selected
                    return (
                      <label key={uid} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                        borderBottom: '1px solid #f1f5f9', cursor: maxReached ? 'not-allowed' : 'pointer',
                        background: selected ? '#eff6ff' : 'transparent',
                        opacity: maxReached ? 0.5 : 1,
                      }}>
                        <input
                          type="checkbox" checked={selected} disabled={maxReached}
                          onChange={() => {
                            setDishSelection(prev => selected ? prev.filter(u => u !== uid) : [...prev, uid])
                          }}
                          style={{ accentColor: '#2563eb' }}
                        />
                        <span style={{ fontSize: 14, color: '#1e293b' }}>{name}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* 補足テキスト */}
              <input
                placeholder="補足（任意）"
                value={dishSupplement}
                onChange={e => setDishSupplement(e.target.value)}
                style={{ ...inputStyle, fontSize: 14, marginBottom: 16 }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleDishAnswer}
                  disabled={loading || (q.type !== 'text' && dishSelection.length === 0)}
                  style={{
                    ...btnStyle('#2563eb'),
                    opacity: loading || (q.type !== 'text' && dishSelection.length === 0) ? 0.5 : 1,
                  }}
                >
                  {loading ? '送信中...' : '次へ'}
                </button>
                <button onClick={handleDishSkip} disabled={loading} style={{ ...btnStyle('transparent', '#64748b', '1px solid #e2e8f0'), flex: '0 0 auto', width: 'auto', padding: '14px 20px' }}>
                  スキップ
                </button>
              </div>

              {/* 戻るボタン */}
              {dishIdx > 0 && (
                <button
                  onClick={() => {
                    setDishIdx(i => i - 1)
                    setDishSelection([])
                    setDishTextNote('')
                    setDishSupplement('')
                  }}
                  disabled={loading}
                  style={{ ...btnStyle('transparent', '#94a3b8', '1px solid #f1f5f9'), marginTop: 8 }}
                >
                  前の質問に戻る
                </button>
              )}
            </div>
          </div>
        )
      })()}

      {/* Phase 3: Naming */}
      {phase === 'naming' && namingQuestions.length > 0 && (() => {
        const q = namingQuestions[namingIdx]
        if (!q) return null

        return (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                <span>{namingIdx + 1} / {namingQuestions.length}</span>
                <span>メニュー名確認</span>
              </div>
              <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#f59e0b', borderRadius: 3, width: `${(namingIdx / namingQuestions.length) * 100}%`, transition: 'width 0.3s' }} />
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, marginBottom: 8 }}>
                {q.reason}
              </div>

              <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, color: '#1e293b', lineHeight: 1.5 }}>
                {q.question}
              </p>

              {/* 2つのメニューを並べて表示 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[q.menu_a, q.menu_b].map(menu => (
                  <div key={menu.uid} style={{
                    flex: 1, padding: 12, borderRadius: 8,
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>
                      {menu.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      {menu.price ? `¥${menu.price.toLocaleString()}` : ''} {menu.category || ''}
                    </div>
                  </div>
                ))}
              </div>

              {/* 同じ / 別メニュー 選択 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {q.options.map(opt => {
                  const selected = namingAnswer === opt.value
                  return (
                    <label key={opt.value} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                      borderRadius: 8, cursor: 'pointer',
                      background: selected ? '#eff6ff' : '#f8fafc',
                      border: selected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    }}>
                      <input
                        type="radio" checked={selected}
                        onChange={() => {
                          setNamingAnswer(opt.value)
                          setNamingKeepUid('')
                        }}
                        style={{ accentColor: '#2563eb' }}
                      />
                      <span style={{ fontSize: 15, color: '#1e293b' }}>{opt.label}</span>
                    </label>
                  )
                })}
              </div>

              {/* 「同じメニュー」→ どちらの名前を残すか */}
              {namingAnswer === 'same' && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#1e293b' }}>
                    どちらの名前を残しますか？
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[q.menu_a, q.menu_b].map(menu => {
                      const selected = namingKeepUid === menu.uid
                      return (
                        <label key={menu.uid} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                          borderRadius: 8, cursor: 'pointer',
                          background: selected ? '#f0fdf4' : '#f8fafc',
                          border: selected ? '2px solid #16a34a' : '1px solid #e2e8f0',
                        }}>
                          <input
                            type="radio" checked={selected}
                            onChange={() => setNamingKeepUid(menu.uid)}
                            style={{ accentColor: '#16a34a' }}
                          />
                          <span style={{ fontSize: 15, color: '#1e293b' }}>{menu.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={async () => {
                    if (!namingAnswer) return
                    if (namingAnswer === 'same' && !namingKeepUid) return
                    setLoading(true)
                    try {
                      const result = await submitNamingAnswer(token, sessionToken, {
                        pair_id: q.pair_id,
                        answer: namingAnswer,
                        keep_uid: namingAnswer === 'same' ? namingKeepUid : undefined,
                        ...respondentInfo(),
                      })
                      markNameSubmitted()

                      if (result.remaining_count === 0) {
                        await reloadQuestions()
                      } else if (namingIdx + 1 < namingQuestions.length) {
                        setNamingIdx(i => i + 1)
                        setNamingAnswer('')
                        setNamingKeepUid('')
                      } else {
                        await reloadQuestions()
                      }
                    } catch {
                      alert('送信に失敗しました。')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading || !namingAnswer || (namingAnswer === 'same' && !namingKeepUid)}
                  style={{
                    ...btnStyle('#2563eb'),
                    opacity: loading || !namingAnswer || (namingAnswer === 'same' && !namingKeepUid) ? 0.5 : 1,
                  }}
                >
                  {loading ? '送信中...' : '次へ'}
                </button>
                <button
                  onClick={() => {
                    if (namingIdx + 1 < namingQuestions.length) {
                      setNamingIdx(i => i + 1)
                      setNamingAnswer('')
                      setNamingKeepUid('')
                    } else {
                      reloadQuestions()
                    }
                  }}
                  disabled={loading}
                  style={{ ...btnStyle('transparent', '#64748b', '1px solid #e2e8f0'), flex: '0 0 auto', width: 'auto', padding: '14px 20px' }}
                >
                  スキップ
                </button>
              </div>

              {namingIdx > 0 && (
                <button
                  onClick={() => {
                    setNamingIdx(i => i - 1)
                    setNamingAnswer('')
                    setNamingKeepUid('')
                  }}
                  disabled={loading}
                  style={{ ...btnStyle('transparent', '#94a3b8', '1px solid #f1f5f9'), marginTop: 8 }}
                >
                  前の質問に戻る
                </button>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ color: '#64748b' }}>読み込み中...</div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
