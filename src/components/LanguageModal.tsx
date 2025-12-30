import { getUiCopy, languageOptions } from '../i18n/uiCopy'

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
    <div
      className="modal-backdrop"
      role="dialog"
      aria-label={copy.language.select}
      onClick={onClose}
    >
      <div
        className="modal-card language-modal"
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        <header className="modal-header">
          <div className="modal-title">{copy.language.modalTitle}</div>
        </header>

        <div className="language-list" role="listbox" aria-label={copy.language.list}>
          {languageOptions.map((lang) => {
            const isSelected = lang.code === selected
            return (
              <button
                key={lang.code}
                className={`language-item${isSelected ? ' selected' : ''}`}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(lang.code)}
              >
                <span className="language-check" aria-hidden="true">
                  {isSelected ? '✓' : ''}
                </span>
                <span className="language-label">{lang.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
