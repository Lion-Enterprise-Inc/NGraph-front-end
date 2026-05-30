'use client'

/**
 * 初回訪問オンボーディング 3 ステップ。
 *
 * ステップ:
 *   1. 言語確認（auto-detect default、変更可）
 *   2. アレルギー宣言（任意、skip 可）
 *   3. 完了 → 自動で「おすすめ教えて」を chat に投入
 *
 * 表示判定:
 *   - localStorage `omiseai_onboarded` !== 'true'
 *   - かつ in-store QR 起点（restaurant slug 有り）
 *
 * 完了後の永続化:
 *   - omiseai_onboarded = 'true'
 *   - appLanguage = 選択言語
 *   - omiseai_allergies = ['egg', 'milk', ...]（chat に自動投入）
 */

import { useEffect, useState } from 'react'
import { ChevronRight, Globe, AlertCircle, Sparkles, X } from 'lucide-react'

const ONBOARDED_KEY = 'omiseai_onboarded'
const ALLERGIES_KEY = 'omiseai_allergies'

// 主要 15 言語（おすすめ順、簡易セレクタ用）— 蟹くるふ実需要 11言語 + 周辺
const QUICK_LANGS: { code: string; label: string; native: string }[] = [
  { code: 'ja',     label: 'Japanese',   native: '日本語' },
  { code: 'en',     label: 'English',    native: 'English' },
  { code: 'zh-Hans',label: 'Chinese',    native: '简体中文' },
  { code: 'zh-Hant',label: 'Chinese TW', native: '繁體中文' },
  { code: 'ko',     label: 'Korean',     native: '한국어' },
  { code: 'fr',     label: 'French',     native: 'Français' },
  { code: 'es',     label: 'Spanish',    native: 'Español' },
  { code: 'de',     label: 'German',     native: 'Deutsch' },
  { code: 'it',     label: 'Italian',    native: 'Italiano' },
  { code: 'pt',     label: 'Portuguese', native: 'Português' },
  { code: 'ru',     label: 'Russian',    native: 'Русский' },
  { code: 'th',     label: 'Thai',       native: 'ไทย' },
  { code: 'vi',     label: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'id',     label: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'tl',     label: 'Filipino',   native: 'Filipino' },
]

// 8 大アレルゲン
type AllergenChoice = {
  key: string
  jp: string
  en: string
  emoji: string
}
const COMMON_ALLERGENS: AllergenChoice[] = [
  { key: 'egg',      jp: '卵',       en: 'Egg',       emoji: '🥚' },
  { key: 'milk',     jp: '乳製品',   en: 'Dairy',     emoji: '🥛' },
  { key: 'wheat',    jp: '小麦',     en: 'Wheat',     emoji: '🌾' },
  { key: 'shrimp',   jp: 'えび',     en: 'Shrimp',    emoji: '🦐' },
  { key: 'crab',     jp: 'かに',     en: 'Crab',      emoji: '🦀' },
  { key: 'soba',     jp: 'そば',     en: 'Buckwheat', emoji: '🍜' },
  { key: 'peanut',   jp: '落花生',   en: 'Peanut',    emoji: '🥜' },
  { key: 'walnut',   jp: 'くるみ',   en: 'Walnut',    emoji: '🌰' },
]

const RELIGIOUS: AllergenChoice[] = [
  { key: 'halal',       jp: 'ハラール',     en: 'Halal',         emoji: '☪️' },
  { key: 'hindu',       jp: 'ヒンドゥー',   en: 'Hindu',         emoji: '🕉️' },
  { key: 'vegetarian',  jp: 'ベジタリアン', en: 'Vegetarian',    emoji: '🥗' },
  { key: 'vegan',       jp: 'ヴィーガン',   en: 'Vegan',         emoji: '🌱' },
]

type OnboardingProps = {
  open: boolean
  defaultLang: string
  onComplete: (langCode: string, allergies: string[], firstQuery: string | null) => void
}

/** 文字列をコピー言語に応じた翻訳ラベルから取得 */
const t = (lang: string, key: string): string => {
  const dict: Record<string, Record<string, string>> = {
    ja: {
      welcome: 'ようこそ',
      subtitle: 'お店の AI アシスタントです',
      step1Title: '言語を選んでください',
      step1Hint: 'お好みの言語で会話できます',
      step2Title: 'アレルギーや食事制約は？',
      step2Hint: '安全にお食事を楽しんでいただくため。後でも変更できます',
      step2Skip: 'スキップ',
      step3Title: 'さあ、始めましょう！',
      step3Hint: 'おすすめのメニューから見てみますか？',
      step3CTA: 'おすすめを見る',
      step3CTAAlt: '自分で聞いてみる',
      next: '次へ',
      back: '戻る',
      common: 'アレルギー（8 大品目）',
      religious: '食事スタイル',
    },
    en: {
      welcome: 'Welcome',
      subtitle: "I'm the restaurant's AI assistant",
      step1Title: 'Choose your language',
      step1Hint: 'You can chat in your preferred language',
      step2Title: 'Any allergies or dietary needs?',
      step2Hint: 'For your safety. You can change this later.',
      step2Skip: 'Skip',
      step3Title: "Let's get started!",
      step3Hint: 'Want to see the recommendations?',
      step3CTA: 'Show recommendations',
      step3CTAAlt: 'Ask my own question',
      next: 'Next',
      back: 'Back',
      common: 'Allergens (Top 8)',
      religious: 'Dietary style',
    },
  }
  return dict[lang]?.[key] || dict.en[key] || key
}

export default function OnboardingModal({ open, defaultLang, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1)
  const [lang, setLang] = useState(defaultLang)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      setStep(1)
      setLang(defaultLang)
      setSelected(new Set())
    }
  }, [open, defaultLang])

  if (!open) return null

  const toggleAllergen = (key: string) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key); else next.add(key)
    setSelected(next)
  }

  const finishWithRecommendation = () => {
    onComplete(lang, [...selected], buildFirstQuery(lang, [...selected]))
  }
  const finishWithoutQuery = () => {
    onComplete(lang, [...selected], null)
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-panel">
        {/* Step indicator */}
        <div className="onboarding-progress">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`onboarding-progress-dot${step === s ? ' active' : ''}${step > s ? ' done' : ''}`}
            />
          ))}
        </div>

        {/* ── Step 1: 言語 ── */}
        {step === 1 && (
          <>
            <div className="onboarding-header">
              <Globe size={26} strokeWidth={1.7} color="#10a37f" />
              <h2 className="onboarding-title">{t(lang, 'step1Title')}</h2>
              <p className="onboarding-hint">{t(lang, 'step1Hint')}</p>
            </div>
            <div className="onboarding-lang-grid">
              {QUICK_LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={`onboarding-lang-chip${lang === l.code ? ' active' : ''}`}
                  onClick={() => setLang(l.code)}
                >
                  <span className="onboarding-lang-native">{l.native}</span>
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button type="button" className="onboarding-next" onClick={() => setStep(2)}>
                {t(lang, 'next')} <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: アレルギー ── */}
        {step === 2 && (
          <>
            <div className="onboarding-header">
              <AlertCircle size={26} strokeWidth={1.7} color="#ff9966" />
              <h2 className="onboarding-title">{t(lang, 'step2Title')}</h2>
              <p className="onboarding-hint">{t(lang, 'step2Hint')}</p>
            </div>

            <div className="onboarding-allergens-section">
              <div className="onboarding-allergens-label">{t(lang, 'common')}</div>
              <div className="onboarding-allergens-grid">
                {COMMON_ALLERGENS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    className={`onboarding-allergen-chip${selected.has(a.key) ? ' active' : ''}`}
                    onClick={() => toggleAllergen(a.key)}
                  >
                    <span className="onboarding-allergen-emoji">{a.emoji}</span>
                    <span>{lang === 'ja' ? a.jp : a.en}</span>
                  </button>
                ))}
              </div>

              <div className="onboarding-allergens-label">{t(lang, 'religious')}</div>
              <div className="onboarding-allergens-grid">
                {RELIGIOUS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    className={`onboarding-allergen-chip${selected.has(a.key) ? ' active' : ''}`}
                    onClick={() => toggleAllergen(a.key)}
                  >
                    <span className="onboarding-allergen-emoji">{a.emoji}</span>
                    <span>{lang === 'ja' ? a.jp : a.en}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="onboarding-actions">
              <button type="button" className="onboarding-back" onClick={() => setStep(1)}>
                ← {t(lang, 'back')}
              </button>
              <button type="button" className="onboarding-skip" onClick={() => setStep(3)}>
                {t(lang, 'step2Skip')}
              </button>
              <button type="button" className="onboarding-next" onClick={() => setStep(3)}>
                {t(lang, 'next')} <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: 完了 ── */}
        {step === 3 && (
          <>
            <div className="onboarding-header">
              <Sparkles size={26} strokeWidth={1.7} color="#ffd166" />
              <h2 className="onboarding-title">{t(lang, 'step3Title')}</h2>
              <p className="onboarding-hint">{t(lang, 'step3Hint')}</p>
            </div>
            <div className="onboarding-step3-cta">
              <button type="button" className="onboarding-primary-cta" onClick={finishWithRecommendation}>
                ✨ {t(lang, 'step3CTA')}
              </button>
              <button type="button" className="onboarding-secondary-cta" onClick={finishWithoutQuery}>
                {t(lang, 'step3CTAAlt')}
              </button>
            </div>
            <div className="onboarding-actions">
              <button type="button" className="onboarding-back" onClick={() => setStep(2)}>
                ← {t(lang, 'back')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** 完了時に chat に投入する最初のクエリを言語別に生成 (アレルギー付き or なし) */
function buildFirstQuery(lang: string, allergies: string[]): string {
  const hasAllergens = allergies.length > 0

  if (lang === 'ja') {
    return hasAllergens
      ? `おすすめを教えて。${allergiesLabelJa(allergies)}があります`
      : 'おすすめを教えて'
  }
  if (lang === 'en') {
    return hasAllergens
      ? `What do you recommend? I have ${allergiesLabelEn(allergies)}.`
      : 'What do you recommend?'
  }
  if (lang === 'ko') {
    return hasAllergens
      ? `추천 메뉴를 알려주세요. ${allergies.join(', ')} 알레르기가 있어요`
      : '추천 메뉴를 알려주세요'
  }
  return 'What do you recommend?'
}

function allergiesLabelJa(allergies: string[]): string {
  const map: Record<string, string> = {
    egg: '卵アレルギー', milk: '乳アレルギー', wheat: '小麦アレルギー',
    shrimp: 'えびアレルギー', crab: 'かにアレルギー', soba: 'そばアレルギー',
    peanut: '落花生アレルギー', walnut: 'くるみアレルギー',
    halal: 'ハラール対応希望', hindu: 'ヒンドゥー教徒（牛肉NG）',
    vegetarian: 'ベジタリアン', vegan: 'ヴィーガン',
  }
  return allergies.map((a) => map[a] || a).join('・')
}
function allergiesLabelEn(allergies: string[]): string {
  return allergies.map((a) => `a ${a} allergy`).join(' and ')
}
