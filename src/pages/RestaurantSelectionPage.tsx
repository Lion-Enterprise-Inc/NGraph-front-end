'use client'

import { useRouter } from 'next/navigation'
import { QrCode } from 'lucide-react'
import { getUiCopy, type LanguageCode } from '../i18n/uiCopy'
import LanguageSelect from '../components/LanguageSelect'

type RestaurantSelectionPageProps = {
  language?: LanguageCode
  onLanguageOpen?: () => void
  onContinue?: (restaurant: { uid: string; name: string; slug: string }) => void
  onScanQR?: () => void
}

export default function RestaurantSelectionPage({
  language = 'ja',
  onLanguageOpen,
  onContinue,
  onScanQR,
}: RestaurantSelectionPageProps) {
  const router = useRouter()
  const copy = getUiCopy(language)

  return (
    <div className="page restaurant-selection-page">
      <header className="restaurant-selection-header">
        <h1 className="restaurant-selection-title">{copy.restaurant.title}</h1>
        <p className="restaurant-selection-subtitle">{copy.restaurant.subtitle}</p>
        <LanguageSelect selected={language} onOpen={onLanguageOpen} />
      </header>

      <main className="restaurant-selection-main">
        {/* QR Code Scan Section */}
        <div className="qr-scan-section">
          <h2 className="qr-scan-title">{copy.qrScanner.scanQR}</h2>
          <p className="qr-scan-description">Scan a QR code to access your restaurant's menu and place orders</p>
          <button
            className="qr-scan-btn"
            onClick={() => {
              if (onScanQR) {
                onScanQR()
              } else {
                router.push('/qr-scanner')
              }
            }}
          >
            <QrCode size={32} />
            <span>{copy.qrScanner.scanQR}</span>
          </button>
        </div>
      </main>
    </div>
  )
}
