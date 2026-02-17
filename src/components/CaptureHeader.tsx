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
  restaurantName?: string | null
  restaurantNameRomaji?: string | null
}

export default function CaptureHeader({ onMenu, onLanguage, restaurantName, restaurantNameRomaji }: CaptureHeaderProps) {
  const { language } = useAppContext()
  const copy = getUiCopy(language)
  const badge = LANG_BADGES[language] || language.slice(0, 2).toUpperCase()

  const isJa = language === 'ja'
  // Non-Japanese: show romaji as primary if available, otherwise Japanese name
  const displayName = (!isJa && restaurantNameRomaji) ? restaurantNameRomaji : (restaurantName || 'NGraph')

  return (
    <header className="capture-header sticky">
      <button className="icon-button" type="button" aria-label={copy.captureHeader.menu} onClick={onMenu}>
        <Menu size={22} strokeWidth={1.75} color="rgba(255,255,255,0.9)" />
      </button>
      <div className="header-title-area" style={{
        flex: 1,
        textAlign: 'center',
        minWidth: 0,
        overflow: 'hidden',
      }}>
        <div style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 700,
          fontSize: '17px',
          letterSpacing: '-0.02em',
          color: 'rgba(255,255,255,0.9)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '1.4',
        }}>
          {displayName}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button className="header-lang-badge" type="button" onClick={onLanguage}>
          {badge}
        </button>
      </div>
    </header>
  )
}
