import MenuLines from './icons/MenuLines'
import RefreshIcon from './icons/RefreshIcon'
import { getUiCopy } from '../i18n/uiCopy'
import { useAppContext } from './AppProvider'

export default function BrowserBar() {
  const { language } = useAppContext()
  const copy = getUiCopy(language)

  return (
    <header className="browser-bar" aria-label={copy.browser.chromeMock}>
      <div className="browser-icon" aria-hidden="true">
        <MenuLines />
      </div>
      {/* <div className="browser-address">beta.ngraph.me</div> */}
      <div className="browser-actions" aria-hidden="true">
        <RefreshIcon />
      </div>
    </header>
  )
}
