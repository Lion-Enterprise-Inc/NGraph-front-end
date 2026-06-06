'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '../../../services/api'
import { useAdminLang } from '../../../hooks/useAdminLang'

const LANG_COLORS: Record<string, string> = {
  ja: '#3B82F6',
  en: '#10B981',
  zh: '#EF4444',
  ko: '#8B5CF6',
}

function LangBar({ dist, label }: { dist: Record<string, number> | null | undefined; label: string }) {
  if (!dist) return null
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return null

  return (
    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: '#94A3B8' }}>{label}</span>
      {entries.map(([lang, count]) => {
        const pct = Math.round((count / total) * 100)
        const color = LANG_COLORS[lang] || '#64748B'
        return (
          <span key={lang} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#E2E8F0' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <strong style={{ color }}>{lang}</strong> {count}
            <span style={{ color: '#64748B' }}>({pct}%)</span>
          </span>
        )
      })}
    </div>
  )
}

// ログページ上部のサマリー: イベント/チャット/セッションの利用統計
export default function UsageSummary({ restaurantUid }: { restaurantUid?: string }) {
  const { t } = useAdminLang()
  const [eventStats, setEventStats] = useState<any>(null)
  const [messageStats, setMessageStats] = useState<any>(null)
  const [sessionStats, setSessionStats] = useState<any>(null)

  useEffect(() => {
    const q = restaurantUid ? `?restaurant_uid=${restaurantUid}` : ''
    apiClient.get(`/admin/event-stats${q}`).then((r: any) => setEventStats(r.result)).catch(() => setEventStats(null))
    apiClient.get(`/admin/message-stats${q}`).then((r: any) => setMessageStats(r.result)).catch(() => setMessageStats(null))
    apiClient.get(`/admin/session-stats${q}`).then((r: any) => setSessionStats(r.result)).catch(() => setSessionStats(null))
  }, [restaurantUid])

  const events = [
    { label: 'Good', key: 'good', color: '#10B981' },
    { label: 'Bad', key: 'bad', color: '#EF4444' },
    { label: 'Copy', key: 'copy', color: '#3B82F6' },
    { label: 'Share', key: 'share', color: '#8B5CF6' },
    { label: 'Review', key: 'review', color: '#F59E0B' },
    { label: 'Scan', key: 'scan', color: '#06B6D4' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
      {/* イベントログ統計 */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>{t.dashboard.eventLogStats}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))', gap: 10 }}>
          {events.map(item => (
            <div key={item.key} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, border: '1px solid #1E293B', background: '#0F172A' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{eventStats?.[item.key] ?? '-'}</div>
            </div>
          ))}
        </div>
        <LangBar dist={eventStats?.lang_distribution} label={t.dashboard.langDistribution} />
      </div>

      {/* チャット統計 + セッション統計 を横並び */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {messageStats && messageStats.lang_distribution && Object.keys(messageStats.lang_distribution).length > 0 && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>{t.dashboard.chatStatsLabel(messageStats.total_messages)}</div>
            <LangBar dist={messageStats.lang_distribution} label={t.dashboard.langDistribution} />
          </div>
        )}
        {sessionStats && sessionStats.total_sessions > 0 && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>{t.dashboard.sessionStats}</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 110, padding: '12px 20px', background: '#1E293B', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>{t.dashboard.sessionCount}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#3B82F6' }}>{sessionStats.total_sessions}</div>
              </div>
              <div style={{ flex: 1, minWidth: 110, padding: '12px 20px', background: '#1E293B', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>{t.dashboard.avgStay}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#10B981' }}>
                  {sessionStats.avg_duration >= 60 ? `${Math.floor(sessionStats.avg_duration / 60)}${t.dashboard.minute}` : `${sessionStats.avg_duration}${t.dashboard.second}`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
