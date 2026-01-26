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
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}
