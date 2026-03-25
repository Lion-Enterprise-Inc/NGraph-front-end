"use client";

import { useState, useRef } from "react";
import type { QuickExplainItem } from "../services/api";

// レーダーチャート表示フラグ（機能成熟後にtrueに戻す）
const SHOW_TASTE_RADAR = false;

type Props = {
  items: QuickExplainItem[];
  language: string;
  likedMenus?: Set<string>;
  onLike?: (menuUid: string) => void;
  onSuggestEdit?: (info: { name_jp: string; menu_uid?: string }) => void;
  onPhotoUpload?: (menuUid: string, file: File) => void;
  photoUploading?: string | null;
  copy: {
    verified: string;
    aiEstimate: string;
    newItem: string;
    ingredients: string;
    allergens: string;
    restrictions: string;
    calories: string;
    confidence: string;
    texture: string;
    pairing: string;
    howToEat: string;
    servingStyle: string;
    kidFriendly: string;
    notKidFriendly: string;
    suggestEdit: string;
    tasteUmami: string;
    tasteSweetness: string;
    tasteSourness: string;
    tasteSaltiness: string;
    tasteBitterness: string;
    tasteSpiciness: string;
    tasteRichness: string;
    tasteLightness: string;
    tasteVolume: string;
    tasteLocality: string;
  };
};

const TASTE_AXES = ['umami','richness','saltiness','sweetness','spiciness','lightness','sourness','bitterness','volume','locality'] as const;

function TasteChart({ values, labels }: { values: Record<string, number>; labels: Record<string, string> }) {
  const N = TASTE_AXES.length;
  const R = 40;
  const pt = (i: number, rv: number) => {
    const a = (2 * Math.PI * i / N) - Math.PI / 2;
    return { x: rv * Math.cos(a), y: rv * Math.sin(a) };
  };
  const poly = (rv: number) => TASTE_AXES.map((_, i) => { const p = pt(i, rv); return `${p.x},${p.y}`; }).join(' ');
  const dataPoly = TASTE_AXES.map((a, i) => { const p = pt(i, R * (values[a] || 0) / 10); return `${p.x},${p.y}`; }).join(' ');
  const uid = `qe-fg-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="qe-taste-chart">
      <div className="qe-fg-label"><div className="qe-fg-dot" /> NFG</div>
      <svg viewBox="-58 -58 116 116" width="140" height="140">
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <polygon key={f} points={poly(R * f)} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        ))}
        {TASTE_AXES.map((_, i) => {
          const p = pt(i, R);
          return <line key={i} x1="0" y1="0" x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />;
        })}
        <polygon points={dataPoly} fill={`url(#${uid})`} stroke="#f97316" strokeWidth="1.2" />
        {TASTE_AXES.map((a, i) => {
          const p = pt(i, R + 14);
          const v = values[a] || 0;
          if (v === 0) return null;
          return (
            <text key={a} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
              fill="rgba(255,255,255,0.7)" fontSize="5" fontWeight="500">
              {labels[a] || a} {v * 10}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function QuickExplainCard({ items, language, likedMenus, onLike, onSuggestEdit, onPhotoUpload, photoUploading, copy }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<Set<number>>(new Set());
  const photoRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const toggle = (idx: number) => {
    setExpandedIdx((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const tasteLabels: Record<string, string> = {
    umami: copy.tasteUmami, richness: copy.tasteRichness,
    saltiness: copy.tasteSaltiness, sweetness: copy.tasteSweetness,
    spiciness: copy.tasteSpiciness, lightness: copy.tasteLightness,
    sourness: copy.tasteSourness, bitterness: copy.tasteBitterness,
    volume: copy.tasteVolume, locality: copy.tasteLocality,
  };

  return (
    <div className="qe-cards">
      {items.map((item, idx) => {
        const open = expandedIdx.has(idx);
        const isDb = item.source === "db";
        const displayName = language !== "ja" && item.name_en ? item.name_en : item.name_jp;
        const subName = language !== "ja" ? item.name_jp : item.name_en;
        const hasNfg = isDb && (item.narrative || item.taste_values || item.serving || item.restrictions?.length || item.estimated_calories);
        const hasDetails = item.allergens?.length || item.ingredients?.length || hasNfg;
        const liked = item.menu_uid ? likedMenus?.has(item.menu_uid) : false;

        return (
          <div key={idx} className="qe-card" onClick={() => toggle(idx)}>
            {/* Header row: number + name + price + badges + like */}
            <div className="qe-card-main">
              <div className="qe-card-left">
                <div className="qe-card-name">
                  <span className="qe-card-number">{idx + 1}.</span>
                  {displayName}
                </div>
                {subName && <div className="qe-card-subname">{subName}</div>}
                {item.price > 0 && (
                  <div className="qe-card-price">¥{item.price.toLocaleString()}</div>
                )}
              </div>
              <div className="qe-card-right">
                {item.category && (
                  <span className="qe-badge qe-badge-category">{item.category}</span>
                )}
                {isDb ? (
                  <span className="qe-badge qe-badge-verified">{copy.verified}</span>
                ) : (
                  <span className="qe-badge qe-badge-ai">{copy.aiEstimate}</span>
                )}
                {item.is_new && (
                  <span className="qe-badge qe-badge-new">{copy.newItem}</span>
                )}
                {item.menu_uid && onLike && (
                  <button
                    type="button"
                    className={`qe-like-btn${liked ? ' liked' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onLike(item.menu_uid!); }}
                  >
                    {liked ? '♥' : '♡'}
                  </button>
                )}
              </div>
            </div>
            <div className="qe-card-desc">{item.description}</div>
            {item.description_local && language !== "ja" && (
              <div className="qe-card-desc-local">{item.description_local}</div>
            )}
            {open && (
              <div className="qe-card-details">
                {/* 画像 */}
                {item.image_url && (
                  <div className="qe-card-image">
                    <img src={item.image_url} alt={item.name_jp} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                {/* 味チャート */}
                {SHOW_TASTE_RADAR && item.taste_values && Object.keys(item.taste_values).length > 0 && (
                  <TasteChart values={item.taste_values} labels={tasteLabels} />
                )}
                {/* Narrative */}
                {item.narrative && (
                  <div className="qe-narrative">
                    {item.narrative.story && (
                      <div className="qe-narrative-story">{item.narrative.story}</div>
                    )}
                    {item.narrative.texture && (
                      <div className="qe-field">
                        <span className="qe-field-label">{copy.texture}</span>
                        <span className="qe-field-value">{item.narrative.texture}</span>
                      </div>
                    )}
                    {item.narrative.how_to_eat && (
                      <div className="qe-field">
                        <span className="qe-field-label">{copy.howToEat}</span>
                        <span className="qe-field-value">{item.narrative.how_to_eat}</span>
                      </div>
                    )}
                    {item.narrative.pairing && (
                      <div className="qe-field">
                        <span className="qe-field-label">{copy.pairing}</span>
                        <span className="qe-field-value">{item.narrative.pairing}</span>
                      </div>
                    )}
                    {item.narrative.kid_friendly != null && (
                      <div className="qe-field">
                        <span className="qe-field-label">
                          {item.narrative.kid_friendly ? copy.kidFriendly : copy.notKidFriendly}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {/* Serving */}
                {item.serving && (item.serving.style || item.serving.portion || item.serving.temperature) && (
                  <div className="qe-field">
                    <span className="qe-field-label">{copy.servingStyle}</span>
                    <span className="qe-field-value">
                      {[item.serving.style, item.serving.portion, item.serving.temperature].filter(Boolean).join(' / ')}
                    </span>
                  </div>
                )}
                {/* Allergens */}
                {item.allergens && item.allergens.length > 0 && (
                  <div className="qe-field">
                    <span className="qe-field-label">{copy.allergens}</span>
                    <span className="qe-field-value">{item.allergens.join(language === 'ja' ? '、' : ', ')}</span>
                  </div>
                )}
                {/* Ingredients */}
                {item.ingredients && item.ingredients.length > 0 && (
                  <div className="qe-field">
                    <span className="qe-field-label">{copy.ingredients}</span>
                    <span className="qe-field-value">{item.ingredients.join(language === 'ja' ? '、' : ', ')}</span>
                  </div>
                )}
                {/* Restrictions */}
                {item.restrictions && item.restrictions.length > 0 && (
                  <div className="qe-field">
                    <span className="qe-field-label">{copy.restrictions}</span>
                    <span className="qe-field-value">{item.restrictions.join(language === 'ja' ? '、' : ', ')}</span>
                  </div>
                )}
                {/* Calories */}
                {item.estimated_calories && (
                  <div className="qe-field">
                    <span className="qe-field-label">{copy.calories}</span>
                    <span className="qe-field-value">{item.estimated_calories}</span>
                  </div>
                )}
                {/* Confidence */}
                {item.confidence != null && item.confidence > 0 && (
                  <div className="qe-field">
                    <span className="qe-field-label">{copy.confidence}</span>
                    <span className="qe-field-value">{item.confidence}%</span>
                  </div>
                )}
                {/* Action row: photo upload + suggest edit */}
                {item.menu_uid && (
                  <div className="qe-card-actions">
                    {!item.image_url && onPhotoUpload && (
                      <>
                        <input
                          ref={el => { photoRefs.current[item.menu_uid!] = el; }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          capture="environment"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && item.menu_uid) onPhotoUpload(item.menu_uid, file);
                            e.target.value = '';
                          }}
                        />
                        <button
                          type="button"
                          className="qe-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!photoUploading) photoRefs.current[item.menu_uid!]?.click();
                          }}
                        >
                          {photoUploading === item.menu_uid ? '...' : '📷'}
                        </button>
                      </>
                    )}
                    {onSuggestEdit && (
                      <button
                        type="button"
                        className="qe-action-btn qe-action-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSuggestEdit({ name_jp: item.name_jp, menu_uid: item.menu_uid });
                        }}
                      >
                        {copy.suggestEdit}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {!open && hasDetails && (
              <div className="qe-card-expand-hint">▼</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
