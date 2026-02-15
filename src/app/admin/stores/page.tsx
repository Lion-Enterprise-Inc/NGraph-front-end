'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../../components/admin/AdminLayout'
import { RestaurantApi, UserApi, UserListItem, CreateRestaurantRequest, Restaurant } from '../../../services/api'

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
  responses: number;
  satisfaction: number;
  lastUpdate: string;
  status: string;
}

export default function StoresPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [stores, setStores] = useState<StoreDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [restaurantOwners, setRestaurantOwners] = useState<UserListItem[]>([])
  const [loadingOwners, setLoadingOwners] = useState(false)
  const [totalRestaurants, setTotalRestaurants] = useState(0)

  // Fetch restaurants from API on mount
  useEffect(() => {
    fetchRestaurants()
  }, [])

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
          type: '🍽️ 飲食店',
          plan: 'フリープラン',
          planId: 'free',
          planPrice: 0,
          menuCount: 0,
          responses: 0,
          satisfaction: 0,
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
    user_uid: '', // Restaurant owner UID
    type: '',
    location: '',
    address: '',
    phone: '',
    planId: '',
    planName: '',
    planPrice: 0,
    officialWebsite: '',
    googleProfile: '',
    description: '',
    hours: '',
    budget: '',
    parking: '',
    payment: '',
    features: '',
    otherSources: '',
    is_active: true
  })

  // Fetch restaurant owners when modal opens
  useEffect(() => {
    if (showModal) {
      fetchRestaurantOwners()
    }
  }, [showModal])

  const fetchRestaurantOwners = async () => {
    setLoadingOwners(true)
    try {
      const owners = await UserApi.getUnassociatedRestaurantOwners()
      setRestaurantOwners(owners.filter(u => u.is_active))
    } catch (error) {
      console.error('Failed to fetch unassociated restaurant owners:', error)
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
      alert('レストラン名とレストランオーナーは必須です')
      return
    }

    // Validate required fields based on API requirements
    if (!newStore.phone) {
      alert('電話番号は必須です')
      return
    }
    if (!newStore.address) {
      alert('住所は必須です')
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

      // Only add optional fields if they have values
      if (newStore.description) requestData.description = newStore.description
      if (newStore.officialWebsite) requestData.official_website = newStore.officialWebsite
      if (newStore.googleProfile) requestData.google_business_profile = newStore.googleProfile
      if (newStore.description) requestData.store_introduction = newStore.description
      if (newStore.hours) requestData.opening_hours = newStore.hours
      if (newStore.budget) requestData.budget = newStore.budget
      if (newStore.parking) requestData.parking_slot = newStore.parking
      if (newStore.features) requestData.attention_in_detail = newStore.features
      if (newStore.otherSources) requestData.other_sources = newStore.otherSources

      const response = await RestaurantApi.create(requestData)
      
      if (response.result) {
        // Add to local state for immediate UI update
        const newStoreData: StoreDisplay = {
          id: stores.length + 1,
          uid: response.result.uid,
          storeCode: response.result.uid.substring(0, 8).toUpperCase(),
          name: response.result.name,
          location: newStore.location || '未設定',
          address: response.result.address || '',
          type: newStore.type || '🍽️ 飲食店',
          plan: newStore.planName || 'フリープラン',
          planId: newStore.planId || 'free',
          planPrice: newStore.planPrice,
          menuCount: 0,
          responses: 0,
          satisfaction: 0,
          lastUpdate: '今',
          status: response.result.is_active ? 'active' : 'inactive'
        }
        
        setStores([...stores, newStoreData])
        setShowModal(false)
        resetNewStore()
        alert(`✅ ${response.message}\n\nレストラン: ${response.result.name}\nUID: ${response.result.uid}`)
      }
    } catch (error) {
      console.error('Failed to create restaurant:', error)
      alert(`❌ レストラン作成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetNewStore = () => {
    setNewStore({
      name: '', user_uid: '', type: '', location: '', address: '', phone: '', planId: '', planName: '', planPrice: 0,
      officialWebsite: '', googleProfile: '', description: '', hours: '', budget: '', parking: '', payment: '', features: '', otherSources: '', is_active: true
    })
  }

  const enterStoreView = (storeId: number) => {
    const store = stores.find(s => s.id === storeId)
    if (store) {
      // Show store management modal/alert for now
      alert(`${store.name}の管理画面\n\nレストランコード: ${store.storeCode}\n住所: ${store.address}\nプラン: ${store.plan}\n\nダッシュボード・基本情報・メニュー編集が可能です。`)
    }
  }

  const viewStoreMenus = (storeId: number) => {
    const store = stores.find(s => s.id === storeId)
    if (store) {
      alert(`${store.name}のメニュー一覧を表示します\n\n登録メニュー数: ${store.menuCount}件`)
    }
  }

  const showStoreDetail = (storeId: number) => {
    const store = stores.find(s => s.id === storeId)
    if (store) {
      alert(`${store.name}の詳細情報\n\nレストランコード: ${store.storeCode}\n住所: ${store.address}\nプラン: ${store.plan}\nメニュー数: ${store.menuCount}件`)
    }
  }

  const handleDeleteStore = async (storeUid: string, storeName: string) => {
    if (!confirm(`レストラン "${storeName}" を削除しますか？\n\nこの操作は元に戻すことができません。`)) return

    try {
      await RestaurantApi.delete(storeUid)
      // Remove from local state
      setStores(stores.filter(s => s.uid !== storeUid))
      setTotalRestaurants(prev => prev - 1)
      alert(`✅ レストラン "${storeName}" を削除しました`)
    } catch (error) {
      console.error('Failed to delete restaurant:', error)
      alert(`❌ レストランの削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const showPlanSelection = () => {
    const plan = prompt('プランを選択:\n1. フリープラン (¥0)\n2. ライトプラン (¥980)\n3. ビジネスプラン (¥3,980)', '1')
    if (plan === '1') setNewStore({...newStore, planId: 'free', planName: 'フリープラン', planPrice: 0})
    else if (plan === '2') setNewStore({...newStore, planId: 'light', planName: 'ライトプラン', planPrice: 980})
    else if (plan === '3') setNewStore({...newStore, planId: 'business', planName: 'ビジネスプラン', planPrice: 3980})
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div style={{ color: '#666', fontSize: '16px' }}>レストランを読み込み中...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="導入レストラン一覧">
      <div className="card" style={{ width: '100%', maxWidth: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 className="card-title" style={{ margin: 0 }}>🍽️ 導入レストラン一覧</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              ➕ 新規レストランを登録
            </button>
            <div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>{stores.length}</span>
              <span style={{ color: '#666', marginLeft: '5px' }}>レストラン</span>
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
          <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666', width: '100%' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🍽️</div>
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
                  <div className="store-location-compact">📍 {store.location} | {store.type}</div>
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
                  <span className="metric-value">{store.responses}</span>
                  <span className="metric-label">応答</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{store.satisfaction}</span>
                  <span className="metric-label">満足度</span>
                </div>
              </div>
              
              <div className="store-actions-compact">
                <button className="btn btn-primary btn-small" onClick={() => enterStoreView(store.id)} title="プラットフォーム権限でレストラン管理（ダッシュボード・基本情報・メニュー編集）">
                  🔑 管理
                </button>
                <button className="btn btn-secondary btn-small" onClick={() => viewStoreMenus(store.id)} title="登録メニュー情報の内容確認">
                  🍽️ メニュー
                </button>
                <button className="btn btn-secondary btn-small" onClick={() => showStoreDetail(store.id)} title="レストランの現状把握（統計・分析・パフォーマンス）">
                  📊 詳細
                </button>
                <button 
                  className="btn btn-danger btn-small" 
                  onClick={() => handleDeleteStore(store.uid, store.name)} 
                  title="レストランを削除（元に戻せません）"
                  style={{ background: '#dc3545', color: 'white' }}
                >
                  🗑️ 削除
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
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>➕ 新規レストランを登録</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            {/* フォームを2列レイアウトに変更 */}
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '8px' }}>
              {/* 左列 */}
              <div>
                <div className="form-group">
                  <label className="form-label">レストラン名 *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    id="newStoreName"
                    placeholder="例: カフェ・ド・金沢"
                    value={newStore.name}
                    onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">レストランオーナー *</label>
                  <select 
                    className="form-input"
                    id="newStoreOwner"
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
                      ⚠️ 利用可能なレストランオーナーがいません
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">業種</label>
                  <select 
                    className="form-input"
                    id="newStoreType"
                    value={newStore.type}
                    onChange={(e) => setNewStore({...newStore, type: e.target.value})}
                  >
                    <option value="">選択してください</option>
                    <option value="🍽️ 飲食店 - 居酒屋">🍽️ 飲食店 - 居酒屋</option>
                    <option value="🍽️ 飲食店 - カフェ">🍽️ 飲食店 - カフェ</option>
                    <option value="🍽️ 飲食店 - ラーメン店">🍽️ 飲食店 - ラーメン店</option>
                    <option value="🍽️ 飲食店 - 寿司">🍽️ 飲食店 - 寿司</option>
                    <option value="🍽️ 飲食店 - その他">🍽️ 飲食店 - その他</option>
                    <option value="��️ 小売店 - アパレル">🛍️ 小売店 - アパレル</option>
                    <option value="🛍️ 小売店 - 雑貨">🛍️ 小売店 - 雑貨</option>
                    <option value="🛍️ 小売店 - 食品">🛍️ 小売店 - 食品</option>
                    <option value="🏪 アンテナショップ">🏪 アンテナショップ</option>
                    <option value="🏨 宿泊施設">🏨 宿泊施設</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">地域 *</label>
                  <select 
                    className="form-input"
                    id="newStoreLocation"
                    value={newStore.location}
                    onChange={(e) => setNewStore({...newStore, location: e.target.value})}
                  >
                    <option value="">選択してください</option>
                    <option value="福井">福井</option>
                    <option value="金沢">金沢</option>
                    <option value="名古屋">名古屋</option>
                    <option value="東京">東京</option>
                    <option value="大阪">大阪</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
              </div>

              {/* 右列 */}
              <div>
                <div className="form-group">
                  <label className="form-label">住所 *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    id="newStoreAddress"
                    placeholder="例: 石川県金沢市香林坊1-2-3"
                    value={newStore.address}
                    onChange={(e) => setNewStore({...newStore, address: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">電話番号 *</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    id="newStorePhone"
                    placeholder="例: 076-123-4567"
                    value={newStore.phone}
                    onChange={(e) => setNewStore({...newStore, phone: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">プラン *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div id="selectedPlanDisplay" style={{ flex: 1, padding: '10px', background: '#f8f9fa', borderRadius: '6px', color: newStore.planName ? '#333' : '#666', fontSize: '14px' }}>
                      {newStore.planName || 'プランを選択してください'}
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={showPlanSelection}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      💳 プランを選択
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ background: '#f8f9fa', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '12px' }}>🔗 情報ソース（任意）</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">公式HP</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    id="newStoreOfficialWebsite"
                    placeholder="https://example.com"
                    value={newStore.officialWebsite}
                    onChange={(e) => setNewStore({...newStore, officialWebsite: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Googleビジネスプロフィール</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    id="newStoreGoogleProfile"
                    placeholder="https://maps.google.com/..."
                    value={newStore.googleProfile}
                    onChange={(e) => setNewStore({...newStore, googleProfile: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="card" style={{ background: '#f8f9fa', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: '12px' }}>📝 レストラン詳細（任意）</h3>
              <div className="form-group">
                <label className="form-label">レストラン紹介</label>
                <textarea 
                  className="form-input" 
                  id="newStoreDescription"
                  rows={3} 
                  placeholder="レストランの特徴やこだわりを記入します"
                  value={newStore.description}
                  onChange={(e) => setNewStore({...newStore, description: e.target.value})}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">営業時間</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    id="newStoreHours"
                    placeholder="例: 11:00-22:00（火曜定休）"
                    value={newStore.hours}
                    onChange={(e) => setNewStore({...newStore, hours: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">予算</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    id="newStoreBudget"
                    placeholder="例: ランチ ¥1,000～ / ディナー ¥3,000～"
                    value={newStore.budget}
                    onChange={(e) => setNewStore({...newStore, budget: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">駐車場</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    id="newStoreParking"
                    placeholder="例: 近隣に提携パーキングあり（2時間無料）"
                    value={newStore.parking}
                    onChange={(e) => setNewStore({...newStore, parking: e.target.value})}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">支払い方法</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    id="newStorePayment"
                    placeholder="例: 現金 / クレジット / 電子マネー"
                    value={newStore.payment}
                    onChange={(e) => setNewStore({...newStore, payment: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">特徴・こだわり</label>
                <textarea 
                  className="form-input" 
                  id="newStoreFeatures"
                  rows={3} 
                  placeholder="例: 地元食材使用、英語対応スタッフ在籍、個室あり"
                  value={newStore.features}
                  onChange={(e) => setNewStore({...newStore, features: e.target.value})}
                />
              </div>
            </div>

            <div className="alert alert-info" style={{ background: '#E3F2FD', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '16px' }}>💡 登録後の流れ</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #1976D2' }}>
                  <div style={{ fontWeight: 600, color: '#1976D2', marginBottom: '4px' }}>1. レストラン情報を登録</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>基本情報を入力して登録</div>
                </div>
                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #1976D2' }}>
                  <div style={{ fontWeight: 600, color: '#1976D2', marginBottom: '4px' }}>2. QRコードとログイン情報を発行</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>自動でQRコードとログイン情報を生成</div>
                </div>
                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #1976D2' }}>
                  <div style={{ fontWeight: 600, color: '#1976D2', marginBottom: '4px' }}>3. レストランにメニュー登録を案内</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>レストランスタッフにメニュー登録を案内</div>
                </div>
                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #1976D2' }}>
                  <div style={{ fontWeight: 600, color: '#1976D2', marginBottom: '4px' }}>4. システム準備完了</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>AIチャットが利用可能に</div>
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
                {isSubmitting ? '⏳ 登録中...' : '✅ 登録する'}
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
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 16px;
        }

        .btn {
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          border-radius: 14px;
          box-shadow: 0 20px 40px rgba(79, 70, 229, 0.26);
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #1d4ed8, #6d28d9);
          box-shadow: 0 24px 48px rgba(79, 70, 229, 0.35);
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #5a6268;
        }

        .btn-secondary.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }

        #storeListContainer {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 400px));
          gap: 20px;
          width: 100%;
          max-width: none;
        }

        /* Store Card Compact - matching HTML exactly */
        .store-card-compact {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 0;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 200px;
        }

        .store-card-compact:hover {
          border-color: #DB461C;
          box-shadow: 0 2px 8px rgba(219, 70, 28, 0.15);
          transform: translateY(-1px);
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
          color: #333;
          margin-bottom: 4px;
          line-height: 1.3;
        }

        .store-code-compact {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .store-location-compact {
          font-size: 14px;
          color: #666;
          line-height: 1.4;
        }

        .store-status-compact {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .store-id-badge {
          font-size: 12px;
          font-weight: 600;
          color: #1f2937;
          background: #e0f2fe;
          border: 1px solid #bae6fd;
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .store-update-compact {
          font-size: 11px;
          color: #9ca3af;
        }

        .store-metrics-compact {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin: 8px 0;
        }

        .metric-item {
          text-align: center;
          flex: 1;
        }

        .metric-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #667eea;
        }

        .metric-label {
          display: block;
          font-size: 12px;
          color: #666;
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
          background: rgba(0, 0, 0, 0.5);
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
          background: white;
          border-radius: 12px;
          padding: 24px;
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
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 15px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        }

        .close-btn:hover {
          color: #333;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #555;
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          transition: border 0.3s;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
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

          .store-metrics-compact {
            flex-wrap: wrap;
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
