'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantSlug = searchParams?.get('restaurant')

  useEffect(() => {
    if (restaurantSlug) {
      router.replace(`/capture?restaurant=${encodeURIComponent(restaurantSlug)}`)
    } else {
      router.replace('/admin/login')
    }
  }, [restaurantSlug, router])

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', background: '#FAF6F0',
    }}>
      <div style={{
        width: '32px', height: '32px',
        border: '2px solid rgba(139,105,20,0.2)',
        borderTopColor: '#D4622B',
        borderRadius: '50%', animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: '#FAF6F0',
      }}>
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid rgba(139,105,20,0.2)',
          borderTopColor: '#D4622B',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
