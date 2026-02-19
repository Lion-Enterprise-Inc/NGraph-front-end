'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../components/admin/AdminLayout'
import { apiClient } from '../../services/api'

function StoreDashboard() {
  const [restaurant, setRestaurant] = useState<any>(null)
  const [restaurantLoading, setRestaurantLoading] = useState(true)
  const [restaurantError, setRestaurantError] = useState('')
  const [menuCount, setMenuCount] = useState<number | null>(null)

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

    fetchRestaurant()
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
              <div className="card-title">集客効果</div>
              <div className="dashboard-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', width: '100%', maxWidth: 'none' }}>
                <div className="stat-card" style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  textAlign: 'center',
                  padding: '16px',
                  minHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  borderRadius: '12px',
                  border: '1px solid #1E293B'
                }}>
                  <div className="stat-label" style={{ fontSize: '18px', fontWeight: 600, color: '#F8FAFC', marginBottom: '16px' }}>QRスキャン数</div>
                  <div className="stat-value" style={{ fontSize: '42px', fontWeight: 700, color: '#667eea', margin: '12px 0' }}>0</div>
                </div>
                <div className="stat-card" style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  textAlign: 'center',
                  padding: '16px',
                  minHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  borderRadius: '12px',
                  border: '1px solid #1E293B'
                }}>
                  <div className="stat-label" style={{ fontSize: '18px', fontWeight: 600, color: '#F8FAFC', marginBottom: '16px' }}>質問数</div>
                  <div className="stat-value" style={{ fontSize: '42px', fontWeight: 700, color: '#667eea', margin: '12px 0' }}>0</div>
                </div>
              </div>
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
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    fetchStats()
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
            <div className="stat-label">ユーザー数</div>
            <div className="stat-value">{stats?.total_users ?? 0}</div>
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
    <AdminLayout title={userType === 'store' ? 'NGraph レストラン管理システム' : 'NGraph プラットフォームオーナー管理システム'}>
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
