'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { Camera, Globe, QrCode, ArrowRight, Zap, Shield, Languages } from 'lucide-react'

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantSlug = searchParams?.get('restaurant')

  useEffect(() => {
    if (restaurantSlug) {
      router.replace(`/capture?restaurant=${encodeURIComponent(restaurantSlug)}`)
    }
  }, [restaurantSlug, router])

  if (restaurantSlug) return null

  return <LandingPage />
}

function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0B1121', color: '#E2E8F0' }}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.logo}>NGraph</div>
        <div style={s.headerButtons}>
          <Link href="/admin/login" style={s.loginLink}>ログイン</Link>
          <Link href="/admin/login" style={s.ctaSmall}>無料で始める</Link>
        </div>
      </header>

      {/* Hero */}
      <section style={s.hero}>
        <p style={s.heroLabel}>NGraph</p>
        <h1 style={s.heroTitle}>
          メニューを撮るだけ。
          <br />
          <span style={s.heroGradient}>AIが多言語メニューを作る。</span>
        </h1>
        <p style={s.heroSub}>
          写真1枚で、メニューを自動構造化。14言語に翻訳。QRコードをお店に貼るだけで、世界中のお客様がメニューを読める。
        </p>
        <Link href="/admin/login" style={s.ctaLarge}>
          無料で始める <ArrowRight size={18} />
        </Link>
      </section>

      {/* Steps */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>3ステップで完了</h2>
        <div style={s.steps}>
          {[
            { icon: <Camera size={28} />, title: 'メニューを撮る', desc: '写真を撮るかファイルをアップロード。AIが自動で全メニューを読み取る。' },
            { icon: <Zap size={28} />, title: 'AIが構造化', desc: '料理名・価格・カテゴリ・アレルゲンを自動抽出。14言語に翻訳。' },
            { icon: <QrCode size={28} />, title: 'QRを貼る', desc: 'QRコードをダウンロードして店に貼るだけ。お客様がスマホで読める。' },
          ].map((step, i) => (
            <div key={i} style={s.stepCard}>
              <div style={s.stepIcon}>{step.icon}</div>
              <div style={s.stepNum}>Step {i + 1}</div>
              <h3 style={s.stepTitle}>{step.title}</h3>
              <p style={s.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ ...s.section, backgroundColor: '#0F172A' }}>
        <h2 style={s.sectionTitle}>選ばれる理由</h2>
        <div style={s.features}>
          {[
            { icon: <Languages size={24} />, title: '14言語対応', desc: '英語・中国語・韓国語・フランス語・スペイン語など。訪日外国人の95%をカバー。' },
            { icon: <Shield size={24} />, title: 'アレルゲン自動検出', desc: 'AIが料理名から材料・アレルゲンを推定。食の安全を守る。' },
            { icon: <Globe size={24} />, title: '営業不要', desc: 'セルフサーブで完結。登録もメニュー設定もQR発行も全て自分で。' },
            { icon: <Zap size={24} />, title: '30秒で公開', desc: '写真を撮って確認するだけ。複雑な設定は一切なし。' },
          ].map((f, i) => (
            <div key={i} style={s.featureCard}>
              <div style={s.featureIcon}>{f.icon}</div>
              <h3 style={s.featureTitle}>{f.title}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={s.ctaSection}>
        <h2 style={s.ctaSectionTitle}>今すぐ始めよう</h2>
        <p style={s.ctaSectionSub}>メニュー写真を撮るだけで、多言語対応メニューが完成します。</p>
        <Link href="/admin/login" style={s.ctaLarge}>
          無料で始める <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerLogo}>NGraph</div>
          <p style={s.footerText}>株式会社Lion Entertainment</p>
        </div>
      </footer>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 24px', maxWidth: '1100px', margin: '0 auto', width: '100%',
  },
  logo: { fontSize: '20px', fontWeight: 800, color: '#3B82F6' },
  headerButtons: { display: 'flex', alignItems: 'center', gap: '16px' },
  loginLink: { color: '#94A3B8', fontSize: '14px', textDecoration: 'none' },
  ctaSmall: {
    padding: '8px 20px', backgroundColor: '#3B82F6', color: '#fff',
    borderRadius: '6px', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
  },
  hero: {
    textAlign: 'center' as const, maxWidth: '700px', margin: '0 auto',
    padding: '80px 24px 60px',
  },
  heroLabel: {
    fontSize: '13px', letterSpacing: '3px', color: '#3B82F6', fontWeight: 500, marginBottom: '16px',
  },
  heroTitle: { fontSize: '36px', fontWeight: 800, lineHeight: '1.3', marginBottom: '20px' },
  heroGradient: {
    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  heroSub: { fontSize: '16px', color: '#94A3B8', lineHeight: '1.7', marginBottom: '32px' },
  ctaLarge: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '14px 32px', backgroundColor: '#3B82F6', color: '#fff',
    borderRadius: '8px', fontSize: '16px', fontWeight: 600, textDecoration: 'none',
  },
  section: { padding: '60px 24px', maxWidth: '1000px', margin: '0 auto' },
  sectionTitle: { fontSize: '24px', fontWeight: 700, textAlign: 'center' as const, marginBottom: '40px' },
  steps: { display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' as const },
  stepCard: {
    flex: '1 1 280px', maxWidth: '300px', padding: '32px 24px',
    backgroundColor: '#1E293B', borderRadius: '12px', textAlign: 'center' as const,
  },
  stepIcon: { color: '#3B82F6', marginBottom: '12px' },
  stepNum: { fontSize: '12px', color: '#64748B', fontWeight: 600, marginBottom: '8px' },
  stepTitle: { fontSize: '18px', fontWeight: 700, marginBottom: '8px' },
  stepDesc: { fontSize: '14px', color: '#94A3B8', lineHeight: '1.6' },
  features: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px', maxWidth: '900px', margin: '0 auto',
  },
  featureCard: { padding: '24px', backgroundColor: '#1E293B', borderRadius: '10px' },
  featureIcon: { color: '#3B82F6', marginBottom: '12px' },
  featureTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '6px' },
  featureDesc: { fontSize: '13px', color: '#94A3B8', lineHeight: '1.6' },
  ctaSection: { textAlign: 'center' as const, padding: '60px 24px' },
  ctaSectionTitle: { fontSize: '28px', fontWeight: 700, marginBottom: '12px' },
  ctaSectionSub: { fontSize: '15px', color: '#94A3B8', marginBottom: '24px' },
  footer: { borderTop: '1px solid #1E293B', padding: '24px' },
  footerInner: { maxWidth: '1000px', margin: '0 auto', textAlign: 'center' as const },
  footerLogo: { fontSize: '16px', fontWeight: 700, color: '#3B82F6', marginBottom: '4px' },
  footerText: { fontSize: '12px', color: '#64748B' },
}

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: '#0B1121',
      }}>
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid rgba(255,255,255,0.15)',
          borderTopColor: 'rgba(255,255,255,0.6)',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
