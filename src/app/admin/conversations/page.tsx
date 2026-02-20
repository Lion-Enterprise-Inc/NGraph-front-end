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

const TOPIC_COLORS: Record<string, { bg: string; color: string }> = {
  'メニュー・料理': { bg: 'rgba(59,130,246,0.15)', color: '#60A5FA' },
  'アレルゲン': { bg: 'rgba(239,68,68,0.15)', color: '#F87171' },
  '店舗情報': { bg: 'rgba(16,185,129,0.15)', color: '#34D399' },
  'ドリンク': { bg: 'rgba(139,92,246,0.15)', color: '#A78BFA' },
  'おすすめ': { bg: 'rgba(245,158,11,0.15)', color: '#FBBF24' },
  'その他': { bg: 'rgba(148,163,184,0.15)', color: '#94A3B8' },
}

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
  const [currentIndex, setCurrentIndex] = useState(-1)

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

  const openDetail = async (threadUid: string, index: number) => {
    try {
      setDetailLoading(true)
      setCurrentIndex(index)
      const res = await ConversationApi.getDetail(threadUid)
      setDetail(res.result)
    } catch {
      toast('error', '会話詳細の取得に失敗しました')
    } finally {
      setDetailLoading(false)
    }
  }

  const navigateDetail = (direction: -1 | 1) => {
    const newIndex = currentIndex + direction
    if (newIndex < 0 || newIndex >= conversations.length) return
    openDetail(conversations[newIndex].thread_uid, newIndex)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const currentConv = currentIndex >= 0 ? conversations[currentIndex] : null

  // Detail view
  if (detail) {
    return (
      <AdminLayout title="会話ログ詳細">
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => { setDetail(null); setCurrentIndex(-1) }}
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
          <button
            disabled={currentIndex <= 0}
            onClick={() => navigateDetail(-1)}
            style={{
              background: 'var(--bg-hover)',
              color: 'var(--text)',
              border: '1px solid var(--border-strong)',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: currentIndex <= 0 ? 'not-allowed' : 'pointer',
              opacity: currentIndex <= 0 ? 0.5 : 1,
              fontSize: 14,
            }}
          >
            ← 前へ
          </button>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            {currentIndex + 1} / {conversations.length}
          </span>
          <button
            disabled={currentIndex >= conversations.length - 1}
            onClick={() => navigateDetail(1)}
            style={{
              background: 'var(--bg-hover)',
              color: 'var(--text)',
              border: '1px solid var(--border-strong)',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: currentIndex >= conversations.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentIndex >= conversations.length - 1 ? 0.5 : 1,
              fontSize: 14,
            }}
          >
            次へ →
          </button>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 14, alignItems: 'center' }}>
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
            {currentConv?.events && (
              <div style={{ display: 'flex', gap: 8 }}>
                {currentConv.events.copy > 0 && (
                  <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>
                    Copy {currentConv.events.copy}
                  </span>
                )}
                {currentConv.events.share > 0 && (
                  <span style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>
                    Share {currentConv.events.share}
                  </span>
                )}
                {currentConv.events.review > 0 && (
                  <span style={{ background: 'rgba(245,158,11,0.15)', color: '#FBBF24', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>
                    Review {currentConv.events.review}
                  </span>
                )}
              </div>
            )}
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
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 100 }}>トピック</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 60 }}>件数</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 60 }}>👍</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 60 }}>👎</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 120 }}>アクション</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 120 }}>日時</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c, idx) => {
                  const topicStyle = TOPIC_COLORS[c.topic || 'その他'] || TOPIC_COLORS['その他']
                  return (
                    <tr
                      key={c.thread_uid}
                      onClick={() => openDetail(c.thread_uid, idx)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>
                        {c.restaurant_name}
                      </td>
                      <td style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--border)',
                        maxWidth: 250,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {c.summary || '(要約なし)'}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                        <span style={{
                          background: topicStyle.bg,
                          color: topicStyle.color,
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}>
                          {c.topic || 'その他'}
                        </span>
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
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                        {c.events ? (
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', fontSize: 11 }}>
                            {c.events.copy > 0 && <span style={{ color: '#60A5FA' }}>C:{c.events.copy}</span>}
                            {c.events.share > 0 && <span style={{ color: '#A78BFA' }}>S:{c.events.share}</span>}
                            {c.events.review > 0 && <span style={{ color: '#FBBF24' }}>R:{c.events.review}</span>}
                            {!c.events.copy && !c.events.share && !c.events.review && <span style={{ color: 'var(--muted)' }}>-</span>}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontSize: 13, color: 'var(--muted)' }}>
                        {formatDate(c.updated_at)}
                      </td>
                    </tr>
                  )
                })}
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
