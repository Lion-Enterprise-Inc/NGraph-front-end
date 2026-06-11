'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Check, X } from 'lucide-react'
import { OwnerChatApi, type DailyDraftItem, type DailyActiveItem } from '../services/api'

// 店主モードの「今日の献立」登録フロー。チャット風の見た目だが LLM は介在せず、
// 写真/テキスト→AI抽出(draft)→店主が確認・修正→確定(confirm)、を FE が決定論的に進める。
// 確定時に昨日までの日替わりは自動でストック化(BE daily_service.confirm_daily)。
// 「昨日と同じ」はストックから選んで1タップ流用。

type Step = 'menu' | 'extracting' | 'review' | 'reuse' | 'done'

type DoneInfo = {
  saved: number
  deactivated: number
  names: string[]
}

type OwnerDailyMenuProps = {
  sessionToken: string
  onClose: () => void
  /** 401(セッション失効/revoke)時に親へ通知 → 保存セッション破棄+再認証 */
  onSessionExpired?: () => void
}

export default function OwnerDailyMenu({ sessionToken, onClose, onSessionExpired }: OwnerDailyMenuProps) {
  const [step, setStep] = useState<Step>('menu')
  const [active, setActive] = useState<DailyActiveItem[]>([])
  const [stock, setStock] = useState<DailyActiveItem[]>([])
  const [drafts, setDrafts] = useState<DailyDraftItem[]>([])
  const [selectedStock, setSelectedStock] = useState<string[]>([])
  const [done, setDone] = useState<DoneInfo | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [textOpen, setTextOpen] = useState(false)
  const [textInput, setTextInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isUnauthorized = (e: unknown) => e instanceof Error && e.message === 'unauthorized'

  const loadLists = async () => {
    try {
      const [a, s] = await Promise.all([
        OwnerChatApi.dailyActive(sessionToken),
        OwnerChatApi.dailyStock(sessionToken),
      ])
      setActive(a.items)
      setStock(s.items.filter(i => !i.active))
    } catch (e: unknown) {
      if (isUnauthorized(e)) onSessionExpired?.()
    }
  }

  useEffect(() => { loadLists() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [step, drafts.length, error])

  useEffect(() => {
    if (textOpen) inputRef.current?.focus()
  }, [textOpen])

  const extract = async (input: { image?: File; text?: string }) => {
    setStep('extracting')
    setError(null)
    try {
      const res = await OwnerChatApi.dailyDraft(sessionToken, input)
      if (res.items.length === 0) {
        setError('メニューを読み取れませんでした。写真を撮り直すか、品名を入力してください。')
        setStep('menu')
        return
      }
      setDrafts(res.items)
      setStep('review')
    } catch (e: unknown) {
      if (isUnauthorized(e)) { onSessionExpired?.(); return }
      setError('読み取りに失敗しました。もう一度お試しください。')
      setStep('menu')
    } finally {
      setTextOpen(false)
      setTextInput('')
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) extract({ image: file })
    e.target.value = ''
  }

  const submitText = () => {
    const text = textInput.trim()
    if (!text) return
    extract({ text })
  }

  const updateDraft = (idx: number, patch: Partial<DailyDraftItem>) => {
    setDrafts(prev => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)))
  }

  const removeDraft = (idx: number) => {
    setDrafts(prev => prev.filter((_, i) => i !== idx))
  }

  const confirm = async () => {
    if (drafts.length === 0 || submitting) return
    if (drafts.some(d => !d.name_jp?.trim())) {
      setError('料理名が空の品があります。入力するか×で削除してください。')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await OwnerChatApi.dailyConfirm(sessionToken, drafts)
      setDone({ saved: res.items_saved, deactivated: res.deactivated, names: res.menus.map(m => m.name_jp) })
      setDrafts([])
      setStep('done')
      loadLists()
    } catch (e: unknown) {
      if (isUnauthorized(e)) { onSessionExpired?.(); return }
      setError('確定に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStock = (uid: string) => {
    setSelectedStock(prev => prev.includes(uid) ? prev.filter(u => u !== uid) : [...prev, uid])
  }

  const reuse = async () => {
    if (selectedStock.length === 0 || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const names = stock.filter(s => selectedStock.includes(s.uid)).map(s => s.name_jp)
      const res = await OwnerChatApi.dailyReuse(sessionToken, selectedStock)
      setDone({ saved: res.reactivated, deactivated: res.deactivated, names })
      setSelectedStock([])
      setStep('done')
      loadLists()
    } catch (e: unknown) {
      if (isUnauthorized(e)) { onSessionExpired?.(); return }
      setError('反映に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="owner-qa">
        {/* 現在の状態 */}
        <div className="owner-qa-bubble owner-qa-bubble-ai">
          {active.length > 0 ? (
            <>
              今日の献立は現在 {active.length} 品出ています。
              <span className="owner-daily-active-list">
                {active.map(m => m.name_jp).join('、')}
              </span>
              新しく登録すると入れ替わります（前の品は消えずにストックに残ります）。
            </>
          ) : (
            <>今日の献立を教えてください。写真を撮るのが一番かんたんです。</>
          )}
        </div>

        {step === 'menu' && (
          <div className="owner-qa-options">
            <button type="button" className="owner-qa-opt" onClick={() => fileRef.current?.click()}>
              <Camera size={15} strokeWidth={2} /> 写真を撮る・選ぶ
            </button>
            <button type="button" className="owner-qa-opt" onClick={() => { setTextOpen(true) }}>
              品名を入力する
            </button>
            {stock.length > 0 && (
              <button type="button" className="owner-qa-opt" onClick={() => setStep('reuse')}>
                前に出した品から選ぶ({stock.length})
              </button>
            )}
            <button type="button" className="owner-qa-opt owner-qa-opt-sub" onClick={onClose}>閉じる</button>
          </div>
        )}

        {step === 'extracting' && (
          <div className="owner-qa-bubble owner-qa-bubble-ai owner-qa-loading">
            読み取っています。10秒ほどお待ちください
            <span className="typing-indicator"><span /><span /><span /></span>
          </div>
        )}

        {step === 'review' && (
          <div className="owner-qa-item">
            <div className="owner-qa-bubble owner-qa-bubble-ai">
              {drafts.length}品を読み取りました。名前と価格を確認して、間違いがあれば直してください。
            </div>
            <div className="owner-daily-drafts">
              {drafts.map((d, idx) => {
                const meaningQs = d.clarification_needed ?? []
                return (
                  <div key={idx} className="owner-daily-draft">
                    <div className="owner-daily-draft-row">
                      <input
                        className="owner-daily-input owner-daily-input-name"
                        value={d.name_jp || ''}
                        placeholder="料理名"
                        onChange={e => updateDraft(idx, { name_jp: e.target.value })}
                      />
                      <input
                        className="owner-daily-input owner-daily-input-price"
                        type="number"
                        inputMode="numeric"
                        value={d.price ? d.price : ''}
                        placeholder="価格"
                        onChange={e => updateDraft(idx, { price: Number(e.target.value) })}
                      />
                      <button type="button" className="owner-daily-remove" onClick={() => removeDraft(idx)} aria-label="削除">
                        <X size={16} strokeWidth={2} />
                      </button>
                    </div>
                    {(!d.price || d.price <= 0) && (
                      <div className="owner-daily-warn">⚠ 価格が読み取れませんでした</div>
                    )}
                    {meaningQs.map((q, qi) => (
                      <div key={qi} className="owner-daily-warn">⚠ {q.question}</div>
                    ))}
                  </div>
                )
              })}
            </div>
            {/* 読み取られなかった品の追記(2026-06-11店主フィードバック: 修正・追記の導線がない) */}
            <button
              type="button"
              className="owner-daily-add"
              disabled={submitting}
              onClick={() => setDrafts(prev => [...prev, {
                name_jp: '', name_en: '', price: 0, description: '',
                category: 'other', ingredients: [], allergens: [],
              }])}
            >
              ＋ 品を追加（読み取られなかった品）
            </button>
            <div className="owner-qa-options">
              <button type="button" className="owner-qa-opt" disabled={submitting || drafts.length === 0} onClick={confirm}>
                {submitting ? (
                  <>登録しています<span className="typing-indicator"><span /><span /><span /></span></>
                ) : (
                  <><Check size={15} strokeWidth={2.5} /> この内容で今日の献立にする</>
                )}
              </button>
              <button type="button" className="owner-qa-opt owner-qa-opt-sub" disabled={submitting}
                onClick={() => { setDrafts([]); setStep('menu') }}>
                やり直す
              </button>
            </div>
          </div>
        )}

        {step === 'reuse' && (
          <div className="owner-qa-item">
            <div className="owner-qa-bubble owner-qa-bubble-ai">
              前に出した品です。今日も出すものをタップして選んでください。
            </div>
            <div className="owner-daily-drafts">
              {stock.map(m => {
                const sel = selectedStock.includes(m.uid)
                return (
                  <button key={m.uid} type="button"
                    className={`owner-daily-stock${sel ? ' selected' : ''}`}
                    onClick={() => toggleStock(m.uid)}>
                    <span>{sel ? '✓ ' : ''}{m.name_jp}</span>
                    <span className="owner-daily-stock-price">¥{(m.price ?? 0).toLocaleString()}</span>
                  </button>
                )
              })}
            </div>
            <div className="owner-qa-options">
              <button type="button" className="owner-qa-opt" disabled={submitting || selectedStock.length === 0} onClick={reuse}>
                <Check size={15} strokeWidth={2.5} /> {selectedStock.length > 0 ? `選んだ${selectedStock.length}品を今日出す` : '品をタップして選ぶ'}
              </button>
              <button type="button" className="owner-qa-opt owner-qa-opt-sub" disabled={submitting}
                onClick={() => { setSelectedStock([]); setStep('menu') }}>
                戻る
              </button>
            </div>
          </div>
        )}

        {step === 'done' && done && (
          <div className="owner-qa-item">
            <div className="owner-qa-bubble owner-qa-bubble-ai">
              <span className="owner-qa-menu"><Check size={14} strokeWidth={2.5} /> {done.saved}品を今日の献立にしました。</span>
              {done.names.join('、')}
              {done.deactivated > 0 && `（前の${done.deactivated}品はストックに移しました）`}
              <span className="owner-daily-note">
                詳しい説明や翻訳はAIがこれから作ります。分からない点があれば後ほど質問させてください。
              </span>
            </div>
            <div className="owner-qa-options">
              <button type="button" className="owner-qa-opt" onClick={() => { setDone(null); setStep('menu') }}>続けて登録する</button>
              <button type="button" className="owner-qa-opt owner-qa-opt-sub" onClick={onClose}>閉じる</button>
            </div>
          </div>
        )}

        {error && <div className="owner-qa-error">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

      {/* テキスト入力は画面下固定バー(OwnerQuestionFlowと同じ操作感) */}
      {textOpen && (
        <div className="owner-input-bar">
          <textarea
            ref={inputRef}
            className="owner-input-field"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitText() }
            }}
            placeholder="例: 鯖の味噌煮 980円、肉じゃが 780円"
            maxLength={500}
            rows={1}
          />
          <button type="button" className="owner-input-cancel" onClick={() => { setTextOpen(false); setTextInput('') }} aria-label="閉じる">
            <X size={18} strokeWidth={2} />
          </button>
          <button type="button" className="owner-input-send" disabled={!textInput.trim()} onClick={submitText}>
            送信
          </button>
        </div>
      )}
    </>
  )
}
