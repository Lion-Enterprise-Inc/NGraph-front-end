import { Camera, UtensilsCrossed, CalendarCheck, MapPin, Clock } from 'lucide-react'
import { getUiCopy } from '../i18n/uiCopy'
import { useAppContext } from './AppProvider'

const STORE_GREETINGS: Record<string, string> = {
  ja: 'いらっしゃいませ。\nメニューのことなら何でもAIがお答えします。',
  en: 'Welcome.\nAsk our AI anything about the menu.',
  ko: '어서 오세요.\n메뉴에 대해 AI가 무엇이든 답해드립니다.',
  'zh-Hans': '欢迎光临。\n关于菜单的任何问题，AI都会为您解答。',
  'zh-Hant': '歡迎光臨。\n關於菜單的任何問題，AI都會為您解答。',
  es: 'Bienvenido.\nPregunta a nuestro AI sobre el menú.',
  fr: 'Bienvenue.\nNotre IA répond à toutes vos questions sur le menu.',
  de: 'Willkommen.\nFragen Sie unsere KI alles über die Speisekarte.',
  it: 'Benvenuto.\nChiedi alla nostra IA qualsiasi cosa sul menu.',
  pt: 'Bem-vindo.\nPergunte à nossa IA sobre o cardápio.',
  ru: 'Добро пожаловать.\nСпрашивайте нашего ИИ о меню.',
  th: 'ยินดีต้อนรับ\nสอบถาม AI เกี่ยวกับเมนูได้เลย',
  vi: 'Xin chào.\nHãy hỏi AI bất cứ điều gì về thực đơn.',
  id: 'Selamat datang.\nTanyakan apa saja tentang menu kepada AI kami.',
  ms: 'Selamat datang.\nTanya AI kami apa sahaja tentang menu.',
  ar: 'أهلاً وسهلاً\nاسأل الذكاء الاصطناعي عن أي شيء في القائمة',
  hi: 'स्वागत है।\nमेनू के बारे में AI से कुछ भी पूछें।',
  tr: 'Hoş geldiniz.\nMenü hakkında AI\'mıza her şeyi sorabilirsiniz.',
  bn: 'স্বাগতম।\nমেনু সম্পর্কে AI-কে যেকোনো কিছু জিজ্ঞাসা করুন।',
  my: 'ကြိုဆိုပါသည်။\nမီနူးအကြောင်း AI ကို မေးနိုင်ပါသည်။',
  tl: 'Maligayang pagdating.\nItanong sa aming AI ang anumang bagay tungkol sa menu.',
  lo: 'ຍິນດີຕ້ອນຮັບ\nຖາມ AI ກ່ຽວກັບເມນູໄດ້ເລີຍ',
  km: 'សូមស្វាគមន៍។\nសួរ AI អំពីម៉ឺនុយបាន។',
  ne: 'स्वागत छ।\nमेनूको बारेमा AI लाई जे पनि सोध्नुहोस्।',
  mn: 'Тавтай морил.\nЦэсний тухай AI-аас юу ч асуугаарай.',
  fa: 'خوش آمدید.\nهر سوالی درباره منو دارید از هوش مصنوعی بپرسید.',
  uk: 'Ласкаво просимо.\nЗапитайте нашого ШІ про меню.',
  pl: 'Witamy.\nZapytaj naszą AI o cokolwiek z menu.',
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
        <p className="store-home-sub" style={{ whiteSpace: 'pre-line' }}>
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
      <p className="store-home-sub" style={{ whiteSpace: 'pre-line' }}>
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
