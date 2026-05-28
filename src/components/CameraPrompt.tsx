import { Camera, UtensilsCrossed, CalendarCheck, MapPin, Clock } from 'lucide-react'
import { getUiCopy } from '../i18n/uiCopy'
import { useAppContext } from './AppProvider'

const buildStoreGreeting = (lang: string, store: string): string => {
  const templates: Record<string, string> = {
    ja: `いらっしゃいませ。\n${store} AI が何でもお答えします。`,
    en: `Welcome.\nAsk ${store} AI anything.`,
    ko: `어서 오세요.\n${store} AI가 무엇이든 답해드립니다.`,
    'zh-Hans': `欢迎光临。\n请向 ${store} AI 询问任何问题。`,
    'zh-Hant': `歡迎光臨。\n請向 ${store} AI 詢問任何問題。`,
    es: `Bienvenido.\nPregunta a ${store} AI lo que quieras.`,
    fr: `Bienvenue.\nPosez à ${store} AI toutes vos questions.`,
    de: `Willkommen.\nFragen Sie ${store} AI alles.`,
    it: `Benvenuto.\nChiedi a ${store} AI qualsiasi cosa.`,
    pt: `Bem-vindo.\nPergunte a ${store} AI qualquer coisa.`,
    ru: `Добро пожаловать.\nЗадавайте любые вопросы ${store} AI.`,
    th: `ยินดีต้อนรับ\nสอบถาม ${store} AI ได้ทุกเรื่อง`,
    vi: `Xin chào.\nHỏi ${store} AI bất cứ điều gì.`,
    id: `Selamat datang.\nTanyakan apa saja kepada ${store} AI.`,
    ms: `Selamat datang.\nTanya ${store} AI apa sahaja.`,
    ar: `أهلاً وسهلاً\nاسأل ${store} AI عن أي شيء`,
    hi: `स्वागत है।\n${store} AI से कुछ भी पूछें।`,
    tr: `Hoş geldiniz.\n${store} AI'ya her şeyi sorabilirsiniz.`,
    bn: `স্বাগতম।\n${store} AI-কে যেকোনো কিছু জিজ্ঞাসা করুন।`,
    my: `ကြိုဆိုပါသည်။\n${store} AI ကို မေးနိုင်ပါသည်။`,
    tl: `Maligayang pagdating.\nMagtanong sa ${store} AI ng kahit ano.`,
    lo: `ຍິນດີຕ້ອນຮັບ\nຖາມ ${store} AI ໄດ້ທຸກເລື່ອງ`,
    km: `សូមស្វាគមន៍។\nសួរ ${store} AI អំពីអ្វីក៏បាន។`,
    ne: `स्वागत छ।\n${store} AI लाई जे पनि सोध्नुहोस्।`,
    mn: `Тавтай морил.\n${store} AI-аас юу ч асуугаарай.`,
    fa: `خوش آمدید.\nاز ${store} AI هر سوالی بپرسید.`,
    uk: `Ласкаво просимо.\nЗапитайте ${store} AI про що завгодно.`,
    pl: `Witamy.\nZapytaj ${store} AI o cokolwiek.`,
  }
  return templates[lang] || templates.en
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
        <p className="store-home-sub" style={{ whiteSpace: 'pre-line' }}>
          {buildStoreGreeting(language, brandName)}
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
      <p className="store-home-sub" style={{ whiteSpace: 'pre-line' }}>
        {restaurantName ? (buildStoreGreeting(language, brandName)) : sub}
      </p>
    </div>
  )
}
