'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AdminLayout from '../../../components/admin/AdminLayout'
import { apiClient, BUSINESS_TYPES } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../components/admin/Toast'
import { FormField, FormInput, FormSelect, FormTextarea, FormGrid } from '../../../components/admin/ui'
import { useAdminLang } from '../../../hooks/useAdminLang'

export default function BasicInfoPage() {
  return (
    <Suspense fallback={<BasicInfoFallback />}>
      <BasicInfoContent />
    </Suspense>
  )
}

function BasicInfoFallback() {
  const { t } = useAdminLang()
  return (
    <AdminLayout title={t.basicInfo.title}>
      <div style={{ textAlign: 'center', padding: '40px' }}>{t.basicInfo.loading}</div>
    </AdminLayout>
  )
}

function BasicInfoContent() {
  const { t } = useAdminLang()
  const { user, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const uidParam = searchParams?.get('uid') ?? null
  const isAdminViewing = !!(uidParam && user && (user.role === 'superadmin' || user.role === 'platform_owner'))
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
    companyName: '',
    representativeName: ''
  })

  const [isSaving, setIsSaving] = useState(false)
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
        companyName: restaurantData.company_name || '',
        representativeName: restaurantData.representative_name || ''
      })
    } catch (error) {
      console.error('Failed to fetch restaurant:', error)
      setRestaurantError(t.basicInfo.errorRestaurantFetch)
    } finally {
      setRestaurantLoading(false)
    }
  }

  // Fetch restaurant data when user is loaded
  useEffect(() => {
    if (!authLoading && user?.uid) {
      fetchRestaurantData(user.uid)
    } else if (!authLoading && !user) {
      setRestaurantError(t.basicInfo.errorUserNotFound)
      setRestaurantLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.uid, isAdminViewing, uidParam])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    if (!restaurant) {
      toast('error', t.basicInfo.errorRestaurantNotLoaded)
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
      addIfPresent('instagram_url', formData.instagramUrl)
      addIfPresent('tabelog_url', formData.tabelogUrl)
      addIfPresent('gurunavi_url', formData.gurunaviUrl)
      addIfPresent('company_name', formData.companyName)
      addIfPresent('representative_name', formData.representativeName)

      const token = sessionStorage.getItem('access_token')
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api'

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

      toast('success', t.basicInfo.saved)
    } catch (error) {
      console.error('Failed to save restaurant:', error)
      toast('error', t.basicInfo.saveFailed(error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSearchInfo = async (withMenus: boolean = false) => {
    if (!restaurant) return

    setIsSearching(true)
    try {
      const token = sessionStorage.getItem('access_token')
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api'

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
          instagramUrl: toStr(info.instagram_url) || prev.instagramUrl,
          tabelogUrl: toStr(info.tabelog_url) || prev.tabelogUrl,
          gurunaviUrl: toStr(info.gurunavi_url) || prev.gurunaviUrl,
          officialWebsite: toStr(info.official_website) || prev.officialWebsite,
          googleBusinessProfile: toStr(info.google_business_profile) || prev.googleBusinessProfile,
        }))

        const extra = withMenus && data.result?.menu_scrape ? t.basicInfo.menuCountSuffix(data.result.menu_scrape.items_saved || 0) : ''
        toast('success', t.basicInfo.searchSuccess(extra))
      }
    } catch (error) {
      console.error('Search failed:', error)
      toast('error', t.basicInfo.searchFailed(error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <AdminLayout title={t.basicInfo.title}>
      <div className="page-content">
        {restaurantLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', marginBottom: '16px' }}>{t.basicInfo.loadingDetail}</div>
            <div style={{ color: '#94A3B8' }}>{t.basicInfo.loading}</div>
          </div>
        ) : restaurantError ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', marginBottom: '16px', color: '#dc2626' }}>{t.basicInfo.error}</div>
            <div style={{ color: '#94A3B8', marginBottom: '20px' }}>{restaurantError}</div>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              {t.basicInfo.reload}
            </button>
          </div>
        ) : (
          <>

              {/* Section 1: 基本情報 */}
              <div className="section-card">

                <FormGrid cols={2}>
                  <FormField label={t.basicInfo.restaurantName} required>
                    <FormInput type="text" name="storeName" value={formData.storeName} onChange={handleChange} />
                  </FormField>
                  <FormField label={t.basicInfo.officialWebsite}>
                    <FormInput type="url" name="officialWebsite" placeholder="https://..." value={formData.officialWebsite} onChange={handleChange} />
                  </FormField>
                </FormGrid>

                <FormGrid cols={2}>
                  <FormField label={t.basicInfo.phone}>
                    <FormInput type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                  </FormField>
                  <FormField label={t.basicInfo.address}>
                    <FormInput type="text" name="address" value={formData.address} onChange={handleChange} />
                  </FormField>
                </FormGrid>

                <FormField label={t.basicInfo.businessType}>
                  <FormSelect name="storeType" value={formData.storeType} onChange={handleChange}>
                    <option value="">{t.basicInfo.pleaseSelect}</option>
                    {Object.entries(BUSINESS_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormGrid cols={2}>
                  <FormField label={t.basicInfo.companyName}>
                    <FormInput type="text" name="companyName" placeholder={t.basicInfo.companyNamePlaceholder} value={formData.companyName} onChange={handleChange} />
                  </FormField>
                  <FormField label={t.basicInfo.representativeName}>
                    <FormInput type="text" name="representativeName" placeholder={t.basicInfo.representativeNamePlaceholder} value={formData.representativeName} onChange={handleChange} />
                  </FormField>
                </FormGrid>

              </div>

              {/* Section 2: AI情報取得 */}
              <div className="section-card">
                <div className="card-title">{t.basicInfo.sectionAiSearch}</div>
                <p style={{ color: '#94A3B8', marginBottom: '16px', fontSize: '13px' }}>
                  {t.basicInfo.aiSearchDesc}
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSearchInfo(false)}
                    disabled={isSearching}
                  >
                    {isSearching ? t.basicInfo.searching : t.basicInfo.searchByName}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleSearchInfo(true)}
                    disabled={isSearching}
                  >
                    {isSearching ? t.basicInfo.searching : t.basicInfo.searchByNameAndMenu}
                  </button>
                </div>
              </div>

              {/* Section 3: 詳細情報 */}
              <div className="section-card">
                <div className="card-title">{t.basicInfo.sectionDetail}</div>

                <FormField label={t.basicInfo.introduction}>
                  <FormTextarea name="description" placeholder={t.basicInfo.introductionPlaceholder} value={formData.description} onChange={handleChange} rows={4} />
                </FormField>

                <FormGrid cols={2}>
                  <FormField label={t.basicInfo.businessHours}>
                    <FormInput type="text" name="businessHours" value={formData.businessHours} onChange={handleChange} />
                  </FormField>
                  <FormField label={t.basicInfo.holidays}>
                    <FormInput type="text" name="holidays" value={formData.holidays} onChange={handleChange} />
                  </FormField>
                  <FormField label={t.basicInfo.seats}>
                    <FormInput type="text" name="seats" placeholder={t.basicInfo.seatsPlaceholder} value={formData.seats} onChange={handleChange} />
                  </FormField>
                  <FormField label={t.basicInfo.budget}>
                    <FormInput type="text" name="budget" placeholder={t.basicInfo.budgetPlaceholder} value={formData.budget} onChange={handleChange} />
                  </FormField>
                  <FormField label={t.basicInfo.parking}>
                    <FormInput type="text" name="parking" placeholder={t.basicInfo.parkingPlaceholder} value={formData.parking} onChange={handleChange} />
                  </FormField>
                  <FormField label={t.basicInfo.payment}>
                    <FormInput type="text" name="payment" placeholder={t.basicInfo.paymentPlaceholder} value={formData.payment} onChange={handleChange} />
                  </FormField>
                  <FormField label={t.basicInfo.accessInfo}>
                    <FormInput type="text" name="accessInfo" placeholder={t.basicInfo.accessInfoPlaceholder} value={formData.accessInfo} onChange={handleChange} />
                  </FormField>
                  <FormField label={t.basicInfo.reservationUrl}>
                    <FormInput type="url" name="reservationUrl" placeholder="https://..." value={formData.reservationUrl} onChange={handleChange} />
                  </FormField>
                </FormGrid>

                <FormField label={t.basicInfo.featuresLabel}>
                  <FormTextarea
                    name="features"
                    placeholder={t.basicInfo.featuresPlaceholder}
                    value={formData.features}
                    onChange={handleChange}
                    rows={4}
                  />
                </FormField>
              </div>

              {/* Section 4: 外部リンク */}
              <div className="section-card">
                <div className="card-title">{t.basicInfo.sectionExternalLinks}</div>

                <FormGrid cols={2}>
                  <FormField label={t.basicInfo.googleMaps}>
                    <FormInput type="url" name="googleBusinessProfile" placeholder="https://maps.google.com/..." value={formData.googleBusinessProfile} onChange={handleChange} />
                  </FormField>
                  <FormField label={t.basicInfo.tabelog}>
                    <FormInput type="url" name="tabelogUrl" placeholder="https://tabelog.com/..." value={formData.tabelogUrl} onChange={handleChange} />
                  </FormField>
                  <FormField label={t.basicInfo.gurunavi}>
                    <FormInput type="url" name="gurunaviUrl" placeholder="https://r.gnavi.co.jp/..." value={formData.gurunaviUrl} onChange={handleChange} />
                  </FormField>
                  <FormField label={t.basicInfo.instagram}>
                    <FormInput type="url" name="instagramUrl" placeholder="https://instagram.com/..." value={formData.instagramUrl} onChange={handleChange} />
                  </FormField>
                </FormGrid>
              </div>

          </>
        )}

        {/* Global Save Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving} style={{ padding: '12px 24px', fontSize: '16px' }}>
            {isSaving ? t.prompts.saving : t.basicInfo.saveAll}
          </button>
        </div>
      </div>

      <style jsx>{`
        .page-content {
          padding: 0;
        }
        .section-card {
          padding: 20px 0;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .section-card:last-child {
          margin-bottom: 0;
          border-bottom: none;
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
