import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NGraph — メニュー確認',
  description: 'お店のメニュー情報の正確性を確認するページです。',
}

export default function VerifyLayout({ children }: { children: ReactNode }) {
  return children
}
