import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OMISEAI — 飲食店向け多言語AI接客',
  description: 'メニューを、あなたの言葉で。カメラやチャットで AI がご案内します。',
  openGraph: {
    title: 'OMISEAI — 飲食店向け多言語AI接客',
    description: 'メニューを、あなたの言葉で。カメラやチャットで AI がご案内します。',
    url: 'https://app.ngraph.jp/capture',
    siteName: 'OMISEAI',
    images: [{ url: 'https://app.ngraph.jp/og-omiseai.png', width: 1200, height: 630 }],
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OMISEAI — 飲食店向け多言語AI接客',
    description: 'メニューを、あなたの言葉で。カメラやチャットで AI がご案内します。',
    images: ['https://app.ngraph.jp/og-omiseai.png'],
  },
}

export default function CaptureLayout({ children }: { children: ReactNode }) {
  return children
}
