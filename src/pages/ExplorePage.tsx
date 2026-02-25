'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MenuSimpleIcon from '../components/icons/MenuSimpleIcon'
import RefreshIcon from '../components/icons/RefreshIcon'
import TranslateIcon from '../components/icons/TranslateIcon'
import { useAppContext } from '../components/AppProvider'
import { getUiCopy } from '../i18n/uiCopy'
import { ExploreApi, type SearchRestaurant, type CityCount, type NearbyRestaurant } from '../services/api'
import NearbyList from '../components/NearbyList'

export default function ExplorePage() {
  const router = useRouter()
  const { language, geoLocation } = useAppContext()
  const copy = getUiCopy(language)

  const [query, setQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [cities, setCities] = useState<CityCount[]>([])
  const [results, setResults] = useState<SearchRestaurant[]>([])
  const [nearby, setNearby] = useState<NearbyRestaurant[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load cities on mount
  useEffect(() => {
    ExploreApi.cities()
      .then((res) => setCities(res.result || []))
      .catch(() => {})
  }, [])

  // Load nearby on mount if GPS available
  useEffect(() => {
    if (!geoLocation) return
    setNearbyLoading(true)
    ExploreApi.nearby(geoLocation.lat, geoLocation.lng)
      .then((res) => setNearby(res.result || []))
      .catch(() => {})
      .finally(() => setNearbyLoading(false))
  }, [geoLocation])

  // Search with debounce
  const doSearch = useCallback((q: string, city: string, p: number, append: boolean) => {
    setLoading(true)
    ExploreApi.search(q, city, p, 20)
      .then((res) => {
        const data = res.result
        if (append) {
          setResults((prev) => [...prev, ...data.items])
        } else {
          setResults(data.items)
        }
        setTotalPages(data.pages)
        setTotalCount(data.total)
        setPage(data.page)
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
        setInitialLoading(false)
      })
  }, [])

  // Initial load + debounced search on query/city change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(query, selectedCity, 1, false)
    }, initialLoading ? 0 : 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedCity])

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      doSearch(query, selectedCity, page + 1, true)
    }
  }

  const handleSelect = (slug: string) => {
    router.push(`/capture?restaurant=${slug}`)
  }

  const totalAll = cities.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="page explore-page">
      <div className="browser-shell">
        <button
          className="icon-button ghost"
          type="button"
          aria-label={copy.common.back}
          onClick={() => router.push('/home')}
        >
          <MenuSimpleIcon />
        </button>
        <div className="browser-pill">
          <span className="browser-dot" />
          <span className="browser-address">ngraph.me</span>
        </div>
        <button className="icon-button ghost" type="button" aria-label={copy.common.reload}>
          <RefreshIcon />
        </button>
      </div>

      <main style={{ flex: 1, overflow: 'auto', padding: '0' }}>
        {/* Search bar */}
        <div style={{ padding: '12px 16px 8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.06)', borderRadius: '10px',
            padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <span style={{ fontSize: '16px', flexShrink: 0, opacity: 0.5 }}>🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.explore.searchPlaceholder || 'レストランを探す'}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'rgba(255,255,255,0.9)', fontSize: '14px',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                  width: '20px', height: '20px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
                  fontSize: '12px', flexShrink: 0,
                }}
              >✕</button>
            )}
          </div>
        </div>

        {/* City filter chips */}
        {cities.length > 0 && (
          <div style={{
            display: 'flex', gap: '6px', padding: '4px 16px 12px',
            overflowX: 'auto', WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}>
            <button
              type="button"
              onClick={() => setSelectedCity('')}
              style={{
                flexShrink: 0, padding: '6px 12px', borderRadius: '16px', border: 'none',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                background: selectedCity === '' ? '#10a37f' : 'rgba(255,255,255,0.08)',
                color: selectedCity === '' ? '#fff' : 'rgba(255,255,255,0.6)',
                transition: 'background 0.15s',
              }}
            >
              {copy.explore.allCities || 'すべて'}({totalAll})
            </button>
            {cities.map((c) => (
              <button
                key={c.city}
                type="button"
                onClick={() => setSelectedCity(c.city === selectedCity ? '' : c.city)}
                style={{
                  flexShrink: 0, padding: '6px 12px', borderRadius: '16px', border: 'none',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: selectedCity === c.city ? '#10a37f' : 'rgba(255,255,255,0.08)',
                  color: selectedCity === c.city ? '#fff' : 'rgba(255,255,255,0.6)',
                  transition: 'background 0.15s',
                }}
              >
                {c.city}({c.count})
              </button>
            ))}
          </div>
        )}

        {/* Nearby section (GPS) */}
        {nearby.length > 0 && !query && !selectedCity && (
          <div>
            <div style={{ padding: '8px 16px 6px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              📍 {copy.explore.nearbyTitle || '近くのお店'}
            </div>
            <div style={{
              display: 'flex', gap: '8px', padding: '0 16px 12px',
              overflowX: 'auto', WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}>
              {nearby.slice(0, 5).map((item) => (
                <button
                  key={item.uid}
                  type="button"
                  onClick={() => handleSelect(item.slug)}
                  style={{
                    flexShrink: 0, width: '140px', padding: '12px',
                    background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)', marginBottom: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
                    overflow: 'hidden',
                  }}>
                    {item.logo_url ? (
                      <img src={item.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      item.name.charAt(0)
                    )}
                  </div>
                  <div style={{
                    fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.9)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                    {item.distance_m < 1000
                      ? `${Math.round(item.distance_m)}m`
                      : `${(item.distance_m / 1000).toFixed(1)}km`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results list */}
        <div>
          <div style={{ padding: '8px 16px 6px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            {copy.explore.listTitle || '店舗一覧'}
            {totalCount > 0 && ` (${totalCount})`}
          </div>

          {initialLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
              <div style={{
                width: '24px', height: '24px',
                border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'rgba(255,255,255,0.5)',
                borderRadius: '50%', animation: 'spin 1s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
              {copy.explore.noResults || '該当するレストランが見つかりませんでした'}
            </div>
          ) : (
            <>
              <NearbyList
                items={results.map((r) => ({
                  uid: r.uid, name: r.name, slug: r.slug,
                  logo_url: r.logo_url, address: r.address,
                  city: r.city, menu_count: r.menu_count,
                }))}
                onSelect={handleSelect}
                showDistance={false}
                isJa={language === 'ja'}
              />
              {page < totalPages && (
                <div style={{ padding: '12px 16px 24px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loading}
                    style={{
                      padding: '10px 24px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)',
                      fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s',
                    }}
                  >
                    {loading ? '...' : (copy.explore.loadMore || 'もっと見る')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
