'use client'

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AdminLayout from '../../../components/admin/AdminLayout'
import { useToast } from '../../../components/admin/Toast'
import { MenuApi, Menu, MenuCreate, MenuUpdate, Ingredient, AllergenApi, Allergen, AllergenListResponse, ScrapingApi, apiClient, CookingMethodApi, RestrictionApi, CookingMethod, Restriction, VisionApi, VisionMenuItem, DISH_CATEGORIES, UserRestaurant } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'
import MenuTable from './MenuTable'
import MenuFormModal from './MenuFormModal'
import UploadSection from './UploadSection'
import PreviewModal from './PreviewModal'
import MenuAnalyticsSection from '../menu-analytics/MenuAnalyticsSection'
import { downscaleImage } from '../../../utils/image'
import { useAdminLang } from '../../../hooks/useAdminLang'

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
  verificationRank: string | null
  dataSource: string | null
  narrative: Record<string, any> | null
  serving: Record<string, any> | null
  drinkMeta: Record<string, any> | null
  priceDetail: Record<string, any> | null
  tasteProfiles: Array<{ uid: string; name_jp: string }> | null
  imageUrl: string | null
  productUrl: string | null
  featuredTags: string[] | null
  createdAt: string | null
  verifiedAt: string | null
  verifiedBy: string | null
}

export default function MenuListPage() {
  return (
    <Suspense fallback={<MenuListFallback />}>
      <MenuListContent />
    </Suspense>
  )
}

function MenuListFallback() {
  const { t } = useAdminLang()
  return (
    <AdminLayout title={t.nav.menuList}>
      <div style={{ textAlign: 'center', padding: '40px' }}>{t.layout.loading}</div>
    </AdminLayout>
  )
}

function MenuListContent() {
  const toast = useToast()
  const { t } = useAdminLang()
  const { user, isLoading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const uidParam = searchParams?.get('uid') ?? null
  const isAdminViewing = !!(uidParam && user && (user.role === 'superadmin' || user.role === 'platform_owner'))
  const userRestaurants = useMemo(() => user?.restaurants || [], [user?.restaurants])
  const hasMultipleStores = userRestaurants.length > 1
  const [selectedStoreUid, setSelectedStoreUid] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('selectedStoreUid')
    }
    return null
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('verified')
  const [sortKey, setSortKey] = useState('default')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [itemsPerPage, setItemsPerPage] = useState(30)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFetchModal, setShowFetchModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  // ページ上部の表示切替: メニュー一覧 / 分析(あまり開かないのでサイドバーから移設)
  const [view, setView] = useState<'menu' | 'analytics'>('menu')
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
  const [statusSummary, setStatusSummary] = useState<{ active: number; archived: number } | null>(null)
  const [editSelectedAllergenUids, setEditSelectedAllergenUids] = useState<string[]>([])
  const [cookingMethods, setCookingMethods] = useState<CookingMethod[]>([])
  const [restrictions, setRestrictions] = useState<Restriction[]>([])
  const [selectedCookingMethodUids, setSelectedCookingMethodUids] = useState<string[]>([])
  const [selectedRestrictionUids, setSelectedRestrictionUids] = useState<string[]>([])
  const [editSelectedCookingMethodUids, setEditSelectedCookingMethodUids] = useState<string[]>([])
  const [editSelectedRestrictionUids, setEditSelectedRestrictionUids] = useState<string[]>([])
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [visionResults, setVisionResults] = useState<VisionMenuItem[]>([])
  // 承認処理中のフリーズ感対策（押下→「登録中…」表示）
  const [approvingIndex, setApprovingIndex] = useState<number | null>(null)
  const [approvingAll, setApprovingAll] = useState(false)
  const [showVisionApproval, setShowVisionApproval] = useState(false)
  const [showTextModal, setShowTextModal] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [avgConfidence, setAvgConfidence] = useState<number | null>(null)
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
      // 画像は原寸(数MB/HEIC)だと回線が弱い時に送信が途中で切れて「Failed to fetch」になる。
      // 客側/スタッフ側と同じく1600px JPEGに縮小してから送る。PDF/Excel/CSVはそのまま。
      let uploadFile = file
      if (file.type.startsWith('image/')) {
        try { uploadFile = await downscaleImage(file) } catch { /* 原寸のままフォールバック */ }
      }
      const response = await VisionApi.analyzeImage(uploadFile, restaurantSlug, false)
      const items = (response.result?.items || []).map(normalizeVisionItem)
      if (items.length === 0) {
        toast('warning', t.menuList.noMenuDetected)
        return
      }
      setVisionResults(items)
      setShowVisionApproval(true)
    } catch (err) {
      console.error('File analysis failed:', err)
      toast('error', t.menuList.fileAnalysisFailed(err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsAnalyzing(false)
      e.target.value = ''
    }
  }

  const handleTextAnalyze = async () => {
    if (!pasteText.trim()) {
      toast('warning', t.menuList.enterText)
      return
    }

    setShowTextModal(false)
    setIsAnalyzing(true)
    try {
      const response = await VisionApi.analyzeText(pasteText.trim())
      const items = (response.result?.items || []).map(normalizeVisionItem)
      if (items.length === 0) {
        toast('warning', t.menuList.noMenuDetectedText)
        return
      }
      setVisionResults(items)
      setShowVisionApproval(true)
      setPasteText('')
    } catch (err) {
      console.error('Text analysis failed:', err)
      toast('error', t.menuList.textAnalysisFailed(err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  // AI(LLM)出力は ingredients/allergens を文字列で返すことがある（"鶏肉、玉ねぎ"）。
  // 配列前提の描画(.join)・承認処理で落ちるため、解析直後に必ず配列へ正規化する。
  const toStringArray = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string')
    if (typeof v === 'string') return v.split(/[、,]/).map(s => s.trim()).filter(Boolean)
    return []
  }

  const normalizeVisionItem = (item: VisionMenuItem): VisionMenuItem => ({
    ...item,
    ingredients: toStringArray(item.ingredients),
    allergens: toStringArray(item.allergens)
  })

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
      category: item.category || t.menuList.uncategorized,
      price: item.price || 0,
      description: item.description || null,
      restaurant_uid: restaurant!.uid,
      ingredients: item.ingredients || [],
      allergen_uids: allergenUids.length > 0 ? allergenUids : null,
      status: false,
      data_source: 'ai_inferred'
    }
  }

  // バックエンドは同名メニューを 409「同名のメニューが既に存在します」で弾く。
  // apiClient は status code を Error に載せないため文言で判定する。
  // 既登録は失敗ではなく「スキップ」なので、リストから消して成功扱いにする。
  const isDuplicateError = (err: unknown): boolean =>
    err instanceof Error && err.message.includes('既に存在')

  const handleApproveVisionItem = async (index: number) => {
    const item = visionResults[index]
    if (!item || !restaurant?.uid) return

    setApprovingIndex(index)
    try {
      await MenuApi.create(buildMenuDataFromVision(item))
      await refreshMenus()
      setVisionResults(visionResults.filter((_, i) => i !== index))
      toast('success', t.menuList.addedItem(item.name_jp))
    } catch (err) {
      console.error('Failed to save menu:', err)
      if (isDuplicateError(err)) {
        setVisionResults(visionResults.filter((_, i) => i !== index))
        toast('info', t.menuList.duplicateItem(item.name_jp))
      } else {
        toast('error', err instanceof Error ? err.message : t.menuList.saveFailed)
      }
    } finally {
      setApprovingIndex(null)
    }
  }

  const handleApproveAllVision = async () => {
    if (!restaurant?.uid) return

    setApprovingAll(true)
    // 1件ずつ登録。既登録(409)はスキップ、その他エラーのみ失敗として残す
    const added: string[] = []
    const skipped: string[] = []
    const failed: string[] = []
    for (const item of visionResults) {
      try {
        await MenuApi.create(buildMenuDataFromVision(item))
        added.push(item.name_jp)
      } catch (err) {
        if (isDuplicateError(err)) {
          skipped.push(item.name_jp)
        } else {
          console.error('Failed to save menu:', item.name_jp, err)
          failed.push(item.name_jp)
        }
      }
    }

    await refreshMenus()
    // 追加済み・既登録は両方リストから消す（残るのは本当に失敗したものだけ）
    const processed = new Set([...added, ...skipped])
    setVisionResults(visionResults.filter(i => !processed.has(i.name_jp)))

    if (failed.length === 0) {
      setShowVisionApproval(false)
      const parts: string[] = []
      if (added.length > 0) parts.push(t.menuList.addedCount(added.length))
      if (skipped.length > 0) parts.push(t.menuList.skippedCount(skipped.length))
      toast('success', `${parts.join(t.menuList.sep) || t.menuList.processedDone}`)
    } else {
      const summary = [
        added.length > 0 ? t.menuList.addedCount(added.length) : '',
        skipped.length > 0 ? t.menuList.skippedCount(skipped.length) : ''
      ].filter(Boolean).join(t.menuList.sep)
      toast('warning', `${summary ? summary + t.menuList.sep : ''}${t.menuList.failedCount(failed.length)}: ${failed.join(t.menuList.sep)}`)
    }
    setApprovingAll(false)
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
        // 店舗セレクタで選択中のUIDがあればそれを使う
        const storeUid = selectedStoreUid || (userRestaurants.length > 0 ? userRestaurants[0].uid : null)
        if (storeUid) {
          const restaurantResponse = await apiClient.get(`/restaurants/${storeUid}`) as { result: any }
          restaurantData = restaurantResponse.result
        } else {
          const restaurantResponse = await apiClient.get(`/restaurants/detail-by-user/${user.uid}`) as { result: any }
          restaurantData = restaurantResponse.result
        }
      }
      setRestaurant(restaurantData)
      setScrapingUrl(localStorage.getItem(`menu_scraping_url_${restaurantData.uid}`) || '')

      if (restaurantData?.uid) {
        try {
          const statusParam = filter === 'verified' ? 'active' : filter === 'warning' ? 'archived' : undefined
          const menusResponse = await MenuApi.getAll(restaurantData.uid, page, itemsPerPage, sortKey !== 'default' ? sortKey : undefined, sortKey !== 'default' ? sortDir : undefined, statusParam)
          const items = menusResponse.result?.items || []
          const total = menusResponse.result?.total || 0

          setTotalItems(total)
          setTotalPages(Math.ceil(total / itemsPerPage))
          const ss = menusResponse.result?.status_summary
          if (ss) setStatusSummary(ss)

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
            verificationRank: menu.verification_rank || null,
            dataSource: menu.data_source || null,
            narrative: menu.narrative || null,
            serving: menu.serving || null,
            drinkMeta: (menu as any).drink_meta || null,
            priceDetail: menu.price_detail || null,
            tasteProfiles: menu.taste_profiles || null,
            imageUrl: menu.image_url || null,
            productUrl: menu.product_url || null,
            featuredTags: menu.featured_tags || null,
            createdAt: menu.created_at || null,
            verifiedAt: (menu as any).verified_at || null,
            verifiedBy: (menu as any).verified_by || null
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
      setError(t.menuList.fetchRestaurantFailed)
    } finally {
      setIsLoading(false)
    }
  }, [authLoading, user, itemsPerPage, isAdminViewing, uidParam, sortKey, sortDir, selectedStoreUid, userRestaurants, filter])

  useEffect(() => {
    fetchData(currentPage)
  }, [fetchData, currentPage])

  useEffect(() => {
    if (menuItems.length > 0) {
      const total = menuItems.reduce((s, m) => s + m.confidenceScore, 0)
      setAvgConfidence(Math.round(total / menuItems.length))
    }
  }, [menuItems])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // 提供中/アーカイブの絞り込みはサーバー側で実施済み。ここは検索のみ。
  const filteredItems = menuItems.filter(item => {
    const ingredientsStr = item.ingredients?.map(ing => ing.name).join(' ') || ''
    return item.name.includes(searchQuery) || item.category.includes(searchQuery) || ingredientsStr.includes(searchQuery)
  })

  // タブの件数は全件ベース(status_summary)。未取得時はページから暫定算出。
  const countVerified = statusSummary ? statusSummary.active : menuItems.filter(i => i.status === true).length
  const countWarning = statusSummary ? statusSummary.archived : menuItems.filter(i => i.status === false).length
  const countAll = statusSummary ? statusSummary.active + statusSummary.archived : menuItems.length

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
      toast('warning', t.menuList.requiredFields)
      return
    }
    if (!restaurant?.uid) {
      toast('error', t.menuList.restaurantNotFound)
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

      const createResp = await MenuApi.create(menuData)

      // 画像ファイルがpendingならアップロード
      if (pendingImageFile && createResp.result?.uid) {
        try {
          await MenuApi.uploadImage(createResp.result.uid, pendingImageFile)
        } catch (imgErr) {
          console.error('Image upload failed:', imgErr)
          toast('warning', t.menuList.imageUploadFailed)
        }
      }

      await refreshMenus()

      setNewMenu({ name: '', nameEn: '', price: '', category: '', description: '', descriptionEn: '', ingredients: '', narrative: { story: '', chef_note: '', tasting_note: '', pairing_suggestion: '', seasonal_note: '' }, serving: { size: '', availability: '' }, priceDetail: { currency: 'JPY', tax_included: true, tax_rate: 10 } })
      setSelectedAllergenUids([])
      setSelectedCookingMethodUids([])
      setSelectedRestrictionUids([])
      setPendingImageFile(null)
      setShowAddModal(false)
      setActiveTab('basic')
      toast('success', t.menuList.addedSuccess)
    } catch (err) {
      console.error('Failed to add menu:', err)
      toast('error', t.menuList.addFailed(err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleFetchFromSource = async () => {
    if (!restaurant?.uid) {
      toast('error', t.menuList.restaurantNotFound)
      return
    }

    if (!scrapingUrl) {
      toast('warning', t.menuList.sourceUrlMissing)
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
      toast('error', t.menuList.scrapeStartFailed)
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
        setError(task.error || t.menuList.scrapeFailed)
        setScrapingTaskId(null)
      } else {
        setTimeout(() => pollTaskStatus(taskId), 2000)
      }
    } catch (err) {
      console.error('Failed to check task status:', err)
      setShowFetchModal(false)
      setScrapingTaskId(null)
      setError(t.menuList.taskStatusCheckFailed)
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
        toast('error', t.menuList.approveFailed)
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
      toast('success', t.menuList.allApprovedSuccess)
    } catch (err) {
      console.error('Failed to approve all menus:', err)
      toast('error', t.menuList.approveFailed)
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

  const handleEdit = (item: MenuItem, tab: string = 'basic') => {
    setEditItem({...item})
    setEditIngredientsText(item.ingredients?.map(ing => ing.name).join(', ') || '')
    setEditSelectedAllergenUids(item.allergens?.map(allergen => allergen.uid) || [])
    setEditSelectedCookingMethodUids(item.cookingMethods?.map(cm => cm.uid) || [])
    setEditSelectedRestrictionUids(item.restrictions?.map(r => r.uid) || [])
    setShowEditModal(true)
    setActiveTab(tab)
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
        price_detail: editItem.priceDetail,
        image_url: editItem.imageUrl,
        product_url: editItem.productUrl,
        featured_tags: editItem.featuredTags
      }

      await MenuApi.update(editItem.uid, updateData)
      await refreshMenus()

      setShowEditModal(false)
      setEditItem(null)
      setEditIngredientsText('')
      setEditSelectedAllergenUids([])
      setEditSelectedCookingMethodUids([])
      setEditSelectedRestrictionUids([])
      toast('success', t.menuList.updatedSuccess)
    } catch (err) {
      console.error('Failed to update menu:', err)
      toast('error', t.menuList.updateFailed(err instanceof Error ? err.message : 'Unknown error'))
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
      toast('error', t.menuList.approvalFailed)
    }
  }

  const handleOwnerVerify = async (item: MenuItem) => {
    // 店主が「データを確認した」承認: verification_rank=S + data_source=owner_verified に昇格
    try {
      await MenuApi.update(item.uid, {
        verification_rank: 'S',
        data_source: 'owner_verified',
      } as any)
      await refreshMenus()
      toast('success', t.menuList.ownerVerifiedItem(item.name))
    } catch (err) {
      console.error('Failed to verify menu:', err)
      toast('error', t.menuList.ownerVerifyFailed)
    }
  }

  const handleToggleStatus = async (uid: string, newStatus: boolean) => {
    try {
      await MenuApi.update(uid, { status: newStatus })
      await refreshMenus()
    } catch {
      toast('error', t.menuList.statusChangeFailed)
    }
  }

  const handleBulkApprove = async () => {
    const unverified = menuItems.filter(i => !i.status)
    if (unverified.length === 0) {
      toast('info', t.menuList.noPendingApproval)
      return
    }
    if (!confirm(t.menuList.confirmBulkApprove(unverified.length))) return

    try {
      for (const item of unverified) {
        await MenuApi.update(item.uid, { status: true })
      }
      await refreshMenus()
      toast('success', t.menuList.bulkApproved(unverified.length))
    } catch (err) {
      console.error('Failed to bulk approve:', err)
      toast('error', t.menuList.bulkApproveFailed)
    }
  }

  const handleDelete = async (uid: string) => {
    if (!confirm(t.menuList.confirmDeleteMenu)) return

    try {
      await MenuApi.delete(uid)
      await refreshMenus()
      toast('success', t.menuList.deletedMenu)
    } catch (err) {
      console.error('Failed to delete menu:', err)
      toast('error', t.menuList.deleteMenuFailed(err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  return (
    <AdminLayout title={t.nav.menuList}>
      {hasMultipleStores && !isAdminViewing && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{t.menuList.storeLabel}</span>
          <select
            value={selectedStoreUid || userRestaurants[0]?.uid || ''}
            onChange={(e) => {
              const uid = e.target.value
              setSelectedStoreUid(uid)
              sessionStorage.setItem('selectedStoreUid', uid)
              const found = userRestaurants.find(r => r.uid === uid)
              if (found) {
                sessionStorage.setItem('selectedStoreName', found.name)
                window.dispatchEvent(new Event('selectedStoreChanged'))
              }
              setCurrentPage(1)
            }}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-input)', color: 'var(--text)', fontSize: 14 }}
          >
            {userRestaurants.map((r) => (
              <option key={r.uid} value={r.uid}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([['menu', `📋 ${t.nav.menuList}`], ['analytics', `📊 ${t.nav.menuAnalytics}`]] as const).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${view === v ? 'rgba(59,130,246,0.4)' : 'var(--border)'}`,
              background: view === v ? 'rgba(59,130,246,0.12)' : 'var(--bg-surface)',
              color: view === v ? '#3B82F6' : 'var(--text-body)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'analytics' && (
        <MenuAnalyticsSection uid={uidParam || selectedStoreUid || undefined} />
      )}

      {view === 'menu' && (
      <>
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
        approvingIndex={approvingIndex}
        approvingAll={approvingAll}
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

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">{t.menuList.cardTitle}</div>

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
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={(key, dir) => { setSortKey(key); setSortDir(dir); setCurrentPage(1); }}
          onSearchChange={setSearchQuery}
          onFilterChange={(f) => { setFilter(f); setCurrentPage(1); }}
          onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
          onPageChange={handlePageChange}
          onPreview={handlePreview}
          onEdit={handleEdit}
          onEditWithTab={handleEdit}
          onDelete={handleDelete}
          onApprove={handleApprove}
          onBulkApprove={handleBulkApprove}
          onAddNew={() => setShowAddModal(true)}
          onFetchFromSource={handleFetchFromSource}
          onToggleStatus={handleToggleStatus}
        />
      </div>
      </>
      )}

      <MenuFormModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setPendingImageFile(null) }}
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
        pendingImageFile={pendingImageFile}
        onPendingImageFileChange={setPendingImageFile}
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
        onApprove={handleOwnerVerify}
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
