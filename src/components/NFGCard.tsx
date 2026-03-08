"use client";

import { useState, useRef } from "react";
import type { QuickExplainItem } from "../services/api";

type Props = {
  items: QuickExplainItem[];
  language: string;
  likedMenus?: Set<string>;
  onLike?: (menuUid: string) => void;
  onSuggestEdit?: (info: { name_jp: string; menu_uid?: string }) => void;
  onPhotoUpload?: (menuUid: string, file: File) => void;
  photoUploading?: string | null;
  userPhoto?: string;
  restaurantName?: string;
  restaurantCity?: string;
  showRestaurantInfo?: boolean;
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

const AXIS_COLORS: Record<string, string> = {
  umami: "#00e896", richness: "#e8c050", saltiness: "#a0a0ff", sweetness: "#f0a050",
  spiciness: "#ff6b4a", lightness: "#80d0ff", sourness: "#50c8f0", bitterness: "#80c080",
  volume: "#c080ff", locality: "#ff80a0",
};

function TasteChart({ values, labels }: { values: Record<string, number>; labels: Record<string, string> }) {
  const N = TASTE_AXES.length;
  const R = 88;
  const pt = (i: number, rv: number) => {
    const a = (2 * Math.PI * i / N) - Math.PI / 2;
    return { x: rv * Math.cos(a), y: rv * Math.sin(a) };
  };
  const poly = (rv: number) => TASTE_AXES.map((_, i) => { const p = pt(i, rv); return `${p.x},${p.y}`; }).join(' ');
  const dataPoly = TASTE_AXES.map((a, i) => { const p = pt(i, R * (values[a] || 0) / 10); return `${p.x},${p.y}`; }).join(' ');
  const uid = `nfg-fg-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="nfgcard-taste-chart">
      <div className="nfgcard-fg-label"><div className="nfgcard-fg-dot" /> NFG</div>
      <svg viewBox="-110 -110 220 220" style={{ width: '100%', maxWidth: 220 }}>
        <defs>
          <radialGradient id={`rg-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00e896" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00e896" stopOpacity="0.03" />
          </radialGradient>
          <filter id={`glow-${uid}`}><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {[0.25, 0.5, 0.75, 1].map(f => (
          <polygon key={f} points={poly(R * f)} fill="none" stroke={f === 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"} strokeWidth="0.5" />
        ))}
        {TASTE_AXES.map((_, i) => {
          const p = pt(i, R);
          return <line key={i} x1="0" y1="0" x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />;
        })}
        <polygon points={dataPoly} fill={`url(#rg-${uid})`} stroke="#00e896" strokeWidth="1.5" strokeLinejoin="round" filter={`url(#glow-${uid})`} />
        {TASTE_AXES.map((a, i) => {
          const v = (values[a] || 0) / 10;
          const active = v > 0.3;
          const p = pt(i, R * v);
          return <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={active ? 3.5 : 2} fill={active ? AXIS_COLORS[a] : "#888"} stroke="#0d0d0d" strokeWidth="1" />;
        })}
        {TASTE_AXES.map((a, i) => {
          const v = (values[a] || 0) / 10;
          const active = v > 0.3;
          const p = pt(i, R * 1.22);
          return (
            <text key={`lbl-${i}`} x={p.x} y={p.y + 3.5} textAnchor="middle" fontFamily="'DM Mono',monospace"
              fontSize={active ? 10.5 : 9} fill={active ? AXIS_COLORS[a] : "#888"}>
              {labels[a] || a}{active ? ` ${Math.round(v * 100)}` : ''}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function NFGCard({
  items, language, likedMenus, onLike, onSuggestEdit, onPhotoUpload,
  photoUploading, userPhoto, restaurantName, restaurantCity, showRestaurantInfo, copy,
}: Props) {
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

  const sep = language === 'ja' ? '\u3001' : ', ';

  return (
    <div className="nfgcard-list">
      {/* User photo */}
      {userPhoto && (
        <div className="nfgcard-user-photo">
          <img src={userPhoto} alt="Your photo" loading="lazy" />
        </div>
      )}

      {items.map((item, idx) => {
        const open = expandedIdx.has(idx);
        const isDb = item.source === "db";
        const displayName = language !== "ja" && item.name_en ? item.name_en : item.name_jp;
        const subName = language !== "ja" ? item.name_jp : item.name_en;
        const hasNfg = isDb && (item.narrative || item.taste_values || item.serving || item.estimated_calories);
        const hasDetails = hasNfg;
        const liked = item.menu_uid ? likedMenus?.has(item.menu_uid) : false;

        return (
          <div key={idx} className={`nfgcard${open ? ' nfgcard-open' : ''}`} onClick={() => toggle(idx)}>
            {/* Header: name + badges */}
            <div className="nfgcard-header">
              <div className="nfgcard-header-left">
                <div className="nfgcard-name">
                  <span className="nfgcard-number">{idx + 1}.</span>
                  {displayName}
                </div>
                {subName && <div className="nfgcard-subname">{subName}</div>}
              </div>
              <div className="nfgcard-header-right">
                {item.category && item.category !== 'bento' && (
                  <span className="nfgcard-badge nfgcard-badge-category">{item.category}</span>
                )}
                {isDb ? (
                  <span className="nfgcard-badge nfgcard-badge-verified">{copy.verified}</span>
                ) : (
                  <span className="nfgcard-badge nfgcard-badge-ai">{copy.aiEstimate}</span>
                )}
                {item.is_new && (
                  <span className="nfgcard-badge nfgcard-badge-new">{copy.newItem}</span>
                )}
                {item.menu_uid && onLike && (
                  <button
                    type="button"
                    className={`nfgcard-like-btn${liked ? ' liked' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onLike(item.menu_uid!); }}
                  >
                    {liked ? '\u2665' : '\u2661'}
                  </button>
                )}
              </div>
            </div>

            {/* Restaurant info (for search results) */}
            {showRestaurantInfo && restaurantName && (
              <div className="nfgcard-restaurant">
                {restaurantName}{restaurantCity ? ` \u00b7 ${restaurantCity}` : ''}
              </div>
            )}

            {/* Description */}
            <div className="nfgcard-description">{item.description}</div>
            {item.description_local && language !== "ja" && (
              <div className="nfgcard-description-local">{item.description_local}</div>
            )}

            {/* Always visible: allergens, ingredients, restrictions, image */}
            {item.allergens && item.allergens.length > 0 && (
              <div className="nfgcard-allergens">
                {item.allergens.map((a, i) => <span key={i} className="nfgcard-allergen-tag">{a}</span>)}
              </div>
            )}
            {item.ingredients && item.ingredients.length > 0 && (
              <div className="nfgcard-ingredients">
                {item.ingredients.map((ing, i) => <span key={i} className="nfgcard-ingredient-tag">{ing}</span>)}
              </div>
            )}
            {item.restrictions && item.restrictions.length > 0 && (
              <div className="nfgcard-restrictions">
                {item.restrictions.map((r, i) => <span key={i} className="nfgcard-restriction-tag">{r}</span>)}
              </div>
            )}
            {item.image_url && (
              <div className="nfgcard-image">
                <img src={item.image_url} alt={item.name_jp} loading="lazy" />
              </div>
            )}

            {/* Expandable details */}
            {open && (
              <div className="nfgcard-details">
                {item.taste_values && Object.keys(item.taste_values).length > 0 && (
                  <TasteChart values={item.taste_values} labels={tasteLabels} />
                )}
                {item.narrative && (
                  <div className="nfgcard-narrative">
                    {item.narrative.story && (
                      <div className="nfgcard-narrative-story">{item.narrative.story}</div>
                    )}
                    {item.narrative.texture && (
                      <div className="nfgcard-field">
                        <span className="nfgcard-field-label">{copy.texture}</span>
                        <span className="nfgcard-field-value">{item.narrative.texture}</span>
                      </div>
                    )}
                    {item.narrative.how_to_eat && (
                      <div className="nfgcard-field">
                        <span className="nfgcard-field-label">{copy.howToEat}</span>
                        <span className="nfgcard-field-value">{item.narrative.how_to_eat}</span>
                      </div>
                    )}
                    {item.narrative.pairing && (
                      <div className="nfgcard-field">
                        <span className="nfgcard-field-label">{copy.pairing}</span>
                        <span className="nfgcard-field-value">{item.narrative.pairing}</span>
                      </div>
                    )}
                    {item.narrative.kid_friendly != null && (
                      <div className="nfgcard-field">
                        <span className="nfgcard-field-label">
                          {item.narrative.kid_friendly ? copy.kidFriendly : copy.notKidFriendly}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {item.serving && (item.serving.style || item.serving.portion || item.serving.temperature) && (
                  <div className="nfgcard-field">
                    <span className="nfgcard-field-label">{copy.servingStyle}</span>
                    <span className="nfgcard-field-value">
                      {[item.serving.style, item.serving.portion, item.serving.temperature].filter(Boolean).join(' / ')}
                    </span>
                  </div>
                )}
                {item.estimated_calories && (
                  <div className="nfgcard-field">
                    <span className="nfgcard-field-label">{copy.calories}</span>
                    <span className="nfgcard-field-value">{item.estimated_calories}</span>
                  </div>
                )}
                {item.confidence != null && item.confidence > 0 && (
                  <div className="nfgcard-field">
                    <span className="nfgcard-field-label">{copy.confidence}</span>
                    <span className="nfgcard-field-value">{item.confidence}%</span>
                  </div>
                )}
                {/* Actions */}
                {item.menu_uid && (
                  <div className="nfgcard-actions">
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
                          className="nfgcard-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!photoUploading) photoRefs.current[item.menu_uid!]?.click();
                          }}
                        >
                          {photoUploading === item.menu_uid ? '...' : '\uD83D\uDCF7'}
                        </button>
                      </>
                    )}
                    {onSuggestEdit && (
                      <button
                        type="button"
                        className="nfgcard-action-btn nfgcard-action-edit"
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
              <div className="nfgcard-expand-hint">\u25BC</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
