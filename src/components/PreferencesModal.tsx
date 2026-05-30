'use client'

/**
 * 個人設定 (アレルギー・食事スタイル) 再編集モーダル。
 *
 * OnboardingModal step 2 と同じピッカーを共通スタイルで使い回す。
 * ハンバーガーメニュー「個人設定 → アレルギー・食事スタイル」から開く。
 *
 * アレルゲン: 8 (特定原材料) + 21 (準ずる) + 4 (食事スタイル) を 7 カテゴリで表示。
 * 「アレルギーなし」chip は selected.size === 0 で active な排他選択 UI。
 *
 * 永続化:
 *   - omiseai_allergies = ['egg', 'milk', ...]
 *   - 保存後に omiseai:preferences-updated カスタムイベント dispatch
 *     (chat 側で次回クエリに自動反映したい場合の hook)
 */

import { useEffect, useState } from 'react'
import { AlertCircle, X, Check } from 'lucide-react'
import { useAppContext } from './AppProvider'
import { ALLERGEN_CATEGORIES, NONE_CHIP } from '../data/allergens'

const ALLERGIES_KEY = 'omiseai_allergies'

const COPY: Record<string, Record<string, string>> = {
  ja: {
    title: 'アレルギー・食事スタイル',
    hint: '安全にお食事を楽しんでいただくために設定してください',
    none: 'アレルギーなし',
    save: '保存',
    clear: 'クリア',
  },
  en: {
    title: 'Allergies & dietary style',
    hint: 'Set your dietary needs for a safer meal',
    none: 'No allergies',
    save: 'Save',
    clear: 'Clear',
  },
}

const tr = (lang: string, key: string): string => COPY[lang]?.[key] || COPY.en[key] || key

const labelFor = (lang: string, jp: string, en: string): string =>
  lang === 'ja' ? jp : en

type PreferencesModalProps = {
  open: boolean
  onClose: () => void
}

export default function PreferencesModal({ open, onClose }: PreferencesModalProps) {
  const { language } = useAppContext()
  const lang = COPY[language] ? language : 'en'
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // open する度に localStorage から最新値を読み戻す
  useEffect(() => {
    if (!open) return
    try {
      const raw = localStorage.getItem(ALLERGIES_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) {
        setSelected(new Set(parsed.filter((v): v is string => typeof v === 'string')))
      } else {
        setSelected(new Set())
      }
    } catch {
      setSelected(new Set())
    }
  }, [open])

  if (!open) return null

  const toggle = (key: string) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key); else next.add(key)
    setSelected(next)
  }

  const selectNone = () => setSelected(new Set())

  const save = () => {
    try {
      localStorage.setItem(ALLERGIES_KEY, JSON.stringify([...selected]))
      window.dispatchEvent(new CustomEvent('omiseai:preferences-updated', {
        detail: { allergies: [...selected] },
      }))
    } catch {
      // localStorage 書き込み失敗時は静かに諦める (privacy mode 等)
    }
    onClose()
  }

  const isNoneActive = selected.size === 0

  return (
    <div className="onboarding-overlay" onClick={onClose}>
      <div className="onboarding-panel onboarding-panel-allergens" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="icon-button"
          style={{ position: 'absolute', top: 12, right: 12 }}
          aria-label="Close"
          onClick={onClose}
        >
          <X size={18} strokeWidth={1.75} color="currentColor" />
        </button>

        <div className="onboarding-header">
          <AlertCircle size={26} strokeWidth={1.7} color="#ff9966" />
          <h2 className="onboarding-title">{tr(lang, 'title')}</h2>
          <p className="onboarding-hint">{tr(lang, 'hint')}</p>
        </div>

        <div className="onboarding-allergens-section">
          {/* 「なし」chip: 排他選択 UI (selected.size === 0 で active) */}
          <button
            type="button"
            className={`allergen-chip-none${isNoneActive ? ' active' : ''}`}
            onClick={selectNone}
            aria-pressed={isNoneActive}
          >
            <Check size={16} strokeWidth={2} />
            <span>{tr(lang, 'none')}</span>
          </button>

          {/* カテゴリ別にループ表示 */}
          {ALLERGEN_CATEGORIES.map((category) => (
            <div key={category.id} className="allergen-section">
              <div className="allergen-section-label">
                {labelFor(lang, category.label_ja, category.label_en)}
              </div>
              <div className="allergen-grid">
                {category.items.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    className={`onboarding-allergen-chip${selected.has(a.key) ? ' active' : ''}`}
                    onClick={() => toggle(a.key)}
                    aria-pressed={selected.has(a.key)}
                  >
                    <span className="onboarding-allergen-emoji">{a.emoji}</span>
                    <span>{labelFor(lang, a.jp, a.en)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="onboarding-actions">
          <button type="button" className="onboarding-skip" onClick={selectNone}>
            {tr(lang, 'clear')}
          </button>
          <button type="button" className="onboarding-next" onClick={save}>
            {tr(lang, 'save')}
          </button>
        </div>
      </div>
    </div>
  )
}
