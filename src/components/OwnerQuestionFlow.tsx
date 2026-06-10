'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronRight, RotateCcw } from 'lucide-react'
import { OwnerChatApi, type OwnerQuestion } from '../services/api'

// 店主モードの質問キュー消化フロー。チャット風の見た目だが LLM は介在せず、
// 質問提示→番号選択肢タップ→反映、を FE が決定論的に進める(LLM任せにしない)。
// 店主は日本語前提なので ja 固定。

const BATCH_SIZE = 3

type HistoryItem = {
  q: OwnerQuestion
  answerLabel: string
  promoted: boolean
  commentSaved?: boolean
  // 取り消し(undo)用にサーバーが返した逆操作情報
  undo: {
    question_obj: Record<string, unknown>
    added_allergens: string[]
    added_ingredients: string[]
    prev_rank: string | null
  }
}

type OwnerQuestionFlowProps = {
  sessionToken: string
  onClose: () => void
  onCountChange?: (remaining: number) => void
  /** 401(30日セッション失効/トークンrevoke)時に親へ通知 → 保存セッション破棄+再認証 */
  onSessionExpired?: () => void
}

export default function OwnerQuestionFlow({ sessionToken, onClose, onCountChange, onSessionExpired }: OwnerQuestionFlowProps) {
  const [queue, setQueue] = useState<OwnerQuestion[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [totalRemaining, setTotalRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [otherText, setOtherText] = useState('')
  const [otherMode, setOtherMode] = useState(false)
  const [commentTarget, setCommentTarget] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isUnauthorized = (e: unknown) => e instanceof Error && e.message === 'unauthorized'

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const res = await OwnerChatApi.questions(sessionToken, BATCH_SIZE)
      setQueue(res.questions)
      setTotalRemaining(res.total_remaining)
      onCountChange?.(res.total_remaining)
    } catch (e: unknown) {
      if (isUnauthorized(e)) {
        onSessionExpired?.()
        return
      }
      setError('質問の取得に失敗しました。通信環境をご確認ください。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQuestions() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [queue, history, otherMode, commentTarget, loading])

  const current = queue[0] ?? null
  const batchDone = !loading && !current && totalRemaining > 0
  const allDone = !loading && !current && totalRemaining === 0

  const submitAnswer = async (selected: string[] | undefined, textNote?: string) => {
    if (!current || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await OwnerChatApi.answer(sessionToken, {
        menu_uid: current.menu_uid,
        question: current.question,
        selected,
        text_note: textNote,
      })
      setHistory(prev => [...prev, {
        q: current,
        answerLabel: selected?.join('、') || textNote || '',
        promoted: res.promoted_to_a,
        undo: {
          question_obj: res.question_obj,
          added_allergens: res.added_allergens,
          added_ingredients: res.added_ingredients,
          prev_rank: res.prev_rank,
        },
      }])
      setQueue(prev => prev.slice(1))
      setTotalRemaining(res.total_remaining)
      onCountChange?.(res.total_remaining)
      setOtherMode(false)
      setOtherText('')
    } catch (e: unknown) {
      if (isUnauthorized(e)) {
        onSessionExpired?.()
        return
      }
      if (e instanceof Error && e.message === 'conflict') {
        // 既に回答済み(応答ロスト後の再送 or 別端末で回答済み) → 成功扱いでキューを進めて同期し直す
        setQueue(prev => prev.slice(1))
        setOtherMode(false)
        setOtherText('')
        fetchQuestions()
        return
      }
      setError('反映に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  const submitComment = async (historyIdx: number) => {
    const item = history[historyIdx]
    const text = commentText.trim()
    if (!item || !text || submitting) return
    setSubmitting(true)
    try {
      await OwnerChatApi.comment(sessionToken, item.q.menu_uid, text)
      setHistory(prev => prev.map((h, i) => i === historyIdx ? { ...h, commentSaved: true } : h))
      setCommentTarget(null)
      setCommentText('')
    } catch (e: unknown) {
      if (isUnauthorized(e)) {
        onSessionExpired?.()
        return
      }
      setError('ひとことの保存に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  const continueBatch = () => {
    fetchQuestions()
  }

  const undoLast = async () => {
    const last = history[history.length - 1]
    if (!last || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await OwnerChatApi.undo(sessionToken, {
        menu_uid: last.q.menu_uid,
        question_obj: last.undo.question_obj,
        added_allergens: last.undo.added_allergens,
        added_ingredients: last.undo.added_ingredients,
        prev_rank: last.undo.prev_rank,
      })
      // 取り消した質問を queue の先頭に戻し、履歴から落とす
      setQueue(prev => [last.q, ...prev])
      setHistory(prev => prev.slice(0, -1))
      setTotalRemaining(res.total_remaining)
      onCountChange?.(res.total_remaining)
    } catch (e: unknown) {
      if (isUnauthorized(e)) {
        onSessionExpired?.()
        return
      }
      setError('取り消しに失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="owner-qa">
      {history.map((h, idx) => (
        <div key={`${h.q.menu_uid}-${idx}`} className="owner-qa-item">
          <div className="owner-qa-bubble owner-qa-bubble-ai">
            <span className="owner-qa-menu">「{h.q.menu_name}」</span>
            {h.q.question}
          </div>
          <div className="owner-qa-bubble owner-qa-bubble-owner">{h.answerLabel}</div>
          <div className="owner-qa-applied">
            <span className="owner-qa-applied-label"><Check size={13} strokeWidth={2.5} /> 反映しました</span>
            {h.promoted && <span className="owner-qa-promoted">この料理は店主確認済みになりました</span>}
            {/* 直前の回答だけ取り消せる(誤タップの即修正) */}
            {idx === history.length - 1 && (
              <button type="button" className="owner-qa-undo" disabled={submitting} onClick={undoLast}>
                <RotateCcw size={12} strokeWidth={2} /> 取り消す
              </button>
            )}
          </div>
          {h.commentSaved ? (
            <div className="owner-qa-applied"><Check size={13} strokeWidth={2.5} /> ひとことを保存しました</div>
          ) : commentTarget === idx ? (
            <div className="owner-qa-comment">
              <textarea
                className="owner-qa-comment-input"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={`「${h.q.menu_name}」のこだわりをお客様に一言(200字まで)`}
                maxLength={200}
                rows={2}
              />
              <div className="owner-qa-comment-actions">
                <button type="button" className="owner-qa-opt" disabled={submitting || !commentText.trim()} onClick={() => submitComment(idx)}>保存</button>
                <button type="button" className="owner-qa-opt owner-qa-opt-sub" onClick={() => { setCommentTarget(null); setCommentText('') }}>やめる</button>
              </div>
            </div>
          ) : (
            <button type="button" className="owner-qa-comment-link" onClick={() => { setCommentTarget(idx); setCommentText('') }}>
              ＋ この料理に店主のひとことを添える
            </button>
          )}
        </div>
      ))}

      {loading ? (
        <div className="owner-qa-bubble owner-qa-bubble-ai">確認したいことを調べています…</div>
      ) : current ? (
        <div className="owner-qa-item">
          <div className="owner-qa-bubble owner-qa-bubble-ai">
            <span className="owner-qa-menu">「{current.menu_name}」</span>
            {current.question}
          </div>
          <div className="owner-qa-options">
            {current.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                className="owner-qa-opt"
                disabled={submitting}
                onClick={() => submitAnswer([opt])}
              >
                <span className="owner-qa-opt-num">{i + 1}</span>{opt}
              </button>
            ))}
            {!otherMode && (
              <button type="button" className="owner-qa-opt owner-qa-opt-sub" disabled={submitting} onClick={() => setOtherMode(true)}>
                <span className="owner-qa-opt-num">{current.options.length + 1}</span>その他(入力する)
              </button>
            )}
          </div>
          {otherMode && (
            <div className="owner-qa-comment">
              <textarea
                className="owner-qa-comment-input"
                value={otherText}
                onChange={e => setOtherText(e.target.value)}
                placeholder="例: 昆布とかつおの合わせ出汁です"
                rows={2}
              />
              <div className="owner-qa-comment-actions">
                <button type="button" className="owner-qa-opt" disabled={submitting || !otherText.trim()} onClick={() => submitAnswer(undefined, otherText.trim())}>送信</button>
                <button type="button" className="owner-qa-opt owner-qa-opt-sub" onClick={() => { setOtherMode(false); setOtherText('') }}>やめる</button>
              </div>
            </div>
          )}
        </div>
      ) : batchDone ? (
        <div className="owner-qa-item">
          <div className="owner-qa-bubble owner-qa-bubble-ai">
            ありがとうございます。あと{totalRemaining}件の確認があります。続けますか？
          </div>
          <div className="owner-qa-options">
            <button type="button" className="owner-qa-opt" onClick={continueBatch}><span className="owner-qa-opt-num">1</span>続ける</button>
            <button type="button" className="owner-qa-opt owner-qa-opt-sub" onClick={onClose}><span className="owner-qa-opt-num">2</span>また今度</button>
          </div>
        </div>
      ) : allDone ? (
        <div className="owner-qa-item">
          <div className="owner-qa-bubble owner-qa-bubble-ai">
            確認したいことは今のところありません。お疲れ様でした。
          </div>
          <div className="owner-qa-options">
            <button type="button" className="owner-qa-opt owner-qa-opt-sub" onClick={onClose}>閉じる</button>
          </div>
        </div>
      ) : null}

      {error && <div className="owner-qa-error">{error}</div>}
      <div ref={bottomRef} />
    </div>
  )
}
