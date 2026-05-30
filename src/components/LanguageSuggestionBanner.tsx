'use client'

/**
 * 多言語自動検出 + 切替誘導バナー。
 *
 * 動作:
 * - ブラウザ言語を検出
 * - 現在表示言語と異なる && まだ dismiss されていない場合のみ表示
 * - 「Switch to English?」風の控えめなトップバナー
 * - 「切替」「閉じる」のいずれかで dismiss = true → 二度表示しない
 *
 * これまで初回訪問で言語モーダルを自動 open していた介入を、
 * より穏やかな bar 形式に置き換える。
 */

import { useEffect, useState } from 'react'
import { X, Languages } from 'lucide-react'
import { useAppContext } from './AppProvider'
import { languageOptions } from '../i18n/uiCopy'

const DISMISS_KEY = 'omiseai_lang_suggestion_dismissed'

/** ブラウザ言語を NGraph の言語コードへ正規化 (zh のサブタグ判定含む) */
function normalizeBrowserLang(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.startsWith('zh')) {
    return lower.includes('hant') || lower.includes('tw') || lower.includes('hk')
      ? 'zh-Hant'
      : 'zh-Hans'
  }
  return lower.split('-')[0]
}

/** 切替誘導ラベル (検出された言語側の自然な表現で出す) */
function getSwitchLabel(targetLang: string): string {
  const labels: Record<string, string> = {
    en: 'Switch to English?',
    ko: '한국어로 전환하시겠어요?',
    'zh-Hans': '切换为简体中文？',
    'zh-Hant': '切換為繁體中文？',
    es: '¿Cambiar a Español?',
    fr: 'Passer en Français ?',
    de: 'Auf Deutsch umschalten?',
    it: 'Passare all\'Italiano?',
    pt: 'Mudar para Português?',
    ru: 'Переключить на русский?',
    th: 'เปลี่ยนเป็นภาษาไทย?',
    vi: 'Chuyển sang tiếng Việt?',
    id: 'Beralih ke Bahasa Indonesia?',
    ar: 'التبديل إلى العربية؟',
    hi: 'हिन्दी पर स्विच करें?',
    tr: 'Türkçeye geç?',
    ja: '日本語に切り替えますか？',
  }
  return labels[targetLang] || `Switch language?`
}

export default function LanguageSuggestionBanner() {
  const { language, setLanguage } = useAppContext()
  const [suggested, setSuggested] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // 既に dismiss 済み → 表示しない
    if (localStorage.getItem(DISMISS_KEY) === 'true') return
    // 既に localStorage に言語選択が記録されている (= ユーザー意思決定済) → 表示しない
    if (localStorage.getItem('appLanguage')) return

    const browser = normalizeBrowserLang(navigator.language || 'ja')
    if (browser === language) return  // 既に同じ言語

    // 候補言語がサポート対象かチェック
    const supported = languageOptions.some((o) => o.code === browser)
    if (!supported) return

    setSuggested(browser)
  }, [language])

  if (!suggested) return null

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, 'true') } catch {}
    setSuggested(null)
  }

  const switchTo = () => {
    setLanguage(suggested, 'auto-detect-banner')
    try { localStorage.setItem(DISMISS_KEY, 'true') } catch {}
    setSuggested(null)
  }

  return (
    <div className="lang-suggest-banner" role="region" aria-label="Language suggestion">
      <Languages size={16} strokeWidth={1.75} />
      <span className="lang-suggest-banner-text">{getSwitchLabel(suggested)}</span>
      <button
        type="button"
        className="lang-suggest-banner-action"
        onClick={switchTo}
        aria-label="Switch language"
      >
        {suggested === 'en' ? 'Switch' : '切替'}
      </button>
      <button
        type="button"
        className="lang-suggest-banner-close"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}
