'use client'

import { useState } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'

const industries = [
  { value: 'restaurant', label: '① 飲食店（寿司、和食、居酒屋、カフェ、バーなど）' },
  { value: 'retail', label: '② 小売店（アパレル、雑貨、書店など）' },
  { value: 'service', label: '③ サービス業（美容室、サロン、クリーニングなど）' },
  { value: 'hotel', label: '④ 宿泊施設（ホテル、旅館、民泊など）' },
  { value: 'medical', label: '⑤ 医療・健康（クリニック、整体、薬局など）' },
  { value: 'education', label: '⑥ 教育・スクール（塾、教室、スクールなど）' },
  { value: 'entertainment', label: '⑦ エンターテイメント（劇場、カラオケ、ゲームセンターなど）' },
  { value: 'other', label: '⑧ その他' },
]

const tones = [
  { value: 'standard', label: 'スタンダード（標準）' },
  { value: 'formal', label: 'フォーマル（丁寧）' },
  { value: 'casual', label: 'カジュアル（親しみやすい）' },
  { value: 'professional', label: 'プロフェッショナル（専門的）' },
]

const basePromptDefault = `あなたは飲食店のAIアシスタントです。以下のルールに従って応答してください：

【基本ルール】
1. 常に丁寧で親切な対応を心がけてください
2. お客様の質問に対して、正確で有用な情報を提供してください
3. メニューや料理に関する質問には、詳細な説明を行ってください
4. アレルギー情報は特に慎重に扱い、不明な場合はレストランへの確認を促してください

【多言語対応】
- お客様の言語を自動検出し、同じ言語で応答してください
- 日本語、英語、中国語、韓国語に対応しています

【安全性】
- 個人情報の取り扱いには十分注意してください
- 不適切な内容や差別的な表現は避けてください`

const customPromptDefault = `【出力スタイル】
- 簡潔で分かりやすい説明を心がけてください
- 料理の特徴や魅力を伝える際は、具体的な表現を使用してください
- お客様の好みに合わせた提案を行ってください

【強調項目】
- 地元食材の使用
- 季節のおすすめメニュー
- アレルギー対応の可否`

export default function PromptsPage() {
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedTone, setSelectedTone] = useState('')
  const [basePrompt, setBasePrompt] = useState(basePromptDefault)
  const [customPrompt, setCustomPrompt] = useState(customPromptDefault)
  const [showEditArea, setShowEditArea] = useState(false)

  const handleIndustryChange = (value: string) => {
    setSelectedIndustry(value)
    setShowEditArea(!!value)
  }

  const handleSave = () => {
    alert('変更を保存して全レストランに反映しました')
  }

  const handlePreview = () => {
    alert('プレビュー機能は開発中です')
  }

  const handleResetBase = () => {
    setBasePrompt(basePromptDefault)
    alert('基礎プロンプトをデフォルトに戻しました')
  }

  return (
    <AdminLayout title="システムプロンプト設定">
      {/* Breadcrumb */}
      <div className="breadcrumb-nav">
        <span className="breadcrumb-item active">📝 システムプロンプト設定</span>
      </div>

      <div className="card">
        <div className="card-title">システムプロンプト設定</div>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          全ユーザー（無料・有料）で共通利用されるシステムプロンプトです。<br />
          料理、商品、メニュー表などのあらゆる画像撮影時のAI応答内容を定義します。
        </p>

        {/* 業種選択 */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '10px' }}>業種を選択</label>
          <select 
            id="template-industry-select" 
            className="form-control" 
            style={{ maxWidth: '400px' }}
            value={selectedIndustry}
            onChange={(e) => handleIndustryChange(e.target.value)}
          >
            <option value="">業種を選択してください</option>
            {industries.map((ind) => (
              <option key={ind.value} value={ind.value}>{ind.label}</option>
            ))}
          </select>
        </div>

        {/* テンプレート編集エリア */}
        {showEditArea && (
          <div id="template-edit-area">
            {/* 2層構造の説明 */}
            <div style={{ background: '#e3f2fd', borderLeft: '4px solid #2196F3', padding: '15px', marginBottom: '30px', borderRadius: '4px' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: '#1976D2' }}>💡 2層構造について</div>
              <div style={{ fontSize: '14px', color: '#555' }}>
                <strong>基礎プロンプト：</strong> 多言語対応や安全性など、変更すべきでない普遍的なルール<br />
                <strong>カスタマイズプロンプト：</strong> 出力内容の詳細度や強調項目など、柔軟に調整可能な部分
              </div>
            </div>

            {/* 基礎システムプロンプト */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontWeight: 600, fontSize: '16px' }}>
                  🔒 基礎システムプロンプト
                </label>
                <span style={{ color: '#666', fontSize: '13px' }}>
                  バージョン: <span id="template-version">1.0.0</span>
                </span>
              </div>
              <div style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107', padding: '12px', marginBottom: '10px', borderRadius: '4px' }}>
                <strong>⚠️ NGraphの基本動作ルール</strong> - 慎重に編集してください
              </div>
              <textarea 
                id="template-base-prompt" 
                className="form-control" 
                rows={15}
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
                value={basePrompt}
                onChange={(e) => setBasePrompt(e.target.value)}
              />
              <div style={{ marginTop: '8px', color: '#666', fontSize: '13px' }}>
                文字数: <span id="base-prompt-count">{basePrompt.length}</span>
              </div>
              <div style={{ marginTop: '10px' }}>
                <button className="btn btn-secondary btn-small" onClick={handleResetBase}>
                  🔄 デフォルトに戻す
                </button>
              </div>
            </div>

            {/* カスタマイズプロンプト（トーン別） */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '16px', margin: 0 }}>
                  🎨 カスタマイズプロンプト（トーン別）
                </label>
              </div>
              
              {/* トーン選択 */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>AIトーンを選択</label>
                <select 
                  id="template-tone-select" 
                  className="form-control" 
                  style={{ maxWidth: '400px' }}
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                >
                  <option value="">トーンを選択してください</option>
                  {tones.map((tone) => (
                    <option key={tone.value} value={tone.value}>{tone.label}</option>
                  ))}
                </select>
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                  各トーンごとにプロンプトを個別に編集できます
                </div>
              </div>
              
              <div style={{ background: '#e8f5e9', borderLeft: '4px solid #4caf50', padding: '12px', marginBottom: '10px', borderRadius: '4px' }}>
                出力内容の詳細度や強調項目など、自由に編集できます
              </div>
              <textarea 
                id="template-customizable-prompt" 
                className="form-control" 
                rows={8}
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
              <div style={{ marginTop: '8px', color: '#666', fontSize: '13px' }}>
                文字数: <span id="customizable-prompt-count">{customPrompt.length}</span>
              </div>
            </div>

            {/* 適用状況 */}
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
              <div style={{ fontWeight: 600, marginBottom: '15px', fontSize: '16px' }}>📊 適用状況</div>
              <div id="template-usage-stats" style={{ fontSize: '14px', color: '#666' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>このテンプレートを使用中のレストラン</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#667eea' }}>12レストラン</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>カスタマイズ済みレストラン</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#667eea' }}>5レストラン</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>最終更新</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#667eea' }}>2日前</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 保存ボタン */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={handleSave}>
                💾 変更を保存して全レストランに反映
              </button>
              <button className="btn btn-secondary" onClick={handlePreview}>
                👁️ プレビュー
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .breadcrumb-item {
          color: #667eea;
          cursor: pointer;
        }

        .breadcrumb-item.active {
          color: #333;
          font-weight: 600;
          cursor: default;
        }

        .breadcrumb-separator {
          color: #999;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .card-title {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin-bottom: 16px;
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
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        textarea.form-control {
          resize: vertical;
          line-height: 1.6;
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
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover {
          background: #1d4ed8;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #e5e7eb;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }
      `}</style>
    </AdminLayout>
  )
}
