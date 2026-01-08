'use client'

import { useRouter } from 'next/navigation'
import RestaurantSelectionPage from '../../pages/RestaurantSelectionPage'
import { useAppContext } from '../../components/AppProvider'

export default function Page() {
  const router = useRouter()
  const { language, openLanguageModal } = useAppContext()

  const handleContinue = (restaurantId: string) => {
    router.push(`/capture?from=restaurant&restaurantId=${restaurantId}`)
  }

  return (
    <RestaurantSelectionPage
      language={language}
      onLanguageOpen={openLanguageModal}
      onContinue={handleContinue}
    />
  )
}
