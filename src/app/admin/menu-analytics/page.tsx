'use client'

import React, { useEffect, useState } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { TokenService, RestaurantApi, Restaurant } from '../../../services/api'
import { useAdminLang } from '../../../hooks/useAdminLang'
import MenuAnalyticsSection from './MenuAnalyticsSection'

export default function MenuAnalyticsPage() {
  const { t } = useAdminLang()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedUid, setSelectedUid] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const user = TokenService.getUser()
    const admin = user?.role === 'superadmin' || user?.role === 'platform_owner'
    setIsAdmin(admin)
    if (admin) {
      RestaurantApi.getAll(1, 100).then(res => {
        const list = res.result?.items || []
        setRestaurants(list)
        if (list.length > 0) setSelectedUid(list[0].uid)
      }).catch(() => {})
    }
  }, [])

  return (
    <AdminLayout title={t.menuAnalytics.title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Restaurant Selector (admin only) */}
        {isAdmin && restaurants.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 13, color: 'var(--muted)', flexShrink: 0 }}>{t.menuAnalytics.storeLabel}</label>
            <select
              value={selectedUid}
              onChange={e => setSelectedUid(e.target.value)}
              style={{
                flex: 1,
                maxWidth: 320,
                padding: '8px 12px',
                background: 'var(--bg-input)',
                color: 'var(--text)',
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              {restaurants.map(r => (
                <option key={r.uid} value={r.uid}>{r.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Admin はストアが選択されるまで描画しない（誤フェッチ防止） */}
        {(!isAdmin || selectedUid) && <MenuAnalyticsSection uid={selectedUid || undefined} />}
      </div>
    </AdminLayout>
  )
}
