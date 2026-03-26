import { Camera, UtensilsCrossed, CalendarCheck, MapPin, Clock } from 'lucide-react'
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
  const nameParts = (restaurantName || '').split(/\s+/);
  const brandName = nameParts[0] || heading;
  const branchName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

  const handleRound1Click = (text: string, index: number) => {
    // 全チップで即送信（2巡目の方向性チップは廃止）
    onRecommendationClick?.(text)
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

      <div className="store-home-actions">
        <button
          className="store-home-action-btn store-home-action-menu"
          onClick={onExploreMenuClick}
        >
          <UtensilsCrossed size={18} strokeWidth={1.8} />
          <span>{webCopy.exploreMenu}</span>
        </button>

        <button
          className="store-home-action-btn store-home-action-camera"
          onClick={onCamera}
        >
          <Camera size={18} strokeWidth={1.8} />
          <span>{copy.cameraPrompt.openCamera}</span>
        </button>
      </div>

      <div className="store-home-chips">
        {recommendations?.map((text, i) => (
          <button
            key={i}
            className="store-home-chip"
            onClick={() => handleRound1Click(text, i)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}
