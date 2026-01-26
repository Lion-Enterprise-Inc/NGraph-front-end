'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../../components/admin/AdminLayout'

type PlanType = 'free' | 'light' | 'business' | 'pro'

export default function AccountPage() {
  const router = useRouter()
  const [email, setEmail] = useState('a@gmail.com')
  const [currentPlan, setCurrentPlan] = useState<PlanType>('business')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedEmail = localStorage.getItem('admin_user_email')
    if (savedEmail) setEmail(savedEmail)
    setIsLoading(false)
  }, [])

  const handleSelectPlan = (plan: PlanType) => {
    if (plan === 'pro') {
      alert('Proプランは準備中です')
      return
    }
    if (plan === currentPlan) {
      alert('現在ご利用中のプランです')
      return
    }
    if (confirm(`${getPlanName(plan)}に変更しますか？`)) {
      setCurrentPlan(plan)
      alert(`${getPlanName(plan)}に変更しました`)
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

  return (
    <AdminLayout title="アカウント情報">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>👤 アカウント情報</span>
        <span className="separator">›</span>
        <span className="current">💳 プラン・契約管理</span>
      </div>

      {/* Header Card - Centered */}
      <div className="header-card">
        <h1 className="page-title">プラン・契約管理</h1>
        <p className="page-description">プランの選択・変更ができます</p>
      </div>

      {/* Current Plan Card */}
      <div className="section-card">
        <div className="current-plan-box">
          <div className="current-plan-left">
            <div className="current-plan-label">現在のプラン</div>
            <div className="current-plan-name">ビジネスプラン</div>
            <div className="current-plan-price">¥3,980 / 月</div>
          </div>
          <div className="current-plan-right">
            <div className="plan-detail-row">
              <span className="detail-label">契約開始日</span>
              <span className="detail-value">2024-10-01</span>
            </div>
            <div className="plan-detail-row">
              <span className="detail-label">次回更新日</span>
              <span className="detail-value">2024-11-01</span>
            </div>
            <div className="plan-detail-row">
              <span className="detail-label">ステータス</span>
              <span className="detail-value status-green">利用中</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="plans-grid">
        {/* Free Plan */}
        <div className="plan-card">
          <h3 className="plan-name">フリープラン</h3>
          <div className="plan-price-row">
            <span className="plan-price">¥0</span>
            <span className="plan-period">/ 月</span>
          </div>
          <p className="plan-desc">
            一般ユーザー向けの機能です。セッション終了後もOmiseAIの撮影・解説機能をご利用いただけます。
          </p>
          <div className="plan-features">
            <div className="features-label">機能:</div>
            <ul>
              <li>履歴保持期間: 3ヶ月</li>
            </ul>
          </div>
          <button 
            className={`plan-select-btn ${currentPlan === 'free' ? 'selected' : ''}`}
            onClick={() => handleSelectPlan('free')}
          >
            {currentPlan === 'free' ? '現在のプラン' : 'このプランを選択'}
          </button>
        </div>

        {/* Light Plan */}
        <div className="plan-card">
          <h3 className="plan-name">ライトプラン</h3>
          <div className="plan-price-row">
            <span className="plan-price">¥980</span>
            <span className="plan-period">/ 月</span>
          </div>
          <p className="plan-desc">
            スマホで撮影するだけ。AIが商品名はもちろん、背景や素材などの深い情報を多言語で即座に解説します。
          </p>
          <div className="plan-features">
            <div className="features-label">機能:</div>
            <ul>
              <li>QRポップ送付</li>
              <li>AI多言語ガイド</li>
              <li>レストラン基本情報登録</li>
              <li>Googleレビュー連携</li>
            </ul>
          </div>
          <button 
            className={`plan-select-btn ${currentPlan === 'light' ? 'selected' : ''}`}
            onClick={() => handleSelectPlan('light')}
          >
            {currentPlan === 'light' ? '現在のプラン' : 'このプランを選択'}
          </button>
        </div>

        {/* Business Plan - Recommended */}
        <div className="plan-card recommended">
          <div className="recommend-tag">おすすめ</div>
          <h3 className="plan-name">ビジネスプラン</h3>
          <div className="plan-price-row">
            <span className="plan-price">¥3,980</span>
            <span className="plan-period">/ 月</span>
          </div>
          <p className="plan-desc">
            学習データをもとにおすすめ・人気商品の設定・編集が可能。AIがデータに基づき売上向上・業務改善に直接貢献します。
          </p>
          <div className="plan-features">
            <div className="features-label">機能:</div>
            <ul>
              <li>レストランロゴ入りQRコードポップ</li>
              <li>レストラン専用AIガイド</li>
              <li>レストラン情報学習</li>
              <li>AIおすすめ・人気ランキング</li>
              <li>編集機能管理画面</li>
              <li>データ管理・分析</li>
            </ul>
          </div>
          <button 
            className={`plan-select-btn ${currentPlan === 'business' ? 'selected' : ''}`}
            onClick={() => handleSelectPlan('business')}
          >
            {currentPlan === 'business' ? '現在のプラン' : 'このプランを選択'}
          </button>
        </div>

        {/* Pro Plan - Coming Soon */}
        <div className="plan-card coming-soon">
          <div className="coming-tag">準備中 🔜</div>
          <h3 className="plan-name">Proプラン</h3>
          <div className="plan-price-row">
            <span className="plan-price">¥8,800</span>
            <span className="plan-period">/ 月</span>
          </div>
          <p className="plan-desc">
            レストランサポート機能を含むフルスペック
          </p>
          <div className="plan-features">
            <div className="features-label">機能:</div>
            <ul>
              <li>全レストランAI機能+</li>
              <li>SNSエージェント機能</li>
              <li>スタッフ研修モード</li>
              <li>予約管理・需要予測</li>
            </ul>
          </div>
          <button className="plan-select-btn disabled" disabled>
            準備中
          </button>
        </div>
      </div>

      {/* Billing Info */}
      <div className="section-card">
        <h2 className="section-title">請求情報</h2>
        <div className="billing-box">
          <div className="billing-info">
            <div className="billing-label">次回請求日</div>
            <div className="billing-value">2024年11月1日: ¥3,980</div>
          </div>
          <button className="billing-history-btn" onClick={() => alert('請求履歴を表示します')}>
            請求履歴を見る
          </button>
        </div>
        <div className="billing-note">
          ※全プラン共通: 初回のみQRコード発行手数料3,000円がかかります。
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
        .breadcrumb .separator {
          color: #cbd5e1;
        }
        .breadcrumb .current {
          color: #667eea;
          font-weight: 500;
        }

        .header-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          text-align: center;
        }
        .page-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
        }
        .page-description {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .section-card {
          background: white;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 16px 0;
        }

        .current-plan-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
        }
        .current-plan-label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 6px;
        }
        .current-plan-name {
          font-size: 22px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }
        .current-plan-price {
          font-size: 16px;
          color: #667eea;
          font-weight: 600;
        }
        .current-plan-right {
          display: flex;
          gap: 32px;
        }
        .plan-detail-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .detail-label {
          font-size: 12px;
          color: #64748b;
        }
        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
        .status-green {
          color: #10b981;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .plan-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .plan-card.recommended {
          border: 2px solid #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }
        .plan-card.coming-soon {
          opacity: 0.7;
        }

        .recommend-tag {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 4px 16px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 600;
        }
        .coming-tag {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: #f59e0b;
          color: white;
          padding: 4px 16px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 600;
        }

        .plan-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 12px 0;
        }
        .plan-price-row {
          display: flex;
          align-items: baseline;
          gap: 2px;
          margin-bottom: 12px;
        }
        .plan-price {
          font-size: 28px;
          font-weight: 700;
          color: #667eea;
        }
        .plan-period {
          font-size: 14px;
          color: #64748b;
        }
        .plan-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0 0 16px 0;
          flex-grow: 1;
        }
        .plan-features {
          margin-bottom: 16px;
        }
        .features-label {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        .plan-features ul {
          margin: 0;
          padding-left: 16px;
          font-size: 12px;
          color: #4b5563;
          line-height: 1.8;
        }

        .plan-select-btn {
          width: 100%;
          padding: 12px;
          border: 1px solid #667eea;
          background: white;
          color: #667eea;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .plan-select-btn:hover {
          background: #667eea;
          color: white;
        }
        .plan-select-btn.selected {
          background: #667eea;
          color: white;
        }
        .plan-select-btn.disabled {
          background: #e5e7eb;
          color: #9ca3af;
          border-color: #e5e7eb;
          cursor: not-allowed;
        }

        .billing-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 20px;
          margin-bottom: 12px;
        }
        .billing-label {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .billing-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .billing-history-btn {
          padding: 10px 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
        }
        .billing-history-btn:hover {
          background: #f8fafc;
          border-color: #667eea;
          color: #667eea;
        }
        .billing-note {
          font-size: 12px;
          color: #d97706;
          background: #fffbeb;
          padding: 12px 14px;
          border-radius: 6px;
          border-left: 3px solid #f59e0b;
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
          .current-plan-box {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .current-plan-right {
            flex-direction: column;
            gap: 12px;
          }
          .billing-box {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>
    </AdminLayout>
  )
}
