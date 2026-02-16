'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { useToast } from '../../../components/admin/Toast'
import {
  ConversationApi,
  RestaurantApi,
  type ConversationListItem,
  type ConversationDetail,
  type Restaurant,
} from '../../../services/api'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Detail view
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const toast = useToast()

  const fetchConversations = async (p: number = 1, restaurantUid?: string) => {
    try {
      setLoading(true)
      const res = await ConversationApi.getAll(p, 20, restaurantUid || undefined)
      setConversations(res.result.items)
      setTotalPages(res.result.pages)
      setTotal(res.result.total)
      setPage(res.result.page)
    } catch (err) {
      toast('error', '会話ログの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const fetchRestaurants = async () => {
    try {
      const res = await RestaurantApi.getAll(1, 200)
      setRestaurants(res.result.items)
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchConversations()
    fetchRestaurants()
  }, [])

  const handleFilterChange = (restaurantUid: string) => {
    setSelectedRestaurant(restaurantUid)
    fetchConversations(1, restaurantUid)
  }

  const openDetail = async (threadUid: string) => {
    try {
      setDetailLoading(true)
      const res = await ConversationApi.getDetail(threadUid)
      setDetail(res.result)
    } catch {
      toast('error', '会話詳細の取得に失敗しました')
    } finally {
      setDetailLoading(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // Detail view
  if (detail) {
    return (
      <AdminLayout title="会話ログ詳細">
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setDetail(null)}
            style={{
              background: 'var(--bg-hover)',
              color: 'var(--text)',
              border: '1px solid var(--border-strong)',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            ← 一覧に戻る
          </button>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 14 }}>
            <div>
              <span style={{ color: 'var(--muted)' }}>店舗: </span>
              <span style={{ fontWeight: 600 }}>{detail.restaurant_name || '-'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>要約: </span>
              <span>{detail.summary || '(なし)'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>メッセージ数: </span>
              <span>{detail.messages.length}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>開始: </span>
              <span>{formatDate(detail.created_at)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {detail.messages.map((msg) => (
            <div key={msg.uid} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* User message */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: '16px 16px 4px 16px',
                  padding: '10px 16px',
                  maxWidth: '70%',
                  fontSize: 14,
                  lineHeight: 1.6,
                  wordBreak: 'break-word',
                }}>
                  {msg.user_message}
                </div>
              </div>
              {/* AI response */}
              {msg.ai_response && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    background: 'var(--bg-hover)',
                    color: 'var(--text-body)',
                    borderRadius: '16px 16px 16px 4px',
                    padding: '10px 16px',
                    maxWidth: '70%',
                    fontSize: 14,
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.ai_response}
                    {msg.feedback && (
                      <div style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: '1px solid var(--border)',
                        fontSize: 12,
                        color: msg.feedback === 'good' ? 'var(--success)' : 'var(--error)',
                      }}>
                        {msg.feedback === 'good' ? '👍 Good' : '👎 Bad'}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                {formatDate(msg.created_at)}
              </div>
            </div>
          ))}
        </div>

        {detail.messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            メッセージがありません
          </div>
        )}
      </AdminLayout>
    )
  }

  // List view
  return (
    <AdminLayout title="会話ログ">
      {/* Filter */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 20,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <select
          value={selectedRestaurant}
          onChange={(e) => handleFilterChange(e.target.value)}
          style={{
            background: 'var(--bg-input)',
            color: 'var(--text)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 14,
            minWidth: 200,
          }}
        >
          <option value="">全店舗</option>
          {restaurants.map((r) => (
            <option key={r.uid} value={r.uid}>{r.name}</option>
          ))}
        </select>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>
          {total}件の会話
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          読み込み中...
        </div>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          会話ログがありません
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 14,
            }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>店舗</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>要約</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 60 }}>件数</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 60 }}>👍</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 60 }}>👎</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 120 }}>日時</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c) => (
                  <tr
                    key={c.thread_uid}
                    onClick={() => openDetail(c.thread_uid)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>
                      {c.restaurant_name}
                    </td>
                    <td style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border)',
                      maxWidth: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {c.summary || '(要約なし)'}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                      {c.message_count}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center', color: 'var(--success)' }}>
                      {c.good_count > 0 ? c.good_count : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center', color: 'var(--error)' }}>
                      {c.bad_count > 0 ? c.bad_count : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontSize: 13, color: 'var(--muted)' }}>
                      {formatDate(c.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              marginTop: 20,
            }}>
              <button
                disabled={page <= 1}
                onClick={() => fetchConversations(page - 1, selectedRestaurant)}
                style={{
                  background: 'var(--bg-hover)',
                  color: 'var(--text)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 6,
                  padding: '6px 14px',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1,
                  fontSize: 13,
                }}
              >
                前へ
              </button>
              <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--muted)' }}>
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchConversations(page + 1, selectedRestaurant)}
                style={{
                  background: 'var(--bg-hover)',
                  color: 'var(--text)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 6,
                  padding: '6px 14px',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.5 : 1,
                  fontSize: 13,
                }}
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}

      {detailLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{ color: '#fff', fontSize: 16 }}>読み込み中...</div>
        </div>
      )}
    </AdminLayout>
  )
}
