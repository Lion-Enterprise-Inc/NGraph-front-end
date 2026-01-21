'use client'

import { useState } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'

export default function AIEditorPage() {
  const [industry, setIndustry] = useState('')
  const [isCustomized, setIsCustomized] = useState(false)
  const [autoRecommend, setAutoRecommend] = useState(true)
  const [autoPopular, setAutoPopular] = useState(true)
  const [autoRecommendText, setAutoRecommendText] = useState(true)
  const [recommendTab, setRecommendTab] = useState('existing')
  const [popularTab, setPopularTab] = useState('existing')
  const [recommendTextTab, setRecommendTextTab] = useState('template')
  const [prompt, setPrompt] = useState(`あなたはOmiseAIの飲食店向けアシスタントです。

【基本姿勢】
- ユーザーの端末言語で応答する（最優先）
- 正確で分かりやすい情報を提供する
- 食の安全に関わる情報（アレルゲン、宗教対応）は慎重に扱う
- 不明な情報は推測せず「記載なし」と明記する

【安全性・コンプライアンス】
- アレルギー情報は明確に表示し、不確実な場合は必ず注意喚起
- 宗教上の制約（豚肉、牛肉、アルコール）は必ず確認・表示
- 健康被害につながる誤情報は絶対に提供しない

【多言語対応】
- 端末の言語設定を最優先で検出
- 主要対応言語：日本語、英語、中国語、韓国語
- 料理名・商品名は必ず読み方を併記`)

  const [recommendedMenus, setRecommendedMenus] = useState([
    '紅ズワイ蟹刺し - ¥2,980',
    '蟹と福井の幸コース - ¥4,500'
  ])
  const [popularMenus, setPopularMenus] = useState([
    '越前ガニ丼 - ¥1,800',
    '海鮮ちらし寿司 - ¥2,200'
  ])
  const [recommendTexts, setRecommendTexts] = useState([
    'おすすめは？',
    'アレルギー対応は？',
    'お店の特徴を教えて'
  ])

  const handleSave = () => {
    alert('💾 AI設定を保存しました！')
  }

  const handlePreview = () => {
    alert('👁️ ユーザー画面でプレビューを表示します')
  }

  return (
    <AdminLayout title="AIエディタ">
      <div className="ai-editor-page">
        {/* Header Card */}
        <div className="card">
          <div className="card-title" style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>✨</span>
            <span>AIプロンプトエディタ（詳細編集）</span>
          </div>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
            AI応答をより細かくカスタマイズできる高度な編集ツールです。<br />
            基本的な設定は「基本情報」ページで行ってください。
          </p>

          {/* Info Box */}
          <div className="info-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>ℹ️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: '4px' }}>
                  AI基本設定（ロゴ・名前・挨拶）は基本情報ページで設定できます
                </div>
                <button className="btn-link">基本情報ページへ →</button>
              </div>
            </div>
          </div>
        </div>

        {/* Industry Category */}
        <div className="card">
          <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 8px 0', color: '#1a202c' }}>
            業種カテゴリ
          </h4>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
            選択した業種に最適なAI応答テンプレートが自動適用されます
          </p>
          <select 
            className="form-select"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
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

        {/* Prompt Editor */}
        <div className="card">
          {/* Status */}
          <div className={`status-box ${isCustomized ? 'customized' : 'template'}`}>
            {isCustomized ? (
              <>
                <strong>✨ カスタマイズ中</strong><br />
                <span style={{ fontSize: '13px', color: '#666' }}>
                  あなたの独自設定が適用されます<br />
                  （運営側のテンプレート更新の影響を受けません）
                </span>
              </>
            ) : (
              <>
                <strong>💡 現在：テンプレートを使用中</strong><br />
                <span style={{ fontSize: '13px', color: '#666' }}>
                  運営推奨の設定が適用されています。編集するには「カスタマイズする」ボタンをクリックしてください。
                </span>
              </>
            )}
          </div>

          <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px', color: '#333' }}>プロンプト</label>
          <textarea
            className="prompt-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={12}
            disabled={!isCustomized}
            placeholder="プロンプトを入力してください..."
          />
          <div style={{ marginBottom: '10px', color: '#666', fontSize: '12px' }}>
            <span style={{ fontWeight: 600, color: '#667eea' }}>
              文字数: {prompt.length}
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isCustomized ? (
              <>
                <button className="btn-primary" onClick={handleSave}>💾 保存</button>
                <button className="btn-secondary" onClick={() => setIsCustomized(false)}>🔄 テンプレートに戻す</button>
              </>
            ) : (
              <button className="btn-primary" onClick={() => setIsCustomized(true)}>✏️ カスタマイズする</button>
            )}
          </div>
        </div>

        {/* Recommended Menu */}
        <div className="card">
          <div className="card-title">🌟 おすすめメニューの設定</div>
          <label className="checkbox-label">
            <input type="checkbox" checked={autoRecommend} onChange={() => setAutoRecommend(!autoRecommend)} />
            <span>OmiseAIにおすすめを任せる（自動選定）</span>
          </label>
          
          {!autoRecommend && (
            <div style={{ marginTop: '15px' }}>
              <label className="form-label">手動で設定:</label>
              
              <div className="tab-nav">
                <button className={`tab-nav-btn ${recommendTab === 'existing' ? 'active' : ''}`} onClick={() => setRecommendTab('existing')}>📋 登録済みから選択</button>
                <button className={`tab-nav-btn ${recommendTab === 'custom' ? 'active' : ''}`} onClick={() => setRecommendTab('custom')}>✏️ 新規入力</button>
              </div>

              {recommendTab === 'existing' && (
                <div className="form-group">
                  <label className="form-label">メニューを選択:</label>
                  <select className="form-select">
                    <option value="">選択してください</option>
                    <option value="menu1">紅ズワイ蟹刺し - ¥2,980</option>
                    <option value="menu2">蟹と福井の幸コース - ¥4,500</option>
                    <option value="menu3">越前ガニ丼 - ¥1,800</option>
                    <option value="menu4">海鮮ちらし寿司 - ¥2,200</option>
                  </select>
                  <button className="btn-primary btn-small" style={{ marginTop: '5px' }}>追加</button>
                </div>
              )}

              {recommendTab === 'custom' && (
                <>
                  <div className="form-group">
                    <label className="form-label">メニュー名:</label>
                    <input type="text" className="form-input" placeholder="例: 特製蟹しゃぶ" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">価格:</label>
                    <input type="number" className="form-input" placeholder="例: 3500" />
                  </div>
                  <button className="btn-primary btn-small">追加</button>
                </>
              )}

              <div style={{ marginTop: '20px' }}>
                <label className="form-label">選択済みおすすめメニュー:</label>
                {recommendedMenus.map((menu, i) => (
                  <div key={i} className="ingredient-item">
                    <span>{menu}</span>
                    <button className="remove-btn" onClick={() => setRecommendedMenus(recommendedMenus.filter((_, idx) => idx !== i))}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Popular Menu */}
        <div className="card">
          <div className="card-title">🔥 人気メニューの設定</div>
          <label className="checkbox-label">
            <input type="checkbox" checked={autoPopular} onChange={() => setAutoPopular(!autoPopular)} />
            <span>OmiseAIにおすすめを任せる（自動選定）</span>
          </label>
          
          {!autoPopular && (
            <div style={{ marginTop: '15px' }}>
              <label className="form-label">手動で設定:</label>
              
              <div className="tab-nav">
                <button className={`tab-nav-btn ${popularTab === 'existing' ? 'active' : ''}`} onClick={() => setPopularTab('existing')}>📋 登録済みから選択</button>
                <button className={`tab-nav-btn ${popularTab === 'custom' ? 'active' : ''}`} onClick={() => setPopularTab('custom')}>✏️ 新規入力</button>
              </div>

              {popularTab === 'existing' && (
                <div className="form-group">
                  <label className="form-label">メニューを選択:</label>
                  <select className="form-select">
                    <option value="">選択してください</option>
                    <option value="menu1">紅ズワイ蟹刺し - ¥2,980</option>
                    <option value="menu2">蟹と福井の幸コース - ¥4,500</option>
                    <option value="menu3">越前ガニ丼 - ¥1,800</option>
                    <option value="menu4">海鮮ちらし寿司 - ¥2,200</option>
                  </select>
                  <button className="btn-primary btn-small" style={{ marginTop: '5px' }}>追加</button>
                </div>
              )}

              {popularTab === 'custom' && (
                <>
                  <div className="form-group">
                    <label className="form-label">メニュー名:</label>
                    <input type="text" className="form-input" placeholder="例: 特製蟹しゃぶ" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">価格:</label>
                    <input type="number" className="form-input" placeholder="例: 3500" />
                  </div>
                  <button className="btn-primary btn-small">追加</button>
                </>
              )}

              <div style={{ marginTop: '20px' }}>
                <label className="form-label">選択済み人気メニュー:</label>
                {popularMenus.map((menu, i) => (
                  <div key={i} className="ingredient-item">
                    <span>{menu}</span>
                    <button className="remove-btn" onClick={() => setPopularMenus(popularMenus.filter((_, idx) => idx !== i))}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recommend Text */}
        <div className="card">
          <div className="card-title">💬 レコメンドテキスト</div>
          <label className="checkbox-label">
            <input type="checkbox" checked={autoRecommendText} onChange={() => setAutoRecommendText(!autoRecommendText)} />
            <span>OmiseAIにおすすめを任せる（自動選定）</span>
          </label>
          
          {!autoRecommendText && (
            <div style={{ marginTop: '15px' }}>
              <label className="form-label">手動で設定:</label>
              <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>お客様がタップするだけで会話が始まるクイックアクションを設定できます</p>
              
              <div className="tab-nav">
                <button className={`tab-nav-btn ${recommendTextTab === 'template' ? 'active' : ''}`} onClick={() => setRecommendTextTab('template')}>📋 テンプレートから選択</button>
                <button className={`tab-nav-btn ${recommendTextTab === 'custom' ? 'active' : ''}`} onClick={() => setRecommendTextTab('custom')}>✏️ 新規入力</button>
              </div>

              {recommendTextTab === 'template' && (
                <div className="form-group">
                  <label className="form-label">テンプレートを選択:</label>
                  <select className="form-select">
                    <option value="">選択してください</option>
                    <option value="recommend">おすすめは？</option>
                    <option value="allergy">アレルギー対応は？</option>
                    <option value="feature">お店の特徴を教えて</option>
                    <option value="price">お値段を教えて</option>
                    <option value="hours">営業時間は？</option>
                    <option value="location">場所を教えて</option>
                    <option value="reservation">予約できますか？</option>
                  </select>
                  <button className="btn-primary btn-small" style={{ marginTop: '5px' }}>追加</button>
                </div>
              )}

              {recommendTextTab === 'custom' && (
                <div className="form-group">
                  <label className="form-label">レコメンドテキスト:</label>
                  <input type="text" className="form-input" placeholder="例: 今日のおすすめは何ですか？" />
                  <button className="btn-primary btn-small" style={{ marginTop: '5px' }}>追加</button>
                </div>
              )}

              <div style={{ marginTop: '20px' }}>
                <label className="form-label">選択済みレコメンドテキスト:</label>
                {recommendTexts.map((text, i) => (
                  <div key={i} className="ingredient-item">
                    <span>{text}</span>
                    <button className="remove-btn" onClick={() => setRecommendTexts(recommendTexts.filter((_, idx) => idx !== i))}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Save Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={handleSave}>💾 保存</button>
          <button className="btn-secondary" onClick={handlePreview}>👁️ ユーザー画面で確認</button>
        </div>
      </div>

      <style jsx>{`
        .ai-editor-page {
          max-width: 900px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 16px;
        }

        .info-box {
          padding: 16px;
          background: #f0f9ff;
          border-left: 4px solid #667eea;
          border-radius: 4px;
        }

        .btn-link {
          background: white;
          color: #667eea;
          border: 1px solid #667eea;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          margin-top: 8px;
        }

        .btn-link:hover {
          background: #f0f4ff;
        }

        .form-select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }

        .form-select:focus {
          outline: none;
          border-color: #667eea;
        }

        .status-box {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .status-box.template {
          background: #e3f2fd;
          border-left: 4px solid #2196F3;
        }

        .status-box.customized {
          background: #fff3e0;
          border-left: 4px solid #ff9800;
        }

        .prompt-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 12px;
          font-family: 'Courier New', monospace;
          line-height: 1.6;
          resize: vertical;
          transition: all 0.3s;
        }

        .prompt-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .prompt-textarea:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        }

        .btn-primary.btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }

        .btn-secondary {
          background: white;
          color: #374151;
          border: 1px solid #e5e7eb;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .checkbox-label input {
          cursor: pointer;
        }

        .form-label {
          display: block;
          font-weight: 500;
          color: #555;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .tab-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 15px;
        }

        .tab-nav-btn {
          padding: 8px 16px;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-nav-btn:hover {
          background: #f9fafb;
        }

        .tab-nav-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .ingredient-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: #f8f9fa;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .remove-btn {
          background: none;
          border: none;
          color: #dc3545;
          font-size: 18px;
          cursor: pointer;
          padding: 0 8px;
        }

        .remove-btn:hover {
          color: #a71d2a;
        }

        @media (max-width: 768px) {
          .tab-nav {
            flex-direction: column;
          }
        }
      `}</style>
    </AdminLayout>
  )
}
