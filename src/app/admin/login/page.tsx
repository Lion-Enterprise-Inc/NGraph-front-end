'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthApi } from '../../../services/api'

// Validation helpers
const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return 'メールアドレスを入力してください'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return '有効なメールアドレスを入力してください'
  }
  return null
}

const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'パスワードを入力してください'
  }
  if (password.length < 8) {
    return 'パスワードは8文字以上で入力してください'
  }
  return null
}

interface FieldErrors {
  email?: string
  password?: string
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({ email: false, password: false })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch - show loading until mounted
  if (!mounted) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        zIndex: 9999
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #E5E7EB',
          borderTopColor: '#2563EB',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ marginTop: '16px', color: '#64748B', fontSize: '14px' }}>読み込み中...</div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (touched.email) {
      const emailError = validateEmail(value)
      setFieldErrors(prev => ({ ...prev, email: emailError || undefined }))
    }
    setError('')
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (touched.password) {
      const passwordError = validatePassword(value)
      setFieldErrors(prev => ({ ...prev, password: passwordError || undefined }))
    }
    setError('')
  }

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }))
    if (field === 'email') {
      const emailError = validateEmail(email)
      setFieldErrors(prev => ({ ...prev, email: emailError || undefined }))
    } else {
      const passwordError = validatePassword(password)
      setFieldErrors(prev => ({ ...prev, password: passwordError || undefined }))
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    
    setFieldErrors({
      email: emailError || undefined,
      password: passwordError || undefined
    })
    setTouched({ email: true, password: true })

    if (emailError || passwordError) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await AuthApi.login({ email, password })
      
      if (response.result?.user) {
        router.push('/admin')
      } else {
        setError('ログインに失敗しました')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました'
      // Map common error messages to Japanese
      if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('incorrect')) {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else if (errorMessage.toLowerCase().includes('not found')) {
        setError('アカウントが見つかりません')
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        setError('ネットワークエラーが発生しました。接続を確認してください')
      } else {
        setError(errorMessage)
      }
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
              <div className="form-group">
                <label className="form-label">メールアドレス</label>
                <input
                  type="email"
                  className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                  placeholder="owner@example.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => handleBlur('email')}
                />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">パスワード</label>
                <input
                  type="password"
                  className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                  placeholder="8文字以上"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={() => handleBlur('password')}
                />
                {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
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

        .form-input.input-error {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .form-input.input-error:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .field-error {
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
          display: block;
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

        }
      `}</style>
    </div>
  )
}
