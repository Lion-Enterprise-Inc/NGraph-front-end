import { Menu } from 'lucide-react'
import { getUiCopy } from '../i18n/uiCopy'
import { useAppContext } from './AppProvider'

const LANG_BADGES: Record<string, string> = {
  ja: 'JP', en: 'US', 'zh-Hans': 'CN', 'zh-Hant': 'TW',
  ko: 'KR', es: 'ES', fr: 'FR', de: 'DE', it: 'IT',
  pt: 'PT', ru: 'RU', th: 'TH', vi: 'VN', id: 'ID',
  ms: 'MY', ar: 'SA', hi: 'IN', tr: 'TR', bn: 'BD',
  my: 'MM', tl: 'PH', lo: 'LA', km: 'KH', ne: 'NP',
  mn: 'MN', fa: 'IR', uk: 'UA', pl: 'PL',
}

interface CaptureHeaderProps {
  onMenu: () => void
  onLanguage: () => void
}

export default function CaptureHeader({ onMenu, onLanguage }: CaptureHeaderProps) {
  const { language } = useAppContext()
  const copy = getUiCopy(language)
  const badge = LANG_BADGES[language] || language.slice(0, 2).toUpperCase()

  return (
    <header className="capture-header sticky">
      <button className="icon-button" type="button" aria-label={copy.captureHeader.menu} onClick={onMenu}>
        <Menu size={22} strokeWidth={1.75} color="rgba(255,255,255,0.9)" />
      </button>
      <div style={{ flex: 1 }} />
      <button className="header-lang-badge" type="button" onClick={onLanguage}>
        {badge}
      </button>
    </header>
  )
}
