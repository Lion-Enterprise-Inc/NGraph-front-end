import globeImage from '../assets/glob.png'
import triangleImage from '../assets/tri-angle.png'
import { getUiCopy, languageOptions } from '../i18n/uiCopy'

type HistoryItem = {
  id: string
  title: string
  date: string
}

type HistoryDrawerProps = {
  open: boolean
  language: string
  onLanguageChange?: (code: string) => void
  onClose?: () => void
  items?: HistoryItem[]
}

export default function HistoryDrawer({
  open,
  language,
  onLanguageChange,
  onClose,
  items = [],
}: HistoryDrawerProps) {
  const copy = getUiCopy(language)

  return (
    <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose}>
      <aside
        className={`drawer-panel${open ? ' open' : ''}`}
        onClick={(event) => event.stopPropagation()}
        aria-label={copy.drawer.historyLabel}
      >
        <div className="drawer-language">
          <span className="drawer-language-icon" aria-hidden="true">
            <img src={globeImage.src} alt="" />
          </span>
          <select
            className="drawer-language-select"
            value={language}
            onChange={(event) => onLanguageChange?.(event.target.value)}
            aria-label={copy.language.select}
          >
            {languageOptions.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
          <span className="drawer-chevron" aria-hidden="true">
            <img src={triangleImage.src} alt="" />
          </span>
        </div>

        <div className="drawer-history">
          {items.map((item) => (
            <div key={item.id} className="drawer-history-item">
              <div className="drawer-history-title">{item.title}</div>
              <div className="drawer-history-date">{item.date}</div>
            </div>
          ))}
        </div>

        <div className="drawer-divider" />
      </aside>
    </div>
  )
}
