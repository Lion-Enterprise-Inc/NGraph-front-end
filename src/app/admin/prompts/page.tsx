'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { TokenService, RestaurantApi, MenuApi, Restaurant, Menu } from '../../../services/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api'

const tones = [
  { value: 'standard', label: 'スタンダード（標準）' },
  { value: 'formal', label: 'フォーマル（丁寧）' },
  { value: 'casual', label: 'カジュアル（親しみやすい）' },
  { value: 'professional', label: 'プロフェッショナル（専門的）' },
]

const DEFAULT_RECOMMEND_TEXTS = [
  '{name}の看板料理は何ですか？',
  '{name}に行くのに最適な時間は？',
  '食事制限に対応していますか？',
]

const BASE_PROMPT_DISPLAY = `【基本ルール（編集不可）】
1. レストランの情報・メニュー・おすすめについてお客様をサポート
2. ツールを使って正確な情報を提供（メニュー一覧、詳細、アレルギー検索）
3. メニューや材料を勝手に作り上げない
4. お客様の言語を検出し、同じ言語で応答（日本語・英語・中国語・韓国語等）
5. そのレストランの話題のみに応答を限定`

type MenuConfig = { auto: boolean; menu_uids: string[] }

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

  // New AI settings state
  const [menus, setMenus] = useState<Menu[]>([])
  const [recommendedMenus, setRecommendedMenus] = useState<MenuConfig>({ auto: true, menu_uids: [] })
  const [popularMenus, setPopularMenus] = useState<MenuConfig>({ auto: true, menu_uids: [] })
  const [recommendTexts, setRecommendTexts] = useState<string[]>([])
  const [googleReviewEnabled, setGoogleReviewEnabled] = useState(false)

  const loadRestaurantData = (r: Restaurant) => {
    setSelectedRestaurant(r)
    setSelectedUid(r.uid)
    setCustomPrompt(r.custom_prompt || '')
    setAiTone(r.ai_tone || 'standard')
    setRecommendedMenus(r.recommended_menus || { auto: true, menu_uids: [] })
    setPopularMenus(r.popular_menus || { auto: true, menu_uids: [] })
    setRecommendTexts(r.recommend_texts || [])
    setGoogleReviewEnabled(r.google_review_enabled || false)

    // Load menus for this restaurant
    MenuApi.getAll(r.uid, 1, 500).then(res => {
      if (res.result?.items) {
        setMenus(res.result.items)
      }
    }).catch(console.error)
  }

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
      const token = TokenService.getAccessToken()
      fetch(`${API_BASE_URL}/restaurants/detail-by-user/${user.uid}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      })
        .then(r => r.json())
        .then(data => {
          if (data.result) {
            loadRestaurantData(data.result)
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
      setMenus([])
      setRecommendedMenus({ auto: true, menu_uids: [] })
      setPopularMenus({ auto: true, menu_uids: [] })
      setRecommendTexts([])
      setGoogleReviewEnabled(false)
      return
    }

    setLoading(true)
    try {
      const res = await RestaurantApi.getById(uid)
      if (res.result) {
        loadRestaurantData(res.result)
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
      formData.append('recommended_menus', JSON.stringify(recommendedMenus))
      formData.append('popular_menus', JSON.stringify(popularMenus))
      formData.append('recommend_texts', JSON.stringify(recommendTexts))
      formData.append('google_review_enabled', String(googleReviewEnabled))

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

  const toggleMenuUid = (config: MenuConfig, setConfig: (c: MenuConfig) => void, uid: string) => {
    const uids = config.menu_uids.includes(uid)
      ? config.menu_uids.filter(u => u !== uid)
      : [...config.menu_uids, uid]
    setConfig({ ...config, menu_uids: uids })
  }

  const hasGmb = Boolean(selectedRestaurant?.google_business_profile)

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

      {loading && <div style={{ padding: '20px', color: '#94A3B8' }}>読み込み中...</div>}

      {selectedRestaurant && !loading && (
        <>
          {/* 基礎プロンプト（読み取り専用） */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-title">基礎プロンプト（編集不可）</div>
            <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '12px' }}>
              ツール使用・多言語対応などの必須ルール。全レストラン共通で適用されます。
            </p>
            <textarea
              className="form-control"
              rows={8}
              value={BASE_PROMPT_DISPLAY}
              readOnly
              style={{ fontFamily: 'monospace', fontSize: '13px', background: '#1E293B', color: '#94A3B8' }}
            />
          </div>

          {/* カスタムプロンプト + トーン */}
          <div className="card" style={{ marginBottom: '16px' }}>
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
              <div style={{ marginTop: '6px', fontSize: '13px', color: '#94A3B8' }}>
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
              <div style={{ marginTop: '6px', fontSize: '13px', color: '#94A3B8' }}>
                文字数: {customPrompt.length}　|　AIへの追加指示を自由に記述できます
              </div>
            </div>
          </div>

          {/* おすすめメニュー */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-title">おすすめメニュー</div>
            <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '12px' }}>
              AIが「おすすめは？」と聞かれたときに案内するメニューを設定します。
            </p>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={recommendedMenus.auto}
                  onChange={(e) => setRecommendedMenus({ ...recommendedMenus, auto: e.target.checked })}
                />
                <span style={{ fontSize: '14px' }}>自動（AIがツールで判断）</span>
              </label>
            </div>
            {!recommendedMenus.auto && (
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '6px', padding: '12px' }}>
                {menus.length === 0 ? (
                  <div style={{ color: '#64748B', fontSize: '13px' }}>メニューが登録されていません</div>
                ) : (
                  menus.map((m) => (
                    <label key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid #1E293B' }}>
                      <input
                        type="checkbox"
                        checked={recommendedMenus.menu_uids.includes(m.uid)}
                        onChange={() => toggleMenuUid(recommendedMenus, setRecommendedMenus, m.uid)}
                      />
                      <span style={{ fontSize: '14px' }}>{m.name_jp}</span>
                      <span style={{ fontSize: '12px', color: '#64748B', marginLeft: 'auto' }}>{m.category} / ¥{m.price?.toLocaleString()}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 人気メニュー */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-title">人気メニュー</div>
            <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '12px' }}>
              AIが「人気メニューは？」と聞かれたときに案内するメニューを設定します。
            </p>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={popularMenus.auto}
                  onChange={(e) => setPopularMenus({ ...popularMenus, auto: e.target.checked })}
                />
                <span style={{ fontSize: '14px' }}>自動（AIがツールで判断）</span>
              </label>
            </div>
            {!popularMenus.auto && (
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '6px', padding: '12px' }}>
                {menus.length === 0 ? (
                  <div style={{ color: '#64748B', fontSize: '13px' }}>メニューが登録されていません</div>
                ) : (
                  menus.map((m) => (
                    <label key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid #1E293B' }}>
                      <input
                        type="checkbox"
                        checked={popularMenus.menu_uids.includes(m.uid)}
                        onChange={() => toggleMenuUid(popularMenus, setPopularMenus, m.uid)}
                      />
                      <span style={{ fontSize: '14px' }}>{m.name_jp}</span>
                      <span style={{ fontSize: '12px', color: '#64748B', marginLeft: 'auto' }}>{m.category} / ¥{m.price?.toLocaleString()}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* レコメンドテキスト */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-title">レコメンドテキスト</div>
            <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '12px' }}>
              チャット画面のサジェストボタンに表示されるテキストを設定します（最大3つ）。
            </p>
            {recommendTexts.length === 0 ? (
              <>
                <div style={{ padding: '12px', background: '#1E293B', borderRadius: '6px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>現在のデフォルト（自動表示中）:</div>
                  {DEFAULT_RECOMMEND_TEXTS.map((t, i) => (
                    <div key={i} style={{ fontSize: '14px', color: '#94A3B8', padding: '4px 0' }}>
                      {i + 1}. {t.replace('{name}', selectedRestaurant?.name || '')}
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => setRecommendTexts(
                    DEFAULT_RECOMMEND_TEXTS.map(t => t.replace('{name}', selectedRestaurant?.name || ''))
                  )}
                >
                  カスタマイズ
                </button>
              </>
            ) : (
              <>
                {recommendTexts.map((text, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      className="form-control"
                      value={text}
                      onChange={(e) => {
                        const updated = [...recommendTexts]
                        updated[i] = e.target.value
                        setRecommendTexts(updated)
                      }}
                      placeholder={`テキスト ${i + 1}`}
                    />
                    <button
                      className="btn btn-danger"
                      onClick={() => setRecommendTexts(recommendTexts.filter((_, idx) => idx !== i))}
                      style={{ flexShrink: 0 }}
                    >
                      削除
                    </button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {recommendTexts.length < 3 && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setRecommendTexts([...recommendTexts, ''])}
                    >
                      + 追加
                    </button>
                  )}
                  <button
                    className="btn btn-secondary"
                    onClick={() => setRecommendTexts([])}
                  >
                    デフォルトに戻す
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Googleレビュー誘導 */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-title">Googleレビュー誘導</div>
            <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '12px' }}>
              会話の終盤でGoogleクチコミへの投稿を促します。
            </p>
            {hasGmb ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={googleReviewEnabled}
                  onChange={(e) => setGoogleReviewEnabled(e.target.checked)}
                />
                <span style={{ fontSize: '14px' }}>有効にする</span>
              </label>
            ) : (
              <div style={{ padding: '12px', background: '#1E293B', borderRadius: '6px', color: '#64748B', fontSize: '13px' }}>
                Googleビジネスプロフィールが基本情報に未設定です。先に基本情報ページでGMB URLを設定してください。
              </div>
            )}
          </div>

          {/* メッセージ */}
          {message && (
            <div style={{
              padding: '10px 14px',
              marginBottom: '16px',
              borderRadius: '6px',
              background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: message.type === 'success' ? '#10B981' : '#EF4444',
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
          color: var(--text);
          font-weight: 600;
        }

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
          margin-bottom: 12px;
        }

        .form-control {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border-strong);
          background: var(--bg-input);
          color: var(--text);
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
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
          background: var(--primary);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563EB;
        }

        .btn-secondary {
          background: var(--bg-hover);
          color: var(--text-body);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--border-strong);
        }

        .btn-danger {
          background: rgba(239,68,68,0.1);
          color: #EF4444;
          padding: 8px 16px;
        }

        .btn-danger:hover:not(:disabled) {
          background: rgba(239,68,68,0.15);
        }
      `}</style>
    </AdminLayout>
  )
}
