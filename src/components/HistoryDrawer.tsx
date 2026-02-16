import { Globe, ChevronDown } from 'lucide-react'
import { getUiCopy, languageOptions } from '../i18n/uiCopy'
import { useAppContext } from './AppProvider'

type HistoryItem = {
  id: string
  title: string
  date: string
}

type HistoryDrawerProps = {
  open: boolean
  onClose?: () => void
  items?: HistoryItem[]
}

export default function HistoryDrawer({
  open,
  onClose,
  items = [],
}: HistoryDrawerProps) {
  const { language, setLanguage } = useAppContext()
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
            <Globe size={20} strokeWidth={1.6} />
          </span>
          <select
            className="drawer-language-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            aria-label={copy.language.select}
          >
            {languageOptions.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
          <span className="drawer-chevron" aria-hidden="true">
            <ChevronDown size={16} strokeWidth={2} />
          </span>
        </div>
      </aside>
    </div>
  )
}
