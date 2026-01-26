'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../components/admin/AdminLayout'

function StoreDashboard() {
  const [expandedConv, setExpandedConv] = useState<string | null>(null)

  const toggleConversation = (id: string) => {
    setExpandedConv(expandedConv === id ? null : id)
  }

  return (
    <>
      <section className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0, textAlign: 'left' }}>📊 レストランダッシュボード</h2>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px', textAlign: 'left' }}>AIスタッフの稼働状況や改善アクションを一目で把握できます。</p>
          </div>
          <button 
            type="button" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              border: 'none', 
              borderRadius: '999px', 
              padding: '12px 20px', 
              background: 'rgba(255, 255, 255, 0.16)', 
              color: '#0f172a', 
              fontWeight: 600, 
              fontSize: '14px', 
              cursor: 'pointer', 
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.18)'
            }}
          >
            💎 プランを確認する
          </button>
        </div>

        {/* 集客効果 */}
        <div className="card" style={{ width: '100%', maxWidth: 'none' }}>
          <div className="card-title">📈 集客効果</div>
          <div className="dashboard-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', width: '100%', maxWidth: 'none' }}>
            <div className="stat-card" style={{ 
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
              textAlign: 'center', 
              padding: '16px',
              minHeight: '160px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'center',
              borderRadius: '12px',
              background: 'white',
              border: '1px solid #f0f0f0'
            }}>
              <div className="stat-label" style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>📱 QRスキャン数</div>
              <div className="stat-value" style={{ fontSize: '42px', fontWeight: 700, color: '#667eea', margin: '12px 0' }}>1,500</div>
              <div style={{ fontSize: '14px', color: '#10b981' }}>+12% vs 先月 ↗</div>
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8, lineHeight: 1.4 }}>💡 看板やテーブルのQRが活用されています</div>
            </div>
            <div className="stat-card" style={{ 
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
              textAlign: 'center', 
              padding: '16px',
              minHeight: '160px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'center',
              borderRadius: '12px',
              background: 'white',
              border: '1px solid #f0f0f0'
            }}>
              <div className="stat-label" style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '16px' }}>💬 質問数</div>
              <div className="stat-value" style={{ fontSize: '42px', fontWeight: 700, color: '#667eea', margin: '12px 0' }}>1,247</div>
              <div style={{ fontSize: '14px', color: '#10b981' }}>+8% vs 先月 ↗</div>
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8, lineHeight: 1.4 }}>💡 お客様の関心が高まっています</div>
            </div>
          </div>
        </div>

        {/* レストランパフォーマンス */}
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-title">📊 レストランパフォーマンス</div>
          <div className="stats-grid">
            {/* お客様の傾向 */}
            <div className="stat-card">
              <div className="stat-label">🌍 お客様の傾向</div>
              <div style={{ margin: '12px 0' }}>
                {[
                  { flag: '🇯🇵', lang: '日本語', pct: 39, gradient: 'linear-gradient(90deg, #667eea, #764ba2)' },
                  { flag: '🇨🇳', lang: '中国語', pct: 25, gradient: 'linear-gradient(90deg, #10b981, #059669)' },
                  { flag: '🇰🇷', lang: '韓国語', pct: 20, gradient: 'linear-gradient(90deg, #f59e0b, #d97706)' },
                  { flag: '🇺🇸', lang: '英語', pct: 10, gradient: 'linear-gradient(90deg, #94a3b8, #64748b)' },
                ].map((item, idx) => (
                  <div key={idx} style={{ marginBottom: idx < 3 ? '12px' : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '18px' }}>{item.flag} {item.lang}</span>
                      <span style={{ fontWeight: 600, fontSize: '16px' }}>{item.pct}%</span>
                    </div>
                    <div style={{ background: '#e5e7eb', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ background: item.gradient, width: `${item.pct}%`, height: '100%' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* よく聞かれる質問 */}
            <div className="stat-card">
              <div className="stat-label">🔥 よく聞かれる質問</div>
              <div style={{ margin: '12px 0' }}>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '6px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px' }}>🍽️ おすすめのメニューは？</span>
                  <span style={{ fontWeight: 700, color: '#667eea', fontSize: '16px' }}>127</span>
                </div>
                <div style={{ padding: '10px', background: '#fff3e0', borderRadius: '6px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px' }}>⚠️ アレルギー対応できますか？</span>
                  <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '16px' }}>98</span>
                </div>
                <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '6px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px' }}>🦀 蟹料理で一番人気は？</span>
                  <span style={{ fontWeight: 700, color: '#10b981', fontSize: '16px' }}>76</span>
                </div>
                <div style={{ padding: '10px', background: '#fef2f2', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px' }}>🏠 個室はありますか？</span>
                  <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '16px' }}>54</span>
                </div>
              </div>
            </div>

            {/* お客様満足度 */}
            <div className="stat-card">
              <div className="stat-label">💬 お客様満足度</div>
              <div style={{ fontSize: '32px', fontWeight: 700, margin: '8px 0', color: '#4CAF50' }}>4.5</div>
              <div style={{ fontSize: '14px', color: '#666' }}>/ 5.0</div>
              <div style={{ fontSize: '12px', marginTop: '8px', color: '#4CAF50' }}>⭐ 良好</div>
            </div>

            {/* 要改善項目 */}
            <div className="stat-card">
              <div className="stat-label">⚠️ 要改善項目</div>
              <div style={{ fontSize: '14px', margin: '8px 0' }}>
                <div style={{ marginBottom: '6px', color: '#FF9800' }}>• アレルギー対応精度向上</div>
                <div style={{ marginBottom: '6px', color: '#FF9800' }}>• 中国語メニュー充実</div>
                <div style={{ color: '#4CAF50' }}>• 全体的に良好</div>
              </div>
            </div>
          </div>
        </div>

        {/* 最近の質問・回答 */}
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-title">💬 最近の質問・回答</div>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>お客様とAIのやり取りを確認できます（個人情報は非表示）</p>

          {/* 会話アイテム1 */}
          <div 
            style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '12px', marginBottom: '8px', background: '#f9f9f9', cursor: 'pointer' }}
            onClick={() => toggleConversation('conv1')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>2024/01/15 14:30</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', background: '#2196F3', color: 'white', padding: '4px 8px', borderRadius: '8px' }}>🇯🇵</span>
                <span style={{ fontSize: '12px', background: '#4CAF50', color: 'white', padding: '4px 8px', borderRadius: '8px' }}>⭐5.0</span>
                <span style={{ fontSize: '12px', color: '#666' }}>3回</span>
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#333', marginBottom: '6px' }}>
              <span style={{ color: '#2196F3' }}>Q:</span> おすすめのメニューは何ですか？
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              <span style={{ color: '#4CAF50' }}>A:</span> 紅ズワイ蟹と福井の幸コースが人気です...
            </div>

            {expandedConv === 'conv1' && (
              <div style={{ marginTop: '8px', padding: '12px', background: 'white', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                <div style={{ fontSize: '13px', color: '#333', marginBottom: '12px', fontWeight: 600 }}>会話詳細</div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '4px', marginBottom: '8px', borderLeft: '3px solid #2196F3' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>お客様 (14:28):</div>
                    <div style={{ color: '#333', fontSize: '14px' }}>おすすめのメニューは何ですか？</div>
                  </div>
                  <div style={{ background: '#f1f8e9', padding: '10px', borderRadius: '4px', marginBottom: '8px', borderLeft: '3px solid #4CAF50' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>AI (14:28):</div>
                    <div style={{ color: '#333', fontSize: '14px' }}>当店では紅ズワイ蟹と福井の幸コースが人気です。蟹の旨味と地元の食材を組み合わせた特別なコースとなっております。</div>
                  </div>
                  <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '4px', marginBottom: '8px', borderLeft: '3px solid #2196F3' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>お客様 (14:29):</div>
                    <div style={{ color: '#333', fontSize: '14px' }}>値段はいくらですか？</div>
                  </div>
                  <div style={{ background: '#f1f8e9', padding: '10px', borderRadius: '4px', borderLeft: '3px solid #4CAF50' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>AI (14:29):</div>
                    <div style={{ color: '#333', fontSize: '14px' }}>コース料金は8,800円（税込）となっております。</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>
                  <div style={{ marginBottom: '4px' }}><strong>会話時間:</strong> 2分 | <strong>AI応答時間:</strong> 平均1.2秒</div>
                  <div><strong>質問タイプ:</strong> メニュー推奨 → 価格確認</div>
                </div>
              </div>
            )}
          </div>

          {/* 会話アイテム2 */}
          <div 
            style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '12px', marginBottom: '8px', background: '#f9f9f9', cursor: 'pointer' }}
            onClick={() => toggleConversation('conv2')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>2024/01/15 13:45</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', background: '#FF9800', color: 'white', padding: '4px 8px', borderRadius: '8px' }}>🇯🇵</span>
                <span style={{ fontSize: '12px', background: '#FF9800', color: 'white', padding: '4px 8px', borderRadius: '8px' }}>⭐4.0</span>
                <span style={{ fontSize: '12px', color: '#666' }}>2回</span>
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#333', marginBottom: '6px' }}>
              <span style={{ color: '#FF9800' }}>Q:</span> アレルギー対応はできますか？
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              <span style={{ color: '#4CAF50' }}>A:</span> はい、アレルギー対応は可能です...
            </div>

            {expandedConv === 'conv2' && (
              <div style={{ marginTop: '8px', padding: '8px', background: 'white', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', fontWeight: 600 }}>会話詳細</div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ background: '#e3f2fd', padding: '8px', borderRadius: '4px', marginBottom: '6px', borderLeft: '3px solid #FF9800' }}>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>お客様 (13:43):</div>
                    <div style={{ color: '#333', fontSize: '12px' }}>アレルギー対応はできますか？</div>
                  </div>
                  <div style={{ background: '#f1f8e9', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #4CAF50' }}>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>AI (13:43):</div>
                    <div style={{ color: '#333', fontSize: '12px' }}>はい、アレルギー対応は可能です。事前にお申し付けください。</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 会話アイテム3 */}
          <div 
            style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '12px', marginBottom: '8px', background: '#f9f9f9', cursor: 'pointer' }}
            onClick={() => toggleConversation('conv3')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>2024/01/15 12:20</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', background: '#9C27B0', color: 'white', padding: '4px 8px', borderRadius: '8px' }}>🇨🇳</span>
                <span style={{ fontSize: '12px', background: '#4CAF50', color: 'white', padding: '4px 8px', borderRadius: '8px' }}>⭐5.0</span>
                <span style={{ fontSize: '12px', color: '#666' }}>1回</span>
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#333', marginBottom: '6px' }}>
              <span style={{ color: '#9C27B0' }}>Q:</span> 個室はありますか？
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              <span style={{ color: '#4CAF50' }}>A:</span> はい、個室をご用意しております...
            </div>

            {expandedConv === 'conv3' && (
              <div style={{ marginTop: '8px', padding: '8px', background: 'white', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', fontWeight: 600 }}>会話詳細</div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ background: '#e3f2fd', padding: '8px', borderRadius: '4px', marginBottom: '6px', borderLeft: '3px solid #9C27B0' }}>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>お客様 (12:18):</div>
                    <div style={{ color: '#333', fontSize: '12px' }}>個室はありますか？</div>
                  </div>
                  <div style={{ background: '#f1f8e9', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #4CAF50' }}>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>AI (12:18):</div>
                    <div style={{ color: '#333', fontSize: '12px' }}>はい、個室をご用意しております。2名様から10名様まで対応可能です。</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '15px' }}>すべての会話を見る</button>
        </div>

        {/* お客様の満足度 */}
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-title">⭐ お客様の満足度</div>
          <div style={{ fontSize: '48px', fontWeight: 700, color: '#667eea', margin: '12px 0' }}>4.5 / 5.0</div>
          <div style={{ fontSize: '24px', marginBottom: '15px' }}>⭐⭐⭐⭐☆</div>
          <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '10px', borderRadius: '5px' }}>
            💡 お客様の反応は良好です
          </div>
        </div>

        {/* 今月のおすすめアクション */}
        <div className="card" style={{ marginTop: '16px', background: '#FFF3E0' }}>
          <div className="card-title">💡 今月のおすすめアクション</div>
          <div style={{ marginBottom: '15px', padding: '15px', background: 'white', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>1. 🌟 中国語のお客様が増加中</div>
            <div style={{ color: '#666', marginBottom: '10px' }}>→ 中国語メニューを充実させる</div>
            <button className="btn btn-primary btn-small">今すぐ改善</button>
          </div>
          <div style={{ marginBottom: '15px', padding: '15px', background: 'white', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>2. ⚠️ アレルギー質問への回答精度が低い</div>
            <div style={{ color: '#666', marginBottom: '10px' }}>→ 原材料情報を追加</div>
            <button className="btn btn-primary btn-small">今すぐ改善</button>
          </div>
          <div style={{ padding: '15px', background: 'white', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>3. 📱 19:00がピークタイム</div>
            <div style={{ color: '#666' }}>→ 18:00にSNS投稿すると効果的</div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .section {
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: #333;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1a1a1a;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .stat-card {
          background: white;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .stat-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .btn {
          border: none;
          border-radius: 6px;
          padding: 10px 20px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: white;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}

function AdminDashboard() {
  const [period, setPeriod] = useState('this-month')

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 className="card-title" style={{ fontSize: '24px', margin: 0 }}>👑 プラットフォームオーナーダッシュボード - 全レストラン統合</h2>
        <select 
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px', background: 'white', color: '#333', minWidth: '120px' }}
        >
          <option value="today">今日</option>
          <option value="yesterday">昨日</option>
          <option value="this-week">今週</option>
          <option value="last-week">先週</option>
          <option value="this-month">今月</option>
          <option value="last-month">先月</option>
          <option value="last-3months">過去3ヶ月</option>
          <option value="last-6months">過去6ヶ月</option>
          <option value="custom">カスタム</option>
        </select>
      </div>

      {/* サービス全体の健全性 */}
      <div className="card">
        <div className="card-title">📊 サービス全体の健全性</div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">導入レストラン数</div>
            <div className="stat-value">1,247</div>
            <div style={{ fontSize: '14px', color: '#666' }}>レストラン</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '14px', opacity: 0.9 }}>有料プラン</div>
            <div style={{ fontSize: '32px', fontWeight: 700, margin: '5px 0' }}>523</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>42%</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '14px', opacity: 0.9 }}>MRR</div>
            <div style={{ fontSize: '32px', fontWeight: 700, margin: '5px 0' }}>¥1.7M</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>ARR: ¥20.7M</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '14px', opacity: 0.9 }}>解約率</div>
            <div style={{ fontSize: '32px', fontWeight: 700, margin: '5px 0' }}>1.0%</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>✅ 良好</div>
          </div>
        </div>
      </div>

      {/* システムパフォーマンス */}
      <div className="card">
        <div className="card-title">⚡ システムパフォーマンス</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', background: '#E8F5E9', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '5px' }}>API応答時間</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2E7D32' }}>1.2秒</div>
            <div style={{ fontSize: '12px', color: '#666' }}>平均</div>
          </div>
          <div style={{ padding: '15px', background: '#E8F5E9', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '5px' }}>エラー率</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2E7D32' }}>0.3%</div>
            <div style={{ fontSize: '12px', color: '#666' }}>✅ 良好</div>
          </div>
          <div style={{ padding: '15px', background: '#E8F5E9', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '5px' }}>稼働率</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2E7D32' }}>99.97%</div>
            <div style={{ fontSize: '12px', color: '#666' }}>✅ 良好</div>
          </div>
          <div style={{ padding: '15px', background: '#E3F2FD', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '5px' }}>AI応答成功率</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1976D2' }}>94.2%</div>
            <div style={{ fontSize: '12px', color: '#666' }}>画像認識: 96.8%</div>
          </div>
        </div>
      </div>

      {/* ユーザー行動分析 */}
      <div className="card">
        <div className="card-title">📊 ユーザー行動分析（全レストラン統合）</div>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 600, marginBottom: '10px' }}>総利用状況</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <div style={{ color: '#666', fontSize: '14px' }}>総QRスキャン数/月</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#667eea' }}>1,876,543</div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '14px' }}>総質問数/月</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#667eea' }}>1,456,234</div>
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: 600, marginBottom: '10px' }}>ファネル分析（全体平均）</div>
          {[
            { label: 'QRスキャン', value: 100, color: 'high' },
            { label: 'アプリ起動', value: 83, color: 'high' },
            { label: '言語選択完了', value: 79, color: 'high' },
            { label: 'チャット開始', value: 71, color: 'medium' },
            { label: '複数質問', value: 51, color: 'medium' },
          ].map((item, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>{item.label}</span>
                <span>{item.value}%</span>
              </div>
              <div className="confidence-bar">
                <div className={`confidence-fill confidence-${item.color}`} style={{ width: `${item.value}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#FFF3E0', padding: '15px', borderRadius: '8px' }}>
          <div style={{ fontWeight: 600, marginBottom: '10px' }}>⚠️ 離脱ポイント分析</div>
          <div style={{ marginBottom: '8px' }}>• 言語選択で4%が離脱 → UIの改善が必要</div>
          <div>• チャット画面で8%が離脱 → UIの改善が必要</div>
        </div>
      </div>

      {/* エンゲージメント分析 */}
      <div className="card">
        <div className="card-title">🎯 エンゲージメント分析</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ padding: '15px', background: '#E8F5E9', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '10px' }}>✅ 高エンゲージレストラン（上位20%）</div>
            <div style={{ fontSize: '14px', marginBottom: '5px' }}>• 平均質問数: 2.8回/人</div>
            <div style={{ fontSize: '14px', marginBottom: '5px' }}>• 平均滞在: 5分18秒</div>
            <div style={{ fontSize: '14px', marginBottom: '10px' }}>• 満足度: 4.8/5.0</div>
            <div style={{ fontSize: '12px', color: '#2E7D32' }}>💡 これらのレストランの共通点を分析</div>
          </div>
          <div style={{ padding: '15px', background: '#FFEBEE', borderRadius: '8px' }}>
            <div style={{ fontWeight: 600, marginBottom: '10px' }}>⚠️ 低エンゲージレストラン（下位20%）</div>
            <div style={{ fontSize: '14px', marginBottom: '5px' }}>• 平均質問数: 0.6回/人</div>
            <div style={{ fontSize: '14px', marginBottom: '5px' }}>• 平均滞在: 1分12秒</div>
            <div style={{ fontSize: '14px', marginBottom: '10px' }}>• 満足度: 3.2/5.0</div>
            <div style={{ fontSize: '12px', color: '#C62828' }}>⚠️ 解約リスク: 介入が必要</div>
          </div>
        </div>
      </div>

      {/* 要注意レストラン */}
      <div className="card">
        <div className="card-title">🔍 要注意レストラン（解約リスク高）</div>
        <div style={{ marginBottom: '15px' }}>
          <input type="text" className="form-input" placeholder="レストラン名、レストランIDで検索..." style={{ marginBottom: '15px' }} />
        </div>
        <div style={{ background: '#FFEBEE', padding: '15px', borderRadius: '8px', marginBottom: '15px', borderLeft: '4px solid #F44336' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>🔴 レストランA（ID: A0123）</div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '3px' }}>• 質問数: -45% (先月比)</div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '3px' }}>• 最終ログイン: 14日前</div>
              <div style={{ fontSize: '14px', color: '#666' }}>• 満足度: 2.8/5.0</div>
            </div>
            <button className="btn btn-primary btn-small">今すぐフォロー</button>
          </div>
        </div>
        <div style={{ background: '#FFF3E0', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #FF9800' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '5px' }}>🟡 レストランB（ID: A0456）</div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '3px' }}>• 信頼度: 平均52% (低い)</div>
              <div style={{ fontSize: '14px', color: '#666' }}>• メニュー未登録: 75%</div>
            </div>
            <button className="btn btn-secondary btn-small">サポート案内を送る</button>
          </div>
        </div>
      </div>

      {/* プロダクト改善インサイト */}
      <div className="card">
        <div className="card-title">📈 プロダクト改善インサイト</div>
        <div style={{ background: '#E3F2FD', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
          <div style={{ fontWeight: 600, marginBottom: '5px' }}>1. 言語選択UIの離脱率が高い（4%）</div>
          <div style={{ fontSize: '14px', color: '#666' }}>→ 言語選択をスキップ可能にする？</div>
        </div>
        <div style={{ background: '#E3F2FD', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
          <div style={{ fontWeight: 600, marginBottom: '5px' }}>2. 英語の質問率が他言語より低い（65%）</div>
          <div style={{ fontSize: '14px', color: '#666' }}>→ 英語UIの改善が必要</div>
        </div>
        <div style={{ background: '#E3F2FD', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
          <div style={{ fontWeight: 600, marginBottom: '5px' }}>3. 画像認識の失敗が3.2%</div>
          <div style={{ fontSize: '14px', color: '#666' }}>→ 主な失敗: 暗い画像、ブレた画像</div>
          <div style={{ fontSize: '14px', color: '#666' }}>→ 撮影ガイドの表示を検討</div>
        </div>
        <div style={{ background: '#E3F2FD', padding: '15px', borderRadius: '8px' }}>
          <div style={{ fontWeight: 600, marginBottom: '5px' }}>4. 「へしこ」の認識精度が低い</div>
          <div style={{ fontSize: '14px', color: '#666' }}>→ 学習データの追加が必要</div>
        </div>
      </div>

      {/* ビジネス分析 */}
      <div className="card">
        <div className="card-title">💰 ビジネス分析</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>無料→有料の転換率</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>10.2%</div>
          </div>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>平均転換期間</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>2.3ヶ月</div>
          </div>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>平均継続期間</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>14.2ヶ月</div>
          </div>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>平均LTV</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#667eea' }}>¥46,860</div>
          </div>
        </div>
        
        <div style={{ background: '#E8F5E9', padding: '15px', borderRadius: '8px' }}>
          <div style={{ fontWeight: 600, marginBottom: '10px' }}>転換したレストランの共通点:</div>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>• 質問数が平均2.1回以上</div>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>• メニュー登録率80%以上</div>
          <div style={{ fontSize: '14px' }}>• 初月から積極的に利用</div>
        </div>
      </div>

      <style jsx>{`
        .card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .card-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1a1a1a;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .stat-card {
          background: white;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .stat-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
        }

        .confidence-bar {
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .confidence-high {
          background: linear-gradient(90deg, #28a745, #20c997);
        }

        .confidence-medium {
          background: linear-gradient(90deg, #ffc107, #fd7e14);
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

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  )
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<'store' | 'admin'>('admin')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged_in')
    if (!isLoggedIn) {
      router.push('/admin/login')
      return
    }
    const savedUserType = localStorage.getItem('admin_user_type')
    if (savedUserType === 'admin' || savedUserType === 'store') {
      setUserType(savedUserType)
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        zIndex: 9999
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #E5E7EB',
          borderTopColor: '#2563EB',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ marginTop: '16px', color: '#64748B', fontSize: '14px' }}>読み込み中...</div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <AdminLayout title={userType === 'store' ? 'OmiseAI レストラン管理システム' : 'OmiseAI プラットフォームオーナー管理システム'}>
      <div className="dashboard">
        {userType === 'store' ? <StoreDashboard /> : <AdminDashboard />}
      </div>

      <style jsx>{`
        .dashboard {
          max-width: 100%;
        }
      `}</style>
    </AdminLayout>
  )
}
