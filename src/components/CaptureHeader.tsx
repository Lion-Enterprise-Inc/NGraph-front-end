import MenuSimpleIcon from './icons/MenuSimpleIcon'
import vector from '../assets/vector.png'
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
        <MenuSimpleIcon />
      </button>
      <div className="brand-title nav-brand">
        NGraph
      </div>
      <button className="icon-button" type="button" aria-label={copy.captureHeader.scan} onClick={onLanguage}>
        <img src={vector.src} alt="" />
      </button>
    </header>
  )
}
