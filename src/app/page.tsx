'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { Camera, Globe, QrCode, ArrowRight, Zap, Shield, Languages, Star, Bot } from 'lucide-react'

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
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF6F0', color: '#2D2318', backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")` }}>
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
          QRを置くだけ。
          <br />
          <span style={s.heroGradient}>外国人客が、迷わず注文できる。</span>
        </h1>
        <p style={s.heroSub}>
          メニュー写真を撮るだけで、14言語に自動翻訳。アレルゲンも自動検出。QRコードをテーブルに置くだけで、世界中のお客様がスマホでメニューを読める。
        </p>
        <Link href="/admin/login" style={s.ctaLarge}>
          無料で始める <ArrowRight size={18} />
        </Link>
        <div style={s.heroImageWrap}>
          <img src="/img-qr-scan.jpeg" alt="QRコードをスキャンする様子" style={s.heroImage} />
        </div>
      </section>

      {/* Steps */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>3ステップで完了</h2>
        <div style={s.steps}>
          {[
            { icon: <QrCode size={28} />, title: 'QRを貼る', desc: 'QRコードをダウンロードしてお店に貼るだけ。お客様がスマホで読める。', img: '/img-qr-scan.jpeg' },
            { icon: <Camera size={28} />, title: 'メニューを撮る', desc: '写真を撮るかファイルをアップロード。AIが自動で全メニューを読み取る。', img: '/img-menu-scan.jpeg' },
            { icon: <Zap size={28} />, title: '生成完了', desc: '料理名・価格・カテゴリ・アレルゲンを自動抽出。14言語に翻訳して即公開。', img: null },
          ].map((step, i) => (
            <div key={i} style={s.stepCard}>
              {step.img && <img src={step.img} alt={step.title} style={s.stepImage} />}
              <div style={s.stepIcon}>{step.icon}</div>
              <div style={s.stepNum}>Step {i + 1}</div>
              <h3 style={s.stepTitle}>{step.title}</h3>
              <p style={s.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ ...s.section, backgroundColor: '#F5EFE5', padding: '60px 24px', maxWidth: 'none' }}>
        <h2 style={s.sectionTitle}>選ばれる理由</h2>
        <div style={s.features}>
          {[
            { icon: <Languages size={24} />, title: '14言語対応', desc: '英語・中国語・韓国語・フランス語・スペイン語など。訪日外国人の95%をカバー。' },
            { icon: <Shield size={24} />, title: 'アレルゲン自動検出', desc: 'AIが料理名から材料・アレルゲンを推定。食の安全を守る。' },
            { icon: <Globe size={24} />, title: '営業不要', desc: 'セルフサーブで完結。登録もメニュー設定もQR発行も全て自分で。' },
            { icon: <Zap size={24} />, title: '30秒で公開', desc: '写真を撮って確認するだけ。複雑な設定は一切なし。' },
            { icon: <Star size={24} />, title: 'Google口コミ増加', desc: '外国人客がメニューを理解して満足→口コミが増える。星評価の向上に直結。' },
            { icon: <Bot size={24} />, title: 'AIエージェント対応', desc: '構造化データでAIが料理を正しく理解。将来のAI予約・推薦サービスに対応。' },
          ].map((f, i) => (
            <div key={i} style={s.featureCard}>
              <div style={s.featureIcon}>{f.icon}</div>
              <h3 style={s.featureTitle}>{f.title}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Experience */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>お客様の体験</h2>
        <p style={{ textAlign: 'center' as const, color: '#7A6B5A', marginBottom: '40px', marginTop: '-24px', fontSize: '14px' }}>
          QRをスキャンしたお客様は、こんな体験ができます。
        </p>

        {/* Flow: Landing → Menu/Camera → Result */}
        <div style={s.customerFlow}>
          <div style={s.flowItem}>
            <img src="/case-customer-landing.png" alt="QR landing" style={s.flowImage} />
            <div style={s.flowInfo}>
              <div style={s.flowStep}>QRスキャン後</div>
              <h3 style={s.flowTitle}>選べる入り口</h3>
              <p style={s.flowDesc}>「メニューを見る」で一覧表示。「カメラを開く」で写真から料理を解析。「おすすめは？」でAIに相談。</p>
            </div>
          </div>
          <div style={s.flowItem}>
            <img src="/case-nfg-card-ja.png" alt="Menu detail" style={s.flowImage} />
            <div style={s.flowInfo}>
              <div style={s.flowStep}>メニュー詳細</div>
              <h3 style={s.flowTitle}>料理の全てが伝わる</h3>
              <p style={s.flowDesc}>料理名・調理法・材料・アレルゲン・味の特徴・カロリーまで。写真付きで14言語に自動翻訳。</p>
            </div>
          </div>
          <div style={s.flowItem}>
            <img src="/case-bonta-chat.png" alt="AI chat" style={s.flowImage} />
            <div style={s.flowInfo}>
              <div style={s.flowStep}>AIチャット</div>
              <h3 style={s.flowTitle}>何でも聞ける</h3>
              <p style={s.flowDesc}>「ベジタリアン向けは？」「子供が食べられるのは？」AIが14言語でメニューを案内。</p>
            </div>
          </div>
        </div>

        {/* Store name */}
        <p style={{ textAlign: 'center' as const, color: '#A09888', fontSize: '12px', marginTop: '32px' }}>
          導入店舗: 蟹と海鮮ぼんた（福井県）
        </p>
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
          <div style={s.footerLinks}>
            <a href="https://ngraph.jp/company.html" style={s.footerLink}>会社概要</a>
            <a href="https://ngraph.jp/privacy.html" style={s.footerLink}>プライバシーポリシー</a>
            <a href="https://ngraph.jp/legal.html" style={s.footerLink}>特定商取引法に基づく表記</a>
          </div>
          <p style={s.footerText}>株式会社NGraph</p>
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
  logo: { fontSize: '20px', fontWeight: 800, color: '#D4622B' },
  headerButtons: { display: 'flex', alignItems: 'center', gap: '16px' },
  loginLink: { color: '#7A6B5A', fontSize: '14px', textDecoration: 'none' },
  ctaSmall: {
    padding: '8px 20px', backgroundColor: '#D4622B', color: '#fff',
    borderRadius: '6px', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
  },
  hero: {
    textAlign: 'center' as const, maxWidth: '700px', margin: '0 auto',
    padding: '80px 24px 60px',
  },
  heroLabel: {
    fontSize: '13px', letterSpacing: '3px', color: '#E8642C', fontWeight: 500, marginBottom: '16px',
  },
  heroTitle: { fontSize: '36px', fontWeight: 800, lineHeight: '1.3', marginBottom: '20px', color: '#1A1410' },
  heroGradient: {
    background: 'linear-gradient(135deg, #D4622B, #E8642C)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  heroSub: { fontSize: '16px', color: '#7A6B5A', lineHeight: '1.7', marginBottom: '32px' },
  ctaLarge: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '14px 32px', backgroundColor: '#D4622B', color: '#fff',
    borderRadius: '8px', fontSize: '16px', fontWeight: 600, textDecoration: 'none',
  },
  heroImageWrap: {
    marginTop: '40px', maxWidth: '480px', margin: '40px auto 0',
    borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
  },
  heroImage: {
    width: '100%', height: 'auto', display: 'block',
  },
  section: { padding: '60px 24px', maxWidth: '1000px', margin: '0 auto' },
  sectionTitle: { fontSize: '24px', fontWeight: 700, textAlign: 'center' as const, marginBottom: '40px', color: '#1A1410' },
  steps: { display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' as const },
  stepCard: {
    flex: '1 1 280px', maxWidth: '300px', padding: '32px 24px',
    backgroundColor: '#F0EAE0', borderRadius: '12px', textAlign: 'center' as const,
    border: '1px solid #E5DDD0',
  },
  stepImage: {
    width: '100%', height: '140px', objectFit: 'cover' as const,
    borderRadius: '8px', marginBottom: '12px',
  },
  stepIcon: { color: '#D4622B', marginBottom: '12px' },
  stepNum: { fontSize: '12px', color: '#A09888', fontWeight: 600, marginBottom: '8px' },
  stepTitle: { fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#1A1410' },
  stepDesc: { fontSize: '14px', color: '#7A6B5A', lineHeight: '1.6' },
  features: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px', maxWidth: '900px', margin: '0 auto',
  },
  featureCard: { padding: '24px', backgroundColor: '#F0EAE0', borderRadius: '10px', border: '1px solid #E5DDD0' },
  featureIcon: { color: '#D4622B', marginBottom: '12px' },
  featureTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: '#1A1410' },
  featureDesc: { fontSize: '13px', color: '#7A6B5A', lineHeight: '1.6' },
  customerFlow: {
    display: 'flex', flexDirection: 'column' as const, gap: '32px',
    maxWidth: '700px', margin: '0 auto',
  },
  flowItem: {
    display: 'flex', gap: '24px', alignItems: 'center',
    backgroundColor: '#F0EAE0', borderRadius: '12px', padding: '20px',
    border: '1px solid #E5DDD0',
  },
  flowImage: {
    width: '160px', height: '280px', objectFit: 'cover' as const, objectPosition: 'top',
    borderRadius: '10px', flexShrink: 0,
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  },
  flowInfo: { flex: 1 },
  flowStep: {
    fontSize: '12px', color: '#D4622B', fontWeight: 600, marginBottom: '4px',
    textTransform: 'uppercase' as const, letterSpacing: '1px',
  },
  flowTitle: { fontSize: '18px', fontWeight: 700, color: '#1A1410', marginBottom: '8px' },
  flowDesc: { fontSize: '14px', color: '#7A6B5A', lineHeight: '1.6' },
  ctaSection: { textAlign: 'center' as const, padding: '60px 24px' },
  ctaSectionTitle: { fontSize: '28px', fontWeight: 700, marginBottom: '12px', color: '#1A1410' },
  ctaSectionSub: { fontSize: '15px', color: '#7A6B5A', marginBottom: '24px' },
  footer: { borderTop: '1px solid #E5DDD0', padding: '24px' },
  footerInner: { maxWidth: '1000px', margin: '0 auto', textAlign: 'center' as const },
  footerLogo: { fontSize: '16px', fontWeight: 700, color: '#D4622B', marginBottom: '12px' },
  footerLinks: { display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' as const, marginBottom: '12px' },
  footerLink: { fontSize: '13px', color: '#7A6B5A', textDecoration: 'none' },
  footerText: { fontSize: '12px', color: '#A09888' },
}

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: '#FAF6F0',
      }}>
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid rgba(139,105,20,0.2)',
          borderTopColor: '#D4622B',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
