'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import HomePage from '../pages/HomePage'
import { useAppContext } from '../components/AppProvider'

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { openLanguageModal } = useAppContext()
  
  // Check if there's a restaurant parameter from QR scan
  const restaurantSlug = searchParams?.get('restaurant')

  const handleContinue = () => {
    // Always go to capture/chat page with restaurant parameter if available
    if (restaurantSlug) {
      router.push(`/capture?restaurant=${restaurantSlug}`)
    } else {
      // Default restaurant or go to capture without specific restaurant
      router.push('/capture')
    }
  }

  return (
    <HomePage
      onContinue={handleContinue}
    />
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          border: '4px solid rgba(255,255,255,0.3)', 
          borderTopColor: '#fff', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }} />
        <p style={{ color: '#fff', marginTop: '16px', fontSize: '16px', fontWeight: '500' }}>読み込み中...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
