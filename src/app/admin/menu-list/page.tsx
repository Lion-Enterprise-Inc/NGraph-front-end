'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AdminLayout from '../../../components/admin/AdminLayout'
import { useToast } from '../../../components/admin/Toast'
import { MenuApi, Menu, MenuCreate, MenuUpdate, Ingredient, AllergenApi, Allergen, AllergenListResponse, ScrapingApi, apiClient, CookingMethodApi, RestrictionApi, CookingMethod, Restriction, VisionApi, VisionMenuItem, DISH_CATEGORIES, VerificationApi, VerificationQuestion } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'
import MenuTable from './MenuTable'
import MenuFormModal from './MenuFormModal'
import UploadSection from './UploadSection'
import PreviewModal from './PreviewModal'

export interface MenuItem {
  uid: string
  name: string
  nameEn: string | null
  category: string
  price: number
  status: boolean
  ingredients: Ingredient[]
  description: string | null
  descriptionEn: string | null
  allergens: Allergen[]
  cookingMethods: CookingMethod[]
  restrictions: Restriction[]
  confidenceScore: number
  dataSource: string | null
  narrative: Record<string, any> | null
  serving: Record<string, any> | null
  priceDetail: Record<string, any> | null
}

export default function MenuListPage() {
  return (
    <Suspense fallback={<AdminLayout title="メニュー一覧"><div style={{ textAlign: 'center', padding: '40px' }}>読み込み中...</div></AdminLayout>}>
      <MenuListContent />
    </Suspense>
  )
}

function MenuListContent() {
  const toast = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const uidParam = searchParams?.get('uid') ?? null
  const isAdminViewing = !!(uidParam && user && (user.role === 'superadmin' || user.role === 'platform_owner'))
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [itemsPerPage, setItemsPerPage] = useState(30)
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
    descriptionEn: '',
    ingredients: '',
    narrative: { story: '', chef_note: '', tasting_note: '', pairing_suggestion: '', seasonal_note: '' } as Record<string, string>,
    serving: { size: '', availability: '' } as Record<string, string>,
    priceDetail: { currency: 'JPY', tax_included: true, tax_rate: 10 } as Record<string, any>
  })

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [restaurant, setRestaurant] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editIngredientsText, setEditIngredientsText] = useState('')
  const [allergens, setAllergens] = useState<{ mandatory: Allergen[]; recommended: Allergen[] }>({ mandatory: [], recommended: [] })
  const [selectedAllergenUids, setSelectedAllergenUids] = useState<string[]>([])
  const [scrapingTaskId, setScrapingTaskId] = useState<string | null>(null)
  const [scrapingUrl, setScrapingUrl] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [editSelectedAllergenUids, setEditSelectedAllergenUids] = useState<string[]>([])
  const [cookingMethods, setCookingMethods] = useState<CookingMethod[]>([])
  const [restrictions, setRestrictions] = useState<Restriction[]>([])
  const [selectedCookingMethodUids, setSelectedCookingMethodUids] = useState<string[]>([])
  const [selectedRestrictionUids, setSelectedRestrictionUids] = useState<string[]>([])
  const [editSelectedCookingMethodUids, setEditSelectedCookingMethodUids] = useState<string[]>([])
  const [editSelectedRestrictionUids, setEditSelectedRestrictionUids] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [visionResults, setVisionResults] = useState<VisionMenuItem[]>([])
  const [showVisionApproval, setShowVisionApproval] = useState(false)
  const [showTextModal, setShowTextModal] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [verificationQueue, setVerificationQueue] = useState<VerificationQuestion[]>([])
  const [avgConfidence, setAvgConfidence] = useState<number | null>(null)
  const [verifyingField, setVerifyingField] = useState<string | null>(null)
  const [correctingItem, setCorrectingItem] = useState<{ menu_uid: string; field: string } | null>(null)
  const [correctionText, setCorrectionText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleCameraCapture = () => {
    cameraInputRef.current?.click()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const restaurantSlug = restaurant?.slug || restaurant?.name?.toLowerCase().replace(/\s+/g, '-') || ''

    setIsAnalyzing(true)
    try {
      const response = await VisionApi.analyzeImage(file, restaurantSlug, false)
      const items = response.result?.items || []
      if (items.length === 0) {
        toast('warning', 'メニューを検出できませんでした。別のファイルを試してください。')
        return
      }
      setVisionResults(items)
      setShowVisionApproval(true)
    } catch (err) {
      console.error('File analysis failed:', err)
      toast('error', `ファイル解析に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsAnalyzing(false)
      e.target.value = ''
    }
  }

  const handleTextAnalyze = async () => {
    if (!pasteText.trim()) {
      toast('warning', 'テキストを入力してください')
      return
    }

    setShowTextModal(false)
    setIsAnalyzing(true)
    try {
      const response = await VisionApi.analyzeText(pasteText.trim())
      const items = response.result?.items || []
      if (items.length === 0) {
        toast('warning', 'メニューを検出できませんでした。別のテキストを試してください。')
        return
      }
      setVisionResults(items)
      setShowVisionApproval(true)
      setPasteText('')
    } catch (err) {
      console.error('Text analysis failed:', err)
      toast('error', `テキスト解析に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const mapAllergenNamesToUids = (allergenNames: string[]): string[] => {
    if (!allergenNames || allergenNames.length === 0) return []
    const allAllergens = [...(allergens.mandatory || []), ...(allergens.recommended || [])]
    const uids: string[] = []
    for (const name of allergenNames) {
      const nameLower = name.toLowerCase()
      const match = allAllergens.find(a => a.name_en.toLowerCase() === nameLower)
      if (match) uids.push(match.uid)
    }
    return uids
  }

  const buildMenuDataFromVision = (item: VisionMenuItem): MenuCreate => {
    const allergenUids = mapAllergenNamesToUids(item.allergens || [])
    return {
      name_jp: item.name_jp,
      name_en: item.name_en || null,
      category: item.category || '未分類',
      price: item.price || 0,
      description: item.description || null,
      restaurant_uid: restaurant!.uid,
      ingredients: item.ingredients || [],
      allergen_uids: allergenUids.length > 0 ? allergenUids : null,
      status: false,
      data_source: 'ai_inferred'
    }
  }

  const handleApproveVisionItem = async (index: number) => {
    const item = visionResults[index]
    if (!item || !restaurant?.uid) return

    try {
      await MenuApi.create(buildMenuDataFromVision(item))
      await refreshMenus()
      setVisionResults(visionResults.filter((_, i) => i !== index))
    } catch (err) {
      console.error('Failed to save menu:', err)
      toast('error', 'メニューの保存に失敗しました')
    }
  }

  const handleApproveAllVision = async () => {
    if (!restaurant?.uid) return

    try {
      for (const item of visionResults) {
        await MenuApi.create(buildMenuDataFromVision(item))
      }
      await refreshMenus()
      setVisionResults([])
      setShowVisionApproval(false)
      toast('success', `${visionResults.length}件のメニューを追加しました！`)
    } catch (err) {
      console.error('Failed to save menus:', err)
      toast('error', 'メニューの保存に失敗しました')
    }
  }

  const fetchData = useCallback(async (page: number = 1) => {
    if (authLoading || !user?.uid) {
      return
    }

    try {
      setIsLoading(true)
      setError('')

      let restaurantData: any
      if (isAdminViewing && uidParam) {
        const restaurantResponse = await apiClient.get(`/restaurants/${uidParam}`) as { result: any }
        restaurantData = restaurantResponse.result
      } else {
        const restaurantResponse = await apiClient.get(`/restaurants/detail-by-user/${user.uid}`) as { result: any }
        restaurantData = restaurantResponse.result
      }
      setRestaurant(restaurantData)
      setScrapingUrl(localStorage.getItem(`menu_scraping_url_${restaurantData.uid}`) || '')

      if (restaurantData?.uid) {
        try {
          const menusResponse = await MenuApi.getAll(restaurantData.uid, page, itemsPerPage)
          const items = menusResponse.result?.items || []
          const total = menusResponse.result?.total || 0

          setTotalItems(total)
          setTotalPages(Math.ceil(total / itemsPerPage))

          const menus = items.map((menu: Menu) => ({
            uid: menu.uid,
            name: menu.name_jp,
            nameEn: menu.name_en,
            category: menu.category,
            price: menu.price,
            status: menu.status,
            ingredients: menu.ingredients || [],
            description: menu.description,
            descriptionEn: menu.description_en || null,
            allergens: menu.allergens || [],
            cookingMethods: menu.cooking_methods || [],
            restrictions: menu.restrictions || [],
            confidenceScore: menu.confidence_score || 0,
            dataSource: menu.data_source || null,
            narrative: menu.narrative || null,
            serving: menu.serving || null,
            priceDetail: menu.price_detail || null
          }))
          setMenuItems(menus)
        } catch (menuErr) {
          setMenuItems([])
          setTotalItems(0)
          setTotalPages(1)
        }

        try {
          const allergensResponse = await AllergenApi.getAll()
          let allMandatory: Allergen[] = []
          let allRecommended: Allergen[] = []

          if (Array.isArray(allergensResponse.result)) {
            allergensResponse.result.forEach((item) => {
              if (item.mandatory) {
                allMandatory = [...allMandatory, ...item.mandatory]
              }
              if (item.recommended) {
                allRecommended = [...allRecommended, ...item.recommended]
              }
            })
          }

          const transformedAllergens = {
            mandatory: allMandatory,
            recommended: allRecommended
          }
          setAllergens(transformedAllergens)
        } catch (allergenErr) {
          setAllergens({ mandatory: [], recommended: [] })
        }

        try {
          const cmResponse = await CookingMethodApi.getAll()
          setCookingMethods(cmResponse.result || [])
        } catch (e) {
        }

        try {
          const rResponse = await RestrictionApi.getAll()
          setRestrictions(rResponse.result || [])
        } catch (e) {
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch restaurant data:', err)
      setError('レストラン情報の取得に失敗しました。')
    } finally {
      setIsLoading(false)
    }
  }, [authLoading, user, itemsPerPage, isAdminViewing, uidParam])

  useEffect(() => {
    fetchData(currentPage)
  }, [fetchData, currentPage])

  useEffect(() => {
    if (!restaurant?.uid) return
    const fetchVerification = async () => {
      try {
        const res = await VerificationApi.getQueue(restaurant.uid)
        setVerificationQueue(res.result || [])
      } catch { setVerificationQueue([]) }
      try {
        const menuRes = await apiClient.get(`/menus/?restaurant_uid=${restaurant.uid}&page=1&size=200`) as any
        const items = menuRes.result?.items || []
        if (items.length > 0) {
          const total = items.reduce((s: number, m: any) => s + (m.confidence_score || 0), 0)
          setAvgConfidence(Math.round(total / items.length))
        }
      } catch { /* ignore */ }
    }
    fetchVerification()
  }, [restaurant?.uid])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

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

  const refreshMenus = async () => {
    if (!restaurant?.uid) return
    try {
      await fetchData(currentPage)
    } catch (err) {
      console.error('Failed to refresh menus:', err)
      setMenuItems([])
    }
  }

  const handleAddMenu = async () => {
    if (!newMenu.name || !newMenu.price || !newMenu.category) {
      toast('warning', '料理名、価格、カテゴリーは必須です')
      return
    }
    if (!restaurant?.uid) {
      toast('error', 'レストラン情報が見つかりません')
      return
    }

    setIsSaving(true)
    try {
      const ingredientsArray = newMenu.ingredients
        ? newMenu.ingredients.split(',').map(s => s.trim()).filter(Boolean)
        : []

      const narrativeData = Object.fromEntries(Object.entries(newMenu.narrative).filter(([, v]) => v))
      const servingData = Object.fromEntries(Object.entries(newMenu.serving).filter(([, v]) => v))
      const priceDetailData = { ...newMenu.priceDetail }

      const menuData: MenuCreate = {
        name_jp: newMenu.name,
        name_en: newMenu.nameEn || null,
        category: newMenu.category,
        price: Number(newMenu.price),
        description: newMenu.description || null,
        description_en: newMenu.descriptionEn || null,
        restaurant_uid: restaurant.uid,
        ingredients: ingredientsArray,
        allergen_uids: selectedAllergenUids.length > 0 ? selectedAllergenUids : null,
        cooking_method_uids: selectedCookingMethodUids.length > 0 ? selectedCookingMethodUids : null,
        restriction_uids: selectedRestrictionUids.length > 0 ? selectedRestrictionUids : null,
        status: false,
        narrative: Object.keys(narrativeData).length > 0 ? narrativeData : null,
        serving: Object.keys(servingData).length > 0 ? servingData : null,
        price_detail: Object.keys(priceDetailData).length > 0 ? priceDetailData : null
      }

      await MenuApi.create(menuData)
      await refreshMenus()

      setNewMenu({ name: '', nameEn: '', price: '', category: '', description: '', descriptionEn: '', ingredients: '', narrative: { story: '', chef_note: '', tasting_note: '', pairing_suggestion: '', seasonal_note: '' }, serving: { size: '', availability: '' }, priceDetail: { currency: 'JPY', tax_included: true, tax_rate: 10 } })
      setSelectedAllergenUids([])
      setSelectedCookingMethodUids([])
      setSelectedRestrictionUids([])
      setShowAddModal(false)
      setActiveTab('basic')
      toast('success', 'メニューを追加しました！')
    } catch (err) {
      console.error('Failed to add menu:', err)
      toast('error', `メニューの追加に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFetchFromSource = async () => {
    if (!restaurant?.uid) {
      toast('error', 'レストラン情報が見つかりません')
      return
    }

    if (!scrapingUrl) {
      toast('warning', 'メニュー情報ソースURLが設定されていません。基本情報→情報ソースタブでURLを設定してください。')
      return
    }

    try {
      setShowFetchModal(true)
      setError('')

      const restaurantIdentifier = restaurant.slug || restaurant.name?.toLowerCase().replace(/\s+/g, '-') || 'restaurant'

      const scrapingResponse = await ScrapingApi.scrapeMenu(restaurantIdentifier, { url: scrapingUrl })
      const taskId = scrapingResponse.result.task_id
      setScrapingTaskId(taskId)

      pollTaskStatus(taskId)
    } catch (err) {
      console.error('Failed to start scraping:', err)
      setShowFetchModal(false)
      toast('error', 'スクレイピングの開始に失敗しました')
    }
  }

  const pollTaskStatus = async (taskId: string) => {
    try {
      const statusResponse = await ScrapingApi.getTaskStatus(taskId)
      const task = statusResponse.result

      if (task.status === 'completed' && task.result) {
        const scrapedMenus = task.result.menus.map((menu: any, index: number) => ({
          id: index + 1,
          name: menu.name,
          price: menu.price,
          category: menu.category,
          confidence: menu.confidence
        }))

        setPendingMenus(scrapedMenus)
        setShowFetchModal(false)
        setShowApprovalModal(true)
        setScrapingTaskId(null)
      } else if (task.status === 'failed') {
        setShowFetchModal(false)
        setError(task.error || 'スクレイピングに失敗しました')
        setScrapingTaskId(null)
      } else {
        setTimeout(() => pollTaskStatus(taskId), 2000)
      }
    } catch (err) {
      console.error('Failed to check task status:', err)
      setShowFetchModal(false)
      setScrapingTaskId(null)
      setError('タスクステータスの確認に失敗しました。再度お試しください。')
    }
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
        toast('error', 'メニューの承認に失敗しました')
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
      toast('success', 'すべてのメニューを承認しました！')
    } catch (err) {
      console.error('Failed to approve all menus:', err)
      toast('error', 'メニューの承認に失敗しました')
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
    setEditIngredientsText(item.ingredients?.map(ing => ing.name).join(', ') || '')
    setEditSelectedAllergenUids(item.allergens?.map(allergen => allergen.uid) || [])
    setEditSelectedCookingMethodUids(item.cookingMethods?.map(cm => cm.uid) || [])
    setEditSelectedRestrictionUids(item.restrictions?.map(r => r.uid) || [])
    setShowEditModal(true)
    setActiveTab('basic')
  }

  const handleSaveEdit = async () => {
    if (!editItem) return

    setIsSaving(true)
    try {
      const ingredientNames = editIngredientsText
        ? editIngredientsText.split(',').map(s => s.trim()).filter(Boolean)
        : []

      const updateData: MenuUpdate = {
        name_jp: editItem.name,
        name_en: editItem.nameEn,
        category: editItem.category,
        price: editItem.price,
        description: editItem.description,
        description_en: editItem.descriptionEn,
        ingredients: ingredientNames,
        allergen_uids: editSelectedAllergenUids.length > 0 ? editSelectedAllergenUids : null,
        cooking_method_uids: editSelectedCookingMethodUids.length > 0 ? editSelectedCookingMethodUids : null,
        restriction_uids: editSelectedRestrictionUids.length > 0 ? editSelectedRestrictionUids : null,
        status: editItem.status,
        narrative: editItem.narrative,
        serving: editItem.serving,
        price_detail: editItem.priceDetail
      }

      await MenuApi.update(editItem.uid, updateData)
      await refreshMenus()

      setShowEditModal(false)
      setEditItem(null)
      setEditIngredientsText('')
      setEditSelectedAllergenUids([])
      setEditSelectedCookingMethodUids([])
      setEditSelectedRestrictionUids([])
      toast('success', 'メニューを更新しました！')
    } catch (err) {
      console.error('Failed to update menu:', err)
      toast('error', `メニューの更新に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleApprove = async (item: MenuItem) => {
    try {
      await MenuApi.update(item.uid, { status: true })
      await refreshMenus()
    } catch (err) {
      console.error('Failed to approve menu:', err)
      toast('error', '承認に失敗しました')
    }
  }

  const handleBulkApprove = async () => {
    const unverified = menuItems.filter(i => !i.status)
    if (unverified.length === 0) {
      toast('info', '承認待ちのメニューはありません')
      return
    }
    if (!confirm(`${unverified.length}件の未承認メニューをすべて承認しますか？`)) return

    try {
      for (const item of unverified) {
        await MenuApi.update(item.uid, { status: true })
      }
      await refreshMenus()
      toast('success', `${unverified.length}件を承認しました`)
    } catch (err) {
      console.error('Failed to bulk approve:', err)
      toast('error', '一括承認に失敗しました')
    }
  }

  const handleDelete = async (uid: string) => {
    if (!confirm('このメニューを削除しますか？')) return

    try {
      await MenuApi.delete(uid)
      await refreshMenus()
      toast('success', 'メニューを削除しました')
    } catch (err) {
      console.error('Failed to delete menu:', err)
      toast('error', `メニューの削除に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <AdminLayout title="メニュー一覧">
      {avgConfidence !== null && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>データ完成度</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: avgConfidence >= 80 ? '#10B981' : avgConfidence >= 50 ? '#F59E0B' : '#EF4444' }}>{avgConfidence}%</span>
          </div>
          <div style={{ height: 12, background: '#1E293B', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${avgConfidence}%`, background: avgConfidence >= 80 ? '#10B981' : avgConfidence >= 50 ? '#F59E0B' : '#EF4444', borderRadius: 6, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}

      {verificationQueue.length > 0 && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>データ確認キュー</span>
            <span style={{ fontSize: 13, color: '#94A3B8', background: '#1E293B', padding: '4px 12px', borderRadius: 12 }}>残り{verificationQueue.length}件</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {verificationQueue.map((q, idx) => (
              <div key={`${q.menu_uid}-${q.field}-${idx}`} style={{ padding: 16, background: '#1E293B', borderRadius: 8, border: '1px solid #334155' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC', marginBottom: 8 }}>{q.question}</div>
                {q.current_value && (Array.isArray(q.current_value) ? q.current_value.length > 0 : q.current_value) && (
                  <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>
                    現在: {Array.isArray(q.current_value) ? q.current_value.join(', ') : String(q.current_value)}
                  </div>
                )}
                {correctingItem?.menu_uid === q.menu_uid && correctingItem?.field === q.field ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" value={correctionText} onChange={e => setCorrectionText(e.target.value)} placeholder="正しい値を入力"
                      style={{ flex: 1, padding: '8px 12px', background: '#0F172A', border: '1px solid #475569', borderRadius: 6, color: '#F8FAFC', fontSize: 14 }} />
                    <button disabled={verifyingField === q.field} onClick={async () => {
                      setVerifyingField(q.field)
                      try {
                        let val: any = correctionText
                        if (q.field === 'ingredients' || q.field === 'allergens') val = correctionText.split(',').map((s: string) => s.trim()).filter(Boolean)
                        await VerificationApi.verify({ menu_uid: q.menu_uid, field: q.field, action: 'correct', corrected_value: val })
                        setVerificationQueue(prev => prev.filter(item => !(item.menu_uid === q.menu_uid && item.field === q.field)))
                        setCorrectingItem(null); setCorrectionText('')
                        refreshMenus()
                      } catch (e) { console.error(e) }
                      setVerifyingField(null)
                    }} style={{ padding: '8px 16px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>送信</button>
                    <button onClick={() => { setCorrectingItem(null); setCorrectionText('') }}
                      style={{ padding: '8px 12px', background: 'transparent', color: '#94A3B8', border: '1px solid #475569', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>取消</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button disabled={verifyingField === q.field} onClick={async () => {
                      setVerifyingField(q.field)
                      try {
                        await VerificationApi.verify({ menu_uid: q.menu_uid, field: q.field, action: 'confirm' })
                        setVerificationQueue(prev => prev.filter(item => !(item.menu_uid === q.menu_uid && item.field === q.field)))
                        refreshMenus()
                      } catch (e) { console.error(e) }
                      setVerifyingField(null)
                    }} style={{ padding: '8px 20px', background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>はい</button>
                    <button onClick={() => { setCorrectingItem({ menu_uid: q.menu_uid, field: q.field }); setCorrectionText(Array.isArray(q.current_value) ? q.current_value.join(', ') : String(q.current_value || '')) }}
                      style={{ padding: '8px 20px', background: 'transparent', color: '#F59E0B', border: '1px solid #F59E0B', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>修正する</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">📋 メニュー・商品管理</div>

        <MenuTable
          items={filteredItems}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          totalPages={totalPages}
          searchQuery={searchQuery}
          filter={filter}
          countAll={countAll}
          countVerified={countVerified}
          countWarning={countWarning}
          isLoading={isLoading}
          error={error}
          onSearchChange={setSearchQuery}
          onFilterChange={setFilter}
          onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
          onPageChange={handlePageChange}
          onPreview={handlePreview}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onApprove={handleApprove}
          onBulkApprove={handleBulkApprove}
          onAddNew={() => setShowAddModal(true)}
          onFetchFromSource={handleFetchFromSource}
        />
      </div>

      <MenuFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="add"
        newMenu={newMenu}
        onNewMenuChange={setNewMenu}
        selectedAllergenUids={selectedAllergenUids}
        onAllergenChange={setSelectedAllergenUids}
        selectedCookingMethodUids={selectedCookingMethodUids}
        onCookingMethodChange={setSelectedCookingMethodUids}
        selectedRestrictionUids={selectedRestrictionUids}
        onRestrictionChange={setSelectedRestrictionUids}
        editItem={null}
        onEditItemChange={() => {}}
        editIngredientsText=""
        onEditIngredientsTextChange={() => {}}
        editSelectedAllergenUids={[]}
        onEditAllergenChange={() => {}}
        editSelectedCookingMethodUids={[]}
        onEditCookingMethodChange={() => {}}
        editSelectedRestrictionUids={[]}
        onEditRestrictionChange={() => {}}
        allergens={allergens}
        cookingMethods={cookingMethods}
        restrictions={restrictions}
        isSaving={isSaving}
        onSave={handleAddMenu}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <MenuFormModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditItem(null); setEditIngredientsText(''); }}
        mode="edit"
        newMenu={newMenu}
        onNewMenuChange={setNewMenu}
        selectedAllergenUids={selectedAllergenUids}
        onAllergenChange={setSelectedAllergenUids}
        selectedCookingMethodUids={selectedCookingMethodUids}
        onCookingMethodChange={setSelectedCookingMethodUids}
        selectedRestrictionUids={selectedRestrictionUids}
        onRestrictionChange={setSelectedRestrictionUids}
        editItem={editItem}
        onEditItemChange={setEditItem}
        editIngredientsText={editIngredientsText}
        onEditIngredientsTextChange={setEditIngredientsText}
        editSelectedAllergenUids={editSelectedAllergenUids}
        onEditAllergenChange={setEditSelectedAllergenUids}
        editSelectedCookingMethodUids={editSelectedCookingMethodUids}
        onEditCookingMethodChange={setEditSelectedCookingMethodUids}
        editSelectedRestrictionUids={editSelectedRestrictionUids}
        onEditRestrictionChange={setEditSelectedRestrictionUids}
        allergens={allergens}
        cookingMethods={cookingMethods}
        restrictions={restrictions}
        isSaving={isSaving}
        onSave={handleSaveEdit}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        item={previewItem}
        onEdit={handleEdit}
      />

      <UploadSection
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        onFileSelect={handleFileSelect}
        onCameraCapture={handleCameraCapture}
        onFileUpload={handleFileUpload}
        onShowTextModal={() => setShowTextModal(true)}
        showTextModal={showTextModal}
        pasteText={pasteText}
        onPasteTextChange={setPasteText}
        onTextAnalyze={handleTextAnalyze}
        onCloseTextModal={() => { setShowTextModal(false); setPasteText(''); }}
        isAnalyzing={isAnalyzing}
        showVisionApproval={showVisionApproval}
        visionResults={visionResults}
        onApproveVisionItem={handleApproveVisionItem}
        onApproveAllVision={handleApproveAllVision}
        onCloseVisionApproval={() => { setShowVisionApproval(false); setVisionResults([]); }}
        onRemoveVisionItem={(index) => setVisionResults(visionResults.filter((_, i) => i !== index))}
        showApprovalModal={showApprovalModal}
        pendingMenus={pendingMenus}
        scrapingUrl={scrapingUrl}
        onApproveMenu={handleApproveMenu}
        onDenyMenu={handleDenyMenu}
        onApproveAll={handleApproveAll}
        onDenyAll={handleDenyAll}
        onCloseApprovalModal={() => setShowApprovalModal(false)}
        showFetchModal={showFetchModal}
      />

      <style jsx>{`
        .card {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
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
          background: linear-gradient(135deg, #1d4ed8, #6d28d9);
        }
      `}</style>
    </AdminLayout>
  )
}
