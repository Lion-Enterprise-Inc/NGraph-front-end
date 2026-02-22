import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NGraph — AI多言語メニューガイド',
  description: '福井の飲食店メニューを、あなたの言葉で。カメラやチャットでご案内します。',
  openGraph: {
    title: 'NGraph — AI多言語メニューガイド',
    description: '福井の飲食店メニューを、あなたの言葉で。カメラやチャットでご案内します。',
    url: 'https://app.ngraph.jp/capture',
    siteName: 'NGraph',
    images: [{ url: 'https://app.ngraph.jp/og-ngraph.png', width: 1200, height: 630 }],
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NGraph — AI多言語メニューガイド',
    description: '福井の飲食店メニューを、あなたの言葉で。カメラやチャットでご案内します。',
    images: ['https://app.ngraph.jp/og-ngraph.png'],
  },
}

export default function CaptureLayout({ children }: { children: ReactNode }) {
  return children
}
