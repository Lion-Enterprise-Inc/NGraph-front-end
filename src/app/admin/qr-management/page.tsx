'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Download, Copy, Check } from 'lucide-react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { useAppContext } from '../../../components/AppProvider'
import { useAuth } from '../../../contexts/AuthContext'
import { getUiCopy } from '../../../i18n/uiCopy'
import { useToast } from '../../../components/admin/Toast'
import { useAdminLang } from '../../../hooks/useAdminLang'
import { apiClient } from '../../../services/api'
import { renderStyledQR } from '../../../utils/qrCode'

export default function QRManagementPage() {
  const { language } = useAppContext()
  const { user, isLoading: authLoading } = useAuth()
  const { t } = useAdminLang()
  const copy = getUiCopy(language)
  const searchParams = useSearchParams()
  const uidParam = searchParams?.get('uid') ?? null
  // プラットフォーム/superadmin が ?uid= で特定店を代行操作しているか
  const isAdminViewing = !!(uidParam && user && (user.role === 'superadmin' || user.role === 'platform_owner'))
  const [restaurantSlug, setRestaurantSlug] = useState('')
  const [shortCode, setShortCode] = useState('')
  const [urlSlug, setUrlSlug] = useState('')
  const [prefectureSlug, setPrefectureSlug] = useState('')
  const [citySlug, setCitySlug] = useState('')
  const [adminStoreName, setAdminStoreName] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [slugInitialized, setSlugInitialized] = useState(false)
  const toast = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Pre-fill restaurant slug - only run once when auth is loaded.
  // プラットフォーム/superadmin が ?uid= で来た場合は対象店を取得して埋める。
  // それ以外は店主自身の店(user.restaurant_*)を埋める。
  useEffect(() => {
    if (authLoading || slugInitialized) return

    // プラットフォーム代行: ?uid= から対象店を解決
    if (isAdminViewing && uidParam) {
      apiClient.get(`/restaurants/${uidParam}`)
        .then((resp) => {
          const r = (resp as { result?: Record<string, unknown> })?.result || resp as Record<string, unknown>
          const urlSlugVal = (r.url_slug as string) || ''
          const slugVal = (r.slug as string) || ''
          setRestaurantSlug(urlSlugVal || slugVal)
          if (r.short_code) setShortCode(r.short_code as string)
          if (urlSlugVal) setUrlSlug(urlSlugVal)
          if (r.prefecture_slug) setPrefectureSlug(r.prefecture_slug as string)
          if (r.city_slug) setCitySlug(r.city_slug as string)
          if (r.name) setAdminStoreName(r.name as string)
        })
        .catch(() => {
          toast('error', 'Failed to load restaurant')
        })
        .finally(() => setSlugInitialized(true))
      return
    }

    // 店主自身: 表示はURLと同じ url_slug(英数字) を優先。無ければ日本語の slug にフォールバック
    if (user?.restaurant_url_slug) {
      setRestaurantSlug(user.restaurant_url_slug)
    } else if (user?.restaurant_slug) {
      setRestaurantSlug(user.restaurant_slug)
    }
    if (user?.restaurant_short_code) {
      setShortCode(user.restaurant_short_code)
    }
    if (user?.restaurant_url_slug) setUrlSlug(user.restaurant_url_slug)
    if (user?.restaurant_prefecture_slug) setPrefectureSlug(user.restaurant_prefecture_slug)
    if (user?.restaurant_city_slug) setCitySlug(user.restaurant_city_slug)
    setSlugInitialized(true)
  }, [authLoading, user?.restaurant_slug, user?.restaurant_short_code, slugInitialized, isAdminViewing, uidParam]) // eslint-disable-line react-hooks/exhaustive-deps

  const generateQRCode = async () => {
    if (!restaurantSlug.trim()) {
      toast('warning', 'Please enter a restaurant slug')
      return
    }

    // Validate slug format (Unicode letters/numbers, hyphens, underscores)
    // \p{L} covers Latin Extended (\u00e9 \u00e2 \u00f1 \u00fc) + CJK + Hangul + others
    const slugPattern = /^[\p{L}\p{N}_-]+$/u
    if (!slugPattern.test(restaurantSlug.trim())) {
      toast('warning', 'Restaurant slug can only contain letters, numbers, hyphens, and underscores')
      return
    }

    setIsGenerating(true)
    // 共有しやすさ・店名が見える透明性を優先して /capture?restaurant={slug} 形に統一
    // ?source=qr は CapturePage 側で「店内QR=メニュー直表示モード」のトリガーになるため
    // 共有用URLでは付けない (チャットUIで起動させる)
    // url_slug があれば優先 (英数字で読みやすい)、無ければ slug にフォールバック
    const targetSlug = (urlSlug && urlSlug.trim()) ? urlSlug.trim() : restaurantSlug.trim()
    const url = `https://app.ngraph.jp/capture?restaurant=${encodeURIComponent(targetSlug)}`
    setQrCodeUrl(url)

    try {
      // OMISEAI ブランドQR（角丸ドット + オレンジのファインダー + 中央マーク）
      const dataUrl = await renderStyledQR(url)
      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast('error', 'Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return

    const link = document.createElement('a')
    link.href = qrCodeDataUrl
    link.download = `qr-code-${restaurantSlug}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyUrl = async () => {
    if (!qrCodeUrl) return

    try {
      await navigator.clipboard.writeText(qrCodeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <AdminLayout title={t.nav.qrManagement}>
        <div className="qr-management-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid #334155',
              borderTopColor: '#3B82F6', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#94A3B8' }}>Loading...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={t.nav.qrManagement}>
      <div className="qr-management-container">
        <div className="qr-management-header">
          <h1>QR Code Generator</h1>
          <p>Generate QR code for your restaurant</p>
        </div>

        <div className="qr-generator-section">
          <div className="qr-input-section">
            {isAdminViewing && adminStoreName && (
              <div style={{
                marginBottom: 12, padding: '8px 12px', borderRadius: 8,
                background: 'rgba(59,130,246,0.12)', border: '1px solid #3B82F6',
                color: '#93C5FD', fontSize: 13, fontWeight: 600,
              }}>
                {t.layout.operatingOnStore(adminStoreName)}
              </div>
            )}
            <label htmlFor="restaurant-slug" className="qr-input-label">
              Restaurant Slug
            </label>
            <div className="qr-input-group">
              <input
                id="restaurant-slug"
                type="text"
                value={restaurantSlug}
                onChange={(e) => setRestaurantSlug(e.target.value)}
                placeholder="e.g., fc-restaurant"
                className="qr-input"
                readOnly={!!user?.restaurant_slug || isAdminViewing}
                style={(!!user?.restaurant_slug || isAdminViewing) ? { backgroundColor: '#1E293B', cursor: 'not-allowed' } : {}}
              />
              <button
                onClick={generateQRCode}
                disabled={isGenerating || !restaurantSlug.trim()}
                className="qr-generate-btn"
              >
                {isGenerating ? 'Generating...' : 'Generate QR Code'}
              </button>
            </div>
            <p className="qr-input-help">
              {(user?.restaurant_slug || isAdminViewing)
                ? `Restaurant slug "${restaurantSlug}" is automatically set. Click Generate to create the QR code.`
                : 'Enter the restaurant slug (e.g., fc-restaurant) to generate a QR code'
              }
            </p>
          </div>

          {qrCodeDataUrl && (
            <div className="qr-result-section">
              <div className="qr-code-display">
                <div className="qr-code-image">
                  <img src={qrCodeDataUrl} alt="Restaurant QR Code" />
                </div>
                <div className="qr-code-info">
                  <h3>QR Code Generated!</h3>
                  <p>Restaurant: <strong>{restaurantSlug}</strong></p>
                  <div className="qr-url-section">
                    <label>URL:</label>
                    <div className="qr-url-group">
                      <input
                        type="text"
                        value={qrCodeUrl}
                        readOnly
                        className="qr-url-input"
                      />
                      <button
                        onClick={copyUrl}
                        className="qr-copy-btn"
                        title="Copy URL"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="qr-actions">
                    <button onClick={downloadQRCode} className="qr-download-btn">
                      <Download size={16} />
                      Download QR Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <style jsx>{`
        .qr-management-container {
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
        }

        .qr-management-header {
          margin-bottom: 32px;
        }

        .qr-management-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 8px 0;
        }

        .qr-management-header p {
          font-size: 16px;
          color: var(--muted);
          margin: 0;
        }

        .qr-generator-section {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border);
        }

        .qr-input-section {
          margin-bottom: 32px;
        }

        .qr-input-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-body);
          margin-bottom: 8px;
        }

        .qr-input-group {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }

        .qr-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid var(--border-strong);
          background: var(--bg-input);
          color: var(--text);
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s ease;
        }

        .qr-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .qr-generate-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #10a37f, #0d8a6c);
          border: none;
          border-radius: 8px;
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .qr-generate-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 163, 127, 0.3);
        }

        .qr-generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .qr-input-help {
          font-size: 14px;
          color: var(--muted);
          margin: 0;
        }

        .qr-result-section {
          border-top: 1px solid var(--border);
          padding-top: 32px;
        }

        .qr-code-display {
          display: flex;
          gap: 32px;
          align-items: flex-start;
        }

        .qr-code-image {
          flex-shrink: 0;
        }

        .qr-code-image img {
          width: 300px;
          height: 300px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .qr-code-info {
          flex: 1;
        }

        .qr-code-info h3 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 16px 0;
        }

        .qr-code-info p {
          font-size: 16px;
          color: var(--muted);
          margin: 0 0 24px 0;
        }

        .qr-url-section {
          margin-bottom: 24px;
        }

        .qr-url-section label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-body);
          margin-bottom: 8px;
        }

        .qr-url-group {
          display: flex;
          gap: 8px;
        }

        .qr-url-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid var(--border-strong);
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Courier New', monospace;
          background: var(--bg-input);
          color: var(--text);
        }

        .qr-copy-btn {
          padding: 10px;
          background: var(--bg-hover);
          border: 1px solid var(--border-strong);
          color: var(--text);
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-copy-btn:hover {
          background: var(--border-strong);
        }

        .qr-actions {
          display: flex;
          gap: 12px;
        }

        .qr-download-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #007bff, #0056b3);
          border: none;
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .qr-download-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .qr-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
          border-bottom: 2px solid var(--border);
        }

        .qr-tab {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--muted);
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: -2px;
        }

        .qr-tab:hover {
          color: #10a37f;
        }

        .qr-tab.active {
          color: #10a37f;
          border-bottom-color: #10a37f;
        }

        .qr-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid var(--border-strong);
          background: var(--bg-input);
          color: var(--text);
          border-radius: 8px;
          font-size: 16px;
          font-family: 'Courier New', monospace;
          resize: vertical;
          transition: border-color 0.2s ease;
        }

        .qr-textarea:focus {
          outline: none;
          border-color: var(--primary);
        }

        .qr-bulk-result-section {
          border-top: 1px solid var(--border);
          padding-top: 32px;
        }

        .qr-bulk-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .qr-bulk-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }

        .qr-download-all-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #10a37f, #0d8a6c);
          border: none;
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .qr-download-all-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 163, 127, 0.3);
        }

        .qr-bulk-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 24px;
        }

        .qr-bulk-item {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }

        .qr-bulk-image img {
          width: 150px;
          height: 150px;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .qr-bulk-info h4 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 12px 0;
        }

        .qr-bulk-info .qr-download-btn {
          padding: 8px 16px;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .qr-code-display {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .qr-code-image img {
            width: 250px;
            height: 250px;
          }

          .qr-input-group {
            flex-direction: column;
          }

          .qr-tabs {
            flex-direction: column;
            gap: 0;
          }

          .qr-tab {
            border-bottom: 1px solid var(--border);
            border-radius: 0;
            margin-bottom: 0;
          }

          .qr-tab.active {
            border-bottom-color: #10a37f;
          }

          .qr-bulk-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .qr-bulk-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 16px;
          }

          .qr-bulk-image img {
            width: 120px;
            height: 120px;
          }
        }
      `}</style>
    </AdminLayout>
  )
}
