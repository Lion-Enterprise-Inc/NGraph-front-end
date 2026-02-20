'use client'

import { DISH_CATEGORIES } from '../../../services/api'
import type { MenuItem } from './page'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  item: MenuItem | null
  onEdit: (item: MenuItem) => void
}

const NARRATIVE_LABELS: Record<string, string> = {
  story: '料理のストーリー',
  chef_note: 'シェフのこだわり',
  tasting_note: '味わいの特徴',
  pairing_suggestion: 'おすすめの組み合わせ',
  seasonal_note: '季節のポイント',
}

const SERVING_LABELS: Record<string, string> = {
  size: '量・サイズ',
  availability: '提供条件',
  style: '提供スタイル',
  temperature: '提供温度',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

function Tag({ label, color = '#334155' }: { label: string; color?: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', background: color, borderRadius: 12, fontSize: 12, color: '#F8FAFC', marginRight: 6, marginBottom: 4 }}>
      {label}
    </span>
  )
}

function FieldRow({ label, value, missing }: { label: string; value?: string | null; missing?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 13 }}>
      <span style={{ color: '#94A3B8', minWidth: 80, flexShrink: 0 }}>{label}</span>
      {missing ? (
        <span style={{ color: '#EF4444', fontStyle: 'italic' }}>未設定</span>
      ) : (
        <span style={{ color: '#E2E8F0' }}>{value}</span>
      )}
    </div>
  )
}

export default function PreviewModal({ isOpen, onClose, item, onEdit }: PreviewModalProps) {
  if (!isOpen || !item) return null

  const confidence = item.confidenceScore
  const confidenceColor = confidence >= 75 ? '#10B981' : confidence >= 50 ? '#F59E0B' : '#EF4444'

  const narrative = item.narrative || {}
  const serving = item.serving || {}
  const narrativeEntries = Object.entries(narrative).filter(([, v]) => v)
  const servingEntries = Object.entries(serving).filter(([, v]) => v)

  const missingFields: string[] = []
  if (!item.nameEn) missingFields.push('英語名')
  if (!item.description) missingFields.push('説明文')
  if (!item.ingredients || item.ingredients.length === 0) missingFields.push('原材料')
  if (!item.allergens || item.allergens.length === 0) missingFields.push('アレルゲン')
  if (narrativeEntries.length === 0) missingFields.push('ナラティブ')
  if (servingEntries.length === 0) missingFields.push('提供情報')
  if (!item.cookingMethods || item.cookingMethods.length === 0) missingFields.push('調理法')

  return (
    <div className="modal active">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', margin: 0, marginBottom: 4 }}>{item.name}</h2>
            {item.nameEn && <div style={{ fontSize: 14, color: '#94A3B8', fontStyle: 'italic' }}>{item.nameEn}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#667eea' }}>&yen;{item.price.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>{DISH_CATEGORIES[item.category] || item.category}</div>
          </div>
        </div>

        {/* Confidence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 12, background: '#0F172A', borderRadius: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: '#94A3B8' }}>データ信頼度</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: confidenceColor }}>{confidence}%</span>
            </div>
            <div style={{ height: 6, background: '#1E293B', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${confidence}%`, background: confidenceColor, borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'right' }}>
            {item.dataSource === 'owner_verified' ? (
              <span style={{ color: '#10B981' }}>店主確認済み</span>
            ) : item.dataSource === 'ai_inferred' ? (
              <span style={{ color: '#F59E0B' }}>AI推定</span>
            ) : (
              <span>{item.dataSource || '未分類'}</span>
            )}
            {item.status && <div style={{ color: '#10B981', marginTop: 2 }}>承認済み</div>}
          </div>
        </div>

        {/* Description */}
        <Section title="説明文">
          {item.description ? (
            <div style={{ fontSize: 14, color: '#E2E8F0', lineHeight: 1.6 }}>{item.description}</div>
          ) : (
            <div style={{ fontSize: 13, color: '#EF4444', fontStyle: 'italic' }}>未設定</div>
          )}
          {item.descriptionEn && (
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 6, fontStyle: 'italic' }}>{item.descriptionEn}</div>
          )}
        </Section>

        {/* Ingredients & Allergens side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Section title="原材料">
            {item.ingredients && item.ingredients.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {item.ingredients.map(ing => <Tag key={ing.uid || ing.name} label={ing.name} />)}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#EF4444', fontStyle: 'italic' }}>未設定</div>
            )}
          </Section>
          <Section title="アレルゲン">
            {item.allergens && item.allergens.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {item.allergens.map(a => <Tag key={a.uid} label={a.name_jp || a.name_en} color="#7F1D1D" />)}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#EF4444', fontStyle: 'italic' }}>未設定</div>
            )}
          </Section>
        </div>

        {/* Cooking Methods & Restrictions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Section title="調理法">
            {item.cookingMethods && item.cookingMethods.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {item.cookingMethods.map(cm => <Tag key={cm.uid} label={cm.name_jp} color="#1E3A5F" />)}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>未設定</div>
            )}
          </Section>
          <Section title="食事制限">
            {item.restrictions && item.restrictions.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {item.restrictions.map(r => <Tag key={r.uid} label={r.name_jp} color="#4A1D6E" />)}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>なし</div>
            )}
          </Section>
        </div>

        {/* Narrative */}
        {narrativeEntries.length > 0 && (
          <Section title="ナラティブ（NFG）">
            <div style={{ background: '#0F172A', borderRadius: 8, padding: 12 }}>
              {narrativeEntries.map(([key, val]) => (
                <FieldRow key={key} label={NARRATIVE_LABELS[key] || key} value={String(val)} />
              ))}
            </div>
          </Section>
        )}

        {/* Serving */}
        {servingEntries.length > 0 && (
          <Section title="提供情報">
            <div style={{ background: '#0F172A', borderRadius: 8, padding: 12 }}>
              {servingEntries.map(([key, val]) => (
                <FieldRow key={key} label={SERVING_LABELS[key] || key} value={String(val)} />
              ))}
            </div>
          </Section>
        )}

        {/* Missing fields warning */}
        {missingFields.length > 0 && (
          <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#EF4444', marginBottom: 6 }}>未設定の項目 ({missingFields.length})</div>
            <div style={{ fontSize: 12, color: '#FCA5A5' }}>{missingFields.join(' / ')}</div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary" onClick={() => { onClose(); onEdit(item); }}>
            編集する
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal.active {
          display: flex;
        }

        .modal-content {
          background: var(--bg-surface);
          border-radius: 12px;
          padding: 24px;
          max-width: 640px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          border: 1px solid var(--border);
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--muted);
        }

        .modal-close:hover {
          color: var(--text);
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
          background: #334155;
          color: #E2E8F0;
        }

        .btn-secondary:hover {
          background: #475569;
        }

        @media (max-width: 640px) {
          .modal {
            padding: 0;
          }
          .modal-content {
            max-height: 100dvh;
            height: 100dvh;
            border-radius: 0;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
