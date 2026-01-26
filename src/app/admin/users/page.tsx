'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { apiClient, TokenService } from '../../../services/api'

type ApiUser = {
  uid: string
  email: string
  role: 'superadmin' | 'consumer' | 'platform_owner' | 'restaurant_owner'
  is_active: boolean
  created_at: string
  updated_at: string
}

type User = {
  id: string
  email: string
  role: ApiUser['role']
  status: 'active' | 'inactive'
  createdAt: string
  lastLogin: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'restaurant_owner' | 'platform_owner' | 'consumer' | 'superadmin'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const token = TokenService.getAccessToken()
        if (!token) {
          setError('認証が必要です')
          return
        }

        const response = await apiClient.get<ApiUser[]>('/auth/userlist?role=all')
        
        // Convert API response to component format
        const formattedUsers: User[] = response.map((apiUser: ApiUser) => ({
          id: apiUser.uid,
          email: apiUser.email,
          role: apiUser.role,
          status: apiUser.is_active ? 'active' : 'inactive',
          createdAt: new Date(apiUser.created_at).toLocaleDateString('ja-JP'),
          lastLogin: apiUser.updated_at ? new Date(apiUser.updated_at).toLocaleString('ja-JP') : '-'
        }))
        
        setUsers(formattedUsers)
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('ユーザーの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesRole = filter === 'all' || user.role === filter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesStatus && matchesSearch
  })

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive') => {
    // Note: This would need a backend API endpoint to update user status
    // For now, just show a message
    alert(`${newStatus === 'active' ? '有効化' : '無効化'}機能は現在開発中です`)
  }

  const handleResetPassword = (userId: string) => {
    // Note: This would need a backend API endpoint to reset password
    const user = users.find(u => u.id === userId)
    if (user) {
      alert(`${user.email} へのパスワードリセット機能は現在開発中です`)
    }
  }

  const handleDeleteUser = (userId: string) => {
    // Note: This would need a backend API endpoint to delete user
    alert('ユーザー削除機能は現在開発中です')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>✅ 有効</span>
      case 'inactive':
        return <span style={{ background: '#FFEBEE', color: '#C62828', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>⛔ 無効</span>
      default:
        return null
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'platform_owner':
        return <span style={{ background: '#E3F2FD', color: '#1565C0', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>👑 プラットフォームオーナー</span>
      case 'restaurant_owner':
        return <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>🍽️ レストランオーナー</span>
      case 'superadmin':
        return <span style={{ background: '#FFF3E0', color: '#E65100', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>👑 スーパー管理者</span>
      case 'consumer':
        return <span style={{ background: '#F3E5F5', color: '#7B1FA2', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>👤 コンシューマー</span>
      default:
        return <span style={{ background: '#F5F5F5', color: '#666', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>❓ 不明</span>
    }
  }

  const platformOwnerCount = users.filter(u => u.role === 'platform_owner').length
  const restaurantOwnerCount = users.filter(u => u.role === 'restaurant_owner').length
  const consumerCount = users.filter(u => u.role === 'consumer').length
  const superadminCount = users.filter(u => u.role === 'superadmin').length
  const activeCount = users.filter(u => u.status === 'active').length
  const inactiveCount = users.filter(u => u.status === 'inactive').length

  if (loading) {
    return (
      <AdminLayout title="ユーザー管理">
        <div className="card" style={{ width: '100%', maxWidth: 'none', textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '18px', marginBottom: '16px' }}>🔄 読み込み中...</div>
          <div style={{ color: '#64748b' }}>ユーザー情報を取得しています</div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="ユーザー管理">
        <div className="card" style={{ width: '100%', maxWidth: 'none', textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '18px', marginBottom: '16px', color: '#dc2626' }}>❌ エラー</div>
          <div style={{ color: '#64748b', marginBottom: '20px' }}>{error}</div>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            再読み込み
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="ユーザー管理">
      <div className="card" style={{ width: '100%', maxWidth: 'none' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 className="card-title" style={{ margin: 0 }}>👥 ユーザー管理</h2>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>プラットフォームの全ユーザーを管理します</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#667eea' }}>{users.length}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>総ユーザー数</div>
          </div>
          <div style={{ background: '#E3F2FD', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1565C0' }}>{platformOwnerCount}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>プラットフォームオーナー</div>
          </div>
          <div style={{ background: '#E8F5E9', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#2E7D32' }}>{restaurantOwnerCount}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>レストランオーナー</div>
          </div>
          <div style={{ background: '#F3E5F5', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#7B1FA2' }}>{consumerCount}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>コンシューマー</div>
          </div>
          <div style={{ background: '#FFF3E0', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#E65100' }}>{superadminCount}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>スーパー管理者</div>
          </div>
          <div style={{ background: '#E8F5E9', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#2E7D32' }}>{activeCount}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>有効</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 メールアドレスで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: '250px' }}
          />
          <select
            className="form-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            style={{ width: '180px' }}
          >
            <option value="all">全ての役割</option>
            <option value="platform_owner">プラットフォームオーナー</option>
            <option value="restaurant_owner">レストランオーナー</option>
            <option value="consumer">コンシューマー</option>
            <option value="superadmin">スーパー管理者</option>
          </select>
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            style={{ width: '150px' }}
          >
            <option value="all">全てのステータス</option>
            <option value="active">有効</option>
            <option value="inactive">無効</option>
          </select>
        </div>

        {/* User List */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontSize: '13px', fontWeight: 600 }}>ユーザー情報</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontSize: '13px', fontWeight: 600 }}>役割</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', fontSize: '13px', fontWeight: 600 }}>ステータス</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontSize: '13px', fontWeight: 600 }}>作成日</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontSize: '13px', fontWeight: 600 }}>最終更新</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', fontSize: '13px', fontWeight: 600 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{user.email}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>ID: {user.id}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {getRoleBadge(user.role)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {getStatusBadge(user.status)}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                    {user.createdAt}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                    {user.lastLogin}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {user.status === 'active' ? (
                        <button 
                          className="btn btn-secondary btn-small"
                          onClick={() => handleStatusChange(user.id, 'inactive')}
                          title="無効化"
                        >
                          ⛔
                        </button>
                      ) : (
                        <button 
                          className="btn btn-primary btn-small"
                          onClick={() => handleStatusChange(user.id, 'active')}
                          title="有効化"
                        >
                          ✅
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={() => handleResetPassword(user.id)}
                        title="パスワードリセット"
                      >
                        🔑
                      </button>
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={() => handleDeleteUser(user.id)}
                        title="削除"
                        style={{ color: '#C62828' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            該当するユーザーが見つかりません
          </div>
        )}
      </div>

      <style jsx>{`
        .card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          margin-bottom: 6px;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .btn {
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .btn-secondary {
          background: #f8f9fa;
          color: #333;
          border: 1px solid #e0e0e0;
        }

        .btn-secondary:hover {
          background: #e9ecef;
        }

        .btn-small {
          padding: 6px 10px;
          font-size: 12px;
        }

        table tr:hover {
          background: #f8f9fa;
        }
      `}</style>
    </AdminLayout>
  )
}
