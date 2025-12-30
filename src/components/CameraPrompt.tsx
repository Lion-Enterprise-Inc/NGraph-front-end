import CameraIcon from '../assets/Camera.png'

type CameraPromptProps = {
  heading: string
  sub: string
  buttonLabel: string
  onCamera?: () => void
}

export default function CameraPrompt({ heading, sub, buttonLabel, onCamera }: CameraPromptProps) {
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
