'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AdminLayout from '../../../components/admin/AdminLayout'
import { apiClient, BUSINESS_TYPES } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../components/admin/Toast'
import { FormField, FormInput, FormSelect, FormTextarea, FormGrid } from '../../../components/admin/ui'

type TabType = 'basic'

export default function BasicInfoPage() {
  return (
    <Suspense fallback={<AdminLayout title="基本情報"><div style={{ textAlign: 'center', padding: '40px' }}>読み込み中...</div></AdminLayout>}>
      <BasicInfoContent />
    </Suspense>
  )
}

function BasicInfoContent() {
  const { user, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const uidParam = searchParams?.get('uid') ?? null
  const isAdminViewing = !!(uidParam && user && (user.role === 'superadmin' || user.role === 'platform_owner'))
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  const [restaurant, setRestaurant] = useState<any>(null)
  const [restaurantLoading, setRestaurantLoading] = useState(true)
  const [restaurantError, setRestaurantError] = useState('')
  const [formData, setFormData] = useState({
    storeType: '',
    storeName: '',
    phone: '',
    address: '',
    officialWebsite: '',
    googleBusinessProfile: '',
    instagramUrl: '',
    tabelogUrl: '',
    gurunaviUrl: '',
    menuScrapingUrl: '',
    description: '',
    businessHours: '',
    holidays: '',
    seats: '',
    budget: '',
    parking: '',
    payment: '',
    features: '',
    accessInfo: '',
    reservationUrl: '',
    googleRating: '',
    tabelogRating: ''
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const toast = useToast()

  const fetchRestaurantData = async (userUid: string) => {
    try {
      setRestaurantLoading(true)
      setRestaurantError('')

      let restaurantData: any
      if (isAdminViewing && uidParam) {
        const response = await apiClient.get(`/restaurants/${uidParam}`) as { result: any }
        restaurantData = response.result
      } else {
        // 店舗リストがあればその最初の店舗を使う
        const userStr = sessionStorage.getItem('user')
        const userData = userStr ? JSON.parse(userStr) : null
        const firstUid = userData?.restaurants?.[0]?.uid
        if (firstUid) {
          const response = await apiClient.get(`/restaurants/${firstUid}`) as { result: any }
          restaurantData = response.result
        } else {
          const response = await apiClient.get(`/restaurants/detail-by-user/${userUid}`) as { result: any }
          restaurantData = response.result
        }
      }

      setRestaurant(restaurantData)

      setFormData({
        storeType: restaurantData.business_type || '',
        storeName: restaurantData.name || '',
        phone: restaurantData.phone_number || '',
        address: restaurantData.address || '',
        officialWebsite: restaurantData.official_website || '',
        googleBusinessProfile: restaurantData.google_business_profile || '',
        instagramUrl: restaurantData.instagram_url || restaurantData.other_sources || '',
        tabelogUrl: restaurantData.tabelog_url || '',
        gurunaviUrl: restaurantData.gurunavi_url || '',
        menuScrapingUrl: '',
        description: restaurantData.store_introduction || '',
        businessHours: restaurantData.opening_hours || '',
        holidays: restaurantData.holidays || '',
        seats: restaurantData.seats || '',
        budget: restaurantData.budget || '',
        parking: restaurantData.parking_slot || '',
        payment: restaurantData.payment_methods || '',
        features: restaurantData.attention_in_detail || '',
        accessInfo: restaurantData.access_info || '',
        reservationUrl: restaurantData.reservation_url || '',
        googleRating: restaurantData.google_rating ? String(restaurantData.google_rating) : '',
        tabelogRating: restaurantData.tabelog_rating ? String(restaurantData.tabelog_rating) : ''
      })
    } catch (error) {
      console.error('Failed to fetch restaurant:', error)
      setRestaurantError('レストラン情報の取得に失敗しました')
    } finally {
      setRestaurantLoading(false)
    }
  }

  // Fetch restaurant data when user is loaded
  useEffect(() => {
    if (!authLoading && user?.uid) {
      fetchRestaurantData(user.uid)
    } else if (!authLoading && !user) {
      setRestaurantError('ユーザーデータが見つかりません')
      setRestaurantLoading(false)
    }
  }, [authLoading, user?.uid, isAdminViewing, uidParam])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    if (!restaurant) {
      toast('error', 'レストラン情報が読み込まれていません')
      return
    }

    setIsSaving(true)
    try {
      // Use FormData for multipart upload — only send non-empty fields
      const formDataToSend = new FormData()
      const addIfPresent = (key: string, value: string) => {
        if (value) formDataToSend.append(key, value)
      }
      addIfPresent('name', formData.storeName)
      addIfPresent('description', formData.description)
      addIfPresent('phone_number', formData.phone)
      addIfPresent('official_website', formData.officialWebsite)
      addIfPresent('google_business_profile', formData.googleBusinessProfile)
      addIfPresent('address', formData.address)
      addIfPresent('other_sources', formData.instagramUrl)
      addIfPresent('store_introduction', formData.description)
      addIfPresent('opening_hours', formData.businessHours)
      addIfPresent('budget', formData.budget)
      addIfPresent('parking_slot', formData.parking)
      addIfPresent('attention_in_detail', formData.features)
      addIfPresent('business_type', formData.storeType)
      formDataToSend.append('is_active', String(restaurant.is_active))
      addIfPresent('holidays', formData.holidays)
      addIfPresent('seats', formData.seats)
      addIfPresent('payment_methods', formData.payment)
      addIfPresent('access_info', formData.accessInfo)
      addIfPresent('reservation_url', formData.reservationUrl)
      addIfPresent('google_rating', formData.googleRating)
      addIfPresent('tabelog_rating', formData.tabelogRating)
      addIfPresent('instagram_url', formData.instagramUrl)
      addIfPresent('tabelog_url', formData.tabelogUrl)
      addIfPresent('gurunavi_url', formData.gurunaviUrl)

      const token = sessionStorage.getItem('access_token')
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://15.207.22.103:8000'

      const response = await fetch(`${apiBaseUrl}/restaurants/${restaurant.uid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Re-fetch restaurant data to ensure we have the latest
      if (user?.uid) {
        await fetchRestaurantData(user.uid)
      }

      toast('success', 'レストラン情報を保存しました')
    } catch (error) {
      console.error('Failed to save restaurant:', error)
      toast('error', `保存に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleScrapeInfo = async (withMenus: boolean = false) => {
    if (!restaurant) return

    const urls = [formData.menuScrapingUrl, formData.officialWebsite, formData.tabelogUrl, formData.gurunaviUrl, formData.instagramUrl].filter(u => u.trim())
    if (urls.length === 0) {
      toast('warning', 'URLを1つ以上入力してください')
      return
    }

    setIsScraping(true)
    try {
      const token = sessionStorage.getItem('access_token')
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://15.207.22.103:8000'

      const res = await fetch(`${apiBaseUrl}/restaurants/${restaurant.uid}/scrape-info`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls, scrape_menus: withMenus })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const info = data.result?.store_info

      if (info) {
        const toStr = (v: any): string => {
          if (v == null) return ''
          if (typeof v === 'string') return v
          if (Array.isArray(v)) return v.join('、')
          if (typeof v === 'object') return Object.entries(v).map(([k, val]) => Array.isArray(val) ? `${k}: ${val.join(', ')}` : `${k}: ${val}`).join(' / ')
          return String(v)
        }
        setFormData(prev => ({
          ...prev,
          storeName: toStr(info.name) || prev.storeName,
          phone: toStr(info.phone) || prev.phone,
          address: toStr(info.address) || prev.address,
          description: toStr(info.description) || prev.description,
          businessHours: toStr(info.business_hours) || prev.businessHours,
          holidays: toStr(info.holidays) || prev.holidays,
          seats: toStr(info.seats) || prev.seats,
          budget: toStr(info.budget) || prev.budget,
          parking: toStr(info.parking) || prev.parking,
          payment: toStr(info.payment) || prev.payment,
          features: toStr(info.features) || prev.features,
          accessInfo: toStr(info.access) || prev.accessInfo,
          reservationUrl: toStr(info.reservation_url) || prev.reservationUrl,
          googleRating: info.google_rating ? String(info.google_rating) : prev.googleRating,
          tabelogRating: info.tabelog_rating ? String(info.tabelog_rating) : prev.tabelogRating,
          instagramUrl: toStr(info.instagram_url) || prev.instagramUrl,
          tabelogUrl: toStr(info.tabelog_url) || prev.tabelogUrl,
          gurunaviUrl: toStr(info.gurunavi_url) || prev.gurunaviUrl,
          officialWebsite: toStr(info.official_website) || prev.officialWebsite,
          googleBusinessProfile: toStr(info.google_business_profile) || prev.googleBusinessProfile,
        }))

        toast('success', `情報を取得しました。内容を確認して保存してください。${withMenus && data.result?.menu_scrape ? ` メニュー: ${data.result.menu_scrape.items_saved || 0}件登録` : ''}`)
      }
    } catch (error) {
      console.error('Scrape failed:', error)
      toast('error', `情報の取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsScraping(false)
    }
  }

  const handleSearchInfo = async (withMenus: boolean = false) => {
    if (!restaurant) return

    setIsSearching(true)
    try {
      const token = sessionStorage.getItem('access_token')
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://15.207.22.103:8000'

      const res = await fetch(`${apiBaseUrl}/restaurants/${restaurant.uid}/search-info`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: [formData.storeName, formData.address, formData.phone].filter(s => s.trim()).join(' '),
          scrape_menus: withMenus
        })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const info = data.result?.store_info

      if (info) {
        const toStr = (v: any): string => {
          if (v == null) return ''
          if (typeof v === 'string') return v
          if (Array.isArray(v)) return v.join('、')
          if (typeof v === 'object') return Object.entries(v).map(([k, val]) => Array.isArray(val) ? `${k}: ${val.join(', ')}` : `${k}: ${val}`).join(' / ')
          return String(v)
        }
        setFormData(prev => ({
          ...prev,
          storeName: toStr(info.name) || prev.storeName,
          phone: toStr(info.phone) || prev.phone,
          address: toStr(info.address) || prev.address,
          description: toStr(info.description) || prev.description,
          businessHours: toStr(info.business_hours) || prev.businessHours,
          holidays: toStr(info.holidays) || prev.holidays,
          seats: toStr(info.seats) || prev.seats,
          budget: toStr(info.budget) || prev.budget,
          parking: toStr(info.parking) || prev.parking,
          payment: toStr(info.payment) || prev.payment,
          features: toStr(info.features) || prev.features,
          accessInfo: toStr(info.access) || prev.accessInfo,
          reservationUrl: toStr(info.reservation_url) || prev.reservationUrl,
          googleRating: info.google_rating ? String(info.google_rating) : prev.googleRating,
          tabelogRating: info.tabelog_rating ? String(info.tabelog_rating) : prev.tabelogRating,
          instagramUrl: toStr(info.instagram_url) || prev.instagramUrl,
          tabelogUrl: toStr(info.tabelog_url) || prev.tabelogUrl,
          gurunaviUrl: toStr(info.gurunavi_url) || prev.gurunaviUrl,
          officialWebsite: toStr(info.official_website) || prev.officialWebsite,
          googleBusinessProfile: toStr(info.google_business_profile) || prev.googleBusinessProfile,
        }))

        toast('success', `Web検索で情報を取得しました。内容を確認して保存してください。${withMenus && data.result?.menu_scrape ? ` メニュー: ${data.result.menu_scrape.items_saved || 0}件登録` : ''}`)
      }
    } catch (error) {
      console.error('Search failed:', error)
      toast('error', `情報の検索に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSearching(false)
    }
  }

  const tabs = [
    { key: 'basic', label: '基本情報' },
  ]

  return (
    <AdminLayout title="基本情報">
      <div className="card">
        <div className="tab-nav">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key as TabType)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {restaurantLoading ? (
            <div className="inner-card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '18px', marginBottom: '16px' }}>レストラン情報を読み込み中...</div>
              <div style={{ color: '#94A3B8' }}>情報を取得しています</div>
            </div>
          ) : restaurantError ? (
            <div className="inner-card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '18px', marginBottom: '16px', color: '#dc2626' }}>エラー</div>
              <div style={{ color: '#94A3B8', marginBottom: '20px' }}>{restaurantError}</div>
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                再読み込み
              </button>
            </div>
          ) : activeTab === 'basic' && (
            <div className="inner-card">

              {/* Section 1: 基本情報 */}
              <div className="section-card">
                <div className="card-title">基本情報</div>

                <FormField label="レストラン名" required>
                  <FormInput type="text" name="storeName" value={formData.storeName} onChange={handleChange} />
                </FormField>

                <FormGrid cols={2}>
                  <FormField label="電話番号">
                    <FormInput type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                  </FormField>
                  <FormField label="住所">
                    <FormInput type="text" name="address" value={formData.address} onChange={handleChange} />
                  </FormField>
                </FormGrid>

                <FormField label="業種">
                  <FormSelect name="storeType" value={formData.storeType} onChange={handleChange}>
                    <option value="">選択してください</option>
                    {Object.entries(BUSINESS_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </FormSelect>
                </FormField>

              </div>

              {/* Section 2: AI情報取得 */}
              <div className="section-card">
                <div className="card-title">AI情報取得</div>
                <p style={{ color: '#94A3B8', marginBottom: '16px', fontSize: '13px' }}>
                  店名で検索すると、食べログ・Googleマップ・公式HPなどから情報を自動取得します
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSearchInfo(false)}
                    disabled={isSearching || isScraping}
                  >
                    {isSearching ? '検索中...' : '店名で情報を検索'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleSearchInfo(true)}
                    disabled={isSearching || isScraping}
                  >
                    {isSearching ? '検索中...' : 'メニューも一緒に検索'}
                  </button>
                </div>

                <details style={{ marginBottom: '16px' }}>
                  <summary style={{ cursor: 'pointer', color: '#94A3B8', fontSize: '13px' }}>URL指定で取得（従来方式）</summary>
                  <div style={{ padding: '12px 0' }}>
                    <FormField label="情報取得用URL">
                      <FormInput type="url" name="menuScrapingUrl" placeholder="https://tabelog.com/..." value={formData.menuScrapingUrl} onChange={handleChange} />
                    </FormField>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary" onClick={() => handleScrapeInfo(false)} disabled={isScraping || isSearching}>
                        {isScraping ? '取得中...' : 'URLから店舗情報を取得'}
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleScrapeInfo(true)} disabled={isScraping || isSearching}>
                        {isScraping ? '取得中...' : 'URLからメニューも取得'}
                      </button>
                    </div>
                  </div>
                </details>
              </div>

              {/* Section 3: 詳細情報 */}
              <div className="section-card">
                <div className="card-title">詳細情報</div>

                <FormField label="レストラン紹介">
                  <FormTextarea name="description" placeholder="レストランの特徴や魅力を入力してください" value={formData.description} onChange={handleChange} rows={4} />
                </FormField>

                <FormGrid cols={2}>
                  <FormField label="営業時間">
                    <FormInput type="text" name="businessHours" value={formData.businessHours} onChange={handleChange} />
                  </FormField>
                  <FormField label="定休日">
                    <FormInput type="text" name="holidays" value={formData.holidays} onChange={handleChange} />
                  </FormField>
                  <FormField label="座席数">
                    <FormInput type="text" name="seats" placeholder="例: 50席" value={formData.seats} onChange={handleChange} />
                  </FormField>
                  <FormField label="予算">
                    <FormInput type="text" name="budget" placeholder="例: ¥3,000〜¥4,000" value={formData.budget} onChange={handleChange} />
                  </FormField>
                  <FormField label="駐車場">
                    <FormInput type="text" name="parking" placeholder="例: 有（10台）" value={formData.parking} onChange={handleChange} />
                  </FormField>
                  <FormField label="支払い方法">
                    <FormInput type="text" name="payment" placeholder="例: カード可、電子マネー可" value={formData.payment} onChange={handleChange} />
                  </FormField>
                  <FormField label="最寄り駅・アクセス">
                    <FormInput type="text" name="accessInfo" placeholder="例: JR福井駅 徒歩5分" value={formData.accessInfo} onChange={handleChange} />
                  </FormField>
                  <FormField label="予約URL">
                    <FormInput type="url" name="reservationUrl" placeholder="https://..." value={formData.reservationUrl} onChange={handleChange} />
                  </FormField>
                </FormGrid>

                <FormField label="特徴・こだわり">
                  <FormTextarea name="features" placeholder="例: 地元食材使用、個室あり" value={formData.features} onChange={handleChange} rows={3} />
                </FormField>
              </div>

              {/* Section 4: 外部リンク・評価 */}
              <div className="section-card">
                <div className="card-title">外部リンク・評価</div>

                <FormGrid cols={2}>
                  <FormField label="公式HP">
                    <FormInput type="url" name="officialWebsite" placeholder="https://..." value={formData.officialWebsite} onChange={handleChange} />
                  </FormField>
                  <FormField label="Googleマップ">
                    <FormInput type="url" name="googleBusinessProfile" placeholder="https://maps.google.com/..." value={formData.googleBusinessProfile} onChange={handleChange} />
                  </FormField>
                  <FormField label="食べログ">
                    <FormInput type="url" name="tabelogUrl" placeholder="https://tabelog.com/..." value={formData.tabelogUrl} onChange={handleChange} />
                  </FormField>
                  <FormField label="ぐるなび">
                    <FormInput type="url" name="gurunaviUrl" placeholder="https://r.gnavi.co.jp/..." value={formData.gurunaviUrl} onChange={handleChange} />
                  </FormField>
                  <FormField label="Instagram">
                    <FormInput type="url" name="instagramUrl" placeholder="https://instagram.com/..." value={formData.instagramUrl} onChange={handleChange} />
                  </FormField>
                  <div />
                  <FormField label="Google評価">
                    <FormInput type="number" name="googleRating" placeholder="例: 3.8" step="0.1" min="0" max="5" value={formData.googleRating} onChange={handleChange} />
                  </FormField>
                  <FormField label="食べログ評価">
                    <FormInput type="number" name="tabelogRating" placeholder="例: 3.45" step="0.01" min="0" max="5" value={formData.tabelogRating} onChange={handleChange} />
                  </FormField>
                </FormGrid>
              </div>

            </div>
          )}

        </div>

        {/* Global Save Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving} style={{ padding: '12px 24px', fontSize: '16px' }}>
            {isSaving ? '保存中...' : 'すべての変更を保存'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .card {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border);
        }
        .tab-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
          flex-wrap: wrap;
        }
        .tab-btn {
          padding: 10px 16px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          background: var(--bg-hover);
          color: var(--text);
        }
        .tab-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }
        .tab-content {
          min-height: 400px;
        }
        .inner-card {
          padding: 20px;
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        .section-card {
          padding: 20px;
          margin-bottom: 20px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 10px;
        }
        .section-card:last-child {
          margin-bottom: 0;
        }
        .card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--text);
        }
        .btn {
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .btn-secondary {
          background: var(--bg-hover);
          color: var(--text);
          border: 1px solid var(--border-strong);
        }
        .btn-secondary:hover {
          background: var(--border-strong);
        }
      `}</style>
    </AdminLayout>
  )
}
