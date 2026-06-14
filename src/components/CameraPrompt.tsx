import type { ReactNode } from 'react'
import { Camera, UtensilsCrossed, CalendarCheck, MapPin, Clock } from 'lucide-react'
import { getUiCopy } from '../i18n/uiCopy'
import { useAppContext } from './AppProvider'

const buildStoreGreeting = (lang: string, store: string): string => {
  // JP は店名込みの「店の声」を維持(日本人は読めるので冗長感なし)。
  if (lang === 'ja') return `いらっしゃいませ。\n${store} AI が何でもお答えします。`
  // 多言語は店名を繰り返さない(店名は上に大きく表示済み)。AI への導線だけ残す。
  const templates: Record<string, string> = {
    en: `Welcome.\nAsk our AI anything.`,
    ko: `어서 오세요.\nAI에게 무엇이든 물어보세요.`,
    'zh-Hans': `欢迎光临。\n有任何问题都可以问 AI。`,
    'zh-Hant': `歡迎光臨。\n有任何問題都可以問 AI。`,
    es: `Bienvenido.\nPregunta lo que quieras a nuestra IA.`,
    fr: `Bienvenue.\nPosez toutes vos questions à notre IA.`,
    de: `Willkommen.\nFragen Sie unsere KI alles.`,
    it: `Benvenuto.\nChiedi qualsiasi cosa alla nostra IA.`,
    pt: `Bem-vindo.\nPergunte qualquer coisa à nossa IA.`,
    ru: `Добро пожаловать.\nСпрашивайте у нашего ИИ что угодно.`,
    th: `ยินดีต้อนรับ\nสอบถาม AI ได้ทุกเรื่อง`,
    vi: `Xin chào.\nHỏi AI bất cứ điều gì.`,
    id: `Selamat datang.\nTanyakan apa saja kepada AI kami.`,
    ms: `Selamat datang.\nTanya AI kami apa sahaja.`,
    ar: `أهلاً وسهلاً\nاسأل الذكاء الاصطناعي عن أي شيء`,
    hi: `स्वागत है।\nहमारे AI से कुछ भी पूछें।`,
    tr: `Hoş geldiniz.\nYapay zekâmıza her şeyi sorun.`,
    bn: `স্বাগতম।\nআমাদের AI-কে যেকোনো কিছু জিজ্ঞাসা করুন।`,
    my: `ကြိုဆိုပါသည်။\nAI ကို မေးနိုင်ပါသည်။`,
    tl: `Maligayang pagdating.\nMagtanong sa aming AI ng kahit ano.`,
    lo: `ຍິນດີຕ້ອນຮັບ\nຖາມ AI ໄດ້ທຸກເລື່ອງ`,
    km: `សូមស្វាគមន៍។\nសួរ AI អំពីអ្វីក៏បាន។`,
    ne: `स्वागत छ।\nहाम्रो AI लाई जे पनि सोध्नुहोस्।`,
    mn: `Тавтай морил.\nМаний AI-аас юу ч асуугаарай.`,
    fa: `خوش آمدید.\nاز هوش مصنوعی ما هر سوالی بپرسید.`,
    uk: `Ласкаво просимо.\nЗапитайте наш ШІ про що завгодно.`,
    pl: `Witamy.\nZapytaj naszą SI o cokolwiek.`,
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
  /** 挨拶文の下に置く静的コンテンツ(MenuStrip)。store-home は fixed 下端基準なので中に入れないと dock と重なる */
  menuStrip?: ReactNode
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
  menuStrip,
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

  // 多言語(非ja)では romaji を主役の見出しに、JP名+支店は照合用の小さい1行に。
  // 日本語表示では従来どおり JP名(大)+支店。
  const useRomajiPrimary = language !== 'ja' && !!restaurantNameRomaji;
  const primaryName = useRomajiPrimary ? (restaurantNameRomaji as string) : brandName;
  const altLine = useRomajiPrimary
    ? [brandName, branchName].filter(Boolean).join(' · ')
    : null;

  if (isWebMode && restaurantName) {
    return (
      <div className="store-home">
        <h1 className="store-home-name">
          {primaryName}
        </h1>
        {useRomajiPrimary
          ? (altLine && <p className="store-home-altname">{altLine}</p>)
          : (branchName && <p className="store-home-branch">{branchName}</p>)}
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
        {primaryName}
      </h1>
      {useRomajiPrimary
        ? (altLine && <p className="store-home-altname">{altLine}</p>)
        : (branchName && <p className="store-home-branch">{branchName}</p>)}
      <p className="store-home-sub" style={{ whiteSpace: 'pre-line' }}>
        {restaurantName ? (buildStoreGreeting(language, brandName)) : sub}
      </p>
      {menuStrip}
    </div>
  )
}
