import { getLanguageLabel, getUiCopy } from '../i18n/uiCopy'

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M4.5 8.5h15" />
      <path d="M4.5 15.5h15" />
      <path d="M12 3c2.6 3.2 2.6 14.8 0 18" />
      <path d="M9 3.8c-1.4 2.6-1.4 13.8 0 16.4" />
      <path d="M15 3.8c1.4 2.6 1.4 13.8 0 16.4" />
    </svg>
  )
}

function CaretIcon() {
  return (
    <svg
      viewBox="0 0 12 8"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 1.5 6 6.5 11 1.5" />
    </svg>
  )
}

type LanguageSelectProps = {
  selected?: string
  onOpen?: () => void
}

export default function LanguageSelect({ selected = 'ja', onOpen }: LanguageSelectProps) {
  const copy = getUiCopy(selected)
  const display =
    getLanguageLabel(selected) ?? selected?.toUpperCase?.() ?? copy.language.fallback

  return (
    <div className="language-select">
      <button
        className="lang-shortcut"
        type="button"
        onClick={onOpen}
        aria-label={copy.language.change}
      >
        <span className="lang-icon" aria-hidden="true">
          <GlobeIcon />
        </span>
        <span className="lang-label">{display}</span>
        <span className="lang-caret" aria-hidden="true">
          <CaretIcon />
        </span>
      </button>
    </div>
  )
}
