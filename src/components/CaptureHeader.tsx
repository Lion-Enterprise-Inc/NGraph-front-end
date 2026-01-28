import MenuSimpleIcon from './icons/MenuSimpleIcon'
import vector from '../assets/vector.png'
import newTabIcon from './new_tab.svg'
import hamburgerIcon from './ham.png'
import { getUiCopy } from '../i18n/uiCopy'
import { type Restaurant } from '../api/mockApi'
import { useAppContext } from './AppProvider'

type ApiRestaurant = {
  uid: string
  name: string
  slug: string
  description?: string
  is_active: boolean
  logo_url?: string | null
  created_at: string
  updated_at: string
}

type CaptureHeaderProps = {
  restaurant?: Restaurant | ApiRestaurant | null
  onMenu?: () => void
  onLanguage?: () => void
}

export default function CaptureHeader({ restaurant, onMenu, onLanguage }: CaptureHeaderProps) {
  const { language } = useAppContext()
  const copy = getUiCopy(language)

  return (
    <header className="capture-header sticky">
      <button className="icon-button" type="button" aria-label={copy.captureHeader.menu} onClick={onMenu}>
        <img src={hamburgerIcon.src} alt="" style={{ width: '20px', height: '20px' }} />
      </button>
      <div className="brand-title nav-brand" style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 800,
        fontSize: '20px',
        letterSpacing: '-0.02em',
        color: '#1f2937',
        fontStretch: 'expanded'
      }}>
        NGraph
      </div>
      <button className="icon-button" type="button" aria-label={copy.captureHeader.scan} onClick={onLanguage}>
        <img src={newTabIcon.src} alt="" />
      </button>
    </header>
  )
}
