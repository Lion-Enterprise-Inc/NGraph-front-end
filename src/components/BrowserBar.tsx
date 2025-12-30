import MenuLines from './icons/MenuLines'
import RefreshIcon from './icons/RefreshIcon'
import { getUiCopy } from '../i18n/uiCopy'

export default function BrowserBar({ language = 'ja' }: { language?: string }) {
  const copy = getUiCopy(language)

  return (
    <header className="browser-bar" aria-label={copy.browser.chromeMock}>
      <div className="browser-icon" aria-hidden="true">
        <MenuLines />
      </div>
      {/* <div className="browser-address">beta.hashigo.me</div> */}
      <div className="browser-actions" aria-hidden="true">
        <RefreshIcon />
      </div>
    </header>
  )
}
