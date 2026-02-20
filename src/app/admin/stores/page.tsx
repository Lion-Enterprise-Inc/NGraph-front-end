'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../../components/admin/AdminLayout'
import { useToast } from '../../../components/admin/Toast'
import { RestaurantApi, UserApi, UserListItem, CreateRestaurantRequest, Restaurant, BUSINESS_TYPES, apiClient } from '../../../services/api'

// Store type for UI display
interface StoreDisplay {
  id: number;
  uid: string;
  storeCode: string;
  name: string;
  location: string;
  address: string;
  type: string;
  plan: string;
  planId: string;
  planPrice: number;
  menuCount: number;
  lastUpdate: string;
  status: string;
}

export default function StoresPage() {
  const router = useRouter()
  const toast = useToast()
  const [filter, setFilter] = useState('all')
  const [stores, setStores] = useState<StoreDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [restaurantOwners, setRestaurantOwners] = useState<UserListItem[]>([])
  const [loadingOwners, setLoadingOwners] = useState(false)
  const [totalRestaurants, setTotalRestaurants] = useState(0)
  const [restaurantStats, setRestaurantStats] = useState<Record<string, { menu_count: number; verified_count: number; scan_count: number; lang_distribution: Record<string, number> }>>({})

  // Fetch restaurants from API on mount
  useEffect(() => {
    fetchRestaurants()
    fetchRestaurantStats()
  }, [])

  const fetchRestaurantStats = async () => {
    try {
      const res = await apiClient.get('/admin/restaurant-stats') as { result: any }
      setRestaurantStats(res.result || {})
    } catch {
      // silent
    }
  }

  const fetchRestaurants = async () => {
    setLoading(true)
    try {
      const response = await RestaurantApi.getAll()
      if (response.result && response.result.items) {
        const formattedStores: StoreDisplay[] = response.result.items.map((restaurant: Restaurant, index: number) => ({
          id: index + 1,
          uid: restaurant.uid,
          storeCode: restaurant.uid.substring(0, 8).toUpperCase(),
          name: restaurant.name,
          location: restaurant.address ? extractLocation(restaurant.address) : '未設定',
          address: restaurant.address || '',
          type: restaurant.business_type ? (BUSINESS_TYPES[restaurant.business_type] || restaurant.business_type) : '未設定',
          plan: 'フリープラン',
          planId: 'free',
          planPrice: 0,
          menuCount: restaurant.menu_count || 0,
          lastUpdate: formatDate(restaurant.updated_at),
          status: restaurant.is_active ? 'active' : 'inactive'
        }))
        setStores(formattedStores)
        setTotalRestaurants(response.result.total)
      }
    } catch (error) {
      console.error('Failed to fetch restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper to extract location from address
  const extractLocation = (address: string): string => {
    if (address.includes('Dhaka')) return 'Dhaka'
    if (address.includes('福井')) return '福井'
    if (address.includes('金沢')) return '金沢'
    if (address.includes('名古屋')) return '名古屋'
    if (address.includes('東京')) return '東京'
    if (address.includes('大阪')) return '大阪'
    return address.split(',')[0] || '未設定'
  }

  // Helper to format date
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return '今日'
    if (diffDays === 1) return '1日前'
    if (diffDays < 7) return `${diffDays}日前`
    return date.toLocaleDateString('ja-JP')
  }
  const [newStore, setNewStore] = useState({
    name: '',
    user_uid: '',
    type: '',
    address: '',
    phone: '',
    description: '',
    officialWebsite: '',
    googleProfile: '',
    hours: '',
    holidays: '',
    budget: '',
    parking: '',
    payment: '',
    seats: '',
    accessInfo: '',
    features: '',
    is_active: true
  })
  const [isStoreSearching, setIsStoreSearching] = useState(false)

  // Fetch restaurant owners when modal opens
  useEffect(() => {
    if (showModal) {
      fetchRestaurantOwners()
    }
  }, [showModal])

  const fetchRestaurantOwners = async () => {
    setLoadingOwners(true)
    try {
      const owners = await UserApi.getRestaurantOwners()
      setRestaurantOwners(owners.filter(u => u.is_active))
    } catch (error) {
      console.error('Failed to fetch restaurant owners:', error)
    } finally {
      setLoadingOwners(false)
    }
  }

  const filteredStores = filter === 'all'
    ? stores
    : stores.filter(s => s.location.toLowerCase().includes(filter === 'fukui' ? '福井' : filter === 'kanazawa' ? '金沢' : '名古屋'))

  const locationCounts = {
    all: stores.length,
    fukui: stores.filter(s => s.location === '福井').length,
    kanazawa: stores.filter(s => s.location === '金沢').length,
    nagoya: stores.filter(s => s.location === '名古屋').length,
  }

  const handleCreateStore = async () => {
    if (!newStore.name || !newStore.user_uid) {
      toast('warning', 'レストラン名とレストランオーナーは必須です')
      return
    }

    // Validate required fields based on API requirements
    if (!newStore.phone) {
      toast('warning', '電話番号は必須です')
      return
    }
    if (!newStore.address) {
      toast('warning', '住所は必須です')
      return
    }

    setIsSubmitting(true)
    try {
      const requestData: CreateRestaurantRequest = {
        name: newStore.name,
        user_uid: newStore.user_uid,
        is_active: newStore.is_active,
        phone_number: newStore.phone,
        address: newStore.address,
      }

      if (newStore.description) requestData.description = newStore.description
      if (newStore.officialWebsite) requestData.official_website = newStore.officialWebsite
      if (newStore.googleProfile) requestData.google_business_profile = newStore.googleProfile
      if (newStore.description) requestData.store_introduction = newStore.description
      if (newStore.hours) requestData.opening_hours = newStore.hours
      if (newStore.holidays) (requestData as any).holidays = newStore.holidays
      if (newStore.budget) requestData.budget = newStore.budget
      if (newStore.parking) requestData.parking_slot = newStore.parking
      if (newStore.payment) (requestData as any).payment_methods = newStore.payment
      if (newStore.seats) (requestData as any).seats = newStore.seats
      if (newStore.accessInfo) (requestData as any).access_info = newStore.accessInfo
      if (newStore.features) requestData.attention_in_detail = newStore.features
      if (newStore.type) requestData.business_type = newStore.type

      const response = await RestaurantApi.create(requestData)

      if (response.result) {
        // Add to local state for immediate UI update
        const newStoreData: StoreDisplay = {
          id: stores.length + 1,
          uid: response.result.uid,
          storeCode: response.result.uid.substring(0, 8).toUpperCase(),
          name: response.result.name,
          location: response.result.address ? extractLocation(response.result.address) : '未設定',
          address: response.result.address || '',
          type: newStore.type ? (BUSINESS_TYPES[newStore.type] || newStore.type) : '未設定',
          plan: 'フリープラン',
          planId: 'free',
          planPrice: 0,
          menuCount: 0,
          lastUpdate: '今',
          status: response.result.is_active ? 'active' : 'inactive'
        }

        setStores([...stores, newStoreData])
        setShowModal(false)
        resetNewStore()
        toast('success', `レストラン "${response.result.name}" を登録しました（UID: ${response.result.uid}）`)
      }
    } catch (error) {
      console.error('Failed to create restaurant:', error)
      toast('error', `レストラン作成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetNewStore = () => {
    setNewStore({
      name: '', user_uid: '', type: '', address: '', phone: '',
      description: '', officialWebsite: '', googleProfile: '', hours: '', holidays: '',
      budget: '', parking: '', payment: '', seats: '', accessInfo: '', features: '', is_active: true
    })
  }

  const handleStoreSearch = async () => {
    if (!newStore.name.trim()) {
      toast('warning', '店名を入力してください')
      return
    }

    setIsStoreSearching(true)
    try {
      const token = sessionStorage.getItem('access_token')
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://15.207.22.103:8000'

      const query = [newStore.name, newStore.address, newStore.phone].filter(s => s.trim()).join(' ')

      const res = await fetch(`${apiBaseUrl}/restaurants/search-info-public`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const info = data.result?.store_info

      if (info) {
        setNewStore(prev => ({
          ...prev,
          name: info.name || prev.name,
          phone: info.phone || prev.phone,
          address: info.address || prev.address,
          description: info.description || prev.description,
          officialWebsite: info.official_website || prev.officialWebsite,
          googleProfile: info.google_business_profile || prev.googleProfile,
          hours: info.business_hours || prev.hours,
          holidays: info.holidays || prev.holidays,
          budget: info.budget || prev.budget,
          parking: info.parking || prev.parking,
          payment: info.payment || prev.payment,
          seats: info.seats || prev.seats,
          accessInfo: info.access || prev.accessInfo,
          features: info.features || prev.features,
        }))
        toast('success', '情報を取得しました。内容を確認して登録してください。')
      } else {
        toast('info', '情報が見つかりませんでした')
      }
    } catch (error) {
      console.error('Search failed:', error)
      toast('error', `情報の検索に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsStoreSearching(false)
    }
  }

  const handleDeleteStore = async (storeUid: string, storeName: string) => {
    if (!confirm(`レストラン "${storeName}" を削除しますか？\n\nこの操作は元に戻すことができません。`)) return

    try {
      await RestaurantApi.delete(storeUid)
      // Remove from local state
      setStores(stores.filter(s => s.uid !== storeUid))
      setTotalRestaurants(prev => prev - 1)
      toast('success', `レストラン "${storeName}" を削除しました`)
    } catch (error) {
      console.error('Failed to delete restaurant:', error)
      toast('error', `レストランの削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Show full page loader before data is ready
  if (loading) {
    return (
      <AdminLayout title="導入レストラン一覧">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          width: '100%'
        }}>
          <div style={{ color: '#94A3B8', fontSize: '16px' }}>レストランを読み込み中...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="導入レストラン一覧">
      <div className="card" style={{ width: '100%', maxWidth: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 className="card-title" style={{ margin: 0 }}>導入レストラン一覧</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              新規レストランを登録
            </button>
            <div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#10a37f' }}>{stores.length}</span>
              <span style={{ color: '#94A3B8', marginLeft: '5px' }}>レストラン</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-secondary btn-small ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            id="filter-all"
          >
            すべて ({locationCounts.all})
          </button>
          <button
            className={`btn btn-secondary btn-small ${filter === 'fukui' ? 'active' : ''}`}
            onClick={() => setFilter('fukui')}
            id="filter-fukui"
          >
            福井 ({locationCounts.fukui})
          </button>
          <button
            className={`btn btn-secondary btn-small ${filter === 'kanazawa' ? 'active' : ''}`}
            onClick={() => setFilter('kanazawa')}
            id="filter-kanazawa"
          >
            金沢 ({locationCounts.kanazawa})
          </button>
          <button
            className={`btn btn-secondary btn-small ${filter === 'nagoya' ? 'active' : ''}`}
            onClick={() => setFilter('nagoya')}
            id="filter-nagoya"
          >
            名古屋 ({locationCounts.nagoya})
          </button>
        </div>

        {filteredStores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: '#94A3B8', width: '100%' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>--</div>
            <div>レストランが見つかりません</div>
          </div>
        ) : (
          <div id="storeListContainer">
            {filteredStores.map((store) => (
            <div key={store.id} className="store-card-compact">
              <div className="store-info-compact">
                <div className="store-main-info">
                  <div className="store-name-compact">{store.name}</div>
                  {store.storeCode && <div className="store-code-compact">ID: {store.storeCode}</div>}
                  <div className="store-location-compact">{store.location} | {store.type}</div>
                </div>
                <div className="store-status-compact">
                  {store.storeCode && <div className="store-id-badge">ID: {store.storeCode}</div>}
                  <div className="badge badge-success">{store.plan}</div>
                  <div className="store-update-compact">更新: {store.lastUpdate}</div>
                </div>
              </div>

              <div className="store-metrics-compact">
                <div className="metric-item">
                  <span className="metric-value">{store.menuCount}</span>
                  <span className="metric-label">メニュー</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value" style={{ color: '#10B981' }}>{restaurantStats[store.uid]?.verified_count ?? '-'}</span>
                  <span className="metric-label">承認済</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value" style={{ color: '#06B6D4' }}>{restaurantStats[store.uid]?.scan_count ?? '-'}</span>
                  <span className="metric-label">QRスキャン</span>
                </div>
              </div>
              {(() => {
                const ld = restaurantStats[store.uid]?.lang_distribution
                if (!ld || Object.keys(ld).length === 0) return null
                const entries = Object.entries(ld).sort((a, b) => b[1] - a[1])
                const total = entries.reduce((s, [, v]) => s + v, 0)
                if (total === 0) return null
                const langColors: Record<string, string> = { ja: '#3B82F6', en: '#10B981', zh: '#EF4444', ko: '#8B5CF6' }
                return (
                  <div style={{ padding: '0 4px' }}>
                    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: '#1E293B' }}>
                      {entries.map(([lang, count]) => (
                        <div key={lang} style={{ width: `${(count / total) * 100}%`, background: langColors[lang] || '#64748B', minWidth: 2 }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      {entries.map(([lang, count]) => (
                        <span key={lang} style={{ fontSize: 10, color: langColors[lang] || '#64748B' }}>
                          {lang}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })()}

              <div className="store-actions-compact">
                <button className="btn btn-primary btn-small" onClick={() => router.push(`/admin/basic-info?uid=${store.uid}`)} title="基本情報を管理">
                  管理
                </button>
                <button className="btn btn-secondary btn-small" onClick={() => router.push(`/admin/menu-list?uid=${store.uid}`)} title="メニュー一覧を表示">
                  メニュー
                </button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleDeleteStore(store.uid, store.name)}
                  title="レストランを削除"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* 新規店舗登録モーダル */}
      {showModal && (
        <div id="newStoreModal" className="modal active" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>新規レストランを登録</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="form-group">
              <label className="form-label">レストラン名 *</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例: 蟹と海鮮ぼんた くるふ福井駅店"
                  value={newStore.name}
                  onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStoreSearch}
                  disabled={isStoreSearching}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {isStoreSearching ? '検索中...' : '店名で情報を検索'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>店名を入力して検索すると、食べログ・Googleマップ等から情報を自動取得します</p>
            </div>

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">レストランオーナー *</label>
                <select
                  className="form-input"
                  value={newStore.user_uid}
                  onChange={(e) => setNewStore({...newStore, user_uid: e.target.value})}
                  disabled={loadingOwners}
                >
                  <option value="">
                    {loadingOwners ? '読み込み中...' : 'オーナーを選択してください'}
                  </option>
                  {restaurantOwners.map(owner => (
                    <option key={owner.uid} value={owner.uid}>
                      {owner.email}
                    </option>
                  ))}
                </select>
                {restaurantOwners.length === 0 && !loadingOwners && (
                  <div style={{ fontSize: '12px', color: '#E65100', marginTop: '4px' }}>
                    利用可能なレストランオーナーがいません
                  </div>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">業種</label>
                <select
                  className="form-input"
                  value={newStore.type}
                  onChange={(e) => setNewStore({...newStore, type: e.target.value})}
                >
                  <option value="">選択してください</option>
                  {Object.entries(BUSINESS_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">住所 *</label>
                <input type="text" className="form-input" placeholder="例: 福井県福井市中央1-1-25" value={newStore.address} onChange={(e) => setNewStore({...newStore, address: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">電話番号 *</label>
                <input type="tel" className="form-input" placeholder="例: 0776-22-2235" value={newStore.phone} onChange={(e) => setNewStore({...newStore, phone: e.target.value})} />
              </div>
            </div>

            <div className="card" style={{ background: '#1E293B', borderRadius: '12px', padding: '20px', border: '1px solid #1E293B', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#F8FAFC', marginBottom: '12px' }}>詳細情報（検索で自動入力されます）</h3>
              <div className="form-group">
                <label className="form-label">レストラン紹介</label>
                <textarea className="form-input" rows={3} placeholder="レストランの特徴や魅力" value={newStore.description} onChange={(e) => setNewStore({...newStore, description: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">営業時間</label>
                  <input type="text" className="form-input" value={newStore.hours} onChange={(e) => setNewStore({...newStore, hours: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">定休日</label>
                  <input type="text" className="form-input" value={newStore.holidays} onChange={(e) => setNewStore({...newStore, holidays: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">座席数</label>
                  <input type="text" className="form-input" value={newStore.seats} onChange={(e) => setNewStore({...newStore, seats: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">予算</label>
                  <input type="text" className="form-input" value={newStore.budget} onChange={(e) => setNewStore({...newStore, budget: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">駐車場</label>
                  <input type="text" className="form-input" value={newStore.parking} onChange={(e) => setNewStore({...newStore, parking: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">支払い方法</label>
                  <input type="text" className="form-input" value={newStore.payment} onChange={(e) => setNewStore({...newStore, payment: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">アクセス</label>
                  <input type="text" className="form-input" value={newStore.accessInfo} onChange={(e) => setNewStore({...newStore, accessInfo: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">特徴・こだわり</label>
                  <input type="text" className="form-input" value={newStore.features} onChange={(e) => setNewStore({...newStore, features: e.target.value})} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={handleCreateStore}
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? '登録中...' : '登録する'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .card {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 16px;
        }

        .btn {
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #10a37f;
          color: white;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(16, 163, 127, 0.25);
        }

        .btn-primary:hover {
          background: #0d8a6a;
          box-shadow: 0 6px 16px rgba(16, 163, 127, 0.35);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: rgba(255,255,255,0.06);
          color: var(--muted);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          background: rgba(255,255,255,0.1);
          color: var(--text);
        }

        .btn-secondary.active {
          background: rgba(16, 163, 127, 0.15);
          color: #34d399;
          border-color: rgba(16, 163, 127, 0.3);
        }

        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }

        .btn-danger {
          background: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.25) !important;
        }

        #storeListContainer {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 400px));
          gap: 16px;
          width: 100%;
          max-width: none;
        }

        .store-card-compact {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 18px;
          margin-bottom: 0;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 200px;
        }

        .store-card-compact:hover {
          border-color: rgba(16, 163, 127, 0.4);
          box-shadow: 0 4px 16px rgba(16, 163, 127, 0.1);
          transform: translateY(-2px);
        }

        .store-info-compact {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .store-main-info {
          flex: 1;
        }

        .store-name-compact {
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
          line-height: 1.3;
        }

        .store-code-compact {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 2px;
        }

        .store-location-compact {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.4;
        }

        .store-status-compact {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .store-id-badge {
          font-size: 11px;
          font-weight: 600;
          color: #34d399;
          background: rgba(16, 163, 127, 0.1);
          border: 1px solid rgba(16, 163, 127, 0.2);
          padding: 2px 8px;
          border-radius: 9999px;
          letter-spacing: 0.5px;
        }

        .badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }

        .badge-success {
          background: rgba(16, 163, 127, 0.15);
          color: #34d399;
        }

        .store-update-compact {
          font-size: 11px;
          color: var(--muted);
        }

        .store-metrics-compact {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin: 8px 0;
        }

        .metric-item {
          text-align: center;
          flex: none;
        }

        .metric-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #10a37f;
        }

        .metric-label {
          display: block;
          font-size: 12px;
          color: var(--muted);
          margin-top: 2px;
        }

        .store-actions-compact {
          display: flex;
          gap: 8px;
        }

        /* Modal styles */
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal.active {
          display: flex;
        }

        .modal-content {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 15px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--muted);
        }

        .close-btn:hover {
          color: var(--text);
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: var(--muted);
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 14px;
          transition: border 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #10a37f;
          box-shadow: 0 0 0 2px rgba(16, 163, 127, 0.15);
        }

        @media (max-width: 768px) {
          .store-info-compact {
            flex-direction: column;
            gap: 12px;
          }

          .store-status-compact {
            flex-direction: row;
            align-items: center;
          }

          .store-actions-compact {
            flex-wrap: wrap;
          }

          .form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </AdminLayout>
  )
}
