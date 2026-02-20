'use client'

import { useEffect, useCallback, ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  maxWidth?: string
  children: ReactNode
}

export default function Modal({ isOpen, onClose, title, maxWidth = '800px', children }: ModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ maxWidth }}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <div className="modal-title-bar">{title}</div>
        <div className="modal-body">{children}</div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-box {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 24px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--muted);
          z-index: 1;
        }

        .modal-close-btn:hover {
          color: var(--text);
        }

        .modal-title-bar {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
          padding-right: 40px;
        }

        .modal-body {
          /* content fills here */
        }

        @media (max-width: 640px) {
          .modal-overlay {
            padding: 0;
          }

          .modal-box {
            max-height: 100dvh;
            height: 100dvh;
            border-radius: 0;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
