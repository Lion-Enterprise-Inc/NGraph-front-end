'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ShortCodeRedirect() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const shortCode = params?.code as string
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!shortCode) return

    const resolve = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api'
        const res = await fetch(`${apiBaseUrl}/restaurants/by-short-code/${shortCode}`)
        if (!res.ok) {
          setError(true)
          return
        }
        const data = await res.json()
        const slug = data.result?.slug
        if (!slug) {
          setError(true)
          return
        }
        const table = searchParams?.get('t')
        const url = `/capture?restaurant=${slug}${table ? `&t=${table}` : ''}`
        router.replace(url)
      } catch {
        setError(true)
      }
    }

    resolve()
  }, [shortCode, searchParams, router])

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Restaurant not found</h2>
          <p>The QR code may be invalid or expired.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ marginTop: 16, color: '#6b7280' }}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
