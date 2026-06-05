'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { PhotoReviewApi, PhotoReviewItem, RestaurantApi, TokenService } from '../../../services/api'
import { useAdminLang } from '../../../hooks/useAdminLang'

export default function PhotoReviewPage() {
  const { lang, t } = useAdminLang()
  const [items, setItems] = useState<PhotoReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [restaurantUid, setRestaurantUid] = useState<string>('')
  const [restaurants, setRestaurants] = useState<{ uid: string; name: string }[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const user = TokenService.getUser()
  const isStoreOwner = user?.role === 'restaurant_owner'

  useEffect(() => {
    if (!isStoreOwner) {
      RestaurantApi.getAll(1, 200).then(res => {
        setRestaurants(res.result.items.map(r => ({ uid: r.uid, name: r.name })))
      }).catch(() => {})
    }
  }, [isStoreOwner])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await PhotoReviewApi.getAll(restaurantUid || undefined, statusFilter || undefined)
      setItems(res.result)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [statusFilter, restaurantUid])

  const handleApprove = async (uid: string) => {
    setActionLoading(uid)
    try {
      await PhotoReviewApi.approve(uid)
      fetchItems()
    } catch (e: any) {
      alert(e.message || 'Failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (uid: string) => {
    setActionLoading(uid)
    try {
      await PhotoReviewApi.reject(uid)
      fetchItems()
    } catch (e: any) {
      alert(e.message || 'Failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (uid: string) => {
    if (!confirm(t.photoReview.confirmDelete)) return
    setActionLoading(uid)
    try {
      await PhotoReviewApi.remove(uid)
      fetchItems()
    } catch (e: any) {
      alert(e.message || 'Failed')
    } finally {
      setActionLoading(null)
    }
  }

  const matchBadgeColor = (result: string) => {
    if (result === 'match') return { bg: 'rgba(16,185,129,0.15)', color: '#10B981', border: 'rgba(16,185,129,0.3)' }
    if (result === 'uncertain') return { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)' }
    return { bg: 'rgba(239,68,68,0.15)', color: '#EF4444', border: 'rgba(239,68,68,0.3)' }
  }

  return (
    <AdminLayout title={t.photoReview.title}>
      <div style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {!isStoreOwner && (
          <select
            value={restaurantUid}
            onChange={e => setRestaurantUid(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border-strong)', fontSize: 14 }}
          >
            <option value="">{t.common.allRestaurants}</option>
            {restaurants.map(r => <option key={r.uid} value={r.uid}>{r.name}</option>)}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border-strong)', fontSize: 14 }}
        >
          <option value="">{t.common.allStatuses}</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>{t.layout.loading}</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>{t.photoReview.empty}</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
        }}>
          {items.map(item => {
            const badge = matchBadgeColor(item.match_result)
            const isLoading = actionLoading === item.uid
            return (
              <div key={item.uid} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', gap: 0 }}>
                  <div style={{ width: '50%', aspectRatio: '1', overflow: 'hidden', background: '#0a0a0a' }}>
                    <img src={item.image_url} alt={t.photoReview.altSubmitted} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  {item.menu_image_url && (
                    <div style={{ width: '50%', aspectRatio: '1', overflow: 'hidden', background: '#0a0a0a' }}>
                      <img src={item.menu_image_url} alt={t.photoReview.altCurrent} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                    </div>
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{item.menu_name}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                    }}>
                      {item.match_result}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 11,
                      background: 'rgba(255,255,255,0.06)', color: 'var(--muted)',
                      border: '1px solid var(--border)',
                    }}>
                      {item.status}
                    </span>
                  </div>
                  {item.match_reason && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.4 }}>
                      {item.match_reason}
                    </div>
                  )}
                  {item.created_at && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
                      {new Date(item.created_at).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {item.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(item.uid)}
                          disabled={isLoading}
                          style={{
                            flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: 'rgba(16,185,129,0.15)', color: '#10B981', fontWeight: 600, fontSize: 13,
                          }}
                        >
                          {isLoading ? t.common.ellipsis : t.common.approve}
                        </button>
                        <button
                          onClick={() => handleReject(item.uid)}
                          disabled={isLoading}
                          style={{
                            flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontWeight: 600, fontSize: 13,
                          }}
                        >
                          {isLoading ? t.common.ellipsis : t.common.reject}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(item.uid)}
                      disabled={isLoading}
                      style={{
                        padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer',
                        background: 'transparent', color: 'var(--muted)', fontSize: 13,
                      }}
                    >
                      {t.common.delete}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
