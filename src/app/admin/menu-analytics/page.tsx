'use client'

import React, { useEffect, useState } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { MenuAnalyticsApi, MenuAnalyticsData, TokenService, RestaurantApi, Restaurant } from '../../../services/api'

const RANK_COLORS: Record<string, string> = {
  S: '#EF4444',
  A: '#F59E0B',
  B: '#3B82F6',
  C: '#10B981',
}
const RANK_LABELS: Record<string, string> = {
  S: '必ず確認',
  A: '要確認',
  B: '確認推奨',
  C: '確認不要',
}

const PALETTE = [
  '#3B82F6', '#06B6D4', '#8B5CF6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
  '#84CC16', '#A855F7', '#22D3EE', '#FB923C', '#E879F9',
]

function SummaryCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px',
    }}>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 16,
      fontWeight: 600,
      color: 'var(--text)',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottom: '1px solid var(--border)',
    }}>{children}</h2>
  )
}

function HorizontalBar({ items, maxCount }: { items: Array<{ label: string; count: number; sub?: string }>; maxCount: number }) {
  if (!items.length) return <div style={{ color: 'var(--muted)', fontSize: 13 }}>データなし</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 100, fontSize: 13, color: 'var(--text-body)', flexShrink: 0, textAlign: 'right' }}>
            {item.label}
          </div>
          <div style={{ flex: 1, background: 'var(--bg-hover)', borderRadius: 4, height: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${PALETTE[i % PALETTE.length]}cc, ${PALETTE[i % PALETTE.length]})`,
              borderRadius: 4,
              transition: 'width 0.5s ease',
              minWidth: item.count > 0 ? 2 : 0,
            }} />
          </div>
          <div style={{ width: 40, fontSize: 13, color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>
            {item.count}
          </div>
          {item.sub && (
            <div style={{ width: 70, fontSize: 11, color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>
              {item.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data, size = 180 }: { data: Array<{ label: string; value: number; color: string }>; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div style={{ color: 'var(--muted)', fontSize: 13 }}>データなし</div>

  let cumulative = 0
  const gradientParts = data.map(d => {
    const start = (cumulative / total) * 360
    cumulative += d.value
    const end = (cumulative / total) * 360
    return `${d.color} ${start}deg ${end}deg`
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `conic-gradient(${gradientParts.join(', ')})`,
        position: 'relative',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute',
          inset: size * 0.25,
          borderRadius: '50%',
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{total}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>品目</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text-body)' }}>{d.label}</span>
            <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 'auto' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RadarChart({ data, size = 240 }: { data: Array<{ label: string; value: number }>; size?: number }) {
  if (!data.length) return <div style={{ color: 'var(--muted)', fontSize: 13 }}>データなし</div>

  const maxVal = Math.max(...data.map(d => d.value), 1)
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.35
  const n = data.length
  const angleStep = (2 * Math.PI) / n

  const levels = [0.25, 0.5, 0.75, 1.0]
  const gridLines = levels.map(level => {
    const pts = Array.from({ length: n }, (_, i) => {
      const angle = i * angleStep - Math.PI / 2
      return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`
    })
    return pts.join(' ')
  })

  const dataPoints = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2
    const ratio = d.value / maxVal
    return `${cx + r * ratio * Math.cos(angle)},${cy + r * ratio * Math.sin(angle)}`
  })

  const labelPositions = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2
    const lr = r + 28
    return { x: cx + lr * Math.cos(angle), y: cy + lr * Math.sin(angle), label: d.label }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: '100%' }}>
      {gridLines.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="var(--border-strong)" strokeWidth={0.5} opacity={0.5} />
      ))}
      {data.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)}
            stroke="var(--border-strong)" strokeWidth={0.5} opacity={0.3}
          />
        )
      })}
      <polygon
        points={dataPoints.join(' ')}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="#3B82F6"
        strokeWidth={2}
      />
      {dataPoints.map((pt, i) => {
        const [x, y] = pt.split(',').map(Number)
        return <circle key={i} cx={x} cy={y} r={3} fill="#3B82F6" />
      })}
      {labelPositions.map((lp, i) => (
        <text key={i} x={lp.x} y={lp.y}
          textAnchor="middle" dominantBaseline="middle"
          fill="var(--muted)" fontSize={11}
        >{lp.label}</text>
      ))}
    </svg>
  )
}

export default function MenuAnalyticsPage() {
  const [data, setData] = useState<MenuAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedUid, setSelectedUid] = useState<string>('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const user = TokenService.getUser()
    const admin = user?.role === 'superadmin' || user?.role === 'platform_owner'
    setIsAdmin(admin)
    if (admin) {
      RestaurantApi.getAll(1, 100).then(res => {
        const list = res.result?.items || []
        setRestaurants(list)
        if (list.length > 0) setSelectedUid(list[0].uid)
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (isAdmin && !selectedUid && restaurants.length === 0) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await MenuAnalyticsApi.get(selectedUid || undefined)
        setData(res.result)
      } catch (e: any) {
        setError(e.message || 'データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedUid, isAdmin, restaurants.length])

  if (loading) {
    return (
      <AdminLayout title="メニュー分析">
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>読み込み中...</div>
      </AdminLayout>
    )
  }

  if (error || !data) {
    return (
      <AdminLayout title="メニュー分析">
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--error)' }}>{error || 'データなし'}</div>
      </AdminLayout>
    )
  }

  const rankData = ['S', 'A', 'B', 'C'].map(r => ({
    label: `${r} — ${RANK_LABELS[r]}`,
    value: data.rank_distribution[r] || 0,
    color: RANK_COLORS[r],
  }))

  const cookingData = data.cooking_method_distribution.map((d, i) => ({
    label: d.name_jp,
    value: d.count,
    color: PALETTE[i % PALETTE.length],
  }))

  const catMax = Math.max(...data.category_distribution.map(d => d.count), 1)
  const priceMax = Math.max(...data.price_ranges.map(d => d.count), 1)
  const ingMax = data.top_ingredients.length ? Math.max(...data.top_ingredients.map(d => d.count)) : 1
  const algMax = data.allergen_coverage.top_allergens.length ? Math.max(...data.allergen_coverage.top_allergens.map(d => d.count)) : 1
  const calMax = data.calorie_distribution.length ? Math.max(...data.calorie_distribution.map(d => d.count)) : 1

  const totalAllergenMenus = data.allergen_coverage.with_allergens + data.allergen_coverage.without_allergens
  const allergenPct = totalAllergenMenus > 0 ? Math.round((data.allergen_coverage.with_allergens / totalAllergenMenus) * 100) : 0

  return (
    <AdminLayout title="メニュー分析">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Restaurant Selector (admin only) */}
        {isAdmin && restaurants.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 14, color: 'var(--muted)', flexShrink: 0 }}>店舗:</label>
            <select
              value={selectedUid}
              onChange={e => setSelectedUid(e.target.value)}
              style={{
                flex: 1,
                maxWidth: 320,
                padding: '8px 12px',
                background: 'var(--bg-input)',
                color: 'var(--text)',
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              {restaurants.map(r => (
                <option key={r.uid} value={r.uid}>{r.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <SummaryCard label="総メニュー数" value={data.total_menus} />
          <SummaryCard label="提供中" value={data.active_menus} />
          <SummaryCard label="平均価格" value={`¥${data.avg_price.toLocaleString()}`} />
          <SummaryCard label="平均完成度" value={`${data.avg_confidence}%`} />
        </div>

        {/* Row: Rank + Cooking Methods */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <SectionTitle>確認優先度</SectionTitle>
            <DonutChart data={rankData} />
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <SectionTitle>調理法分布</SectionTitle>
            <DonutChart data={cookingData} />
          </div>
        </div>

        {/* Category Distribution */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <SectionTitle>カテゴリ構成</SectionTitle>
          <HorizontalBar
            items={data.category_distribution.map(d => ({
              label: d.label,
              count: d.count,
              sub: `¥${d.avg_price.toLocaleString()}`,
            }))}
            maxCount={catMax}
          />
        </div>

        {/* Price Ranges */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <SectionTitle>価格帯分布</SectionTitle>
          <HorizontalBar
            items={data.price_ranges.map(d => ({ label: `${d.range}円`, count: d.count }))}
            maxCount={priceMax}
          />
        </div>

        {/* Top Ingredients */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <SectionTitle>食材 TOP{Math.min(data.top_ingredients.length, 15)}</SectionTitle>
          <HorizontalBar
            items={data.top_ingredients.slice(0, 15).map(d => ({ label: d.name, count: d.count }))}
            maxCount={ingMax}
          />
        </div>

        {/* Taste Profile Radar */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <SectionTitle>味覚プロファイル</SectionTitle>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarChart
              data={data.taste_profile_distribution.map(d => ({ label: d.name_jp, value: d.count }))}
              size={300}
            />
          </div>
        </div>

        {/* Allergen Coverage */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <SectionTitle>アレルゲン情報</SectionTitle>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
              アレルゲン登録済み: {data.allergen_coverage.with_allergens}品 / 未登録: {data.allergen_coverage.without_allergens}品 ({allergenPct}%)
            </div>
            <div style={{ height: 20, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              <div style={{
                width: `${allergenPct}%`,
                background: 'linear-gradient(90deg, #10B981, #06B6D4)',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
          <HorizontalBar
            items={data.allergen_coverage.top_allergens.map(d => ({ label: d.name_jp, count: d.count }))}
            maxCount={algMax}
          />
        </div>

        {/* Calorie Distribution */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
          <SectionTitle>カロリー帯分布</SectionTitle>
          <HorizontalBar
            items={data.calorie_distribution.map(d => ({ label: d.name_jp, count: d.count }))}
            maxCount={calMax}
          />
        </div>

      </div>
    </AdminLayout>
  )
}
