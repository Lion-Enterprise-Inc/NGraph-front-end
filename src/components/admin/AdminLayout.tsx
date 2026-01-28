'use client'

import React, { useState, ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { TokenService, AuthApi, User } from '../../services/api'

type NavItem = { key: string; label: string; icon: string; to: string; locked?: boolean }

type Props = { children: ReactNode; title?: string }

export default function AdminLayout({ children, title }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userType, setUserType] = useState<'store' | 'admin'>('store')
  const [userEmail, setUserEmail] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Check for JWT token and user data
    const token = TokenService.getAccessToken()
    const storedUser = TokenService.getUser()
    
    if (!token || !storedUser) {
      // Fallback to legacy check for backward compatibility
      const isLoggedIn = localStorage.getItem('admin_logged_in')
      if (!isLoggedIn) {
        router.push('/admin/login')
        return
      }
      
      // Use legacy data
      const savedUserType = localStorage.getItem('admin_user_type')
      if (savedUserType === 'store' || savedUserType === 'admin') {
        setUserType(savedUserType)
      }
      
      const savedEmail = localStorage.getItem('admin_user_email')
      if (savedEmail) {
        setUserEmail(savedEmail)
      }
    } else {
      // Use new auth data
      setUser(storedUser)
      setUserEmail(storedUser.email)
      // Map role to userType for UI
      setUserType(storedUser.role === 'platform_owner' ? 'admin' : 'store')
    }
    
    setIsLoading(false)
  }, [router])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNavClick = (e: React.MouseEvent, item: NavItem) => {
    e.preventDefault()
    if (item.locked) {
      alert('この機能はビジネスプラン以上で利用可能です')
      return
    }
    setSidebarOpen(false)
    router.push(item.to)
  }
  
  const restaurantNavItems: NavItem[] = [
    { key: 'dashboard', label: 'ダッシュボード', icon: '🏠', to: '/admin' },
    { key: 'basic-info', label: '基本情報', icon: '🧾', to: '/admin/basic-info' },
    { key: 'menu-list', label: 'メニュー一覧', icon: '📋', to: '/admin/menu-list' },
    { key: 'ai-editor', label: 'AIエディタ', icon: '✨', to: '/admin/ai-editor' },
    { key: 'qr', label: 'QRコード', icon: '📱', to: '/admin/qr-management' },
  ]

  const platformOwnerNavItems: NavItem[] = [
    { key: 'dashboard', label: 'ダッシュボード', icon: '🏠', to: '/admin' },
    { key: 'users', label: 'ユーザー管理', icon: '👥', to: '/admin/users' },
    { key: 'restaurant-list', label: '導入レストラン', icon: '🍽️', to: '/admin/stores' },
    { key: 'ai-management', label: 'AI管理', icon: '🤖', to: '/admin/ai-management' },
    { key: 'system-prompt', label: 'システムプロンプト', icon: '📝', to: '/admin/prompts' },
  ]

  const navItems = userType === 'store' ? restaurantNavItems : platformOwnerNavItems
  const pageTitle = title ?? (userType === 'store' ? 'レストラン管理システム' : 'プラットフォームオーナー管理システム')

  const handleLogout = () => {
    // Clear all auth data using the API service
    AuthApi.logout()
    router.push('/admin/login')
  }

  if (!mounted || isLoading) {
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
          borderTopColor: '#1f2937',
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

  return (
    <>
      <style jsx global>{`
        :root {
          --bg-page: #F8FAFC;
          --bg-surface: #FFFFFF;
          --text: #0F172A;
          --muted: #64748B;
          --border: #E5E7EB;
          --primary: #2563EB;
          --radius: 12px;
          --space-2: 12px;
          --space-3: 16px;
          --space-4: 20px;
          --space-5: 24px;
          --space-6: 32px;
          --sidebar-w: 260px;
          --sidebar-w-compact: 72px;
          --color-primary: #2563EB;
          --color-gray-50: #F8FAFC;
          --color-gray-200: #E5E7EB;
          --color-gray-300: #D1D5DB;
          --color-gray-500: #6B7280;
          --color-gray-600: #4B5563;
          --color-gray-700: #64748B;
          --color-gray-900: #0F172A;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: var(--bg-page);
          min-height: 100vh;
          color: var(--text);
        }
      `}</style>

      <div className="app-shell">
        {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}
        
        <aside className={`app-sidebar${sidebarOpen ? ' open' : ''}`}>
          {/* Brand Logo */}
          <a href="/admin" className="brand" onClick={(e) => { e.preventDefault(); router.push('/admin'); }}>
            <strong className="brand-text">NGraph</strong>
          </a>

          {/* User Type Badge */}
          <div className="user-type-badge">
            {userType === 'store' ? (
              <>🍽️ レストランビュー</>
            ) : (
              <>👑 プラットフォームオーナービュー</>
            )}
          </div>

          {/* Navigation */}
          <nav className="nav">
            {navItems.map((item) => {
              const isActive = pathname === item.to || (item.to !== '/admin' && pathname?.startsWith(item.to))
              return (
                <a
                  key={item.key}
                  href={item.to}
                  className={`nav-link ${isActive ? 'active' : ''} ${item.locked ? 'locked' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={(e) => handleNavClick(e, item)}
                >
                  <span className="icon">{item.icon}</span>
                  <span className="label">{item.label}</span>
                  {item.locked && <span className="lock-icon">🔒</span>}
                </a>
              )
            })}
          </nav>

          {/* Account Section */}
          <div className="sidebar-account">
            {/* User Info */}
            <div id="sidebarUserInfo" className="user-info">
              <div className="user-info-label">ログイン中</div>
              <div id="sidebarUserEmail" className="user-info-email">{userEmail || 'user@example.com'}</div>
              <div id="sidebarUserType" className="user-info-type">{userType === 'store' ? 'レストランオーナー' : 'プラットフォームオーナー'}</div>
            </div>
            
            <div className="account-actions">
              <button id="sidebarLogoutBtn" className="account-btn" onClick={handleLogout}>
                <span className="icon">🚪</span>
                <span className="label">ログアウト</span>
              </button>
              <button id="sidebarSettingsBtn" className="account-btn" onClick={() => router.push('/admin/account')}>
                <span className="icon">👤</span>
                <span className="label">アカウント情報</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="main-wrapper">
          <header className="app-header">
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              ☰
            </button>
            <h1 id="headerTitle">{pageTitle}</h1>
          </header>

          <main className="app-main">
            <div className="app-container">
              {children}
            </div>
          </main>
        </div>
      </div>

      <style jsx>{`
        .app-shell {
          display: grid;
          grid-template-columns: var(--sidebar-w) 1fr;
          min-height: 100dvh;
        }

        .overlay {
          display: none;
        }

        .app-sidebar {
          position: sticky;
          top: 0;
          height: 100dvh;
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          padding: var(--space-4) var(--space-3);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .brand {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 0;
          text-decoration: none;
          transition: transform 0.2s ease;
        }

        .brand:hover {
          transform: scale(1.02);
        }

        .brand-text {
          font-size: 20px;
          color: var(--color-gray-900);
        }

        .user-type-badge {
          text-align: center;
          padding: 10px 12px;
          margin: 8px 0 16px;
          background: ${userType === 'store' ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : 'linear-gradient(135deg, #dbeafe, #bfdbfe)'};
          color: ${userType === 'store' ? '#166534' : '#1e40af'};
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
        }

        .nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          color: var(--text);
          text-decoration: none;
          font-size: 14px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .nav-link:hover {
          background: #F1F5F9;
        }

        .nav-link.active {
          background: #E8F0FF;
          color: #1E40AF;
          font-weight: 600;
          outline: 1px solid #BFDBFE;
        }

        .nav-link.locked {
          opacity: 0.6;
          color: #888;
          background: #f5f5f5;
        }

        .nav-link.locked:hover {
          background: #f0f0f0;
        }

        .nav-link.locked .label {
          color: #888;
          opacity: 0.8;
          font-weight: 400;
        }

        .nav-link.locked .icon {
          opacity: 0.5;
          filter: grayscale(50%);
        }

        .nav-link .icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-link .label {
          transition: opacity 0.3s ease;
        }

        .lock-icon {
          margin-left: auto;
          opacity: 0.5;
          font-size: 12px;
        }

        .sidebar-account {
          margin-top: auto;
          padding-top: 20px;
          padding-bottom: 24px;
          border-top: 1px solid var(--color-gray-200);
        }

        .user-info {
          padding: 12px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .user-info-label {
          font-size: 12px;
          color: var(--color-gray-600);
          margin-bottom: 4px;
        }

        .user-info-email {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-gray-900);
          margin-bottom: 2px;
          word-break: break-all;
        }

        .user-info-type {
          font-size: 12px;
          color: var(--color-gray-500);
        }

        .account-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .account-btn {
          width: 100%;
          padding: 10px 12px;
          background: var(--bg-surface);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .account-btn:hover {
          background: var(--color-gray-50);
          transform: translateY(-1px);
        }

        #sidebarSettingsBtn {
          background: transparent;
          color: var(--color-gray-600);
          border: 1px solid var(--color-gray-300);
        }

        #sidebarSettingsBtn:hover {
          background: var(--color-gray-50);
        }

        .main-wrapper {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
        }

        .app-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
          padding: var(--space-3) var(--space-5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .app-header h1 {
          font-size: 18px;
          font-weight: 600;
          color: var(--color-gray-900);
          margin: 0;
        }

        .menu-toggle {
          display: none;
          position: absolute;
          left: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 4px 8px;
        }

        .app-main {
          padding: var(--space-5);
          padding-bottom: 80px;
          width: 100%;
        }

        .app-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
        }

        @media (max-width: 1024px) {
          .app-shell {
            grid-template-columns: var(--sidebar-w-compact) 1fr;
          }

          .app-sidebar {
            padding: var(--space-3) 8px;
          }

          .nav-link {
            justify-content: center;
            gap: 0;
          }

          .nav-link .label {
            display: none;
          }

          .account-btn .label {
            display: none;
          }

          .user-type-badge {
            padding: 8px;
            font-size: 16px;
          }

          .user-info {
            display: none;
          }

          .lock-icon {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .app-shell {
            grid-template-columns: 1fr;
          }

          .app-sidebar {
            position: fixed;
            left: -280px;
            width: var(--sidebar-w);
            z-index: 100;
            transition: left 0.3s ease;
            padding: var(--space-4) var(--space-3);
          }

          .app-sidebar.open {
            left: 0;
          }

          .overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 99;
          }

          .menu-toggle {
            display: block;
          }

          .nav-link {
            justify-content: flex-start;
            gap: 12px;
          }

          .nav-link .label {
            display: inline;
          }

          .account-btn .label {
            display: inline;
          }

          .user-info {
            display: block;
          }

          .lock-icon {
            display: inline;
          }

          .app-header {
            justify-content: center;
          }
        }
      `}</style>
    </>
  )
}
