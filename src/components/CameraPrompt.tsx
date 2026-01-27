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
