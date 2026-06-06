'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'
import { TokenService, RestaurantApi, MenuApi, Restaurant, Menu } from '../../../services/api'
import { useAdminLang } from '../../../hooks/useAdminLang'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api'

type MenuConfig = { auto: boolean; menu_uids: string[] }

// クリックで自由記述欄に足せる例文（店主が「何を書けばいいか」分かるように）
const PROMPT_EXAMPLES: Record<'ja' | 'en', { label: string; text: string }[]> = {
  ja: [
    { label: 'アレルギー対応', text: 'アレルギーや苦手な食材を聞かれたら、必ず該当メニューを確認してから案内してください。' },
    { label: 'おすすめの推し方', text: 'おすすめを聞かれたら、当店の看板メニューを理由とともに一押ししてください。' },
    { label: '予約・営業案内', text: '予約や営業時間について聞かれたら、お電話でのご予約をご案内してください。' },
    { label: 'NG事項', text: '提供していないメニューや在庫切れの品は、無理に勧めず正直に伝えてください。' },
    { label: '常連向けの一言', text: 'リピーターの方には感謝を伝え、季節の新メニューを一言添えてください。' },
  ],
  en: [
    { label: 'Allergy handling', text: 'When asked about allergies or ingredients to avoid, always check the relevant menu before answering.' },
    { label: 'How to recommend', text: 'When asked for recommendations, highlight our signature dishes with reasons.' },
    { label: 'Reservations / hours', text: 'When asked about reservations or hours, guide guests to call us to reserve.' },
    { label: 'Things to avoid', text: "Don't push items that are out of stock or not served; be honest." },
    { label: 'Note for regulars', text: 'Thank returning guests and mention a seasonal new item.' },
  ],
}

export default function PromptsPage() {
  const { t, lang } = useAdminLang()
  const tones = [
    { value: 'standard', label: t.prompts.toneStandard },
    { value: 'formal', label: t.prompts.toneFormal },
    { value: 'casual', label: t.prompts.toneCasual },
    { value: 'professional', label: t.prompts.toneProfessional },
  ]
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
  const [googleReviewEnabled, setGoogleReviewEnabled] = useState(false)

  const loadRestaurantData = (r: Restaurant) => {
    setSelectedRestaurant(r)
    setSelectedUid(r.uid)
    setCustomPrompt(r.custom_prompt || '')
    setAiTone(r.ai_tone || 'standard')
    setRecommendedMenus(r.recommended_menus || { auto: true, menu_uids: [] })
    setPopularMenus(r.popular_menus || { auto: true, menu_uids: [] })
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
      // 店舗リストがあればその最初の店舗を使う
      const userStr = sessionStorage.getItem('user')
      const userData = userStr ? JSON.parse(userStr) : null
      const firstUid = userData?.restaurants?.[0]?.uid
      const url = firstUid
        ? `${API_BASE_URL}/restaurants/${firstUid}`
        : `${API_BASE_URL}/restaurants/detail-by-user/${user.uid}`
      fetch(url, {
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
      // レコメンドテキスト機能は廃止。保存時に既存の値をクリアして会話履歴汚染を防ぐ
      formData.append('recommend_texts', JSON.stringify([]))
      formData.append('google_review_enabled', String(googleReviewEnabled))

      const res = await fetch(`${API_BASE_URL}/restaurants/${selectedUid}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      if (!res.ok) throw new Error(t.prompts.saveFailed)

      setMessage({ type: 'success', text: t.prompts.saved })
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || t.prompts.saveFailed })
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

  // 例文を自由記述欄の末尾に追記（重複は足さない）
  const insertExample = (text: string) => {
    setCustomPrompt(prev => {
      if (prev.includes(text)) return prev
      const sep = prev.trim() ? '\n' : ''
      return `${prev}${sep}${text}`
    })
  }

  return (
    <AdminLayout title={t.prompts.title}>
      <div className="breadcrumb-nav">
        <span className="breadcrumb-item active">{t.prompts.breadcrumb}</span>
      </div>

      {/* レストラン選択（Admin のみ） */}
      {userType === 'admin' && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>{t.prompts.selectRestaurant}</label>
          <select
            className="form-control"
            style={{ maxWidth: '400px' }}
            value={selectedUid}
            onChange={(e) => handleSelectRestaurant(e.target.value)}
          >
            <option value="">{t.prompts.pleaseSelect}</option>
            {restaurants.map((r) => (
              <option key={r.uid} value={r.uid}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading && <div style={{ padding: '20px', color: '#94A3B8' }}>{t.layout.loading}</div>}

      {selectedRestaurant && !loading && (
        <>
          {/* カスタム設定（メイン） */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-title">{t.prompts.aiInstructionsFor(selectedRestaurant.name)}</div>
            <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '20px' }}>
              {t.prompts.intro}
            </p>

            {/* トーン選択 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>{t.prompts.aiTone}</label>
              <select
                className="form-control"
                style={{ maxWidth: '300px' }}
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
              >
                {tones.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* お店からAIへの指示（自由記述・主役） */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>{t.prompts.additionalInstructions}</label>

              {/* 例文チップ（クリックで挿入） */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                {PROMPT_EXAMPLES[lang === 'en' ? 'en' : 'ja'].map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => insertExample(ex.text)}
                    style={{
                      padding: '6px 12px', borderRadius: '999px', fontSize: '13px', cursor: 'pointer',
                      background: 'rgba(59,130,246,0.1)', color: '#60A5FA',
                      border: '1px solid rgba(59,130,246,0.3)',
                    }}
                  >
                    ＋ {ex.label}
                  </button>
                ))}
              </div>

              <textarea
                className="form-control"
                rows={10}
                style={{ fontSize: '14px', lineHeight: 1.7 }}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={t.prompts.promptPlaceholder}
              />
              <div style={{ marginTop: '6px', fontSize: '13px', color: '#94A3B8' }}>
                {t.prompts.charCount(customPrompt.length)}
              </div>
            </div>
          </div>

          {/* 詳細設定（折りたたみ） */}
          <details className="card" style={{ marginBottom: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: 'var(--text)' }}>
              {t.prompts.advanced}
            </summary>
            <p style={{ color: '#94A3B8', fontSize: '13px', margin: '12px 0' }}>
              {t.prompts.advancedDesc}
            </p>

            {/* おすすめメニュー手動指定 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={!recommendedMenus.auto}
                  onChange={(e) => setRecommendedMenus({ ...recommendedMenus, auto: !e.target.checked })}
                />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{t.prompts.enableManualRecommended}</span>
              </label>
              {!recommendedMenus.auto && (
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '6px', padding: '12px' }}>
                  {menus.length === 0 ? (
                    <div style={{ color: '#64748B', fontSize: '13px' }}>{t.prompts.noMenus}</div>
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

            {/* 人気メニュー手動指定 */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={!popularMenus.auto}
                  onChange={(e) => setPopularMenus({ ...popularMenus, auto: !e.target.checked })}
                />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{t.prompts.enableManualPopular}</span>
              </label>
              {!popularMenus.auto && (
                <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '6px', padding: '12px' }}>
                  {menus.length === 0 ? (
                    <div style={{ color: '#64748B', fontSize: '13px' }}>{t.prompts.noMenus}</div>
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

          </details>

          {/* Googleレビュー誘導 */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-title">{t.prompts.googleReview}</div>
            <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '12px' }}>
              {t.prompts.googleReviewDesc}
            </p>
            {hasGmb ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={googleReviewEnabled}
                  onChange={(e) => setGoogleReviewEnabled(e.target.checked)}
                />
                <span style={{ fontSize: '14px' }}>{t.prompts.enable}</span>
              </label>
            ) : (
              <div style={{ padding: '12px', background: '#1E293B', borderRadius: '6px', color: '#64748B', fontSize: '13px' }}>
                {t.prompts.noGmbNotice}
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
            {saving ? t.prompts.saving : t.prompts.save}
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
