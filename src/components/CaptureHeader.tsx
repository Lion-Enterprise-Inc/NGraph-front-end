import MenuSimpleIcon from './icons/MenuSimpleIcon'
import vector from '../assets/vector.png'
import { getUiCopy } from '../i18n/uiCopy'
import { type Restaurant } from '../api/mockApi'
import { useAppContext } from './AppProvider'

type CaptureHeaderProps = {
  restaurant?: Restaurant | null
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
        {restaurant ? (
          <div className="restaurant-header-info">
            <div className="restaurant-header-name">{restaurant.name}</div>
            <div className="restaurant-header-meta">
              <span className="restaurant-header-cuisine">{restaurant.cuisine}</span>
              <span className="restaurant-header-rating">★ {restaurant.rating}</span>
            </div>
          </div>
        ) : (
          'Omiseai'
        )}
      </div>
      <button className="icon-button" type="button" aria-label={copy.captureHeader.scan} onClick={onLanguage}>
        <img src={vector.src} alt="" />
      </button>
    </header>
  )
}
