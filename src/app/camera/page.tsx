'use client'

import { Suspense } from 'react'
import CameraView from '../../pages/CameraView'
import { useAppContext } from '../../components/AppProvider'

export default function Page() {
  const { language } = useAppContext()
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CameraView language={language} />
    </Suspense>
  )
}
