'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import { Upload, Camera, Check, Download, ArrowRight, Plus, Trash2, Loader2, CheckCircle } from 'lucide-react'
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
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login')
    }
  }, [authLoading, isAuthenticated, router])

  const processFile = useCallback(async (file: File) => {
    setIsAnalyzing(true)
    try {
      const res = await MenuApi.autoCreateFromImage(file)
      const newMenus = res.result.menus
      setCreatedMenus(prev => [...prev, ...newMenus])
      if (newMenus.length > 0) {
        setStep('confirm')
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err as any).status === 402) {
        alert('クレジットが不足しています。管理画面からクレジットを購入してください。')
      } else {
        const message = err instanceof Error ? err.message : 'アップロードに失敗しました'
        alert(message)
      }
    } finally {
      setIsAnalyzing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

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
      alert('公開に失敗しました')
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

  const steps: Step[] = ['upload', 'confirm', 'qr']
  const currentIdx = steps.indexOf(step)

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
        {/* Progress bar */}
        <div style={styles.progressBar}>
          {steps.map((s, i) => (
            <div key={s} style={styles.progressStep}>
              <div style={{
                ...styles.progressDot,
                backgroundColor: currentIdx > i ? '#22C55E' : currentIdx === i ? '#3B82F6' : '#334155',
              }}>
                {currentIdx > i ? <Check size={14} /> : i + 1}
              </div>
              <div style={{
                ...styles.progressLine,
                backgroundColor: currentIdx > i ? '#22C55E' : '#334155',
                display: i === steps.length - 1 ? 'none' : 'block',
              }} />
              <span style={{ fontSize: '11px', color: currentIdx === i ? '#fff' : '#64748B', marginTop: '4px' }}>
                {s === 'upload' ? 'アップロード' : s === 'confirm' ? '確認' : 'QR'}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div style={styles.stepContent}>
            <h1 style={styles.title}>メニュー写真をアップロード</h1>
            <p style={styles.subtitle}>写真を撮るかファイルを選ぶだけ。AIが自動でメニューを読み取ります。</p>

            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ display: 'none' }} />

            {isAnalyzing ? (
              <div style={styles.analyzingBox}>
                <div style={styles.pulseRing}>
                  <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#3B82F6' }} />
                </div>
                <p style={{ marginTop: '20px', color: '#E2E8F0', fontSize: '16px', fontWeight: 600 }}>AIがメニューを読み取っています...</p>
                <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px' }}>通常30秒程度かかります</p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    ...styles.dropZone,
                    borderColor: isDragging ? '#3B82F6' : '#334155',
                    backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.08)' : '#1E293B',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload size={40} style={{ color: isDragging ? '#3B82F6' : '#64748B' }} />
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#E2E8F0', marginTop: '12px' }}>
                    メニュー写真をドラッグ＆ドロップ
                  </p>
                  <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                    またはクリックしてファイルを選択
                  </p>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '12px' }}>
                    JPEG, PNG, PDF対応
                  </p>
                </div>

                <button style={styles.cameraBtn} onClick={() => cameraInputRef.current?.click()}>
                  <Camera size={18} /> スマホで写真を撮る
                </button>
              </>
            )}

            {createdMenus.length > 0 && (
              <button style={styles.primaryBtn} onClick={() => setStep('confirm')}>
                確認へ進む ({createdMenus.length}品) <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 'confirm' && (
          <div style={styles.stepContent}>
            <div style={styles.countBadge}>{createdMenus.length}品</div>
            <h1 style={styles.title}>メニューが見つかりました</h1>
            <p style={styles.subtitle}>不要なものは削除してください。追加の写真も撮れます。</p>

            <div style={styles.menuList}>
              {createdMenus.map(menu => (
                <div key={menu.uid} style={styles.menuItem}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.menuName}>{menu.name_jp}</div>
                    <span style={styles.menuCategory}>{categoryLabel[menu.category] || menu.category}</span>
                  </div>
                  <button style={styles.deleteBtn} onClick={() => removeMenu(menu.uid)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.actions}>
              <button style={styles.primaryBtn} onClick={publishAll}>
                全て公開する <ArrowRight size={16} />
              </button>
              <button style={styles.secondaryBtn} onClick={() => setStep('upload')}>
                <Plus size={16} /> もう1枚追加する
              </button>
            </div>
          </div>
        )}

        {/* Step 3: QR */}
        {step === 'qr' && (
          <div style={styles.stepContent}>
            <div style={styles.celebrationIcon}>
              <CheckCircle size={56} style={{ color: '#22C55E' }} />
            </div>
            <h1 style={{ ...styles.title, fontSize: '26px' }}>準備完了!</h1>
            <p style={styles.subtitle}>
              QRコードを印刷してお店のテーブルに設置してください。<br />
              外国人のお客様がスマホでスキャンするだけでメニューが読めます。
            </p>

            {qrDataUrl && (
              <div style={styles.qrBox}>
                <img src={qrDataUrl} alt="QR Code" style={styles.qrImage} />
                <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px', wordBreak: 'break-all' as const, textAlign: 'center' as const }}>{qrUrl}</p>
              </div>
            )}

            <div style={styles.actions}>
              <button style={styles.primaryBtn} onClick={downloadQR}>
                <Download size={16} /> QRコードをダウンロード
              </button>
              <button style={{ ...styles.primaryBtn, backgroundColor: '#1E293B', border: '1px solid #334155' }} onClick={() => router.push('/admin')}>
                管理画面へ <ArrowRight size={16} />
              </button>
            </div>

            <div style={styles.infoBox}>
              <p>AIが裏側でメニューの詳細データ(栄養情報・アレルゲン・翻訳)を生成中です。数分後に自動で反映されます。</p>
            </div>

            <div style={styles.tipBox}>
              <p>基本情報（営業時間・住所など）は管理画面からいつでも設定できます</p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0; }
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
  progressBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0',
    marginBottom: '40px',
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    flex: 1,
    position: 'relative' as const,
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
    zIndex: 1,
  },
  progressLine: {
    position: 'absolute' as const,
    top: '14px',
    left: '50%',
    width: '100%',
    height: '2px',
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
  dropZone: {
    width: '100%',
    minHeight: '220px',
    border: '2px dashed #334155',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '16px',
    padding: '32px',
  },
  cameraBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#94A3B8',
    border: '1px solid #334155',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '24px',
  },
  analyzingBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '48px',
  },
  pulseRing: {
    position: 'relative' as const,
  },
  countBadge: {
    backgroundColor: '#3B82F6',
    color: '#fff',
    fontSize: '32px',
    fontWeight: 800,
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  menuList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    maxHeight: '350px',
    overflowY: 'auto' as const,
    marginBottom: '24px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    backgroundColor: '#1E293B',
    borderRadius: '8px',
    gap: '12px',
  },
  menuName: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  menuCategory: {
    backgroundColor: '#334155',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#94A3B8',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#EF4444',
    cursor: 'pointer',
    padding: '8px',
    flexShrink: 0,
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
  celebrationIcon: {
    marginBottom: '16px',
  },
  qrBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '24px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    marginBottom: '24px',
    maxWidth: '300px',
    width: '100%',
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
    width: '100%',
  },
  tipBox: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#60A5FA',
    textAlign: 'center' as const,
    width: '100%',
  },
}
