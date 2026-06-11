'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'
import { OwnerChatApi, type OwnerQuestion } from '../services/api'

// 店主モードの質問キュー消化フロー。チャット風の見た目だが LLM は介在せず、
// 質問提示→番号選択肢タップ→反映、を FE が決定論的に進める(LLM任せにしない)。
// 店主は日本語前提なので ja 固定。
// 自由入力(その他/店主のひとこと)は画面下固定の共通入力バーで受ける
// (インライン textarea だとキーボードが上がった瞬間に入力欄が画面外へ飛ぶため)。

const BATCH_SIZE = 3

type HistoryItem = {
  q: OwnerQuestion
  answerLabel: string
  promoted: boolean
  commentSaved?: boolean
  // 厨房共通質問: この回答で整理された(冗長になって消えた)単品質問の数
  purged?: number
  // 取り消し(undo)用にサーバーが返した逆操作情報
  undo: {
    question_obj: Record<string, unknown>
    added_allergens: string[]
    added_ingredients: string[]
    prev_rank: string | null
  }
}

// 下部入力バーが何を受けているか
type InputMode =
  | { kind: 'other' }                 // 現在の質問への自由入力回答
  | { kind: 'comment'; idx: number }  // 履歴 idx の料理への店主のひとこと

type OwnerQuestionFlowProps = {
  sessionToken: string
  onClose: () => void
  onCountChange?: (remaining: number) => void
  /** 401(30日セッション失効/トークンrevoke)時に親へ通知 → 保存セッション破棄+再認証 */
  onSessionExpired?: () => void
}

const SKIP_STORE_KEY = 'omiseai_owner_qa_skipped'

export default function OwnerQuestionFlow({ sessionToken, onClose, onCountChange, onSessionExpired }: OwnerQuestionFlowProps) {
  const [queue, setQueue] = useState<OwnerQuestion[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [totalRemaining, setTotalRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode | null>(null)
  const [inputText, setInputText] = useState('')
  // 複数選択可の質問(厨房のcheckbox)用: トグル選択→「決定」で送信
  const [multiSel, setMultiSel] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  // 「分からない(あとで答える)」のスキップ記憶。タブを閉じるまで有効(sessionStorage)、
  // 次の来訪では再び聞く=回答データは作らない(分からないものを推測で埋めさせない)
  const skippedKeysRef = useRef<Set<string>>(new Set())
  const [skippedCount, setSkippedCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const skipKey = (q: OwnerQuestion) => `${q.menu_uid}::${q.question}`

  const isUnauthorized = (e: unknown) => e instanceof Error && e.message === 'unauthorized'

  const openInput = (mode: InputMode) => {
    setInputText('')
    setInputMode(mode)
  }
  const closeInput = () => {
    setInputMode(null)
    setInputText('')
  }

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      // スキップ分が配信枠を塞がないよう、スキップ数ぶん多めに取ってFEで除外する
      const res = await OwnerChatApi.questions(sessionToken, BATCH_SIZE + skippedKeysRef.current.size)
      setQueue(res.questions.filter(q => !skippedKeysRef.current.has(skipKey(q))).slice(0, BATCH_SIZE))
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

  useEffect(() => {
    // スキップ記憶の復元(マウント後=hydration安全)
    try {
      const saved = sessionStorage.getItem(SKIP_STORE_KEY)
      if (saved) {
        skippedKeysRef.current = new Set(JSON.parse(saved) as string[])
        setSkippedCount(skippedKeysRef.current.size)
      }
    } catch {}
    fetchQuestions()
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [queue, history, loading])

  // 入力バーが開いたらフォーカス(キーボードを即出す)
  useEffect(() => {
    if (inputMode) inputRef.current?.focus()
  }, [inputMode])

  const current = queue[0] ?? null
  const isKitchen = current?.kind === 'kitchen'

  // 質問が変わったら複数選択をリセット
  useEffect(() => {
    setMultiSel([])
  }, [current?.menu_uid, current?.question])

  // スキップ分を除いた「今answerできる残り」(表示・続行判定用)
  const answerableRemaining = Math.max(totalRemaining - skippedCount, 0)
  const batchDone = !loading && !current && answerableRemaining > 0
  const allDone = !loading && !current && answerableRemaining === 0

  const skipCurrent = () => {
    if (!current || submitting) return
    skippedKeysRef.current.add(skipKey(current))
    setSkippedCount(skippedKeysRef.current.size)
    try {
      sessionStorage.setItem(SKIP_STORE_KEY, JSON.stringify([...skippedKeysRef.current]))
    } catch {}
    // サーバ側でも質問を末尾に回す(同じ品の次の質問が配信されるようになる)。失敗しても
    // FE側スキップは成立するので待たない(次回また聞かれるだけ)
    OwnerChatApi.skip(sessionToken, { menu_uid: current.menu_uid, question: current.question }).catch(() => {})
    setQueue(prev => prev.slice(1))
    closeInput()
  }

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
      const purged = current.kind === 'kitchen'
        ? Number((res.question_obj as Record<string, unknown>)?.purged_questions) || 0
        : 0
      setHistory(prev => [...prev, {
        q: current,
        answerLabel: selected?.join('、') || textNote || '',
        promoted: res.promoted_to_a,
        purged,
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
      closeInput()
    } catch (e: unknown) {
      if (isUnauthorized(e)) {
        onSessionExpired?.()
        return
      }
      if (e instanceof Error && e.message === 'conflict') {
        // 既に回答済み(応答ロスト後の再送 or 別端末で回答済み) → 成功扱いでキューを進めて同期し直す
        setQueue(prev => prev.slice(1))
        closeInput()
        fetchQuestions()
        return
      }
      setError('反映に失敗しました。もう一度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  const submitComment = async (historyIdx: number, text: string) => {
    const item = history[historyIdx]
    if (!item || !text.trim() || submitting) return
    setSubmitting(true)
    try {
      await OwnerChatApi.comment(sessionToken, item.q.menu_uid, text.trim())
      setHistory(prev => prev.map((h, i) => i === historyIdx ? { ...h, commentSaved: true } : h))
      closeInput()
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

  const submitInput = () => {
    const text = inputText.trim()
    if (!text || !inputMode) return
    if (inputMode.kind === 'other') submitAnswer(undefined, text)
    else submitComment(inputMode.idx, text)
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
      closeInput()
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

  const inputPlaceholder = inputMode?.kind === 'comment'
    ? 'お客様への一言を入力(200字まで)'
    : '答えを入力してください'
  const inputMax = inputMode?.kind === 'comment' ? 200 : 120

  return (
    <>
      <div className="owner-qa">
        {history.map((h, idx) => (
          <div key={`${h.q.menu_uid}-${idx}`} className="owner-qa-item">
            <div className="owner-qa-bubble owner-qa-bubble-ai">
              <span className="owner-qa-menu">「{h.q.menu_name}」</span>
              {h.q.question}
            </div>
            <div className="owner-qa-bubble owner-qa-bubble-owner">{h.answerLabel}</div>
            <div className="owner-qa-applied">
              <span className="owner-qa-applied-label">
                <Check size={13} strokeWidth={2.5} />
                {h.q.kind === 'kitchen' ? ' 関係する料理すべてに反映しました' : ' 反映しました'}
              </span>
              {(h.purged ?? 0) > 0 && (
                <span className="owner-qa-promoted">この回答で{h.purged}問が不要になりました</span>
              )}
              {h.promoted && <span className="owner-qa-promoted">この料理は店主確認済みになりました</span>}
              {/* 直前の回答だけ取り消せる(誤タップの即修正)。厨房共通質問は波及が広く逆操作未対応 */}
              {idx === history.length - 1 && h.q.kind !== 'kitchen' && (
                <button type="button" className="owner-qa-undo" disabled={submitting} onClick={undoLast}>
                  <RotateCcw size={12} strokeWidth={2} /> 取り消す
                </button>
              )}
            </div>
            {h.q.kind === 'kitchen' ? null : h.commentSaved ? (
              <div className="owner-qa-applied"><Check size={13} strokeWidth={2.5} /> ひとことを保存しました</div>
            ) : (
              <button
                type="button"
                className="owner-qa-comment-link"
                onClick={() => openInput({ kind: 'comment', idx })}
              >
                ＋ この料理に店主のひとことを添える
              </button>
            )}
          </div>
        ))}

        {loading ? (
          <div className="owner-qa-bubble owner-qa-bubble-ai owner-qa-loading">
            確認したいことを調べています
            <span className="typing-indicator"><span /><span /><span /></span>
          </div>
        ) : current ? (
          <div className="owner-qa-item">
            {/* 残り問数+自動保存の明示(中断への安心感) */}
            <div className="owner-qa-progress">
              残り {answerableRemaining} 問
              {skippedCount > 0 && ` ・ あとで答える ${skippedCount} 問`}
              <span className="owner-qa-progress-note">回答は1問ごとに自動保存。いつでも中断できます</span>
            </div>
            <div className="owner-qa-bubble owner-qa-bubble-ai">
              <span className="owner-qa-menu">「{current.menu_name}」</span>
              {current.question}
              {isKitchen && (
                <div className="owner-qa-kitchen-note">
                  お店全体の質問です。回答は関係する料理すべてに反映されます
                  {current.multi ? '（複数選べます）' : ''}
                </div>
              )}
            </div>
            <div className="owner-qa-options">
              {current.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  className={`owner-qa-opt${current.multi && multiSel.includes(opt) ? ' active' : ''}`}
                  disabled={submitting}
                  onClick={() => {
                    if (current.multi) {
                      // 複数選択: タップでトグル→「決定」で送信
                      setMultiSel(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
                    } else {
                      submitAnswer([opt])
                    }
                  }}
                >
                  <span className="owner-qa-opt-num">{i + 1}</span>{opt}
                </button>
              ))}
              {current.multi && (
                <button
                  type="button"
                  className="owner-qa-opt"
                  disabled={submitting || multiSel.length === 0}
                  onClick={() => submitAnswer(multiSel)}
                >
                  <Check size={14} strokeWidth={2.5} /> 決定{multiSel.length > 0 ? `(${multiSel.length}件)` : ''}
                </button>
              )}
              <button
                type="button"
                className={`owner-qa-opt owner-qa-opt-sub${inputMode?.kind === 'other' ? ' active' : ''}`}
                disabled={submitting}
                onClick={() => openInput({ kind: 'other' })}
              >
                <span className="owner-qa-opt-num">{current.options.length + 1}</span>その他(入力する)
              </button>
              {/* 分からない=推測で答えさせない。データは作らず次回また聞く */}
              <button
                type="button"
                className="owner-qa-opt owner-qa-opt-sub"
                disabled={submitting}
                onClick={skipCurrent}
              >
                <span className="owner-qa-opt-num">{current.options.length + 2}</span>分からない(あとで答える)
              </button>
            </div>
          </div>
        ) : batchDone ? (
          <div className="owner-qa-item">
            <div className="owner-qa-bubble owner-qa-bubble-ai">
              ありがとうございます。ここまでの回答は保存済みです。あと{answerableRemaining}問あります。続けますか？
            </div>
            <div className="owner-qa-options">
              <button type="button" className="owner-qa-opt" onClick={continueBatch}><span className="owner-qa-opt-num">1</span>続ける</button>
              <button type="button" className="owner-qa-opt owner-qa-opt-sub" onClick={onClose}><span className="owner-qa-opt-num">2</span>また今度(保存済み)</button>
            </div>
          </div>
        ) : allDone ? (
          <div className="owner-qa-item">
            <div className="owner-qa-bubble owner-qa-bubble-ai">
              {skippedCount > 0
                ? `今答えられる確認は以上です。お疲れ様でした。「あとで答える」にした${skippedCount}問は、次に開いた時にまた聞きます。`
                : '確認したいことは今のところありません。お疲れ様でした。'}
            </div>
            <div className="owner-qa-options">
              <button type="button" className="owner-qa-opt owner-qa-opt-sub" onClick={onClose}>閉じる</button>
            </div>
          </div>
        ) : null}

        {error && <div className="owner-qa-error">{error}</div>}
        <div ref={bottomRef} />
      </div>

      {/* 自由入力は画面下固定バー(キーボードの上に張り付く・通常チャットと同じ操作感) */}
      {inputMode && (
        <div className="owner-input-bar">
          <textarea
            ref={inputRef}
            className="owner-input-field"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitInput() }
            }}
            placeholder={inputPlaceholder}
            maxLength={inputMax}
            rows={1}
          />
          <button type="button" className="owner-input-cancel" onClick={closeInput} aria-label="閉じる">
            <X size={18} strokeWidth={2} />
          </button>
          <button type="button" className="owner-input-send" disabled={submitting || !inputText.trim()} onClick={submitInput}>
            送信
          </button>
        </div>
      )}
    </>
  )
}
