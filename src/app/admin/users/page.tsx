'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { useToast } from '../../../components/admin/Toast'
import { apiClient, TokenService } from '../../../services/api'
import { useAdminLang } from '../../../hooks/useAdminLang'

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
  const { lang, t } = useAdminLang()
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
  const toast = useToast()

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = TokenService.getAccessToken()
      if (!token) {
        setError(t.users.authRequired)
        return
      }

      const response = await apiClient.get<ApiUser[]>('/auth/userlist?role=all')
      
      // Convert API response to component format
      const formattedUsers: User[] = response.map((apiUser: ApiUser) => ({
        id: apiUser.uid,
        email: apiUser.email,
        role: apiUser.role,
        status: apiUser.is_active ? 'active' : 'inactive',
        createdAt: new Date(apiUser.created_at).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US'),
        lastLogin: apiUser.updated_at ? new Date(apiUser.updated_at).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US') : '-'
      }))
      
      setUsers(formattedUsers)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(t.users.fetchFailed)
    } finally {
      setLoading(false)
    }
  }

  // Fetch users from API
  useEffect(() => {
    fetchUsers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      errors.email = t.users.validateEmailRequired
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createUser.email)) {
      errors.email = t.users.validateEmailFormat
    }

    if (!createUser.password) {
      errors.password = t.users.validatePasswordRequired
    } else if (createUser.password.length < 8) {
      errors.password = t.users.validatePasswordLength
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
        toast('success', t.users.createSuccess(response.message, response.result.email, response.result.role))
        setShowCreateModal(false)
        resetCreateForm()
        // Refresh user list
        fetchUsers()
      }
    } catch (error) {
      console.error('Failed to create user:', error)
      toast('error', t.users.createFailed(error instanceof Error ? error.message : 'Unknown error'))
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
        return <span style={{ background: 'rgba(16,185,129,0.1)', color: '#2E7D32', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{t.users.statusActive}</span>
      case 'inactive':
        return <span style={{ background: '#FFEBEE', color: '#C62828', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{t.users.statusInactive}</span>
      default:
        return null
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'platform_owner':
        return <span style={{ background: 'rgba(59,130,246,0.1)', color: '#1565C0', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{t.users.rolePlatformOwner}</span>
      case 'restaurant_owner':
        return <span style={{ background: 'rgba(16,185,129,0.1)', color: '#2E7D32', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{t.users.roleRestaurantOwner}</span>
      case 'superadmin':
        return <span style={{ background: 'rgba(245,158,11,0.1)', color: '#E65100', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{t.users.roleSuperadmin}</span>
      case 'consumer':
        return <span style={{ background: 'rgba(139,92,246,0.1)', color: '#7B1FA2', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{t.users.roleConsumer}</span>
      default:
        return <span style={{ background: '#F5F5F5', color: '#94A3B8', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{t.users.roleUnknown}</span>
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
      <AdminLayout title={t.users.title}>
        <div className="card" style={{ width: '100%', maxWidth: 'none', textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '18px', marginBottom: '16px' }}>{t.users.loading}</div>
          <div style={{ color: '#94A3B8' }}>{t.users.loadingDetail}</div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title={t.users.title}>
        <div className="card" style={{ width: '100%', maxWidth: 'none', textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '18px', marginBottom: '16px', color: '#dc2626' }}>{t.users.error}</div>
          <div style={{ color: '#94A3B8', marginBottom: '20px' }}>{error}</div>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            {t.users.reload}
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={t.users.title}>
      <div className="card" style={{ width: '100%', maxWidth: 'none' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 className="card-title" style={{ margin: 0 }}>{t.users.titleHeader}</h2>
            <p style={{ margin: '8px 0 0', color: '#94A3B8', fontSize: '14px' }}>{t.users.subtitle}</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {t.users.create}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: '#1E293B', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#667eea' }}>{users.length}</div>
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>{t.users.statTotal}</div>
          </div>
          <div style={{ background: 'rgba(59,130,246,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1565C0' }}>{platformOwnerCount}</div>
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>{t.users.statPlatformOwner}</div>
          </div>
          <div style={{ background: 'rgba(16,185,129,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#2E7D32' }}>{restaurantOwnerCount}</div>
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>{t.users.statRestaurantOwner}</div>
          </div>
          <div style={{ background: 'rgba(139,92,246,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#7B1FA2' }}>{consumerCount}</div>
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>{t.users.statConsumer}</div>
          </div>
          <div style={{ background: 'rgba(245,158,11,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#E65100' }}>{superadminCount}</div>
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>{t.users.statSuperadmin}</div>
          </div>
          <div style={{ background: 'rgba(16,185,129,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#2E7D32' }}>{activeCount}</div>
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>{t.users.statActive}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder={t.users.searchPlaceholder}
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
            <option value="all">{t.users.filterAllRoles}</option>
            <option value="platform_owner">{t.users.statPlatformOwner}</option>
            <option value="restaurant_owner">{t.users.statRestaurantOwner}</option>
            <option value="consumer">{t.users.statConsumer}</option>
            <option value="superadmin">{t.users.statSuperadmin}</option>
          </select>
          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            style={{ width: '150px' }}
          >
            <option value="all">{t.users.filterAllStatuses}</option>
            <option value="active">{t.users.statActive}</option>
            <option value="inactive">{t.dashboard.statusInactive}</option>
          </select>
        </div>

        {/* User List */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1E293B' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #1E293B', fontSize: '13px', fontWeight: 600 }}>{t.users.colUserInfo}</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #1E293B', fontSize: '13px', fontWeight: 600 }}>{t.users.colRole}</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #1E293B', fontSize: '13px', fontWeight: 600 }}>{t.users.colStatus}</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #1E293B', fontSize: '13px', fontWeight: 600 }}>{t.users.colCreatedAt}</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #1E293B', fontSize: '13px', fontWeight: 600 }}>{t.users.colLastUpdated}</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #1E293B', fontSize: '13px', fontWeight: 600 }}>{t.users.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #1E293B' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{user.email}</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>ID: {user.id}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {getRoleBadge(user.role)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {getStatusBadge(user.status)}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#94A3B8' }}>
                    {user.createdAt}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#94A3B8' }}>
                    {user.lastLogin}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {user.status === 'active' ? (
                        <button
                          className="btn btn-secondary btn-small"
                          disabled
                          title={t.users.actionDisable}
                          style={{ opacity: 0.5 }}
                        >
                          ⛔ {t.users.pending}
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-small"
                          disabled
                          title={t.users.actionEnable}
                          style={{ opacity: 0.5 }}
                        >
                          ✅ {t.users.pending}
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-small"
                        disabled
                        title={t.users.actionResetPassword}
                        style={{ opacity: 0.5 }}
                      >
                        🔑 {t.users.pending}
                      </button>
                      <button
                        className="btn btn-secondary btn-small"
                        disabled
                        title={t.users.actionDelete}
                        style={{ opacity: 0.5, color: '#C62828' }}
                      >
                        🗑️ {t.users.pending}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
            {t.users.emptyFiltered}
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
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content"
            style={{
              background: '#111827',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#F8FAFC' }}>{t.users.createModalTitle}</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94A3B8' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">{t.users.fieldEmail}</label>
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
                <label className="form-label">{t.users.fieldPassword}</label>
                <input
                  type="password"
                  className="form-input"
                  value={createUser.password}
                  onChange={(e) => setCreateUser({...createUser, password: e.target.value})}
                  placeholder={t.users.passwordPlaceholder}
                  disabled={isSubmitting}
                />
                {createErrors.password && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{createErrors.password}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">{t.users.fieldRole}</label>
                <select
                  className="form-input"
                  value={createUser.role}
                  onChange={(e) => setCreateUser({...createUser, role: e.target.value as typeof createUser.role})}
                  disabled={isSubmitting}
                >
                  <option value="consumer">{t.users.roleConsumer}</option>
                  <option value="restaurant_owner">{t.users.roleRestaurantOwner}</option>
                  <option value="platform_owner">{t.users.rolePlatformOwner}</option>
                  <option value="superadmin">{t.users.roleSuperadmin}</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowCreateModal(false)}
                disabled={isSubmitting}
              >
                {t.users.cancel}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateUser}
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? t.users.creating : t.users.create2}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .card {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          border: 1px solid var(--border);
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-body);
          margin-bottom: 6px;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border-strong);
          background: var(--bg-input);
          color: var(--text);
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary);
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
          background: var(--bg-hover);
          color: var(--text);
          border: 1px solid var(--border-strong);
        }

        .btn-secondary:hover {
          background: var(--border-strong);
        }

        .btn-small {
          padding: 6px 10px;
          font-size: 12px;
        }

        table tr:hover {
          background: var(--bg-hover);
        }
      `}</style>
    </AdminLayout>
  )
}
