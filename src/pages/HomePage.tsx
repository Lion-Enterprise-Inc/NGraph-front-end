import LanguageSelect from '../components/LanguageSelect'
import CTAButton from '../components/CTAButton'
import { getUiCopy } from '../i18n/uiCopy'
import { useAppContext } from '../components/AppProvider'

type HomePageProps = {
  onContinue?: () => void
}

export default function HomePage({
  onContinue,
}: HomePageProps) {
  const { language, openLanguageModal } = useAppContext()
  const copy = getUiCopy(language)

  return (
    <div className="page home-page">
      <main className="home-main">
        <h1 className="home-title">NGraph</h1>
        <LanguageSelect selected={language} onOpen={openLanguageModal} />
        <CTAButton
          label={copy.cta.go}
          ariaLabel={copy.cta.continue}
          onClick={onContinue}
        />
      </main>

      <footer className="bottom-bar" />
    </div>
  )
}
