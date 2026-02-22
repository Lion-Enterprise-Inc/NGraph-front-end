'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search } from 'lucide-react'
import { ExploreApi, SearchRestaurant, NfgSearchRestaurant, CityCount, PlatformStats } from '../services/api'

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
    const COUNT = 60

    const spawn = (w: number, h: number): Particle => {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.15 + Math.random() * 0.25
      const size = 9 + Math.floor(Math.random() * 3) * 2 // 9, 11, 13
      const cx = w / 2, cy = h / 2
      const spread = Math.min(w, h) * 0.3
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
      const radius = Math.min(canvas.width, canvas.height) * 0.32

      // update & compute visible alpha
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
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

      // draw characters with glow
      for (let i = 0; i < particles.length; i++) {
        if (alphas[i] < 0.005) continue
        const p = particles[i]
        ctx.save()
        ctx.shadowColor = `rgba(16, 163, 127, ${alphas[i] * 0.8})`
        ctx.shadowBlur = 8
        ctx.fillStyle = `rgba(16, 163, 127, ${alphas[i]})`
        ctx.font = `${p.size}px 'SF Mono', 'Fira Code', monospace`
        ctx.fillText(p.char, p.x, p.y)
        ctx.restore()
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

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
        setRestaurants(res.result.items)
        setTotal(res.result.total)
        setPages(res.result.pages)
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

  const totalAll = cities.reduce((s, c) => s + c.count, 0)

  return (
    <div className={`explore-page ${!searched ? 'explore-landing' : ''}`}>
      {!searched && <BinaryField />}
      <div className={!searched ? 'explore-landing-center' : ''}>
        <header className="explore-header">
          <div className="explore-header-inner">
            <h1 className="explore-brand">
              NGraph <span className="explore-badge">β</span> <span className="explore-region">＠FUKUI</span>
            </h1>
          </div>
        </header>

        <div className="explore-body">
          {/* Search */}
          <div className="explore-search-wrap">
            <Search size={16} className="explore-search-icon" />
            <input
              className="explore-search"
              type="text"
              placeholder="店名・ジャンル・食べたいもので検索"
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
                className={`explore-filter-pill ${city === c.city ? 'active' : ''}`}
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
                  <button key={t} className="explore-quick-tap" onClick={() => handleSearch(t)}>
                    {t}
                  </button>
                ))}
              </div>
              {stats && (
                <div className="explore-landing-stats">
                  {stats.total_restaurants.toLocaleString()} 店舗 · {stats.total_menus.toLocaleString()} メニュー · {stats.cities} 都市
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {searched && (
        <div className="explore-body">
          {/* Results count */}
          <div className="explore-results-bar">
            <span className="explore-results-count">
              {total.toLocaleString()} 件{query && ` — "${query}"`}
            </span>
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
