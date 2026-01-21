'use client'

import { useState } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'

export default function BasicInfoPage() {
  const [formData, setFormData] = useState({
    storeType: 'restaurant_izakaya',
    storeName: 'ぼんた本店',
    phone: '0776-22-2235',
    address: '福井県福井市二の宮2丁目8-75',
    officialWebsite: '',
    instagramUrl: '',
    description: '',
    businessHours: '16:00～24:00（お食事LO 23:00 ドリンクLO 23:30）',
    holidays: '火曜日（祝日、祝前日は営業）',
    seats: '',
    budget: '',
    parking: '',
    payment: '',
    features: ''
  })

  const [aiIndustry, setAiIndustry] = useState('restaurant')
  const [aiTone, setAiTone] = useState('polite')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = () => {
    alert('💾 レストラン情報を保存しました！')
  }

  const handleAIReference = () => {
    alert('🤖 AI参照で情報取得中...\n\n登録されたソースから情報を自動取得します。')
  }

  return (
    <AdminLayout title="基本情報">
      <div className="card">
        <div id="storeInfoSuccess"></div>
      
        {/* 基本情報カード */}
        <div className="card inner-card">
          <div className="card-title">📍 基本情報</div>
          
          <div className="form-group">
            <label className="form-label">業種 *</label>
            <select
              name="storeType"
              className="form-input"
              value={formData.storeType}
              onChange={handleChange}
            >
              <option value="">選択してください</option>
              <option value="restaurant_izakaya">🍽️ 飲食店 - 居酒屋</option>
              <option value="restaurant_cafe">🍽️ 飲食店 - カフェ</option>
              <option value="restaurant_ramen">🍽️ 飲食店 - ラーメン店</option>
              <option value="retail_apparel">🛍️ 小売店 - アパレル</option>
              <option value="retail_goods">🛍️ 小売店 - 雑貨店</option>
              <option value="hotel">🏨 宿泊施設</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">レストラン名 *</label>
            <input
              type="text"
              name="storeName"
              className="form-input"
              value={formData.storeName}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">電話番号</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">住所</label>
            <input
              type="text"
              name="address"
              className="form-input"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* 情報ソースカード */}
        <div className="card inner-card">
          <div className="card-title">🔗 情報ソース</div>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            レストランの公式サイトやSNSのURLを入力すると、AIが情報を参考にレストランデータを構築できます
          </p>

          <div id="sourcesList">
            <div className="form-group">
              <label className="form-label">🌐 公式HP</label>
              <input
                type="url"
                name="officialWebsite"
                className="form-input"
                placeholder="https://example.com"
                value={formData.officialWebsite}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">📸 Instagram</label>
              <input
                type="url"
                name="instagramUrl"
                className="form-input"
                placeholder="https://instagram.com/yourstore"
                value={formData.instagramUrl}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary"
              style={{ background: 'white', borderColor: '#6c757d', color: '#6c757d', padding: '10px 20px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'all 0.3s ease' }}
            >
              ➕ その他のソースを追加
            </button>
            <button 
              className="btn ai-btn" 
              onClick={handleAIReference}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', fontWeight: 500, padding: '10px 20px', fontSize: '14px', borderRadius: '6px', cursor: 'pointer', textShadow: '0 1px 2px rgba(0,0,0,0.2)', boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)' }}
            >
              🤖 AI参照で情報取得
            </button>
          </div>

          <div style={{ marginTop: '15px', padding: '10px', background: '#FFF3E0', borderRadius: '6px', fontSize: '13px', color: '#E65100' }}>
            <strong>⚠️ 注意:</strong> 外部サイトの情報は参考情報として取得されます。必ず内容を確認してから反映してください。
          </div>
        </div>

        {/* レストラン詳細カード */}
        <div className="card inner-card">
          <div className="card-title">📝 レストラン詳細</div>

          <div className="form-group">
            <label className="form-label">レストラン紹介</label>
            <textarea
              name="description"
              className="form-input"
              placeholder="レストランの特徴や魅力を入力してください"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">営業時間</label>
            <input
              type="text"
              name="businessHours"
              className="form-input"
              value={formData.businessHours}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">定休日</label>
            <input
              type="text"
              name="holidays"
              className="form-input"
              value={formData.holidays}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">座席数</label>
            <input
              type="text"
              name="seats"
              className="form-input"
              placeholder="例: 50席（カウンター10席、テーブル40席）"
              value={formData.seats}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">予算</label>
            <input
              type="text"
              name="budget"
              className="form-input"
              placeholder="例: ディナー ¥3,000～¥4,000"
              value={formData.budget}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">駐車場</label>
            <input
              type="text"
              name="parking"
              className="form-input"
              placeholder="例: 有（10台）、無"
              value={formData.parking}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">支払い方法</label>
            <input
              type="text"
              name="payment"
              className="form-input"
              placeholder="例: カード可、電子マネー可、現金のみ"
              value={formData.payment}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">特徴・こだわり</label>
            <textarea
              name="features"
              className="form-input"
              placeholder="例: 地元食材使用、個室あり、英語メニューあり"
              value={formData.features}
              onChange={handleChange}
            />
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            style={{ color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
          >
            💾 保存
          </button>
        </div>

        {/* AI基本設定カード */}
        <div className="card inner-card" style={{ marginBottom: '32px' }}>
          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1f2937' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <span>AI基本設定</span>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#667eea', background: '#f0f4ff', padding: '4px 10px', borderRadius: '12px', marginLeft: '8px' }}>
                ライトプラン以上
              </span>
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
              お客様と対話するAIアシスタントの基本的な設定を行います
            </p>
          </div>

          {/* 業種カテゴリ */}
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0', color: '#1a202c' }}>
              業種カテゴリ
            </h4>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              選択した業種に最適なAI応答テンプレートが自動適用されます
            </p>
            <select 
              value={aiIndustry}
              onChange={(e) => setAiIndustry(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '6px', fontSize: '14px', background: 'white', cursor: 'pointer' }}
            >
              <option value="">業種を選択してください</option>
              <option value="restaurant">① 飲食店（寿司、和食、居酒屋、カフェ、バーなど）</option>
              <option value="retail">② 小売店（アパレル、雑貨、書店など）</option>
              <option value="service">③ サービス業（美容室、サロン、クリーニングなど）</option>
              <option value="hotel">④ 宿泊施設（ホテル、旅館、民泊など）</option>
              <option value="medical">⑤ 医療・健康（クリニック、整体、薬局など）</option>
              <option value="education">⑥ 教育・スクール（塾、教室、スクールなど）</option>
              <option value="entertainment">⑦ エンターテイメント（劇場、カラオケ、ゲームセンターなど）</option>
              <option value="other">⑧ その他</option>
            </select>
          </div>

          {/* AIトーン */}
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0', color: '#1a202c' }}>
              AIトーン
            </h4>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              お客様への話し方のスタイルを選択してください
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* カジュアル */}
              <label className="ai-tone-card" style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', background: aiTone === 'casual' ? '#f0f4ff' : 'white', border: aiTone === 'casual' ? '2px solid #667eea' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="aiTone" 
                  value="casual" 
                  checked={aiTone === 'casual'}
                  onChange={(e) => setAiTone(e.target.value)}
                  style={{ marginRight: '12px', cursor: 'pointer', marginTop: '4px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px', color: '#1a202c' }}>
                    カジュアル - 親しみやすい話し方
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                    例: 「いらっしゃい！うちの料理、めっちゃ美味しいよ！」
                  </div>
                </div>
              </label>

              {/* 丁寧 */}
              <label className="ai-tone-card" style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', background: aiTone === 'polite' ? '#f0f4ff' : 'white', border: aiTone === 'polite' ? '2px solid #667eea' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="aiTone" 
                  value="polite" 
                  checked={aiTone === 'polite'}
                  onChange={(e) => setAiTone(e.target.value)}
                  style={{ marginRight: '12px', cursor: 'pointer', marginTop: '4px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px', color: '#1a202c' }}>
                    丁寧 - 敬語でしっかりと
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                    例: 「いらっしゃいませ。当店自慢の料理をご堪能ください。」
                  </div>
                </div>
              </label>

              {/* 高級感 */}
              <label className="ai-tone-card" style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', background: aiTone === 'luxury' ? '#f0f4ff' : 'white', border: aiTone === 'luxury' ? '2px solid #667eea' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="aiTone" 
                  value="luxury" 
                  checked={aiTone === 'luxury'}
                  onChange={(e) => setAiTone(e.target.value)}
                  style={{ marginRight: '12px', cursor: 'pointer', marginTop: '4px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px', color: '#1a202c' }}>
                    高級感 - 上品で洗練された表現
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                    例: 「ようこそお越しくださいました。厳選された食材の逸品をお楽しみください。」
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 保存ボタン */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button className="btn btn-secondary" style={{ background: 'white', color: '#374151', border: '1px solid #e5e7eb', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}>
              リセット
            </button>
            <button className="btn btn-primary" onClick={() => alert('AI設定を保存しました！')}>
              AI設定を保存
            </button>
          </div>

          {/* ビジネスプランへのアップグレード促進 */}
          <div style={{ marginTop: '24px', padding: '20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ fontSize: '24px', color: '#667eea' }}>✨</div>
              <div style={{ flex: 1 }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
                  ビジネスプラン（¥3,980/月）でさらに高度な設定が可能
                </h5>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: 1.8, color: '#4b5563' }}>
                  <li style={{ marginBottom: '6px' }}>AIエディタでプロンプトを完全にカスタマイズ</li>
                  <li style={{ marginBottom: '6px' }}>初めの挨拶をカスタマイズ可能</li>
                  <li style={{ marginBottom: '6px' }}>メニュー情報を詳細に学習させる</li>
                  <li style={{ marginBottom: '6px' }}>応答パターンを細かく調整</li>
                </ul>
                <button style={{ marginTop: '16px', background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', fontWeight: 500, fontSize: '13px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                  プラン詳細を確認 →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 保存ボタンカード */}
        <div className="card inner-card" style={{ textAlign: 'center', padding: '20px' }}>
          <button className="btn btn-primary" onClick={handleSave}>💾 保存する</button>
        </div>
      </div>

      <style jsx>{`
        .card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .inner-card {
          margin-bottom: 16px;
          box-shadow: none;
          border: 1px solid #e5e7eb;
        }

        .inner-card:last-child {
          margin-bottom: 0;
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1a1a1a;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #555;
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          transition: border 0.3s;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
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
      `}</style>
    </AdminLayout>
  )
}
