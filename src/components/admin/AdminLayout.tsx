'use client'

import React, { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAppContext } from '../AppProvider'
import { getUiCopy } from '../../i18n/uiCopy'

type NavItem = { key: string; label: string; icon: string; to: string }

type Props = { children: ReactNode; title?: string }

export default function AdminLayout({ children, title }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { language } = useAppContext()
  const copy = getUiCopy(language)
  const navItems: NavItem[] = [
    { key: 'stores', label: copy.admin.nav.stores, icon: '🏬', to: '/admin/stores' },
    { key: 'groups', label: copy.admin.nav.groups, icon: '⚽️', to: '/admin/groups' },
    { key: 'prompt', label: copy.admin.nav.prompt, icon: '<>', to: '/admin/prompts' },
    { key: 'logout', label: copy.admin.nav.logout, icon: '<>', to: '/admin/logout' },
  ]
  const pageTitle = title ?? copy.admin.title.stores

  return (
    <div className={`admin-shell${sidebarOpen ? ' sidebar-open' : ''}`}>
      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-mark">⛩</span>
          <span className="brand-name">{copy.admin.brand}</span>
          <button type="button" className="admin-back" aria-label={copy.admin.back}>‹</button>
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label={copy.admin.closeMenu}
          >
            ×
          </button>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.to
            return (
              <Link
                key={item.key}
                href={item.to}
                className={`admin-nav-item${isActive ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            )
          })}
          
        
        </nav>

      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <button
            type="button"
            className="admin-toggle"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={copy.admin.toggleMenu}
          >
            ☰
          </button>
          <span className="admin-page-title">{pageTitle}</span>
          <div className="admin-user">
            <span className="user-email">shingo.takahashi@hashigo.me</span>
            <span className="user-avatar">👤</span>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </main>
    </div>
  )
}
