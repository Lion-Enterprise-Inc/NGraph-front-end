'use client'

import dynamic from 'next/dynamic'
import { useAppContext } from '../../components/AppProvider'

const QRScannerPage = dynamic(
  () => import('../../pages/QRScannerPage'),
  { 
    ssr: false,
    loading: () => <div className="qr-scanner-loading-page">Loading...</div>
  }
)

export default function Page() {
  const { language } = useAppContext()
  return <QRScannerPage language={language} />
}
