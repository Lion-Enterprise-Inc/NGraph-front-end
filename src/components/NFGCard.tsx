"use client";

import { useState, useRef } from "react";
import type { QuickExplainItem } from "../services/api";

// レーダーチャート表示フラグ（機能成熟後にtrueに戻す）
const SHOW_TASTE_RADAR = false;

/**
 * description と narrative.story の重複率を概算する。
 * 文字 3-gram の Jaccard 係数で類似度を測定。NFG enrichment が
 * 同じ事実を 2 つのフィールドに重複して書くケースを検出する。
 *
 * @returns 0.0 (全く別) 〜 1.0 (完全一致)
 */
function textOverlapRatio(a: string | undefined | null, b: string | undefined | null): number {
  if (!a || !b) return 0;
  // 句読点・空白を除去して正規化
  const norm = (s: string) => s.replace(/[、。・\s　「」『』（）()]/g, "");
  const A = norm(a);
  const B = norm(b);
  if (A.length < 6 || B.length < 6) return 0;
  // 3-gram セット
  const grams = (s: string): Set<string> => {
    const set = new Set<string>();
    for (let i = 0; i <= s.length - 3; i++) set.add(s.slice(i, i + 3));
    return set;
  };
  const ga = grams(A);
  const gb = grams(B);
  let common = 0;
  ga.forEach((g) => {
    if (gb.has(g)) common++;
  });
  // Jaccard 係数（共通 / 全体）
  const union = ga.size + gb.size - common;
  return union === 0 ? 0 : common / union;
}

// description と一定以上重複する narrative.story を非表示にする閾値（Jaccard 係数）
// 実測: ESHIKOTO 五百万石 (NFG enrichment が同事実反復) = 0.187 → 隠す
//      梅酒のパウンドケーキ (story が再利用の文脈追加) = 0.106 → 表示
const STORY_DUPLICATE_THRESHOLD = 0.15;

type DrinkMeta = NonNullable<QuickExplainItem['drink_meta']>;
type SpecRow = { label: string; value: string };

/**
 * drink_meta の kind 別にラベル付き spec rows を生成する。
 * 散文(description / story)で読みにくくなるスペック情報を
 * 構造化テーブルとして抜き出す。値が未登録のキーは出さない。
 */
function buildDrinkSpecRows(meta: DrinkMeta | undefined): SpecRow[] {
  if (!meta) return [];
  const rows: SpecRow[] = [];
  const kind = (meta.kind || '').toString().toLowerCase();
  const push = (label: string, value: string | number | undefined | null, suffix = '') => {
    if (value === undefined || value === null || value === '') return;
    rows.push({ label, value: `${value}${suffix}` });
  };
  const joinList = (arr: unknown): string | undefined => {
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    return arr.map(String).join(' / ');
  };

  if (kind === 'sake') {
    push('種類', meta.sake_type);
    if (meta.brewery) {
      const loc = meta.brewery_location ? `（${meta.brewery_location}）` : '';
      push('蔵元', `${meta.brewery}${loc}`);
    }
    if (meta.rice_variety) {
      const origin = meta.rice_origin ? `（${meta.rice_origin}）` : '';
      push('酒米', `${meta.rice_variety}${origin}`);
    }
    push('精米歩合', meta.polishing_ratio_pct, '%');
    push('日本酒度', meta.sake_meter_value);
    push('度数', meta.abv_pct, '%');
    const bottles = joinList(meta.bottle_sizes_ml);
    if (bottles) push('容量', `${bottles}ml`);
    push('推奨温度', meta.recommended_temp);
    push('季節', meta.season);
  } else if (kind === 'wine') {
    push('品種', meta.grape_variety);
    if (meta.region) {
      const sub = meta.sub_region ? ` / ${meta.sub_region}` : '';
      push('産地', `${meta.region}${sub}`);
    }
    push('ヴィンテージ', meta.vintage);
    push('度数', meta.abv_pct, '%');
    const bottles = joinList(meta.bottle_sizes_ml);
    if (bottles) push('容量', `${bottles}ml`);
  } else if (kind === 'beer') {
    push('スタイル', meta.beer_style);
    push('醸造所', meta.brewery);
    push('度数', meta.abv_pct, '%');
    push('IBU', meta.ibu);
    const hops = joinList(meta.hops);
    if (hops) push('ホップ', hops);
    const bottles = joinList(meta.bottle_sizes_ml);
    if (bottles) push('容量', `${bottles}ml`);
  } else if (kind === 'cocktail') {
    push('ベース', meta.base_spirit);
    push('度数', meta.abv_pct, '%');
    push('グラス', meta.glass_type);
  } else if (kind === 'whisky' || kind === 'spirit') {
    push('種類', meta.kind);
    push('蒸留所', meta.brewery);
    if (meta.region) push('産地', meta.region);
    push('熟成', meta.age_years, '年');
    push('カスク', meta.cask_type);
    push('度数', meta.abv_pct, '%');
    const bottles = joinList(meta.bottle_sizes_ml);
    if (bottles) push('容量', `${bottles}ml`);
  } else if (kind === 'soft_drink') {
    push('カフェイン', meta.caffeine_mg, ' mg');
    const bottles = joinList(meta.bottle_sizes_ml);
    if (bottles) push('容量', `${bottles}ml`);
  } else {
    // Unknown kind — generic display
    push('種類', meta.kind);
    push('度数', meta.abv_pct, '%');
    const bottles = joinList(meta.bottle_sizes_ml);
    if (bottles) push('容量', `${bottles}ml`);
  }

  return rows;
}

function DrinkSpecTable({ meta }: { meta: DrinkMeta | undefined }) {
  const rows = buildDrinkSpecRows(meta);
  if (rows.length === 0) return null;
  return (
    <div className="nfgcard-drink-spec">
      {rows.map((row) => (
        <div key={row.label} className="nfgcard-drink-spec-row">
          <span className="nfgcard-drink-spec-label">{row.label}</span>
          <span className="nfgcard-drink-spec-value">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

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
  cleanUrlBase?: string;
  copy: {
    verified: string;
    pending: string;
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
      <svg viewBox="-155 -150 310 300" style={{ width: '100%', maxWidth: 260 }}>
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
          const p = pt(i, R * 1.55);
          return (
            <text key={`lbl-${i}`} x={p.x} y={p.y + 3.5} textAnchor="middle" fontFamily="'DM Mono',monospace"
              fontSize={active ? 10 : 8.5} fill="rgba(255,255,255,0.7)">
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
  photoUploading, userPhoto, restaurantName, restaurantCity, showRestaurantInfo, cleanUrlBase, copy,
}: Props) {
  const [expandedIdx, setExpandedIdx] = useState<Set<number>>(new Set());
  const [copiedNfgCode, setCopiedNfgCode] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const photoRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleShareCard = (e: React.MouseEvent, item: QuickExplainItem) => {
    e.stopPropagation();
    const nfgCode = item.nfg_code;
    if (!nfgCode) return;
    const base = cleanUrlBase || `${window.location.origin}/capture`;
    const url = cleanUrlBase ? `${base}/nfg/${nfgCode}` : `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const displayName = language !== 'ja' && item.name_en ? item.name_en : item.name_jp;
    const subName = language !== 'ja' ? item.name_jp : item.name_en;
    const text = `${displayName}${subName ? ` - ${subName}` : ''}`;
    if (navigator.share) {
      navigator.share({ title: item.name_jp, text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        setCopiedNfgCode(nfgCode);
        setTimeout(() => setCopiedNfgCode(null), 2000);
      });
    }
  };

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
        const isVerified = isDb && item.verified === true;
        const displayName = language !== "ja" && item.name_en ? item.name_en : item.name_jp;
        const subName = language !== "ja" ? item.name_jp : item.name_en;
        const hasNfg = isDb && (item.narrative || item.taste_values || item.serving || item.estimated_calories);
        const hasDetails = hasNfg;
        const liked = item.menu_uid ? likedMenus?.has(item.menu_uid) : false;

        return (
          <div key={idx} className={`nfgcard${open ? ' nfgcard-open' : ''}`} data-nfg-code={item.nfg_code || undefined} onClick={() => toggle(idx)}>
            {/* Header: title takes max width, thumb only on right */}
            <div className="nfgcard-header">
              <div className="nfgcard-header-left">
                <div className="nfgcard-name">
                  <span className="nfgcard-number">{idx + 1}.</span>
                  {displayName}
                </div>
                {subName && <div className="nfgcard-subname">{subName}</div>}
              </div>
              {item.image_url && (
                <button
                  type="button"
                  className="nfgcard-thumb-mini"
                  onClick={(e) => { e.stopPropagation(); setLightboxUrl(item.image_url!); }}
                  aria-label="画像を拡大"
                >
                  <img src={item.image_url} alt="" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </button>
              )}
            </div>
            {/* Badges row below title (full width) */}
            <div className="nfgcard-badges">
              {item.menu_uid && onLike && (
                <button
                  type="button"
                  className={`nfgcard-like-btn${liked ? ' liked' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onLike(item.menu_uid!); }}
                  aria-label={liked ? 'Unlike' : 'Like'}
                >
                  <span className="nfgcard-like-icon">{liked ? '♥' : '♡'}</span>
                  {(item.like_count ?? 0) > 0 && (
                    <span className="nfgcard-like-count">{item.like_count}</span>
                  )}
                </button>
              )}
              {item.category && item.category !== 'bento' && (
                <span className="nfgcard-badge nfgcard-badge-category">{item.category}</span>
              )}
              {isVerified ? (
                <span className="nfgcard-badge nfgcard-badge-verified">{copy.verified}</span>
              ) : isDb ? (
                <span className="nfgcard-badge nfgcard-badge-pending">{copy.pending}</span>
              ) : (
                <span className="nfgcard-badge nfgcard-badge-ai">{copy.aiEstimate}</span>
              )}
              {item.is_new && (
                <span className="nfgcard-badge nfgcard-badge-new">{copy.newItem}</span>
              )}
            </div>
            {item.nfg_code && (
              <div className="nfgcard-action-row">
                <button
                  type="button"
                  className={`nfgcard-share-btn${copiedNfgCode === item.nfg_code ? ' copied' : ''}`}
                  onClick={(e) => handleShareCard(e, item)}
                >
                  {copiedNfgCode === item.nfg_code ? '\u2705 Copied' : 'Share'}
                </button>
              </div>
            )}

            {/* Restaurant info (for search results) */}
            {showRestaurantInfo && restaurantName && (
              <div className="nfgcard-restaurant">
                {restaurantName}{restaurantCity ? ` \u00b7 ${restaurantCity}` : ''}
              </div>
            )}

            {/* Drink spec table (sake/wine/beer/cocktail/spirit 等) */}
            {item.category === 'drink' && (
              <DrinkSpecTable meta={item.drink_meta} />
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
            {(() => {
              const allImages = [
                ...(item.image_url ? [item.image_url] : []),
                ...(item.image_urls || []),
              ].filter((v, i, a) => a.indexOf(v) === i) // dedupe
              if (allImages.length === 0) return null
              const DRINK_CATS = new Set(["drink","beer","sake","sour","highball","whisky","wine","shochu","fruit_wine","soft_drink"]);
              const isDrink = DRINK_CATS.has((item.category || "").toLowerCase());
              const fitClass = isDrink ? "nfgcard-img-contain" : "nfgcard-img-cover";
              // 単一画像は header の thumbnail で表示済みなのでスキップ
              if (allImages.length === 1) return null
              // 複数画像 carousel (food等で multi photo 設定時)
              return (
                <div className="nfgcard-image-carousel">
                  <div className="nfgcard-image-track">
                    {allImages.map((url, i) => (
                      <div key={i} className="nfgcard-image-slide">
                        <img className={fitClass} src={url} alt={`${item.name_jp} ${i + 1}`} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    ))}
                  </div>
                  <div className="nfgcard-image-dots">
                    {allImages.map((_, i) => (
                      <span key={i} className="nfgcard-image-dot" />
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Expandable details */}
            {open && (
              <div className="nfgcard-details">
                {SHOW_TASTE_RADAR && item.taste_values && Object.keys(item.taste_values).length > 0 && (
                  <TasteChart values={item.taste_values} labels={tasteLabels} />
                )}
                {item.narrative && (() => {
                  const isDrink = item.category === 'drink';
                  // description と story が同じ事実を反復している場合は story を非表示
                  // (NFG enrichment の prompt が守られない時の UI セーフティ)
                  const storyOverlapsDesc =
                    item.description && item.narrative.story
                      ? textOverlapRatio(item.description, item.narrative.story) >= STORY_DUPLICATE_THRESHOLD
                      : false;
                  return (
                  <div className="nfgcard-narrative">
                    {item.narrative.story && !storyOverlapsDesc && (
                      <div className="nfgcard-narrative-story">{item.narrative.story}</div>
                    )}
                    {item.narrative.texture && (
                      <div className="nfgcard-field">
                        <span className="nfgcard-field-label">{isDrink ? (copy.textureDrink ?? copy.texture) : copy.texture}</span>
                        <span className="nfgcard-field-value">{item.narrative.texture}</span>
                      </div>
                    )}
                    {item.narrative.how_to_eat && (
                      <div className="nfgcard-field">
                        <span className="nfgcard-field-label">{isDrink ? (copy.howToEatDrink ?? copy.howToEat) : copy.howToEat}</span>
                        <span className="nfgcard-field-value">{item.narrative.how_to_eat}</span>
                      </div>
                    )}
                    {item.narrative.pairing && (
                      <div className="nfgcard-field">
                        <span className="nfgcard-field-label">{isDrink ? (copy.pairingDrink ?? copy.pairing) : copy.pairing}</span>
                        <span className="nfgcard-field-value">{item.narrative.pairing}</span>
                      </div>
                    )}
                    {!isDrink && item.narrative.kid_friendly != null && (
                      <div className="nfgcard-field">
                        <span className="nfgcard-field-label">
                          {item.narrative.kid_friendly ? copy.kidFriendly : copy.notKidFriendly}
                        </span>
                      </div>
                    )}
                  </div>
                  );
                })()}
                {item.serving && (item.serving.style || item.serving.portion || item.serving.temperature) && (
                  <div className="nfgcard-field">
                    <span className="nfgcard-field-label">{copy.servingStyle}</span>
                    <span className="nfgcard-field-value">
                      {[item.serving.style, item.serving.portion, item.serving.temperature].filter(Boolean).join(' / ')}
                    </span>
                  </div>
                )}
                {item.estimated_calories && item.category !== 'drink' && (
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
              <div className="nfgcard-expand-hint">▼</div>
            )}
          </div>
        );
      })}

      {/* Lightbox overlay for image enlargement */}
      {lightboxUrl && (
        <div
          className="nfgcard-lightbox"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="nfgcard-lightbox-close"
            onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}
            aria-label="閉じる"
          >×</button>
          <img src={lightboxUrl} alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
