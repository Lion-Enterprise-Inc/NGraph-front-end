'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [userType, setUserType] = useState<'store' | 'admin'>('store')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (email && password) {
        // Store login info and user type
        localStorage.setItem('admin_logged_in', 'true')
        localStorage.setItem('admin_user_type', userType)
        localStorage.setItem('admin_user_email', email)
        router.push('/admin')
      } else {
        setError('メールアドレスとパスワードを入力してください')
      }
    } catch (err) {
      setError('ログインに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Left: Visual Panel */}
        <div className="login-visual">
          <h1>AIスタッフで店舗の魅力を24時間案内</h1>
          <p>メニュー更新から多言語対応まで、AIスタッフが対応します。まずは無料プランでQRポップをお試しください。</p>
          <ul>
            <li>QRポップを自動生成してその場でダウンロード</li>
            <li>Stripe決済でプランをそのままアップグレード</li>
            <li>AIエディタ、メニュー管理、分析ダッシュボード完備</li>
          </ul>
        </div>

        {/* Right: Form Panel */}
        <div className="login-panel">
          {/* Tabs */}
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab-button ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              ログイン
            </button>
            <button
              type="button"
              className={`login-tab-button ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              新規登録
            </button>
          </div>

          {activeTab === 'login' ? (
            <form className="login-form" onSubmit={handleLogin}>
              {/* User Type Toggle */}
              <div className="user-type-toggle">
                <button
                  type="button"
                  className={`user-type-btn ${userType === 'store' ? 'active' : ''}`}
                  onClick={() => setUserType('store')}
                >
                  🍽️ レストランとしてログイン
                </button>
                <button
                  type="button"
                  className={`user-type-btn ${userType === 'admin' ? 'active' : ''}`}
                  onClick={() => setUserType('admin')}
                >
                  👑 プラットフォームオーナーとしてログイン
                </button>
              </div>

              <div className="user-type-info">
                {userType === 'store' ? (
                  <p>🍽️ レストランオーナー向け：レストラン情報、メニュー、AI設定を管理</p>
                ) : (
                  <p>👑 プラットフォームオーナー向け：全レストラン管理、システム設定</p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">メールアドレス</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="owner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">パスワード</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="8文字以上"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </button>

              <div className="form-footer">
                <span className="link">パスワードをお忘れですか？</span>
                <span className="link">サポートに連絡</span>
              </div>
            </form>
          ) : (
            <form className="login-form" onSubmit={(e) => { e.preventDefault(); alert('新規登録機能は準備中です'); }}>
              <div className="form-group">
                <label className="form-label">メールアドレス</label>
                <input type="email" className="form-input" placeholder="owner@example.com" required />
              </div>

              <div className="form-group">
                <label className="form-label">パスワード</label>
                <input type="password" className="form-input" placeholder="8文字以上" required />
              </div>

              <div className="form-group">
                <label className="form-label">パスワード（確認）</label>
                <input type="password" className="form-input" placeholder="もう一度入力" required />
              </div>

              <div className="form-group">
                <label className="form-label">レストラン名</label>
                <input type="text" className="form-input" placeholder="例: ぼんた本店" required />
              </div>

              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>利用規約に同意します（<span className="link">内容を確認</span>）</span>
              </label>

              <button type="submit" className="submit-btn">無料で始める</button>

              <div className="form-footer">
                <span className="link">パスワードをお忘れですか？</span>
                <span className="link">サポートに連絡</span>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #e0f2fe, #ede9fe);
          padding: 40px 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 28px;
          box-shadow: 0 32px 60px rgba(15, 23, 42, 0.18);
          border: 1px solid rgba(148, 163, 184, 0.22);
          max-width: 960px;
          width: 100%;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          overflow: hidden;
        }

        .login-visual {
          background: linear-gradient(180deg, rgba(37, 99, 235, 0.12), rgba(99, 102, 241, 0.12));
          padding: 48px 40px;
          display: grid;
          gap: 18px;
        }

        .login-visual h1 {
          margin: 0;
          font-size: 28px;
          color: #1e293b;
          font-weight: 700;
        }

        .login-visual p {
          margin: 0;
          font-size: 15px;
          color: #475569;
          line-height: 1.7;
        }

        .login-visual ul {
          margin: 0;
          padding-left: 20px;
          display: grid;
          gap: 8px;
          color: #1f2937;
          font-size: 14px;
        }

        .login-panel {
          padding: 48px 40px;
          display: grid;
          gap: 24px;
        }

        .login-tabs {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          border-radius: 999px;
          padding: 6px;
          background: rgba(148, 163, 184, 0.18);
        }

        .login-tab-button {
          border: none;
          border-radius: 999px;
          padding: 12px 18px;
          background: transparent;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
          font-size: 14px;
        }

        .login-tab-button.active {
          background: #fff;
          color: #2563eb;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.2);
        }

        .login-tab-button:not(.active):hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .login-form {
          display: grid;
          gap: 16px;
        }

        .user-type-toggle {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 4px;
          background: rgba(148, 163, 184, 0.18);
          border-radius: 14px;
        }

        .user-type-btn {
          border: none;
          border-radius: 12px;
          padding: 12px 8px;
          font-size: 13px;
          font-weight: 600;
          background: transparent;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .user-type-btn.active {
          background: #fff;
          color: #2563eb;
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.2);
        }

        .user-type-info {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 12px;
        }

        .user-type-info p {
          margin: 0;
          font-size: 13px;
          color: #0369a1;
        }

        .form-group {
          display: grid;
          gap: 6px;
        }

        .form-label {
          font-size: 13px;
          color: #0f172a;
          font-weight: 600;
        }

        .form-input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          padding: 12px 16px;
          font-size: 14px;
          background: #fff;
          transition: border 0.2s ease, box-shadow 0.2s ease;
          outline: none;
        }

        .form-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          text-align: center;
        }

        .submit-btn {
          border: none;
          border-radius: 14px;
          padding: 14px 20px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: #fff;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 20px 40px rgba(79, 70, 229, 0.26);
          width: 100%;
          transition: all 0.3s ease;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 24px 48px rgba(79, 70, 229, 0.35);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .form-footer {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #64748b;
        }

        .link {
          color: #2563eb;
          cursor: pointer;
        }

        .link:hover {
          text-decoration: underline;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #475569;
          cursor: pointer;
        }

        .checkbox-label input {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .login-card {
            grid-template-columns: 1fr;
          }

          .login-visual {
            padding: 32px 24px;
          }

          .login-panel {
            padding: 32px 24px;
          }

          .login-visual h1 {
            font-size: 22px;
          }

          .user-type-toggle {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
