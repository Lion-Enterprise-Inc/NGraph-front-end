'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MenuSimpleIcon from '../components/icons/MenuSimpleIcon'
import RefreshIcon from '../components/icons/RefreshIcon'
import TranslateIcon from '../components/icons/TranslateIcon'
import { useAppContext } from '../components/AppProvider'
import { getUiCopy } from '../i18n/uiCopy'
import { NearbyApi, type NearbyRestaurant } from '../services/api'
import NearbyList from '../components/NearbyList'

export default function ExplorePage() {
  const router = useRouter()
  const { language, geoLocation } = useAppContext()
  const copy = getUiCopy(language)
  const [nearby, setNearby] = useState<NearbyRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [manualSlug, setManualSlug] = useState('')

  useEffect(() => {
    if (!geoLocation) {
      // Still waiting for GPS or denied
      const timeout = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timeout);
    }
    setLoading(true);
    NearbyApi.search(geoLocation.lat, geoLocation.lng)
      .then((res) => {
        setNearby(res.result || []);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [geoLocation]);

  const handleSelect = (slug: string) => {
    router.push(`/capture?restaurant=${slug}`);
  };

  const handleManualGo = () => {
    const slug = manualSlug.trim();
    if (slug) router.push(`/capture?restaurant=${slug}`);
  };

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

      <header className="site-bar">
        <div className="site-title">{copy.explore.title}</div>
        <button className="icon-button ghost" type="button" aria-label={copy.common.translate}>
          <TranslateIcon />
        </button>
      </header>

      <main style={{ flex: 1, overflow: 'auto', padding: '0' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{
              width: '28px', height: '28px',
              border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'rgba(255,255,255,0.5)',
              borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '12px',
            }} />
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              {geoLocation ? '近くのレストランを検索中...' : 'GPS取得中...'}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : nearby.length > 0 ? (
          <div>
            <div style={{ padding: '16px 16px 8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              近くのレストラン
            </div>
            <NearbyList items={nearby} onSelect={handleSelect} />
          </div>
        ) : (
          <div style={{ padding: '24px 16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                {error ? 'レストラン検索に失敗しました' : geoLocation ? '近くにレストランが見つかりませんでした' : 'GPSが利用できません'}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                レストラン名で直接アクセスできます
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={manualSlug}
                onChange={(e) => setManualSlug(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualGo()}
                placeholder="レストランのスラッグを入力"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleManualGo}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#4f8cff',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Go
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
