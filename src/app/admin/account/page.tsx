'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../../components/admin/AdminLayout'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../components/admin/Toast'

type PlanType = 'free' | 'light' | 'business' | 'pro'

export default function AccountPage() {
  const router = useRouter()
  const { user, isRestaurantOwner } = useAuth()
  const [email, setEmail] = useState('demo@example.com')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [currentPlan, setCurrentPlan] = useState<PlanType>('business')
  const [isLoading, setIsLoading] = useState(true)
  const [showPlanManagement, setShowPlanManagement] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const savedEmail = localStorage.getItem('admin_user_email')
    if (savedEmail) setEmail(savedEmail)
    if (user?.email) setEmail(user.email)
    setIsLoading(false)
  }, [user])

  const handleUpdateEmail = () => {
    localStorage.setItem('admin_user_email', email)
    toast('success', 'メールアドレスを保存しました')
  }

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword) {
      toast('warning', 'パスワードを入力してください')
      return
    }
    toast('success', 'パスワードを変更しました')
    setCurrentPassword('')
    setNewPassword('')
  }

  const handleSelectPlan = (plan: PlanType) => {
    if (plan === 'pro') {
      toast('info', 'Proプランは準備中です')
      return
    }
    if (plan === currentPlan) {
      toast('info', '現在ご利用中のプランです')
      return
    }
    if (confirm(`${getPlanName(plan)}に変更しますか？`)) {
      setCurrentPlan(plan)
      toast('success', `${getPlanName(plan)}に変更しました`)
    }
  }

  const getPlanName = (plan: PlanType) => {
    switch (plan) {
      case 'free': return 'フリープラン'
      case 'light': return 'ライトプラン'
      case 'business': return 'ビジネスプラン'
      case 'pro': return 'Proプラン'
    }
  }

  const getPlanPrice = (plan: PlanType) => {
    switch (plan) {
      case 'free': return '¥0'
      case 'light': return '¥980'
      case 'business': return '¥3,980'
      case 'pro': return '¥8,800'
    }
  }

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-content">
          <div className="admin-loading-icon">🔄</div>
          <div className="admin-loading-text">読み込み中...</div>
        </div>
      </div>
    )
  }

  // Plan Management View - Only for Restaurant Owners
  if (showPlanManagement && isRestaurantOwner) {
    return (
      <AdminLayout title="プラン・契約管理">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-link" onClick={() => setShowPlanManagement(false)}>👤 アカウント情報</span>
          <span className="separator">›</span>
          <span className="current">💳 プラン・契約管理</span>
        </div>

        {/* Header */}
        <div className="header-card">
          <h1 className="page-title">プラン・契約管理</h1>
          <p className="page-description">プランを選択・変更できます</p>
        </div>

        {/* Current Plan Banner */}
        <div className="current-plan-banner">
          <div className="banner-left">
            <div className="banner-label">現在のプラン</div>
            <div className="banner-plan-name">{getPlanName(currentPlan)}</div>
            <div className="banner-price">月額 {getPlanPrice(currentPlan)}</div>
          </div>
          <div className="banner-right">
            <div className="banner-detail">
              <span className="detail-label">契約開始日</span>
              <span className="detail-value">2024-10-01</span>
            </div>
            <div className="banner-detail">
              <span className="detail-label">次回更新日</span>
              <span className="detail-value">2024-11-01</span>
            </div>
            <div className="banner-detail">
              <span className="detail-label">ステータス</span>
              <span className="detail-value">利用中</span>
            </div>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="plans-grid">
          {/* Free Plan */}
          <div className={`plan-card ${currentPlan === 'free' ? 'active' : ''}`}>
            <div className="plan-header">
              <h3 className="plan-name">フリープラン</h3>
              <div className="plan-price">¥0</div>
              <div className="plan-period">月額</div>
            </div>
            <div className="plan-body">
              <p className="plan-desc">
                一般ユーザー向け機能。セッションが切れてもNGraphの撮って解説機能は使用可能。
              </p>
              <div className="plan-features">
                <div className="features-label">機能：</div>
                <div className="feature-text">履歴保存期間3ヶ月</div>
              </div>
              <button 
                className={`plan-select-btn ${currentPlan === 'free' ? 'selected' : 'secondary'}`}
                onClick={() => handleSelectPlan('free')}
              >
                {currentPlan === 'free' ? '現在のプラン' : 'このプランを選択'}
              </button>
            </div>
          </div>

          {/* Light Plan */}
          <div className={`plan-card ${currentPlan === 'light' ? 'active' : ''}`}>
            <div className="plan-header">
              <h3 className="plan-name">ライトプラン</h3>
              <div className="plan-price">¥980</div>
              <div className="plan-period">月額</div>
            </div>
            <div className="plan-body">
              <p className="plan-desc">
                スマホで撮るだけ。AIが商品名はもちろん背景や原材料など深い情報を多言語で即解説。
              </p>
              <div className="plan-features">
                <div className="features-label">機能：</div>
                <ul>
                  <li>QRポップ送付</li>
                  <li>AI多言語ガイド</li>
                  <li>お店基礎情報登録</li>
                  <li>Googleクチコミ連携</li>
                </ul>
              </div>
              <button 
                className={`plan-select-btn ${currentPlan === 'light' ? 'selected' : 'primary'}`}
                onClick={() => handleSelectPlan('light')}
              >
                {currentPlan === 'light' ? '現在のプラン' : 'このプランを選択'}
              </button>
            </div>
          </div>

          {/* Business Plan - Recommended */}
          <div className={`plan-card recommended ${currentPlan === 'business' ? 'active' : ''}`}>
            <div className="recommend-tag">おススメ</div>
            <div className="plan-header">
              <h3 className="plan-name">ビジネスプラン</h3>
              <div className="plan-price">¥3,980</div>
              <div className="plan-period">月額</div>
            </div>
            <div className="plan-body">
              <p className="plan-desc">
                おススメや人気商品など学習データから設定、編集可能。AIがデータに基づき売上アップや業務改善に直接貢献。
              </p>
              <div className="plan-features">
                <div className="features-label">機能：</div>
                <ul>
                  <li>店舗ロゴ入りQRポップ</li>
                  <li>店舗専用AIガイド</li>
                  <li>店舗情報学習</li>
                  <li>AIおすすめ/人気ランキング</li>
                  <li>編集機能管理画面</li>
                  <li>データ管理、分析</li>
                </ul>
              </div>
              <button 
                className={`plan-select-btn ${currentPlan === 'business' ? 'selected' : 'primary'}`}
                onClick={() => handleSelectPlan('business')}
              >
                {currentPlan === 'business' ? '現在のプラン' : 'このプランを選択'}
              </button>
            </div>
          </div>

          {/* Pro Plan - Coming Soon */}
          <div className="plan-card coming-soon">
            <div className="coming-tag">準備中 🔜</div>
            <div className="plan-header">
              <h3 className="plan-name">プロプラン</h3>
              <div className="plan-price">¥8,800</div>
              <div className="plan-period">月額</div>
            </div>
            <div className="plan-body">
              <p className="plan-desc">
                店舗支援機能までてっついたフルスペック
              </p>
              <div className="plan-features">
                <div className="features-label">機能：</div>
                <ul>
                  <li>店舗AIの全機能+</li>
                  <li>SNSエージェント機能</li>
                  <li>スタッフ教育モード</li>
                  <li>予約管理/需要予測</li>
                </ul>
              </div>
              <button className="plan-select-btn disabled" disabled>
                準備中
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          .breadcrumb {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #64748b;
            margin-bottom: 16px;
          }
          .breadcrumb-link {
            color: var(--primary);
            cursor: pointer;
          }
          .breadcrumb-link:hover {
            text-decoration: underline;
          }
          .breadcrumb .separator {
            color: var(--muted);
          }
          .breadcrumb .current {
            color: var(--text);
            font-weight: 500;
          }

          .header-card {
            text-align: center;
            margin-bottom: 24px;
          }
          .page-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--text);
            margin: 0 0 6px 0;
          }
          .page-description {
            font-size: 14px;
            color: var(--muted);
            margin: 0;
          }

          .current-plan-banner {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 16px 20px;
            border-radius: 8px;
            color: white;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
          }
          .banner-left {
            flex: 1;
          }
          .banner-label {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 4px;
          }
          .banner-plan-name {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .banner-price {
            font-size: 14px;
            opacity: 0.9;
          }
          .banner-right {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
          }
          .banner-detail {
            display: flex;
            flex-direction: column;
          }
          .banner-detail .detail-label {
            font-size: 11px;
            opacity: 0.8;
            margin-bottom: 2px;
          }
          .banner-detail .detail-value {
            font-size: 13px;
            font-weight: 600;
          }

          .plans-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }

          .plan-card {
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .plan-card.active {
            border: 2px solid var(--primary);
          }
          .plan-card.recommended {
            border: 2px solid var(--primary);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
          }
          .plan-card.coming-soon {
            opacity: 0.7;
          }

          .recommend-tag {
            position: absolute;
            top: 12px;
            right: 12px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
          }
          .coming-tag {
            position: absolute;
            top: 12px;
            right: 12px;
            background: #94a3b8;
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
          }

          .plan-header {
            padding: 16px;
            border-bottom: 1px solid var(--border);
          }
          .plan-name {
            font-size: 16px;
            font-weight: 700;
            margin: 0 0 8px 0;
            color: var(--text);
          }
          .plan-price {
            font-size: 24px;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 2px;
          }
          .plan-period {
            font-size: 12px;
            color: var(--muted);
          }

          .plan-body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            flex: 1;
          }
          .plan-desc {
            color: var(--muted);
            margin: 0 0 12px 0;
            font-size: 12px;
            line-height: 1.5;
            flex: 1;
          }
          .plan-features {
            margin-bottom: 12px;
          }
          .features-label {
            font-weight: 600;
            margin-bottom: 6px;
            color: var(--text-body);
            font-size: 12px;
          }
          .feature-text {
            font-size: 11px;
            color: var(--muted);
            line-height: 1.6;
          }
          .plan-features ul {
            margin: 0;
            padding-left: 16px;
            font-size: 11px;
            color: var(--muted);
            line-height: 1.6;
          }

          .plan-select-btn {
            width: 100%;
            padding: 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: auto;
          }
          .plan-select-btn.primary {
            background: var(--primary);
            color: white;
            border: none;
          }
          .plan-select-btn.primary:hover {
            background: #2563EB;
          }
          .plan-select-btn.secondary {
            background: var(--bg-hover);
            color: var(--text-body);
            border: 1px solid var(--border-strong);
          }
          .plan-select-btn.secondary:hover {
            background: var(--border-strong);
            border-color: var(--primary);
            color: var(--primary);
          }
          .plan-select-btn.selected {
            background: var(--primary);
            color: white;
            border: none;
          }
          .plan-select-btn.disabled {
            background: var(--bg-hover);
            color: var(--muted);
            border: none;
            cursor: not-allowed;
          }

          @media (max-width: 1100px) {
            .plans-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 640px) {
            .plans-grid {
              grid-template-columns: 1fr;
            }
            .current-plan-banner {
              flex-direction: column;
              align-items: flex-start;
            }
            .banner-right {
              flex-direction: column;
              gap: 12px;
            }
          }
        `}</style>
      </AdminLayout>
    )
  }

  // Account Info View (Main)
  return (
    <AdminLayout title="アカウント情報">
      <div className="account-card">
        <h2 className="card-title">アカウント情報</h2>

        {/* Email Section */}
        <div className="form-section">
          <label className="form-label">メールアドレス</label>
          <div className="input-row">
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
            <button className="btn-primary btn-small" onClick={handleUpdateEmail}>
              保存
            </button>
          </div>
        </div>

        {/* Password Section */}
        <div className="form-section">
          <label className="form-label">パスワード変更</label>
          <div className="password-inputs">
            <input
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="現在のパスワード"
            />
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新しいパスワード"
            />
            <button className="btn-primary btn-small" onClick={handleUpdatePassword}>
              パスワードを変更
            </button>
          </div>
        </div>


        {/* QR Code Management Link */}
        <div className="qr-section">
          <div className="qr-card">
            <div className="qr-content">
              <h3 className="qr-title">QRコード管理</h3>
              <p className="qr-desc">
                QRコードの生成・ダウンロードは基本情報ページから行えます。店頭掲示用のPDFも準備できます。
              </p>
            </div>
            <button className="btn-primary" onClick={() => router.push('/admin/basic-info')}>
              基本情報を開く
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .account-card {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          border: 1px solid var(--border);
        }
        .card-title {
          margin: 0 0 24px 0;
          font-size: 20px;
          font-weight: 600;
          color: var(--text);
        }

        .form-section {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-body);
          margin-bottom: 8px;
        }
        .input-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .form-input {
          flex: 1;
          max-width: 400px;
          padding: 8px 12px;
          border: 1px solid var(--border-strong);
          background: var(--bg-input);
          color: var(--text);
          border-radius: 6px;
          font-size: 14px;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .password-inputs {
          display: grid;
          gap: 10px;
          max-width: 400px;
        }
        .password-inputs .form-input {
          width: 100%;
          max-width: none;
        }
        .password-inputs .btn-primary {
          justify-self: start;
        }

        .btn-primary {
          padding: 10px 16px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-primary:hover {
          background: #2563EB;
        }
        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }
        .btn-secondary {
          padding: 6px 12px;
          background: var(--bg-hover);
          color: var(--text-body);
          border: 1px solid var(--border-strong);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          background: var(--border-strong);
          border-color: var(--primary);
          color: var(--primary);
        }

        .plan-section {
          padding-top: 20px;
          border-top: 1px solid var(--border);
          border-bottom: none;
        }
        .plan-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .plan-header-row .form-label {
          margin: 0;
        }
        .plan-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }
        .plan-info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .info-label {
          font-size: 11px;
          color: var(--muted);
        }
        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }

        .qr-section {
          margin-top: 32px;
          border-top: 1px solid var(--border);
          padding-top: 24px;
        }
        .qr-card {
          background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.08));
          border-radius: 12px;
          padding: 24px;
          border: 1px solid rgba(59,130,246,0.2);
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .qr-content {
          flex: 1;
          min-width: 200px;
        }
        .qr-title {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #3B82F6;
        }
        .qr-desc {
          margin: 0;
          font-size: 13px;
          color: var(--muted);
          line-height: 1.6;
        }

        @media (max-width: 640px) {
          .input-row {
            flex-direction: column;
            align-items: stretch;
          }
          .form-input {
            max-width: none;
          }
          .qr-card {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </AdminLayout>
  )
}
