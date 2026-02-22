'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search } from 'lucide-react'
import { ExploreApi, SearchRestaurant, NfgSearchRestaurant, CityCount, PlatformStats } from '../services/api'

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
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStats | null>(null)
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
    } catch {
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    ExploreApi.cities().then(res => setCities(res.result)).catch(() => {})
    ExploreApi.stats().then(res => setStats(res.result)).catch(() => {})
    fetchRestaurants('', '', 1)
  }, [fetchRestaurants])

  const handleSearch = (q: string) => {
    setQuery(q)
    setPage(1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchRestaurants(q, city, 1), 300)
  }

  const handleCity = (c: string) => {
    const next = city === c ? '' : c
    setCity(next)
    setPage(1)
    fetchRestaurants(query, next, 1)
  }

  const handlePage = (p: number) => {
    setPage(p)
    fetchRestaurants(query, city, p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalAll = cities.reduce((s, c) => s + c.count, 0)

  return (
    <div className="explore-page">
      <header className="explore-header">
        <div className="explore-header-inner">
          <h1 className="explore-brand">
            NGraph <span className="explore-badge">β</span> <span className="explore-region">＠FUKUI</span>
          </h1>
          <p className="explore-tagline">人もAIも読める、飲食店の正解データ</p>

          {stats && (
            <div className="explore-stats">
              <div className="explore-stat">
                <span className="explore-stat-num">{stats.total_restaurants.toLocaleString()}</span>
                <span className="explore-stat-label">店舗</span>
              </div>
              <div className="explore-stat">
                <span className="explore-stat-num">{stats.total_menus.toLocaleString()}</span>
                <span className="explore-stat-label">メニュー</span>
              </div>
              <div className="explore-stat">
                <span className="explore-stat-num">{stats.enriched_menus.toLocaleString()}</span>
                <span className="explore-stat-label">NFG構造化</span>
              </div>
              <div className="explore-stat">
                <span className="explore-stat-num">{stats.cities}</span>
                <span className="explore-stat-label">都市</span>
              </div>
              <div className="explore-stat">
                <span className="explore-stat-num">{stats.translated_menus.toLocaleString()}</span>
                <span className="explore-stat-label">多言語</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="explore-body">
        {/* Search */}
        <div className="explore-search-wrap">
          <Search size={16} className="explore-search-icon" />
          <input
            className="explore-search"
            type="text"
            placeholder="店名で検索、または「蟹が食べたい」「片町で接待」等"
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        {/* City filter */}
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
                  <span className="explore-row-name">{r.name}</span>
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
      </div>
    </div>
  )
}
