'use client'

import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import { Download, Copy, Check } from 'lucide-react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { useAppContext } from '../../../components/AppProvider'
import { useAuth } from '../../../contexts/AuthContext'
import { getUiCopy } from '../../../i18n/uiCopy'

export default function QRManagementPage() {
  const { language } = useAppContext()
  const { user, isLoading: authLoading } = useAuth()
  const copy = getUiCopy(language)
  const [restaurantSlug, setRestaurantSlug] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [slugInitialized, setSlugInitialized] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Pre-fill restaurant slug for restaurant owners - only run once when auth is loaded
  useEffect(() => {
    if (!authLoading && !slugInitialized) {
      if (user?.restaurant_slug) {
        setRestaurantSlug(user.restaurant_slug)
      }
      setSlugInitialized(true)
    }
  }, [authLoading, user?.restaurant_slug, slugInitialized])

  const generateQRCode = async () => {
    if (!restaurantSlug.trim()) {
      alert('Please enter a restaurant slug')
      return
    }

    // Validate slug format (letters, numbers, hyphens, and Unicode characters)
    const slugPattern = /^[\w\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf-]+$/
    if (!slugPattern.test(restaurantSlug.trim())) {
      alert('Restaurant slug can only contain letters, numbers, hyphens, and Unicode characters')
      return
    }

    setIsGenerating(true)
    const encodedSlug = encodeURIComponent(restaurantSlug.trim())
    const url = `https://app.ngraph.jp/?restaurant=${encodedSlug}`
    setQrCodeUrl(url)

    try {
      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      alert('Failed to generate QR code')
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
      <AdminLayout title="QR Code Management">
        <div className="qr-management-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid #e1e5e9', 
              borderTopColor: '#10a37f', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#666' }}>Loading...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="QR Code Management">
      <div className="qr-management-container">
        <div className="qr-management-header">
          <h1>QR Code Generator</h1>
          <p>Generate QR code for your restaurant</p>
        </div>

        <div className="qr-generator-section">
          <div className="qr-input-section">
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
                readOnly={!!user?.restaurant_slug}
                style={user?.restaurant_slug ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
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
              {user?.restaurant_slug
                ? `Your restaurant slug "${restaurantSlug}" is automatically set. Click Generate to create your QR code.`
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
          color: #1a1a1a;
          margin: 0 0 8px 0;
        }

        .qr-management-header p {
          font-size: 16px;
          color: #666;
          margin: 0;
        }

        .qr-generator-section {
          background: #ffffff;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .qr-input-section {
          margin-bottom: 32px;
        }

        .qr-input-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #333;
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
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s ease;
        }

        .qr-input:focus {
          outline: none;
          border-color: #10a37f;
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
          color: #666;
          margin: 0;
        }

        .qr-result-section {
          border-top: 1px solid #e1e5e9;
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
          border: 1px solid #e1e5e9;
        }

        .qr-code-info {
          flex: 1;
        }

        .qr-code-info h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 16px 0;
        }

        .qr-code-info p {
          font-size: 16px;
          color: #666;
          margin: 0 0 24px 0;
        }

        .qr-url-section {
          margin-bottom: 24px;
        }

        .qr-url-section label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .qr-url-group {
          display: flex;
          gap: 8px;
        }

        .qr-url-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          font-size: 14px;
          font-family: 'Courier New', monospace;
          background: #f8f9fa;
        }

        .qr-copy-btn {
          padding: 10px;
          background: #f8f9fa;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qr-copy-btn:hover {
          background: #e9ecef;
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
          border-bottom: 2px solid #e1e5e9;
        }

        .qr-tab {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: #666;
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
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          font-family: 'Courier New', monospace;
          resize: vertical;
          transition: border-color 0.2s ease;
        }

        .qr-textarea:focus {
          outline: none;
          border-color: #10a37f;
        }

        .qr-bulk-result-section {
          border-top: 1px solid #e1e5e9;
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
          color: #1a1a1a;
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
          border: 1px solid #e1e5e9;
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
          color: #1a1a1a;
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
            border-bottom: 1px solid #e1e5e9;
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
