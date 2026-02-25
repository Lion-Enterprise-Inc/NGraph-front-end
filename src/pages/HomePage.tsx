'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search } from 'lucide-react'
import { ExploreApi, SemanticSearchApi, MenuSearchApi, SearchRestaurant, NfgSearchRestaurant, SemanticSearchRestaurant, CityCount, PlatformStats, MenuNFGCard } from '../services/api'
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
  tx?: number; ty?: number // target position for portrait formation
}

// Canvas描画→ピクセルサンプリング共通
function samplePixels(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, step = 3): [number, number][] {
  if (typeof document === 'undefined') return []
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return []
  draw(ctx)
  const data = ctx.getImageData(0, 0, w, h).data
  const pixels: [number, number][] = []
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 128) pixels.push([x / w, y / h])
    }
  }
  return pixels
}

// パターン1: Nicomacos Food Graph テキスト
function genText(): [number, number][] {
  return samplePixels(240, 80, ctx => {
    ctx.fillStyle = '#000'
    ctx.font = "bold 28px 'Georgia', 'Times New Roman', serif"
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('Nicomacos', 120, 28)
    ctx.fillText('Food Graph', 120, 52)
  })
}

// パターン2: 鳥居
function genTorii(): [number, number][] {
  return samplePixels(200, 200, ctx => {
    ctx.fillStyle = '#000'
    // 上の笠木（反り）
    ctx.beginPath()
    ctx.moveTo(10, 40); ctx.quadraticCurveTo(100, 20, 190, 40)
    ctx.lineTo(190, 50); ctx.quadraticCurveTo(100, 32, 10, 50)
    ctx.fill()
    // 島木（直線梁）
    ctx.fillRect(25, 55, 150, 10)
    // 額束（中央の短い柱）
    ctx.fillRect(90, 55, 20, 20)
    // 貫（中段の横梁）
    ctx.fillRect(30, 75, 140, 8)
    // 左柱
    ctx.fillRect(45, 50, 14, 140)
    // 右柱
    ctx.fillRect(141, 50, 14, 140)
  }, 2)
}

// パターン3: 波（青海波風）
function genWave(): [number, number][] {
  return samplePixels(240, 120, ctx => {
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5
    const rows = 4, cols = 6, r = 22
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols + 1; col++) {
        const offsetX = row % 2 === 0 ? 0 : r
        const cx = col * r * 2 + offsetX
        const cy = row * r * 0.8 + r + 10
        for (let k = 0; k < 3; k++) {
          ctx.beginPath()
          ctx.arc(cx, cy, r - k * 6, Math.PI, 0)
          ctx.stroke()
        }
      }
    }
  })
}

// パターン4: 五重塔
function genPagoda(): [number, number][] {
  return samplePixels(200, 200, ctx => {
    ctx.fillStyle = '#000'
    const cx = 100
    // 相輪（頂部の飾り）
    ctx.fillRect(cx - 2, 8, 4, 20)
    ctx.beginPath(); ctx.arc(cx, 6, 4, 0, Math.PI * 2); ctx.fill()
    // 5層の屋根+壁
    const layers = [
      { y: 28, roofW: 44, wallW: 20, h: 18 },
      { y: 50, roofW: 56, wallW: 26, h: 18 },
      { y: 72, roofW: 68, wallW: 32, h: 18 },
      { y: 94, roofW: 80, wallW: 38, h: 18 },
      { y: 116, roofW: 92, wallW: 44, h: 22 },
    ]
    for (const l of layers) {
      // 屋根（反り）
      ctx.beginPath()
      ctx.moveTo(cx - l.roofW / 2, l.y + 6)
      ctx.quadraticCurveTo(cx, l.y - 4, cx + l.roofW / 2, l.y + 6)
      ctx.lineTo(cx + l.roofW / 2 - 4, l.y + 10)
      ctx.quadraticCurveTo(cx, l.y + 2, cx - l.roofW / 2 + 4, l.y + 10)
      ctx.fill()
      // 壁
      ctx.fillRect(cx - l.wallW / 2, l.y + 10, l.wallW, l.h - 10)
    }
    // 基壇
    ctx.fillRect(cx - 50, 138, 100, 8)
    ctx.fillRect(cx - 54, 146, 108, 6)
  }, 2)
}

// パターン5: 城（天守閣）
function genCastle(): [number, number][] {
  return samplePixels(200, 200, ctx => {
    ctx.fillStyle = '#000'
    const cx = 100
    // 最上階の屋根
    ctx.beginPath()
    ctx.moveTo(cx - 36, 42)
    ctx.quadraticCurveTo(cx, 24, cx + 36, 42)
    ctx.lineTo(cx + 32, 48)
    ctx.quadraticCurveTo(cx, 32, cx - 32, 48)
    ctx.fill()
    // 最上階の壁
    ctx.fillRect(cx - 22, 48, 44, 18)
    // 2階の屋根
    ctx.beginPath()
    ctx.moveTo(cx - 50, 70)
    ctx.quadraticCurveTo(cx, 54, cx + 50, 70)
    ctx.lineTo(cx + 46, 76)
    ctx.quadraticCurveTo(cx, 62, cx - 46, 76)
    ctx.fill()
    // 2階の壁
    ctx.fillRect(cx - 32, 76, 64, 20)
    // 1階の屋根
    ctx.beginPath()
    ctx.moveTo(cx - 64, 100)
    ctx.quadraticCurveTo(cx, 82, cx + 64, 100)
    ctx.lineTo(cx + 60, 106)
    ctx.quadraticCurveTo(cx, 90, cx - 60, 106)
    ctx.fill()
    // 1階の壁
    ctx.fillRect(cx - 42, 106, 84, 24)
    // 石垣（台形）
    ctx.beginPath()
    ctx.moveTo(cx - 42, 130)
    ctx.lineTo(cx - 60, 170)
    ctx.lineTo(cx + 60, 170)
    ctx.lineTo(cx + 42, 130)
    ctx.fill()
    // しゃちほこ
    ctx.beginPath(); ctx.arc(cx - 30, 38, 5, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(cx + 30, 38, 5, 0, Math.PI * 2); ctx.fill()
  }, 2)
}

const _patternCache: [number, number][][] = []
const PATTERN_GENERATORS = [genText, genTorii, genWave, genPagoda, genCastle]
let _patternIndex = 0
function getNextPattern(): [number, number][] {
  if (_patternCache.length === 0) {
    for (const gen of PATTERN_GENERATORS) _patternCache.push(gen())
  }
  const pattern = _patternCache[_patternIndex % _patternCache.length]
  _patternIndex++
  return pattern
}

// ニコマコス倫理学 目次 → UTF-8 binary
// "第一巻 善と幸福 第二巻 徳について ..." をビット列化
// 全て集めてデコードすると原文が復元される裏設定
const NICOMACHEAN_BITS = '11100111101011001010110011100100101110001000000011100101101101111011101100100000111001011001011010000100111000111000000110101000111001011011100110111000111001111010011010001111001000001110011110101100101011001110010010111010100011001110010110110111101110110010000011100101101111101011001111100011100000011010101111100011100000011010010011100011100000011000010011100011100000011010011000100000111001111010110010101100111001001011100010001001111001011011011110111011001000001110010110001011100001111110011010110000100101111110001110000001101010001110011110101111100000001110010110001000101101100010000011100111101011001010110011100101100110111001101111100101101101111011101100100000111010001010101110111000111001011011111010110011111000111000000110101011111000111000000110100100111000111000000110000100111000111000000110100110001000001110011110101100101011001110010010111010100101001110010110110111101110110010000011100110101011011010001111100111101111101010100100100000111001111010110010101100111001011000010110101101111001011011011110111011001000001110011110011111101001011110011010000000101001111110011110011010100001001110001110000001101010101110010110111110101100110010000011100111101011001010110011100100101110001000001111100101101101111011101100100000111001101000101010010001111001011000100010110110111000111000000110101000111001011011111110101011111001101010010110111101001000001110011110101100101011001110010110000101101010111110010110110111101110110010000011100101100011111000101111100110100001001001101100100000111001111010110010101100111001001011100110011101111001011011011110111011001000001110010110001111100010111110011010000100100110111110001110000001101011101110011110110110100110101110001110000001100011010010000011100111101011001010110011100101100011011000000111100101101101111011101100100000111001011011111110101011111001101010010110111101111000111000000110101000111010001010011010110011111001101000001110110011111001111001101010000100111001111001010010011111111001101011010010111011'
let _bitIndex = 0

function BinaryField({ pulseRef }: { pulseRef?: React.RefObject<{ x: number; y: number; strength: number }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let particles: Particle[] = []
    const COUNT_MIN = 20
    const COUNT_MAX = 250
    const GROW_INTERVAL = 2000 // add a particle every 2s
    let targetCount = COUNT_MIN
    let lastGrow = Date.now()
    const COUNT = COUNT_MAX // alphas array max size
    let pointer = { x: -9999, y: -9999, active: false }
    let lastInteraction = Date.now()
    let portraitActive = false
    let portraitStrength = 0 // 0-1, fades in slowly
    let portraitFormedAt = 0 // timestamp when fully formed
    let portraitDone = false  // true after scatter cycle, won't re-trigger until interaction

    const resetIdle = () => {
      lastInteraction = Date.now()
      if (portraitActive) {
        portraitActive = false
        for (const p of particles) { p.tx = undefined; p.ty = undefined }
      }
      portraitDone = false // allow next idle cycle
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true }
      resetIdle()
    }
    const onTouch = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      const t = e.touches[0]
      if (t) pointer = { x: t.clientX - rect.left, y: t.clientY - rect.top, active: true }
      resetIdle()
    }
    const onLeave = () => { pointer.active = false }
    const onKeyDown = () => { resetIdle() }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('touchmove', onTouch, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('touchend', onLeave)
    document.addEventListener('keydown', onKeyDown)

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
        char: NICOMACHEAN_BITS[_bitIndex++ % NICOMACHEAN_BITS.length],
        life: 0,
        maxLife: 300 + Math.random() * 400,
      }
    }

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      particles = Array.from({ length: COUNT_MIN }, () => {
        const p = spawn(canvas.width, canvas.height)
        p.life = Math.random() * p.maxLife
        return p
      })
      targetCount = COUNT_MIN
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

      // Grow particles over time
      const now = Date.now()
      if (now - lastGrow > GROW_INTERVAL && particles.length < COUNT_MAX) {
        lastGrow = now
        targetCount = Math.min(targetCount + 1, COUNT_MAX)
        if (particles.length < targetCount) {
          particles.push(spawn(canvas.width, canvas.height))
        }
      }

      // Portrait formation check (5 min idle)
      const idleMs = Date.now() - lastInteraction
      const IDLE_THRESHOLD = 5_000 // TEST: 5s (prod: 300_000)
      if (idleMs > IDLE_THRESHOLD && !portraitActive && !portraitDone) {
        portraitActive = true
        portraitStrength = 0
        portraitFormedAt = 0
        const pixels = getNextPattern()
        if (pixels.length > 0) {
          const scale = Math.min(canvas.width, canvas.height) * 0.7
          const ox = canvas.width / 2 - scale * 0.5
          const oy = canvas.height / 2 - scale * 0.5
          for (let i = 0; i < particles.length; i++) {
            const pi = i % pixels.length
            const [px, py] = pixels[pi]
            particles[i].tx = ox + px * scale + (Math.random() - 0.5) * 4
            particles[i].ty = oy + py * scale + (Math.random() - 0.5) * 4
          }
        }
      }
      if (portraitActive) {
        portraitStrength = Math.min(portraitStrength + 0.001, 1) // ~17s to form
        // Hold 3s after fully formed, then scatter
        if (portraitStrength >= 0.95 && portraitFormedAt === 0) {
          portraitFormedAt = Date.now()
        }
        if (portraitFormedAt > 0 && Date.now() - portraitFormedAt > 3000) {
          portraitActive = false
          portraitDone = true
          for (const p of particles) {
            p.tx = undefined; p.ty = undefined
            const angle = Math.random() * Math.PI * 2
            p.vx += Math.cos(angle) * 1.5
            p.vy += Math.sin(angle) * 1.5
          }
          // 散った後、再度アイドルで次パターンへ
          setTimeout(() => { portraitDone = false; lastInteraction = Date.now() }, 5000)
        }
      } else {
        portraitStrength = Math.max(portraitStrength - 0.02, 0)
      }

      // update & compute visible alpha
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Portrait target attraction (very gentle)
        if (p.tx !== undefined && p.ty !== undefined && portraitStrength > 0) {
          const tdx = p.tx - p.x
          const tdy = p.ty - p.y
          const tdist = Math.sqrt(tdx * tdx + tdy * tdy)
          if (tdist > 1) {
            const force = portraitStrength * 0.02
            p.vx += (tdx / tdist) * force * Math.min(tdist, 50)
            p.vy += (tdy / tdist) * force * Math.min(tdist, 50)
          }
          // Slow down near target
          if (tdist < 15) {
            p.vx *= 0.92
            p.vy *= 0.92
          }
          // Extend life while forming portrait
          if (p.life > p.maxLife * 0.7) {
            p.life = p.maxLife * 0.7
          }
        }

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
            const lineAlpha = Math.min(Math.min(alphas[i], alphas[j]) * (1 - d / SYNAPSE_DIST) * 0.7, 0.1)
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
        const cappedAlpha = Math.min(alphas[i] * 0.5, 0.15)
        ctx.fillStyle = `rgba(16, 163, 127, ${cappedAlpha})`
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
      document.removeEventListener('keydown', onKeyDown)
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
  { key: 'crab', label: '蟹', labelEn: 'Crab', labelKo: '게', labelZh: '螃蟹', q: '蟹,カニ,かに,ズワイ,セイコ' },
  { key: 'seafood', label: '海鮮・お刺身', labelEn: 'Seafood & Sashimi', labelKo: '해산물・회', labelZh: '海鲜・刺身', q: '海鮮,刺身,魚', category: 'sashimi,seafood' },
  { key: 'sushi', label: '寿司', labelEn: 'Sushi', labelKo: '초밥', labelZh: '寿司', q: '寿司,すし,にぎり', category: 'sushi,nigiri,gunkan,roll' },
  { key: 'meat', label: '肉料理', labelEn: 'Meat', labelKo: '고기 요리', labelZh: '肉料理', q: '肉,カツ,ステーキ,焼肉', category: 'meat' },
  { key: 'nabe', label: '鍋', labelEn: 'Hot Pot', labelKo: '전골', labelZh: '火锅', q: '鍋,しゃぶ,すき焼き', category: 'nabe,hotpot' },
  { key: 'ramen', label: '麺類', labelEn: 'Noodles', labelKo: '면류', labelZh: '面类', q: '麺,ラーメン,そば,うどん', category: 'ramen,soba,noodle' },
  { key: 'drinking', label: 'お酒に合うつまみ', labelEn: 'Bar Snacks', labelKo: '안주', labelZh: '下酒菜', mood: 'drinking' },
  { key: 'local', label: '福井の名物', labelEn: 'Fukui Specialties', labelKo: '후쿠이 명물', labelZh: '福井名产', mood: 'local' },
  { key: 'light', label: 'あっさり', labelEn: 'Light & Healthy', labelKo: '가벼운 음식', labelZh: '清淡料理', q: 'サラダ,酢の物,蒸し', category: 'salad,steamed,vinegared' },
] as const

const AREAS = [
  { key: 'nearby', label: '現在地の近く', labelEn: 'Near me', labelKo: '내 주변', labelZh: '我附近', area: '' },
  { key: 'fukui', label: '福井市', labelEn: 'Fukui City', labelKo: '후쿠이시', labelZh: '福井市', area: '福井市' },
  { key: 'echizen', label: '越前・鯖江', labelEn: 'Echizen / Sabae', labelKo: '에치젠・사바에', labelZh: '越前・鯖江', area: '越前市' },
  { key: 'tsuruga', label: '敦賀', labelEn: 'Tsuruga', labelKo: '쓰루가', labelZh: '敦贺', area: '敦賀市' },
  { key: 'awara', label: 'あわら', labelEn: 'Awara', labelKo: '아와라', labelZh: '芦原', area: 'あわら市' },
  { key: 'okuetsu', label: '奥越（大野・勝山）', labelEn: 'Okuetsu (Ono/Katsuyama)', labelKo: '오쿠에츠', labelZh: '奥越（大野・胜山）', area: '大野市,勝山市' },
  { key: 'anywhere', label: 'どこでもOK', labelEn: 'Anywhere', labelKo: '어디든 OK', labelZh: '都可以', area: '' },
] as const

// 各エリアの代表座標（geolocation→最寄りエリア判定用）
const AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  fukui: { lat: 36.0652, lng: 136.2219 },
  echizen: { lat: 35.9045, lng: 136.1681 },
  tsuruga: { lat: 35.6454, lng: 136.0556 },
  awara: { lat: 36.2113, lng: 136.2300 },
  okuetsu: { lat: 35.9811, lng: 136.4879 },
}

const BUDGETS = [
  { key: 'under1000', label: '~1,000円', labelEn: '~¥1,000', min: 0, max: 1000 },
  { key: '1000to2000', label: '1,000~2,000円', labelEn: '¥1,000~2,000', min: 1000, max: 2000 },
  { key: '2000to3000', label: '2,000~3,000円', labelEn: '¥2,000~3,000', min: 2000, max: 3000 },
  { key: '3000to5000', label: '3,000~5,000円', labelEn: '¥3,000~5,000', min: 3000, max: 5000 },
  { key: 'over5000', label: '5,000円~', labelEn: '¥5,000+', min: 5000, max: 0 },
  { key: 'any', label: '気にしない', labelEn: "Don't mind", labelKo: '상관없음', labelZh: '不限', min: 0, max: 0 },
] as const

// 店名分割: 「個室居酒屋 ぼんた 本店」→ brand="個室居酒屋 ぼんた", suffix="本店"
const BRANCH_SUFFIXES = ['本店', '別館', '分店', '支店', '新館', '駅前店', '個室お二階']
function splitStoreName(name: string): { brand: string; suffix: string } {
  for (const s of BRANCH_SUFFIXES) {
    if (name.endsWith(s) && name.length > s.length) {
      return { brand: name.slice(0, -s.length).trimEnd(), suffix: s }
    }
  }
  return { brand: name, suffix: '' }
}

const STYLES = [
  { key: 'hearty', label: 'がっつり', labelEn: 'Hearty', labelKo: '든든하게', labelZh: '吃饱', mood: 'hearty' },
  { key: 'budget', label: 'コスパ重視', labelEn: 'Budget', labelKo: '가성비', labelZh: '性价比', mood: 'budget' },
  { key: 'drinking', label: '飲みメイン', labelEn: 'Drinks First', labelKo: '술 위주', labelZh: '以酒为主', mood: 'drinking' },
  { key: 'none', label: '特にこだわりなし', labelEn: 'No preference', labelKo: '특별히 없음', labelZh: '无偏好', mood: '' },
] as const

const FLOW_QUESTIONS: Record<string, { q1: string; q2: string; q3: string; q4: string; viewNow: string; searchMore: string; restart: string; otherGenre: string; otherArea: string; changeMore: string; startOver: string; searching: string; recoFallback: string; recoTitle: string; seeMore: string; restrictionOpen: string; restrictionClose: string; searchPlaceholder: string; all: string; back: string; results: string; score: string; menuCount: string; loading: string; empty: string; prev: string; next: string; footer: string }> = {
  ja: { q1: '何を食べたいですか？', q2: 'どのあたりで探しますか？', q3: '予算は？', q4: 'スタイルは？', viewNow: '今すぐ見る', searchMore: 'もっと細かく探す', restart: '← やり直す', otherGenre: '他のジャンルも見る', otherArea: '他のエリア', changeMore: 'もう少し条件を変えてみよう', startOver: 'はじめから探す', searching: '探しています...', recoFallback: 'ぴったりは見つからなかったけど…こちらはどうですか？', recoTitle: 'おすすめのお店', seeMore: '他 {n} 件を見る', restrictionOpen: 'アレルギー・食事制限がある方', restrictionClose: 'アレルギー設定を閉じる', searchPlaceholder: '卵不使用・ハラール・昆布だし・店名で検索', all: 'すべて', back: '← 戻る', results: '{n} 件', score: 'スコア順', menuCount: 'メニュー数順', loading: '読み込み中...', empty: '該当する店舗がありません', prev: '前へ', next: '次へ', footer: '{r}店舗 · {m}メニュー · {e}構造化 · {c}都市' },
  en: { q1: 'What do you want to eat?', q2: 'Which area?', q3: 'Budget?', q4: 'Style?', viewNow: 'View now', searchMore: 'Search with details', restart: '← Start over', otherGenre: 'Try other genres', otherArea: 'Other areas', changeMore: 'Try different options', startOver: 'Start from scratch', searching: 'Searching...', recoFallback: "Couldn't find an exact match, but how about these?", recoTitle: 'Recommended', seeMore: 'See {n} more', restrictionOpen: 'Allergies & dietary restrictions', restrictionClose: 'Close allergy settings', searchPlaceholder: 'No egg, halal, kelp stock, restaurant name...', all: 'All', back: '← Back', results: '{n} results', score: 'By score', menuCount: 'By menu count', loading: 'Loading...', empty: 'No restaurants found', prev: 'Prev', next: 'Next', footer: '{r} restaurants · {m} menus · {e} structured · {c} cities' },
  ko: { q1: '무엇을 드시고 싶으세요?', q2: '어디서 찾으시나요?', q3: '예산은?', q4: '스타일은?', viewNow: '지금 보기', searchMore: '상세 검색', restart: '← 다시 시작', otherGenre: '다른 장르 보기', otherArea: '다른 지역', changeMore: '조건 변경', startOver: '처음부터', searching: '검색 중...', recoFallback: '정확한 결과는 없지만... 이런 건 어떠세요?', recoTitle: '추천 맛집', seeMore: '외 {n}건 보기', restrictionOpen: '알레르기・식이 제한', restrictionClose: '알레르기 설정 닫기', searchPlaceholder: '달걀 제외, 할랄, 다시마, 가게명 검색', all: '전체', back: '← 뒤로', results: '{n}건', score: '점수순', menuCount: '메뉴 수순', loading: '로딩 중...', empty: '해당 매장이 없습니다', prev: '이전', next: '다음', footer: '{r}매장 · {m}메뉴 · {e}구조화 · {c}도시' },
  'zh-Hans': { q1: '想吃什么？', q2: '在哪里找？', q3: '预算？', q4: '风格？', viewNow: '立即查看', searchMore: '详细搜索', restart: '← 重新开始', otherGenre: '其他类型', otherArea: '其他地区', changeMore: '换个条件', startOver: '从头开始', searching: '搜索中...', recoFallback: '没找到完美匹配，这些怎么样？', recoTitle: '推荐', seeMore: '查看其余 {n} 家', restrictionOpen: '过敏・饮食限制', restrictionClose: '关闭过敏设置', searchPlaceholder: '无蛋、清真、昆布高汤、店名搜索', all: '全部', back: '← 返回', results: '{n} 家', score: '评分排序', menuCount: '菜品数排序', loading: '加载中...', empty: '没有符合的餐厅', prev: '上一页', next: '下一页', footer: '{r}餐厅 · {m}菜品 · {e}结构化 · {c}城市' },
}

// アレルゲン（特定原材料8品目）
const ALLERGENS_8 = [
  { key: 'shrimp', label: 'えび', labelEn: 'Shrimp', labelKo: '새우', labelZh: '虾', no: 'shrimp' },
  { key: 'crab_a', label: 'かに', labelEn: 'Crab', labelKo: '게', labelZh: '蟹', no: 'crab' },
  { key: 'egg', label: '卵', labelEn: 'Egg', labelKo: '달걀', labelZh: '鸡蛋', no: 'egg' },
  { key: 'wheat', label: '小麦', labelEn: 'Wheat', labelKo: '밀', labelZh: '小麦', no: 'wheat' },
  { key: 'milk', label: '乳', labelEn: 'Dairy', labelKo: '유제품', labelZh: '乳制品', no: 'milk' },
  { key: 'soba', label: 'そば', labelEn: 'Soba', labelKo: '소바', labelZh: '荞麦', no: 'soba' },
  { key: 'peanut', label: '落花生', labelEn: 'Peanut', labelKo: '땅콩', labelZh: '花生', no: 'peanut' },
  { key: 'walnut', label: 'くるみ', labelEn: 'Walnut', labelKo: '호두', labelZh: '核桃', no: 'walnut' },
] as const

// 食事制限
const DIET_RESTRICTIONS = [
  { key: 'halal', label: 'ハラール', labelEn: 'Halal', labelKo: '할랄', labelZh: '清真', diet: 'halal' },
  { key: 'vegetarian', label: 'ベジタリアン', labelEn: 'Vegetarian', labelKo: '채식', labelZh: '素食', diet: 'vegetarian' },
  { key: 'gluten_free', label: 'グルテンフリー', labelEn: 'Gluten Free', labelKo: '글루텐프리', labelZh: '无麸质', diet: 'gluten_free' },
] as const

type SortKey = 'score' | 'menu_count'
type DisplayRestaurant = (SearchRestaurant | NfgSearchRestaurant) & { _nfg?: boolean }

export default function HomePage() {
  const router = useRouter()
  const { language, openLanguageModal, setGeoLocation } = useAppContext()
  const langBadge = LANG_BADGES[language] || language.slice(0, 2).toUpperCase()
  const isJa = language === 'ja'
  const fl = FLOW_QUESTIONS[language] || (language.startsWith('zh') ? FLOW_QUESTIONS['zh-Hans'] : null) || FLOW_QUESTIONS.en
  const lb = (item: { label: string; labelEn: string; labelKo?: string; labelZh?: string }) => {
    if (language === 'ja') return item.label
    if (language === 'ko') return item.labelKo || item.labelEn
    if (language.startsWith('zh')) return item.labelZh || item.labelEn
    return item.labelEn
  }
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
  const composingRef = useRef(false)
  const [menuResults, setMenuResults] = useState<MenuNFGCard[]>([])

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
    setMenuResults([])
    try {
      // NFGメニューカード検索（2文字以上のテキスト検索時）
      const menuPromise = q.length >= 2
        ? MenuSearchApi.search({ q, area: c, nfg: true, size: 20 }).catch(() => null)
        : Promise.resolve(null)

      if (q && isNfgQuery(q)) {
        const [res, menuRes] = await Promise.all([
          ExploreApi.nfgSearch(q, c, p, 30),
          menuPromise,
        ])
        const items: DisplayRestaurant[] = res.result.items.map(r => ({ ...r, _nfg: true }))
        setRestaurants(items)
        setTotal(res.result.total)
        setPages(res.result.pages)
        if (menuRes?.result?.menus?.length) setMenuResults(menuRes.result.menus as MenuNFGCard[])
      } else {
        const [res, menuRes] = await Promise.all([
          ExploreApi.search(q, c, p, 30),
          menuPromise,
        ])
        if (menuRes?.result?.menus?.length) setMenuResults(menuRes.result.menus as MenuNFGCard[])
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
  }

  const triggerSearch = (q: string) => {
    setPage(1)
    if (q.length >= 1) {
      setSearched(true)
      fetchRestaurants(q, city, 1)
    } else if (q.length === 0) {
      if (city) {
        setSearched(true)
        fetchRestaurants('', city, 1)
      } else {
        setSearched(false)
        setRestaurants([])
        setTotal(0)
        setPages(1)
      }
    }
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
      const a = ALLERGENS_8.find(x => x.key === key)
      if (a) allergens.push(a.no)
      const d = DIET_RESTRICTIONS.find(x => x.key === key)
      if (d && d.diet) diets.push(d.diet)
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
    if (key === 'nearby') {
      if (!navigator.geolocation) { setFlowArea('anywhere'); advanceStep(); return }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords
          setGeoLocation({ lat, lng })
          // 最寄りエリアを判定
          let best = 'fukui'
          let bestDist = Infinity
          for (const [k, c] of Object.entries(AREA_COORDS)) {
            const d = (lat - c.lat) ** 2 + (lng - c.lng) ** 2
            if (d < bestDist) { bestDist = d; best = k }
          }
          setFlowArea(best)
          advanceStep()
        },
        () => { setFlowArea('anywhere'); advanceStep() },
        { timeout: 8000 }
      )
      return
    }
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

              {/* New restaurant announcements */}
              {flowStep === 1 && (
                <div className="new-restaurant-links">
                  <span className="new-restaurant-label">NEW</span>
                  <span
                    className="new-restaurant-link"
                    onClick={() => router.push(`/capture?restaurant=${encodeURIComponent('ジョルノ')}&new=1`)}
                  >
                    {isJa ? 'ジョルノ 福井駅前店' : 'Giorno Fukui'}
                  </span>
                  <span className="new-restaurant-sep">|</span>
                  <span
                    className="new-restaurant-link"
                    onClick={() => router.push(`/capture?restaurant=${encodeURIComponent('ジョルノ-片町店')}&new=1`)}
                  >
                    {isJa ? '片町店' : 'Katamachi'}
                  </span>
                </div>
              )}

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
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                        {isJa ? 'アレルゲン（特定原材料8品目）' : 'Allergens'}
                      </div>
                      <div className="conv-chips">
                        {ALLERGENS_8.map(r => (
                          <button key={r.key} className={`conv-chip ${flowRestrictions.has(r.key) ? 'selected' : ''}`}
                            onClick={() => toggleSet(flowRestrictions, setFlowRestrictions, r.key)}>{lb(r)}</button>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 12, marginBottom: 6 }}>
                        {isJa ? '食事制限' : 'Dietary'}
                      </div>
                      <div className="conv-chips">
                        {DIET_RESTRICTIONS.map(r => (
                          <button key={r.key} className={`conv-chip ${flowRestrictions.has(r.key) ? 'selected' : ''}`}
                            onClick={() => toggleSet(flowRestrictions, setFlowRestrictions, r.key)}>{lb(r)}</button>
                        ))}
                      </div>
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
                            <div className="conv-reco-restaurant">
                              {(() => { const s = splitStoreName(r.name); return <>{s.brand}{s.suffix && <span className="store-suffix">{s.suffix}</span>}</> })()}
                              {!isJa && r.name_romaji && <div className="store-romaji">{r.name_romaji}</div>}
                            </div>
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
                      <div className="conv-switch" style={{ marginTop: 8 }}>
                        <div className="conv-switch-label">{fl.otherArea}</div>
                        <div className="conv-chips">
                          {availableAreas.filter(a => a.key !== flowArea).map(a => (
                            <button key={a.key} className="conv-chip conv-chip-small" onClick={() => {
                              setFlowArea(a.key)
                              fetchReco(buildFlowParams({ areaKey: a.key }))
                            }}>{lb(a)}</button>
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
                    onCompositionStart={() => { composingRef.current = true }}
                    onCompositionEnd={() => { composingRef.current = false }}
                    onKeyDown={e => e.key === 'Enter' && !composingRef.current && handleSearchSubmit()}
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
            <span className="conv-reset" onClick={() => { setSearched(false); setQuery(''); setRestaurants([]); setTotal(0); resetFlow() }}>{fl.back}</span>
            <div style={{ position: 'relative' }}>
              <Search size={16} className="explore-search-icon" />
              <input
                className="explore-search"
                type="text"
                placeholder={fl.searchPlaceholder}
                value={query}
                onChange={e => handleSearch(e.target.value)}
                onCompositionStart={() => { composingRef.current = true }}
                onCompositionEnd={() => { composingRef.current = false }}
                onKeyDown={e => e.key === 'Enter' && !composingRef.current && handleSearchSubmit()}
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

          {/* NFG Menu Cards — メイン表示 */}
          {menuResults.length > 0 && (
            <div className="nfg-menu-section">
              <div className="nfg-menu-label">{isJa ? '一致するメニュー' : 'Matching dishes'} ({menuResults.length})</div>
              <div className="nfg-menu-list">
                {menuResults.map(m => (
                  <button
                    key={m.uid}
                    className="nfg-menu-card"
                    onClick={() => router.push(`/capture?restaurant=${encodeURIComponent(m.restaurant_slug)}`)}
                  >
                    <div className="nfg-menu-card-header">
                      <div className="nfg-menu-card-title">
                        <span className="nfg-menu-name">{m.name_jp}</span>
                        {m.verification_rank && (
                          <span className={`nfg-rank-badge nfg-rank-${m.verification_rank}`}>{m.verification_rank}</span>
                        )}
                      </div>
                      {m.price > 0 && <div className="nfg-menu-price">¥{m.price.toLocaleString()}</div>}
                    </div>
                    <div className="nfg-menu-card-restaurant">
                      {(() => { const s = splitStoreName(m.restaurant_name); return <>{s.brand}{s.suffix && <span className="store-suffix">{s.suffix}</span>}</> })()}
                      {m.restaurant_city ? ` · ${m.restaurant_city}` : ''}
                      {!isJa && m.restaurant_name_romaji && <span className="store-romaji"> {m.restaurant_name_romaji}</span>}
                    </div>
                    {m.narrative_snippet && <div className="nfg-menu-narrative">{m.narrative_snippet}</div>}
                    {m.ingredients.length > 0 && (
                      <div className="nfg-menu-ingredients">
                        {m.ingredients.slice(0, 5).map((ing, i) => <span key={i} className="nfg-ingredient-tag">{ing}</span>)}
                        {m.ingredients.length > 5 && <span className="nfg-ingredient-tag nfg-more">+{m.ingredients.length - 5}</span>}
                      </div>
                    )}
                    {m.allergens.length > 0 && (
                      <div className="nfg-menu-allergens">
                        {m.allergens.map((a, i) => <span key={i} className="nfg-allergen-badge">{a}</span>)}
                      </div>
                    )}
                    {m.featured_tags.length > 0 && (
                      <div className="nfg-menu-tags">
                        {m.featured_tags.map((t, i) => <span key={i} className="nfg-featured-tag">{t}</span>)}
                      </div>
                    )}
                    {m.score > 0 && <div className="nfg-menu-score">{m.score}pt</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                      <span className="explore-row-name">
                        {(() => { const s = splitStoreName(r.name); return <>{s.brand}{s.suffix && <span className="store-suffix">{s.suffix}</span>}</> })()}
                        {!isJa && (r as any).name_romaji && <span className="store-romaji">{(r as any).name_romaji}</span>}
                      </span>
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
