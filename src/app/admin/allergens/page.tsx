'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { AllergenApi, Allergen, AllergenCreate, AllergenUpdate, TokenService } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../components/admin/Toast'

type AllergenType = 'mandatory' | 'recommended'

export default function AllergensPage() {
  const { user } = useAuth()
  const [allergens, setAllergens] = useState<{ mandatory: Allergen[]; recommended: Allergen[] }>({
    mandatory: [],
    recommended: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAllergen, setEditingAllergen] = useState<Allergen | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'mandatory' | 'recommended'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const [createAllergen, setCreateAllergen] = useState({
    name_en: '',
    name_jp: '',
    allergen_type: 'mandatory' as AllergenType
  })

  const [editAllergen, setEditAllergen] = useState({
    name_en: '',
    name_jp: '',
    allergen_type: 'mandatory' as AllergenType
  })

  const [createErrors, setCreateErrors] = useState<{ name_en?: string; name_jp?: string }>({})
  const [editErrors, setEditErrors] = useState<{ name_en?: string; name_jp?: string }>({})

  const toast = useToast()

  // Check if user is platform owner or superadmin
  const canManageAllergens = user?.role === 'platform_owner' || user?.role === 'superadmin'

  // Fetch allergens
  const fetchAllergens = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await AllergenApi.getAll()
      // Transform array response to object format
      // The API returns an array of objects, each containing either mandatory or recommended allergens
      let allMandatory: Allergen[] = []
      let allRecommended: Allergen[] = []

      if (Array.isArray(response.result)) {
        response.result.forEach((item, index) => {
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
    } catch (err: any) {
      console.error('Failed to fetch allergens:', err)
      setError('アレルゲン情報の取得に失敗しました')
      setAllergens({ mandatory: [], recommended: [] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManageAllergens) {
      fetchAllergens()
    }
  }, [canManageAllergens])

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filter])

  // Filter allergens based on search and filter
  const getFilteredAllergens = () => {
    const allAllergens = [...allergens.mandatory, ...allergens.recommended]
    return allAllergens.filter(allergen => {
      const matchesSearch = searchTerm === '' ||
        allergen.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        allergen.name_jp.includes(searchTerm)

      const matchesFilter = filter === 'all' || allergen.allergen_type === filter

      return matchesSearch && matchesFilter
    })
  }

  // Get paginated allergens
  const getPaginatedAllergens = () => {
    const filtered = getFilteredAllergens()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filtered.slice(startIndex, endIndex)
  }

  // Get total pages
  const getTotalPages = () => {
    return Math.ceil(getFilteredAllergens().length / itemsPerPage)
  }

  // Handle create allergen
  const handleCreateAllergen = async () => {
    // Validation
    const errors: { name_en?: string; name_jp?: string } = {}
    if (!createAllergen.name_en.trim()) errors.name_en = '英語名は必須です'
    if (!createAllergen.name_jp.trim()) errors.name_jp = '日本語名は必須です'

    setCreateErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      await AllergenApi.create(createAllergen)
      await fetchAllergens()
      setShowCreateModal(false)
      setCreateAllergen({ name_en: '', name_jp: '', allergen_type: 'mandatory' })
      setCreateErrors({})
      toast('success', 'アレルゲンを追加しました')
    } catch (err: any) {
      console.error('Failed to create allergen:', err)
      toast('error', `アレルゲンの追加に失敗しました: ${err.message || 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit allergen
  const handleEditAllergen = (allergen: Allergen) => {
    setEditingAllergen(allergen)
    setEditAllergen({
      name_en: allergen.name_en,
      name_jp: allergen.name_jp,
      allergen_type: allergen.allergen_type
    })
    setShowEditModal(true)
  }

  const handleUpdateAllergen = async () => {
    if (!editingAllergen) return

    // Validation
    const errors: { name_en?: string; name_jp?: string } = {}
    if (!editAllergen.name_en.trim()) errors.name_en = '英語名は必須です'
    if (!editAllergen.name_jp.trim()) errors.name_jp = '日本語名は必須です'

    setEditErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      const updateData: AllergenUpdate = {
        name_en: editAllergen.name_en.trim() || undefined,
        name_jp: editAllergen.name_jp.trim() || undefined,
        allergen_type: editAllergen.allergen_type || undefined
      }
      await AllergenApi.update(editingAllergen.uid, updateData)
      await fetchAllergens()
      setShowEditModal(false)
      setEditingAllergen(null)
      setEditAllergen({ name_en: '', name_jp: '', allergen_type: 'mandatory' })
      setEditErrors({})
      toast('success', 'アレルゲンを更新しました')
    } catch (err: any) {
      console.error('Failed to update allergen:', err)
      toast('error', `アレルゲンの更新に失敗しました: ${err.message || 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete allergen
  const handleDeleteAllergen = async (allergen: Allergen) => {
    if (!confirm(`「${allergen.name_jp} (${allergen.name_en})」を削除しますか？\n\n注意: このアレルゲンが使用されているメニューがある場合、影響が出る可能性があります。`)) {
      return
    }

    try {
      await AllergenApi.delete(allergen.uid)
      await fetchAllergens()
      toast('success', 'アレルゲンを削除しました')
    } catch (err: any) {
      console.error('Failed to delete allergen:', err)
      toast('error', `アレルゲンの削除に失敗しました: ${err.message || 'Unknown error'}`)
    }
  }

  const getTypeLabel = (type: AllergenType) => {
    return type === 'mandatory' ? '表示義務' : '推奨表示'
  }

  const getTypeColor = (type: AllergenType) => {
    return type === 'mandatory' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
  }

  if (!canManageAllergens) {
    return (
      <AdminLayout title="アレルゲン管理">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg font-semibold mb-2">アクセス権限がありません</div>
          <div className="text-gray-600">このページはプラットフォームオーナーのみがアクセスできます。</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="アレルゲン管理">
      <div className="allergens-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1 className="page-title">アレルゲン管理</h1>
            <p className="header-description">システム全体のアレルゲン情報を管理します</p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + アレルゲン追加
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="アレルゲン名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              すべて ({allergens.mandatory.length + allergens.recommended.length})
            </button>
            <button
              className={`filter-btn ${filter === 'mandatory' ? 'active' : ''}`}
              onClick={() => setFilter('mandatory')}
            >
              表示義務 ({allergens.mandatory.length})
            </button>
            <button
              className={`filter-btn ${filter === 'recommended' ? 'active' : ''}`}
              onClick={() => setFilter('recommended')}
            >
              推奨表示 ({allergens.recommended.length})
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading">
            アレルゲン情報を読み込み中...
          </div>
        )}

        {/* Allergens List */}
        {!loading && !error && (
          <div className="allergens-grid">
            {getPaginatedAllergens().map((allergen) => (
              <div key={allergen.uid} className="allergen-card">
                <div className="allergen-header">
                  <div className="allergen-names">
                    <h3 className="allergen-name-jp">{allergen.name_jp}</h3>
                    <p className="allergen-name-en">{allergen.name_en}</p>
                  </div>
                  <span className={`allergen-type ${getTypeColor(allergen.allergen_type)}`}>
                    {getTypeLabel(allergen.allergen_type)}
                  </span>
                </div>
                <div className="allergen-meta">
                  <span className="allergen-date">
                    作成日: {new Date(allergen.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <div className="allergen-actions">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => handleEditAllergen(allergen)}
                  >
                    編集
                  </button>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleDeleteAllergen(allergen)}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
            {getFilteredAllergens().length === 0 && (
              <div className="no-data">
                {searchTerm || filter !== 'all' ? '条件に一致するアレルゲンがありません' : 'アレルゲンが登録されていません'}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && getFilteredAllergens().length > 0 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ‹ 前へ
            </button>

            <span className="pagination-info">
              {currentPage} / {getTotalPages()} ページ
              ({getFilteredAllergens().length} 件中 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, getFilteredAllergens().length)} 件)
            </span>

            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages()))}
              disabled={currentPage === getTotalPages()}
            >
              次へ ›
            </button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="modal active">
            <div className="modal-content">
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateAllergen({ name_en: '', name_jp: '', allergen_type: 'mandatory' })
                  setCreateErrors({})
                }}
              >
                ×
              </button>
              <div className="modal-title">アレルゲン追加</div>

              <div className="form-group">
                <label className="form-label">日本語名 *</label>
                <input
                  type="text"
                  className={`form-input ${createErrors.name_jp ? 'error' : ''}`}
                  value={createAllergen.name_jp}
                  onChange={(e) => setCreateAllergen({...createAllergen, name_jp: e.target.value})}
                  placeholder="例: えび"
                />
                {createErrors.name_jp && <span className="error-text">{createErrors.name_jp}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">英語名 *</label>
                <input
                  type="text"
                  className={`form-input ${createErrors.name_en ? 'error' : ''}`}
                  value={createAllergen.name_en}
                  onChange={(e) => setCreateAllergen({...createAllergen, name_en: e.target.value})}
                  placeholder="例: Shrimp"
                />
                {createErrors.name_en && <span className="error-text">{createErrors.name_en}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">表示タイプ *</label>
                <select
                  className="form-input"
                  value={createAllergen.allergen_type}
                  onChange={(e) => setCreateAllergen({...createAllergen, allergen_type: e.target.value as AllergenType})}
                >
                  <option value="mandatory">表示義務 (7品目)</option>
                  <option value="recommended">推奨表示</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateAllergen({ name_en: '', name_jp: '', allergen_type: 'mandatory' })
                    setCreateErrors({})
                  }}
                >
                  キャンセル
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateAllergen}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '追加中...' : '追加'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingAllergen && (
          <div className="modal active">
            <div className="modal-content">
              <button
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingAllergen(null)
                  setEditAllergen({ name_en: '', name_jp: '', allergen_type: 'mandatory' })
                  setEditErrors({})
                }}
              >
                ×
              </button>
              <div className="modal-title">アレルゲン編集</div>

              <div className="form-group">
                <label className="form-label">日本語名 *</label>
                <input
                  type="text"
                  className={`form-input ${editErrors.name_jp ? 'error' : ''}`}
                  value={editAllergen.name_jp}
                  onChange={(e) => setEditAllergen({...editAllergen, name_jp: e.target.value})}
                />
                {editErrors.name_jp && <span className="error-text">{editErrors.name_jp}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">英語名 *</label>
                <input
                  type="text"
                  className={`form-input ${editErrors.name_en ? 'error' : ''}`}
                  value={editAllergen.name_en}
                  onChange={(e) => setEditAllergen({...editAllergen, name_en: e.target.value})}
                />
                {editErrors.name_en && <span className="error-text">{editErrors.name_en}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">表示タイプ *</label>
                <select
                  className="form-input"
                  value={editAllergen.allergen_type}
                  onChange={(e) => setEditAllergen({...editAllergen, allergen_type: e.target.value as AllergenType})}
                >
                  <option value="mandatory">表示義務 (7品目)</option>
                  <option value="recommended">推奨表示</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingAllergen(null)
                    setEditAllergen({ name_en: '', name_jp: '', allergen_type: 'mandatory' })
                    setEditErrors({})
                  }}
                >
                  キャンセル
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleUpdateAllergen}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '更新中...' : '更新'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .allergens-page {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 4px 0;
        }

        .header-description {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .filters-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }

        .search-box {
          flex: 1;
          max-width: 300px;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-strong);
          background: var(--bg-input);
          color: var(--text);
          border-radius: 6px;
          font-size: 14px;
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 1px solid var(--border-strong);
          border-radius: 6px;
          background: var(--bg-surface);
          color: var(--text-body);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: var(--bg-hover);
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border-color: transparent;
        }

        .error-message {
          background: rgba(239,68,68,0.1);
          color: #EF4444;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          border: 1px solid rgba(239,68,68,0.2);
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: var(--muted);
        }

        .allergens-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .allergen-card {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border);
        }

        .allergen-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .allergen-names {
          flex: 1;
        }

        .allergen-name-jp {
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 4px 0;
        }

        .allergen-name-en {
          font-size: 14px;
          color: var(--muted);
          margin: 0;
        }

        .allergen-type {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .allergen-meta {
          margin-bottom: 16px;
        }

        .allergen-date {
          font-size: 12px;
          color: var(--muted);
        }

        .allergen-actions {
          display: flex;
          gap: 8px;
        }

        .no-data {
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px;
          color: var(--muted);
          font-style: italic;
        }

        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          z-index: 1000;
          align-items: center;
          justify-content: center;
        }

        .modal.active {
          display: flex;
        }

        .modal-content {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--muted);
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 20px 0;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-body);
          margin-bottom: 6px;
        }

        .form-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border-strong);
          background: var(--bg-input);
          color: var(--text);
          border-radius: 6px;
          font-size: 14px;
        }

        .form-input.error {
          border-color: #dc2626;
        }

        .error-text {
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--bg-hover);
          color: var(--text-body);
          border: 1px solid var(--border-strong);
        }

        .btn-secondary:hover {
          background: var(--border-strong);
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background: #b91c1c;
        }

        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .filters-section {
            flex-direction: column;
            align-items: stretch;
          }

          .allergens-grid {
            grid-template-columns: 1fr;
          }

          .modal-content {
            margin: 20px;
            width: calc(100% - 40px);
          }
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin: 30px 0;
          padding: 20px;
        }

        .pagination-btn {
          padding: 8px 16px;
          border: 1px solid var(--border-strong);
          background: var(--bg-surface);
          color: var(--text-body);
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: var(--bg-hover);
          border-color: var(--border-strong);
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          color: var(--muted);
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>
    </AdminLayout>
  )
}