import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '蟹と海鮮 ぼんた — AI多言語メニューガイド',
  description: '福井の海の幸を、あなたの言葉で。カメラやチャットでメニューをご案内します。',
  openGraph: {
    title: '蟹と海鮮 ぼんた — AI多言語メニューガイド',
    description: '福井の海の幸を、あなたの言葉で。カメラやチャットでメニューをご案内します。',
    url: 'https://app.ngraph.jp/capture?restaurant=KanitoKaisenBonta',
    siteName: 'NGraph',
    images: [{ url: 'https://app.ngraph.jp/og-bonta.png', width: 1200, height: 630 }],
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: '蟹と海鮮 ぼんた — AI多言語メニューガイド',
    description: '福井の海の幸を、あなたの言葉で。カメラやチャットでメニューをご案内します。',
    images: ['https://app.ngraph.jp/og-bonta.png'],
  },
}

export default function CaptureLayout({ children }: { children: ReactNode }) {
  return children
}
