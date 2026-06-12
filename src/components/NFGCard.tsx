"use client";

import { useState, useRef } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import type { QuickExplainItem } from "../services/api";
import { getCategoryLabel } from "../i18n/categoryLabels";
import { getOwnerCommentLabel, getAllergenTrustNote, isAllergensVerified } from "../i18n/trustCopy";

// レーダーチャート表示フラグ（機能成熟後にtrueに戻す）
const SHOW_TASTE_RADAR = false;

// 解説品質フィードバックの文言。
// ⚠ uiCopy.ts に統合しない理由: getUiCopy のフォールバックはセクション単位で、
// feedback セクションを ko/zh に部分追加すると既存キー(copy/share)が undefined になる。
// 5言語(ja/en/ko/zh-Hans/zh-Hant)+en フォールバック。翻訳追加はここに足す
const NFG_FEEDBACK_COPY: Record<'label' | 'thanks', Record<string, string>> = {
  label: {
    ja: 'この解説は役に立ちましたか？',
    en: 'Was this helpful?',
    ko: '이 설명이 도움이 되었나요?',
    'zh-Hans': '这些介绍有帮助吗？',
    'zh-Hant': '這些介紹有幫助嗎？',
  },
  thanks: {
    ja: 'フィードバックありがとうございます',
    en: 'Thanks for your feedback!',
    ko: '피드백 감사합니다',
    'zh-Hans': '感谢您的反馈',
    'zh-Hant': '感謝您的反饋',
  },
};

// 客が申告済みの食事制約に該当するメニューに出す context-specific 警告。
// 汎用免責(選択時に1回)とは別物で、「この品があなたの制約に該当する」という
// その場限りの新情報。SYSTEM_SPEC §6.2.1 の閲覧経路「タグ強調」の文言。
const RESTRICTION_MATCH_NOTICE: Record<string, string> = {
  ja: '申告された制約に該当する可能性があります。スタッフにご確認ください',
  en: 'May not match your declared dietary needs. Please confirm with staff.',
  ko: '입력하신 식이 제한에 해당될 수 있습니다. 직원에게 확인해 주세요.',
  'zh-Hans': '可能不符合您申报的饮食限制，请向工作人员确认。',
  'zh-Hant': '可能不符合您申報的飲食限制，請向工作人員確認。',
  es: 'Puede no cumplir sus restricciones declaradas. Confirme con el personal.',
  fr: 'Peut ne pas convenir à vos restrictions déclarées. Confirmez auprès du personnel.',
  de: 'Entspricht möglicherweise nicht Ihren angegebenen Einschränkungen. Bitte beim Personal nachfragen.',
  it: 'Potrebbe non rispettare le restrizioni dichiarate. Confermare con il personale.',
  pt: 'Pode não atender às suas restrições declaradas. Confirme com a equipe.',
  ru: 'Может не соответствовать указанным вами ограничениям. Уточните у персонала.',
  th: 'อาจไม่ตรงกับข้อจำกัดด้านอาหารที่ระบุไว้ กรุณายืนยันกับพนักงาน',
  vi: 'Có thể không phù hợp với hạn chế bạn đã khai báo. Vui lòng xác nhận với nhân viên.',
  id: 'Mungkin tidak sesuai dengan pembatasan yang Anda nyatakan. Harap konfirmasi dengan staf.',
  ms: 'Mungkin tidak menepati sekatan yang anda nyatakan. Sila sahkan dengan kakitangan.',
  ar: 'قد لا يتوافق مع القيود التي ذكرتها. يرجى التأكيد مع الموظفين.',
  hi: 'आपके बताए गए प्रतिबंधों से मेल नहीं खा सकता। कृपया स्टाफ से पुष्टि करें।',
  tr: 'Belirttiğiniz kısıtlamalara uymayabilir. Lütfen personele teyit ettirin.',
  bn: 'আপনার উল্লেখিত বিধিনিষেধের সাথে নাও মিলতে পারে। অনুগ্রহ করে কর্মীদের সাথে নিশ্চিত করুন।',
  my: 'သင်ဖော်ပြထားသော ကန့်သတ်ချက်နှင့် ကိုက်ညီမှု မရှိနိုင်ပါ။ ဝန်ထမ်းနှင့် အတည်ပြုပါ။',
  tl: 'Maaaring hindi tumugma sa iyong idineklarang paghihigpit. Mangyaring kumpirmahin sa staff.',
  lo: 'ອາດບໍ່ກົງກັບຂໍ້ຈຳກັດທີ່ທ່ານແຈ້ງໄວ້. ກະລຸນາຢືນຢັນກັບພະນັກງານ.',
  km: 'អាចមិនត្រូវនឹងការដាក់កម្រិតដែលអ្នកបានបញ្ជាក់។ សូមបញ្ជាក់ជាមួយបុគ្គលិក។',
  ne: 'तपाईंले उल्लेख गर्नुभएको प्रतिबन्धसँग नमिल्न सक्छ। कृपया स्टाफसँग पुष्टि गर्नुहोस्।',
  mn: 'Таны мэдүүлсэн хязгаарлалттай нийцэхгүй байж магадгүй. Ажилтнаас лавлана уу.',
  fa: 'ممکن است با محدودیت‌های اعلام‌شده شما مطابقت نداشته باشد. لطفاً با کارکنان تأیید کنید.',
  uk: 'Може не відповідати зазначеним вами обмеженням. Уточніть у персоналу.',
  pl: 'Może nie spełniać podanych ograniczeń. Prosimy potwierdzić z personelem.',
};

const getRestrictionMatchNotice = (lang: string): string =>
  RESTRICTION_MATCH_NOTICE[lang] || RESTRICTION_MATCH_NOTICE.en;

// 「この料理についてAIに聞く」ボタンのラベル。タップで料理名を入力欄に引用して質問できる。
const ASK_LABEL: Record<string, string> = {
  ja: 'この料理について聞く',
  en: 'Ask about this',
  ko: '이 메뉴 질문하기',
  'zh-Hans': '咨询这道菜',
  'zh-Hant': '詢問這道菜',
};

const getAskLabel = (lang: string): string => ASK_LABEL[lang] || ASK_LABEL.en;

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
    push('創業', meta.brewery_founded);
    if (meta.rice_variety) {
      const origin = meta.rice_origin ? `（${meta.rice_origin}）` : '';
      push('酒米', `${meta.rice_variety}${origin}`);
    }
    if (meta.polishing_ratio_pct !== undefined && meta.polishing_ratio_pct !== null) {
      push('精米歩合', meta.polishing_ratio_pct, '%');
    } else if (meta.polishing_ratio_koji_pct || meta.polishing_ratio_kake_pct) {
      push('精米歩合', `麹米${meta.polishing_ratio_koji_pct ?? '—'}% / 掛米${meta.polishing_ratio_kake_pct ?? '—'}%`);
    }
    push('日本酒度', meta.sake_meter_value);
    push('酸度', meta.acidity);
    push('酵母', meta.yeast);
    push('仕込み水', meta.water_source);
    push('度数', meta.abv_pct, '%');
    const bottles = joinList(meta.bottle_sizes_ml);
    if (bottles) push('容量', `${bottles}ml`);
    push('推奨温度', meta.recommended_temp);
    push('季節', meta.season);
  } else if (kind === 'shochu') {
    push('分類', meta.classification);
    if (meta.brewery) {
      const loc = meta.brewery_location ? `（${meta.brewery_location}）` : '';
      push('蔵元', `${meta.brewery}${loc}`);
    }
    push('創業', meta.brewery_founded);
    push('原料', meta.base_material);
    push('麹', meta.koji);
    push('蒸留方式', meta.distillation_method);
    push('仕込み水', meta.water_source);
    push('度数', meta.abv_pct, '%');
    push('おすすめの飲み方', meta.recommended_serve);
    const bottles = joinList(meta.bottle_sizes_ml);
    if (bottles) push('容量', `${bottles}ml`);
  } else if (kind === 'wine') {
    push('生産者', meta.brewery);
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
    push('蒸留所', meta.brewery);
    if (meta.region) push('産地', meta.region);
    if (meta.age_years) push('熟成', meta.age_years, '年');
    else push('熟成', meta.age_statement);
    push('カスク', meta.cask_type);
    push('度数', meta.abv_pct, '%');
    push('おすすめの飲み方', meta.recommended_serve);
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
  /** 料理単位の解説品質フィードバック(good/bad)。解説精度の学習ループに使う */
  onNfgFeedback?: (menuUid: string, type: 'good' | 'bad') => void;
  nfgFeedback?: Record<string, 'good' | 'bad'>;
  onAskAbout?: (item: QuickExplainItem) => void;
  /** 店主モード時のみ: カードから直接この料理の編集パネルを開く */
  onOwnerEdit?: (menuUid: string) => void;
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
    textureDrink?: string;
    pairing: string;
    pairingDrink?: string;
    howToEat: string;
    howToEatDrink?: string;
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
  items, language, likedMenus, onLike, onSuggestEdit, onNfgFeedback, nfgFeedback,
  onAskAbout, onOwnerEdit, onPhotoUpload,
  photoUploading, userPhoto, restaurantName, restaurantCity, showRestaurantInfo, copy,
}: Props) {
  const [expandedIdx, setExpandedIdx] = useState<Set<number>>(new Set());
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const photoRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleAskAbout = (e: React.MouseEvent, item: QuickExplainItem) => {
    e.stopPropagation();
    onAskAbout?.(item);
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
                  <span className="nfgcard-name-text">{displayName}</span>
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
                <span className="nfgcard-badge nfgcard-badge-category">{getCategoryLabel(item.category, language)}</span>
              )}
              {isVerified ? (
                <span className="nfgcard-badge nfgcard-badge-verified">{copy.verified}</span>
              ) : !isDb ? (
                <span className="nfgcard-badge nfgcard-badge-ai">{copy.aiEstimate}</span>
              ) : null}
              {item.is_new && (
                <span className="nfgcard-badge nfgcard-badge-new">{copy.newItem}</span>
              )}
            </div>
            {(onAskAbout || (onOwnerEdit && item.menu_uid)) && (
              <div className="nfgcard-action-row">
                {onAskAbout && (
                  <button
                    type="button"
                    className="nfgcard-ask-btn"
                    onClick={(e) => handleAskAbout(e, item)}
                  >
                    <span aria-hidden="true">{'\ud83d\udcac'}</span>
                    {getAskLabel(language)}
                  </button>
                )}
                {/* \u5e97\u4e3b\u30e2\u30fc\u30c9: \u5ba2\u306e\u898b\u3048\u65b9\u3092\u898b\u306a\u304c\u3089\u305d\u306e\u5834\u3067\u76f4\u3059\u5c0e\u7dda(\u30c1\u30e3\u30c3\u30c8\u3067\u7de8\u96c6\u3092\u63a2\u3055\u306a\u304f\u3066\u3044\u3044) */}
                {onOwnerEdit && item.menu_uid && (
                  <button
                    type="button"
                    className="nfgcard-owner-edit-btn"
                    onClick={(e) => { e.stopPropagation(); onOwnerEdit(item.menu_uid!); }}
                  >
                    <span aria-hidden="true">{'\u270f\ufe0f'}</span>
                    \u3053\u306e\u6599\u7406\u3092\u76f4\u3059
                  </button>
                )}
              </div>
            )}

            {/* 店主のひとこと: 店主モードで入力された生の声を引用スタイルで最上部に。
                原文のまま表示(機械翻訳しない=店主の声の真正性優先) */}
            {(() => {
              const oc = item.narrative as Record<string, unknown> | undefined;
              const comment = typeof oc?.owner_comment === "string" ? oc.owner_comment.trim() : "";
              if (!comment) return null;
              return (
                <div className="nfgcard-owner-comment">
                  <span className="nfgcard-owner-comment-label">{getOwnerCommentLabel(language)}</span>
                  <p className="nfgcard-owner-comment-text">{comment}</p>
                </div>
              );
            })()}

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

            {/* 申告された制約に該当: その場限りの警告 + タグ強調 (§6.2.1 閲覧経路) */}
            {item.restriction_match && (
              <div className="nfgcard-restriction-warn" role="note">
                <span className="nfgcard-restriction-warn-icon" aria-hidden="true">⚠</span>
                <span>{getRestrictionMatchNotice(language)}</span>
              </div>
            )}

            {/* Always visible: allergens, ingredients, restrictions, image */}
            {item.allergens && item.allergens.length > 0 && (
              <>
                <div className={`nfgcard-allergens${item.restriction_match ? ' nfgcard-tags-emphasized' : ''}`}>
                  {item.allergens.map((a, i) => <span key={i} className="nfgcard-allergen-tag">{a}</span>)}
                </div>
                {/* アレルゲン信頼度: 店主確認済み(✓緑)かAI推定(免責)かを常時明示 */}
                <div className={`nfgcard-allergen-trust${isAllergensVerified(item) ? ' nfgcard-allergen-trust-verified' : ''}`}>
                  {isAllergensVerified(item) ? '✓ ' : ''}{getAllergenTrustNote(language, isAllergensVerified(item))}
                </div>
              </>
            )}
            {item.ingredients && item.ingredients.length > 0 && (
              <div className="nfgcard-ingredients">
                {item.ingredients.map((ing, i) => <span key={i} className="nfgcard-ingredient-tag">{ing}</span>)}
              </div>
            )}
            {/* 食事制約(対応食)タグは申告プロフィールに該当する時だけ表示。
                一般客には嗜好タグ(ペスカタリアン等)はノイズなので常時表示しない。
                命に関わるアレルゲンは上の nfgcard-allergens で常時表示済み。 */}
            {item.restriction_match && item.restrictions && item.restrictions.length > 0 && (
              <div className="nfgcard-restrictions nfgcard-tags-emphasized">
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
                  // 段階開示: 折りたたみ時は description だけ。展開時にここで
                  // 文化ストーリー(story)→背景(cultural_context/regional_note)→
                  // 食感・食べ方・合う飲み物 の順に厚く見せる。
                  // narrative は backend で表示言語にローカライズ済み。
                  const n = item.narrative as Record<string, unknown>;
                  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
                  const story = str(n.story);
                  const culture = [str(n.cultural_context), str(n.regional_note)]
                    .filter(Boolean).join(" ");
                  const senses = [n.texture, n.how_to_eat, n.pairing]
                    .map(str).filter(Boolean).join(" ");
                  if (!story && !culture && !senses) return null;
                  return (
                    <div className="nfgcard-narrative">
                      {story && <p className="nfgcard-narrative-story">{story}</p>}
                      {culture && <p className="nfgcard-narrative-culture">{culture}</p>}
                      {senses && <p className="nfgcard-narrative-senses">{senses}</p>}
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
                {/* 解説品質フィードバック(料理単位)。解説精度の学習ループのデータ源 */}
                {item.menu_uid && onNfgFeedback && (
                  <div className="nfgcard-feedback">
                    {nfgFeedback?.[item.menu_uid] ? (
                      <span className="nfgcard-feedback-thanks">
                        {NFG_FEEDBACK_COPY.thanks[language] || NFG_FEEDBACK_COPY.thanks.en}
                      </span>
                    ) : (
                      <>
                        <span className="nfgcard-feedback-label">
                          {NFG_FEEDBACK_COPY.label[language] || NFG_FEEDBACK_COPY.label.en}
                        </span>
                        <button
                          type="button"
                          className="nfgcard-feedback-btn"
                          aria-label="Good"
                          onClick={(e) => { e.stopPropagation(); onNfgFeedback(item.menu_uid!, 'good'); }}
                        >
                          <ThumbsUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="nfgcard-feedback-btn"
                          aria-label="Bad"
                          onClick={(e) => { e.stopPropagation(); onNfgFeedback(item.menu_uid!, 'bad'); }}
                        >
                          <ThumbsDown size={14} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            {!open && hasDetails && (
              <div className="nfgcard-expand-hint">
                {(({ ja: '詳しく', en: 'Details', ko: '자세히', 'zh-Hans': '详情', 'zh-Hant': '詳情' } as Record<string, string>)[language] || 'Details')} ▼
              </div>
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
