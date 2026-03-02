'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api'

interface Question {
  menu_uid: string
  menu_name: string
  field: string
  question: string
  current_value: string | string[]
  priority: number
}

interface Allergen {
  uid: string
  name_en: string
  name_jp: string
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

async function fetchQuestions(token: string, sessionToken: string) {
  const res = await fetch(`${API}/owner-survey/${token}/questions`, {
    headers: { 'X-Survey-Token': sessionToken },
  })
  if (!res.ok) throw new Error('Failed to fetch questions')
  return res.json()
}

async function submitAnswer(
  token: string,
  sessionToken: string,
  body: {
    menu_uid: string
    field: string
    action: string
    corrected_value?: unknown
    respondent_name?: string
    respondent_role?: string
  }
) {
  const res = await fetch(`${API}/owner-survey/${token}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Survey-Token': sessionToken },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to submit answer')
  return res.json()
}

async function fetchAllergens(): Promise<{ mandatory: Allergen[]; recommended: Allergen[] }> {
  const res = await fetch(`${API}/allergens/`)
  if (!res.ok) return { mandatory: [], recommended: [] }
  return res.json()
}

// --- Components ---
function Logo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb', letterSpacing: -1 }}>
        NGraph
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>メニュー確認</div>
    </div>
  )
}

// --- Main Page ---
export default function VerifyPage() {
  const params = useParams()
  const token = params.token as string

  const [step, setStep] = useState<'passcode' | 'questions' | 'done'>('passcode')
  const [sessionToken, setSessionToken] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [questionLimit, setQuestionLimit] = useState(20)

  // Passcode
  const [passcode, setPasscode] = useState('')
  const [passcodeError, setPasscodeError] = useState('')
  const [loading, setLoading] = useState(false)

  // Respondent
  const [respondentName, setRespondentName] = useState('')
  const [respondentRole, setRespondentRole] = useState('')
  const [nameSubmitted, setNameSubmitted] = useState(false)

  // Correction mode
  const [correcting, setCorrecting] = useState(false)
  const [correctionValue, setCorrectionValue] = useState<string | string[]>('')
  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])

  const loadAllergens = useCallback(async () => {
    const data = await fetchAllergens()
    setAllergens([...(data.mandatory || []), ...(data.recommended || [])])
  }, [])

  // Passcode submit
  const handlePasscodeSubmit = async () => {
    if (!passcode.trim()) return
    setLoading(true)
    setPasscodeError('')
    try {
      const data = await surveyAuth(token, passcode.trim())
      setSessionToken(data.session_token)
      setRestaurantName(data.restaurant_name)
      setQuestionLimit(data.question_limit)

      const qData = await fetchQuestions(token, data.session_token)
      setQuestions(qData.questions || [])
      setAnsweredCount(qData.answers_count || 0)
      setStep('questions')
      loadAllergens()
    } catch (e: unknown) {
      setPasscodeError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const currentQ = questions[currentIdx]

  // Answer handlers
  const handleConfirm = async () => {
    if (!currentQ) return
    setLoading(true)
    try {
      await submitAnswer(token, sessionToken, {
        menu_uid: currentQ.menu_uid,
        field: currentQ.field,
        action: 'confirm',
        respondent_name: !nameSubmitted ? respondentName : undefined,
        respondent_role: !nameSubmitted ? respondentRole : undefined,
      })
      if (!nameSubmitted && respondentName) setNameSubmitted(true)
      setAnsweredCount(c => c + 1)
      advance()
    } catch {
      alert('送信に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleCorrect = async () => {
    if (!currentQ) return
    setLoading(true)
    let value: unknown = correctionValue
    if (currentQ.field === 'allergens') {
      value = selectedAllergens
    } else if (currentQ.field === 'ingredients' && typeof correctionValue === 'string') {
      value = correctionValue.split(/[,、]/).map(s => s.trim()).filter(Boolean)
    }
    try {
      await submitAnswer(token, sessionToken, {
        menu_uid: currentQ.menu_uid,
        field: currentQ.field,
        action: 'correct',
        corrected_value: value,
        respondent_name: !nameSubmitted ? respondentName : undefined,
        respondent_role: !nameSubmitted ? respondentRole : undefined,
      })
      if (!nameSubmitted && respondentName) setNameSubmitted(true)
      setAnsweredCount(c => c + 1)
      setCorrecting(false)
      advance()
    } catch {
      alert('送信に失敗しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    advance()
  }

  const advance = () => {
    setCorrecting(false)
    setCorrectionValue('')
    setSelectedAllergens([])
    if (currentIdx + 1 >= questions.length) {
      setStep('done')
    } else {
      setCurrentIdx(i => i + 1)
    }
  }

  // Open correction
  const openCorrection = () => {
    setCorrecting(true)
    if (currentQ.field === 'allergens') {
      const current = Array.isArray(currentQ.current_value) ? currentQ.current_value : []
      // Map JP names to EN names for the API
      const selected = allergens
        .filter(a => current.includes(a.name_jp))
        .map(a => a.name_en)
      setSelectedAllergens(selected)
    } else if (currentQ.field === 'ingredients') {
      const current = Array.isArray(currentQ.current_value) ? currentQ.current_value.join(', ') : ''
      setCorrectionValue(current)
    } else {
      setCorrectionValue(typeof currentQ.current_value === 'string' ? currentQ.current_value : '')
    }
  }

  const toggleAllergen = (nameEn: string) => {
    setSelectedAllergens(prev =>
      prev.includes(nameEn) ? prev.filter(a => a !== nameEn) : [...prev, nameEn]
    )
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
    cursor: 'pointer', opacity: loading ? 0.6 : 1,
  }
  const btnSuccess: React.CSSProperties = {
    ...btnPrimary, background: '#16a34a',
  }
  const btnDanger: React.CSSProperties = {
    ...btnPrimary, background: '#dc2626',
  }
  const btnGhost: React.CSSProperties = {
    ...btnPrimary, background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 16, boxSizing: 'border-box',
  }

  // --- STEP 1: Passcode ---
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
          <button onClick={handlePasscodeSubmit} disabled={loading || !passcode} style={btnPrimary}>
            {loading ? '確認中...' : '確認する'}
          </button>
        </div>
      </div>
    )
  }

  // --- STEP 3: Done ---
  if (step === 'done') {
    return (
      <div style={containerStyle}>
        <div style={{ ...cardStyle, marginTop: 60, textAlign: 'center' }}>
          <Logo />
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>ありがとうございました</h2>
          <p style={{ color: '#475569', marginBottom: 8 }}>
            {restaurantName} のメニュー確認が完了しました。
          </p>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            回答数: {answeredCount}件
          </p>
        </div>
      </div>
    )
  }

  // --- STEP 2: Questions ---
  const progress = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0

  return (
    <div style={containerStyle}>
      <Logo />

      {/* Restaurant name */}
      <p style={{ textAlign: 'center', fontWeight: 600, fontSize: 16, marginBottom: 16, color: '#1e293b' }}>
        {restaurantName}
      </p>

      {/* Respondent name (first time) */}
      {!nameSubmitted && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>回答者情報</p>
          <input
            placeholder="お名前"
            value={respondentName}
            onChange={e => setRespondentName(e.target.value)}
            style={{ ...inputStyle, marginBottom: 8 }}
          />
          <select
            value={respondentRole}
            onChange={e => setRespondentRole(e.target.value)}
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

      {/* Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 4 }}>
          <span>{currentIdx + 1} / {questions.length}</span>
          <span>回答済み: {answeredCount}</span>
        </div>
        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#2563eb', borderRadius: 3, width: `${progress}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Question Card */}
      {currentQ && (
        <div style={cardStyle}>
          <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{currentQ.menu_name}</p>
          <p style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>
            {currentQ.field === 'allergens' ? 'アレルゲン' : currentQ.field === 'ingredients' ? '材料' : '説明文'}
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 16, color: '#1e293b' }}>
            {currentQ.question}
          </p>

          {/* Current value display */}
          {currentQ.current_value && (
            <div style={{ background: '#f1f5f9', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>現在のデータ:</p>
              <p style={{ fontSize: 14, color: '#1e293b' }}>
                {Array.isArray(currentQ.current_value)
                  ? currentQ.current_value.join(', ') || '（データなし）'
                  : currentQ.current_value || '（データなし）'}
              </p>
            </div>
          )}

          {/* Correction form */}
          {correcting ? (
            <div style={{ marginBottom: 16 }}>
              {currentQ.field === 'allergens' ? (
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                    正しいアレルゲンを選択してください:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {allergens.map(a => (
                      <label
                        key={a.uid}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '6px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                          background: selectedAllergens.includes(a.name_en) ? '#dbeafe' : '#f1f5f9',
                          border: selectedAllergens.includes(a.name_en) ? '1px solid #2563eb' : '1px solid #e2e8f0',
                          color: selectedAllergens.includes(a.name_en) ? '#1d4ed8' : '#475569',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAllergens.includes(a.name_en)}
                          onChange={() => toggleAllergen(a.name_en)}
                          style={{ display: 'none' }}
                        />
                        {a.name_jp}
                      </label>
                    ))}
                  </div>
                  <button onClick={handleCorrect} disabled={loading} style={{ ...btnPrimary, marginTop: 12 }}>
                    {loading ? '送信中...' : 'この内容で修正'}
                  </button>
                </div>
              ) : currentQ.field === 'ingredients' ? (
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                    正しい材料をカンマ区切りで入力:
                  </p>
                  <input
                    value={typeof correctionValue === 'string' ? correctionValue : ''}
                    onChange={e => setCorrectionValue(e.target.value)}
                    placeholder="例: えび, 小麦粉, 卵"
                    style={{ ...inputStyle, marginBottom: 12 }}
                  />
                  <button
                    onClick={handleCorrect}
                    disabled={loading}
                    style={btnPrimary}
                  >
                    {loading ? '送信中...' : 'この内容で修正'}
                  </button>
                </div>
              ) : (
                <div>
                  <textarea
                    value={typeof correctionValue === 'string' ? correctionValue : ''}
                    onChange={e => setCorrectionValue(e.target.value)}
                    rows={4}
                    placeholder="正しい説明文を入力"
                    style={{ ...inputStyle, resize: 'vertical', marginBottom: 12 }}
                  />
                  <button onClick={handleCorrect} disabled={loading} style={btnPrimary}>
                    {loading ? '送信中...' : 'この内容で修正'}
                  </button>
                </div>
              )}
              <button onClick={() => setCorrecting(false)} style={{ ...btnGhost, marginTop: 8 }}>
                キャンセル
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={handleConfirm} disabled={loading} style={btnSuccess}>
                {loading ? '送信中...' : '合ってる'}
              </button>
              <button onClick={openCorrection} disabled={loading} style={btnDanger}>
                違う
              </button>
              <button onClick={handleSkip} disabled={loading} style={btnGhost}>
                スキップ
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
