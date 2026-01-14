'use client'

import { useRouter } from 'next/navigation'
import RestaurantSelectionPage from '../../pages/RestaurantSelectionPage'
import { useAppContext } from '../../components/AppProvider'

export default function Page() {
  const router = useRouter()
  const { language, openLanguageModal } = useAppContext()

  const handleContinue = (restaurant: { uid: string; name: string; slug: string }) => {
    router.push(`/capture?restaurant=${restaurant.slug}`)
  }

  return (
    <RestaurantSelectionPage
      language={language}
      onLanguageOpen={openLanguageModal}
      onContinue={handleContinue}
    />
  )
}
