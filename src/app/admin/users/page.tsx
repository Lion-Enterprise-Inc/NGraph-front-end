'use client'

import { useState } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'

type User = {
  id: number
  email: string
  name: string
  role: 'restaurant_owner' | 'staff'
  restaurantId: string
  restaurantName: string
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  lastLogin: string
}

const initialUsers: User[] = [
  {
    id: 1,
    email: 'owner1@example.com',
    name: '田中 太郎',
    role: 'restaurant_owner',
    restaurantId: 'ST-00001',
    restaurantName: 'ぼんた本店',
    status: 'active',
    createdAt: '2024-01-15',
    lastLogin: '2024-01-20 14:30'
  },
  {
    id: 2,
    email: 'owner2@example.com',
    name: '佐藤 花子',
    role: 'restaurant_owner',
    restaurantId: 'ST-00002',
    restaurantName: 'カフェ・ド・金沢',
    status: 'active',
    createdAt: '2024-01-10',
    lastLogin: '2024-01-19 10:15'
  },
  {
    id: 3,
    email: 'owner3@example.com',
    name: '鈴木 一郎',
    role: 'restaurant_owner',
    restaurantId: 'ST-00003',
    restaurantName: '居酒屋 福井',
    status: 'pending',
    createdAt: '2024-01-18',
    lastLogin: '-'
  },
  {
    id: 4,
    email: 'staff1@example.com',
    name: '山田 次郎',
    role: 'staff',
    restaurantId: 'ST-00001',
    restaurantName: 'ぼんた本店',
    status: 'active',
    createdAt: '2024-01-12',
    lastLogin: '2024-01-20 09:00'
  },
  {
    id: 5,
    email: 'owner4@example.com',
    name: '高橋 美咲',
    role: 'restaurant_owner',
    restaurantId: 'ST-00004',
    restaurantName: 'ラーメン名古屋',
    status: 'inactive',
    createdAt: '2023-12-01',
    lastLogin: '2024-01-05 16:45'
  }
]

const restaurants = [
  { id: 'ST-00001', name: 'ぼんた本店' },
  { id: 'ST-00002', name: 'カフェ・ド・金沢' },
  { id: 'ST-00003', name: '居酒屋 福井' },
  { id: 'ST-00004', name: 'ラーメン名古屋' },
  { id: 'ST-00005', name: '寿司処 北陸' },
]

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'restaurant_owner' | 'staff'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'restaurant_owner' as 'restaurant_owner' | 'staff',
    restaurantId: '',
    password: ''
  })

  const filteredUsers = users.filter(user => {
    const matchesRole = filter === 'all' || user.role === filter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.restaurantName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesStatus && matchesSearch
  })

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.name || !newUser.restaurantId) {
      alert('メールアドレス、名前、レストランは必須です')
      return
    }

    const restaurant = restaurants.find(r => r.id === newUser.restaurantId)
    const newId = users.length + 1
    const newUserData: User = {
      id: newId,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      restaurantId: newUser.restaurantId,
      restaurantName: restaurant?.name || '',
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: '-'
    }

    setUsers([...users, newUserData])
    setShowModal(false)
    setNewUser({ email: '', name: '', role: 'restaurant_owner', restaurantId: '', password: '' })
    alert(`✅ ${newUser.role === 'restaurant_owner' ? 'レストランオーナー' : 'スタッフ'}を登録しました！\n\nログイン情報がメールで送信されます。`)
  }

  const handleStatusChange = (userId: number, newStatus: 'active' | 'inactive') => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ))
    alert(`ステータスを${newStatus === 'active' ? '有効' : '無効'}に変更しました`)
  }

  const handleDeleteUser = (userId: number) => {
    if (confirm('このユーザーを削除しますか？')) {
      setUsers(users.filter(user => user.id !== userId))
      alert('ユーザーを削除しました')
    }
  }

  const handleResetPassword = (userId: number) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      alert(`${user.email} にパスワードリセットメールを送信しました`)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>✅ 有効</span>
      case 'inactive':
        return <span style={{ background: '#FFEBEE', color: '#C62828', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>⛔ 無効</span>
      case 'pending':
        return <span style={{ background: '#FFF3E0', color: '#E65100', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>⏳ 招待中</span>
      default:
        return null
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'restaurant_owner':
        return <span style={{ background: '#E3F2FD', color: '#1565C0', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>🍽️ オーナー</span>
      case 'staff':
        return <span style={{ background: '#F3E5F5', color: '#7B1FA2', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>👤 スタッフ</span>
      default:
        return null
    }
  }

  const ownerCount = users.filter(u => u.role === 'restaurant_owner').length
  const staffCount = users.filter(u => u.role === 'staff').length
  const activeCount = users.filter(u => u.status === 'active').length
  const pendingCount = users.filter(u => u.status === 'pending').length

  return (
    <AdminLayout title="ユーザー管理">
      <div className="card" style={{ width: '100%', maxWidth: 'none' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 className="card-title" style={{ margin: 0 }}>👥 レストランオーナー・ユーザー管理</h2>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>レストランオーナーやスタッフのアカウントを管理します</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ 新規ユーザーを追加
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#667eea' }}>{users.length}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>総ユーザー数</div>
          </div>
          <div style={{ background: '#E3F2FD', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1565C0' }}>{ownerCount}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>オーナー</div>
          </div>
          <div style={{ background: '#E8F5E9', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#2E7D32' }}>{activeCount}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>有効</div>
          </div>
          <div style={{ background: '#FFF3E0', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#E65100' }}>{pendingCount}</div>
            <div style={{ fontSize: '13px', color: '#666' }}>招待中</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 名前、メール、レストラン名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: '250px' }}
          />
          <select
            className="form-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            style={{ width: '150px' }}
          >
            <option value="all">全ての役割</option>
            <option value="restaurant_owner">オーナーのみ</option>
            <option value="staff">スタッフのみ</option>
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
            <option value="pending">招待中</option>
          </select>
        </div>

        {/* User List */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontSize: '13px', fontWeight: 600 }}>ユーザー情報</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontSize: '13px', fontWeight: 600 }}>役割</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontSize: '13px', fontWeight: 600 }}>レストラン</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', fontSize: '13px', fontWeight: 600 }}>ステータス</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e0e0e0', fontSize: '13px', fontWeight: 600 }}>最終ログイン</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e0e0e0', fontSize: '13px', fontWeight: 600 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{user.name}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{user.email}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {getRoleBadge(user.role)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 500 }}>{user.restaurantName}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{user.restaurantId}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {getStatusBadge(user.status)}
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

      {/* Add User Modal */}
      {showModal && (
        <div className="modal active" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>➕ 新規ユーザーを追加</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div style={{ padding: '20px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">役割 *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setNewUser({...newUser, role: 'restaurant_owner'})}
                    style={{
                      padding: '12px',
                      border: newUser.role === 'restaurant_owner' ? '2px solid #667eea' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      background: newUser.role === 'restaurant_owner' ? '#f0f4ff' : 'white',
                      cursor: 'pointer',
                      fontWeight: newUser.role === 'restaurant_owner' ? 600 : 400
                    }}
                  >
                    🍽️ レストランオーナー
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUser({...newUser, role: 'staff'})}
                    style={{
                      padding: '12px',
                      border: newUser.role === 'staff' ? '2px solid #667eea' : '1px solid #e0e0e0',
                      borderRadius: '8px',
                      background: newUser.role === 'staff' ? '#f0f4ff' : 'white',
                      cursor: 'pointer',
                      fontWeight: newUser.role === 'staff' ? 600 : 400
                    }}
                  >
                    👤 スタッフ
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">名前 *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例: 田中 太郎"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">メールアドレス *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="例: owner@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">担当レストラン *</label>
                <select
                  className="form-input"
                  value={newUser.restaurantId}
                  onChange={(e) => setNewUser({...newUser, restaurantId: e.target.value})}
                >
                  <option value="">レストランを選択...</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">初期パスワード</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="空欄の場合は自動生成"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  ※ 空欄の場合、自動生成されたパスワードがメールで送信されます
                </div>
              </div>

              <div style={{ background: '#E3F2FD', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', color: '#1565C0' }}>
                  💡 登録後、ユーザーにログイン情報がメールで送信されます。
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" onClick={handleCreateUser} style={{ flex: 1 }}>
                  ✅ ユーザーを登録
                </button>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  キャンセル
                </button>
              </div>
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

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }

        .close-btn:hover {
          color: #333;
        }

        table tr:hover {
          background: #f8f9fa;
        }
      `}</style>
    </AdminLayout>
  )
}
