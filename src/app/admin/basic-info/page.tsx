'use client'

import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { apiClient } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'

type TabType = 'basic' | 'source' | 'detail' | 'ai'

export default function BasicInfoPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  const [restaurant, setRestaurant] = useState<any>(null)
  const [restaurantLoading, setRestaurantLoading] = useState(true)
  const [restaurantError, setRestaurantError] = useState('')
  const [formData, setFormData] = useState({
    storeType: 'restaurant_izakaya',
    storeName: '',
    phone: '',
    address: '',
    officialWebsite: '',
    instagramUrl: '',
    menuScrapingUrl: '',
    description: '',
    businessHours: '',
    holidays: '',
    seats: '',
    budget: '',
    parking: '',
    payment: '',
    features: '',
    logoUrl: ''
  })

  const [aiIndustry, setAiIndustry] = useState('restaurant')
  const [aiTone, setAiTone] = useState('polite')
  const [isSaving, setIsSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ファイルサイズは5MB以下にしてください')
        return
      }
      setLogoFile(file)
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setLogoPreview(previewUrl)
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

      const response = await apiClient.get(`/restaurants/detail-by-user/${userUid}`) as { result: any; message: string; status_code: number }
      const restaurantData = response.result

      setRestaurant(restaurantData)

      setFormData({
        storeType: 'restaurant_izakaya',
        storeName: restaurantData.name || '',
        phone: restaurantData.phone_number || '',
        address: restaurantData.address || '',
        officialWebsite: restaurantData.official_website || '',
        instagramUrl: restaurantData.other_sources || '',
        menuScrapingUrl: restaurantData.menu_scraping_url || '',
        description: restaurantData.store_introduction || '',
        businessHours: restaurantData.opening_hours || '',
        holidays: '',
        seats: '',
        budget: restaurantData.budget || '',
        parking: restaurantData.parking_slot || '',
        payment: '',
        features: restaurantData.attention_in_detail || '',
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
  }, [authLoading, user?.uid])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    if (!restaurant) {
      alert('❌ レストラン情報が読み込まれていません')
      return
    }

    setIsSaving(true)
    try {
      // Use FormData for multipart upload
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.storeName)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('phone_number', formData.phone)
      formDataToSend.append('official_website', formData.officialWebsite)
      formDataToSend.append('address', formData.address)
      formDataToSend.append('other_sources', formData.instagramUrl)
      formDataToSend.append('menu_scraping_url', formData.menuScrapingUrl)
      formDataToSend.append('store_introduction', formData.description)
      formDataToSend.append('opening_hours', formData.businessHours)
      formDataToSend.append('budget', formData.budget)
      formDataToSend.append('parking_slot', formData.parking)
      formDataToSend.append('attention_in_detail', formData.features)
      formDataToSend.append('is_active', String(restaurant.is_active))
      
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
      
      alert('✅ レストラン情報を保存しました！')
    } catch (error) {
      console.error('Failed to save restaurant:', error)
      alert(`❌ 保存に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAIReference = () => {
    alert('🤖 AI参照で情報取得中...\n\n登録されたソースから情報を自動取得します。')
  }

  const tabs = [
    { key: 'basic', label: '📍 基本情報' },
    { key: 'source', label: '🔗 情報ソース' },
    { key: 'detail', label: '📝 詳細情報' },
    { key: 'ai', label: '🤖 AI設定' },
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
              <div style={{ color: '#64748b' }}>情報を取得しています</div>
            </div>
          ) : restaurantError ? (
            <div className="inner-card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '18px', marginBottom: '16px', color: '#dc2626' }}>❌ エラー</div>
              <div style={{ color: '#64748b', marginBottom: '20px' }}>{restaurantError}</div>
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
                <label className="form-label">🖼️ レストランロゴ</label>
                <div className="logo-upload-section">
                  {(logoPreview || formData.logoUrl) ? (
                    <div className="logo-preview-container">
                      <img src={logoPreview || formData.logoUrl} alt="Restaurant logo" className="logo-preview" />
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
                      accept="image/*"
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
                      {(logoPreview || formData.logoUrl) ? '🔄 ロゴを変更' : '📁 ロゴ画像を選択'}
                    </button>
                    {logoFile && (
                      <p className="logo-file-name">選択中: {logoFile.name}</p>
                    )}
                    <p className="logo-hint">※ 画像ファイルをアップロードしてください（最大5MB）。エンドユーザーのチャット画面に表示されます。</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">業種 *</label>
                <select name="storeType" className="form-input" value={formData.storeType} onChange={handleChange}>
                  <option value="">選択してください</option>
                  <option value="restaurant_izakaya">🍽️ 飲食店 - 居酒屋</option>
                  <option value="restaurant_cafe">🍽️ 飲食店 - カフェ</option>
                  <option value="restaurant_ramen">🍽️ 飲食店 - ラーメン店</option>
                  <option value="retail_apparel">🛍️ 小売店 - アパレル</option>
                  <option value="retail_goods">🛍️ 小売店 - 雑貨店</option>
                  <option value="hotel">🏨 宿泊施設</option>
                </select>
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
            </div>
          )}

          {activeTab === 'source' && (
            <div className="inner-card">
              <div className="card-title">🔗 情報ソース</div>
              <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
                レストランの公式サイトやSNSのURLを入力すると、AIが情報を参考にレストランデータを構築できます
              </p>
              <div className="form-group">
                <label className="form-label">🌐 公式HP</label>
                <input type="url" name="officialWebsite" className="form-input" placeholder="https://example.com" value={formData.officialWebsite} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">📸 Instagram</label>
                <input type="url" name="instagramUrl" className="form-input" placeholder="https://instagram.com/yourstore" value={formData.instagramUrl} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">🍽️ メニュー情報ソースURL</label>
                <input type="url" name="menuScrapingUrl" className="form-input" placeholder="https://tabelog.com/en/fukui/A1801/A180101/18007249/dtlmenu/" value={formData.menuScrapingUrl} onChange={handleChange} />
                <small style={{ color: '#666', fontSize: '12px' }}>メニュー情報を自動取得するためのURLを入力してください</small>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary">➕ その他のソースを追加</button>
                <button className="btn btn-primary" onClick={handleAIReference}>🤖 AI参照で情報取得</button>
              </div>
              <div style={{ marginTop: '15px', padding: '10px', background: '#FFF3E0', borderRadius: '6px', fontSize: '13px', color: '#E65100' }}>
                <strong>⚠️ 注意:</strong> 外部サイトの情報は参考情報として取得されます。必ず内容を確認してから反映してください。
              </div>
            </div>
          )}

          {activeTab === 'detail' && (
            <div className="inner-card">
              <div className="card-title">📝 レストラン詳細</div>
              <div className="form-group">
                <label className="form-label">レストラン紹介</label>
                <textarea name="description" className="form-input" placeholder="レストランの特徴や魅力を入力してください" value={formData.description} onChange={handleChange} rows={4} />
              </div>
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
                <input type="text" name="seats" className="form-input" placeholder="例: 50席（カウンター10席、テーブル40席）" value={formData.seats} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">予算</label>
                <input type="text" name="budget" className="form-input" placeholder="例: ディナー ¥3,000～¥4,000" value={formData.budget} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">駐車場</label>
                <input type="text" name="parking" className="form-input" placeholder="例: 有（10台）、無" value={formData.parking} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">支払い方法</label>
                <input type="text" name="payment" className="form-input" placeholder="例: カード可、電子マネー可、現金のみ" value={formData.payment} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">特徴・こだわり</label>
                <textarea name="features" className="form-input" placeholder="例: 地元食材使用、個室あり、英語メニューあり" value={formData.features} onChange={handleChange} rows={3} />
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="inner-card">
              <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>
                  <span>🤖</span>
                  <span>AI基本設定</span>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#667eea', background: '#f0f4ff', padding: '4px 10px', borderRadius: '12px', marginLeft: '8px' }}>ライトプラン以上</span>
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>お客様と対話するAIアシスタントの基本的な設定を行います</p>
              </div>

              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0', color: '#1a202c' }}>システムプロンプト</h4>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>選択したAI応答テンプレートが自動適用されます</p>
                <select value={aiIndustry} onChange={(e) => setAiIndustry(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', background: 'white' }}>
                  <option value="">テンプレートを選択してください</option>
                  <option value="template1">テンプレート1</option>
                  <option value="template2">テンプレート2</option>
                  <option value="template3">テンプレート3</option>
                  <option value="template4">テンプレート4</option>
                  <option value="template5">テンプレート5</option>
                </select>
              </div>

              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0', color: '#1a202c' }}>AIトーン</h4>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>お客様への話し方のスタイルを選択してください</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', background: aiTone === 'casual' ? '#f0f4ff' : 'white', border: aiTone === 'casual' ? '2px solid #667eea' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="aiTone" value="casual" checked={aiTone === 'casual'} onChange={(e) => setAiTone(e.target.value)} style={{ marginRight: '12px', marginTop: '4px' }} />
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '4px', color: '#1a202c' }}>カジュアル - 親しみやすい話し方</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>例: 「いらっしゃい！うちの料理、めっちゃ美味しいよ！」</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', background: aiTone === 'polite' ? '#f0f4ff' : 'white', border: aiTone === 'polite' ? '2px solid #667eea' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="aiTone" value="polite" checked={aiTone === 'polite'} onChange={(e) => setAiTone(e.target.value)} style={{ marginRight: '12px', marginTop: '4px' }} />
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '4px', color: '#1a202c' }}>丁寧 - 敬語でしっかりと</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>例: 「いらっしゃいませ。当店自慢の料理をご堪能ください。」</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', background: aiTone === 'luxury' ? '#f0f4ff' : 'white', border: aiTone === 'luxury' ? '2px solid #667eea' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
                    <input type="radio" name="aiTone" value="luxury" checked={aiTone === 'luxury'} onChange={(e) => setAiTone(e.target.value)} style={{ marginRight: '12px', marginTop: '4px' }} />
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '4px', color: '#1a202c' }}>高級感 - 上品で洗練された表現</div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>例: 「ようこそお越しくださいました。厳選された食材の逸品をお楽しみください。」</div>
                    </div>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary">リセット</button>
                <button className="btn btn-primary" onClick={() => alert('AI設定を保存しました！')}>AI設定を保存</button>
              </div>
            </div>
          )}
        </div>

        {/* Global Save Button - Visible on all tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
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
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .tab-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 12px;
          flex-wrap: wrap;
        }
        .tab-btn {
          padding: 10px 16px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          background: #f1f5f9;
          color: #334155;
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
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }
        .card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1a1a1a;
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
          background: #f8f9fa;
          color: #333;
          border: 1px solid #e0e0e0;
        }
        .btn-secondary:hover {
          background: #e9ecef;
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
