'use client'

import IconCard from './IconCard'
import MenuIcon from './icons/MenuIcon'
import GuideIcon from './icons/GuideIcon'
import TranslateIcon from './icons/TranslateIcon'
import { useAppContext } from './AppProvider'
import { getUiCopy } from '../i18n/uiCopy'

export default function IconRow() {
  const { language } = useAppContext()
  const copy = getUiCopy(language)

  return (
    <div className="icon-row">
      <IconCard label={copy.common.menu}>
        <MenuIcon />
      </IconCard>
      <IconCard label={copy.common.guide}>
        <GuideIcon />
      </IconCard>
      <IconCard label={copy.common.translate}>
        <TranslateIcon />
      </IconCard>
    </div>
  )
}
