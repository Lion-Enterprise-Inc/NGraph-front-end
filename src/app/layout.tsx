import '../index.css'
import '../App.css'
import { AppProvider } from '../components/AppProvider'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'NGraph — 食を正しく伝える、データインフラ',
  description: 'AI多言語メニューガイド。カメラやチャットで、あなたの言葉でメニューをご案内。',
  openGraph: {
    title: 'NGraph — 食を正しく伝える、データインフラ',
    description: 'AI多言語メニューガイド。カメラやチャットで、あなたの言葉でメニューをご案内。',
    url: 'https://app.ngraph.jp',
    siteName: 'NGraph',
    images: [{ url: 'https://app.ngraph.jp/og-ngraph.png', width: 1200, height: 630 }],
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NGraph — 食を正しく伝える、データインフラ',
    description: 'AI多言語メニューガイド。カメラやチャットで、あなたの言葉でメニューをご案内。',
    images: ['https://app.ngraph.jp/og-ngraph.png'],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.png" />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-6VCWBFY41D" strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-6VCWBFY41D');`}
        </Script>
      </head>
      <body>
        <div id="root">
          <AppProvider>{children}</AppProvider>
        </div>
      </body>
    </html>
  )
}
