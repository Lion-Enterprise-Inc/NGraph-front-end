'use client'

import { useRouter } from 'next/navigation'
import HomePage from '../../pages/HomePage'
import { useAppContext } from '../../components/AppProvider'

export default function Page() {
  const router = useRouter()
  const { language, openLanguageModal } = useAppContext()

  return (
    <HomePage
      language={language}
      onLanguageOpen={openLanguageModal}
      onContinue={() => router.push('/capture?from=home')}
    />
  )
}
