'use client'

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { OwnerChatApi, type OwnerAllergen, type OwnerMenuDetail } from '../services/api'

// 店主モードでメニュー一覧から既存メニューを修正するフォーム。
// 現場頻出の4項目に絞る: 提供中/停止・価格・説明・アレルゲン。
// MenuListDrawer の詳細展開部に差し込まれる。日本語前提(ja固定)。

type OwnerMenuEditProps = {
  sessionToken: string
  menuUid: string
  allergens: OwnerAllergen[]   // マスタ(MenuListDrawer で1回取得して渡す)
  onSaved: () => void          // 保存後に一覧をリフレッシュ
  onClose: () => void
  onSessionExpired?: () => void
}

export default function OwnerMenuEdit({ sessionToken, menuUid, allergens, onSaved, onClose, onSessionExpired }: OwnerMenuEditProps) {
  const [detail, setDetail] = useState<OwnerMenuDetail | null>(null)
  const [status, setStatus] = useState(true)
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [allergenUids, setAllergenUids] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isUnauthorized = (e: unknown) => e instanceof Error && e.message === 'unauthorized'

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    OwnerChatApi.menuDetail(sessionToken, menuUid)
      .then(d => {
        if (cancelled) return
        setDetail(d)
        setStatus(d.status)
        setPrice(String(d.price ?? 0))
        setDescription(d.description ?? '')
        setAllergenUids(new Set(d.allergen_uids))
      })
      .catch(e => {
        if (cancelled) return
        if (isUnauthorized(e)) { onSessionExpired?.(); return }
        setError('情報の取得に失敗しました')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [sessionToken, menuUid])  // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAllergen = (uid: string) => {
    setAllergenUids(prev => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid); else next.add(uid)
      return next
    })
  }

  const save = async () => {
    if (saving || !detail) return
    const priceNum = parseInt(price, 10)
    if (isNaN(priceNum) || priceNum < 0) { setError('価格を正しく入力してください'); return }
    setSaving(true)
    setError(null)
    try {
      await OwnerChatApi.updateMenu(sessionToken, {
        menu_uid: menuUid,
        status,
        price: priceNum,
        description: description.trim(),
        allergen_uids: Array.from(allergenUids),
      })
      setSaved(true)
      onSaved()
      setTimeout(onClose, 900)
    } catch (e: unknown) {
      if (isUnauthorized(e)) { onSessionExpired?.(); return }
      setError('保存に失敗しました。もう一度お試しください')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="owner-edit"><div className="owner-edit-loading">読み込み中…</div></div>
  }
  if (saved) {
    return (
      <div className="owner-edit">
        <div className="owner-edit-saved"><Check size={15} strokeWidth={2.5} /> 保存しました</div>
      </div>
    )
  }

  return (
    <div className="owner-edit" onClick={e => e.stopPropagation()}>
      {/* 提供中/停止 */}
      <div className="owner-edit-row">
        <span className="owner-edit-label">提供状況</span>
        <button
          type="button"
          className={`owner-edit-toggle${status ? ' on' : ''}`}
          onClick={() => setStatus(s => !s)}
        >
          <span className="owner-edit-toggle-knob" />
          <span className="owner-edit-toggle-text">{status ? '提供中' : '停止中'}</span>
        </button>
      </div>

      {/* 価格 */}
      <div className="owner-edit-row">
        <span className="owner-edit-label">価格</span>
        <div className="owner-edit-price">
          <span>¥</span>
          <input
            type="tel"
            inputMode="numeric"
            value={price}
            onChange={e => setPrice(e.target.value.replace(/[^\d]/g, ''))}
          />
        </div>
      </div>

      {/* 説明 */}
      <div className="owner-edit-col">
        <span className="owner-edit-label">説明</span>
        <textarea
          className="owner-edit-textarea"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="料理の説明"
          rows={2}
          maxLength={1000}
        />
      </div>

      {/* アレルゲン */}
      <div className="owner-edit-col">
        <span className="owner-edit-label">アレルゲン（タップで選択）</span>
        <div className="owner-edit-allergens">
          {allergens.map(a => (
            <button
              key={a.uid}
              type="button"
              className={`owner-edit-allergen${allergenUids.has(a.uid) ? ' selected' : ''}`}
              onClick={() => toggleAllergen(a.uid)}
            >
              {a.name_jp}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="owner-edit-error">{error}</div>}

      <div className="owner-edit-actions">
        <button type="button" className="owner-edit-save" disabled={saving} onClick={save}>
          {saving ? '保存中…' : '保存する'}
        </button>
        <button type="button" className="owner-edit-cancel" onClick={onClose} aria-label="キャンセル">
          <X size={16} strokeWidth={2} /> やめる
        </button>
      </div>
    </div>
  )
}
