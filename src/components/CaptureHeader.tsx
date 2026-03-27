import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, Info, X, MapPin, Clock, Phone, Instagram, ExternalLink, Sun, Moon } from 'lucide-react'
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

interface RestaurantInfo {
  name?: string
  address?: string | null
  city?: string | null
  phone_number?: string | null
  opening_hours?: string | null
  holidays?: string | null
  access_info?: string | null
  budget?: string | null
  instagram_url?: string | null
  business_type?: string | null
}

interface CaptureHeaderProps {
  onMenu: () => void
  onLanguage: () => void
  restaurantName?: string | null
  restaurantData?: RestaurantInfo | null
}

export default function CaptureHeader({ onMenu, onLanguage, restaurantName, restaurantData }: CaptureHeaderProps) {
  const router = useRouter()
  const { language, theme, toggleTheme } = useAppContext()
  const copy = getUiCopy(language)
  const badge = LANG_BADGES[language] || language.slice(0, 2).toUpperCase()
  const [showInfo, setShowInfo] = useState(false)
  const isJa = language === 'ja'

  const hasInfo = restaurantData && (restaurantData.address || restaurantData.opening_hours || restaurantData.phone_number)

  return (
    <>
      <header className="capture-header sticky">
        <button className="icon-button" type="button" aria-label={copy.captureHeader.menu} onClick={onMenu}>
          <Menu size={22} strokeWidth={1.75} color="currentColor" />
        </button>
        <div className="capture-header-center">
          {restaurantName ? (
            <>
              <span className="capture-header-name">{restaurantName}</span>
              {hasInfo && (
                <button
                  className="store-info-btn"
                  type="button"
                  onClick={() => setShowInfo(!showInfo)}
                  aria-label="Store info"
                >
                  <Info size={14} strokeWidth={2} />
                </button>
              )}
            </>
          ) : (
            <span className="capture-header-name">NGraph</span>
          )}
        </div>
        <div className="capture-header-actions">
          <button className="icon-button" type="button" aria-label="Toggle theme" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} strokeWidth={1.75} color="currentColor" /> : <Moon size={18} strokeWidth={1.75} color="currentColor" />}
          </button>
          <button className="header-lang-badge" type="button" onClick={onLanguage}>
            {badge}
          </button>
        </div>
      </header>

      {showInfo && restaurantData && (
        <div className="store-info-panel">
          <div className="store-info-header">
            <span className="store-info-title">{restaurantData.name}</span>
            <button className="store-info-close" type="button" onClick={() => setShowInfo(false)}>
              <X size={16} />
            </button>
          </div>
          {restaurantData.business_type && (
            <span className="store-info-type">{restaurantData.business_type}</span>
          )}
          <div className="store-info-rows">
            {restaurantData.address && (
              <div className="store-info-row">
                <MapPin size={14} />
                <span>{restaurantData.address}</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantData.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-info-map-link"
                >
                  <ExternalLink size={12} />
                  Map
                </a>
              </div>
            )}
            {restaurantData.access_info && (
              <div className="store-info-row store-info-sub">
                <span>{restaurantData.access_info}</span>
              </div>
            )}
            {restaurantData.opening_hours && (
              <div className="store-info-row">
                <Clock size={14} />
                <span>{restaurantData.opening_hours}</span>
              </div>
            )}
            {restaurantData.holidays && (
              <div className="store-info-row store-info-sub">
                <span>{isJa ? '定休日: ' : 'Closed: '}{restaurantData.holidays}</span>
              </div>
            )}
            {restaurantData.phone_number && (
              <div className="store-info-row">
                <Phone size={14} />
                <a href={`tel:${restaurantData.phone_number}`} className="store-info-link">{restaurantData.phone_number}</a>
              </div>
            )}
            {restaurantData.instagram_url && (
              <div className="store-info-row">
                <Instagram size={14} />
                <a href={restaurantData.instagram_url} target="_blank" rel="noopener noreferrer" className="store-info-link">Instagram</a>
              </div>
            )}
            {restaurantData.budget && (
              <div className="store-info-row">
                <span className="store-info-budget">{isJa ? '予算' : 'Budget'}: ~{restaurantData.budget}{isJa ? '円' : '??'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
