import MenuSimpleIcon from './icons/MenuSimpleIcon'
import vector from '../assets/vector.png'
import { getUiCopy } from '../i18n/uiCopy'

type CaptureHeaderProps = {
  language: string
  onMenu?: () => void
  onLanguage?: () => void
}

export default function CaptureHeader({ language, onMenu, onLanguage }: CaptureHeaderProps) {
  const copy = getUiCopy(language)

  return (
    <header className="capture-header sticky">
      <button className="icon-button" type="button" aria-label={copy.captureHeader.menu} onClick={onMenu}>
        <MenuSimpleIcon />
      </button>
      <div className="brand-title nav-brand">Omiseai</div>
      <button className="icon-button" type="button" aria-label={copy.captureHeader.scan} onClick={onLanguage}>
        <img src={vector.src} alt="" />
      </button>
    </header>
  )
}
