import { Camera } from 'lucide-react'

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
  return (
    <div className="store-home">
      <h1 className="store-home-name">
        {restaurantName || heading}
      </h1>
      {restaurantNameRomaji && (
        <p className="store-home-romaji">{restaurantNameRomaji}</p>
      )}
      <p className="store-home-sub">
        {restaurantName ? '何からお手伝いしますか？' : sub}
      </p>

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
        <button
          className="store-home-chip camera"
          onClick={onCamera}
        >
          <span className="camera-icon-circle">
            <Camera size={14} strokeWidth={1.6} color="#10a37f" />
          </span>
          メニューを撮影して翻訳
        </button>
      </div>
    </div>
  )
}
