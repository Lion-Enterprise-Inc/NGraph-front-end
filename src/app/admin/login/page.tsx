'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { AuthApi } from '../../../services/api'
import { useAdminLang } from '../../../hooks/useAdminLang'
import type { AdminCopy } from '../../../i18n/adminCopy'

const makeValidateEmail = (t: AdminCopy) => (email: string): string | null => {
  if (!email.trim()) return t.login.validateEmailRequired
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return t.login.validateEmailFormat
  return null
}

const makeValidatePassword = (t: AdminCopy) => (password: string): string | null => {
  if (!password) return t.login.validatePasswordRequired
  if (password.length < 8) return t.login.validatePasswordLength
  return null
}

interface FieldErrors {
  email?: string
  password?: string
}

interface RegisterFieldErrors {
  email?: string
  password?: string
  restaurantName?: string
  terms?: string
}

export default function AdminLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { t } = useAdminLang()
  const validateEmail = makeValidateEmail(t)
  const validatePassword = makeValidatePassword(t)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({ email: false, password: false })

  // Register state
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [restaurantName, setRestaurantName] = useState('')
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerFieldErrors, setRegisterFieldErrors] = useState<RegisterFieldErrors>({})

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
        backgroundColor: '#0B1121',
        zIndex: 9999
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #334155',
          borderTopColor: '#3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ marginTop: '16px', color: '#94A3B8', fontSize: '14px' }}>{t.login.loading}</div>
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
      const result = await login(email, password)
      
      if (result.success) {
        router.push('/admin')
      } else {
        setError(result.error || t.login.loginFailed)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t.login.loginFailed
      if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('incorrect')) {
        setError(t.login.invalidCredentials)
      } else if (errorMessage.toLowerCase().includes('not found')) {
        setError(t.login.accountNotFound)
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        setError(t.login.networkError)
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors: RegisterFieldErrors = {}
    const emailErr = validateEmail(registerEmail)
    if (emailErr) errors.email = emailErr
    const passErr = validatePassword(registerPassword)
    if (passErr) errors.password = passErr
    if (!restaurantName.trim()) {
      errors.restaurantName = t.login.validateRestaurantNameRequired
    }
    if (!termsAgreed) {
      errors.terms = t.login.validateTermsRequired
    }

    setRegisterFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setRegisterLoading(true)
    setRegisterError('')
    setRegisterSuccess('')

    try {
      await AuthApi.register({
        email: registerEmail,
        password: registerPassword,
        role: 'restaurant_owner',
        restaurant_name: restaurantName,
      })
      // 登録成功 → 自動ログイン → セットアップウィザードへ
      const loginResult = await login(registerEmail, registerPassword)
      if (loginResult.success) {
        router.push('/admin/setup')
        return
      }
      // 自動ログイン失敗時はフォールバック
      setRegisterSuccess(t.login.registerSuccess)
      setActiveTab('login')
      setEmail(registerEmail)
      setRegisterEmail('')
      setRegisterPassword('')
      setRestaurantName('')
      setTermsAgreed(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : t.login.registerFailed
      if (msg.toLowerCase().includes('already registered')) {
        setRegisterError(t.login.emailAlreadyRegistered)
      } else {
        setRegisterError(msg)
      }
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Left: Visual Panel */}
        <div className="login-visual">
          <h1>{t.login.visualTitle}</h1>
          <p>{t.login.visualLead}</p>
          <ul>
            <li>{t.login.visualBullet1}</li>
            <li>{t.login.visualBullet2}</li>
            <li>{t.login.visualBullet3}</li>
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
              {t.login.tabLogin}
            </button>
            <button
              type="button"
              className={`login-tab-button ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              {t.login.tabRegister}
            </button>
          </div>

          {activeTab === 'login' ? (
            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">{t.login.email}</label>
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
                <label className="form-label">{t.login.password}</label>
                <input
                  type="password"
                  className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                  placeholder={t.login.passwordPlaceholder}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={() => handleBlur('password')}
                />
                {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
              </div>

              {registerSuccess && <div className="success-message">{registerSuccess}</div>}
              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? t.login.submittingLogin : t.login.submitLogin}
              </button>

              <div className="form-footer">
                <span className="link">{t.login.forgotPassword}</span>
                <span className="link">{t.login.contactSupport}</span>
              </div>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">{t.login.email}</label>
                <input
                  type="email"
                  className={`form-input ${registerFieldErrors.email ? 'input-error' : ''}`}
                  placeholder="owner@example.com"
                  value={registerEmail}
                  onChange={(e) => { setRegisterEmail(e.target.value); setRegisterError('') }}
                />
                {registerFieldErrors.email && <span className="field-error">{registerFieldErrors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">{t.login.password}</label>
                <div className="password-wrap">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    className={`form-input ${registerFieldErrors.password ? 'input-error' : ''}`}
                    placeholder={t.login.passwordPlaceholder}
                    value={registerPassword}
                    onChange={(e) => { setRegisterPassword(e.target.value); setRegisterError('') }}
                  />
                  <button type="button" className="eye-toggle" onClick={() => setShowRegisterPassword(!showRegisterPassword)}>
                    {showRegisterPassword ? '🙈' : '👁'}
                  </button>
                </div>
                {registerFieldErrors.password && <span className="field-error">{registerFieldErrors.password}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">{t.login.restaurantName}</label>
                <input
                  type="text"
                  className={`form-input ${registerFieldErrors.restaurantName ? 'input-error' : ''}`}
                  placeholder={t.login.restaurantNamePlaceholder}
                  value={restaurantName}
                  onChange={(e) => { setRestaurantName(e.target.value); setRegisterError('') }}
                />
                {registerFieldErrors.restaurantName && <span className="field-error">{registerFieldErrors.restaurantName}</span>}
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                />
                <span><a href="https://ngraph.jp/legal.html" target="_blank" rel="noopener" className="link">{t.login.termsLinkText}</a>{t.login.agreeToTerms}</span>
              </label>
              {registerFieldErrors.terms && <span className="field-error">{registerFieldErrors.terms}</span>}

              {registerError && <div className="error-message">{registerError}</div>}

              <button type="submit" className="submit-btn" disabled={registerLoading}>
                {registerLoading ? t.login.submittingRegister : t.login.submitRegister}
              </button>

              <div className="form-footer">
                <span className="link">{t.login.forgotPassword}</span>
                <span className="link">{t.login.contactSupport}</span>
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
          background: #0B1121;
          padding: 40px 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .login-card {
          background: #111827;
          border-radius: 28px;
          box-shadow: 0 32px 60px rgba(0, 0, 0, 0.4);
          border: 1px solid #1E293B;
          max-width: 960px;
          width: 100%;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          overflow: hidden;
        }

        .login-visual {
          background: linear-gradient(180deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08));
          padding: 48px 40px;
          display: grid;
          gap: 18px;
        }

        .login-visual h1 {
          margin: 0;
          font-size: 28px;
          color: #F8FAFC;
          font-weight: 700;
        }

        .login-visual p {
          margin: 0;
          font-size: 15px;
          color: #94A3B8;
          line-height: 1.7;
        }

        .login-visual ul {
          margin: 0;
          padding-left: 20px;
          display: grid;
          gap: 8px;
          color: #E2E8F0;
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
          background: rgba(30, 41, 59, 0.5);
        }

        .login-tab-button {
          border: none;
          border-radius: 999px;
          padding: 12px 18px;
          background: transparent;
          font-weight: 600;
          color: #94A3B8;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
          font-size: 14px;
        }

        .login-tab-button.active {
          background: #1E293B;
          color: #3B82F6;
          box-shadow: 0 14px 28px rgba(37, 99, 235, 0.2);
        }

        .login-tab-button:not(.active):hover {
          background: rgba(30, 41, 59, 0.3);
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
          color: #E2E8F0;
          font-weight: 600;
        }

        .form-input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid #334155;
          padding: 12px 16px;
          font-size: 14px;
          background: #0F172A;
          color: #F8FAFC;
          transition: border 0.2s ease, box-shadow 0.2s ease;
          outline: none;
        }

        .form-input:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .form-input.input-error {
          border-color: #EF4444;
          background: rgba(239, 68, 68, 0.1);
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

        .success-message {
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          text-align: center;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          color: #EF4444;
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
          color: #94A3B8;
        }

        .link {
          color: #3B82F6;
          cursor: pointer;
        }

        .link:hover {
          text-decoration: underline;
        }

        .password-wrap {
          position: relative;
        }

        .password-wrap .form-input {
          padding-right: 44px;
        }

        .eye-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          line-height: 1;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #94A3B8;
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
