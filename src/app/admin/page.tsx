'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../components/admin/AdminLayout'
import { apiClient, MenuApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { useAdminLang } from '../../hooks/useAdminLang'
import { getTopicLabel } from '../../i18n/adminCopy'
import MenuAnalyticsSection from './menu-analytics/MenuAnalyticsSection'

const LANG_COLORS: Record<string, string> = {
  ja: '#3B82F6',
  en: '#10B981',
  zh: '#EF4444',
  ko: '#8B5CF6',
}

// スクロールで画面に入った時だけ子を描画する（重い分析を初期描画から外しフリーズを防ぐ）
function LazyMount({ children, minHeight = 200 }: { children: React.ReactNode; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || show) return
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        setShow(true)
        io.disconnect()
      }
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [show])
  return <div ref={ref} style={show ? undefined : { minHeight }}>{show ? children : null}</div>
}

const TOPIC_COLORS: Record<string, string> = {
  'メニュー・料理': '#3B82F6',
  'アレルゲン': '#EF4444',
  '店舗情報': '#10B981',
  'ドリンク': '#8B5CF6',
  'おすすめ': '#F59E0B',
  'その他': '#94A3B8',
}

function LangBar({ dist, label }: { dist: Record<string, number> | null | undefined; label: string }) {
  if (!dist) return null
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return null

  return (
    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: '#94A3B8' }}>{label}</span>
      {entries.map(([lang, count]) => {
        const pct = Math.round((count / total) * 100)
        const color = LANG_COLORS[lang] || '#64748B'
        return (
          <span key={lang} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#E2E8F0' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <strong style={{ color }}>{lang}</strong> {count}
            <span style={{ color: '#64748B' }}>({pct}%)</span>
          </span>
        )
      })}
    </div>
  )
}

function TopicPieChart({ data, labelOf }: { data: Record<string, number> | null; labelOf: (key: string) => string }) {
  if (!data) return null
  const entries = Object.entries(data).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return null

  const items = entries.map(([topic, count]) => ({
    topic,
    label: labelOf(topic),
    count,
    pct: (count / total) * 100,
    color: TOPIC_COLORS[topic] || '#64748B',
  }))

  const gradient = items.map((e, i) => {
    const start = items.slice(0, i).reduce((s, x) => s + x.pct, 0)
    return `${e.color} ${start}% ${start + e.pct}%`
  }).join(', ')

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: `conic-gradient(${gradient})`,
        flexShrink: 0,
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((e) => (
          <div key={e.topic} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: e.color, flexShrink: 0 }} />
            <span style={{ color: '#E2E8F0' }}>{e.label}</span>
            <span style={{ color: '#94A3B8' }}>{e.count} ({e.pct.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StoreDashboard() {
  const { t } = useAdminLang()
  const restaurantsSetRef = useRef(false)
  const [restaurant, setRestaurant] = useState<any>(null)
  const [restaurantLoading, setRestaurantLoading] = useState(true)
  const [restaurantError, setRestaurantError] = useState('')
  const [menuCount, setMenuCount] = useState<number | null>(null)
  const [eventStats, setEventStats] = useState<any>(null)
  const [messageStats, setMessageStats] = useState<any>(null)
  const [sessionStats, setSessionStats] = useState<any>(null)
  const [userRestaurants, setUserRestaurants] = useState<{uid: string, name: string, slug: string}[]>([])
  const [selectedStoreUid, setSelectedStoreUid] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('selectedStoreUid')
    }
    return null
  })

  const fetchRestaurantData = useCallback(async (storeUid?: string) => {
    try {
      setRestaurantLoading(true)
      const userStr = sessionStorage.getItem('user')
      if (!userStr) {
        setRestaurantError(t.dashboard.errorUserNotFound)
        return
      }

      const user = JSON.parse(userStr)

      // 複数店舗リストがあればセット（初回のみ）
      if (user.restaurants?.length > 0 && !restaurantsSetRef.current) {
        restaurantsSetRef.current = true
        setUserRestaurants(user.restaurants)
      }

      const savedUid = sessionStorage.getItem('selectedStoreUid')
      const targetUid = storeUid || savedUid || (user.restaurants?.[0]?.uid)
      if (targetUid) {
        if (!sessionStorage.getItem('selectedStoreUid')) {
          sessionStorage.setItem('selectedStoreUid', targetUid)
        }
        const response = await apiClient.get(`/restaurants/${targetUid}`) as { result: any }
        setRestaurant(response.result)
        sessionStorage.setItem('selectedStoreName', response.result?.name || '')
        window.dispatchEvent(new Event('selectedStoreChanged'))
      } else if (user.restaurant_slug) {
        const response = await apiClient.get(`/restaurants/detail-by-user/${user.uid}`) as { result: any }
        setRestaurant(response.result)
      } else {
        setRestaurantError(t.dashboard.errorRestaurantNotFound)
        return
      }
    } catch (error) {
      console.error('Failed to fetch restaurant:', error)
      setRestaurantError(t.dashboard.errorRestaurantFetch)
    } finally {
      setRestaurantLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // メニューカウント取得
  useEffect(() => {
    if (!restaurant?.uid) return
    const fetchMenuCount = async () => {
      try {
        const menuResponse = await apiClient.get(`/menus/?restaurant_uid=${restaurant.uid}&page=1&size=1`) as any
        setMenuCount(menuResponse.result?.total ?? 0)
      } catch {
        setMenuCount(0)
      }
    }
    fetchMenuCount()
  }, [restaurant?.uid])

  useEffect(() => {
    const fetchEventStats = async () => {
      try {
        const res = await apiClient.get('/admin/event-stats') as { result: any }
        setEventStats(res.result)
      } catch {
        setEventStats({ good: 0, bad: 0, copy: 0, share: 0, review: 0, scan: 0, total: 0 })
      }
    }

    const fetchMessageStats = async () => {
      try {
        const res = await apiClient.get('/admin/message-stats') as { result: any }
        setMessageStats(res.result)
      } catch {
        setMessageStats(null)
      }
    }
    const fetchSessionStats = async () => {
      try {
        const res = await apiClient.get('/admin/session-stats') as { result: any }
        setSessionStats(res.result)
      } catch {
        setSessionStats(null)
      }
    }
    fetchRestaurantData(selectedStoreUid || undefined)
    fetchEventStats()
    fetchMessageStats()
    fetchSessionStats()
  }, [selectedStoreUid])

  return (
    <>
      <section className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="section-title" style={{ margin: 0, textAlign: 'left' }}>{t.dashboard.restaurantTitle}</h2>
          </div>
          {userRestaurants.length > 1 && (
            <select
              value={selectedStoreUid || userRestaurants[0]?.uid || ''}
              onChange={(e) => {
                const uid = e.target.value
                setSelectedStoreUid(uid)
                sessionStorage.setItem('selectedStoreUid', uid)
                const found = userRestaurants.find(r => r.uid === uid)
                if (found) {
                  sessionStorage.setItem('selectedStoreName', found.name)
                  window.dispatchEvent(new Event('selectedStoreChanged'))
                }
                setMenuCount(null)
              }}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-input)', color: 'var(--text)', fontSize: 14 }}
            >
              {userRestaurants.map((r) => (
                <option key={r.uid} value={r.uid}>{r.name}</option>
              ))}
            </select>
          )}
        </div>

        {restaurantLoading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: '#94A3B8' }}>{t.layout.loading}</div>
          </div>
        ) : restaurantError ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', marginBottom: '16px', color: '#dc2626' }}>{t.dashboard.error}</div>
            <div style={{ color: '#94A3B8' }}>{restaurantError}</div>
          </div>
        ) : restaurant ? (
          <>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-title">{t.dashboard.restaurantInfo}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#1E293B', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>{t.dashboard.restaurantName}</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#F8FAFC' }}>{restaurant.name || t.dashboard.notSet}</div>
                </div>
                <div style={{ padding: '16px', background: '#1E293B', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>{t.dashboard.registeredMenus}</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#667eea' }}>{menuCount !== null ? menuCount : '-'}</div>
                </div>
                <div style={{ padding: '16px', background: '#1E293B', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>{t.dashboard.phoneNumber}</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#F8FAFC' }}>{restaurant.phone_number || t.dashboard.notSet}</div>
                </div>
                <div style={{ padding: '16px', background: '#1E293B', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>{t.dashboard.address}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC', lineHeight: 1.4 }}>{restaurant.address || t.dashboard.notSet}</div>
                </div>
                <div style={{ padding: '16px', background: '#1E293B', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>{t.dashboard.status}</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>
                    <span style={{
                      background: restaurant.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: restaurant.is_active ? '#10B981' : '#EF4444',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {restaurant.is_active ? t.dashboard.statusActive : t.dashboard.statusInactive}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ width: '100%', maxWidth: 'none' }}>
              <div className="card-title">{t.dashboard.eventLogStats}</div>
              <div className="dashboard-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))', gap: '10px', width: '100%' }}>
                {[
                  { label: 'Good', key: 'good', color: '#10B981' },
                  { label: 'Bad', key: 'bad', color: '#EF4444' },
                  { label: 'Copy', key: 'copy', color: '#3B82F6' },
                  { label: 'Share', key: 'share', color: '#8B5CF6' },
                  { label: 'Review', key: 'review', color: '#F59E0B' },
                  { label: 'Scan', key: 'scan', color: '#06B6D4' },
                ].map(item => (
                  <div key={item.key} style={{
                    textAlign: 'center',
                    padding: '10px 8px',
                    borderRadius: '10px',
                    border: '1px solid #1E293B',
                    background: '#0F172A'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: item.color }}>{eventStats?.[item.key] ?? '-'}</div>
                  </div>
                ))}
              </div>
              <LangBar dist={eventStats?.lang_distribution} label={t.dashboard.langDistribution} />
            </div>

            {/* チャット統計 + セッション統計 を横並びにして余白を詰める */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '16px' }}>
              {messageStats && messageStats.lang_distribution && Object.keys(messageStats.lang_distribution).length > 0 && (
                <div className="card">
                  <div className="card-title">{t.dashboard.chatStatsLabel(messageStats.total_messages)}</div>
                  <LangBar dist={messageStats.lang_distribution} label={t.dashboard.langDistribution} />
                </div>
              )}
              {sessionStats && sessionStats.total_sessions > 0 && (
                <div className="card">
                  <div className="card-title">{t.dashboard.sessionStats}</div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 110, padding: '12px 20px', background: '#1E293B', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>{t.dashboard.sessionCount}</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#3B82F6' }}>{sessionStats.total_sessions}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 110, padding: '12px 20px', background: '#1E293B', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>{t.dashboard.avgStay}</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#10B981' }}>
                        {sessionStats.avg_duration >= 60 ? `${Math.floor(sessionStats.avg_duration / 60)}${t.dashboard.minute}` : `${sessionStats.avg_duration}${t.dashboard.second}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* メニュー分析（統合・遅延読み込みでフリーズ防止） */}
            <div style={{ marginTop: 24 }}>
              <h2 className="section-title" style={{ margin: '0 0 16px', textAlign: 'left', fontSize: 18 }}>{t.nav.menuAnalytics}</h2>
              <LazyMount minHeight={320}>
                <MenuAnalyticsSection uid={selectedStoreUid || restaurant?.uid} />
              </LazyMount>
            </div>
          </>
        ) : null}
      </section>

      <style jsx>{`
        .section {
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
        }

        .card {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          border: 1px solid var(--border);
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--text);
        }

        .stat-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .stat-label {
          font-size: 14px;
          color: var(--muted);
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--text);
        }

        @media (max-width: 768px) {
          .dashboard-metrics {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}

function AdminDashboard() {
  const { lang, t } = useAdminLang()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [eventStats, setEventStats] = useState<any>(null)
  const [topicData, setTopicData] = useState<Record<string, number> | null>(null)
  const [messageStats, setMessageStats] = useState<any>(null)
  const [sessionStats, setSessionStats] = useState<any>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/admin/stats') as { result: any }
        setStats(response.result)
      } catch (err) {
        console.error('Failed to fetch admin stats:', err)
        setError(t.dashboard.errorStats)
      } finally {
        setLoading(false)
      }
    }
    const fetchEventStats = async () => {
      try {
        const res = await apiClient.get('/admin/event-stats') as { result: any }
        setEventStats(res.result)
      } catch {
        setEventStats({ good: 0, bad: 0, copy: 0, share: 0, review: 0, scan: 0, total: 0 })
      }
    }
    const fetchTopics = async () => {
      try {
        const res = await apiClient.get('/admin/conversation-topics') as { result: any }
        setTopicData(res.result)
      } catch {
        setTopicData(null)
      }
    }
    const fetchMessageStats = async () => {
      try {
        const res = await apiClient.get('/admin/message-stats') as { result: any }
        setMessageStats(res.result)
      } catch {
        setMessageStats(null)
      }
    }
    const fetchSessionStats = async () => {
      try {
        const res = await apiClient.get('/admin/session-stats') as { result: any }
        setSessionStats(res.result)
      } catch {
        setSessionStats(null)
      }
    }
    fetchStats()
    fetchEventStats()
    fetchTopics()
    fetchMessageStats()
    fetchSessionStats()
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ color: '#94A3B8', fontSize: '16px' }}>{t.dashboard.loadingStats}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ color: '#dc2626', fontSize: '16px', marginBottom: '8px' }}>{t.dashboard.error}</div>
        <div style={{ color: '#94A3B8' }}>{error}</div>
      </div>
    )
  }

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h2 className="card-title" style={{ fontSize: '24px', margin: 0 }}>{t.dashboard.platformTitle}</h2>
      </div>

      <div className="card">
        <div className="card-title">{t.dashboard.serviceOverview}</div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">{t.dashboard.totalRestaurants}</div>
            <div className="stat-value">{stats?.live_restaurants ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t.dashboard.totalMenus}</div>
            <div className="stat-value">{stats?.live_menus ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t.dashboard.corpusRestaurants}</div>
            <div className="stat-value" style={{ color: '#94A3B8' }}>{stats?.corpus_restaurants ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t.dashboard.corpusMenus}</div>
            <div className="stat-value" style={{ color: '#94A3B8' }}>{stats?.corpus_menus ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t.dashboard.totalVerifiedMenus}</div>
            <div className="stat-value" style={{ color: '#10B981' }}>{stats?.total_verified_menus ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t.dashboard.totalUsers}</div>
            <div className="stat-value">{stats?.total_users ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t.dashboard.totalQrScans}</div>
            <div className="stat-value" style={{ color: '#06B6D4' }}>{stats?.total_qr_scans ?? 0}</div>
          </div>
        </div>
      </div>

      {stats?.users_by_role && (
        <div className="card">
          <div className="card-title">{t.dashboard.usersByRole}</div>
          <div className="stats-grid">
            {stats.users_by_role.superadmin !== undefined && (
              <div className="stat-card">
                <div className="stat-label">{t.dashboard.roleSuperadmin}</div>
                <div className="stat-value">{stats.users_by_role.superadmin}</div>
              </div>
            )}
            {stats.users_by_role.platform_owner !== undefined && (
              <div className="stat-card">
                <div className="stat-label">{t.dashboard.rolePlatformOwner}</div>
                <div className="stat-value">{stats.users_by_role.platform_owner}</div>
              </div>
            )}
            {stats.users_by_role.restaurant_owner !== undefined && (
              <div className="stat-card">
                <div className="stat-label">{t.dashboard.roleRestaurantOwner}</div>
                <div className="stat-value">{stats.users_by_role.restaurant_owner}</div>
              </div>
            )}
            {stats.users_by_role.consumer !== undefined && (
              <div className="stat-card">
                <div className="stat-label">{t.dashboard.roleConsumer}</div>
                <div className="stat-value">{stats.users_by_role.consumer}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">{t.dashboard.eventLogStatsAll}</div>
        <div className="stats-grid">
          {[
            { label: 'Good', key: 'good', color: '#10B981' },
            { label: 'Bad', key: 'bad', color: '#EF4444' },
            { label: 'Copy', key: 'copy', color: '#3B82F6' },
            { label: 'Share', key: 'share', color: '#8B5CF6' },
            { label: 'Review', key: 'review', color: '#F59E0B' },
            { label: 'Scan', key: 'scan', color: '#06B6D4' },
          ].map(item => (
            <div key={item.key} className="stat-card">
              <div className="stat-label">{item.label}</div>
              <div className="stat-value" style={{ color: item.color }}>{eventStats?.[item.key] ?? '-'}</div>
            </div>
          ))}
        </div>
      </div>

      {topicData && Object.keys(topicData).length > 0 && (
        <div className="card">
          <div className="card-title">{t.dashboard.topicDistribution}</div>
          <TopicPieChart data={topicData} labelOf={(k) => getTopicLabel(lang, k)} />
        </div>
      )}

      {sessionStats && sessionStats.total_sessions > 0 && (
        <div className="card">
          <div className="card-title">{t.dashboard.sessionStats}</div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">{t.dashboard.totalSessions}</div>
              <div className="stat-value" style={{ color: '#3B82F6' }}>{sessionStats.total_sessions}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t.dashboard.avgStayDuration}</div>
              <div className="stat-value" style={{ color: '#10B981' }}>
                {sessionStats.avg_duration >= 60 ? `${Math.floor(sessionStats.avg_duration / 60)}${t.dashboard.minute}${sessionStats.avg_duration % 60}${t.dashboard.second}` : `${sessionStats.avg_duration}${t.dashboard.second}`}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 16 }}>
            {sessionStats.referrer_distribution && Object.keys(sessionStats.referrer_distribution).length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginBottom: 8 }}>{t.dashboard.referrer}</div>
                {Object.entries(sessionStats.referrer_distribution as Record<string, number>).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).map(([ref, count]) => (
                  <div key={ref} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: '#E2E8F0' }}>{ref}</span>
                    <span style={{ color: '#94A3B8' }}>{count as number}</span>
                  </div>
                ))}
              </div>
            )}
            {sessionStats.screen_distribution && Object.keys(sessionStats.screen_distribution).length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginBottom: 8 }}>{t.dashboard.screenSize}</div>
                {(() => {
                  const entries = Object.entries(sessionStats.screen_distribution as Record<string, number>).sort((a, b) => b[1] - a[1])
                  const total = entries.reduce((s, [, v]) => s + v, 0)
                  const colors: Record<string, string> = { Mobile: '#3B82F6', Tablet: '#F59E0B', Desktop: '#8B5CF6' }
                  return (
                    <>
                      <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', background: '#1E293B' }}>
                        {entries.map(([size, count]) => (
                          <div key={size} title={`${size}: ${count}`} style={{ width: `${(count / total) * 100}%`, background: colors[size] || '#64748B', minWidth: 2 }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                        {entries.map(([size, count]) => (
                          <span key={size} style={{ fontSize: 11, color: colors[size] || '#64748B' }}>{size}: {count}</span>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {messageStats && (messageStats.lang_distribution && Object.keys(messageStats.lang_distribution).length > 0 || messageStats.device_distribution && Object.keys(messageStats.device_distribution).length > 0) && (
        <div className="card">
          <div className="card-title">{t.dashboard.chatStatsAllLabel(messageStats.total_messages)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {messageStats.lang_distribution && Object.keys(messageStats.lang_distribution).length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginBottom: 12 }}>{t.dashboard.langUsageDistribution}</div>
                <LangBar dist={messageStats.lang_distribution} label={t.dashboard.langDistribution} />
              </div>
            )}
            {messageStats.device_distribution && Object.keys(messageStats.device_distribution).length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginBottom: 12 }}>{t.dashboard.deviceDistribution}</div>
                {(() => {
                  const entries = Object.entries(messageStats.device_distribution as Record<string, number>).sort((a, b) => b[1] - a[1])
                  const total = entries.reduce((s, [, v]) => s + v, 0)
                  const deviceColors: Record<string, string> = { iPhone: '#3B82F6', iPad: '#06B6D4', Android: '#10B981', 'Android Tablet': '#34D399', PC: '#8B5CF6' }
                  return (
                    <>
                      <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', background: '#1E293B', marginTop: 12 }}>
                        {entries.map(([device, count]) => {
                          const pct = (count / total) * 100
                          return (
                            <div key={device} title={`${device}: ${count} (${pct.toFixed(1)}%)`}
                              style={{ width: `${pct}%`, background: deviceColors[device] || '#64748B', minWidth: pct > 0 ? 2 : 0 }} />
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                        {entries.map(([device, count]) => (
                          <span key={device} style={{ fontSize: 11, color: deviceColors[device] || '#64748B' }}>
                            {device}: {count}
                          </span>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .card {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          border: 1px solid var(--border);
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--text);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .stat-label {
          font-size: 14px;
          color: var(--muted);
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--text);
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, isRestaurantOwner } = useAuth()
  const { t } = useAdminLang()
  const [userType, setUserType] = useState<'store' | 'admin'>('admin')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('admin_logged_in')
    if (!isLoggedIn) {
      router.push('/admin/login')
      return
    }
    const savedUserType = sessionStorage.getItem('admin_user_type')
    // 店舗オーナーはダッシュボード廃止 → 基本情報をホームに
    if (savedUserType === 'store') {
      router.replace('/admin/basic-info')
      return
    }
    if (savedUserType === 'admin') {
      setUserType('admin')
    }
    setIsLoading(false)
  }, [router])

  // 初回ユーザー検出: restaurant_ownerでメニュー0件ならセットアップへ
  useEffect(() => {
    if (!isRestaurantOwner || !user) return
    const restaurantUid = user.restaurants?.[0]?.uid
    if (!restaurantUid) return
    MenuApi.getAll(restaurantUid, 1, 1).then(res => {
      if (res.result.total === 0) {
        router.push('/admin/setup')
      }
    }).catch(() => {})
  }, [isRestaurantOwner, user, router])

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0B1121',
        zIndex: 9999
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #334155',
          borderTopColor: '#3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ marginTop: '16px', color: '#94A3B8', fontSize: '14px' }}>{t.layout.loading}</div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <AdminLayout title={`OMISEAI ${userType === 'store' ? t.layout.restaurantSystemTitle : t.layout.platformSystemTitle}`}>
      <div className="dashboard">
        {userType === 'store' ? <StoreDashboard /> : <AdminDashboard />}
      </div>

      <style jsx>{`
        .dashboard {
          max-width: 100%;
        }
      `}</style>
    </AdminLayout>
  )
}
