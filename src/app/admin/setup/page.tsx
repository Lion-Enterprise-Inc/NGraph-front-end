'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { Upload, Camera, Check, Download, ArrowRight, Plus, Trash2, Loader2 } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { MenuApi, AutoCreateMenuItem } from '../../../services/api'

type Step = 'upload' | 'confirm' | 'qr'

export default function SetupWizardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const [step, setStep] = useState<Step>('upload')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [createdMenus, setCreatedMenus] = useState<AutoCreateMenuItem[]>([])
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsAnalyzing(true)
    try {
      const res = await MenuApi.autoCreateFromImage(file)
      const newMenus = res.result.menus
      setCreatedMenus(prev => [...prev, ...newMenus])
      if (newMenus.length > 0) {
        setStep('confirm')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      alert(message)
    } finally {
      setIsAnalyzing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }

  const removeMenu = (uid: string) => {
    setCreatedMenus(prev => prev.filter(m => m.uid !== uid))
  }

  const publishAll = async () => {
    const uids = createdMenus.map(m => m.uid)
    if (uids.length === 0) return
    try {
      await MenuApi.batchUpdateStatus(uids, true)
      await generateQR()
      setStep('qr')
    } catch {
      alert('Failed to publish menus')
    }
  }

  const generateQR = async () => {
    const slug = user?.restaurant_slug || ''
    const urlSlug = user?.restaurant_url_slug
    const prefSlug = user?.restaurant_prefecture_slug
    const citySlug = user?.restaurant_city_slug
    const shortCode = user?.restaurant_short_code

    const url = (prefSlug && citySlug && urlSlug)
      ? `https://app.ngraph.jp/${prefSlug}/${citySlug}/${urlSlug}?source=qr`
      : shortCode
        ? `https://app.ngraph.jp/r/${shortCode}`
        : `https://app.ngraph.jp/capture?restaurant=${encodeURIComponent(slug)}&source=qr`

    setQrUrl(url)
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'M'
      })
      setQrDataUrl(dataUrl)
    } catch {}
  }

  const downloadQR = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.download = 'ngraph-qr.png'
    link.href = qrDataUrl
    link.click()
  }

  const categoryLabel: Record<string, string> = {
    main: 'メイン', appetizer: '前菜', rice: 'ご飯', sashimi: '刺身',
    sushi: '寿司', drink: 'ドリンク', dessert: 'デザート', side: '一品',
    soup: '汁物', salad: 'サラダ', other: 'その他',
  }

  if (authLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        {/* Progress */}
        <div style={styles.progress}>
          {(['upload', 'confirm', 'qr'] as Step[]).map((s, i) => (
            <div key={s} style={styles.progressItem}>
              <div style={{
                ...styles.progressDot,
                backgroundColor: step === s ? '#3B82F6' : ((['upload', 'confirm', 'qr'].indexOf(step) > i) ? '#22C55E' : '#334155'),
              }}>
                {(['upload', 'confirm', 'qr'].indexOf(step) > i) ? <Check size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: '12px', color: step === s ? '#fff' : '#94A3B8' }}>
                {s === 'upload' ? 'アップロード' : s === 'confirm' ? '確認' : 'QRコード'}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div style={styles.stepContent}>
            <h1 style={styles.title}>メニューをアップロード</h1>
            <p style={styles.subtitle}>メニューの写真を撮るか、ファイルを選択してください。AIが自動で構造化します。</p>

            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ display: 'none' }} />

            {isAnalyzing ? (
              <div style={styles.analyzingBox}>
                <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#3B82F6' }} />
                <p style={{ marginTop: '16px', color: '#94A3B8' }}>AIがメニューを解析中...</p>
              </div>
            ) : (
              <div style={styles.uploadButtons}>
                <button style={styles.uploadBtn} onClick={() => cameraInputRef.current?.click()}>
                  <Camera size={32} />
                  <span>写真を撮る</span>
                </button>
                <button style={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={32} />
                  <span>ファイルを選択</span>
                </button>
              </div>
            )}

            {createdMenus.length > 0 && (
              <button style={styles.primaryBtn} onClick={() => setStep('confirm')}>
                確認へ進む <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 'confirm' && (
          <div style={styles.stepContent}>
            <h1 style={styles.title}>メニュー確認</h1>
            <p style={styles.subtitle}>{createdMenus.length}品のメニューが登録されました。不要なものは削除できます。</p>

            <div style={styles.menuList}>
              {createdMenus.map(menu => (
                <div key={menu.uid} style={styles.menuItem}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.menuName}>{menu.name_jp}</div>
                    <div style={styles.menuMeta}>
                      <span style={styles.menuCategory}>{categoryLabel[menu.category] || menu.category}</span>
                      <span style={styles.menuPrice}>{menu.price ? `${menu.price.toLocaleString()}円` : ''}</span>
                    </div>
                  </div>
                  <button style={styles.deleteBtn} onClick={() => removeMenu(menu.uid)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.actions}>
              <button
                style={styles.secondaryBtn}
                onClick={() => { setStep('upload') }}
              >
                <Plus size={16} /> もう1枚追加
              </button>
              <button style={styles.primaryBtn} onClick={publishAll}>
                全て公開する <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: QR */}
        {step === 'qr' && (
          <div style={styles.stepContent}>
            <h1 style={styles.title}>QRコードが完成しました</h1>
            <p style={styles.subtitle}>これをお店に貼るだけで、外国人のお客様がメニューを読めます。</p>

            {qrDataUrl && (
              <div style={styles.qrBox}>
                <img src={qrDataUrl} alt="QR Code" style={styles.qrImage} />
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '8px', wordBreak: 'break-all' }}>{qrUrl}</p>
              </div>
            )}

            <div style={styles.actions}>
              <button style={styles.primaryBtn} onClick={downloadQR}>
                <Download size={16} /> QRコードをダウンロード
              </button>
              <button style={styles.secondaryBtn} onClick={() => router.push('/admin')}>
                管理画面へ
              </button>
            </div>

            <div style={styles.infoBox}>
              <p>AIが裏側でメニューの詳細データ(栄養情報・アレルゲン・翻訳)を生成中です。数分後に自動で反映されます。</p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0F172A',
    color: '#E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  inner: {
    maxWidth: '520px',
    width: '100%',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94A3B8',
  },
  progress: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    marginBottom: '40px',
  },
  progressItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '6px',
  },
  progressDot: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '8px',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: '14px',
    color: '#94A3B8',
    marginBottom: '32px',
    textAlign: 'center' as const,
    lineHeight: '1.6',
  },
  uploadButtons: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  },
  uploadBtn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '160px',
    height: '140px',
    border: '2px dashed #334155',
    borderRadius: '12px',
    backgroundColor: '#1E293B',
    color: '#94A3B8',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'border-color 0.2s',
  },
  analyzingBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '48px',
  },
  menuList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    maxHeight: '400px',
    overflowY: 'auto' as const,
    marginBottom: '24px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#1E293B',
    borderRadius: '8px',
    gap: '12px',
  },
  menuName: {
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  menuMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    color: '#94A3B8',
  },
  menuCategory: {
    backgroundColor: '#334155',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
  },
  menuPrice: {
    color: '#3B82F6',
    fontWeight: 500,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#EF4444',
    cursor: 'pointer',
    padding: '8px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    width: '100%',
    alignItems: 'center',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    maxWidth: '320px',
    padding: '14px 24px',
    backgroundColor: '#3B82F6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    maxWidth: '320px',
    padding: '14px 24px',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    border: '1px solid #334155',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
  },
  qrBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '24px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  qrImage: {
    width: '240px',
    height: '240px',
  },
  infoBox: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#1E293B',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#94A3B8',
    lineHeight: '1.6',
    textAlign: 'center' as const,
  },
}
