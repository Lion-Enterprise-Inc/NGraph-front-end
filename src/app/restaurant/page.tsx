'use client'

import { useRouter } from 'next/navigation'
import RestaurantSelectionPage from '../../pages/RestaurantSelectionPage'
import { useAppContext } from '../../components/AppProvider'

export default function Page() {
  const router = useRouter()
  const { language, openLanguageModal } = useAppContext()

  const handleContinue = (restaurant: { uid: string; name: string; slug: string; url_slug?: string | null }) => {
    // url_slug があれば優先 (英数字でクリーン)、無ければ slug にフォールバック
    const target = restaurant.url_slug || restaurant.slug
    router.push(`/capture?restaurant=${encodeURIComponent(target)}`)
  }

  return (
    <RestaurantSelectionPage
      language={language}
      onLanguageOpen={openLanguageModal}
      onContinue={handleContinue}
    />
  )
}
