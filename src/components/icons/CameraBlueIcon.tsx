export default function CameraBlueIcon() {
  return (
    <svg viewBox="0 0 80 80" width="68" height="68" fill="none">
      <defs>
        <linearGradient id="camBlueGrad" x1="18%" y1="10%" x2="82%" y2="90%">
          <stop offset="0%" stopColor="#00e0ff" />
          <stop offset="100%" stopColor="#0091ff" />
        </linearGradient>
        <linearGradient id="camBlueInner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#aaf2ff" />
          <stop offset="100%" stopColor="#4dd8ff" />
        </linearGradient>
      </defs>
      <rect x="14" y="12" width="52" height="56" rx="14" fill="url(#camBlueGrad)" />
      <rect x="24" y="20" width="32" height="10" rx="4" fill="#e9f7ff" opacity="0.8" />
      <circle cx="40" cy="42" r="13.5" fill="url(#camBlueInner)" />
      <circle cx="40" cy="42" r="9" fill="#ffffff" />
      <circle cx="40" cy="42" r="6" fill="url(#camBlueGrad)" />
    </svg>
  )
}
