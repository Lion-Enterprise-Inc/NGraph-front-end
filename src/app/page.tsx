'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import HomePage from '../pages/HomePage'

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantSlug = searchParams?.get('restaurant')

  useEffect(() => {
    if (restaurantSlug) {
      router.replace(`/capture?restaurant=${encodeURIComponent(restaurantSlug)}`)
    }
  }, [restaurantSlug, router])

  if (restaurantSlug) return null

  return <HomePage />
}

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0D0D0D'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid rgba(255,255,255,0.15)',
          borderTopColor: 'rgba(255,255,255,0.6)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
