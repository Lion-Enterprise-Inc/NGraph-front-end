import { Camera } from 'lucide-react'
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
}: CameraPromptProps) {
  const { language } = useAppContext()
  const copy = getUiCopy(language)

  // Split brand name and branch name (e.g. "蟹と海鮮ぼんた くるふ福井駅前店")
  const nameParts = (restaurantName || '').split(/\s+/);
  const brandName = nameParts[0] || heading;
  const branchName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

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
        {recommendations?.map((text, i) => (
          <button
            key={i}
            className="store-home-chip"
            onClick={() => onRecommendationClick?.(text)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}
