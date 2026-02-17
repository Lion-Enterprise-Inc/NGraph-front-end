import { getUiCopy, languageOptions } from '../i18n/uiCopy'
import { Check } from 'lucide-react'

const LANG_BADGES: Record<string, string> = {
  ja: 'JP', en: 'US', 'zh-Hans': 'CN', 'zh-Hant': 'TW',
  ko: 'KR', es: 'ES', fr: 'FR', de: 'DE', it: 'IT',
  pt: 'PT', ru: 'RU', th: 'TH', vi: 'VN', id: 'ID',
  ms: 'MY', ar: 'SA', hi: 'IN', tr: 'TR', bn: 'BD',
  my: 'MM', tl: 'PH', lo: 'LA', km: 'KH', ne: 'NP',
  mn: 'MN', fa: 'IR', uk: 'UA', pl: 'PL',
}

type LanguageModalProps = {
  open: boolean
  selected: string
  onSelect: (code: string) => void
  onClose: () => void
}

export default function LanguageModal({
  open,
  selected,
  onSelect,
  onClose,
}: LanguageModalProps) {
  if (!open) return null
  const copy = getUiCopy(selected)

  return (
    <>
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      <div className="bottom-sheet language-sheet">
        <div className="bottom-sheet-handle" />
        <div className="language-sheet-title">言語 / Language</div>
        <div className="language-list" role="listbox" aria-label={copy.language.list}>
          {languageOptions.map((lang) => {
            const isSelected = lang.code === selected
            const badge = LANG_BADGES[lang.code] || lang.code.slice(0, 2).toUpperCase()
            return (
              <button
                key={lang.code}
                className={`language-item${isSelected ? ' selected' : ''}`}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(lang.code)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="language-badge">{badge}</span>
                  <span className="language-label">{lang.label}</span>
                </div>
                {isSelected && (
                  <span className="language-check">
                    <Check size={18} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
