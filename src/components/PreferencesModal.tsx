'use client'

/**
 * 個人設定 (アレルギー・食事スタイル) 再編集モーダル。
 *
 * OnboardingModal step 2 と同じピッカーを共通スタイルで使い回す。
 * ハンバーガーメニュー「個人設定 → アレルギー・食事スタイル」から開く。
 *
 * 永続化:
 *   - omiseai_allergies = ['egg', 'milk', ...]
 *   - 保存後に omiseai:preferences-updated カスタムイベント dispatch
 *     (chat 側で次回クエリに自動反映したい場合の hook)
 */

import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { useAppContext } from './AppProvider'

const ALLERGIES_KEY = 'omiseai_allergies'

type AllergenChoice = {
  key: string
  jp: string
  en: string
  emoji: string
}

const COMMON_ALLERGENS: AllergenChoice[] = [
  { key: 'egg',    jp: '卵',     en: 'Egg',       emoji: '🥚' },
  { key: 'milk',   jp: '乳製品', en: 'Dairy',     emoji: '🥛' },
  { key: 'wheat',  jp: '小麦',   en: 'Wheat',     emoji: '🌾' },
  { key: 'shrimp', jp: 'えび',   en: 'Shrimp',    emoji: '🦐' },
  { key: 'crab',   jp: 'かに',   en: 'Crab',      emoji: '🦀' },
  { key: 'soba',   jp: 'そば',   en: 'Buckwheat', emoji: '🍜' },
  { key: 'peanut', jp: '落花生', en: 'Peanut',    emoji: '🥜' },
  { key: 'walnut', jp: 'くるみ', en: 'Walnut',    emoji: '🌰' },
]

const RELIGIOUS: AllergenChoice[] = [
  { key: 'halal',      jp: 'ハラール',     en: 'Halal',      emoji: '☪️' },
  { key: 'hindu',      jp: 'ヒンドゥー',   en: 'Hindu',      emoji: '🕉️' },
  { key: 'vegetarian', jp: 'ベジタリアン', en: 'Vegetarian', emoji: '🥗' },
  { key: 'vegan',      jp: 'ヴィーガン',   en: 'Vegan',      emoji: '🌱' },
]

const COPY: Record<string, Record<string, string>> = {
  ja: {
    title: 'アレルギー・食事スタイル',
    hint: '安全にお食事を楽しんでいただくために設定してください',
    common: 'アレルギー（8 大品目）',
    religious: '食事スタイル',
    save: '保存',
    clear: 'クリア',
  },
  en: {
    title: 'Allergies & dietary style',
    hint: 'Set your dietary needs for a safer meal',
    common: 'Allergens (Top 8)',
    religious: 'Dietary style',
    save: 'Save',
    clear: 'Clear',
  },
}

const tr = (lang: string, key: string): string => COPY[lang]?.[key] || COPY.en[key] || key

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

  const clear = () => setSelected(new Set())

  return (
    <div className="onboarding-overlay" onClick={onClose}>
      <div className="onboarding-panel" onClick={(e) => e.stopPropagation()}>
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
          <div className="onboarding-allergens-label">{tr(lang, 'common')}</div>
          <div className="onboarding-allergens-grid">
            {COMMON_ALLERGENS.map((a) => (
              <button
                key={a.key}
                type="button"
                className={`onboarding-allergen-chip${selected.has(a.key) ? ' active' : ''}`}
                onClick={() => toggle(a.key)}
              >
                <span className="onboarding-allergen-emoji">{a.emoji}</span>
                <span>{lang === 'ja' ? a.jp : a.en}</span>
              </button>
            ))}
          </div>

          <div className="onboarding-allergens-label">{tr(lang, 'religious')}</div>
          <div className="onboarding-allergens-grid">
            {RELIGIOUS.map((a) => (
              <button
                key={a.key}
                type="button"
                className={`onboarding-allergen-chip${selected.has(a.key) ? ' active' : ''}`}
                onClick={() => toggle(a.key)}
              >
                <span className="onboarding-allergen-emoji">{a.emoji}</span>
                <span>{lang === 'ja' ? a.jp : a.en}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="onboarding-actions">
          <button type="button" className="onboarding-skip" onClick={clear}>
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
