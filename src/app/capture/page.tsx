'use client'

import { Suspense } from 'react'
import CapturePage from '../../pages/CapturePage'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CapturePage />
    </Suspense>
  )
}
