'use client'

import { Suspense } from 'react'
import CapturePage from '../../pages/CapturePage'

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        background: '#0D0D0D'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid rgba(255,255,255,0.1)',
          borderTopColor: 'rgba(255,255,255,0.5)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <CapturePage />
    </Suspense>
  )
}
