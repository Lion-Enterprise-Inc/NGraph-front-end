'use client'

import { useRouter } from 'next/navigation'
import HomePage from '../../pages/HomePage'
import { useAppContext } from '../../components/AppProvider'

export default function Page() {
  const router = useRouter()
  const { openLanguageModal } = useAppContext()

  return (
    <HomePage
      onContinue={() => router.push('/restaurant')}
    />
  )
}
