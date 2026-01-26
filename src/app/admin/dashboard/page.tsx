'use client'

import { useState } from 'react'
import AdminLayout from '../../../components/admin/AdminLayout'

export default function StoreDashboardPage() {
  const [expandedConv, setExpandedConv] = useState<string | null>(null)

  const toggleConversation = (id: string) => {
    setExpandedConv(expandedConv === id ? null : id)
  }

  return (
    <AdminLayout title="NGraph 店舗管理システム">
      <section className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>📊 店舗ダッシュボード</h2>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>AIスタッフの稼働状況や改善アクションを一目で把握できます。</p>
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
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.18)', 
              transition: 'background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease'
            }}
          >
            💎 プランを確認する
          </button>
        </div>

        {/* 集客効果 */}
        <div className="card">
          <div className="card-title">📈 集客効果</div>
          <div className="dashboard-metrics">
            <div className="stat-card">
              <div className="stat-label">📱 QRスキャン数</div>
              <div className="stat-value">1,500</div>
              <div style={{ fontSize: '14px', color: '#10b981' }}>+12% vs 先月 ↗</div>
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8, lineHeight: 1.4 }}>💡 看板やテーブルのQRが活用されています</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">💬 質問数</div>
              <div className="stat-value">1,247</div>
              <div style={{ fontSize: '14px', color: '#10b981' }}>+8% vs 先月 ↗</div>
              <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8, lineHeight: 1.4 }}>💡 お客様の関心が高まっています</div>
            </div>
          </div>
        </div>

        {/* 店舗パフォーマンス */}
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-title">📊 店舗パフォーマンス</div>
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
                      <div style={{ background: item.gradient, width: `${item.pct}%`, height: '100%', transition: 'width 0.5s' }}></div>
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
            className="conversation-item" 
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
                    <div style={{ color: '#333', fontSize: '14px' }}>コース料金は8,800円（税込）となっております。前菜からデザートまで12品の充実した内容です。</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>
                  <div style={{ marginBottom: '4px' }}><strong>会話時間:</strong> 2分 | <strong>AI応答時間:</strong> 平均1.2秒</div>
                  <div style={{ marginBottom: '4px' }}><strong>ユーザー:</strong> 匿名 (ID: U****123) | <strong>デバイス:</strong> iOS</div>
                  <div><strong>質問タイプ:</strong> メニュー推奨 → 価格確認 → 予約</div>
                </div>
              </div>
            )}
          </div>

          {/* 会話アイテム2 */}
          <div 
            className="conversation-item" 
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
                    <div style={{ color: '#333', fontSize: '12px' }}>はい、アレルギー対応は可能です。事前にお申し付けいただければ、食材を調整いたします。</div>
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: '#666', lineHeight: 1.4 }}>
                  <div style={{ marginBottom: '3px' }}><strong>会話時間:</strong> 2分 | <strong>AI応答時間:</strong> 0.8秒</div>
                  <div><strong>質問タイプ:</strong> アレルギー対応確認</div>
                </div>
              </div>
            )}
          </div>

          {/* 会話アイテム3 */}
          <div 
            className="conversation-item" 
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
                <div style={{ fontSize: '10px', color: '#666', lineHeight: 1.4 }}>
                  <div><strong>質問タイプ:</strong> 施設情報</div>
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

        .dashboard-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
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
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #5a6268;
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
          .stats-grid,
          .dashboard-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AdminLayout>
  )
}
