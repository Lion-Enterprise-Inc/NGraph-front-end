import { useState } from 'react'
import { Camera, ArrowLeft, UtensilsCrossed, CalendarCheck, MapPin, Clock } from 'lucide-react'
import { getUiCopy } from '../i18n/uiCopy'
import { useAppContext } from './AppProvider'

const STORE_GREETINGS: Record<string, string> = {
  ja: 'いらっしゃいませ。',
  en: 'Welcome.',
  ko: '어서 오세요.',
  'zh-Hans': '欢迎光临。',
  'zh-Hant': '歡迎光臨。',
  es: 'Bienvenido.',
  fr: 'Bienvenue.',
  de: 'Willkommen.',
  it: 'Benvenuto.',
  pt: 'Bem-vindo.',
  ru: 'Добро пожаловать.',
  th: 'ยินดีต้อนรับ',
  vi: 'Xin chào.',
  id: 'Selamat datang.',
  ms: 'Selamat datang.',
  ar: 'أهلاً وسهلاً',
  hi: 'स्वागत है।',
  tr: 'Hoş geldiniz.',
  bn: 'স্বাগতম।',
  my: 'ကြိုဆိုပါသည်။',
  tl: 'Maligayang pagdating.',
  lo: 'ຍິນດີຕ້ອນຮັບ',
  km: 'សូមស្វាគមន៍។',
  ne: 'स्वागत छ।',
  mn: 'Тавтай морил.',
  fa: 'خوش آمدید.',
  uk: 'Ласкаво просимо.',
  pl: 'Witamy.',
}

type Round1Choice = 'signatureDish' | 'bestTime' | 'undecided'

type CameraPromptProps = {
  heading: string
  sub: string
  buttonLabel: string
  onCamera?: () => void
  restaurantLogo?: string | null
  restaurantName?: string
  restaurantNameRomaji?: string | null
  recommendations?: string[]
  onRecommendationClick?: (text: string) => void
  onRound2Click?: (round1: Round1Choice, menuGroup: string) => void
  isWebMode?: boolean
  restaurantAddress?: string | null
  restaurantAccess?: string | null
  restaurantHours?: string | null
  restaurantHolidays?: string | null
  onReservationClick?: () => void
  onExploreMenuClick?: () => void
}

export default function CameraPrompt({
  heading,
  sub,
  buttonLabel,
  onCamera,
  restaurantLogo,
  restaurantName,
  restaurantNameRomaji,
  recommendations,
  onRecommendationClick,
  onRound2Click,
  isWebMode,
  restaurantAddress,
  restaurantAccess,
  restaurantHours,
  restaurantHolidays,
  onReservationClick,
  onExploreMenuClick,
}: CameraPromptProps) {
  const { language } = useAppContext()
  const copy = getUiCopy(language)
  const webCopy = (copy as any).webLanding ?? {
    exploreMenu: 'Explore Menu',
    makeReservation: 'Make a Reservation',
    scanMenu: 'Scan Menu',
    hours: 'Hours',
    access: 'Access',
    closed: 'Closed',
  }
  const [round1Choice, setRound1Choice] = useState<Round1Choice | null>(null)

  const nameParts = (restaurantName || '').split(/\s+/);
  const brandName = nameParts[0] || heading;
  const branchName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

  const round2Chips = [
    { label: copy.restaurant.hearty, group: 'hearty' },
    { label: copy.restaurant.singleDish, group: 'single' },
    { label: copy.restaurant.lightAppetizer, group: 'light' },
  ]

  const handleRound1Click = (text: string, index: number) => {
    const keys: Round1Choice[] = ['signatureDish', 'bestTime', 'undecided']
    const key = keys[index]
    if (key === 'undecided') {
      onRecommendationClick?.(text)
      return
    }
    setRound1Choice(key)
  }

  const handleRound2Click = (group: string) => {
    if (round1Choice) {
      onRound2Click?.(round1Choice, group)
    }
  }

  if (isWebMode && restaurantName) {
    return (
      <div className="store-home">
        <h1 className="store-home-name">
          {brandName}
        </h1>
        {branchName && (
          <p className="store-home-branch">{branchName}</p>
        )}
        {restaurantNameRomaji && (
          <p className="store-home-romaji">{restaurantNameRomaji}</p>
        )}
        <p className="store-home-sub">
          {STORE_GREETINGS[language] || STORE_GREETINGS.en}
        </p>

        {(restaurantAddress || restaurantAccess || restaurantHours) && (
          <div className="web-landing-info">
            {restaurantAddress && (
              <div className="web-landing-info-row">
                <MapPin size={14} strokeWidth={1.8} />
                <span>{restaurantAddress}</span>
              </div>
            )}
            {restaurantAccess && (
              <div className="web-landing-info-row">
                <MapPin size={14} strokeWidth={1.8} />
                <span>{restaurantAccess}</span>
              </div>
            )}
            {restaurantHours && (
              <div className="web-landing-info-row">
                <Clock size={14} strokeWidth={1.8} />
                <span>
                  {restaurantHours}
                  {restaurantHolidays && ` / ${webCopy.closed}: ${restaurantHolidays}`}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="web-landing-actions">
          <button
            className="web-landing-btn web-landing-btn-primary"
            onClick={onExploreMenuClick}
          >
            <UtensilsCrossed size={18} strokeWidth={1.8} />
            <span>{webCopy.exploreMenu}</span>
          </button>

          <button
            className="web-landing-btn web-landing-btn-reservation"
            onClick={onReservationClick}
          >
            <CalendarCheck size={18} strokeWidth={1.8} />
            <span>{webCopy.makeReservation}</span>
          </button>

          <button
            className="web-landing-btn web-landing-btn-scan"
            onClick={onCamera}
          >
            <Camera size={18} strokeWidth={1.8} />
            <span>{webCopy.scanMenu}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="store-home">
      <h1 className="store-home-name">
        {brandName}
      </h1>
      {branchName && (
        <p className="store-home-branch">{branchName}</p>
      )}
      {restaurantNameRomaji && (
        <p className="store-home-romaji">{restaurantNameRomaji}</p>
      )}
      <p className="store-home-sub">
        {restaurantName ? (STORE_GREETINGS[language] || STORE_GREETINGS.en) : sub}
      </p>

      <button
        className="camera-scan-btn"
        onClick={onCamera}
      >
        <div className="camera-scan-icon">
          <Camera size={18} strokeWidth={1.8} color="#10a37f" />
        </div>
        <div className="camera-scan-text">
          <span className="camera-scan-label">{copy.cameraPrompt.openCamera}</span>
          <span className="camera-scan-hint">{copy.hero.sub}</span>
        </div>
      </button>

      <div className="store-home-chips">
        {!round1Choice ? (
          recommendations?.map((text, i) => (
            <button
              key={i}
              className="store-home-chip"
              onClick={() => handleRound1Click(text, i)}
            >
              {text}
            </button>
          ))
        ) : (
          <>
            <button
              className="store-home-chip store-home-chip-back"
              onClick={() => setRound1Choice(null)}
            >
              <ArrowLeft size={14} />
            </button>
            {round2Chips.map((chip) => (
              <button
                key={chip.group}
                className="store-home-chip"
                onClick={() => handleRound2Click(chip.group)}
              >
                {chip.label}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
