'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

type Toast = {
  id: number
  type: ToastType
  message: string
}

type ToastContextValue = {
  toast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, message: string) => {
    const id = nextId++
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  const colors: Record<ToastType, string> = {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              background: '#1E293B',
              border: `1px solid ${colors[t.type]}40`,
              borderLeft: `3px solid ${colors[t.type]}`,
              borderRadius: 8,
              color: '#F8FAFC',
              fontSize: 14,
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              animation: 'toast-slide-in 0.3s ease',
              maxWidth: 400,
              cursor: 'pointer',
            }}
            onClick={() => remove(t.id)}
          >
            <span style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: `${colors[t.type]}20`,
              color: colors[t.type],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {icons[t.type]}
            </span>
            <span style={{ flex: 1 }}>{t.message}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context.toast
}
