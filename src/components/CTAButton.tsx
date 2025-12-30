type CTAButtonProps = {
  label: string
  ariaLabel: string
  onClick?: () => void
}

export default function CTAButton({ label, ariaLabel, onClick }: CTAButtonProps) {
  return (
    <button className="cta pressable" type="button" aria-label={ariaLabel} onClick={onClick}>
      <span className="cta-arrow">{label}</span>
    </button>
  )
}
