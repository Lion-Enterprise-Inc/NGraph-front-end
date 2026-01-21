'use client'

import { useState } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'

interface MenuItem {
  id: number
  name: string
  price: number
  category: string
  confidence: number
  status: 'verified' | 'warning' | 'pending'
  description: string
}

export default function MenuListPage() {
  const [filter, setFilter] = useState('all')
  
  const menuItems: MenuItem[] = [
    {
      id: 1,
      name: '梅と昆布の出汁茶漬け',
      price: 570,
      category: 'ご飯もの',
      confidence: 65,
      status: 'warning',
      description: '福井県産の梅干しと昆布を使った、さっぱりとした出汁茶漬け。'
    },
    {
      id: 2,
      name: '紅ズワイ蟹刺し',
      price: 1980,
      category: '刺身',
      confidence: 95,
      status: 'verified',
      description: '福井県産の新鮮な紅ズワイ蟹をお刺身で。'
    },
    {
      id: 3,
      name: '紅ズワイ蟹と福井の幸コース',
      price: 9800,
      category: 'コース',
      confidence: 92,
      status: 'verified',
      description: '福井の名産品をふんだんに使用した贅沢コース。'
    },
    {
      id: 4,
      name: '越前そば',
      price: 850,
      category: '麺類',
      confidence: 45,
      status: 'pending',
      description: '福井名物の越前そば。'
    }
  ]

  const filteredItems = filter === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.status === filter)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return { label: '確認済み', class: 'badge-success' }
      case 'warning':
        return { label: '要確認', class: 'badge-warning' }
      case 'pending':
        return { label: '未確認', class: 'badge-pending' }
      default:
        return { label: status, class: '' }
    }
  }

  return (
    <AdminLayout title="メニュー一覧">
      <div className="menu-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <p className="header-description">メニュー情報を管理・編集します</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary">
              🔄 AI解析で更新
            </button>
            <button className="btn-primary">
              + メニュー追加
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            すべて ({menuItems.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'verified' ? 'active' : ''}`}
            onClick={() => setFilter('verified')}
          >
            ✅ 確認済み ({menuItems.filter(i => i.status === 'verified').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'warning' ? 'active' : ''}`}
            onClick={() => setFilter('warning')}
          >
            ⚠️ 要確認 ({menuItems.filter(i => i.status === 'warning').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            ⏳ 未確認 ({menuItems.filter(i => i.status === 'pending').length})
          </button>
        </div>

        {/* Menu List */}
        <div className="menu-list">
          {filteredItems.map(item => {
            const badge = getStatusBadge(item.status)
            return (
              <div key={item.id} className="menu-card">
                <div className="menu-main">
                  <div className="menu-info">
                    <h3 className="menu-name">{item.name}</h3>
                    <p className="menu-description">{item.description}</p>
                    <div className="menu-meta">
                      <span className="menu-category">{item.category}</span>
                      <span className="menu-price">¥{item.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="menu-status">
                    <span className={`badge ${badge.class}`}>{badge.label}</span>
                    <div className="confidence">
                      <div className="confidence-bar">
                        <div 
                          className="confidence-fill" 
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                      <span className="confidence-value">{item.confidence}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="menu-actions">
                  <button className="btn-icon" title="編集">✏️</button>
                  <button className="btn-icon" title="確認">✅</button>
                  <button className="btn-icon" title="削除">🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .menu-page {
          max-width: 1000px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-description {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .btn-secondary {
          background: white;
          color: #374151;
          border: 1px solid #e5e7eb;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        .filters {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          color: #374151;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          background: #f9fafb;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
          border-color: transparent;
        }

        .menu-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .menu-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .menu-main {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .menu-info {
          flex: 1;
        }

        .menu-name {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 8px 0;
        }

        .menu-description {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 8px 0;
          line-height: 1.5;
        }

        .menu-meta {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .menu-category {
          font-size: 12px;
          color: #64748b;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .menu-price {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }

        .menu-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          min-width: 120px;
        }

        .badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .badge-success {
          background: #dcfce7;
          color: #166534;
        }

        .badge-warning {
          background: #fef3c7;
          color: #92400e;
        }

        .badge-pending {
          background: #f1f5f9;
          color: #64748b;
        }

        .confidence {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .confidence-bar {
          width: 60px;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .confidence-value {
          font-size: 12px;
          color: #64748b;
          min-width: 35px;
        }

        .menu-actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 16px;
        }

        .btn-icon:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .header-actions {
            width: 100%;
          }

          .menu-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .menu-main {
            flex-direction: column;
            width: 100%;
          }

          .menu-status {
            flex-direction: row;
            align-items: center;
            width: 100%;
            justify-content: space-between;
          }

          .menu-actions {
            width: 100%;
            justify-content: flex-end;
            padding-top: 12px;
            border-top: 1px solid #f1f5f9;
          }
        }
      `}</style>
    </AdminLayout>
  )
}
