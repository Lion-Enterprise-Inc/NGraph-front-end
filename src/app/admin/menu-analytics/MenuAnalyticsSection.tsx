'use client'

import React, { useEffect, useState } from 'react'
import { MenuAnalyticsApi, MenuAnalyticsData } from '../../../services/api'
import { useAdminLang } from '../../../hooks/useAdminLang'
import type { AdminCopy } from '../../../i18n/adminCopy'

const RANK_COLORS: Record<string, string> = {
  S: '#EF4444',
  A: '#F59E0B',
  B: '#4A9EFF',
  C: '#10B981',
}

const PALETTE = [
  '#4A9EFF', '#36B5FF', '#5B7FFF', '#2DD4A8', '#FFB547',
  '#FF6B8A', '#A78BFA', '#38BDF8', '#FF8F47', '#818CF8',
  '#34D399', '#C084FC', '#22D3EE', '#FB923C', '#F472B6',
]

const MONO = "'SF Mono', 'Cascadia Code', 'Consolas', 'Monaco', monospace"

// レーダーに表示する味覚（分かりやすいものだけ）
const TASTE_DISPLAY = ['甘味', '酸味', '塩味', '苦味', '旨味', '辛味', 'コク', 'さっぱり', 'まろやか', '香ばしい']

function topNWithOther(items: Array<{ label: string; value: number; color?: string }>, otherLabel: string, n: number = 8) {
  if (items.length <= n + 1) return items.map((d, i) => ({ ...d, color: d.color || PALETTE[i % PALETTE.length] }))
  const top = items.slice(0, n)
  const otherSum = items.slice(n).reduce((s, d) => s + d.value, 0)
  const result = top.map((d, i) => ({ ...d, color: d.color || PALETTE[i % PALETTE.length] }))
  if (otherSum > 0) result.push({ label: otherLabel, value: otherSum, color: '#64748B' })
  return result
}

function generateStoreCharacter(data: MenuAnalyticsData, t: AdminCopy): string[] {
  const lines: string[] = []

  const protein = (data.protein_distribution || []).sort((a, b) => b.count - a.count)
  const topProtein = protein.filter(p => p.count > 0).slice(0, 2)
  if (topProtein.length > 0) {
    const names = topProtein.map(p => p.label.replace('料理', '')).join('・')
    lines.push(t.menuAnalytics.charProteinSuffix(names))
  }

  const drinks = (data.drink_breakdown || []).filter(d => d.count > 0).sort((a, b) => b.count - a.count)
  if (drinks.length > 0 && drinks[0].label !== 'ソフトドリンク') {
    lines.push(t.menuAnalytics.charDrinkSuffix(drinks[0].label))
  }

  const tastes = data.taste_profile_distribution.filter(d => d.count > 0).sort((a, b) => b.count - a.count)
  if (tastes.length >= 2) {
    const topTastes = tastes.slice(0, 3).map(d => d.name_jp).join('・')
    lines.push(t.menuAnalytics.charTasteSuffix(topTastes))
  }

  const avgPrice = data.avg_price
  if (avgPrice <= 1000) {
    lines.push(t.menuAnalytics.charPriceLow)
  } else if (avgPrice <= 2000) {
    lines.push(t.menuAnalytics.charPriceMid)
  } else if (avgPrice <= 3500) {
    lines.push(t.menuAnalytics.charPriceHigh)
  } else {
    lines.push(t.menuAnalytics.charPriceVeryHigh)
  }

  const composition = (data.menu_composition || []).filter(d => d.count > 0).sort((a, b) => b.count - a.count)
  if (composition.length >= 2) {
    const topCats = composition.slice(0, 3).map(c => c.label).join('・')
    lines.push(t.menuAnalytics.charFoodCenterSuffix(topCats))
  }

  return lines
}

function SummaryCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--bg-surface), rgba(74,158,255,0.04))',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px 20px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', fontFamily: MONO, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--muted)',
      marginBottom: 20,
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
    }}>{children}</h2>
  )
}

function DonutChart({ data: rawData, size = 200, centerLabel, noDataLabel, defaultCenterLabel }: { data: Array<{ label: string; value: number; color: string }>; size?: number; centerLabel?: string; noDataLabel: string; defaultCenterLabel: string }) {
  const data = [...rawData].sort((a, b) => b.value - a.value)
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div style={{ color: 'var(--muted)', fontSize: 13 }}>{noDataLabel}</div>

  const thickness = size * 0.18
  const radius = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const gap = data.length > 1 ? 1.5 : 0

  let cumAngle = -90

  const arcs = data.map((d) => {
    const angle = (d.value / total) * 360
    const startAngle = cumAngle + gap / 2
    const endAngle = cumAngle + angle - gap / 2
    cumAngle += angle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const largeArc = angle - gap > 180 ? 1 : 0

    const x1 = cx + radius * Math.cos(startRad)
    const y1 = cy + radius * Math.sin(startRad)
    const x2 = cx + radius * Math.cos(endRad)
    const y2 = cy + radius * Math.sin(endRad)

    return {
      d: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      color: d.color,
    }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--bg-hover)" strokeWidth={thickness} opacity={0.3} />
          {arcs.map((arc, i) => (
            <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth={thickness} strokeLinecap="butt" />
          ))}
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', fontFamily: MONO }}>{total}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{centerLabel || defaultCenterLabel}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
        {data.map((d, i) => {
          const pct = Math.round((d.value / total) * 100)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: d.color,
                flexShrink: 0,
                boxShadow: `0 0 6px ${d.color}66`,
              }} />
              <span style={{ fontSize: 13, color: 'var(--text-body)', flex: 1 }}>{d.label}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO, fontVariantNumeric: 'tabular-nums' }}>
                {d.value}
              </span>
              <span style={{
                fontSize: 11,
                color: d.color,
                fontWeight: 600,
                width: 36,
                textAlign: 'right',
                fontFamily: MONO,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HorizontalBarChart({ data, unitLabel }: { data: Array<{ label: string; value: number; color: string }>; unitLabel: string }) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.map((d, i) => {
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
        const barWidth = (d.value / maxVal) * 100
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--text-body)' }}>{d.label}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO, fontVariantNumeric: 'tabular-nums' }}>
                {d.value}{unitLabel} ({pct}%)
              </span>
            </div>
            <div style={{
              height: 8,
              background: 'var(--bg-hover)',
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${barWidth}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${d.color}, ${d.color}CC)`,
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RadarChart({ data, size = 240, noDataLabel }: { data: Array<{ label: string; value: number }>; size?: number; noDataLabel: string }) {
  if (!data.length) return <div style={{ color: 'var(--muted)', fontSize: 13 }}>{noDataLabel}</div>

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
      <defs>
        <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A9EFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#36B5FF" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {gridLines.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="var(--border-strong)" strokeWidth={0.5} opacity={0.4} />
      ))}
      {data.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)}
            stroke="var(--border-strong)" strokeWidth={0.5} opacity={0.25}
          />
        )
      })}
      <polygon
        points={dataPoints.join(' ')}
        fill="url(#radarFill)"
        stroke="#4A9EFF"
        strokeWidth={2}
      />
      {dataPoints.map((pt, i) => {
        const [x, y] = pt.split(',').map(Number)
        return <circle key={i} cx={x} cy={y} r={3.5} fill="#4A9EFF" stroke="var(--bg-surface)" strokeWidth={1.5} />
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

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '28px',
}

export default function MenuAnalyticsSection({ uid }: { uid?: string }) {
  const { t } = useAdminLang()
  const RANK_LABELS: Record<string, string> = {
    S: t.menuAnalytics.rankS,
    A: t.menuAnalytics.rankA,
    B: t.menuAnalytics.rankB,
    C: t.menuAnalytics.rankC,
  }
  const RANK_HINTS: Record<string, string> = {
    S: t.menuAnalytics.rankHintS,
    A: t.menuAnalytics.rankHintA,
    B: t.menuAnalytics.rankHintB,
    C: t.menuAnalytics.rankHintC,
  }
  const [data, setData] = useState<MenuAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await MenuAnalyticsApi.get(uid || undefined)
        setData(res.result)
      } catch (e: any) {
        setError(e.message || t.menuAnalytics.fetchFailed)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>{t.layout.loading}</div>
  }

  if (error || !data) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--error)' }}>{error || t.menuAnalytics.noData}</div>
  }

  const storeCharacter = generateStoreCharacter(data, t)
  const otherLabel = t.menuAnalytics.other

  const rankData = ['S', 'A', 'B', 'C'].map(r => ({
    label: `${r} — ${RANK_LABELS[r]}`,
    value: data.rank_distribution[r] || 0,
    color: RANK_COLORS[r],
  }))

  const categoryData = topNWithOther(
    data.category_distribution.map(d => ({ label: d.label, value: d.count })),
    otherLabel,
  )

  const cookingData = topNWithOther(
    data.cooking_method_distribution.map(d => ({ label: d.name_jp, value: d.count })),
    otherLabel,
  )

  const priceData = data.price_ranges.map((d, i) => ({
    label: t.menuAnalytics.yenSuffix(d.range),
    value: d.count,
    color: PALETTE[i % PALETTE.length],
  }))

  const ingredientData = topNWithOther(
    data.top_ingredients.slice(0, 15).map(d => ({ label: d.name, value: d.count })),
    otherLabel,
    8,
  )

  const allergenDonutData = topNWithOther(
    data.allergen_coverage.top_allergens.map(d => ({ label: d.name_jp, value: d.count })),
    otherLabel,
    10,
  )

  const calorieData = topNWithOther(
    data.calorie_distribution.map(d => ({ label: d.name_jp, value: d.count })),
    otherLabel,
  )

  // 味覚プロファイル: 分かりやすいものだけ＆データがあるものに絞る
  const tasteData = data.taste_profile_distribution
    .filter(d => d.count > 0 && TASTE_DISPLAY.includes(d.name_jp))

  const proteinData = topNWithOther(
    (data.protein_distribution || []).filter(d => d.count > 0).map(d => ({ label: d.label, value: d.count })),
    otherLabel,
  )

  const compositionData = topNWithOther(
    (data.menu_composition || []).filter(d => d.count > 0).map(d => ({ label: d.label, value: d.count })),
    otherLabel,
  )

  const drinkDonutData = topNWithOther(
    (data.drink_breakdown || []).filter(d => d.count > 0).map(d => ({ label: d.label, value: d.count })),
    otherLabel,
  )

  const totalAllergenMenus = data.allergen_coverage.with_allergens + data.allergen_coverage.without_allergens
  const allergenPct = totalAllergenMenus > 0 ? Math.round((data.allergen_coverage.with_allergens / totalAllergenMenus) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Summary Cards（分析は提供中ベース。平均完成度は非表示） */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <SummaryCard
          label={t.menuAnalytics.summaryActive}
          value={data.total_menus}
          sub={data.archived_menus ? t.menuAnalytics.archivedSub(data.archived_menus) : undefined}
        />
        <SummaryCard label={t.menuAnalytics.summaryAvgPrice} value={`¥${data.avg_price.toLocaleString()}`} />
      </div>

      {/* ── 店舗の特徴 ── */}
      {storeCharacter.length > 0 && (
        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, var(--bg-surface), rgba(74,158,255,0.06))',
          borderColor: 'rgba(74,158,255,0.2)',
        }}>
          <SectionTitle>{t.menuAnalytics.storeCharacter}</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {storeCharacter.map((line, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{line}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── メニュー構成 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        <div style={cardStyle}>
          <SectionTitle>{t.menuAnalytics.categoryComposition}</SectionTitle>
          <DonutChart data={categoryData} noDataLabel={t.menuAnalytics.noData} defaultCenterLabel={t.menuAnalytics.centerItems} />
        </div>
        <div style={cardStyle}>
          <SectionTitle>{t.menuAnalytics.foodComposition}</SectionTitle>
          <DonutChart data={compositionData} centerLabel={t.menuAnalytics.centerFood} noDataLabel={t.menuAnalytics.noData} defaultCenterLabel={t.menuAnalytics.centerItems} />
        </div>
      </div>
      {drinkDonutData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          <div style={cardStyle}>
            <SectionTitle>{t.menuAnalytics.drinkBreakdown}</SectionTitle>
            <DonutChart data={drinkDonutData} noDataLabel={t.menuAnalytics.noData} defaultCenterLabel={t.menuAnalytics.centerItems} />
          </div>
        </div>
      )}

      {/* ── 食材・調理・味覚 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        <div style={cardStyle}>
          <SectionTitle>{t.menuAnalytics.proteinDistribution}</SectionTitle>
          <DonutChart data={proteinData} noDataLabel={t.menuAnalytics.noData} defaultCenterLabel={t.menuAnalytics.centerItems} />
        </div>
        <div style={cardStyle}>
          <SectionTitle>{t.menuAnalytics.topIngredients(Math.min(ingredientData.length, 8))}</SectionTitle>
          <DonutChart data={ingredientData} noDataLabel={t.menuAnalytics.noData} defaultCenterLabel={t.menuAnalytics.centerItems} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        <div style={cardStyle}>
          <SectionTitle>{t.menuAnalytics.cookingMethods}</SectionTitle>
          <DonutChart data={cookingData} noDataLabel={t.menuAnalytics.noData} defaultCenterLabel={t.menuAnalytics.centerItems} />
        </div>
        {calorieData.length > 0 && (
          <div style={cardStyle}>
            <SectionTitle>{t.menuAnalytics.calorieDistribution}</SectionTitle>
            <DonutChart data={calorieData} noDataLabel={t.menuAnalytics.noData} defaultCenterLabel={t.menuAnalytics.centerItems} />
          </div>
        )}
      </div>

      {/* 味覚プロファイル */}
      <div style={cardStyle}>
        <SectionTitle>{t.menuAnalytics.tasteProfile}</SectionTitle>
        {tasteData.length >= 3 ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarChart
              data={tasteData.map(d => ({ label: d.name_jp, value: d.count }))}
              size={300}
              noDataLabel={t.menuAnalytics.noData}
            />
          </div>
        ) : tasteData.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tasteData.map((d, i) => (
              <span key={i} style={{ padding: '4px 12px', background: '#1E3A5F', borderRadius: 12, fontSize: 13, color: '#F8FAFC' }}>
                {d.name_jp} ({d.count})
              </span>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t.menuAnalytics.noData}</div>
        )}
      </div>

      {/* ── 安全管理 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        <div style={cardStyle}>
          <SectionTitle>{t.menuAnalytics.rankPriority}</SectionTitle>
          <DonutChart data={rankData} noDataLabel={t.menuAnalytics.noData} defaultCenterLabel={t.menuAnalytics.centerItems} />
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['S', 'A', 'B', 'C'].map(r => (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--muted)' }}>
                <span style={{ fontWeight: 700, color: RANK_COLORS[r], width: 14 }}>{r}</span>
                <span>{RANK_HINTS[r]}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={cardStyle}>
          <SectionTitle>{t.menuAnalytics.allergenInfo}</SectionTitle>
          <div style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              color: 'var(--muted)',
              marginBottom: 6,
            }}>
              <span>{t.menuAnalytics.registered} <span style={{ fontFamily: MONO }}>{data.allergen_coverage.with_allergens}</span>{t.menuAnalytics.units}</span>
              <span style={{ fontFamily: MONO }}>{allergenPct}%</span>
            </div>
            <div style={{
              height: 6,
              background: 'var(--bg-hover)',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${allergenPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #4A9EFF, #36B5FF)',
                borderRadius: 3,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
          <DonutChart data={allergenDonutData} size={160} noDataLabel={t.menuAnalytics.noData} defaultCenterLabel={t.menuAnalytics.centerItems} />
        </div>
      </div>

      {/* ── 価格分析（最下部） ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        <div style={cardStyle}>
          <SectionTitle>{t.menuAnalytics.priceRange}</SectionTitle>
          <DonutChart data={priceData} centerLabel={t.menuAnalytics.centerAll} noDataLabel={t.menuAnalytics.noData} defaultCenterLabel={t.menuAnalytics.centerItems} />
        </div>
      </div>
      {(data.category_price_ranges || []).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {(data.category_price_ranges || []).slice(0, 6).map(cp => {
            const cpData = cp.ranges.map((r, i) => ({
              label: t.menuAnalytics.yenSuffix(r.range),
              value: r.count,
              color: PALETTE[i % PALETTE.length],
            }))
            return (
              <div key={cp.category} style={cardStyle}>
                <SectionTitle>{t.menuAnalytics.priceRangeBy(cp.label)}</SectionTitle>
                <HorizontalBarChart data={cpData} unitLabel={t.menuAnalytics.units} />
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
