'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search } from 'lucide-react'
import { ExploreApi, SemanticSearchApi, MenuSearchApi, SearchRestaurant, NfgSearchRestaurant, SemanticSearchRestaurant, MenuSearchItem, CityCount, PlatformStats } from '../services/api'

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

function BinaryText({ text, className }: { text: string; className?: string }) {
  const [decoded, setDecoded] = useState(0)
  const [noise, setNoise] = useState<string[]>([])

  useEffect(() => {
    setDecoded(0)
    const noiseId = setInterval(() => {
      setNoise(Array.from({ length: text.length }, () => Math.random() > 0.5 ? '1' : '0'))
    }, 40)
    // small delay before decoding starts — let noise settle
    const startDelay = setTimeout(() => {
      const decodeId = setInterval(() => {
        setDecoded(prev => {
          if (prev >= text.length) { clearInterval(decodeId); clearInterval(noiseId); return prev }
          return prev + 1
        })
      }, 50)
      return () => clearInterval(decodeId)
    }, 300)
    return () => { clearInterval(noiseId); clearTimeout(startDelay) }
  }, [text])

  return (
    <div className={className}>
      {text.split('').map((char, i) => (
        <span key={i} className={i < decoded ? 'bt-decoded' : 'bt-noise'}>
          {i < decoded ? char : (char === ' ' ? '\u00A0' : noise[i] || '0')}
        </span>
      ))}
    </div>
  )
}

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

const SITUATIONS = [
  { key: 'solo', label: 'ひとり' },
  { key: 'date', label: 'デート' },
  { key: 'friends', label: '友人と' },
  { key: 'family', label: '家族で' },
  { key: 'business', label: '接待・宴会' },
]
const SITUATION_LABELS: Record<string, string> = Object.fromEntries(SITUATIONS.map(s => [s.key, s.label]))

const DIETS = [
  { key: 'halal', label: 'ハラール' },
  { key: 'vegetarian', label: 'ベジタリアン' },
  { key: 'gluten_free', label: 'グルテンフリー' },
]
const ALLERGENS = [
  { key: 'egg', label: '卵×' },
  { key: 'shrimp', label: 'えび×' },
  { key: 'crab', label: 'かに×' },
  { key: 'wheat', label: '小麦×' },
  { key: 'milk', label: '乳×' },
  { key: 'fish', label: '魚×' },
]

const MOODS = [
  { key: 'hearty', label: 'がっつり食事' },
  { key: 'drinking', label: '飲みメイン' },
  { key: 'budget', label: 'コスパ重視' },
  { key: 'spicy', label: '辛いもの' },
  { key: 'local', label: '福井の名物' },
]
const MOOD_LABELS: Record<string, string> = Object.fromEntries(MOODS.map(m => [m.key, m.label]))

const GENRES = [
  { key: 'meat', label: '肉料理', q: '肉' },
  { key: 'seafood', label: '魚・海鮮', q: '魚,海鮮' },
  { key: 'sashimi', label: '刺身', category: 'sashimi' },
  { key: 'sushi', label: '寿司', category: 'sushi' },
  { key: 'nabe', label: '鍋', category: 'nabe' },
  { key: 'ramen', label: 'ラーメン・麺', category: 'ramen,soba' },
  { key: 'rice', label: 'ご飯もの', category: 'rice' },
  { key: 'tempura', label: '天ぷら', category: 'tempura' },
  { key: 'yakitori', label: '焼き鳥', category: 'yakitori' },
] as const
const GENRE_LABELS: Record<string, string> = Object.fromEntries(GENRES.map(g => [g.key, g.label]))

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

  // Conversational flow state
  const [flowStep, setFlowStep] = useState(0)
  const [flowSituation, setFlowSituation] = useState<string | null>(null)
  const [flowDiets, setFlowDiets] = useState<Set<string>>(new Set())
  const [flowAllergens, setFlowAllergens] = useState<Set<string>>(new Set())
  const [flowMood, setFlowMood] = useState<string | null>(null)
  const [flowGenre, setFlowGenre] = useState<string | null>(null)
  const [menuCards, setMenuCards] = useState<MenuSearchItem[]>([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuTotal, setMenuTotal] = useState(0)
  const [flowTransition, setFlowTransition] = useState<'idle' | 'exiting' | 'entering'>('idle')
  const [flowCount, setFlowCount] = useState<number | null>(null)
  const [flowLoading, setFlowLoading] = useState(false)
  const countDebounceRef = useRef<ReturnType<typeof setTimeout>>()
  const [recoCards, setRecoCards] = useState<SemanticSearchRestaurant[]>([])
  const [recoLoading, setRecoLoading] = useState(false)
  const [recoTotal, setRecoTotal] = useState(0)
  const [recoFallback, setRecoFallback] = useState(false)

  // Auto-start flow
  useEffect(() => {
    if (!searched && flowStep === 0) setFlowStep(1)
  }, [searched, flowStep])

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

  // --- Conversational flow functions ---

  const toggleSet = (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) => {
    setFn(prev => {
      const next = new Set(prev)
      if (next.has(val)) next.delete(val)
      else next.add(val)
      return next
    })
  }

  const advanceStep = () => {
    setFlowTransition('exiting')
    setTimeout(() => {
      setFlowStep(prev => prev + 1)
      setFlowTransition('entering')
      setTimeout(() => setFlowTransition('idle'), 300)
    }, 200)
  }

  const answerSituation = (key: string) => {
    setFlowSituation(key)
    advanceStep()
  }

  const buildFlowParams = (): Record<string, string> => {
    const params: Record<string, string> = {}
    if (flowDiets.size > 0) params.diet = Array.from(flowDiets).join(',')
    if (flowAllergens.size > 0) params.no = Array.from(flowAllergens).join(',')
    if (flowMood) params.mood = flowMood
    if (city) params.area = city
    return params
  }

  const buildMenuParams = (): Record<string, string> => {
    const params = buildFlowParams()
    const genre = GENRES.find(g => g.key === flowGenre)
    if (genre && 'category' in genre && genre.category) params.category = genre.category
    if (genre && 'q' in genre && genre.q) params.q = genre.q
    return params
  }

  const fetchRecommendations = async () => {
    const params = buildFlowParams()
    setRecoLoading(true)
    setRecoFallback(false)
    try {
      const res = await SemanticSearchApi.search({ ...params, size: 3 })
      if (res.result.restaurants.length > 0) {
        setRecoCards(res.result.restaurants)
        setRecoTotal(res.result.count)
      } else {
        const fallback = await SemanticSearchApi.search({ area: city || undefined, size: 3 })
        setRecoCards(fallback.result.restaurants)
        setRecoTotal(fallback.result.count)
        setRecoFallback(true)
      }
    } catch {
      setRecoCards([])
      setRecoTotal(0)
    } finally {
      setRecoLoading(false)
    }
  }

  const answerMoodAndFetchReco = async (key: string) => {
    setFlowMood(key)
    setFlowTransition('exiting')
    setTimeout(() => {
      setFlowStep(4)
      setFlowTransition('entering')
      setTimeout(() => setFlowTransition('idle'), 300)
    }, 200)
    // fetch reco cards (use key directly since state update is async)
    const params: Record<string, string> = {}
    if (flowDiets.size > 0) params.diet = Array.from(flowDiets).join(',')
    if (flowAllergens.size > 0) params.no = Array.from(flowAllergens).join(',')
    params.mood = key
    if (city) params.area = city
    setRecoLoading(true)
    setRecoFallback(false)
    try {
      const res = await SemanticSearchApi.search({ ...params, size: 3 })
      if (res.result.restaurants.length > 0) {
        setRecoCards(res.result.restaurants)
        setRecoTotal(res.result.count)
      } else {
        const fallback = await SemanticSearchApi.search({ area: city || undefined, size: 3 })
        setRecoCards(fallback.result.restaurants)
        setRecoTotal(fallback.result.count)
        setRecoFallback(true)
      }
    } catch {
      setRecoCards([])
      setRecoTotal(0)
    } finally {
      setRecoLoading(false)
    }
  }

  const answerGenre = async (key: string) => {
    setFlowGenre(key)
    setFlowTransition('exiting')
    setTimeout(() => {
      setFlowStep(5)
      setFlowTransition('entering')
      setTimeout(() => setFlowTransition('idle'), 300)
    }, 200)
    // fetch menu cards
    setMenuLoading(true)
    const params = buildFlowParams()
    const genre = GENRES.find(g => g.key === key)
    if (genre && 'category' in genre && genre.category) params.category = genre.category
    if (genre && 'q' in genre && genre.q) params.q = genre.q
    try {
      const res = await MenuSearchApi.search({ ...params, size: 20 })
      setMenuCards(res.result.menus)
      setMenuTotal(res.result.count)
    } catch {
      setMenuCards([])
      setMenuTotal(0)
    } finally {
      setMenuLoading(false)
    }
  }

  const skipStep = () => {
    if (flowStep === 3) {
      // Step 3 skip → show reco cards at step 4
      setFlowTransition('exiting')
      setTimeout(() => {
        setFlowStep(4)
        setFlowTransition('entering')
        setTimeout(() => setFlowTransition('idle'), 300)
      }, 200)
      fetchRecommendations()
    } else {
      advanceStep()
    }
  }

  const goToStep = (step: number) => {
    if (step <= 1) setFlowSituation(null)
    if (step <= 2) { setFlowDiets(new Set()); setFlowAllergens(new Set()) }
    if (step <= 3) { setFlowMood(null); setRecoCards([]); setRecoTotal(0); setRecoFallback(false) }
    if (step <= 4) { setFlowGenre(null); setMenuCards([]); setMenuTotal(0) }
    setFlowStep(step)
    setFlowTransition('idle')
  }

  const resetFlow = () => {
    setFlowSituation(null)
    setFlowDiets(new Set())
    setFlowAllergens(new Set())
    setFlowMood(null)
    setFlowGenre(null)
    setFlowStep(1)
    setFlowCount(null)
    setFlowTransition('idle')
    setRecoCards([])
    setRecoTotal(0)
    setRecoFallback(false)
    setMenuCards([])
    setMenuTotal(0)
  }

  const fetchFlowCount = useCallback(async () => {
    const params: Record<string, string> = {}
    if (flowDiets.size > 0) params.diet = Array.from(flowDiets).join(',')
    if (flowAllergens.size > 0) params.no = Array.from(flowAllergens).join(',')
    if (flowMood) params.mood = flowMood
    if (city) params.area = city

    setFlowLoading(true)
    try {
      const res = await SemanticSearchApi.count(params)
      setFlowCount(res.result.count)
    } catch {
      setFlowCount(null)
    } finally {
      setFlowLoading(false)
    }
  }, [flowDiets, flowAllergens, flowMood, city])

  useEffect(() => {
    if (countDebounceRef.current) clearTimeout(countDebounceRef.current)
    countDebounceRef.current = setTimeout(() => fetchFlowCount(), 300)
    return () => { if (countDebounceRef.current) clearTimeout(countDebounceRef.current) }
  }, [fetchFlowCount])

  const handleViewResults = async () => {
    const params = buildFlowParams()
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

  const activeFilterCount = flowDiets.size + flowAllergens.size + (flowMood ? 1 : 0)

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

          {/* City filter — searched only */}
          {searched && (
            <div className="explore-filters">
              <button
                className={`explore-filter-pill ${!city ? 'active' : ''}`}
                onClick={() => handleCity('')}
              >
                すべて <span className="explore-filter-count">{totalAll}</span>
              </button>
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
          )}

          {!searched && (
            <>

              {/* Answer Trail */}
              {flowStep > 1 && (
                <div className="conv-trail">
                  {flowSituation && (
                    <span className="conv-trail-item" onClick={() => goToStep(1)}>
                      {SITUATION_LABELS[flowSituation]}
                    </span>
                  )}
                  {(flowDiets.size > 0 || flowAllergens.size > 0) && (
                    <span className="conv-trail-item" onClick={() => goToStep(2)}>
                      {[...Array.from(flowDiets).map(d => DIETS.find(x => x.key === d)?.label || d), ...Array.from(flowAllergens).map(a => ALLERGENS.find(x => x.key === a)?.label || a)].join(', ')}
                    </span>
                  )}
                  {flowMood && flowStep > 3 && (
                    <span className="conv-trail-item" onClick={() => goToStep(3)}>
                      {MOOD_LABELS[flowMood]}
                    </span>
                  )}
                  {flowGenre && flowStep > 4 && (
                    <span className="conv-trail-item" onClick={() => goToStep(4)}>
                      {GENRE_LABELS[flowGenre]}
                    </span>
                  )}
                  <span className="conv-reset" onClick={resetFlow}>← やり直す</span>
                </div>
              )}

              {/* Step 1: 状況 */}
              {flowStep === 1 && flowTransition !== 'exiting' && (
                <div className={`conv-step ${flowTransition === 'entering' ? 'conv-entering' : ''}`}>
                  <BinaryText key={`q1-${flowStep}`} text="今日はどんなお店探し？" className="conv-question" />
                  <div className="conv-chips">
                    {SITUATIONS.map(s => (
                      <button key={s.key} className="conv-chip" onClick={() => answerSituation(s.key)}>{s.label}</button>
                    ))}
                    <button className="conv-chip conv-chip-skip" onClick={() => skipStep()}>スキップ →</button>
                  </div>
                </div>
              )}

              {/* Step 2: 制約 */}
              {flowStep === 2 && flowTransition !== 'exiting' && (
                <div className={`conv-step ${flowTransition === 'entering' ? 'conv-entering' : ''}`}>
                  <BinaryText key={`q2-${flowStep}`} text="外せない条件は？" className="conv-question" />
                  <div className="conv-section-label">食事制約</div>
                  <div className="conv-chips">
                    {DIETS.map(d => (
                      <button key={d.key} className={`conv-chip ${flowDiets.has(d.key) ? 'selected' : ''}`}
                        onClick={() => toggleSet(flowDiets, setFlowDiets, d.key)}>{d.label}</button>
                    ))}
                  </div>
                  <div className="conv-section-label">除外したいアレルゲン</div>
                  <div className="conv-chips">
                    {ALLERGENS.map(a => (
                      <button key={a.key} className={`conv-chip ${flowAllergens.has(a.key) ? 'selected' : ''}`}
                        onClick={() => toggleSet(flowAllergens, setFlowAllergens, a.key)}>{a.label}</button>
                    ))}
                  </div>
                  <button className="conv-next" onClick={() => advanceStep()}>
                    {flowDiets.size + flowAllergens.size > 0 ? '次へ →' : 'スキップ →'}
                  </button>
                </div>
              )}

              {/* Step 3: 気分 */}
              {flowStep === 3 && flowTransition !== 'exiting' && (
                <div className={`conv-step ${flowTransition === 'entering' ? 'conv-entering' : ''}`}>
                  <BinaryText key={`q3-${flowStep}`} text="今の気分は？" className="conv-question" />
                  <div className="conv-chips">
                    {MOODS.map(m => (
                      <button key={m.key} className="conv-chip" onClick={() => answerMoodAndFetchReco(m.key)}>{m.label}</button>
                    ))}
                    <button className="conv-chip conv-chip-skip" onClick={() => skipStep()}>スキップ →</button>
                  </div>
                </div>
              )}

              {/* Inline count — visible during steps 1-3 */}
              {flowStep >= 1 && flowStep <= 3 && (
                <div className="conv-count-inline">
                  <BinaryText
                    key={`count-${flowCount}-${flowLoading}`}
                    text={flowLoading ? '...' : `${flowCount ?? '—'} / ${stats?.total_menus?.toLocaleString() || '—'}`}
                    className="conv-count-num"
                  />
                  {flowCount !== null && flowCount > 0 && (
                    <button className="conv-chip" onClick={() => handleViewResults()}>今すぐ見る</button>
                  )}
                </div>
              )}

              {/* Step 4: Restaurant reco cards + genre selection */}
              {flowStep >= 4 && !searched && (recoLoading || recoCards.length > 0) && (
                <div className="conv-reco">
                  {recoLoading ? (
                    <div className="conv-question" style={{ padding: '0 24px' }}>探しています...</div>
                  ) : recoCards.length > 0 ? (
                    <>
                      <BinaryText key={`reco-${recoFallback}`} text={recoFallback ? 'ぴったりは見つからなかったけど…こちらはどう？' : 'AIのおすすめ'} className="conv-reco-title" />
                      <div className="conv-reco-cards">
                        {recoCards.map(r => (
                          <button
                            key={r.uid}
                            className="conv-reco-card"
                            onClick={() => router.push(`/capture?restaurant=${encodeURIComponent(r.slug)}`)}
                          >
                            <div className="conv-reco-restaurant">{r.name}</div>
                            {r.match_reasons.length > 0 && (
                              <div className="conv-reco-reasons">
                                {r.score > 0 && <span className="conv-reco-score">{r.score}pt</span>}
                                {r.match_reasons.map((reason, i) => (
                                  <span key={i} className="conv-reco-tag">{reason}</span>
                                ))}
                              </div>
                            )}
                            <div className="conv-reco-meta">
                              <span className="conv-reco-city">{r.city || '福井'} · {r.menu_count}品</span>
                              <a
                                className="conv-reco-link"
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + (r.city || '福井'))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                              >
                                Google Map →
                              </a>
                            </div>
                          </button>
                        ))}
                      </div>
                      {recoTotal > 3 && (
                        <button className="conv-reco-more" onClick={() => handleViewResults()}>
                          他 {recoTotal - 3} 件を見る
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="conv-step">
                      <div className="conv-question">もう少し条件を変えてみよう</div>
                      <button className="conv-next" onClick={resetFlow}>はじめから探す</button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Genre selection — "何食べたい？" */}
              {flowStep === 4 && flowTransition !== 'exiting' && (
                <div className={`conv-step ${flowTransition === 'entering' ? 'conv-entering' : ''}`}>
                  <BinaryText key={`q4-${flowStep}`} text="何食べたい？" className="conv-question" />
                  <div className="conv-chips">
                    {GENRES.map(g => (
                      <button key={g.key} className="conv-chip" onClick={() => answerGenre(g.key)}>{g.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Menu cards */}
              {flowStep >= 5 && !searched && (
                <div className="conv-reco">
                  {menuLoading ? (
                    <div className="conv-question" style={{ padding: '0 24px' }}>メニューを探しています...</div>
                  ) : menuCards.length > 0 ? (
                    <>
                      <BinaryText key={`menu-${flowGenre}`} text={`${GENRE_LABELS[flowGenre || ''] || ''} ${menuTotal}品`} className="conv-reco-title" />
                      <div className="conv-menu-cards">
                        {menuCards.map(m => (
                          <button
                            key={m.uid}
                            className="conv-menu-card"
                            onClick={() => router.push(`/capture?restaurant=${encodeURIComponent(m.restaurant_slug)}`)}
                          >
                            <div className="conv-menu-name">{m.name_jp}</div>
                            <div className="conv-menu-meta">{m.restaurant_name} · {m.category_label}</div>
                            <div className="conv-menu-price">&yen;{m.price.toLocaleString()}</div>
                            {m.narrative_snippet && (
                              <div className="conv-menu-narrative">{m.narrative_snippet}</div>
                            )}
                            {m.featured_tags.length > 0 && (
                              <div className="conv-menu-tags">
                                {m.featured_tags.map((tag, i) => (
                                  <span key={i} className="conv-menu-tag">{tag}</span>
                                ))}
                              </div>
                            )}
                            <div className="conv-reco-meta">
                              <span className="conv-reco-city">{m.restaurant_city || '福井'}</span>
                              <a
                                className="conv-reco-link"
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.restaurant_name + ' ' + (m.restaurant_city || '福井'))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                              >
                                Google Map →
                              </a>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="conv-step">
                      <div className="conv-question">このジャンルのメニューが見つかりませんでした</div>
                      <button className="conv-next" onClick={() => goToStep(4)}>ジャンルを変える</button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {searched && (
        <div className="explore-body">
          {/* Back button */}
          <div style={{ padding: '8px 24px 0' }}>
            <span className="conv-reset" onClick={() => { setSearched(false); setQuery(''); setRestaurants([]); setTotal(0) }}>← 戻る</span>
          </div>

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
