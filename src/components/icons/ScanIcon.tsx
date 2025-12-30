type ScanIconProps = {
  size?: number
  stroke?: string
}

export default function ScanIcon({ size = 28, stroke = '#191919' }: ScanIconProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      width={size}
      height={size}
      fill="none"
      stroke={stroke}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 10V6h4" />
      <path d="M22 10V6h-4" />
      <path d="M6 18v4h4" />
      <path d="M22 18v4h-4" />
      <rect x="9" y="9" width="10" height="10" rx="2" />
    </svg>
  )
}
