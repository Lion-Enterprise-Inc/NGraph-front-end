import CameraIcon from '../assets/Camera.png'

type CameraPromptProps = {
  heading: string
  sub: string
  buttonLabel: string
  onCamera?: () => void
  restaurantLogo?: string | null
  restaurantName?: string
}

export default function CameraPrompt({ heading, sub, buttonLabel, onCamera, restaurantLogo, restaurantName }: CameraPromptProps) {
  // If restaurant has a logo, show the logo instead of camera prompt
  if (restaurantLogo) {
    return (
      <div className="camera-prompt restaurant-logo-prompt">
        {/* Japanese welcome texts above restaurant logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            いらっしゃいませ！
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: 500,
            color: '#6b7280'
          }}>
            なんでも聞いてください
          </div>
        </div>

        <div 
          className="restaurant-logo-container"
          onClick={onCamera}
          role="button"
          tabIndex={0}
          aria-label={buttonLabel}
          onKeyDown={(e) => e.key === 'Enter' && onCamera?.()}
        >
          <img 
            src={restaurantLogo} 
            alt={restaurantName || 'Restaurant logo'} 
            className="restaurant-logo-image"
          />
        </div>
        {restaurantName && (
          <h2 className="restaurant-name-display">{restaurantName}</h2>
        )}
      </div>
    )
  }

  // Default camera prompt for when no restaurant logo is available
  return (
    <div className="camera-prompt">
      <h1 className="capture-title">{heading}</h1>
      <p className="capture-sub">{sub}</p>
      <button
        className="camera-btn pressable"
        type="button"
        aria-label={buttonLabel}
        onClick={onCamera}
      >
        <img src={CameraIcon.src} alt="" />
      </button>
    </div>
  )
}
