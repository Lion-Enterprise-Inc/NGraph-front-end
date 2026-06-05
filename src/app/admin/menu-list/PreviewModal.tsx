'use client'

import { DISH_CATEGORIES } from '../../../services/api'
import type { MenuItem } from './page'
import { getMissingFields } from './menuHelpers'
import { useAdminLang } from '../../../hooks/useAdminLang'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  item: MenuItem | null
  onEdit: (item: MenuItem) => void
  onApprove?: (item: MenuItem) => Promise<void> | void
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

function FieldRow({ label, value, missing, notSetLabel }: { label: string; value?: string | null; missing?: boolean; notSetLabel: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 13 }}>
      <span style={{ color: '#94A3B8', minWidth: 80, flexShrink: 0 }}>{label}</span>
      {missing ? (
        <span style={{ color: '#EF4444', fontStyle: 'italic' }}>{notSetLabel}</span>
      ) : (
        <span style={{ color: '#E2E8F0' }}>{value}</span>
      )}
    </div>
  )
}

export default function PreviewModal({ isOpen, onClose, item, onEdit, onApprove }: PreviewModalProps) {
  const { lang, t } = useAdminLang()
  if (!isOpen || !item) return null

  const NARRATIVE_LABELS: Record<string, string> = {
    story: t.menuList.pvNarrativeStory,
    chef_note: t.menuList.pvNarrativeChefNote,
    tasting_note: t.menuList.pvNarrativeTastingNote,
    pairing_suggestion: t.menuList.pvNarrativePairing,
    seasonal_note: t.menuList.pvNarrativeSeasonal,
  }
  const SERVING_LABELS: Record<string, string> = {
    size: t.menuList.pvServingSize,
    availability: t.menuList.pvServingAvailability,
    style: t.menuList.pvServingStyle,
    temperature: t.menuList.pvServingTemperature,
  }

  const confidence = item.confidenceScore
  const confidenceColor = confidence >= 75 ? '#10B981' : confidence >= 50 ? '#F59E0B' : '#EF4444'
  const rank = item.verificationRank
  const rankColor = rank === 'S' ? '#10B981' : rank === 'A' ? '#10B981' : rank === 'B' ? '#3B82F6' : rank === 'C' ? '#F59E0B' : '#64748B'
  const rankLabel = rank === 'S' ? t.menuList.pvRankS : rank === 'A' ? t.menuList.pvRankA : rank === 'B' ? t.menuList.pvRankB : rank === 'C' ? t.menuList.pvRankC : t.menuList.pvRankUnknown

  const narrative = item.narrative || {}
  const serving = item.serving || {}
  const narrativeEntries = Object.entries(narrative).filter(([, v]) => v)
  const servingEntries = Object.entries(serving).filter(([, v]) => v)

  const missingFields = getMissingFields(item, t).map(f => f.label)

  return (
    <div className="modal active">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>

        {/* Image */}
        {item.imageUrl && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <img
              src={item.imageUrl}
              alt={item.name}
              style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 10, objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}

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

        {/* Confidence + Rank */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 12, background: '#0F172A', borderRadius: 8 }}>
          {rank && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: rankColor, lineHeight: 1 }}>{rank}</span>
              <span style={{ fontSize: 9, color: rankColor, marginTop: 2 }}>{rankLabel}</span>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: '#94A3B8' }} title={t.menuList.pvCompletenessHint}>{t.menuList.pvDataCompleteness}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: confidenceColor }}>{confidence}%</span>
            </div>
            <div style={{ height: 6, background: '#1E293B', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${confidence}%`, background: confidenceColor, borderRadius: 3 }} />
            </div>
            {item.verifiedAt && (
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                {new Date(item.verifiedAt).toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US')} {t.menuList.pvApprovedAt}
                {item.verifiedBy && <span style={{ marginLeft: 6 }}>by {item.verifiedBy.slice(0, 8)}…</span>}
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'right' }}>
            {item.dataSource === 'owner_verified' ? (
              <span style={{ color: '#10B981' }}>{t.menuList.pvDataSourceOwner}</span>
            ) : item.dataSource === 'official_published' ? (
              <span style={{ color: '#10B981' }}>{t.menuList.pvDataSourceOfficial}</span>
            ) : item.dataSource === 'ai_inferred' ? (
              <span style={{ color: '#F59E0B' }}>{t.menuList.pvDataSourceAi}</span>
            ) : (
              <span>{item.dataSource || t.menuList.pvDataSourceUncat}</span>
            )}
            {item.status && <div style={{ color: '#10B981', marginTop: 2 }}>{t.menuList.pvPublished}</div>}
          </div>
        </div>

        {/* Product URL */}
        {item.productUrl && (
          <div style={{ marginBottom: 16 }}>
            <a href={item.productUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#667eea', textDecoration: 'none' }}>
              {t.menuList.pvOpenProductPage}
            </a>
          </div>
        )}

        {/* Description */}
        <Section title={t.menuList.pvSectionDescription}>
          {item.description ? (
            <div style={{ fontSize: 14, color: '#E2E8F0', lineHeight: 1.6 }}>{item.description}</div>
          ) : (
            <div style={{ fontSize: 13, color: '#EF4444', fontStyle: 'italic' }}>{t.menuList.pvNotSet}</div>
          )}
          {item.descriptionEn && (
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 6, fontStyle: 'italic' }}>{item.descriptionEn}</div>
          )}
        </Section>

        {/* Ingredients & Allergens side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Section title={t.menuList.pvSectionIngredients}>
            {item.ingredients && item.ingredients.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {item.ingredients.map(ing => <Tag key={ing.uid || ing.name} label={ing.name} />)}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#EF4444', fontStyle: 'italic' }}>{t.menuList.pvNotSet}</div>
            )}
          </Section>
          <Section title={t.menuList.pvSectionAllergens}>
            {item.allergens && item.allergens.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {item.allergens.map(a => <Tag key={a.uid} label={a.name_jp || a.name_en} color="#7F1D1D" />)}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#EF4444', fontStyle: 'italic' }}>{t.menuList.pvNotSet}</div>
            )}
          </Section>
        </div>

        {/* Cooking Methods & Restrictions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Section title={t.menuList.pvSectionCooking}>
            {item.cookingMethods && item.cookingMethods.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {item.cookingMethods.map(cm => <Tag key={cm.uid} label={cm.name_jp} color="#1E3A5F" />)}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>{t.menuList.pvNotSet}</div>
            )}
          </Section>
          <Section title={t.menuList.pvSectionRestrictions}>
            {item.restrictions && item.restrictions.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {item.restrictions.map(r => <Tag key={r.uid} label={r.name_jp} color="#4A1D6E" />)}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>{t.menuList.pvNone}</div>
            )}
          </Section>
        </div>

        {/* Narrative */}
        {narrativeEntries.length > 0 && (
          <Section title={t.menuList.pvSectionNarrative}>
            <div style={{ background: '#0F172A', borderRadius: 8, padding: 12 }}>
              {narrativeEntries.map(([key, val]) => (
                <FieldRow key={key} label={NARRATIVE_LABELS[key] || key} value={String(val)} notSetLabel={t.menuList.pvNotSet} />
              ))}
            </div>
          </Section>
        )}

        {/* Serving */}
        {servingEntries.length > 0 && (
          <Section title={t.menuList.pvSectionServing}>
            <div style={{ background: '#0F172A', borderRadius: 8, padding: 12 }}>
              {servingEntries.map(([key, val]) => (
                <FieldRow key={key} label={SERVING_LABELS[key] || key} value={String(val)} notSetLabel={t.menuList.pvNotSet} />
              ))}
            </div>
          </Section>
        )}

        {/* Featured Tags */}
        {item.featuredTags && item.featuredTags.length > 0 && (
          <Section title={t.menuList.pvSectionFeaturedTags}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {item.featuredTags.map(tag => <Tag key={tag} label={tag} color="#7C3AED" />)}
            </div>
          </Section>
        )}

        {/* Missing fields warning */}
        {missingFields.length > 0 && (
          <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#EF4444', marginBottom: 6 }}>{t.menuList.pvMissingFields(missingFields.length)}</div>
            <div style={{ fontSize: 12, color: '#FCA5A5' }}>{missingFields.join(' / ')}</div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { onClose(); onEdit(item); }}>
            {t.menuList.pvEditBtn}
          </button>
          {onApprove && rank !== 'S' && (
            <button
              className="btn btn-approve"
              onClick={async () => {
                if (confirm(t.menuList.pvVerifyOwnerConfirm(item.name))) {
                  await onApprove(item);
                  onClose();
                }
              }}
              title={t.menuList.pvVerifyOwnerTitle}
            >
              {t.menuList.pvVerifyOwnerBtn}
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            {t.menuList.pvCloseBtn}
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

        .btn-approve {
          background: #10B981;
          color: white;
        }

        .btn-approve:hover {
          background: #059669;
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
