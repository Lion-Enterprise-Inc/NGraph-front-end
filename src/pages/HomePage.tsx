'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search } from 'lucide-react'
import { ExploreApi, SemanticSearchApi, SearchRestaurant, NfgSearchRestaurant, SemanticSearchRestaurant, CityCount, PlatformStats } from '../services/api'
import { useAppContext } from '../components/AppProvider'

const LANG_BADGES: Record<string, string> = {
  ja: 'JP', en: 'US', 'zh-Hans': 'CN', 'zh-Hant': 'TW',
  ko: 'KR', es: 'ES', fr: 'FR', de: 'DE', it: 'IT',
  pt: 'PT', ru: 'RU', th: 'TH', vi: 'VN', id: 'ID',
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; alpha: number
  char: string
  life: number; maxLife: number
}

function BinaryField({ pulseRef }: { pulseRef?: React.RefObject<{ x: number; y: number; strength: number }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let particles: Particle[] = []
    const COUNT = 60
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

    const SYNAPSE_DIST = 90
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

        // pulse attraction (count bar)
        if (pulseRef?.current && pulseRef.current.strength > 0.01) {
          const pulse = pulseRef.current
          const rect = canvas.getBoundingClientRect()
          const px = pulse.x - rect.left
          const py = pulse.y - rect.top
          const pdx2 = px - p.x
          const pdy2 = py - p.y
          const pdist2 = Math.sqrt(pdx2 * pdx2 + pdy2 * pdy2)
          if (pdist2 > 1) {
            const force = pulse.strength * 0.4 * Math.min(1, 200 / pdist2)
            p.vx += (pdx2 / pdist2) * force
            p.vy += (pdy2 / pdist2) * force
          }
          pulse.strength *= 0.97
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

      // density boost — nearby particles get brighter
      const DENSITY_DIST = 60
      for (let i = 0; i < particles.length; i++) {
        if (alphas[i] < 0.005) continue
        let neighbors = 0
        for (let j = 0; j < particles.length; j++) {
          if (i === j || alphas[j] < 0.005) continue
          const ddx = particles[i].x - particles[j].x
          const ddy = particles[i].y - particles[j].y
          if (ddx * ddx + ddy * ddy < DENSITY_DIST * DENSITY_DIST) neighbors++
        }
        if (neighbors > 0) {
          alphas[i] = Math.min(alphas[i] * (1 + neighbors * 0.3), 0.7)
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

// Step 1: 食ジャンル — 最大の絞り込み
const FOOD_TYPES = [
  { key: 'crab', label: '蟹', labelEn: 'Crab', q: '蟹,カニ,かに,ズワイ,セイコ' },
  { key: 'seafood', label: '海鮮・お刺身', labelEn: 'Seafood & Sashimi', q: '海鮮,刺身,魚', category: 'sashimi,seafood' },
  { key: 'sushi', label: '寿司', labelEn: 'Sushi', q: '寿司,すし,にぎり', category: 'sushi,nigiri,gunkan,roll' },
  { key: 'meat', label: '肉料理', labelEn: 'Meat', q: '肉,カツ,ステーキ,焼肉', category: 'meat' },
  { key: 'nabe', label: '鍋', labelEn: 'Hot Pot', q: '鍋,しゃぶ,すき焼き', category: 'nabe,hotpot' },
  { key: 'ramen', label: '麺類', labelEn: 'Noodles', q: '麺,ラーメン,そば,うどん', category: 'ramen,soba,noodle' },
  { key: 'drinking', label: 'お酒に合うつまみ', labelEn: 'Bar Snacks', mood: 'drinking' },
  { key: 'local', label: '福井の名物', labelEn: 'Fukui Specialties', mood: 'local' },
  { key: 'light', label: 'あっさり', labelEn: 'Light & Healthy', q: 'サラダ,酢の物,蒸し', category: 'salad,steamed,vinegared' },
] as const

const AREAS = [
  { key: 'fukui', label: '福井駅周辺', labelEn: 'Fukui Station', area: '福井市' },
  { key: 'echizen', label: '越前・鯖江', labelEn: 'Echizen / Sabae', area: '越前市' },
  { key: 'tsuruga', label: '敦賀', labelEn: 'Tsuruga', area: '敦賀市' },
  { key: 'awara', label: 'あわら', labelEn: 'Awara', area: 'あわら市' },
  { key: 'anywhere', label: 'どこでもOK', labelEn: 'Anywhere', area: '' },
] as const

const BUDGETS = [
  { key: 'under1000', label: '~1,000円', labelEn: '~¥1,000', min: 0, max: 1000 },
  { key: '1000to2000', label: '1,000~2,000円', labelEn: '¥1,000~2,000', min: 1000, max: 2000 },
  { key: '2000to3000', label: '2,000~3,000円', labelEn: '¥2,000~3,000', min: 2000, max: 3000 },
  { key: '3000to5000', label: '3,000~5,000円', labelEn: '¥3,000~5,000', min: 3000, max: 5000 },
  { key: 'over5000', label: '5,000円~', labelEn: '¥5,000+', min: 5000, max: 0 },
  { key: 'any', label: '気にしない', labelEn: "Don't mind", min: 0, max: 0 },
] as const

const STYLES = [
  { key: 'hearty', label: 'がっつり', labelEn: 'Hearty', mood: 'hearty' },
  { key: 'budget', label: 'コスパ重視', labelEn: 'Budget', mood: 'budget' },
  { key: 'drinking', label: '飲みメイン', labelEn: 'Drinks First', mood: 'drinking' },
  { key: 'none', label: '特にこだわりなし', labelEn: 'No preference', mood: '' },
] as const

const FLOW_QUESTIONS = {
  ja: { q1: '何を食べたいですか？', q2: 'どのあたりで探しますか？', q3: '予算は？', q4: 'スタイルは？', viewNow: '今すぐ見る', searchMore: 'もっと細かく探す', restart: '← やり直す', otherGenre: '他のジャンルも見る', changeMore: 'もう少し条件を変えてみよう', startOver: 'はじめから探す', searching: '探しています...', recoFallback: 'ぴったりは見つからなかったけど…こちらはどうですか？', recoTitle: 'おすすめのお店', seeMore: '他 {n} 件を見る', restrictionOpen: 'アレルギー・食事制限がある方', restrictionClose: 'アレルギー設定を閉じる', searchPlaceholder: '卵不使用・ハラール・昆布だし・店名で検索', all: 'すべて', back: '← 戻る', results: '{n} 件', score: 'スコア順', menuCount: 'メニュー数順', loading: '読み込み中...', empty: '該当する店舗がありません', prev: '前へ', next: '次へ', footer: '{r}店舗 · {m}メニュー · {e}構造化 · {c}都市' },
  en: { q1: 'What do you want to eat?', q2: 'Which area?', q3: 'Budget?', q4: 'Style?', viewNow: 'View now', searchMore: 'Search with details', restart: '← Start over', otherGenre: 'Try other genres', changeMore: 'Try different options', startOver: 'Start from scratch', searching: 'Searching...', recoFallback: "Couldn't find an exact match, but how about these?", recoTitle: 'Recommended', seeMore: 'See {n} more', restrictionOpen: 'Allergies & dietary restrictions', restrictionClose: 'Close allergy settings', searchPlaceholder: 'No egg, halal, kelp stock, restaurant name...', all: 'All', back: '← Back', results: '{n} results', score: 'By score', menuCount: 'By menu count', loading: 'Loading...', empty: 'No restaurants found', prev: 'Prev', next: 'Next', footer: '{r} restaurants · {m} menus · {e} structured · {c} cities' },
} as const

// 制約 — 安全フィルタ（別枠）
const RESTRICTIONS = [
  { key: 'shrimp', label: 'えび・かに×', labelEn: 'No Shrimp/Crab', no: 'shrimp,crab' },
  { key: 'egg', label: '卵×', labelEn: 'No Egg', no: 'egg' },
  { key: 'wheat', label: '小麦×', labelEn: 'No Wheat', no: 'wheat' },
  { key: 'milk', label: '乳×', labelEn: 'No Dairy', no: 'milk' },
  { key: 'soba', label: 'そば×', labelEn: 'No Soba', no: 'soba' },
  { key: 'halal', label: 'ハラール', labelEn: 'Halal', diet: 'halal' },
  { key: 'vegetarian', label: 'ベジタリアン', labelEn: 'Vegetarian', diet: 'vegetarian' },
  { key: 'gluten_free', label: 'グルテンフリー', labelEn: 'Gluten Free', diet: 'gluten_free' },
] as const

type SortKey = 'score' | 'menu_count'
type DisplayRestaurant = (SearchRestaurant | NfgSearchRestaurant) & { _nfg?: boolean }

export default function HomePage() {
  const router = useRouter()
  const { language, openLanguageModal } = useAppContext()
  const langBadge = LANG_BADGES[language] || language.slice(0, 2).toUpperCase()
  const isJa = language === 'ja'
  const fl = isJa ? FLOW_QUESTIONS.ja : FLOW_QUESTIONS.en
  const lb = (item: { label: string; labelEn: string }) => isJa ? item.label : item.labelEn
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
  const countBarRef = useRef<HTMLDivElement>(null)
  const pulseRef = useRef({ x: 0, y: 0, strength: 0 })

  // Conversational flow state
  const [flowStep, setFlowStep] = useState(0)
  const [flowFoodType, setFlowFoodType] = useState<string | null>(null)
  const [flowArea, setFlowArea] = useState<string | null>(null)
  const [flowBudget, setFlowBudget] = useState<string | null>(null)
  const [flowStyle, setFlowStyle] = useState<string | null>(null)
  const [availableAreas, setAvailableAreas] = useState<typeof AREAS[number][]>([...AREAS])
  const [flowRestrictions, setFlowRestrictions] = useState<Set<string>>(new Set())
  const [showRestrictions, setShowRestrictions] = useState(false)
  const [flowTransition, setFlowTransition] = useState<'idle' | 'exiting' | 'entering'>('idle')
  const [flowCount, setFlowCount] = useState<number | null>(null)
  const [flowLoading, setFlowLoading] = useState(false)
  const countDebounceRef = useRef<ReturnType<typeof setTimeout>>()
  const [recoCards, setRecoCards] = useState<SemanticSearchRestaurant[]>([])
  const [recoLoading, setRecoLoading] = useState(false)
  const [recoTotal, setRecoTotal] = useState(0)
  const [recoFallback, setRecoFallback] = useState(false)

  // Pulse binary particles toward count bar when count changes
  useEffect(() => {
    if (flowCount === null || !countBarRef.current) return
    const rect = countBarRef.current.getBoundingClientRect()
    pulseRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, strength: 1 }
  }, [flowCount])

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
    // Check which areas have restaurants with menus
    Promise.all(
      AREAS.filter(a => a.area).map(a =>
        SemanticSearchApi.count({ area: a.area }).then(r => ({ key: a.key, count: r.result.count }))
      )
    ).then(results => {
      const withMenus = new Set(results.filter(r => r.count > 0).map(r => r.key))
      setAvailableAreas(AREAS.filter(a => !a.area || withMenus.has(a.key)))
    }).catch(() => {})
  }, [fetchRestaurants])

  const handleSearch = (q: string) => {
    setQuery(q)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length >= 2) {
      setSearched(true)
      debounceRef.current = setTimeout(() => fetchRestaurants(q, city, 1), 400)
    } else if (q.length === 0) {
      if (city) {
        setSearched(true)
        debounceRef.current = setTimeout(() => fetchRestaurants('', city, 1), 300)
      } else {
        setSearched(false)
        setRestaurants([])
        setTotal(0)
        setPages(1)
      }
    }
    // 1文字目は遷移もフェッチもしない — 入力継続を待つ
  }

  const handleSearchSubmit = () => {
    if (query.length >= 1) {
      setSearched(true)
      fetchRestaurants(query, city, 1)
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

  const buildFlowParams = (overrides?: { foodType?: string; areaKey?: string; budgetKey?: string; styleKey?: string }): Record<string, string> => {
    const params: Record<string, string> = {}
    const ftKey = overrides?.foodType ?? flowFoodType
    const ft = FOOD_TYPES.find(f => f.key === ftKey)
    if (ft) {
      if ('mood' in ft && ft.mood) params.mood = ft.mood
      if ('category' in ft && ft.category) params.category = ft.category
      if ('q' in ft && ft.q) params.q = ft.q
    }
    // Area
    const aKey = overrides?.areaKey ?? flowArea
    if (aKey) {
      const a = AREAS.find(x => x.key === aKey)
      if (a && a.area) params.area = a.area
    } else if (city) {
      params.area = city
    }
    // Budget
    const bKey = overrides?.budgetKey ?? flowBudget
    if (bKey) {
      const b = BUDGETS.find(x => x.key === bKey)
      if (b && b.min > 0) params.price_min = String(b.min)
      if (b && b.max > 0) params.price_max = String(b.max)
    }
    // Style (mood override if not already set by food type)
    const sKey = overrides?.styleKey ?? flowStyle
    if (sKey) {
      const s = STYLES.find(x => x.key === sKey)
      if (s && s.mood && !params.mood) params.mood = s.mood
    }
    // Restrictions
    const diets: string[] = []
    const allergens: string[] = []
    for (const key of flowRestrictions) {
      const r = RESTRICTIONS.find(x => x.key === key)
      if (r && 'diet' in r && r.diet) diets.push(r.diet)
      if (r && 'no' in r && r.no) allergens.push(r.no)
    }
    if (diets.length > 0) params.diet = diets.join(',')
    if (allergens.length > 0) params.no = allergens.join(',')
    return params
  }

  const fetchReco = async (params: Record<string, string>) => {
    setRecoLoading(true)
    setRecoFallback(false)
    try {
      const res = await SemanticSearchApi.search({ ...params, size: 3 })
      if (res.result.restaurants.length > 0) {
        setRecoCards(res.result.restaurants)
        setRecoTotal(res.result.count)
      } else {
        const fallback = await SemanticSearchApi.search({ size: 3 })
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

  const answerFoodType = (key: string) => {
    setFlowFoodType(key)
    // Auto-skip area step if only 1 real area (+ "どこでもOK")
    const realAreas = availableAreas.filter(a => a.area)
    if (realAreas.length <= 1) {
      setFlowArea(realAreas[0]?.key || 'anywhere')
      // Skip step 2, go to step 3
      setFlowTransition('exiting')
      setTimeout(() => {
        setFlowStep(3)
        setFlowTransition('entering')
        setTimeout(() => setFlowTransition('idle'), 300)
      }, 200)
    } else {
      advanceStep()
    }
  }

  const answerArea = (key: string) => {
    setFlowArea(key)
    advanceStep()
  }

  const answerBudget = (key: string) => {
    setFlowBudget(key)
    advanceStep()
  }

  const answerStyle = (key: string) => {
    setFlowStyle(key)
    setFlowTransition('exiting')
    setTimeout(() => {
      setFlowStep(5)
      setFlowTransition('entering')
      setTimeout(() => setFlowTransition('idle'), 300)
    }, 200)
    // Fetch results with all params including this style
    fetchReco(buildFlowParams({ styleKey: key }))
  }

  // Re-select food type from results view → update results
  const switchFoodType = (key: string) => {
    setFlowFoodType(key)
    fetchReco(buildFlowParams({ foodType: key }))
  }

  const goToStep = (step: number) => {
    if (step <= 1) { setFlowFoodType(null) }
    if (step <= 2) { setFlowArea(null) }
    if (step <= 3) { setFlowBudget(null) }
    if (step <= 4) { setFlowStyle(null); setRecoCards([]); setRecoTotal(0); setRecoFallback(false) }
    setFlowStep(step)
    setFlowTransition('idle')
  }

  const resetFlow = () => {
    setFlowFoodType(null)
    setFlowArea(null)
    setFlowBudget(null)
    setFlowStyle(null)
    setFlowRestrictions(new Set())
    setShowRestrictions(false)
    setFlowStep(1)
    setFlowCount(null)
    setFlowTransition('idle')
    setRecoCards([])
    setRecoTotal(0)
    setRecoFallback(false)
  }

  const fetchFlowCount = useCallback(async () => {
    const params = buildFlowParams()
    setFlowLoading(true)
    try {
      const res = await SemanticSearchApi.count(params)
      setFlowCount(res.result.count)
    } catch {
      setFlowCount(null)
    } finally {
      setFlowLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowFoodType, flowArea, flowBudget, flowStyle, flowRestrictions, city])

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

  const totalAll = cities.reduce((s, c) => s + c.count, 0)

  return (
    <div ref={pageRef} className={`explore-page ${!searched ? 'explore-landing' : ''}`}>
      {!searched && <BinaryField pulseRef={pulseRef} />}
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
            <button className="header-lang-badge" type="button" onClick={openLanguageModal}>
              {langBadge}
            </button>
          </div>
        </header>

        <div className="explore-body">

          {/* City filter — searched only */}
          {searched && (
            <div className="explore-filters">
              <button
                className={`explore-filter-pill ${!city ? 'active' : ''}`}
                onClick={() => handleCity('')}
              >
                {fl.all} <span className="explore-filter-count">{totalAll}</span>
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
                  {flowFoodType && (
                    <span className="conv-trail-item" onClick={() => goToStep(1)}>
                      {lb(FOOD_TYPES.find(f => f.key === flowFoodType)!) }
                    </span>
                  )}
                  {flowArea && (
                    <span className="conv-trail-item" onClick={() => goToStep(2)}>
                      {lb(AREAS.find(a => a.key === flowArea)!)}
                    </span>
                  )}
                  {flowBudget && (
                    <span className="conv-trail-item" onClick={() => goToStep(3)}>
                      {lb(BUDGETS.find(b => b.key === flowBudget)!)}
                    </span>
                  )}
                  {flowStyle && flowStep > 4 && (
                    <span className="conv-trail-item" onClick={() => goToStep(4)}>
                      {lb(STYLES.find(s => s.key === flowStyle)!)}
                    </span>
                  )}
                  <span className="conv-reset" onClick={resetFlow}>{fl.restart}</span>
                </div>
              )}

              {/* Step 1: 何を食べたい？ */}
              {flowStep === 1 && flowTransition !== 'exiting' && (
                <div className={`conv-step ${flowTransition === 'entering' ? 'conv-entering' : ''}`}>
                  <BinaryText key={`q1-${flowStep}`} text={fl.q1} className="conv-question" />
                  <div className="conv-chips">
                    {FOOD_TYPES.map(f => (
                      <button key={f.key} className="conv-chip" onClick={() => answerFoodType(f.key)}>{lb(f)}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: エリア */}
              {flowStep === 2 && flowTransition !== 'exiting' && (
                <div className={`conv-step ${flowTransition === 'entering' ? 'conv-entering' : ''}`}>
                  <BinaryText key={`q2-${flowStep}`} text={fl.q2} className="conv-question" />
                  <div className="conv-chips">
                    {availableAreas.map(a => (
                      <button key={a.key} className="conv-chip" onClick={() => answerArea(a.key)}>{lb(a)}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: 予算 */}
              {flowStep === 3 && flowTransition !== 'exiting' && (
                <div className={`conv-step ${flowTransition === 'entering' ? 'conv-entering' : ''}`}>
                  <BinaryText key={`q3-${flowStep}`} text={fl.q3} className="conv-question" />
                  <div className="conv-chips">
                    {BUDGETS.map(b => (
                      <button key={b.key} className="conv-chip" onClick={() => answerBudget(b.key)}>{lb(b)}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: スタイル */}
              {flowStep === 4 && flowTransition !== 'exiting' && (
                <div className={`conv-step ${flowTransition === 'entering' ? 'conv-entering' : ''}`}>
                  <BinaryText key={`q4-${flowStep}`} text={fl.q4} className="conv-question" />
                  <div className="conv-chips">
                    {STYLES.map(s => (
                      <button key={s.key} className="conv-chip" onClick={() => answerStyle(s.key)}>{lb(s)}</button>
                    ))}
                  </div>
                  <button
                    className="conv-restriction-link"
                    onClick={() => setShowRestrictions(!showRestrictions)}
                  >
                    {showRestrictions ? fl.restrictionClose : fl.restrictionOpen}
                  </button>
                  {showRestrictions && (
                    <div className="conv-chips" style={{ marginTop: 8 }}>
                      {RESTRICTIONS.map(r => (
                        <button key={r.key} className={`conv-chip ${flowRestrictions.has(r.key) ? 'selected' : ''}`}
                          onClick={() => toggleSet(flowRestrictions, setFlowRestrictions, r.key)}>{lb(r)}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Results — reco cards + food type re-select */}
              {flowStep >= 5 && !searched && (
                <div className="conv-reco">
                  {recoLoading ? (
                    <div className="conv-question" style={{ padding: '0 24px' }}>{fl.searching}</div>
                  ) : recoCards.length > 0 ? (
                    <>
                      <BinaryText key={`reco-${recoFallback}-${flowFoodType}`} text={recoFallback ? fl.recoFallback : fl.recoTitle} className="conv-reco-title" />
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
                              <span className="conv-reco-city">{r.city || (isJa ? '福井' : 'Fukui')} · {r.menu_count}{isJa ? '品' : ' items'}</span>
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
                          {fl.seeMore.replace('{n}', String(recoTotal - 3))}
                        </button>
                      )}
                      {/* Food type re-select — change and update results */}
                      <div className="conv-switch">
                        <div className="conv-switch-label">{fl.otherGenre}</div>
                        <div className="conv-chips">
                          {FOOD_TYPES.filter(f => f.key !== flowFoodType).map(f => (
                            <button key={f.key} className="conv-chip conv-chip-small" onClick={() => switchFoodType(f.key)}>{lb(f)}</button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="conv-step">
                      <div className="conv-question">{fl.changeMore}</div>
                      <button className="conv-next" onClick={resetFlow}>{fl.startOver}</button>
                    </div>
                  )}
                </div>
              )}
              {/* Count bar — above search */}
              {flowStep >= 1 && (
                <div className="conv-count-bar" ref={countBarRef}>
                  {flowLoading ? (
                    <span className="conv-count-num-static">...</span>
                  ) : (
                    <span className="conv-count-num-static">
                      <BinaryText key={`fc-${flowCount}`} text={String(flowCount ?? '—')} className="conv-count-numerator" />
                      <span className="conv-count-sep"> / </span>
                      <span className="conv-count-denom">{stats?.enriched_menus?.toLocaleString() || '—'} NFG</span>
                    </span>
                  )}
                  {flowCount !== null && flowCount > 0 && (
                    <button className="conv-chip conv-chip-small" onClick={() => handleViewResults()}>{fl.viewNow}</button>
                  )}
                </div>
              )}

              {/* Search — secondary, at bottom of flow */}
              <div className="explore-search-wrap explore-search-secondary">
                <div className="explore-search-sub">{fl.searchMore}</div>
                <div style={{ position: 'relative' }}>
                  <Search size={16} className="explore-search-icon" />
                  <input
                    className="explore-search"
                    type="text"
                    placeholder={fl.searchPlaceholder}
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {searched && (
        <div className="explore-body">
          {/* Back + search */}
          <div style={{ padding: '8px 24px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="conv-reset" onClick={() => { setSearched(false); setQuery(''); setRestaurants([]); setTotal(0) }}>{fl.back}</span>
            <div style={{ position: 'relative' }}>
              <Search size={16} className="explore-search-icon" />
              <input
                className="explore-search"
                type="text"
                placeholder={fl.searchPlaceholder}
                value={query}
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
                autoFocus
              />
            </div>
          </div>

          {/* Results count + sort */}
          <div className="explore-results-bar">
            <span className="explore-results-count">
              {isJa ? `${total.toLocaleString()} 件` : fl.results.replace('{n}', total.toLocaleString())}{query && ` — "${query}"`}
            </span>
            {restaurants.some(r => r._nfg) && (
              <div className="explore-sort-toggle">
                <button
                  className={`explore-sort-btn ${sortBy === 'score' ? 'active' : ''}`}
                  onClick={() => handleSort('score')}
                >
                  {fl.score}
                </button>
                <button
                  className={`explore-sort-btn ${sortBy === 'menu_count' ? 'active' : ''}`}
                  onClick={() => handleSort('menu_count')}
                >
                  {fl.menuCount}
                </button>
              </div>
            )}
          </div>

          {/* Restaurant list */}
          <div className="explore-list">
            {loading ? (
              <div className="explore-loading">{fl.loading}</div>
            ) : restaurants.length === 0 ? (
              <div className="explore-empty">{fl.empty}</div>
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
                {fl.prev}
              </button>
              <span className="explore-page-info">{page} / {pages}</span>
              <button
                className="explore-page-btn"
                disabled={page >= pages}
                onClick={() => handlePage(page + 1)}
              >
                {fl.next}
              </button>
            </div>
          )}

          {stats && (
            <div className="explore-footer-stats">
              {fl.footer.replace('{r}', stats.total_restaurants.toLocaleString()).replace('{m}', stats.total_menus.toLocaleString()).replace('{e}', stats.enriched_menus.toLocaleString()).replace('{c}', String(stats.cities))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
