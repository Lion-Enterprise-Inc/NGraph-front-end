import LanguageSelect from '../components/LanguageSelect'
import CTAButton from '../components/CTAButton'
import bannerImage from '../assets/ads-banner.jpg'
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
        <h1 className="home-title">Omiseai</h1>
        <LanguageSelect selected={language} onOpen={openLanguageModal} />
        <CTAButton
          label={copy.cta.go}
          ariaLabel={copy.cta.continue}
          onClick={onContinue}
        />
      </main>

      <div className="home-banner" aria-label={copy.home.bannerLabel}>
        <img src={bannerImage.src} alt={copy.home.bannerAlt} />
      </div>

      <footer className="bottom-bar" />
    </div>
  )
}
