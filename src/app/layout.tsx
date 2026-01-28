import '../index.css'
import '../App.css'
import { AppProvider } from '../components/AppProvider'
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/src/assets/[logo]NGraph (1920 x 1006 px) .png" />
      </head>
      <body>
        <div id="root">
          <AppProvider>{children}</AppProvider>
        </div>
      </body>
    </html>
  )
}
