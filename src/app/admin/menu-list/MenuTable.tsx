'use client'

import { DISH_CATEGORIES } from '../../../services/api'
import type { MenuItem } from './page'
import { getMissingFields } from './menuHelpers'

const SORT_OPTIONS = [
  { value: 'default', label: 'デフォルト' },
  { value: 'rank', label: '確認優先度' },
  { value: 'created', label: '登録日' },
  { value: 'price', label: '価格' },
  { value: 'name', label: '名前' },
]

function isNew(createdAt: string | null): boolean {
  if (!createdAt) return false
  const diff = Date.now() - new Date(createdAt).getTime()
  return diff < 7 * 24 * 60 * 60 * 1000
}

interface MenuTableProps {
  items: MenuItem[]
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
  searchQuery: string
  filter: string
  countAll: number
  countVerified: number
  countWarning: number
  isLoading: boolean
  error: string
  sortKey: string
  sortDir: 'asc' | 'desc'
  onSortChange: (key: string, dir: 'asc' | 'desc') => void
  onSearchChange: (q: string) => void
  onFilterChange: (f: string) => void
  onItemsPerPageChange: (n: number) => void
  onPageChange: (p: number) => void
  onPreview: (item: MenuItem) => void
  onEdit: (item: MenuItem) => void
  onEditWithTab: (item: MenuItem, tab: string) => void
  onDelete: (uid: string) => void
  onApprove: (item: MenuItem) => void
  onBulkApprove: () => void
  onAddNew: () => void
  onFetchFromSource: () => void
}

function HintBadges({ item, onEditWithTab }: { item: MenuItem; onEditWithTab: (item: MenuItem, tab: string) => void }) {
  const missing = getMissingFields(item)
  if (missing.length === 0) return null
  const show = missing.slice(0, 3)
  const rest = missing.length - show.length
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '3px' }}>
      {show.map(f => (
        <span
          key={f.label}
          onClick={(e) => { e.stopPropagation(); onEditWithTab(item, f.tab) }}
          style={{ display: 'inline-block', padding: '1px 6px', background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', borderRadius: 8, fontSize: 10, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          {f.label}
        </span>
      ))}
      {rest > 0 && (
        <span style={{ display: 'inline-block', padding: '1px 6px', background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', borderRadius: 8, fontSize: 10 }}>
          +{rest}
        </span>
      )}
    </div>
  )
}

export default function MenuTable({
  items, currentPage, itemsPerPage, totalItems, totalPages,
  searchQuery, filter, countAll, countVerified, countWarning,
  isLoading, error,
  sortKey, sortDir, onSortChange,
  onSearchChange, onFilterChange, onItemsPerPageChange, onPageChange,
  onPreview, onEdit, onEditWithTab, onDelete, onApprove, onBulkApprove, onAddNew, onFetchFromSource
}: MenuTableProps) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>メニュー一覧</h2>
          <span style={{ fontSize: '14px', color: '#94A3B8', background: '#f0f4ff', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
            登録数: {totalItems}件
          </span>
        </div>
        <button className="btn btn-primary" onClick={onFetchFromSource} style={{ padding: '8px 16px', fontSize: '13px' }}>
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
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: '100%', padding: '10px 40px 10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
          />
          <button
            onClick={() => onSearchChange('')}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '16px' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* フィルター・ソート・表示件数 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div className="filter-buttons" style={{ display: 'flex', gap: '8px' }}>
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => onFilterChange('all')} style={{ padding: '6px 12px', fontSize: '13px' }}>
            全て ({countAll})
          </button>
          <button className={`filter-btn ${filter === 'warning' ? 'active' : ''}`} onClick={() => onFilterChange('warning')} style={{ padding: '6px 12px', fontSize: '13px' }}>
            未承認 ({countWarning})
          </button>
          <button className={`filter-btn ${filter === 'verified' ? 'active' : ''}`} onClick={() => onFilterChange('verified')} style={{ padding: '6px 12px', fontSize: '13px' }}>
            承認済み ({countVerified})
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94A3B8' }}>並び替え:</label>
          <select
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value, e.target.value === 'rank' ? 'asc' : sortDir)}
            style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {sortKey !== 'default' && (
            <button
              onClick={() => onSortChange(sortKey, sortDir === 'asc' ? 'desc' : 'asc')}
              style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', background: 'var(--bg-surface)', cursor: 'pointer', color: 'var(--text)' }}
            >
              {sortDir === 'asc' ? '↑ 昇順' : '↓ 降順'}
            </button>
          )}
          <label style={{ fontSize: '13px', color: '#94A3B8', marginLeft: '8px' }}>表示件数:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
          >
            <option value={10}>10件</option>
            <option value={30}>30件</option>
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

      {/* 一括承認ボタン */}
      {!isLoading && !error && countWarning > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <button
            className="btn"
            onClick={onBulkApprove}
            style={{ background: '#10b981', color: 'white', padding: '8px 16px', fontSize: '13px' }}
          >
            一括承認 ({countWarning}件)
          </button>
        </div>
      )}

      {/* デスクトップテーブル */}
      {!isLoading && !error && (
        <div className="menu-table-container">
          <table className="menu-table desktop-table">
            <thead>
              <tr>
                <th style={{ width: '4%', textAlign: 'center' }}>No.</th>
                <th style={{ width: '33%' }}>メニュー詳細</th>
                <th style={{ width: '10%', textAlign: 'center' }}>価格</th>
                <th style={{ width: '10%', textAlign: 'center' }}>確認優先度</th>
                <th style={{ width: '10%', textAlign: 'center' }}>ステータス</th>
                <th style={{ width: '33%', textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    メニューがありません。「手動で新規追加」ボタンからメニューを追加してください。
                  </td>
                </tr>
              ) : items.map((item, index) => {
                const rank = item.verificationRank
                const rkColor = rank === 'S' ? '#EF4444' : rank === 'A' ? '#F59E0B' : rank === 'B' ? '#3B82F6' : rank === 'C' ? '#10B981' : ''
                const rkLabel = rank === 'S' ? '必ず確認' : rank === 'A' ? '要確認' : rank === 'B' ? '確認推奨' : rank === 'C' ? '確認不要' : ''
                const rowNum = (currentPage - 1) * itemsPerPage + index + 1
                const itemIsNew = isNew(item.createdAt)
                return (
                  <tr key={item.uid}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#94A3B8', fontSize: '13px' }}>{rowNum}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ width: '40px', height: '30px', background: '#1E293B', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#94A3B8', flexShrink: 0, marginTop: '2px' }}>📄</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            {itemIsNew && (
                              <span style={{ display: 'inline-block', padding: '1px 5px', background: '#7C3AED', color: '#F5F3FF', borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>NEW</span>
                            )}
                            <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '14px' }}>🇯🇵 {item.name}</span>
                          </div>
                          {item.nameEn && (
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px', fontStyle: 'italic' }}>
                              🇬🇧 {item.nameEn}
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px' }}>
                            📂 {DISH_CATEGORIES[item.category] || item.category}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>
                            🥘 {item.ingredients?.length > 0 ? item.ingredients.map(ing => ing.name).join(', ') : '原材料なし'}
                          </div>
                          <HintBadges item={item} onEditWithTab={onEditWithTab} />
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#28a745', fontSize: '14px' }}>¥{item.price.toLocaleString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      {rank ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: rkColor }}>{rank}</span>
                          <span style={{ fontSize: '9px', color: rkColor }}>{rkLabel}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.status ? (
                        <span className="status-badge verified">承認済み</span>
                      ) : (
                        <button className="btn-action btn-approve" onClick={() => onApprove(item)}>✓ 承認</button>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn-action btn-preview" onClick={() => onPreview(item)}>👁️ プレビュー</button>
                        <button className="btn-action btn-edit" onClick={() => onEdit(item)}>✏️ 編集</button>
                        <button className="btn-action btn-delete" onClick={() => onDelete(item.uid)}>🗑️ 削除</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* モバイルカードリスト */}
      {!isLoading && !error && (
        <div className="mobile-card-list">
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
              メニューがありません。「手動で新規追加」ボタンからメニューを追加してください。
            </div>
          ) : items.map((item, index) => {
            const mRank = item.verificationRank
            const mRkColor = mRank === 'S' ? '#EF4444' : mRank === 'A' ? '#F59E0B' : mRank === 'B' ? '#3B82F6' : mRank === 'C' ? '#10B981' : ''
            const mRkLabel = mRank === 'S' ? '必ず確認' : mRank === 'A' ? '要確認' : mRank === 'B' ? '確認推奨' : mRank === 'C' ? '確認不要' : ''
            const rowNum = (currentPage - 1) * itemsPerPage + index + 1
            const itemIsNew = isNew(item.createdAt)
            return (
              <div key={item.uid} className="mobile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '2px' }}>#{rowNum}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {itemIsNew && (
                        <span style={{ display: 'inline-block', padding: '1px 5px', background: '#7C3AED', color: '#F5F3FF', borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>NEW</span>
                      )}
                      <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>{item.name}</span>
                    </div>
                    {item.nameEn && <div style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic' }}>{item.nameEn}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: '#28a745', fontSize: '15px' }}>¥{item.price.toLocaleString()}</div>
                    {item.status ? (
                      <span className="status-badge verified" style={{ marginTop: '4px', display: 'inline-block' }}>承認済み</span>
                    ) : (
                      <span className="status-badge warning" style={{ marginTop: '4px', display: 'inline-block' }}>未承認</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                  📂 {DISH_CATEGORIES[item.category] || item.category}
                  {mRank && <span style={{ marginLeft: '8px', fontWeight: 800, color: mRkColor }}>{mRank} <span style={{ fontWeight: 400, fontSize: '10px' }}>{mRkLabel}</span></span>}
                </div>
                <HintBadges item={item} onEditWithTab={onEditWithTab} />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {!item.status && (
                    <button className="btn-action btn-approve" onClick={() => onApprove(item)}>✓ 承認</button>
                  )}
                  <button className="btn-action btn-preview" onClick={() => onPreview(item)}>👁️</button>
                  <button className="btn-action btn-edit" onClick={() => onEdit(item)}>✏️</button>
                  <button className="btn-action btn-delete" onClick={() => onDelete(item.uid)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', margin: '20px 0', padding: '16px', background: '#1E293B', borderRadius: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{ padding: '8px 16px', opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            ← 前へ
          </button>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#94A3B8' }}>ページ</span>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
              if (pageNum > totalPages) return null
              return (
                <button
                  key={pageNum}
                  className={`btn ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => onPageChange(pageNum)}
                  style={{ padding: '8px 12px', minWidth: '40px' }}
                >
                  {pageNum}
                </button>
              )
            })}
            <span style={{ fontSize: '14px', color: '#94A3B8' }}>/{totalPages}</span>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{ padding: '8px 16px', opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            次へ →
          </button>
        </div>
      )}

      {/* Total items info */}
      {!isLoading && !error && (
        <div style={{ textAlign: 'center', marginBottom: '16px', color: '#94A3B8', fontSize: '14px' }}>
          全{totalItems}件中 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}件を表示
        </div>
      )}

      <button className="btn btn-primary" onClick={onAddNew} style={{ width: 'auto', minWidth: '180px', maxWidth: '250px', margin: '8px auto', display: 'block', padding: '10px 20px', fontSize: '14px' }}>
        ➕ 手動で新規追加
      </button>

      <style jsx>{`
        .filter-btn {
          padding: 6px 12px;
          font-size: 13px;
          background: #f3f4f6;
          border: 1px solid var(--border);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: var(--bg-hover);
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
          border-bottom: 1px solid var(--border);
        }

        .menu-table th {
          background: var(--bg-hover);
          font-weight: 600;
          font-size: 13px;
          color: #374151;
        }

        .menu-table tr:hover {
          background: var(--bg-hover);
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

        .btn-approve {
          color: white;
          background: #10b981;
          border-color: #10b981;
          padding: 5px 12px;
          font-size: 12px;
        }

        .btn-approve:hover {
          background: #059669;
          border-color: #059669;
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
          background: var(--bg-surface);
          border-color: #6c757d;
        }

        .btn-edit:hover {
          background: var(--bg-hover);
        }

        .btn-delete {
          color: #dc3545;
          background: var(--bg-surface);
          border-color: #dc3545;
        }

        .btn-delete:hover {
          background: #fff5f5;
        }

        .status-badge {
          padding: 3px 6px;
          border-radius: 3px;
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

        .desktop-table {
          display: table;
        }

        .mobile-card-list {
          display: none;
        }

        .mobile-card {
          background: var(--bg-hover);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 8px;
        }

        @media (max-width: 768px) {
          .desktop-table {
            display: none;
          }

          .mobile-card-list {
            display: block;
          }
        }
      `}</style>
    </>
  )
}
