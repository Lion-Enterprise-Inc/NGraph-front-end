'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search } from 'lucide-react'
import { ExploreApi, SemanticSearchApi, SearchRestaurant, NfgSearchRestaurant, CityCount, PlatformStats } from '../services/api'

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; alpha: number
  char: string
  life: number; maxLife: number
}

function BinaryField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let particles: Particle[] = []
    const COUNT = 35
    let pointer = { x: -9999, y: -9999, active: false }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true }
    }
    const onTouch = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const t = e.touches[0]
      if (t) pointer = { x: t.clientX - rect.left, y: t.clientY - rect.top, active: true }
    }
    const onLeave = () => { pointer.active = false }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('touchmove', onTouch, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('touchend', onLeave)

    const spawn = (w: number, h: number): Particle => {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.15 + Math.random() * 0.25
      const size = 9 + Math.floor(Math.random() * 3) * 2 // 9, 11, 13
      const cx = w / 2, cy = h / 2
      const spread = Math.min(w, h) * 0.42
      return {
        x: cx + (Math.random() - 0.5) * spread * 2,
        y: cy + (Math.random() - 0.5) * spread * 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        alpha: 0.08 + Math.random() * 0.18,
        char: Math.random() > 0.5 ? '1' : '0',
        life: 0,
        maxLife: 300 + Math.random() * 400,
      }
    }

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      particles = Array.from({ length: COUNT }, () => {
        const p = spawn(canvas.width, canvas.height)
        p.life = Math.random() * p.maxLife
        return p
      })
    }
    resize()
    window.addEventListener('resize', resize)

    const SYNAPSE_DIST = 80
    const alphas: number[] = new Array(COUNT).fill(0)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const cx = canvas.width / 2
      const cy = canvas.height / 2
      const radius = Math.min(canvas.width, canvas.height) * 0.45

      // update & compute visible alpha
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // attract to pointer
        if (pointer.active) {
          const pdx = pointer.x - p.x
          const pdy = pointer.y - p.y
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy)
          if (pdist < 150 && pdist > 1) {
            const force = 0.15 * (1 - pdist / 150)
            p.vx += (pdx / pdist) * force
            p.vy += (pdy / pdist) * force
          }
        }

        // dampen velocity
        p.vx *= 0.98
        p.vy *= 0.98
        p.x += p.vx
        p.y += p.vy
        p.life++

        const lifeRatio = p.life / p.maxLife
        const lifeFade = lifeRatio < 0.1 ? lifeRatio / 0.1
          : lifeRatio > 0.85 ? (1 - lifeRatio) / 0.15
          : 1

        const dx = (p.x - cx) / radius
        const dy = (p.y - cy) / radius
        const dist = Math.sqrt(dx * dx + dy * dy)
        const radialFade = Math.max(0, 1 - dist * dist)

        alphas[i] = p.alpha * lifeFade * radialFade

        if (p.life >= p.maxLife || dist > 1.5) {
          particles[i] = spawn(canvas.width, canvas.height)
          alphas[i] = 0
        }
      }

      // synapses — thin lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        if (alphas[i] < 0.008) continue
        for (let j = i + 1; j < particles.length; j++) {
          if (alphas[j] < 0.008) continue
          const ddx = particles[i].x - particles[j].x
          const ddy = particles[i].y - particles[j].y
          const d = Math.sqrt(ddx * ddx + ddy * ddy)
          if (d < SYNAPSE_DIST) {
            const lineAlpha = Math.min(alphas[i], alphas[j]) * (1 - d / SYNAPSE_DIST) * 0.7
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y - particles[i].size * 0.3)
            ctx.lineTo(particles[j].x, particles[j].y - particles[j].size * 0.3)
            ctx.strokeStyle = `rgba(16, 163, 127, ${lineAlpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // draw characters
      ctx.font = `11px 'SF Mono', 'Fira Code', monospace`
      for (let i = 0; i < particles.length; i++) {
        if (alphas[i] < 0.005) continue
        const p = particles[i]
        ctx.fillStyle = `rgba(16, 163, 127, ${alphas[i]})`
        if (p.size !== 11) ctx.font = `${p.size}px 'SF Mono', 'Fira Code', monospace`
        ctx.fillText(p.char, p.x, p.y)
        if (p.size !== 11) ctx.font = `11px 'SF Mono', 'Fira Code', monospace`
      }

    }

    let last = 0
    const loop = (time: number) => {
      animId = requestAnimationFrame(loop)
      if (time - last < 33) return // cap ~30fps
      last = time
      draw()
    }
    animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('touchmove', onTouch)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('touchend', onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="matrix-rain" />
}

const QUICK_TAPS = [
  '蟹', '海鮮', '寿司', '焼き鳥', 'ラーメン', 'そば', '居酒屋',
  'ランチ', 'コース', '接待',
]

const NFG_TRIGGER_WORDS = [
  '食べたい', 'おすすめ', '向け', '向き', '接待', '宴会', 'ランチ', 'デザート',
  '海鮮', '刺身', '寿司', '天ぷら', 'ラーメン', 'そば', '焼き鳥', '鍋',
  '蟹', 'カニ', 'かに', '肉', '魚', 'へしこ', '甘えび', '地酒', '日本酒',
  '県外', '観光', 'コース', 'ドリンク', 'パン',
  '片町', '駅前', '順化', '大名町', '敦賀', '鯖江', '越前', 'あわら',
]

function isNfgQuery(q: string): boolean {
  if (q.length < 2) return false
  return NFG_TRIGGER_WORDS.some(w => q.includes(w))
}

type SortKey = 'score' | 'menu_count'
type DisplayRestaurant = (SearchRestaurant | NfgSearchRestaurant) & { _nfg?: boolean }

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [cities, setCities] = useState<CityCount[]>([])
  const [restaurants, setRestaurants] = useState<DisplayRestaurant[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [searched, setSearched] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('score')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const pageRef = useRef<HTMLDivElement>(null)
  const [exploreMode, setExploreMode] = useState<'semantic' | 'scene' | 'mood' | 'name' | null>(null)
  const [selectedDiets, setSelectedDiets] = useState<Set<string>>(new Set())
  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(new Set())
  const [selectedScenes, setSelectedScenes] = useState<Set<string>>(new Set())
  const [selectedMoods, setSelectedMoods] = useState<Set<string>>(new Set())
  const [semanticQuery, setSemanticQuery] = useState('')
  const [visitType, setVisitType] = useState<string | null>(null)
  const [recentFood, setRecentFood] = useState<string | null>(null)
  const [flowCount, setFlowCount] = useState<number | null>(null)
  const [flowLoading, setFlowLoading] = useState(false)
  const countDebounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Proximity glow: elements near pointer get accent color
  useEffect(() => {
    if (searched) return
    const el = pageRef.current
    if (!el) return
    const RADIUS = 120
    let rafPending = false
    let lastPx = 0, lastPy = 0
    const update = () => {
      rafPending = false
      const glowEls = el.querySelectorAll<HTMLElement>('.glow-target')
      glowEls.forEach(g => {
        const rect = g.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dist = Math.sqrt((lastPx - cx) ** 2 + (lastPy - cy) ** 2)
        const intensity = Math.max(0, 1 - dist / RADIUS)
        g.style.setProperty('--glow', String(intensity))
      })
    }
    const schedule = (px: number, py: number) => {
      lastPx = px; lastPy = py
      if (!rafPending) { rafPending = true; requestAnimationFrame(update) }
    }
    const onMouse = (e: MouseEvent) => schedule(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) schedule(t.clientX, t.clientY)
    }
    const onLeave = () => {
      const glowEls = el.querySelectorAll<HTMLElement>('.glow-target')
      glowEls.forEach(g => g.style.setProperty('--glow', '0'))
    }
    document.addEventListener('mousemove', onMouse)
    document.addEventListener('touchmove', onTouch, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('mousemove', onMouse)
      document.removeEventListener('touchmove', onTouch)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [searched])

  const fetchRestaurants = useCallback(async (q: string, c: string, p: number) => {
    setLoading(true)
    try {
      if (q && isNfgQuery(q)) {
        const res = await ExploreApi.nfgSearch(q, c, p, 30)
        const items: DisplayRestaurant[] = res.result.items.map(r => ({ ...r, _nfg: true }))
        setRestaurants(items)
        setTotal(res.result.total)
        setPages(res.result.pages)
      } else {
        const res = await ExploreApi.search(q, c, p, 30)
        // fallback to NFG search if text search returns 0 and query is 2+ chars
        if (res.result.total === 0 && q.length >= 2) {
          const nfg = await ExploreApi.nfgSearch(q, c, p, 30)
          const items: DisplayRestaurant[] = nfg.result.items.map(r => ({ ...r, _nfg: true }))
          setRestaurants(items)
          setTotal(nfg.result.total)
          setPages(nfg.result.pages)
        } else {
          setRestaurants(res.result.items)
          setTotal(res.result.total)
          setPages(res.result.pages)
        }
      }
    } catch (err) {
      console.error('fetchRestaurants error:', err)
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    ExploreApi.cities().then(res => setCities(res.result)).catch(() => {})
    ExploreApi.stats().then(res => setStats(res.result)).catch(() => {})
  }, [fetchRestaurants])

  const handleSearch = (q: string) => {
    setQuery(q)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length >= 1) {
      setSearched(true)
      debounceRef.current = setTimeout(() => fetchRestaurants(q, city, 1), 300)
    } else {
      setSearched(!!city)
      if (city) {
        debounceRef.current = setTimeout(() => fetchRestaurants('', city, 1), 300)
      } else {
        setRestaurants([])
        setTotal(0)
        setPages(1)
      }
    }
  }

  const handleCity = (c: string) => {
    const next = city === c ? '' : c
    setCity(next)
    setPage(1)
    if (next || query) {
      setSearched(true)
      fetchRestaurants(query, next, 1)
    } else {
      setSearched(false)
      setRestaurants([])
      setTotal(0)
      setPages(1)
    }
  }

  const handlePage = (p: number) => {
    setPage(p)
    fetchRestaurants(query, city, p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSort = (key: SortKey) => {
    setSortBy(key)
    setRestaurants(prev => {
      const sorted = [...prev]
      if (key === 'menu_count') {
        sorted.sort((a, b) => b.menu_count - a.menu_count)
      } else {
        sorted.sort((a, b) => {
          const sa = (a as NfgSearchRestaurant).score ?? 0
          const sb = (b as NfgSearchRestaurant).score ?? 0
          return sb - sa || b.menu_count - a.menu_count
        })
      }
      return sorted
    })
  }

  const fetchFlowCount = useCallback(async () => {
    const params: Record<string, string> = {}
    if (selectedDiets.size > 0) params.diet = Array.from(selectedDiets).join(',')
    if (selectedAllergens.size > 0) params.no = Array.from(selectedAllergens).join(',')
    if (selectedScenes.size > 0) params.scene = Array.from(selectedScenes).join(',')
    if (selectedMoods.size > 0) params.mood = Array.from(selectedMoods).join(',')
    if (city) params.area = city
    if (semanticQuery.trim()) params.q = semanticQuery.trim()

    if (Object.keys(params).length === 0) {
      setFlowCount(null)
      return
    }

    setFlowLoading(true)
    try {
      const res = await SemanticSearchApi.count(params)
      setFlowCount(res.result.count)
    } catch {
      setFlowCount(null)
    } finally {
      setFlowLoading(false)
    }
  }, [selectedDiets, selectedAllergens, selectedScenes, selectedMoods, city, semanticQuery])

  useEffect(() => {
    if (countDebounceRef.current) clearTimeout(countDebounceRef.current)
    countDebounceRef.current = setTimeout(() => fetchFlowCount(), 300)
    return () => { if (countDebounceRef.current) clearTimeout(countDebounceRef.current) }
  }, [fetchFlowCount])

  const toggleSet = (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) => {
    setFn(prev => {
      const next = new Set(prev)
      if (next.has(val)) next.delete(val)
      else next.add(val)
      return next
    })
  }

  const selectMood = (val: string) => {
    setSelectedMoods(prev => {
      const next = new Set<string>()
      if (!prev.has(val)) next.add(val)
      return next
    })
  }

  const startMode = (mode: 'semantic' | 'scene' | 'mood' | 'name') => {
    if (mode === 'name') {
      const input = document.querySelector('.explore-search') as HTMLInputElement
      if (input) input.focus()
      return
    }
    setExploreMode(prev => prev === mode ? null : mode)
  }

  const resetFlow = () => {
    setExploreMode(null)
    setSelectedDiets(new Set())
    setSelectedAllergens(new Set())
    setSelectedScenes(new Set())
    setSelectedMoods(new Set())
    setSemanticQuery('')
    setVisitType(null)
    setRecentFood(null)
    setFlowCount(null)
  }

  const handleViewResults = async () => {
    const params: Record<string, string> = {}
    if (selectedDiets.size > 0) params.diet = Array.from(selectedDiets).join(',')
    if (selectedAllergens.size > 0) params.no = Array.from(selectedAllergens).join(',')
    if (selectedScenes.size > 0) params.scene = Array.from(selectedScenes).join(',')
    if (selectedMoods.size > 0) params.mood = Array.from(selectedMoods).join(',')
    if (city) params.area = city
    if (semanticQuery.trim()) params.q = semanticQuery.trim()

    setSearched(true)
    setLoading(true)
    try {
      const res = await SemanticSearchApi.search(params)
      const items: DisplayRestaurant[] = res.result.restaurants.map(r => ({
        ...r, _nfg: true, address: null, logo_url: null
      }))
      setRestaurants(items)
      setTotal(res.result.count)
      setPages(res.result.pages)
      setPage(res.result.page)
    } catch {
      setRestaurants([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const activeFilterCount = selectedDiets.size + selectedAllergens.size + selectedScenes.size + selectedMoods.size + (semanticQuery.trim() ? 1 : 0) + (visitType ? 1 : 0) + (recentFood ? 1 : 0)

  const totalAll = cities.reduce((s, c) => s + c.count, 0)

  return (
    <div ref={pageRef} className={`explore-page ${!searched ? 'explore-landing' : ''}`}>
      {!searched && <BinaryField />}
      <div className={!searched ? 'explore-landing-center' : ''}>
        <header className="explore-header">
          <div className="explore-header-inner">
            <div className="explore-brand">
              <img src="/ngraph-text-logo.svg" alt="NGraph" className="explore-logo" />
              <div className="explore-brand-tags">
                <span className="explore-badge glow-target">β</span>
                <span className="explore-region glow-target">＠FUKUI</span>
              </div>
            </div>
          </div>
        </header>

        <div className="explore-body">
          {/* Search */}
          <div className="explore-search-wrap">
            <Search size={16} className="explore-search-icon" />
            <input
              className="explore-search"
              type="text"
              placeholder="卵不使用・ハラール・昆布だし・店名で検索"
              value={query}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          {/* City filter */}
          <div className="explore-filters">
            {searched && (
              <button
                className={`explore-filter-pill ${!city ? 'active' : ''}`}
                onClick={() => handleCity('')}
              >
                すべて <span className="explore-filter-count">{totalAll}</span>
              </button>
            )}
            {cities.map(c => (
              <button
                key={c.city}
                className={`explore-filter-pill glow-target ${city === c.city ? 'active' : ''}`}
                onClick={() => handleCity(c.city)}
              >
                {c.city} <span className="explore-filter-count">{c.count}</span>
              </button>
            ))}
          </div>

          {!searched && (
            <>
              <div className="explore-quick-taps">
                {QUICK_TAPS.map(t => (
                  <button key={t} className="explore-quick-tap glow-target" onClick={() => handleSearch(t)}>
                    {t}
                  </button>
                ))}
              </div>
              {stats && (
                <div className="explore-landing-stats glow-target">
                  {stats.total_restaurants.toLocaleString()} 店舗 · {stats.total_menus.toLocaleString()} メニュー · {stats.cities} 都市
                </div>
              )}

              {/* Explore Modes */}
              <div className="explore-modes">
                <div className="explore-label">どこから探しますか？</div>
                <div className="explore-grid">
                  <div className={`explore-mode ${exploreMode === 'semantic' ? 'active' : ''}`} onClick={() => startMode('semantic')}>
                    <span className="em-icon">🥗</span>
                    <span className="em-label">食の制約・原材料</span>
                  </div>
                  <div className={`explore-mode ${exploreMode === 'scene' ? 'active' : ''}`} onClick={() => startMode('scene')}>
                    <span className="em-icon">🎭</span>
                    <span className="em-label">シーンから</span>
                  </div>
                  <div className={`explore-mode ${exploreMode === 'mood' ? 'active' : ''}`} onClick={() => startMode('mood')}>
                    <span className="em-icon">😋</span>
                    <span className="em-label">気分から</span>
                  </div>
                  <div className={`explore-mode ${exploreMode === 'name' ? 'active' : ''}`} onClick={() => startMode('name')}>
                    <span className="em-icon">🔍</span>
                    <span className="em-label">店名で直接</span>
                  </div>
                </div>
              </div>

              {/* Mode A: 食の制約・原材料 */}
              {exploreMode === 'semantic' && (
                <div className="q-block">
                  <div className="q-label">食の制約</div>
                  <div className="explore-filters" style={{ justifyContent: 'flex-start' }}>
                    {[
                      { key: 'halal', emoji: '☪️', label: 'ハラール' },
                      { key: 'vegetarian', emoji: '🌱', label: 'ベジタリアン' },
                      { key: 'pescatarian', emoji: '🐟', label: 'ペスカタリアン' },
                      { key: 'kosher', emoji: '✡️', label: 'コーシャ' },
                      { key: 'gluten_free', emoji: '🚫', label: 'グルテンフリー' },
                      { key: 'dairy_free', emoji: '🥛', label: '乳製品不使用' },
                    ].map(d => (
                      <button key={d.key} className={`explore-filter-pill ${selectedDiets.has(d.key) ? 'active' : ''}`}
                        onClick={() => toggleSet(selectedDiets, setSelectedDiets, d.key)}>
                        {d.emoji} {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="q-divider" />
                  <div className="q-label">アレルゲンを除外</div>
                  <div className="explore-filters" style={{ justifyContent: 'flex-start' }}>
                    {[
                      { key: 'egg', emoji: '🥚', label: '卵なし' },
                      { key: 'shrimp', emoji: '🦐', label: 'えびなし' },
                      { key: 'crab', emoji: '🦀', label: 'かになし' },
                      { key: 'wheat', emoji: '🌾', label: '小麦なし' },
                      { key: 'peanut', emoji: '🥜', label: 'ピーナッツなし' },
                      { key: 'milk', emoji: '🐄', label: '乳なし' },
                      { key: 'fish', emoji: '🐟', label: '魚なし' },
                    ].map(a => (
                      <button key={a.key} className={`explore-filter-pill ${selectedAllergens.has(a.key) ? 'active' : ''}`}
                        onClick={() => toggleSet(selectedAllergens, setSelectedAllergens, a.key)}>
                        {a.emoji} {a.label}
                      </button>
                    ))}
                  </div>
                  <div className="q-divider" />
                  <div className="q-label">原材料・調理法で絞る</div>
                  <div className="semantic-search">
                    <input
                      type="text"
                      placeholder="原材料・調理法を入力（例：昆布だし、国産鶏）"
                      value={semanticQuery}
                      onChange={e => setSemanticQuery(e.target.value)}
                    />
                    <div className="semantic-suggestions">
                      {['昆布だし', '国産食材', '無添加', '有機野菜'].map(s => (
                        <span key={s} className="suggestion-chip" onClick={() => setSemanticQuery(s)}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mode B: シーン */}
              {exploreMode === 'scene' && (
                <div className="q-block">
                  <div className="q-label">どんなシーン？（複数選択可）</div>
                  <div className="explore-filters" style={{ justifyContent: 'flex-start' }}>
                    {[
                      { key: 'kids_ok', emoji: '👶', label: '子連れOK' },
                      { key: 'private_room', emoji: '🚪', label: '個室あり' },
                      { key: 'date', emoji: '💑', label: 'デート' },
                      { key: 'entertainment', emoji: '💼', label: '接待' },
                      { key: 'no_smoking', emoji: '🚭', label: '禁煙' },
                      { key: 'parking', emoji: '🅿️', label: '駐車場' },
                      { key: 'late_night', emoji: '🌙', label: '深夜営業' },
                      { key: 'all_you_can_drink', emoji: '🍺', label: '飲み放題' },
                    ].map(s => (
                      <button key={s.key} className={`explore-filter-pill ${selectedScenes.has(s.key) ? 'active' : ''}`}
                        onClick={() => toggleSet(selectedScenes, setSelectedScenes, s.key)}>
                        {s.emoji} {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode C: 気分 */}
              {exploreMode === 'mood' && (
                <div className="q-block">
                  <div className="q-label">今の気分は？</div>
                  <div className="explore-filters" style={{ justifyContent: 'flex-start' }}>
                    {[
                      { key: 'hearty', emoji: '🍚', label: 'しっかり食事' },
                      { key: 'drinking', emoji: '🍺', label: '飲みメイン' },
                      { key: 'budget', emoji: '💰', label: 'コスパ重視' },
                      { key: 'spicy', emoji: '🌶️', label: '辛いもの' },
                      { key: 'local', emoji: '✨', label: '福井の名物' },
                    ].map(m => (
                      <button key={m.key} className={`explore-filter-pill ${selectedMoods.has(m.key) ? 'active' : ''}`}
                        onClick={() => selectMood(m.key)}>
                        {m.emoji} {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* やり直すボタン */}
              {exploreMode && activeFilterCount > 0 && (
                <div style={{ padding: '0 24px 8px' }}>
                  <span className="q-skip" onClick={resetFlow}>← やり直す</span>
                </div>
              )}

              {/* 共通フロー */}
              {exploreMode && activeFilterCount > 0 && (
                <>
                  <div className="q-block">
                    <div className="q-divider" />
                    <div className="q-label">
                      福井は初めて？
                      {visitType && <span className="q-answered-val"> — {visitType === 'first' ? '初めて' : visitType === 'repeat' ? '何度か' : '地元'}</span>}
                    </div>
                    <div className="explore-filters" style={{ justifyContent: 'flex-start' }}>
                      {[
                        { key: 'first', emoji: '✈️', label: '初めて' },
                        { key: 'repeat', emoji: '🗺️', label: '何度か' },
                        { key: 'local_resident', emoji: '🏠', label: '地元' },
                      ].map(v => (
                        <button key={v.key} className={`explore-filter-pill ${visitType === v.key ? 'active' : ''}`}
                          onClick={() => setVisitType(prev => prev === v.key ? null : v.key)}>
                          {v.emoji} {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="q-block">
                    <div className="q-label">
                      直近で食べたのは？
                      {recentFood && <span className="q-answered-val"> — {
                        recentFood === 'seafood' ? '海鮮' : recentFood === 'meat' ? '肉系' : recentFood === 'noodle' ? '麺' : recentFood === 'japanese' ? '和食' : '洋食'
                      }</span>}
                    </div>
                    <div className="explore-filters" style={{ justifyContent: 'flex-start' }}>
                      {[
                        { key: 'seafood', emoji: '🦀', label: '海鮮' },
                        { key: 'meat', emoji: '🍖', label: '肉系' },
                        { key: 'noodle', emoji: '🍜', label: '麺' },
                        { key: 'japanese', emoji: '🍱', label: '和食' },
                        { key: 'western', emoji: '🍝', label: '洋食' },
                      ].map(f => (
                        <button key={f.key} className={`explore-filter-pill ${recentFood === f.key ? 'active' : ''}`}
                          onClick={() => setRecentFood(prev => prev === f.key ? null : f.key)}>
                          {f.emoji} {f.label}
                        </button>
                      ))}
                    </div>
                    <span className="q-skip" onClick={() => setRecentFood(null)}>スキップ →</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {!searched && exploreMode && activeFilterCount > 0 && (
        <div className="flow-bottombar">
          <div className="flow-count-row">
            <div>
              <span className="flow-count-num">{flowCount !== null ? flowCount : '—'}</span>
              <span className="flow-count-unit"> 件</span>
            </div>
            <span className="flow-count-status">{activeFilterCount}項目で絞り込み中</span>
          </div>
          <div className={`flow-actions ${activeFilterCount > 0 ? 'show' : ''}`}>
            <button className="flow-btn-primary" onClick={handleViewResults}>
              今すぐ見る
            </button>
            <button className="flow-btn-secondary" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
              もっと絞る ↓
            </button>
          </div>
        </div>
      )}

      {searched && (
        <div className="explore-body">
          {/* Results count + sort */}
          <div className="explore-results-bar">
            <span className="explore-results-count">
              {total.toLocaleString()} 件{query && ` — "${query}"`}
            </span>
            {restaurants.some(r => r._nfg) && (
              <div className="explore-sort-toggle">
                <button
                  className={`explore-sort-btn ${sortBy === 'score' ? 'active' : ''}`}
                  onClick={() => handleSort('score')}
                >
                  スコア順
                </button>
                <button
                  className={`explore-sort-btn ${sortBy === 'menu_count' ? 'active' : ''}`}
                  onClick={() => handleSort('menu_count')}
                >
                  メニュー数順
                </button>
              </div>
            )}
          </div>

          {/* Restaurant list */}
          <div className="explore-list">
            {loading ? (
              <div className="explore-loading">読み込み中...</div>
            ) : restaurants.length === 0 ? (
              <div className="explore-empty">該当する店舗がありません</div>
            ) : (
              restaurants.map(r => (
                <button
                  key={r.uid}
                  className="explore-row"
                  onClick={() => router.push(`/capture?restaurant=${encodeURIComponent(r.slug)}`)}
                >
                  <div className="explore-row-main">
                    <div className="explore-row-info">
                      <span className="explore-row-name">{r.name}</span>
                      {r.city && <span className="explore-row-address">{r.city}</span>}
                    </div>
                    {r.menu_count > 0 && (
                      <span className="explore-row-count">{r.menu_count}</span>
                    )}
                  </div>
                  {r._nfg && 'match_reasons' in r && (r as NfgSearchRestaurant).match_reasons.length > 0 && (
                    <div className="explore-row-reasons">
                      {(r as NfgSearchRestaurant).score > 0 && (
                        <span className="explore-score-badge">
                          {(r as NfgSearchRestaurant).score}pt
                        </span>
                      )}
                      {(r as NfgSearchRestaurant).match_reasons.map((reason, i) => (
                        <span key={i} className="explore-match-tag">{reason}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="explore-pagination">
              <button
                className="explore-page-btn"
                disabled={page <= 1}
                onClick={() => handlePage(page - 1)}
              >
                前へ
              </button>
              <span className="explore-page-info">{page} / {pages}</span>
              <button
                className="explore-page-btn"
                disabled={page >= pages}
                onClick={() => handlePage(page + 1)}
              >
                次へ
              </button>
            </div>
          )}

          {stats && (
            <div className="explore-footer-stats">
              {stats.total_restaurants.toLocaleString()}店舗 · {stats.total_menus.toLocaleString()}メニュー · {stats.enriched_menus.toLocaleString()}構造化 · {stats.cities}都市
            </div>
          )}
        </div>
      )}
    </div>
  )
}
