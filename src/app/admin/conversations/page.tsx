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
import { useAdminLang } from '../../../hooks/useAdminLang'
import { getTopicLabel } from '../../../i18n/adminCopy'

const LANG_LABELS: Record<string, string> = {
  ja: '日本語', en: 'English', zh: '中文', 'zh-Hans': '简体中文', 'zh-TW': '繁體中文',
  ko: '한국어', th: 'ไทย', vi: 'Tiếng Việt', fr: 'Français', es: 'Español',
  pt: 'Português', de: 'Deutsch', it: 'Italiano', ru: 'Русский', id: 'Indonesia',
}

function parseUA(ua: string): string {
  let device = 'PC'
  if (/iPhone/.test(ua)) device = 'iPhone'
  else if (/iPad/.test(ua)) device = 'iPad'
  else if (/Android/.test(ua)) device = /Mobile/.test(ua) ? 'Android' : 'Android Tablet'

  let browser = ''
  if (/CriOS|Chrome/.test(ua) && !/Edg/.test(ua)) browser = 'Chrome'
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari'
  else if (/Edg/.test(ua)) browser = 'Edge'
  else if (/Firefox/.test(ua)) browser = 'Firefox'

  return browser ? `${device} / ${browser}` : device
}

const TOPIC_COLORS: Record<string, { bg: string; color: string }> = {
  'メニュー・料理': { bg: 'rgba(59,130,246,0.15)', color: '#60A5FA' },
  'アレルゲン': { bg: 'rgba(239,68,68,0.15)', color: '#F87171' },
  '店舗情報': { bg: 'rgba(16,185,129,0.15)', color: '#34D399' },
  'ドリンク': { bg: 'rgba(139,92,246,0.15)', color: '#A78BFA' },
  'おすすめ': { bg: 'rgba(245,158,11,0.15)', color: '#FBBF24' },
  'その他': { bg: 'rgba(148,163,184,0.15)', color: '#94A3B8' },
}

export default function ConversationsPage() {
  const { lang, t } = useAdminLang()
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [imagesOnly, setImagesOnly] = useState(false)

  // Detail view
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)

  const toast = useToast()

  const fetchConversations = async (p: number = 1, restaurantUid?: string, hasImages: boolean = false) => {
    try {
      setLoading(true)
      const res = await ConversationApi.getAll(p, 20, restaurantUid || undefined, hasImages || undefined)
      setConversations(res.result.items)
      setTotalPages(res.result.pages)
      setTotal(res.result.total)
      setPage(res.result.page)
    } catch (err) {
      toast('error', t.conversations.failedList)
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
    fetchConversations(1, restaurantUid, imagesOnly)
  }

  const handleImagesOnlyToggle = () => {
    const next = !imagesOnly
    setImagesOnly(next)
    fetchConversations(1, selectedRestaurant, next)
  }

  // お客さんが撮った画像をダウンロード（data URL も http URL も対応、失敗時は別タブで開く）
  const downloadImage = async (src: string, idx: number) => {
    try {
      const res = await fetch(src)
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      const ext = (blob.type.split('/')[1] || 'jpg').split('+')[0]
      a.download = `photo-${idx + 1}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objUrl)
    } catch {
      window.open(src, '_blank', 'noopener')
    }
  }

  const openDetail = async (threadUid: string, index: number) => {
    try {
      setDetailLoading(true)
      setCurrentIndex(index)
      const res = await ConversationApi.getDetail(threadUid)
      setDetail(res.result)
    } catch {
      toast('error', t.conversations.failedDetail)
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
    return d.toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const currentConv = currentIndex >= 0 ? conversations[currentIndex] : null

  // Detail view
  if (detail) {
    return (
      <AdminLayout title={t.conversations.titleDetail}>
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
            {t.conversations.backToList}
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
            {t.conversations.prev}
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
            {t.conversations.next}
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
              <span style={{ color: 'var(--muted)' }}>{t.conversations.detailStore}: </span>
              <span style={{ fontWeight: 600 }}>{detail.restaurant_name || '-'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>{t.conversations.detailSummary}: </span>
              <span>{detail.summary || t.conversations.summaryNone}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>{t.conversations.detailRallies}: </span>
              <span>{detail.messages.length}</span>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>{t.conversations.detailStart}: </span>
              <span>{formatDate(detail.created_at)}</span>
            </div>
            {detail.user_agent && (
              <div title={detail.user_agent}>
                <span style={{ color: 'var(--muted)' }}>{t.conversations.detailDevice}: </span>
                <span>{parseUA(detail.user_agent)}</span>
              </div>
            )}
            {(() => {
              const langCounts: Record<string, number> = {}
              detail.messages.forEach(m => { if (m.lang) langCounts[m.lang] = (langCounts[m.lang] || 0) + 1 })
              const entries = Object.entries(langCounts).sort((a, b) => b[1] - a[1])
              if (entries.length === 0) return null
              return (
                <div style={{ display: 'flex', gap: 4 }}>
                  {entries.map(([lang, count]) => (
                    <span key={lang} style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>
                      {LANG_LABELS[lang] || lang}: {count}
                    </span>
                  ))}
                </div>
              )
            })()}
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
              {/* お客さんが撮った画像 */}
              {msg.images && msg.images.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
                  {msg.images.map((src, i) => (
                    <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                      <a href={src} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt=""
                          style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border-strong)', display: 'block' }}
                        />
                      </a>
                      <button
                        onClick={() => downloadImage(src, i)}
                        title={lang === 'ja' ? '画像をダウンロード' : 'Download image'}
                        style={{
                          position: 'absolute', bottom: 6, right: 6,
                          background: 'rgba(0,0,0,0.65)', color: '#fff',
                          border: 'none', borderRadius: 6, padding: '4px 8px',
                          fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        ⬇
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', display: 'flex', gap: 8, justifyContent: 'center' }}>
                {msg.lang && msg.lang !== 'ja' && (
                  <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA', padding: '1px 6px', borderRadius: 4 }}>
                    {LANG_LABELS[msg.lang] || msg.lang}
                  </span>
                )}
                {formatDate(msg.created_at)}
              </div>
            </div>
          ))}
        </div>

        {detail.messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            {t.conversations.noMessages}
          </div>
        )}
      </AdminLayout>
    )
  }

  // List view
  return (
    <AdminLayout title={t.conversations.titleList}>
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
          <option value="">{t.conversations.allStores}</option>
          {restaurants.map((r) => (
            <option key={r.uid} value={r.uid}>{r.name}</option>
          ))}
        </select>
        <button
          onClick={handleImagesOnlyToggle}
          style={{
            background: imagesOnly ? 'rgba(59,130,246,0.15)' : 'var(--bg-input)',
            color: imagesOnly ? '#60A5FA' : 'var(--text-body)',
            border: `1px solid ${imagesOnly ? '#3B82F6' : 'var(--border-strong)'}`,
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: imagesOnly ? 600 : 400,
          }}
        >
          📷 {lang === 'ja' ? '画像あり' : 'With photos'}
        </button>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>
          {t.conversations.totalCount(total)}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          {t.layout.loading}
        </div>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          {t.conversations.empty}
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
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>{t.conversations.colStore}</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>{t.conversations.colSummary}</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 100 }}>{t.conversations.colTopic}</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 80 }}>{t.conversations.colLang}</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 60 }}>{t.conversations.colCount}</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 60 }}>👍</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 60 }}>👎</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 120 }}>{t.conversations.colActions}</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 120 }}>{t.conversations.colDate}</th>
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
                        {c.image_count ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            background: 'rgba(59,130,246,0.15)', color: '#60A5FA',
                            padding: '1px 6px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            marginRight: 6, verticalAlign: 'middle',
                          }}>📷 {c.image_count}</span>
                        ) : null}
                        {c.summary || t.conversations.noSummary}
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
                          {getTopicLabel(lang, c.topic || 'その他')}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                        {(() => {
                          const langs = c.langs || {}
                          const entries = Object.entries(langs).sort((a, b) => b[1] - a[1])
                          if (entries.length === 0) return <span style={{ color: 'var(--muted)', fontSize: 11 }}>-</span>
                          const primary = entries[0][0]
                          const label = LANG_LABELS[primary] || primary
                          return (
                            <span style={{ fontSize: 11, fontWeight: 500 }} title={entries.map(([l, c]) => `${LANG_LABELS[l] || l}: ${c}`).join(', ')}>
                              {label}{entries.length > 1 && <span style={{ color: 'var(--muted)' }}> +{entries.length - 1}</span>}
                            </span>
                          )
                        })()}
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
                onClick={() => fetchConversations(page - 1, selectedRestaurant, imagesOnly)}
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
                {t.common.prev}
              </button>
              <span style={{ padding: '6px 12px', fontSize: 13, color: 'var(--muted)' }}>
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchConversations(page + 1, selectedRestaurant, imagesOnly)}
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
                {t.common.next}
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
          <div style={{ color: '#fff', fontSize: 16 }}>{t.layout.loading}</div>
        </div>
      )}
    </AdminLayout>
  )
}
