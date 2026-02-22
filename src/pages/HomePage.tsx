'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search } from 'lucide-react'
import { ExploreApi, SearchRestaurant, CityCount } from '../services/api'

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [cities, setCities] = useState<CityCount[]>([])
  const [restaurants, setRestaurants] = useState<SearchRestaurant[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const fetchRestaurants = useCallback(async (q: string, c: string, p: number) => {
    setLoading(true)
    try {
      const res = await ExploreApi.search(q, c, p, 30)
      setRestaurants(res.result.items)
      setTotal(res.result.total)
      setPages(res.result.pages)
    } catch {
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    ExploreApi.cities().then(res => setCities(res.result)).catch(() => {})
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
        </div>
      </header>

      <div className="explore-body">
        {/* Search */}
        <div className="explore-search-wrap">
          <Search size={16} className="explore-search-icon" />
          <input
            className="explore-search"
            type="text"
            placeholder="店名で検索..."
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
                <span className="explore-row-name">{r.name}</span>
                {r.menu_count > 0 && (
                  <span className="explore-row-count">{r.menu_count}</span>
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
