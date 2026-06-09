'use client'

import { useState } from 'react'
import { OwnerChatApi } from '../services/api'

// 店主モードの入口: LINEで受け取ったリンクを開いた端末で初回だけ4桁パスコードを入れる。
// 成功すると30日セッションが localStorage に保存され、以降は素通し。

type OwnerAuthResult = {
  session_token: string
  restaurant_slug: string
  restaurant_name: string
  pending_count: number
}

type OwnerPasscodeModalProps = {
  token: string
  onSuccess: (result: OwnerAuthResult) => void
  onCancel: () => void
}

export default function OwnerPasscodeModal({ token, onSuccess, onCancel }: OwnerPasscodeModalProps) {
  const [passcode, setPasscode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (passcode.length < 4 || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await OwnerChatApi.auth(token, passcode)
      onSuccess(res)
    } catch (e: unknown) {
      setError(e instanceof Error && e.message === 'passcode'
        ? 'パスコードが違います'
        : 'このリンクは現在使えません。担当までご連絡ください')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="owner-gate-overlay">
      <div className="owner-gate-panel" role="dialog" aria-modal="true">
        <div className="owner-gate-title">店主モード</div>
        <p className="owner-gate-sub">お送りした4桁のパスコードを入力してください(この端末では初回のみ)</p>
        <input
          className="owner-gate-input"
          type="tel"
          inputMode="numeric"
          maxLength={4}
          value={passcode}
          onChange={e => setPasscode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder="0000"
          autoFocus
        />
        {error && <div className="owner-gate-error">{error}</div>}
        <div className="owner-gate-actions">
          <button type="button" className="owner-gate-btn owner-gate-btn-primary" disabled={passcode.length < 4 || submitting} onClick={submit}>
            {submitting ? '確認中…' : '入る'}
          </button>
          <button type="button" className="owner-gate-btn" onClick={onCancel}>お客様として見る</button>
        </div>
      </div>
    </div>
  )
}
