'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../../components/admin/AdminLayout'

export default function AccountPage() {
  const router = useRouter()
  const [email, setEmail] = useState('demo@example.com')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    const savedEmail = localStorage.getItem('admin_user_email')
    if (savedEmail) setEmail(savedEmail)
  }, [])

  const handleUpdateEmail = () => {
    localStorage.setItem('admin_user_email', email)
    alert('メールアドレスを更新しました')
  }

  const handleUpdatePassword = () => {
    if (!currentPassword || !newPassword) {
      alert('パスワードを入力してください')
      return
    }
    alert('パスワードを変更しました')
    setCurrentPassword('')
    setNewPassword('')
  }

  return (
    <AdminLayout title="アカウント情報">
      <div className="card">
        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 600, color: '#333' }}>アカウント情報</h2>

        {/* メールアドレス */}
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>メールアドレス</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1, maxWidth: '400px', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px' }}
              placeholder="example@email.com"
            />
            <button className="btn btn-primary btn-small" onClick={handleUpdateEmail}>
              保存
            </button>
          </div>
        </div>

        {/* パスワード変更 */}
        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '12px' }}>パスワード変更</label>
          <div style={{ display: 'grid', gap: '10px', maxWidth: '400px' }}>
            <input
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px' }}
              placeholder="現在のパスワード"
            />
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px' }}
              placeholder="新しいパスワード"
            />
            <button className="btn btn-primary btn-small" onClick={handleUpdatePassword} style={{ justifySelf: 'start' }}>
              パスワードを変更
            </button>
          </div>
        </div>

        {/* プラン情報 */}
        <div style={{ paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#333', margin: 0 }}>プラン情報</label>
            <button className="btn btn-secondary btn-small" onClick={() => router.push('/admin/plan')} style={{ fontSize: '12px', padding: '6px 12px' }}>
              プランの詳細変更
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>プラン名</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>ビジネスプラン</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>月額費用</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>¥3,980</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>契約開始日</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>2024-10-01</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>次回更新日</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>2024-11-01</div>
            </div>
          </div>
        </div>

        {/* QRコード管理への案内 */}
        <div style={{ marginTop: '32px', borderTop: '1px solid #f0f0f0', paddingTop: '24px' }}>
          <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)', borderRadius: '12px', padding: '24px', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#1e3a8a' }}>QRコード管理</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                  QRコードの生成・ダウンロードは基本情報ページから行えます。店頭掲示用のPDFも準備できます。
                </p>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => router.push('/admin/basic-info')} style={{ whiteSpace: 'nowrap' }}>
                基本情報を開く
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .btn {
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid #e0e0e0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #f8fafc;
        }

        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }
      `}</style>
    </AdminLayout>
  )
}
