'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { TokenService, RestaurantApi, Restaurant } from '../../../services/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api'

const tones = [
  { value: 'standard', label: 'スタンダード（標準）' },
  { value: 'formal', label: 'フォーマル（丁寧）' },
  { value: 'casual', label: 'カジュアル（親しみやすい）' },
  { value: 'professional', label: 'プロフェッショナル（専門的）' },
]

const BASE_PROMPT_DISPLAY = `【基本ルール（編集不可）】
1. レストランの情報・メニュー・おすすめについてお客様をサポート
2. ツールを使って正確な情報を提供（メニュー一覧、詳細、アレルギー検索）
3. メニューや材料を勝手に作り上げない
4. お客様の言語を検出し、同じ言語で応答（日本語・英語・中国語・韓国語等）
5. そのレストランの話題のみに応答を限定`

export default function PromptsPage() {
  const [userType, setUserType] = useState<'admin' | 'store'>('store')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedUid, setSelectedUid] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [aiTone, setAiTone] = useState('standard')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const user = TokenService.getUser()
    if (!user) return
    const isAdmin = user.role === 'platform_owner' || user.role === 'superadmin'
    setUserType(isAdmin ? 'admin' : 'store')

    if (isAdmin) {
      RestaurantApi.getAll(1, 100).then(res => {
        if (res.result?.items) {
          setRestaurants(res.result.items)
        }
      }).catch(console.error)
    } else if (user.uid) {
      // Store owner: load own restaurant
      const token = TokenService.getAccessToken()
      fetch(`${API_BASE_URL}/restaurants/detail-by-user/${user.uid}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      })
        .then(r => r.json())
        .then(data => {
          if (data.result) {
            const r = data.result
            setSelectedRestaurant(r)
            setSelectedUid(r.uid)
            setCustomPrompt(r.custom_prompt || '')
            setAiTone(r.ai_tone || 'standard')
          }
        })
        .catch(console.error)
    }
  }, [])

  const handleSelectRestaurant = async (uid: string) => {
    setSelectedUid(uid)
    setMessage(null)
    if (!uid) {
      setSelectedRestaurant(null)
      setCustomPrompt('')
      setAiTone('standard')
      return
    }

    setLoading(true)
    try {
      const res = await RestaurantApi.getById(uid)
      if (res.result) {
        setSelectedRestaurant(res.result)
        setCustomPrompt(res.result.custom_prompt || '')
        setAiTone(res.result.ai_tone || 'standard')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedUid) return
    setSaving(true)
    setMessage(null)

    try {
      const token = TokenService.getAccessToken()
      const formData = new FormData()
      formData.append('custom_prompt', customPrompt)
      formData.append('ai_tone', aiTone)

      const res = await fetch(`${API_BASE_URL}/restaurants/${selectedUid}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      if (!res.ok) throw new Error('保存に失敗しました')

      setMessage({ type: 'success', text: '保存しました' })
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || '保存に失敗しました' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout title="AI設定">
      <div className="breadcrumb-nav">
        <span className="breadcrumb-item active">AI設定</span>
      </div>

      {/* レストラン選択（Admin のみ） */}
      {userType === 'admin' && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>レストランを選択</label>
          <select
            className="form-control"
            style={{ maxWidth: '400px' }}
            value={selectedUid}
            onChange={(e) => handleSelectRestaurant(e.target.value)}
          >
            <option value="">選択してください</option>
            {restaurants.map((r) => (
              <option key={r.uid} value={r.uid}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading && <div style={{ padding: '20px', color: '#666' }}>読み込み中...</div>}

      {selectedRestaurant && !loading && (
        <>
          {/* 基礎プロンプト（読み取り専用） */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-title">基礎プロンプト（編集不可）</div>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
              ツール使用・多言語対応などの必須ルール。全レストラン共通で適用されます。
            </p>
            <textarea
              className="form-control"
              rows={8}
              value={BASE_PROMPT_DISPLAY}
              readOnly
              style={{ fontFamily: 'monospace', fontSize: '13px', background: '#f9fafb', color: '#666' }}
            />
          </div>

          {/* カスタムプロンプト + トーン */}
          <div className="card">
            <div className="card-title">カスタム設定 — {selectedRestaurant.name}</div>

            {/* トーン選択 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>AIトーン</label>
              <select
                className="form-control"
                style={{ maxWidth: '300px' }}
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
              >
                {tones.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <div style={{ marginTop: '6px', fontSize: '13px', color: '#666' }}>
                AIの応答スタイルを選択します。「スタンダード」はデフォルトのトーンです。
              </div>
            </div>

            {/* カスタムプロンプト */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>カスタムプロンプト</label>
              <textarea
                className="form-control"
                rows={8}
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="例：季節のおすすめメニューを積極的に案内してください。地元食材の魅力も伝えてください。"
              />
              <div style={{ marginTop: '6px', fontSize: '13px', color: '#666' }}>
                文字数: {customPrompt.length}　|　AIへの追加指示を自由に記述できます
              </div>
            </div>

            {/* メッセージ */}
            {message && (
              <div style={{
                padding: '10px 14px',
                marginBottom: '16px',
                borderRadius: '6px',
                background: message.type === 'success' ? '#dcfce7' : '#fef2f2',
                color: message.type === 'success' ? '#166534' : '#991b1b',
                fontSize: '14px',
              }}>
                {message.text}
              </div>
            )}

            {/* 保存 */}
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .breadcrumb-item.active {
          color: #333;
          font-weight: 600;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .card-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }

        .form-control {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }

        textarea.form-control {
          resize: vertical;
          line-height: 1.6;
        }

        .btn {
          border: none;
          border-radius: 6px;
          padding: 10px 24px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
        }
      `}</style>
    </AdminLayout>
  )
}
