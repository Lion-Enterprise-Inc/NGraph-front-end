'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { MenuApi, Menu, MenuCreate, MenuUpdate, Ingredient, AllergenApi, Allergen, AllergenListResponse, apiClient } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'

interface MenuItem {
  uid: string
  name: string
  nameEn: string | null
  category: string
  price: number
  status: boolean
  ingredients: Ingredient[]
  description: string | null
  allergens: Allergen[]
}

export default function MenuListPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFetchModal, setShowFetchModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [previewItem, setPreviewItem] = useState<MenuItem | null>(null)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [pendingMenus, setPendingMenus] = useState<{id: number, name: string, price: number, category: string, confidence: number}[]>([])
  const [newMenu, setNewMenu] = useState({
    name: '',
    nameEn: '',
    price: '',
    category: '',
    description: '',
    ingredients: ''
  })

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [restaurant, setRestaurant] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editIngredientsText, setEditIngredientsText] = useState('')
  const [allergens, setAllergens] = useState<{ mandatory: Allergen[]; recommended: Allergen[] }>({ mandatory: [], recommended: [] })
  const [selectedAllergenUids, setSelectedAllergenUids] = useState<string[]>([])
  const [editSelectedAllergenUids, setEditSelectedAllergenUids] = useState<string[]>([])

  // Fetch restaurant and menus
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !user?.uid) return

      try {
        setIsLoading(true)
        setError('')

        // First get the restaurant for this user
        const restaurantResponse = await apiClient.get(`/restaurants/detail-by-user/${user.uid}`) as { result: any }
        const restaurantData = restaurantResponse.result
        setRestaurant(restaurantData)

        if (restaurantData?.uid) {
          // Fetch menus for this restaurant
          try {
            const menusResponse = await MenuApi.getAll(restaurantData.uid)
            const items = menusResponse.result?.items || []
            const menus = items.map((menu: Menu) => ({
              uid: menu.uid,
              name: menu.name_jp,
              nameEn: menu.name_en,
              category: menu.category,
              price: menu.price,
              status: menu.status,
              ingredients: menu.ingredients || [],
              description: menu.description,
              allergens: menu.allergens || []
            }))
            setMenuItems(menus)
          } catch (menuErr) {
            // No menus found - this is OK, just show empty list
            console.log('No menus found for restaurant')
            setMenuItems([])
          }

          // Fetch allergens
          try {
            const allergensResponse = await AllergenApi.getAll()
            console.log('Allergen API response:', allergensResponse)
            // Transform array response to object format
            // The API returns an array of objects, each containing either mandatory or recommended allergens
            let allMandatory: Allergen[] = []
            let allRecommended: Allergen[] = []

            if (Array.isArray(allergensResponse.result)) {
              allergensResponse.result.forEach((item, index) => {
                console.log(`Processing item ${index}:`, item)
                if (item.mandatory) {
                  console.log(`Found mandatory allergens:`, item.mandatory.length)
                  allMandatory = [...allMandatory, ...item.mandatory]
                }
                if (item.recommended) {
                  console.log(`Found recommended allergens:`, item.recommended.length)
                  allRecommended = [...allRecommended, ...item.recommended]
                }
              })
            }

            const transformedAllergens = {
              mandatory: allMandatory,
              recommended: allRecommended
            }
            console.log('Final transformed allergens:', transformedAllergens)
            setAllergens(transformedAllergens)
            console.log('Allergens state set successfully')
          } catch (allergenErr) {
            console.log('Failed to fetch allergens:', allergenErr)
            // Set empty allergens if fetch fails
            setAllergens({ mandatory: [], recommended: [] })
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch restaurant data:', err)
        setError('レストラン情報の取得に失敗しました。')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [authLoading, user?.uid])

  const filteredItems = menuItems.filter(item => {
    const ingredientsStr = item.ingredients?.map(ing => ing.name).join(' ') || ''
    const matchesSearch = item.name.includes(searchQuery) || item.category.includes(searchQuery) || ingredientsStr.includes(searchQuery)
    const matchesFilter = filter === 'all' || 
      (filter === 'verified' && item.status === true) || 
      (filter === 'warning' && item.status === false)
    return matchesSearch && matchesFilter
  })

  const countAll = menuItems.length
  const countVerified = menuItems.filter(i => i.status === true).length
  const countWarning = menuItems.filter(i => i.status === false).length

  // Refresh menu list
  const refreshMenus = async () => {
    if (!restaurant?.uid) return
    try {
      const menusResponse = await MenuApi.getAll(restaurant.uid)
      const items = menusResponse.result?.items || []
      const menus = items.map((menu: Menu) => ({
        uid: menu.uid,
        name: menu.name_jp,
        nameEn: menu.name_en,
        category: menu.category,
        price: menu.price,
        status: menu.status,
        ingredients: menu.ingredients || [],
        description: menu.description,
        allergens: menu.allergens || []
      }))
      setMenuItems(menus)
    } catch (err) {
      console.error('Failed to refresh menus:', err)
      // On error, set empty array instead of keeping stale data
      setMenuItems([])
    }
  }

  const handleAddMenu = async () => {
    if (!newMenu.name || !newMenu.price || !newMenu.category) {
      alert('料理名、価格、カテゴリーは必須です')
      return
    }
    if (!restaurant?.uid) {
      alert('レストラン情報が見つかりません')
      return
    }

    setIsSaving(true)
    try {
      // Parse ingredients from comma-separated string to array
      const ingredientsArray = newMenu.ingredients 
        ? newMenu.ingredients.split(',').map(s => s.trim()).filter(Boolean) 
        : []

      const menuData: MenuCreate = {
        name_jp: newMenu.name,
        name_en: newMenu.nameEn || null,
        category: newMenu.category,
        price: Number(newMenu.price),
        description: newMenu.description || null,
        restaurant_uid: restaurant.uid,
        ingredients: ingredientsArray,
        allergen_uids: selectedAllergenUids.length > 0 ? selectedAllergenUids : null,
        status: false
      }

      await MenuApi.create(menuData)
      await refreshMenus()
      
      setNewMenu({ name: '', nameEn: '', price: '', category: '', description: '', ingredients: '' })
      setSelectedAllergenUids([])
      setShowAddModal(false)
      setActiveTab('basic')
      alert('✅ メニューを追加しました！')
    } catch (err) {
      console.error('Failed to add menu:', err)
      alert(`❌ メニューの追加に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFetchFromSource = () => {
    setShowFetchModal(true)
    setTimeout(() => {
      setPendingMenus([
        { id: 1, name: '特選海鮮丼', price: 1200, category: 'ご飯もの', confidence: 88 },
        { id: 2, name: '福井牛ステーキ', price: 3500, category: '焼き物', confidence: 92 },
      ])
      setShowFetchModal(false)
      setShowApprovalModal(true)
    }, 2000)
  }

  const handleApproveMenu = async (menuId: number) => {
    const menu = pendingMenus.find(m => m.id === menuId)
    if (menu && restaurant?.uid) {
      try {
        const menuData: MenuCreate = {
          name_jp: menu.name,
          category: menu.category,
          price: menu.price,
          restaurant_uid: restaurant.uid,
          status: false
        }
        await MenuApi.create(menuData)
        await refreshMenus()
        setPendingMenus(pendingMenus.filter(m => m.id !== menuId))
      } catch (err) {
        console.error('Failed to approve menu:', err)
        alert('メニューの承認に失敗しました')
      }
    }
  }

  const handleDenyMenu = (menuId: number) => {
    setPendingMenus(pendingMenus.filter(m => m.id !== menuId))
  }

  const handleApproveAll = async () => {
    if (!restaurant?.uid) return
    
    try {
      for (const menu of pendingMenus) {
        const menuData: MenuCreate = {
          name_jp: menu.name,
          category: menu.category,
          price: menu.price,
          restaurant_uid: restaurant.uid,
          status: false
        }
        await MenuApi.create(menuData)
      }
      await refreshMenus()
      setPendingMenus([])
      setShowApprovalModal(false)
      alert('✅ すべてのメニューを承認しました！')
    } catch (err) {
      console.error('Failed to approve all menus:', err)
      alert('メニューの承認に失敗しました')
    }
  }

  const handleDenyAll = () => {
    setPendingMenus([])
    setShowApprovalModal(false)
  }

  const handlePreview = (item: MenuItem) => {
    setPreviewItem(item)
    setShowPreviewModal(true)
  }

  const handleEdit = (item: MenuItem) => {
    setEditItem({...item})
    // Initialize edit ingredients text from item's ingredients
    setEditIngredientsText(item.ingredients?.map(ing => ing.name).join(', ') || '')
    setEditSelectedAllergenUids(item.allergens?.map(allergen => allergen.uid) || [])
    setShowEditModal(true)
    setActiveTab('basic')
  }

  const handleSaveEdit = async () => {
    if (!editItem) return

    setIsSaving(true)
    try {
      // Parse ingredients from the text input
      const ingredientNames = editIngredientsText
        ? editIngredientsText.split(',').map(s => s.trim()).filter(Boolean)
        : []
      
      const updateData: MenuUpdate = {
        name_jp: editItem.name,
        name_en: editItem.nameEn,
        category: editItem.category,
        price: editItem.price,
        description: editItem.description,
        ingredients: ingredientNames,
        allergen_uids: editSelectedAllergenUids.length > 0 ? editSelectedAllergenUids : null,
        status: editItem.status
      }

      await MenuApi.update(editItem.uid, updateData)
      await refreshMenus()
      
      setShowEditModal(false)
      setEditItem(null)
      setEditIngredientsText('')
      setEditSelectedAllergenUids([])
      alert('✅ メニューを更新しました！')
    } catch (err) {
      console.error('Failed to update menu:', err)
      alert(`❌ メニューの更新に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (uid: string) => {
    if (!confirm('このメニューを削除しますか？')) return

    try {
      await MenuApi.delete(uid)
      await refreshMenus()
      alert('✅ メニューを削除しました')
    } catch (err) {
      console.error('Failed to delete menu:', err)
      alert(`❌ メニューの削除に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <AdminLayout title="メニュー一覧">
      {/* メニュー管理カード */}
      <div className="card">
        <div className="card-title">📋 メニュー・商品管理</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>メニュー一覧</h2>
          <button className="btn btn-primary" onClick={handleFetchFromSource} style={{ padding: '8px 16px', fontSize: '13px' }}>
            🤖 基本情報のソースからメニューを取得
          </button>
        </div>

        {/* 検索バー */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="🔍 メニュー名、カテゴリ、原材料で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 40px 10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
            />
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* フィルターと表示件数 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div className="filter-buttons" style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              全て ({countAll})
            </button>
            <button
              className={`filter-btn ${filter === 'warning' ? 'active' : ''}`}
              onClick={() => setFilter('warning')}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              要確認 ({countWarning})
            </button>
            <button
              className={`filter-btn ${filter === 'verified' ? 'active' : ''}`}
              onClick={() => setFilter('verified')}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              確認済み ({countVerified})
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#666' }}>表示件数:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
            >
              <option value={10}>10件</option>
              <option value={25}>25件</option>
              <option value={50}>50件</option>
              <option value={100}>100件</option>
            </select>
          </div>
        </div>

        {/* Loading/Error states */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '18px', marginBottom: '16px' }}>📋 メニューを読み込み中...</div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
            <div style={{ fontSize: '18px', marginBottom: '16px' }}>❌ {error}</div>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>再読み込み</button>
          </div>
        )}

        {/* メニューテーブル */}
        {!isLoading && !error && (
        <div className="menu-table-container">
          <table className="menu-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>メニュー詳細</th>
                <th style={{ width: '10%', textAlign: 'center' }}>価格</th>
                <th style={{ width: '12%', textAlign: 'center' }}>信頼度</th>
                <th style={{ width: '10%', textAlign: 'center' }}>ステータス</th>
                <th style={{ width: '33%', textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    メニューがありません。「手動で新規追加」ボタンからメニューを追加してください。
                  </td>
                </tr>
              ) : filteredItems.map(item => {
                const confidence = item.status ? 95 : 65
                return (
                  <tr key={item.uid}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '40px', height: '30px', background: '#f8f9fa', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999' }}>📄</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#212529', marginBottom: '2px', fontSize: '14px' }}>🇯🇵 {item.name}</div>
                          {item.nameEn && (
                            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '2px', fontStyle: 'italic' }}>
                              🇬🇧 {item.nameEn}
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '2px' }}>
                            📂 {item.category}
                          </div>
                          <div style={{ fontSize: '10px', color: '#6c757d', marginBottom: '2px' }}>
                            🥘 {item.ingredients?.length > 0 ? item.ingredients.map(ing => ing.name).join(', ') : '原材料なし'}
                          </div>
                          <span style={{ color: item.status ? '#28a745' : '#dc3545', fontSize: '11px' }}>
                            {item.status ? '✓ 確認済み' : '⚠️ 要確認'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#28a745', fontSize: '14px' }}>¥{item.price.toLocaleString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <div style={{ width: '50px', height: '4px', background: '#e9ecef', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${confidence}%`, height: '100%', background: confidence >= 80 ? '#28a745' : confidence >= 60 ? '#ffc107' : '#dc3545' }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: confidence >= 80 ? '#28a745' : confidence >= 60 ? '#ffc107' : '#dc3545' }}>{confidence}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-badge ${item.status ? 'verified' : 'warning'}`}>
                        {item.status ? '確認済み' : '要確認'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn-action btn-preview" onClick={() => handlePreview(item)}>👁️ プレビュー</button>
                        <button className="btn-action btn-edit" onClick={() => handleEdit(item)}>✏️ 編集</button>
                        <button className="btn-action btn-delete" onClick={() => handleDelete(item.uid)}>🗑️ 削除</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        )}

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ width: 'auto', minWidth: '180px', maxWidth: '250px', margin: '8px auto', display: 'block', padding: '10px 20px', fontSize: '14px' }}>
          ➕ 手動で新規追加
        </button>
      </div>

      {/* メニュー編集モーダル */}
      {showAddModal && (
        <div className="modal active">
          <div className="modal-content">
            <button className="modal-close" onClick={() => { setShowAddModal(false); setActiveTab('basic'); }}>×</button>
            <div className="modal-title">📝 メニュー編集</div>

            <div className="tab-nav">
              <button className={`tab-nav-btn ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>📝 基本情報</button>
              <button className={`tab-nav-btn ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>🥕 原材料</button>
              <button className={`tab-nav-btn ${activeTab === 'allergens' ? 'active' : ''}`} onClick={() => setActiveTab('allergens')}>⚠️ アレルギー</button>
            </div>

            {activeTab === 'basic' && (
              <div className="tab-content">
                <div className="form-group">
                  <label className="form-label">料理名（日本語）*</label>
                  <input type="text" className="form-input" value={newMenu.name} onChange={(e) => setNewMenu({...newMenu, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">料理名（英語）</label>
                  <input type="text" className="form-input" value={newMenu.nameEn} onChange={(e) => setNewMenu({...newMenu, nameEn: e.target.value})} />
                  <button className="btn ai-btn btn-small" style={{ marginTop: '5px' }}>🤖 AI自動翻訳</button>
                </div>
                <div className="form-group">
                  <label className="form-label">価格 *</label>
                  <input type="number" className="form-input" value={newMenu.price} onChange={(e) => setNewMenu({...newMenu, price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">カテゴリー *</label>
                  <select className="form-input" value={newMenu.category} onChange={(e) => setNewMenu({...newMenu, category: e.target.value})}>
                    <option value="">選択してください</option>
                    <option value="ご飯もの">ご飯もの</option>
                    <option value="刺身">刺身</option>
                    <option value="焼き物">焼き物</option>
                    <option value="揚げ物">揚げ物</option>
                    <option value="コース">コース</option>
                    <option value="ドリンク">ドリンク</option>
                    <option value="そば">そば</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">料理の説明</label>
                  <textarea className="form-input" value={newMenu.description} onChange={(e) => setNewMenu({...newMenu, description: e.target.value})} />
                  <button className="btn ai-btn btn-small" style={{ marginTop: '5px' }}>🤖 AI生成</button>
                </div>
                <button className="btn btn-primary" onClick={() => setActiveTab('materials')}>次へ: 原材料設定 →</button>
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="tab-content">
                <div className="alert-info">
                  現在の信頼度: <strong>65%</strong> → 完了後: <strong>95%</strong>
                </div>
                <div className="form-group">
                  <label className="form-label">原材料（カンマ区切りで入力）</label>
                  <button className="btn ai-btn btn-small" style={{ marginBottom: '12px' }}>🤖 AI推察</button>
                  <textarea 
                    className="form-input" 
                    value={newMenu.ingredients}
                    onChange={(e) => setNewMenu({...newMenu, ingredients: e.target.value})}
                    placeholder="例: 鶏肉, 玉ねぎ, にんじん, 醤油, みりん"
                    rows={3}
                    style={{ marginBottom: '8px' }}
                  />
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    ※ 複数の原材料はカンマ（,）で区切って入力してください
                  </div>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                  <button className="btn btn-primary" onClick={() => setActiveTab('allergens')}>次へ: アレルギー設定 →</button>
                </div>
              </div>
            )}

            {activeTab === 'allergens' && (
              <div className="tab-content">
                <div className="form-group">
                  <label className="form-label">⚠️ アレルゲン情報</label>
                  {allergens && allergens.mandatory && allergens.mandatory.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <strong>特定原材料（表示義務）:</strong>
                      <div className="checkbox-group">
                        {allergens.mandatory.map(allergen => (
                          <label key={allergen.uid} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={selectedAllergenUids.includes(allergen.uid)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAllergenUids([...selectedAllergenUids, allergen.uid])
                                } else {
                                  setSelectedAllergenUids(selectedAllergenUids.filter(uid => uid !== allergen.uid))
                                }
                              }}
                            /> {allergen.name_jp} ({allergen.name_en})
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {allergens && allergens.recommended && allergens.recommended.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <strong>推奨表示アレルゲン:</strong>
                      <div className="checkbox-group">
                        {allergens.recommended.map(allergen => (
                          <label key={allergen.uid} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={selectedAllergenUids.includes(allergen.uid)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAllergenUids([...selectedAllergenUids, allergen.uid])
                                } else {
                                  setSelectedAllergenUids(selectedAllergenUids.filter(uid => uid !== allergen.uid))
                                }
                              }}
                            /> {allergen.name_jp} ({allergen.name_en})
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* DEBUG: Always show recommended section */}
                  {allergens && (
                    <div style={{ marginBottom: '20px', border: '2px solid red', padding: '10px' }}>
                      <strong>DEBUG - Recommended Allergens (always shown):</strong>
                      <div>Has allergens object: {allergens ? 'YES' : 'NO'}</div>
                      <div>Has recommended property: {allergens.recommended ? 'YES' : 'NO'}</div>
                      <div>Recommended length: {allergens.recommended ? allergens.recommended.length : 'N/A'}</div>
                      {allergens.recommended && allergens.recommended.length > 0 && (
                        <div className="checkbox-group">
                          {allergens.recommended.slice(0, 3).map(allergen => (
                            <label key={allergen.uid} className="checkbox-item">
                              <input
                                type="checkbox"
                                checked={selectedAllergenUids.includes(allergen.uid)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAllergenUids([...selectedAllergenUids, allergen.uid])
                                  } else {
                                    setSelectedAllergenUids(selectedAllergenUids.filter(uid => uid !== allergen.uid))
                                  }
                                }}
                              /> {allergen.name_jp} ({allergen.name_en})
                            </label>
                          ))}
                          {allergens.recommended.length > 3 && <div>... and {allergens.recommended.length - 3} more</div>}
                        </div>
                      )}
                    </div>
                  )}
                  {(!allergens || (!allergens.mandatory?.length && !allergens.recommended?.length)) && (
                    <div style={{ color: '#666', fontStyle: 'italic' }}>
                      アレルゲン情報が読み込めませんでした。後で再試行してください。
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => { setShowAddModal(false); setActiveTab('basic'); }}>キャンセル</button>
                  <button className="btn btn-primary" onClick={handleAddMenu}>💾 保存</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 取得中モーダル */}
      {showFetchModal && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-title">🤖 AIが解析中...</div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill"></div>
            </div>
            <div style={{ marginTop: '10px', color: '#666' }}>基本情報のソースからメニューを取得しています...</div>
          </div>
        </div>
      )}

      {/* AI取得メニューの承認モーダル */}
      {showApprovalModal && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <button className="modal-close" onClick={() => setShowApprovalModal(false)}>×</button>
            <div className="modal-title">🤖 AI取得メニューの承認</div>
            
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                ソース: <strong>https://example.com/menu</strong>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                <span>🆕 新規メニュー: <strong>{pendingMenus.length}</strong></span>
                <span>🔄 重複メニュー: <strong>0</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button className="btn btn-success" onClick={handleApproveAll} style={{ background: '#10b981', color: 'white' }}>
                ✅ すべて承認
              </button>
              <button className="btn btn-danger" onClick={handleDenyAll}>
                ❌ すべて拒否
              </button>
              <button className="btn btn-secondary">
                🔄 重複をすべてマージ
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#1f2937' }}>
                🆕 新規メニュー ({pendingMenus.length}件)
              </h4>
              
              {pendingMenus.map(menu => (
                <div key={menu.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>{menu.name}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        ¥{menu.price.toLocaleString()} | {menu.category} | 信頼度: {menu.confidence}%
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-small" 
                        onClick={() => handleApproveMenu(menu.id)}
                        style={{ background: '#d1fae5', color: '#059669' }}
                      >
                        ✅ 承認
                      </button>
                      <button 
                        className="btn btn-small btn-danger" 
                        onClick={() => handleDenyMenu(menu.id)}
                      >
                        ❌ 拒否
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {pendingMenus.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  すべてのメニューが処理されました
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* プレビューモーダル */}
      {showPreviewModal && previewItem && (
        <div className="modal active">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <button className="modal-close" onClick={() => setShowPreviewModal(false)}>×</button>
            <div className="modal-title">👁️ ユーザー画面プレビュー</div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#666' }}>言語選択: </label>
              <select style={{ padding: '5px 10px', marginLeft: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                <option value="jp">🇯🇵 日本語</option>
                <option value="en">🇬🇧 English</option>
                <option value="zh">🇨🇳 中文</option>
              </select>
            </div>

            <div style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '20px', background: '#f8f9fa' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{previewItem.name}</h3>
              <div style={{ fontSize: '18px', color: '#667eea', fontWeight: 600, marginBottom: '12px' }}>
                ¥{previewItem.price.toLocaleString()}
              </div>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>{previewItem.description}</p>
              <div style={{ fontSize: '13px', color: '#888' }}>
                <strong>カテゴリ:</strong> {previewItem.category}
              </div>
              {previewItem.ingredients && previewItem.ingredients.length > 0 && (
                <div style={{ fontSize: '13px', color: '#888', marginTop: '8px' }}>
                  <strong>原材料:</strong> {previewItem.ingredients.map(ing => ing.name).join(', ')}
                </div>
              )}
            </div>

            <div className="alert-info" style={{ marginTop: '20px' }}>
              <strong>⚠️ 問題点の検出:</strong>
              <ul style={{ marginTop: '10px', paddingLeft: '20px', fontSize: '13px' }}>
                {!previewItem.description && <li>説明文が未設定です</li>}
                {(!previewItem.ingredients || previewItem.ingredients.length === 0) && <li>原材料が未設定です</li>}
                {!previewItem.status && <li>アレルゲン情報の確認が必要です</li>}
              </ul>
            </div>

            <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => { setShowPreviewModal(false); handleEdit(previewItem); }}>
              ✏️ この内容を編集
            </button>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {showEditModal && editItem && (
        <div className="modal active">
          <div className="modal-content">
            <button className="modal-close" onClick={() => { setShowEditModal(false); setEditItem(null); setEditIngredientsText(''); }}>×</button>
            <div className="modal-title">📝 メニュー編集</div>

            <div className="tab-nav">
              <button className={`tab-nav-btn ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>📝 基本情報</button>
              <button className={`tab-nav-btn ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>🥕 原材料</button>
              <button className={`tab-nav-btn ${activeTab === 'allergens' ? 'active' : ''}`} onClick={() => setActiveTab('allergens')}>⚠️ アレルギー</button>
            </div>

            {activeTab === 'basic' && (
              <div className="tab-content">
                <div className="form-group">
                  <label className="form-label">料理名（日本語）*</label>
                  <input type="text" className="form-input" value={editItem.name} onChange={(e) => setEditItem({...editItem, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">料理名（英語）</label>
                  <input type="text" className="form-input" value={editItem.nameEn || ''} onChange={(e) => setEditItem({...editItem, nameEn: e.target.value})} />
                  <button className="btn ai-btn btn-small" style={{ marginTop: '5px' }}>🤖 AI自動翻訳</button>
                </div>
                <div className="form-group">
                  <label className="form-label">価格 *</label>
                  <input type="number" className="form-input" value={editItem.price} onChange={(e) => setEditItem({...editItem, price: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">カテゴリー *</label>
                  <select className="form-input" value={editItem.category} onChange={(e) => setEditItem({...editItem, category: e.target.value})}>
                    <option value="">選択してください</option>
                    <option value="ご飯もの">ご飯もの</option>
                    <option value="刺身">刺身</option>
                    <option value="焼き物">焼き物</option>
                    <option value="揚げ物">揚げ物</option>
                    <option value="コース">コース</option>
                    <option value="ドリンク">ドリンク</option>
                    <option value="そば">そば</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">料理の説明</label>
                  <textarea className="form-input" value={editItem.description || ''} onChange={(e) => setEditItem({...editItem, description: e.target.value})} />
                  <button className="btn ai-btn btn-small" style={{ marginTop: '5px' }}>🤖 AI生成</button>
                </div>
                <button className="btn btn-primary" onClick={() => setActiveTab('materials')}>次へ: 原材料設定 →</button>
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="tab-content">
                <div className="form-group">
                  <label className="form-label">原材料（カンマ区切りで入力）</label>
                  <button className="btn ai-btn btn-small" style={{ marginBottom: '12px' }}>🤖 AI推察</button>
                  <textarea 
                    className="form-input" 
                    value={editIngredientsText} 
                    onChange={(e) => setEditIngredientsText(e.target.value)}
                    placeholder="例: 鶏肉, 玉ねぎ, にんじん"
                    rows={3}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    ※ 複数の原材料はカンマ（,）で区切って入力してください
                  </div>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                  <button className="btn btn-primary" onClick={() => setActiveTab('allergens')}>次へ: アレルギー設定 →</button>
                </div>
              </div>
            )}

            {activeTab === 'allergens' && (
              <div className="tab-content">
                <div className="form-group">
                  <label className="form-label">⚠️ アレルゲン情報</label>
                  {allergens && allergens.mandatory && allergens.mandatory.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <strong>特定原材料（表示義務）:</strong>
                      <div className="checkbox-group">
                        {allergens.mandatory.map(allergen => (
                          <label key={allergen.uid} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={editSelectedAllergenUids.includes(allergen.uid)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditSelectedAllergenUids([...editSelectedAllergenUids, allergen.uid])
                                } else {
                                  setEditSelectedAllergenUids(editSelectedAllergenUids.filter(uid => uid !== allergen.uid))
                                }
                              }}
                            /> {allergen.name_jp} ({allergen.name_en})
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {allergens && allergens.recommended && allergens.recommended.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <strong>推奨表示アレルゲン:</strong>
                      <div className="checkbox-group">
                        {allergens.recommended.map(allergen => (
                          <label key={allergen.uid} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={editSelectedAllergenUids.includes(allergen.uid)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditSelectedAllergenUids([...editSelectedAllergenUids, allergen.uid])
                                } else {
                                  setEditSelectedAllergenUids(editSelectedAllergenUids.filter(uid => uid !== allergen.uid))
                                }
                              }}
                            /> {allergen.name_jp} ({allergen.name_en})
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* DEBUG: Always show recommended section in edit modal */}
                  {allergens && (
                    <div style={{ marginBottom: '20px', border: '2px solid blue', padding: '10px' }}>
                      <strong>DEBUG - Edit Modal Recommended Allergens:</strong>
                      <div>Has allergens object: {allergens ? 'YES' : 'NO'}</div>
                      <div>Has recommended property: {allergens.recommended ? 'YES' : 'NO'}</div>
                      <div>Recommended length: {allergens.recommended ? allergens.recommended.length : 'N/A'}</div>
                    </div>
                  )}
                  {(!allergens || (!allergens.mandatory?.length && !allergens.recommended?.length)) && (
                    <div style={{ color: '#666', fontStyle: 'italic' }}>
                      アレルゲン情報が読み込めませんでした。後で再試行してください。
                    </div>
                  )}
                </div>

                {/* Status toggle */}
                <div className="form-group" style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>📋 確認ステータス</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="button"
                      onClick={() => setEditItem({...editItem, status: true})}
                      style={{ 
                        padding: '10px 20px', 
                        borderRadius: '6px', 
                        border: editItem.status ? '2px solid #10b981' : '1px solid #d1d5db',
                        background: editItem.status ? '#d1fae5' : 'white',
                        color: editItem.status ? '#059669' : '#6b7280',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      ✓ 確認済み
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditItem({...editItem, status: false})}
                      style={{ 
                        padding: '10px 20px', 
                        borderRadius: '6px', 
                        border: !editItem.status ? '2px solid #f59e0b' : '1px solid #d1d5db',
                        background: !editItem.status ? '#fef3c7' : 'white',
                        color: !editItem.status ? '#d97706' : '#6b7280',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      ⚠️ 要確認
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    ※ 「確認済み」に設定すると、メニューが検証済みとしてマークされます
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button className="btn btn-secondary" onClick={() => { setShowEditModal(false); setEditItem(null); setEditIngredientsText(''); }}>キャンセル</button>
                  <button className="btn btn-primary" onClick={handleSaveEdit}>💾 保存</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* アップロードカード */}
      <div className="card" style={{ marginTop: '8px' }}>
        <div className="card-title">📤 メニュー・商品をアップロード</div>
        <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>複数の方法から最も簡単な方法を選んでください</p>

        <div className="upload-grid">
          <button className="upload-btn">
            <div className="upload-icon">📷</div>
            カメラ記録
          </button>
          <button className="upload-btn">
            <div className="upload-icon">📄</div>
            ファイル選択
          </button>
          <button className="upload-btn">
            <div className="upload-icon">📝</div>
            テキスト貼り付け
          </button>
          <button className="upload-btn">
            <div className="upload-icon">☁️</div>
            Googleドライブ
          </button>
        </div>
      </div>

      <style jsx>{`
        .card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1a1a1a;
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
          background: linear-gradient(135deg, #1d4ed8, #6d28d9);
        }

        .btn-small {
          padding: 4px 8px;
          font-size: 12px;
          background: #f3f4f6;
          color: #374151;
        }

        .btn-small:hover {
          background: #e5e7eb;
        }

        .btn-danger {
          background: #fee2e2;
          color: #dc2626;
        }

        .btn-danger:hover {
          background: #fecaca;
        }

        .filter-btn {
          padding: 6px 12px;
          font-size: 13px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: #e5e7eb;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .menu-table-container {
          overflow-x: auto;
          margin-bottom: 16px;
        }

        .menu-table {
          width: 100%;
          border-collapse: collapse;
        }

        .menu-table th,
        .menu-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .menu-table th {
          background: #f9fafb;
          font-weight: 600;
          font-size: 13px;
          color: #374151;
        }

        .menu-table tr:hover {
          background: #f9fafb;
        }

        .btn-action {
          padding: 3px 6px;
          font-size: 10px;
          font-weight: 700;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid;
        }

        .btn-preview {
          color: white;
          background: #007bff;
          border-color: #007bff;
        }

        .btn-preview:hover {
          background: #0056b3;
          border-color: #0056b3;
        }

        .btn-edit {
          color: #6c757d;
          background: white;
          border-color: #6c757d;
        }

        .btn-edit:hover {
          background: #f8f9fa;
        }

        .btn-delete {
          color: #dc3545;
          background: white;
          border-color: #dc3545;
        }

        .btn-delete:hover {
          background: #fff5f5;
        }

        .status-badge {
          padding: 3px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 500;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.verified {
          background: #d1fae5;
          color: #059669;
        }

        .status-badge.warning {
          background: #fef3c7;
          color: #d97706;
        }

        .upload-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .upload-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: #f9fafb;
          border: 2px dashed #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          color: #374151;
        }

        .upload-btn:hover {
          border-color: #667eea;
          background: #f0f4ff;
        }

        .upload-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        @media (max-width: 768px) {
          .upload-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

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
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        }

        .modal-close:hover {
          color: #333;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0;
        }

        .tab-nav-btn {
          padding: 10px 16px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab-nav-btn:hover {
          color: #333;
        }

        .tab-nav-btn.active {
          color: #667eea;
          border-bottom-color: #667eea;
          font-weight: 600;
        }

        .tab-content {
          padding: 16px 0;
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

        .btn-secondary {
          background: white;
          color: #374151;
          border: 1px solid #e5e7eb;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        .ai-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
        }

        .ai-btn:hover {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        }

        .alert-info {
          background: #e0f2fe;
          color: #0369a1;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .checkbox-group {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
          margin-top: 12px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .checkbox-item input {
          cursor: pointer;
        }

        .progress-bar-container {
          height: 12px;
          background: #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
          margin-top: 16px;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          width: 0%;
          animation: progress 2s ease-in-out forwards;
        }

        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </AdminLayout>
  )
}
