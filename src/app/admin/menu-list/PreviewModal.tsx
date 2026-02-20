'use client'

import { DISH_CATEGORIES } from '../../../services/api'
import type { MenuItem } from './page'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  item: MenuItem | null
  onEdit: (item: MenuItem) => void
}

export default function PreviewModal({ isOpen, onClose, item, onEdit }: PreviewModalProps) {
  if (!isOpen || !item) return null

  return (
    <div className="modal active">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-title">👁️ ユーザー画面プレビュー</div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: '#94A3B8' }}>言語選択: </label>
          <select style={{ padding: '5px 10px', marginLeft: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option value="jp">🇯🇵 日本語</option>
            <option value="en">🇬🇧 English</option>
            <option value="zh">🇨🇳 中文</option>
          </select>
        </div>

        <div style={{ border: '1px solid #1E293B', borderRadius: '10px', padding: '20px', background: '#1E293B' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{item.name}</h3>
          <div style={{ fontSize: '18px', color: '#667eea', fontWeight: 600, marginBottom: '12px' }}>
            ¥{item.price.toLocaleString()}
          </div>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '12px' }}>{item.description}</p>
          <div style={{ fontSize: '13px', color: '#888' }}>
            <strong>カテゴリ:</strong> {DISH_CATEGORIES[item.category] || item.category}
          </div>
          {item.ingredients && item.ingredients.length > 0 && (
            <div style={{ fontSize: '13px', color: '#888', marginTop: '8px' }}>
              <strong>原材料:</strong> {item.ingredients.map(ing => ing.name).join(', ')}
            </div>
          )}
        </div>

        <div className="alert-info" style={{ marginTop: '20px' }}>
          <strong>⚠️ 問題点の検出:</strong>
          <ul style={{ marginTop: '10px', paddingLeft: '20px', fontSize: '13px' }}>
            {!item.description && <li>説明文が未設定です</li>}
            {(!item.ingredients || item.ingredients.length === 0) && <li>原材料が未設定です</li>}
            {!item.status && <li>アレルゲン情報の確認が必要です</li>}
          </ul>
        </div>

        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => { onClose(); onEdit(item); }}>
          ✏️ この内容を編集
        </button>
      </div>

      <style jsx>{`
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal.active {
          display: flex;
        }

        .modal-content {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 24px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--muted);
        }

        .modal-close:hover {
          color: var(--text);
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }

        .alert-info {
          background: #e0f2fe;
          color: #0369a1;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .btn {
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #1d4ed8, #6d28d9);
        }

        @media (max-width: 640px) {
          .modal {
            padding: 0;
          }
          .modal-content {
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
