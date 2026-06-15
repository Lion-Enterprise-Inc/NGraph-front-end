'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Check, RotateCcw, X } from 'lucide-react'
import { OwnerChatApi, type OwnerQuestion, type PhotoAnalyzeResult } from '../services/api'

// 店主モードの質問キュー消化フロー。チャット風の見た目だが LLM は介在せず、
// 質問提示→番号選択肢タップ→反映、を FE が決定論的に進める(LLM任せにしない)。
// 店主は日本語前提なので ja 固定。
// 自由入力(その他/店主のひとこと)は画面下固定の共通入力バーで受ける
// (インライン textarea だとキーボードが上がった瞬間に入力欄が画面外へ飛ぶため)。

const BATCH_SIZE = 3

type HistoryItem = {
  _id: number          // 楽観更新の同定用(応答が裏で返ったとき該当履歴を特定)
  saving?: boolean     // 保存中(波及POSTが裏で進行中。完了で false)
  q: OwnerQuestion
  answerLabel: string
  promoted: boolean
  commentSaved?: boolean
  // 厨房共通質問: この回答で整理された(冗長になって消えた)単品質問の数
  purged?: number
  // 「商品によって違う」回答: 品ごとに分解して追加された質問の数
  expanded?: number
  // 取り消し(undo)用にサーバーが返した逆操作情報(保存完了まで null)
  undo: {
    question_obj: Record<string, unknown>
    added_allergens: string[]
    added_ingredients: string[]
    prev_rank: string | null
  } | null
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

// 店全体質問(kitchen=厨房共通/store=店舗プロフィール)か。undo・店主のひとこと非対象。
// kind判定はこの1関数に集約する(新kind追加時に分岐の直し漏れを作らない)
const isStoreLevelKind = (q?: Pick<OwnerQuestion, 'kind'> | null) =>
  q?.kind === 'kitchen' || q?.kind === 'store'

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
  // photo質問用: 撮影→読み取り結果→店主が確認して反映(3段原則)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoResult, setPhotoResult] = useState<PhotoAnalyzeResult | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  // 「分からない(あとで答える)」のスキップ記憶。タブを閉じるまで有効(sessionStorage)、
  // 次の来訪では再び聞く=回答データは作らない(分からないものを推測で埋めさせない)
  const skippedKeysRef = useRef<Set<string>>(new Set())
  const histIdRef = useRef(0)                       // 楽観履歴の連番id
  const inFlightRef = useRef<Set<string>>(new Set()) // 送信中の質問キー(同一質問の二重送信防止)
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
  const isStoreLevel = isStoreLevelKind(current)

  // 質問が変わったら複数選択・撮影結果をリセット
  useEffect(() => {
    setMultiSel([])
    setPhotoResult(null)
    setPhotoBusy(false)
  }, [current?.menu_uid, current?.question])

  const handlePhotoSelected = async (file: File) => {
    if (!current || photoBusy) return
    setPhotoBusy(true)
    setError(null)
    try {
      const res = await OwnerChatApi.photoAnalyze(sessionToken, current.menu_uid, current.question, file)
      setPhotoResult(res)
    } catch (e: unknown) {
      if (isUnauthorized(e)) {
        onSessionExpired?.()
        return
      }
      if (e instanceof Error && e.message === 'conflict') {
        setQueue(prev => prev.slice(1))
        fetchQuestions()
        return
      }
      setError('読み取りに失敗しました。もう一度お試しください。')
    } finally {
      setPhotoBusy(false)
    }
  }

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

  // 楽観更新: タップ→待たずに即・次の質問へ進む。波及POSTは裏で実行し、
  // 応答が返ったら該当履歴に確定情報(波及件数・undo情報)を後追いで埋める。
  // 「回答の値」による分岐は手元のキューで成立済みなので、重いメニュー波及を
  // UIブロックの理由にしない(店主を待たせない=離脱防止)。
  const submitAnswer = (selected: string[] | undefined, textNote?: string) => {
    if (!current) return
    const answered = current
    const key = skipKey(answered)
    if (inFlightRef.current.has(key)) return  // 同一質問の二重送信防止
    inFlightRef.current.add(key)
    const id = ++histIdRef.current

    // 1) 即座に履歴へ積み、次の質問へ進める(保存中表示)
    setHistory(prev => [...prev, {
      _id: id,
      saving: true,
      q: answered,
      answerLabel: selected?.join('、') || textNote || '',
      promoted: false,
      purged: 0,
      expanded: 0,
      undo: null,
    }])
    setQueue(prev => prev.slice(1))
    setError(null)
    closeInput()

    // 2) 裏で保存+波及。完了したら該当履歴を確定。
    OwnerChatApi.answer(sessionToken, {
      menu_uid: answered.menu_uid,
      question: answered.question,
      selected,
      text_note: textNote,
    }).then(res => {
      const qobj = (res.question_obj ?? {}) as Record<string, unknown>
      const purged = isStoreLevelKind(answered) ? Number(qobj.purged_questions) || 0 : 0
      const expanded = isStoreLevelKind(answered) ? Number(qobj.expanded_questions) || 0 : 0
      setHistory(prev => prev.map(h => h._id === id ? {
        ...h,
        saving: false,
        promoted: res.promoted_to_a,
        purged,
        expanded,
        undo: {
          question_obj: res.question_obj,
          added_allergens: res.added_allergens,
          added_ingredients: res.added_ingredients,
          prev_rank: res.prev_rank,
        },
      } : h))
      setTotalRemaining(res.total_remaining)
      onCountChange?.(res.total_remaining)
      // 厨房回答のパージはスキップ済みの単品質問もサーバ側から消すことがある。
      // skippedCountに残すと残数の二重減算→偽の「以上です」になるためリセット。
      if (purged > 0 && skippedKeysRef.current.size > 0) {
        const keep = new Set([...skippedKeysRef.current].filter(
          k => k.startsWith('kitchen:') || k.startsWith('store:')))
        skippedKeysRef.current = keep
        setSkippedCount(keep.size)
        try {
          sessionStorage.setItem(SKIP_STORE_KEY, JSON.stringify([...keep]))
        } catch {}
      }
    }).catch((e: unknown) => {
      if (isUnauthorized(e)) { onSessionExpired?.(); return }
      if (e instanceof Error && e.message === 'conflict') {
        // 既に回答済み(再送 or 別端末) → 楽観エントリを確定扱いにして同期し直す
        setHistory(prev => prev.map(h => h._id === id ? { ...h, saving: false } : h))
        fetchQuestions()
        return
      }
      // 失敗: 楽観エントリを取り消し、質問をキュー先頭に戻す
      setHistory(prev => prev.filter(h => h._id !== id))
      setQueue(prev => [answered, ...prev])
      setError('反映に失敗しました。もう一度お試しください。')
    }).finally(() => {
      inFlightRef.current.delete(key)
    })
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
    if (!last || submitting || last.saving || !last.undo) return  // 保存中(undo情報未確定)は取消不可
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

  // 回答入力の上限は書込先フィールドのカラム長(max_input)に揃える
  // (BE側で無言切り捨てされると文末欠けの案内が客に出るため、入力時点で制限する)
  const answerMax = current?.max_input ?? 120
  const inputPlaceholder = inputMode?.kind === 'comment'
    ? 'お客様への一言を入力(200字まで)'
    : `答えを入力してください(${answerMax}字まで)`
  const inputMax = inputMode?.kind === 'comment' ? 200 : answerMax

  return (
    <>
      <div className="owner-qa">
        {history.map((h, idx) => (
          <div key={`${h.q.menu_uid}-${idx}`} className="owner-qa-item">
            <div className="owner-qa-bubble owner-qa-bubble-ai">
              <span className="owner-qa-menu">{h.q.menu_name}</span>
              <span className="owner-qa-question">{h.q.question}</span>
            </div>
            <div className="owner-qa-bubble owner-qa-bubble-owner">{h.answerLabel}</div>
            <div className="owner-qa-applied">
              {h.saving ? (
                <span className="owner-qa-applied-label" style={{ opacity: 0.7 }}>保存中…</span>
              ) : (
                <>
                  <span className="owner-qa-applied-label">
                    <Check size={13} strokeWidth={2.5} />
                    {h.q.kind === 'kitchen' ? ' 関係する料理すべてに反映しました'
                      : h.q.kind === 'store' ? ' お店の案内に反映しました' : ' 反映しました'}
                  </span>
                  {(h.purged ?? 0) > 0 && (
                    <span className="owner-qa-promoted">この回答で{h.purged}問が不要になりました</span>
                  )}
                  {(h.expanded ?? 0) > 0 && (
                    <span className="owner-qa-promoted">品ごとに{h.expanded}問に分けて聞き直します</span>
                  )}
                  {h.promoted && <span className="owner-qa-promoted">この料理は店主確認済みになりました</span>}
                  {/* 直前の回答だけ取り消せる(誤タップの即修正)。店全体質問は波及が広く逆操作未対応 */}
                  {idx === history.length - 1 && !isStoreLevelKind(h.q) && (
                    <button type="button" className="owner-qa-undo" disabled={submitting} onClick={undoLast}>
                      <RotateCcw size={12} strokeWidth={2} /> 取り消す
                    </button>
                  )}
                </>
              )}
            </div>
            {isStoreLevelKind(h.q) ? null : h.commentSaved ? (
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
          // key=質問単位: 次の質問でDOMを作り直し、チャット風の入場アニメを毎回再生する
          // (同じDOMの中身だけ差し替わると「その場で項目が変わるだけ」に見える)
          <div className="owner-qa-item" key={`${current.menu_uid}::${current.question}`}>
            {/* 残り問数+自動保存の明示(中断への安心感) */}
            <div className="owner-qa-progress">
              残り {answerableRemaining} 問
              {skippedCount > 0 && ` ・ あとで答える ${skippedCount} 問`}
              <span className="owner-qa-progress-note">回答は1問ごとに自動保存。いつでも中断できます</span>
            </div>
            <div className="owner-qa-bubble owner-qa-bubble-ai">
              <span className="owner-qa-menu">{current.menu_name}</span>
              <span className="owner-qa-question">{current.question}</span>
              {isStoreLevel && (
                <div className="owner-qa-kitchen-note">
                  {current.kind === 'kitchen'
                    ? 'お店全体の質問です。回答は関係する料理すべてに反映されます'
                    : 'お店全体の質問です。回答はお客様への案内にそのまま使われます'}
                  {current.multi ? '（複数選べます）' : ''}
                </div>
              )}
            </div>
            <div className="owner-qa-options">
              {current.qtype === 'photo' ? (
                <>
                  {/* 撮影で答える質問: 撮る→読み取り結果を確認→反映(3段原則) */}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handlePhotoSelected(f)
                      e.target.value = ''
                    }}
                  />
                  {photoResult?.readable ? (
                    <div className="owner-qa-photo-result">
                      <div className="owner-qa-photo-read">
                        読み取れた原材料{photoResult.product_name ? `（${photoResult.product_name}）` : ''}:
                      </div>
                      <div className="owner-qa-photo-chips">
                        {photoResult.ingredients.map((ing, i) => (
                          <span key={i} className="owner-qa-photo-chip">{ing}</span>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="owner-qa-opt"
                        disabled={submitting}
                        onClick={() => submitAnswer(
                          photoResult.ingredients,
                          `📷 ${photoResult.product_name || 'パッケージ'}の原材料表示より`,
                        )}
                      >
                        <Check size={14} strokeWidth={2.5} /> この内容で反映
                      </button>
                      <button
                        type="button"
                        className="owner-qa-opt owner-qa-opt-sub"
                        disabled={submitting || photoBusy}
                        onClick={() => { setPhotoResult(null); photoInputRef.current?.click() }}
                      >
                        撮り直す
                      </button>
                    </div>
                  ) : (
                    <>
                      {photoResult && !photoResult.readable && (
                        <div className="owner-qa-photo-read">
                          原材料表示を読み取れませんでした。表示部分がはっきり写るように撮ってください
                        </div>
                      )}
                      <button
                        type="button"
                        className="owner-qa-opt"
                        disabled={photoBusy || submitting}
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <Camera size={15} strokeWidth={2} /> {photoBusy ? '読み取り中…' : 'パッケージ裏を撮影する'}
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
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
                      className="owner-qa-opt owner-qa-decide"
                      disabled={submitting || multiSel.length === 0}
                      onClick={() => submitAnswer(multiSel)}
                    >
                      <Check size={15} strokeWidth={2.5} />
                      {submitting ? ' 反映中…'
                        : multiSel.length > 0 ? ` 選んだ${multiSel.length}件で決定` : ' 選んでから決定'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={`owner-qa-opt owner-qa-opt-sub${inputMode?.kind === 'other' ? ' active' : ''}`}
                    disabled={submitting}
                    onClick={() => openInput({ kind: 'other' })}
                  >
                    <span className="owner-qa-opt-num">{current.options.length + 1}</span>
                    {current.options.length === 0 ? '入力する' : 'その他(入力する)'}
                  </button>
                </>
              )}
              {/* 分からない=推測で答えさせない。データは作らず次回また聞く */}
              <button
                type="button"
                className="owner-qa-opt owner-qa-opt-sub"
                disabled={submitting}
                onClick={skipCurrent}
              >
                {current.qtype !== 'photo' && (
                  <span className="owner-qa-opt-num">{current.options.length + 2}</span>
                )}
                分からない(あとで答える)
              </button>
            </div>
            {/* 送信中の明示(波及処理で数秒かかる。無表示だと「止まってる?」と不安にさせる) */}
            {submitting && (
              <div className="owner-qa-bubble owner-qa-bubble-ai owner-qa-loading">
                反映しています
                <span className="typing-indicator"><span /><span /><span /></span>
              </div>
            )}
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
