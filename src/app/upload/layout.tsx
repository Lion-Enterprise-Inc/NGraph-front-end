import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OMISEAI — メニュー収集',
  description: 'メニュー表の写真からメニューを登録するページです。',
}

export default function UploadLayout({ children }: { children: ReactNode }) {
  return children
}
