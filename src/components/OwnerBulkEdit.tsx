'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { OwnerChatApi, type OwnerEditChange, type OwnerEditProposal } from '../services/api'

// チャットベース メニュー一括編集。
// ①店主の自然言語指示→LLMが構造化変更案に変換(interpret・DB書込なし)
// ②変更カードでプレビュー+曖昧点は選択肢で確認
// ③店主が「反映する」をタップ→決定論コードで反映(apply・LLM不在)
// 入力バーは常時表示(このフローでは自由入力が主役)。

type Msg =
  | { kind: 'owner'; text: string }
  | { kind: 'ai'; text: string }
  | { kind: 'proposal'; proposal: OwnerEditProposal }
  | { kind: 'result'; lines: string[]; count: number }

type OwnerBulkEditProps = {
  sessionToken: string
  onClose: () => void
  onSessionExpired?: () => void
}

function changeLines(c: OwnerEditChange): string[] {
  const lines: string[] = []
  if (c.set_price !== undefined && c.set_price !== null) lines.push(`価格 → ¥${c.set_price.toLocaleString()}`)
  if (c.set_status === false) lines.push('提供停止(非表示)')
  if (c.set_status === true) lines.push('提供再開')
  if (c.set_description) lines.push(`説明 → ${c.set_description.slice(0, 40)}${c.set_description.length > 40 ? '…' : ''}`)
  if (c.add_ingredients?.length) lines.push(`原材料追加: ${c.add_ingredients.join('、')}`)
  if (c.add_allergens?.length) lines.push(`アレルゲン追加: ${c.add_allergens.join('、')}`)
  if (c.remove_allergens?.length) lines.push(`アレルゲン削除: ${c.remove_allergens.join('、')}`)
  return lines
}

export default function OwnerBulkEdit({ sessionToken, onClose, onSessionExpired }: OwnerBulkEditProps) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [inputText, setInputText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 確認質問ラリーの文脈(指示+これまでの回答)
  const [pendingInstruction, setPendingInstruction] = useState<string | null>(null)
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([])
  // 反映済みの変更案(反映ボタンを消して二重タップを防ぐ)
  const [appliedProposals, setAppliedProposals] = useState<OwnerEditProposal[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isUnauthorized = (e: unknown) => e instanceof Error && e.message === 'unauthorized'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, busy])

  const lastProposal = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.kind === 'proposal') return m.proposal
    }
    return null
  })()
  const openQuestions = lastProposal?.questions ?? []

  const runInterpret = async (instruction: string, qa: { question: string; answer: string }[]) => {
    setBusy(true)
    setError(null)
    try {
      const proposal = await OwnerChatApi.editInterpret(sessionToken, instruction, qa.length ? qa : undefined)
      if (proposal.changes.length === 0 && proposal.questions.length === 0) {
        setMessages(prev => [...prev, {
          kind: 'ai',
          text: proposal.unmatched.length
            ? `「${proposal.unmatched.join('」「')}」はメニューに見つかりませんでした。品名を確かめてもう一度お願いします。(新しい品の追加は「今日の献立」からできます)`
            : '変更内容を読み取れませんでした。「生ビール120円アップ」のように品名と変更を一緒に話しかけてください。',
        }])
        setPendingInstruction(null)
        setAnswers([])
      } else {
        setMessages(prev => [...prev, { kind: 'proposal', proposal }])
        setPendingInstruction(instruction)
        setAnswers(qa)
      }
    } catch (e: unknown) {
      if (isUnauthorized(e)) { onSessionExpired?.(); return }
      setError('読み取りに失敗しました。もう一度お試しください。')
    } finally {
      setBusy(false)
    }
  }

  const submitInstruction = () => {
    const text = inputText.trim()
    if (!text || busy) return
    setInputText('')
    setMessages(prev => [...prev, { kind: 'owner', text }])
    // 新しい指示はラリーをリセット
    runInterpret(text, [])
  }

  const answerQuestion = (question: string, answer: string) => {
    if (!pendingInstruction || busy) return
    setMessages(prev => [...prev, { kind: 'owner', text: answer }])
    runInterpret(pendingInstruction, [...answers, { question, answer }])
  }

  const applyChanges = async (proposal: OwnerEditProposal) => {
    if (busy || proposal.changes.length === 0) return
    setBusy(true)
    setError(null)
    try {
      const res = await OwnerChatApi.editApply(sessionToken, proposal.changes)
      const lines = res.results.map(r =>
        r.ok
          ? `${r.menu_name}: ${(r.applied || []).join(' / ') || '変更なし'}`
          : `${r.menu_name || r.menu_uid}: 失敗(${r.error})`
      )
      setMessages(prev => [...prev, { kind: 'result', lines, count: res.applied_count }])
      setAppliedProposals(prev => [...prev, proposal])
      setPendingInstruction(null)
      setAnswers([])
    } catch (e: unknown) {
      if (isUnauthorized(e)) { onSessionExpired?.(); return }
      setError('反映に失敗しました。もう一度お試しください。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="owner-qa">
        <div className="owner-qa-bubble owner-qa-bubble-ai">
          直したいことを、そのまま話しかけてください。まとめてでも大丈夫です。
          <span className="owner-daily-note">
            例:「生ビールと瓶ビールは120円アップ」「秋刀魚の塩焼きは今日で終了」「カニ玉は小麦粉を使ってるので原材料に追加」
          </span>
        </div>

        {messages.map((m, idx) => {
          if (m.kind === 'owner') {
            return <div key={idx} className="owner-qa-bubble owner-qa-bubble-owner">{m.text}</div>
          }
          if (m.kind === 'ai') {
            return <div key={idx} className="owner-qa-bubble owner-qa-bubble-ai">{m.text}</div>
          }
          if (m.kind === 'result') {
            return (
              <div key={idx} className="owner-qa-item">
                <div className="owner-qa-bubble owner-qa-bubble-ai">
                  <span className="owner-qa-menu"><Check size={14} strokeWidth={2.5} /> {m.count}品に反映しました</span>
                  {m.lines.map((l, i) => <span key={i} className="owner-daily-active-list">{l}</span>)}
                </div>
              </div>
            )
          }
          // proposal: 変更カード+確認質問。最後のproposalだけ操作可能
          const isLast = m.proposal === lastProposal
          const p = m.proposal
          return (
            <div key={idx} className="owner-qa-item">
              <div className="owner-qa-bubble owner-qa-bubble-ai">
                {p.summary || 'この内容で反映します。確認してください。'}
              </div>
              <div className="owner-daily-drafts">
                {p.changes.map((c, ci) => (
                  <div key={ci} className="owner-daily-draft">
                    <div className="owner-edit-card-name">{c.menu_name}</div>
                    {changeLines(c).map((l, li) => (
                      <div key={li} className="owner-edit-card-line">{l}</div>
                    ))}
                  </div>
                ))}
              </div>
              {p.unmatched.length > 0 && (
                <div className="owner-daily-warn">⚠ 見つからなかった品: {p.unmatched.join('、')}</div>
              )}
              {isLast && p.questions.length > 0 && (
                <div className="owner-qa-item">
                  {p.questions.map((q, qi) => (
                    <div key={qi}>
                      <div className="owner-qa-bubble owner-qa-bubble-ai">{q.question}</div>
                      <div className="owner-qa-options">
                        {(q.options || []).map((opt, oi) => (
                          <button key={oi} type="button" className="owner-qa-opt" disabled={busy}
                            onClick={() => answerQuestion(q.question, opt)}>
                            <span className="owner-qa-opt-num">{oi + 1}</span>{opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isLast && !appliedProposals.includes(p) && p.questions.length === 0 && p.changes.length > 0 && (
                <div className="owner-qa-options">
                  <button type="button" className="owner-qa-opt" disabled={busy} onClick={() => applyChanges(p)}>
                    <Check size={15} strokeWidth={2.5} /> この内容で反映する({p.changes.length}品)
                  </button>
                  <button type="button" className="owner-qa-opt owner-qa-opt-sub" disabled={busy}
                    onClick={() => { setPendingInstruction(null); setAnswers([]); setMessages(prev => [...prev, { kind: 'ai', text: '取りやめました。言い直してもらえれば作り直します。' }]) }}>
                    やめる
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {busy && (
          <div className="owner-qa-bubble owner-qa-bubble-ai owner-qa-loading">
            読み取っています
            <span className="typing-indicator"><span /><span /><span /></span>
          </div>
        )}

        {error && <div className="owner-qa-error">{error}</div>}
        <div ref={bottomRef} />
      </div>

      {/* このフローでは自由入力が主役: 入力バー常時表示 */}
      <div className="owner-input-bar">
        <textarea
          ref={inputRef}
          className="owner-input-field"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitInstruction() }
          }}
          placeholder="例: 生ビールと瓶ビールは120円アップ"
          maxLength={1000}
          rows={1}
        />
        <button type="button" className="owner-input-cancel" onClick={onClose} aria-label="閉じる">
          <X size={18} strokeWidth={2} />
        </button>
        <button type="button" className="owner-input-send" disabled={busy || !inputText.trim()} onClick={submitInstruction}>
          送信
        </button>
      </div>
    </>
  )
}
