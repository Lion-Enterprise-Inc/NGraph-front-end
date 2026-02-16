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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createUser, setCreateUser] = useState({
    email: '',
    password: '',
    role: 'consumer' as 'consumer' | 'restaurant_owner' | 'platform_owner' | 'superadmin'
  })
  const [createErrors, setCreateErrors] = useState<{ email?: string; password?: string }>({})

  // Fetch users from API
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

  // Fetch users from API
  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesRole = filter === 'all' || user.role === filter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesStatus && matchesSearch
  })


  // User registration functions
  const validateCreateUser = () => {
    const errors: { email?: string; password?: string } = {}

    if (!createUser.email.trim()) {
      errors.email = 'メールアドレスを入力してください'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createUser.email)) {
      errors.email = '有効なメールアドレスを入力してください'
    }

    if (!createUser.password) {
      errors.password = 'パスワードを入力してください'
    } else if (createUser.password.length < 8) {
      errors.password = 'パスワードは8文字以上で入力してください'
    }

    setCreateErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateUser = async () => {
    if (!validateCreateUser()) return

    setIsSubmitting(true)
    try {
      const response = await apiClient.post('/auth/register', {
        email: createUser.email,
        password: createUser.password,
        role: createUser.role
      }) as { status_code: number; message: string; result: { email: string; role: string; is_validated: boolean } }

      if (response.status_code === 201) {
        alert(`✅ ${response.message}\n\nユーザー: ${response.result.email}\n役割: ${response.result.role}`)
        setShowCreateModal(false)
        resetCreateForm()
        // Refresh user list
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to create user:', error)
      alert(`❌ ユーザー作成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetCreateForm = () => {
    setCreateUser({
      email: '',
      password: '',
      role: 'consumer'
    })
    setCreateErrors({})
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
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            ➕ 新規ユーザー作成
          </button>
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
                          disabled
                          title="無効化（準備中）"
                          style={{ opacity: 0.5 }}
                        >
                          ⛔ (準備中)
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-small"
                          disabled
                          title="有効化（準備中）"
                          style={{ opacity: 0.5 }}
                        >
                          ✅ (準備中)
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-small"
                        disabled
                        title="パスワードリセット（準備中）"
                        style={{ opacity: 0.5 }}
                      >
                        🔑 (準備中)
                      </button>
                      <button
                        className="btn btn-secondary btn-small"
                        disabled
                        title="削除（準備中）"
                        style={{ opacity: 0.5, color: '#C62828' }}
                      >
                        🗑️ (準備中)
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

      {/* User Creation Modal */}
      {showCreateModal && (
        <div 
          className="modal active" 
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false) }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content"
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>➕ 新規ユーザー作成</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">メールアドレス *</label>
                <input
                  type="email"
                  className="form-input"
                  value={createUser.email}
                  onChange={(e) => setCreateUser({...createUser, email: e.target.value})}
                  placeholder="user@example.com"
                  disabled={isSubmitting}
                />
                {createErrors.email && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{createErrors.email}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">パスワード *</label>
                <input
                  type="password"
                  className="form-input"
                  value={createUser.password}
                  onChange={(e) => setCreateUser({...createUser, password: e.target.value})}
                  placeholder="8文字以上のパスワード"
                  disabled={isSubmitting}
                />
                {createErrors.password && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{createErrors.password}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">役割 *</label>
                <select
                  className="form-input"
                  value={createUser.role}
                  onChange={(e) => setCreateUser({...createUser, role: e.target.value as typeof createUser.role})}
                  disabled={isSubmitting}
                >
                  <option value="consumer">👤 コンシューマー</option>
                  <option value="restaurant_owner">🍽️ レストランオーナー</option>
                  <option value="platform_owner">👑 プラットフォームオーナー</option>
                  <option value="superadmin">👑 スーパー管理者</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowCreateModal(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleCreateUser}
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? '⏳ 作成中...' : '✅ 作成する'}
              </button>
            </div>
          </div>
        </div>
      )}

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
