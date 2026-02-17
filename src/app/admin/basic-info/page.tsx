'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AdminLayout from '../../../components/admin/AdminLayout'
import { apiClient, BUSINESS_TYPES } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../components/admin/Toast'

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
    tabelogRating: '',
    logoUrl: ''
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isScraping, setIsScraping] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toast = useToast()
  const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf']

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
        toast('warning', '対応形式: JPG, PNG, GIF, WebP, SVG, PDF')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast('warning', 'ファイルサイズは5MB以下にしてください')
        return
      }
      setLogoFile(file)
      if (file.type.startsWith('image/')) {
        setLogoPreview(URL.createObjectURL(file))
      } else {
        setLogoPreview('')
      }
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview('')
    setFormData({ ...formData, logoUrl: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const fetchRestaurantData = async (userUid: string) => {
    try {
      setRestaurantLoading(true)
      setRestaurantError('')

      let restaurantData: any
      if (isAdminViewing && uidParam) {
        const response = await apiClient.get(`/restaurants/${uidParam}`) as { result: any }
        restaurantData = response.result
      } else {
        const response = await apiClient.get(`/restaurants/detail-by-user/${userUid}`) as { result: any; message: string; status_code: number }
        restaurantData = response.result
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
        tabelogRating: restaurantData.tabelog_rating ? String(restaurantData.tabelog_rating) : '',
        logoUrl: restaurantData.logo_url || ''
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
      
      // Add logo file if selected
      if (logoFile) {
        formDataToSend.append('logo', logoFile)
      }

      const token = localStorage.getItem('access_token')
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

      const result = await response.json()
      // Clear logo file state after successful upload
      setLogoFile(null)
      setLogoPreview('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Update formData with new logo_url from response
      if (result.result?.logo_url) {
        setFormData(prev => ({ ...prev, logoUrl: result.result.logo_url }))
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
      const token = localStorage.getItem('access_token')
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
      const token = localStorage.getItem('access_token')
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
    { key: 'basic', label: '📍 基本情報' },
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
              <div style={{ fontSize: '18px', marginBottom: '16px' }}>🏪 レストラン情報を読み込み中...</div>
              <div style={{ color: '#94A3B8' }}>情報を取得しています</div>
            </div>
          ) : restaurantError ? (
            <div className="inner-card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '18px', marginBottom: '16px', color: '#dc2626' }}>❌ エラー</div>
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
              <div className="card-title">📍 基本情報</div>

              {/* Logo Upload Section */}
              <div className="form-group">
                <label className="form-label">ロゴ</label>
                <div className="logo-upload-section">
                  {(logoPreview || (formData.logoUrl && !logoFile)) ? (
                    <div className="logo-preview-container">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Restaurant logo" className="logo-preview" />
                      ) : formData.logoUrl?.toLowerCase().endsWith('.pdf') ? (
                        <div className="logo-placeholder" style={{ border: '2px solid #e5e7eb', background: '#fef2f2' }}>
                          <span style={{ fontSize: '32px' }}>📄</span>
                          <span style={{ fontSize: '11px' }}>PDF</span>
                        </div>
                      ) : (
                        <img src={formData.logoUrl} alt="Restaurant logo" className="logo-preview" />
                      )}
                      <button
                        type="button"
                        className="logo-remove-btn"
                        onClick={handleRemoveLogo}
                      >
                        ✕
                      </button>
                    </div>
                  ) : logoFile && !logoPreview ? (
                    <div className="logo-preview-container">
                      <div className="logo-placeholder" style={{ border: '2px solid #e5e7eb', background: '#fef2f2' }}>
                        <span style={{ fontSize: '32px' }}>📄</span>
                        <span style={{ fontSize: '11px' }}>PDF</span>
                      </div>
                      <button
                        type="button"
                        className="logo-remove-btn"
                        onClick={handleRemoveLogo}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="logo-placeholder">
                      <span>🏪</span>
                      <span>ロゴなし</span>
                    </div>
                  )}
                  <div className="logo-input-group">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleLogoFileChange}
                      style={{ display: 'none' }}
                      id="logo-file-input"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                          fileInputRef.current.click()
                        }
                      }}
                      style={{ marginBottom: '8px' }}
                    >
                      {(logoPreview || formData.logoUrl || logoFile) ? '🔄 ロゴを変更' : '📁 ロゴを選択'}
                    </button>
                    {logoFile && (
                      <p className="logo-file-name">選択中: {logoFile.name}</p>
                    )}
                    <p className="logo-hint">※ 画像またはPDFをアップロード（最大5MB）</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">レストラン名 *</label>
                <input type="text" name="storeName" className="form-input" value={formData.storeName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">電話番号</label>
                <input type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">住所</label>
                <input type="text" name="address" className="form-input" value={formData.address} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">業種</label>
                <select name="storeType" className="form-input" value={formData.storeType} onChange={handleChange}>
                  <option value="">選択してください</option>
                  {Object.entries(BUSINESS_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="section-divider" />

              <div className="card-title">🔍 AI情報取得</div>
              <p style={{ color: '#94A3B8', marginBottom: '16px', fontSize: '13px' }}>
                店名で検索すると、食べログ・Googleマップ・公式HPなどから情報を自動取得します
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleSearchInfo(false)}
                  disabled={isSearching || isScraping}
                >
                  {isSearching ? '⏳ 検索中...' : '🔍 店名で情報を検索'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleSearchInfo(true)}
                  disabled={isSearching || isScraping}
                >
                  {isSearching ? '⏳ 検索中...' : '🍽️ メニューも一緒に検索'}
                </button>
              </div>

              <details style={{ marginBottom: '16px' }}>
                <summary style={{ cursor: 'pointer', color: '#94A3B8', fontSize: '13px' }}>URL指定で取得（従来方式）</summary>
                <div style={{ padding: '12px 0' }}>
                  <div className="form-group">
                    <label className="form-label">情報取得用URL</label>
                    <input type="url" name="menuScrapingUrl" className="form-input" placeholder="https://tabelog.com/..." value={formData.menuScrapingUrl} onChange={handleChange} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => handleScrapeInfo(false)} disabled={isScraping || isSearching}>
                      {isScraping ? '⏳ 取得中...' : 'URLから店舗情報を取得'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleScrapeInfo(true)} disabled={isScraping || isSearching}>
                      {isScraping ? '⏳ 取得中...' : 'URLからメニューも取得'}
                    </button>
                  </div>
                </div>
              </details>

              <div className="section-divider" />

              <div className="card-title">📝 詳細情報</div>
              <div className="form-group">
                <label className="form-label">レストラン紹介</label>
                <textarea name="description" className="form-input" placeholder="レストランの特徴や魅力を入力してください" value={formData.description} onChange={handleChange} rows={4} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">営業時間</label>
                  <input type="text" name="businessHours" className="form-input" value={formData.businessHours} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">定休日</label>
                  <input type="text" name="holidays" className="form-input" value={formData.holidays} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">座席数</label>
                  <input type="text" name="seats" className="form-input" placeholder="例: 50席" value={formData.seats} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">予算</label>
                  <input type="text" name="budget" className="form-input" placeholder="例: ¥3,000～¥4,000" value={formData.budget} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">駐車場</label>
                  <input type="text" name="parking" className="form-input" placeholder="例: 有（10台）" value={formData.parking} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">支払い方法</label>
                  <input type="text" name="payment" className="form-input" placeholder="例: カード可、電子マネー可" value={formData.payment} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">最寄り駅・アクセス</label>
                  <input type="text" name="accessInfo" className="form-input" placeholder="例: JR福井駅 徒歩5分" value={formData.accessInfo} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">予約URL</label>
                  <input type="url" name="reservationUrl" className="form-input" placeholder="https://..." value={formData.reservationUrl} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">特徴・こだわり</label>
                <textarea name="features" className="form-input" placeholder="例: 地元食材使用、個室あり" value={formData.features} onChange={handleChange} rows={3} />
              </div>

              <div className="section-divider" />

              <div className="card-title">🔗 外部リンク・評価</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">公式HP</label>
                  <input type="url" name="officialWebsite" className="form-input" placeholder="https://..." value={formData.officialWebsite} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Googleマップ</label>
                  <input type="url" name="googleBusinessProfile" className="form-input" placeholder="https://maps.google.com/..." value={formData.googleBusinessProfile} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">食べログ</label>
                  <input type="url" name="tabelogUrl" className="form-input" placeholder="https://tabelog.com/..." value={formData.tabelogUrl} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">ぐるなび</label>
                  <input type="url" name="gurunaviUrl" className="form-input" placeholder="https://r.gnavi.co.jp/..." value={formData.gurunaviUrl} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Instagram</label>
                  <input type="url" name="instagramUrl" className="form-input" placeholder="https://instagram.com/..." value={formData.instagramUrl} onChange={handleChange} />
                </div>
                <div className="form-group" />
                <div className="form-group">
                  <label className="form-label">Google評価</label>
                  <input type="number" name="googleRating" className="form-input" placeholder="例: 3.8" step="0.1" min="0" max="5" value={formData.googleRating} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">食べログ評価</label>
                  <input type="number" name="tabelogRating" className="form-input" placeholder="例: 3.45" step="0.01" min="0" max="5" value={formData.tabelogRating} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Global Save Button - Visible on all tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving} style={{ padding: '12px 24px', fontSize: '16px' }}>
            {isSaving ? '⏳ 保存中...' : '💾 すべての変更を保存'}
          </button>
        </div>

        {/* Business Plan Upgrade - Always Visible - Commented out to hide */}
        {/*
        <div className="upgrade-card">
          <div className="upgrade-header">
            <div className="upgrade-icon">✨</div>
            <div className="upgrade-badge">おすすめ</div>
          </div>
          <h3 className="upgrade-title">ビジネスプラン（¥3,980/月）でさらに高度な設定が可能</h3>
          <div className="upgrade-features">
            <div className="upgrade-feature">
              <span className="feature-icon">🎨</span>
              <span>AIエディタでプロンプトを完全にカスタマイズ</span>
            </div>
            <div className="upgrade-feature">
              <span className="feature-icon">👋</span>
              <span>初めの挨拶をカスタマイズ可能</span>
            </div>
            <div className="upgrade-feature">
              <span className="feature-icon">📚</span>
              <span>メニュー情報を詳細に学習させる</span>
            </div>
            <div className="upgrade-feature">
              <span className="feature-icon">⚙️</span>
              <span>応答パターンを細かく調整</span>
            </div>
          </div>
          <button className="upgrade-btn" onClick={() => window.location.href = '/admin/account'}>
            プラン詳細を確認 →
          </button>
        </div>
        */}
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
        .card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
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
          border: 1px solid var(--border-strong);
          border-radius: 6px;
          font-size: 14px;
          transition: border 0.3s;
          background: var(--bg-input);
          color: var(--text);
        }
        .form-input:focus {
          outline: none;
          border-color: var(--primary);
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
        .upgrade-card {
          margin-top: 24px;
          padding: 24px;
          background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%);
          border: 2px solid #e0e7ff;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }
        .upgrade-card::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 150px;
          height: 150px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          border-radius: 0 0 0 100%;
        }
        .upgrade-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .upgrade-icon {
          font-size: 32px;
        }
        .upgrade-badge {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .upgrade-title {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 20px 0;
        }
        .upgrade-features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .upgrade-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: white;
          border-radius: 10px;
          font-size: 14px;
          color: #374151;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .feature-icon {
          font-size: 18px;
        }
        .upgrade-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .upgrade-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        @media (max-width: 768px) {
          .upgrade-features {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
        .section-divider {
          border-top: 1px solid var(--border);
          margin: 24px 0;
        }
        .logo-upload-section {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .logo-preview-container {
          position: relative;
          width: 120px;
          height: 120px;
          flex-shrink: 0;
        }
        .logo-preview {
          width: 120px;
          height: 120px;
          object-fit: contain;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .logo-remove-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .logo-remove-btn:hover {
          background: #dc2626;
        }
        .logo-placeholder {
          width: 120px;
          height: 120px;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 14px;
          flex-shrink: 0;
        }
        .logo-placeholder span:first-child {
          font-size: 32px;
        }
        .logo-input-group {
          flex: 1;
          min-width: 250px;
        }
        .logo-hint {
          margin-top: 8px;
          font-size: 12px;
          color: #6b7280;
        }
        .logo-file-name {
          font-size: 13px;
          color: #10a37f;
          margin: 4px 0;
          font-weight: 500;
        }
      `}</style>
    </AdminLayout>
  )
}
