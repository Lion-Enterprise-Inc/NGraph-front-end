import { Menu, SquarePen } from 'lucide-react'
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

interface CaptureHeaderProps {
  restaurant?: Restaurant | ApiRestaurant | null
  onMenu: () => void
  onLanguage: () => void
  onNewChat: () => void
}

export default function CaptureHeader({ restaurant, onMenu, onLanguage, onNewChat }: CaptureHeaderProps) {
  const { language } = useAppContext()
  const copy = getUiCopy(language)

  return (
    <header className="capture-header sticky">
      <button className="icon-button" type="button" aria-label={copy.captureHeader.menu} onClick={onMenu}>
        <Menu size={22} strokeWidth={1.75} />
      </button>
      <div className="brand-title nav-brand" style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 700,
        fontSize: '18px',
        letterSpacing: '-0.02em',
        color: '#1f2937',
        fontStretch: 'expanded'
      }}>
        NGraph
      </div>
      <button className="icon-button" type="button" aria-label="New Chat" onClick={onNewChat}>
        <SquarePen size={20} strokeWidth={1.75} />
      </button>
    </header>
  )
}
