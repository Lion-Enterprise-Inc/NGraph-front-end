import type { ReactNode } from 'react'

type IconCardProps = {
  children: ReactNode
  label: string
}

export default function IconCard({ children, label }: IconCardProps) {
  return (
    <div className="icon-card">
      <div className="icon">{children}</div>
      <div className="icon-label">{label}</div>
    </div>
  )
}
