type CameraIconProps = {
  size?: number
}

export default function CameraIcon({ size = 48 }: CameraIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M17.5 15.5c.3-.9 1.1-1.5 2-1.5h9c.9 0 1.7.6 2 1.5l.7 2h3.8c1.1 0 2 .9 2 2V32c0 1.1-.9 2-2 2H12c-1.1 0-2-.9-2-2V19.5c0-1.1.9-2 2-2h3.5l2-2Z"
        style={{ width: '162', height: '125px', marginLeft: '1px' }}
        fill="#ffffff"
      />
      <circle cx="24" cy="26" r="6" fill="#f6b23b" />
      <circle cx="24" cy="26" r="3" fill="#ffffff" />
    </svg>
  )
}
