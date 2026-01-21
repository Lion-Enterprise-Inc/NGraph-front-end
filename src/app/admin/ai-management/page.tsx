'use client'

import { useState } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'

const recentResponses = [
  {
    id: 1,
    time: '2時間前',
    storeId: '1001',
    question: 'この料理のカロリーは？',
    answer: '梅と昆布の出汁茶漬けのカロリーは約320kcalです...',
    satisfaction: 'satisfied'
  },
  {
    id: 2,
    time: '4時間前',
    storeId: '2045',
    question: 'アレルギー対応は？',
    answer: '詳細なアレルギー情報は記載されていません。レストランにお問い合わせください。',
    satisfaction: 'neutral'
  },
  {
    id: 3,
    time: '6時間前',
    storeId: '1001',
    question: '予約は必要ですか？',
    answer: '平日は予約なしでもご案内できますが...',
    satisfaction: 'unsatisfied'
  }
]

const topQuestions = [
  { question: 'カロリーについて', count: 245 },
  { question: 'アレルギー対応', count: 189 },
  { question: '予約について', count: 156 },
  { question: 'おすすめメニュー', count: 134 },
  { question: '営業時間', count: 98 },
]

export default function AIManagementPage() {
  const [activeTab, setActiveTab] = useState('monitoring')
  const [responseMode, setResponseMode] = useState('balanced')
  const [maxResponseTime, setMaxResponseTime] = useState(3)
  const [autoFilter, setAutoFilter] = useState(true)
  const [qualityMonitor, setQualityMonitor] = useState(true)

  const getSatisfactionBadge = (satisfaction: string) => {
    switch (satisfaction) {
      case 'satisfied':
        return <span style={{ background: '#d4edda', color: '#155724', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>満足</span>
      case 'neutral':
        return <span style={{ background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>普通</span>
      case 'unsatisfied':
        return <span style={{ background: '#f8d7da', color: '#721c24', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>不満</span>
      default:
        return null
    }
  }

  return (
    <AdminLayout title="AI管理">
      <div className="card">
        <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>🤖 AI管理センター</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          AIアシスタントの応答品質を監視・管理し、システム全体のパフォーマンスを最適化します。
        </p>
        
        {/* タブナビゲーション */}
        <div className="tab-nav">
          <button 
            className={`tab-nav-btn ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoring')}
          >
            📊 監視ダッシュボード
          </button>
          <button 
            className={`tab-nav-btn ${activeTab === 'responses' ? 'active' : ''}`}
            onClick={() => setActiveTab('responses')}
          >
            💬 応答履歴
          </button>
          <button 
            className={`tab-nav-btn ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            📈 パフォーマンス分析
          </button>
          <button 
            className={`tab-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ AI設定
          </button>
        </div>

        {/* 監視ダッシュボード */}
        {activeTab === 'monitoring' && (
          <div id="ai-tab-monitoring" className="tab-content active">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>今日のAI応答数</div>
                <div style={{ fontSize: '28px', fontWeight: 600, color: '#667eea' }}>2,847</div>
                <div style={{ fontSize: '12px', color: '#28a745' }}>↗ +12% vs 昨日</div>
              </div>
              
              <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>平均応答時間</div>
                <div style={{ fontSize: '28px', fontWeight: 600, color: '#28a745' }}>1.2秒</div>
                <div style={{ fontSize: '12px', color: '#28a745' }}>↗ 安定</div>
              </div>
              
              <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>顧客満足度</div>
                <div style={{ fontSize: '28px', fontWeight: 600, color: '#ffc107' }}>4.2/5</div>
                <div style={{ fontSize: '12px', color: '#28a745' }}>↗ +0.1 vs 先週</div>
              </div>
              
              <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>エラー率</div>
                <div style={{ fontSize: '28px', fontWeight: 600, color: '#dc3545' }}>0.8%</div>
                <div style={{ fontSize: '12px', color: '#dc3545' }}>↗ +0.2% vs 先週</div>
              </div>
            </div>

            {/* 最近のAI応答 */}
            <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>📋 最近のAI応答</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {recentResponses.map((response) => (
                  <div key={response.id} style={{ borderBottom: '1px solid #f0f0f0', padding: '12px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>{response.time} | レストランID: {response.storeId}</div>
                      {getSatisfactionBadge(response.satisfaction)}
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}><strong>質問:</strong> 「{response.question}」</div>
                    <div style={{ fontSize: '14px', color: '#666' }}><strong>回答:</strong> 「{response.answer}」</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 応答履歴 */}
        {activeTab === 'responses' && (
          <div id="ai-tab-responses" className="tab-content active">
            <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>💬 AI応答履歴</h3>
              
              {/* フィルター */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <select style={{ padding: '6px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px' }}>
                  <option>全レストラン</option>
                  <option>レストランID: 1001</option>
                  <option>レストランID: 2045</option>
                </select>
                <select style={{ padding: '6px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px' }}>
                  <option>満足度: すべて</option>
                  <option>満足</option>
                  <option>普通</option>
                  <option>不満</option>
                </select>
                <input type="date" style={{ padding: '6px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '13px' }} />
                <button className="btn btn-primary btn-small">フィルター適用</button>
              </div>
              
              {/* 応答履歴テーブル */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontSize: '13px' }}>時刻</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontSize: '13px' }}>レストランID</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontSize: '13px' }}>質問</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontSize: '13px' }}>満足度</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontSize: '13px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>14:30</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>1001</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>この料理のカロリーは？</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                        <span style={{ background: '#d4edda', color: '#155724', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>満足</span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                        <button className="btn btn-secondary btn-small">詳細</button>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>12:45</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>2045</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>アレルギー対応は？</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                        <span style={{ background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>普通</span>
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                        <button className="btn btn-secondary btn-small">詳細</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* パフォーマンス分析 */}
        {activeTab === 'performance' && (
          <div id="ai-tab-performance" className="tab-content active">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>📊 満足度推移</h3>
                <div style={{ height: '200px', background: '#f8f9fa', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', textAlign: 'center' }}>
                  グラフエリア<br /><small>満足度の時系列データ</small>
                </div>
              </div>
              
              <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>🔥 よくある質問TOP5</h3>
                <div>
                  {topQuestions.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#f8f9fa', borderRadius: '4px', marginBottom: index < topQuestions.length - 1 ? '8px' : '0' }}>
                      <span style={{ fontSize: '13px' }}>{item.question}</span>
                      <span style={{ fontSize: '12px', color: '#666' }}>{item.count}回</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI設定 */}
        {activeTab === 'settings' && (
          <div id="ai-tab-settings" className="tab-content active">
            <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>⚙️ AI設定</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>応答モード</label>
                <select 
                  style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '14px', width: '200px' }}
                  value={responseMode}
                  onChange={(e) => setResponseMode(e.target.value)}
                >
                  <option value="balanced">バランス型（推奨）</option>
                  <option value="conservative">慎重型</option>
                  <option value="creative">創造型</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>最大応答時間</label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={maxResponseTime}
                  onChange={(e) => setMaxResponseTime(parseInt(e.target.value))}
                  style={{ width: '200px' }} 
                />
                <span style={{ marginLeft: '8px', fontSize: '14px' }}>{maxResponseTime}秒</span>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input 
                    type="checkbox" 
                    checked={autoFilter}
                    onChange={(e) => setAutoFilter(e.target.checked)}
                  />
                  不適切な回答を自動フィルタリング
                </label>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input 
                    type="checkbox" 
                    checked={qualityMonitor}
                    onChange={(e) => setQualityMonitor(e.target.checked)}
                  />
                  回答品質をリアルタイム監視
                </label>
              </div>
              
              <button className="btn btn-primary" onClick={() => alert('設定を保存しました')}>設定を保存</button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .tab-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 0;
        }

        .tab-nav-btn {
          padding: 12px 20px;
          border: none;
          background: transparent;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          transition: all 0.2s ease;
        }

        .tab-nav-btn:hover {
          color: #667eea;
        }

        .tab-nav-btn.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .tab-content {
          display: block;
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
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #1d4ed8, #6d28d9);
        }

        .btn-secondary {
          background: #f8f9fa;
          color: #333;
          border: 1px solid #dee2e6;
        }

        .btn-secondary:hover {
          background: #e9ecef;
        }

        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .tab-nav {
            flex-wrap: wrap;
          }

          .tab-nav-btn {
            padding: 8px 12px;
            font-size: 12px;
          }
        }
      `}</style>
    </AdminLayout>
  )
}
