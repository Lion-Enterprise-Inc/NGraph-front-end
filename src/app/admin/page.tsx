'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../components/admin/AdminLayout'
import { apiClient } from '../../services/api'

const LANG_COLORS: Record<string, string> = {
  ja: '#3B82F6',
  en: '#10B981',
  zh: '#EF4444',
  ko: '#8B5CF6',
}

const TOPIC_COLORS: Record<string, string> = {
  'メニュー・料理': '#3B82F6',
  'アレルゲン': '#EF4444',
  '店舗情報': '#10B981',
  'ドリンク': '#8B5CF6',
  'おすすめ': '#F59E0B',
  'その他': '#94A3B8',
}

function LangBar({ dist }: { dist: Record<string, number> | null | undefined }) {
  if (!dist) return null
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return null

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>言語分布</div>
      <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', background: '#1E293B' }}>
        {entries.map(([lang, count]) => {
          const pct = (count / total) * 100
          const color = LANG_COLORS[lang] || '#64748B'
          return (
            <div
              key={lang}
              title={`${lang}: ${count} (${pct.toFixed(1)}%)`}
              style={{ width: `${pct}%`, background: color, minWidth: pct > 0 ? 2 : 0 }}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
        {entries.map(([lang, count]) => (
          <span key={lang} style={{ fontSize: 11, color: LANG_COLORS[lang] || '#64748B' }}>
            {lang}: {count}
          </span>
        ))}
      </div>
    </div>
  )
}

function TopicPieChart({ data }: { data: Record<string, number> | null }) {
  if (!data) return null
  const entries = Object.entries(data).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return null

  const items = entries.map(([topic, count]) => ({
    topic,
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
            <span style={{ color: '#E2E8F0' }}>{e.topic}</span>
            <span style={{ color: '#94A3B8' }}>{e.count} ({e.pct.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StoreDashboard() {
  const [restaurant, setRestaurant] = useState<any>(null)
  const [restaurantLoading, setRestaurantLoading] = useState(true)
  const [restaurantError, setRestaurantError] = useState('')
  const [menuCount, setMenuCount] = useState<number | null>(null)
  const [eventStats, setEventStats] = useState<any>(null)
  const [messageStats, setMessageStats] = useState<any>(null)
  const [sessionStats, setSessionStats] = useState<any>(null)

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setRestaurantLoading(true)
        const userStr = sessionStorage.getItem('user')
        if (!userStr) {
          setRestaurantError('ユーザーデータが見つかりません')
          return
        }

        const user = JSON.parse(userStr)
        if (!user.restaurant_slug) {
          setRestaurantError('レストラン情報が見つかりません')
          return
        }

        const response = await apiClient.get(`/restaurants/detail-by-user/${user.uid}`) as { result: any; message: string; status_code: number }
        setRestaurant(response.result)

        // Fetch menu count
        if (response.result?.uid) {
          try {
            const menuResponse = await apiClient.get(`/menus/?restaurant_uid=${response.result.uid}&page=1&size=1`) as any
            setMenuCount(menuResponse.result?.total ?? 0)
          } catch {
            setMenuCount(0)
          }
        }
      } catch (error) {
        console.error('Failed to fetch restaurant:', error)
        setRestaurantError('レストラン情報の取得に失敗しました')
      } finally {
        setRestaurantLoading(false)
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
    fetchRestaurant()
    fetchEventStats()
    fetchMessageStats()
    fetchSessionStats()
  }, [])

  return (
    <>
      <section className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0, textAlign: 'left' }}>レストランダッシュボード</h2>
          </div>
        </div>

        {restaurantLoading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: '#94A3B8' }}>読み込み中...</div>
          </div>
        ) : restaurantError ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', marginBottom: '16px', color: '#dc2626' }}>エラー</div>
            <div style={{ color: '#94A3B8' }}>{restaurantError}</div>
          </div>
        ) : restaurant ? (
          <>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-title">レストラン情報</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#1E293B', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>レストラン名</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#F8FAFC' }}>{restaurant.name || '未設定'}</div>
                </div>
                <div style={{ padding: '16px', background: '#1E293B', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>登録メニュー数</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#667eea' }}>{menuCount !== null ? menuCount : '-'}</div>
                </div>
                <div style={{ padding: '16px', background: '#1E293B', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>電話番号</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#F8FAFC' }}>{restaurant.phone_number || '未設定'}</div>
                </div>
                <div style={{ padding: '16px', background: '#1E293B', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>住所</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC', lineHeight: 1.4 }}>{restaurant.address || '未設定'}</div>
                </div>
                <div style={{ padding: '16px', background: '#1E293B', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>ステータス</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>
                    <span style={{
                      background: restaurant.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: restaurant.is_active ? '#10B981' : '#EF4444',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {restaurant.is_active ? '有効' : '無効'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ width: '100%', maxWidth: 'none' }}>
              <div className="card-title">イベントログ統計</div>
              <div className="dashboard-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', width: '100%', maxWidth: 'none' }}>
                {[
                  { label: 'Good', key: 'good', color: '#10B981' },
                  { label: 'Bad', key: 'bad', color: '#EF4444' },
                  { label: 'Copy', key: 'copy', color: '#3B82F6' },
                  { label: 'Share', key: 'share', color: '#8B5CF6' },
                  { label: 'Review', key: 'review', color: '#F59E0B' },
                  { label: 'Scan', key: 'scan', color: '#06B6D4' },
                ].map(item => (
                  <div key={item.key} className="stat-card" style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    textAlign: 'center',
                    padding: '16px',
                    minHeight: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '12px',
                    border: '1px solid #1E293B'
                  }}>
                    <div className="stat-label" style={{ fontSize: '16px', fontWeight: 600, color: '#F8FAFC', marginBottom: '12px' }}>{item.label}</div>
                    <div className="stat-value" style={{ fontSize: '36px', fontWeight: 700, color: item.color }}>{eventStats?.[item.key] ?? '-'}</div>
                  </div>
                ))}
              </div>
              <LangBar dist={eventStats?.lang_distribution} />
            </div>

            {messageStats && messageStats.lang_distribution && Object.keys(messageStats.lang_distribution).length > 0 && (
              <div className="card" style={{ marginTop: '16px' }}>
                <div className="card-title">チャット利用統計（{messageStats.total_messages}メッセージ）</div>
                <LangBar dist={messageStats.lang_distribution} />
              </div>
            )}

            {sessionStats && sessionStats.total_sessions > 0 && (
              <div className="card" style={{ marginTop: '16px' }}>
                <div className="card-title">セッション統計</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#1E293B', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>セッション数</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#3B82F6' }}>{sessionStats.total_sessions}</div>
                  </div>
                  <div style={{ padding: '16px', background: '#1E293B', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '4px' }}>平均滞在</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#10B981' }}>
                      {sessionStats.avg_duration >= 60 ? `${Math.floor(sessionStats.avg_duration / 60)}分` : `${sessionStats.avg_duration}秒`}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
        setError('統計情報の取得に失敗しました')
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
        <div style={{ color: '#94A3B8', fontSize: '16px' }}>統計情報を読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ color: '#dc2626', fontSize: '16px', marginBottom: '8px' }}>エラー</div>
        <div style={{ color: '#94A3B8' }}>{error}</div>
      </div>
    )
  }

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h2 className="card-title" style={{ fontSize: '24px', margin: 0 }}>プラットフォーム統計</h2>
      </div>

      <div className="card">
        <div className="card-title">サービス概要</div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">導入レストラン数</div>
            <div className="stat-value">{stats?.total_restaurants ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">登録メニュー数</div>
            <div className="stat-value">{stats?.total_menus ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">承認済メニュー数</div>
            <div className="stat-value" style={{ color: '#10B981' }}>{stats?.total_verified_menus ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">ユーザー数</div>
            <div className="stat-value">{stats?.total_users ?? 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">総QRスキャン数</div>
            <div className="stat-value" style={{ color: '#06B6D4' }}>{stats?.total_qr_scans ?? 0}</div>
          </div>
        </div>
      </div>

      {stats?.users_by_role && (
        <div className="card">
          <div className="card-title">ロール別ユーザー数</div>
          <div className="stats-grid">
            {stats.users_by_role.superadmin !== undefined && (
              <div className="stat-card">
                <div className="stat-label">Superadmin</div>
                <div className="stat-value">{stats.users_by_role.superadmin}</div>
              </div>
            )}
            {stats.users_by_role.platform_owner !== undefined && (
              <div className="stat-card">
                <div className="stat-label">Platform Owner</div>
                <div className="stat-value">{stats.users_by_role.platform_owner}</div>
              </div>
            )}
            {stats.users_by_role.restaurant_owner !== undefined && (
              <div className="stat-card">
                <div className="stat-label">Restaurant Owner</div>
                <div className="stat-value">{stats.users_by_role.restaurant_owner}</div>
              </div>
            )}
            {stats.users_by_role.consumer !== undefined && (
              <div className="stat-card">
                <div className="stat-label">Consumer</div>
                <div className="stat-value">{stats.users_by_role.consumer}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">イベントログ統計（全店舗合計）</div>
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
          <div className="card-title">トピック分布</div>
          <TopicPieChart data={topicData} />
        </div>
      )}

      {sessionStats && sessionStats.total_sessions > 0 && (
        <div className="card">
          <div className="card-title">セッション統計</div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">総セッション数</div>
              <div className="stat-value" style={{ color: '#3B82F6' }}>{sessionStats.total_sessions}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">平均滞在時間</div>
              <div className="stat-value" style={{ color: '#10B981' }}>
                {sessionStats.avg_duration >= 60 ? `${Math.floor(sessionStats.avg_duration / 60)}分${sessionStats.avg_duration % 60}秒` : `${sessionStats.avg_duration}秒`}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 16 }}>
            {sessionStats.referrer_distribution && Object.keys(sessionStats.referrer_distribution).length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginBottom: 8 }}>流入元</div>
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
                <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginBottom: 8 }}>画面サイズ</div>
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
          <div className="card-title">チャット利用統計（全{messageStats.total_messages}メッセージ）</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {messageStats.lang_distribution && Object.keys(messageStats.lang_distribution).length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginBottom: 12 }}>使用言語分布</div>
                <LangBar dist={messageStats.lang_distribution} />
              </div>
            )}
            {messageStats.device_distribution && Object.keys(messageStats.device_distribution).length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginBottom: 12 }}>デバイス分布</div>
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
  const [userType, setUserType] = useState<'store' | 'admin'>('admin')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('admin_logged_in')
    if (!isLoggedIn) {
      router.push('/admin/login')
      return
    }
    const savedUserType = sessionStorage.getItem('admin_user_type')
    if (savedUserType === 'admin' || savedUserType === 'store') {
      setUserType(savedUserType)
    }
    setIsLoading(false)
  }, [router])

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
        <div style={{ marginTop: '16px', color: '#94A3B8', fontSize: '14px' }}>読み込み中...</div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <AdminLayout title={userType === 'store' ? 'NGraph レストラン管理システム' : 'NGraph プラットフォーム管理システム'}>
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
