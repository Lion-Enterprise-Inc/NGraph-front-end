"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type UIEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mockRestaurants, mockScanResponse, type Restaurant } from "../api/mockApi";
import Tesseract from "tesseract.js";
import { FeedbackApi, EventApi, type VisionMenuItem, PhotoContributionApi, NfgFeedbackApi, LikedMenusApi, type LikedMenuItem, QuickExplainApi, type QuickExplainItem, MenuSearchApi, type MenuNFGCard, TopMenusApi } from "../services/api";
import { toggleMenuLike } from "../services/menuLikes";
import SuggestionModal from "../components/SuggestionModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import { User, Bot, ChevronDown, Copy, Sparkles, ThumbsUp, ThumbsDown, Star } from "lucide-react";
import CaptureHeader from "../components/CaptureHeader";
import CameraPrompt from "../components/CameraPrompt";
import ChatDock from "../components/ChatDock";
import { useAppContext } from "../components/AppProvider";
import { getUiCopy, type LanguageCode } from "../i18n/uiCopy";
import { recordVisit, saveThread, getThreads } from "../utils/storage";
import ImageViewer from "../components/ImageViewer";
import QuickExplainCard from "../components/QuickExplainCard";
import NFGCard from "../components/NFGCard";
import QRMenuView from "../components/QRMenuView";
import MenuStrip from "../components/MenuStrip";
import OwnerQuestionFlow from "../components/OwnerQuestionFlow";
import OwnerPasscodeModal from "../components/OwnerPasscodeModal";

function visionToQuickExplain(vi: VisionMenuItem): QuickExplainItem {
  return {
    name_jp: vi.name_jp,
    name_en: vi.name_en || '',
    price: 0,
    description: vi.description || '',
    allergens: vi.allergens,
    ingredients: vi.ingredients,
    restrictions: vi.restrictions,
    source: vi.source || 'db',
    menu_uid: (vi as any).menu_uid,
    image_url: vi.image_url,
    narrative: vi.narrative,
    verification_rank: vi.verification_rank,
    taste_values: vi.taste_values,
    serving: vi.serving,
    estimated_calories: vi.estimated_calories,
    confidence: vi.confidence,
    category: vi.category,
    nfg_code: (vi as any).nfg_code,
    restriction_match: vi.restriction_match,
  };
}

type ApiRestaurant = {
  uid: string
  name: string
  name_romaji?: string | null
  description?: string
  is_active: boolean
  slug: string
  logo_url?: string | null
  recommend_texts?: string[] | null
  recommend_texts_ja?: string[] | null
  google_review_url?: string | null
  google_rating?: number | null
  address?: string | null
  city?: string | null
  phone_number?: string | null
  opening_hours?: string | null
  holidays?: string | null
  access_info?: string | null
  budget?: string | null
  instagram_url?: string | null
  business_type?: string | null
  url_slug?: string | null
  prefecture_slug?: string | null
  city_slug?: string | null
  created_at: string
  updated_at: string
};

// Prevent ReactMarkdown from converting "1. text" into <ol><li>
// by escaping the dot: "1\. text" renders as plain "1. text"
function escapeNumberedLists(text: string): string {
  return text.replace(/^(\d+)\. /gm, '$1\\. ');
}

// Extract numbered menu items from AI response for quick reply chips
function extractNumberedItems(text: string): { num: string; name: string }[] {
  const items: { num: string; name: string }[] = [];
  // Match patterns like "1. **料理名**" or "1. 料理名 —" (allow hyphens in names like kani-miso)
  const regex = /^\s*(\d+)\.\s+\*{0,2}([^*\n—–]+?)\*{0,2}\s*(?:[—–]|$)/gm;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[2].trim();
    if (name.length > 0 && items.length < 12) {
      items.push({ num: match[1], name });
    }
  }
  return items;
}

// Helper function to render text with bold formatting and proper structure
const renderBoldText = (text: string, mutedPrefixes: string[] = []) => {
  // Split by double newlines to get paragraphs
  const paragraphs = text.split('\n\n');
  
  return paragraphs.map((paragraph, pIndex) => {
    if (!paragraph.trim()) return null;
    
    // Split by single newlines within paragraph
    const lines = paragraph.split('\n');
    
    return (
      <div key={pIndex} className="mb-4">
        {lines.map((line, lIndex) => {
          if (!line.trim()) return null;
          
          // Check if this is a muted/indented line (starts with specific keywords)
          const isMuted = mutedPrefixes.length > 0
            ? mutedPrefixes.some(p => line.trim().startsWith(p + ':') || line.trim().startsWith(p + '：'))
            : /^(アレルゲン|宗教上の制約|味の特徴|推定カロリー|背景情報|関連提案):/i.test(line.trim());
          
          // Parse bold text (**text**)
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const content = parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              const boldText = part.slice(2, -2);
              return <span key={index} className="font-semibold">{boldText}</span>;
            }
            return part;
          });
          
          return (
            <p key={lIndex} className={isMuted ? "text-muted-foreground pl-4" : ""}>
              {content}
            </p>
          );
        })}
      </div>
    );
  }).filter(Boolean);
};

type Attachment = {
  id: string;
  source: string;
  file: File | null;
  preview: string | null;
  revokeOnCleanup: boolean;
  label: string;
};

type MockOutput = {
  title: string;
  intro: string;
  body: string[];
};

type ResponseItem = {
  id: string;
  input: {
    text: string;
    attachment: string | null;
    imageUrl: string | null;
  };
  output: MockOutput | null;
  language: string;
  feedback: "good" | "bad" | null;
  messageUid: string | null;
  streaming?: boolean;
  visionItems?: VisionMenuItem[];
  quickExplainItems?: QuickExplainItem[];
  contextChips?: { label: string; query: string }[];
};

type FeedbackEntry = {
  input: ResponseItem["input"];
  output: MockOutput;
  language: string;
  rating: "good" | "bad";
  createdAt: string;
};

type CapturePageProps = {
  language?: LanguageCode;
  openLanguageModal?: () => void;
  defaultFromHome?: boolean;
  onBack?: () => void;
  onOpenMenu?: () => void;
  onOpenCamera?: () => void;
};

const logConversation = (entry: {
  input: { text: string; attachment: string | null };
  output: { title: string; intro: string; body: string[] };
  language: string;
  createdAt: string;
}) => {
  try {
    const raw = localStorage.getItem("conversationLog");
    const existing = raw ? JSON.parse(raw) : [];
    existing.push(entry);
    localStorage.setItem("conversationLog", JSON.stringify(existing));
  } catch (error) {
    console.log("conversation_log_error", error);
  }
  console.log("conversation_log", entry);
};

const logFeedback = (entry: FeedbackEntry) => {
  try {
    const raw = localStorage.getItem("ngraphFeedbackLog");
    const existing = raw ? JSON.parse(raw) : [];
    existing.push(entry);
    localStorage.setItem("ngraphFeedbackLog", JSON.stringify(existing));
  } catch (error) {
    console.log("feedback_log_error", error);
  }
  console.log("feedback_log", entry);
};

const generateChatResponse = async (message: string, restaurant?: ApiRestaurant | null): Promise<string> => {
  return "Sorry, there was a connection issue. Please try again.";
};

export default function CapturePage({
  language,
  openLanguageModal,
  defaultFromHome = false,
  onBack,
  onOpenMenu,
  onOpenCamera,
}: CapturePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Support clean URLs: /{prefecture}/{city}/{url_slug}[/nfg/{nfg_code}]
  const cleanUrlMatch = typeof window !== 'undefined'
    ? window.location.pathname.match(/^\/([a-z-]+)\/([a-z-]+)\/([a-z0-9-]+)(?:\/nfg\/([a-z]+[0-9]+))?$/)
    : null;
  // Clean URLアクセス時はキャッシュクリア（常に新鮮な状態で表示）
  const cleanUrlClearedRef = useRef(false);
  if (cleanUrlMatch && !cleanUrlClearedRef.current && typeof window !== 'undefined') {
    cleanUrlClearedRef.current = true;
    const slug = cleanUrlMatch[3];
    try {
      localStorage.removeItem(`ngraph_responses_${slug}`);
      localStorage.removeItem(`ngraph_threadUid_${slug}`);
    } catch {}
  }
  const restaurantSlug = searchParams?.get("restaurant") || (cleanUrlMatch ? cleanUrlMatch[3] : null);
  const [restaurantData, setRestaurantData] = useState<ApiRestaurant | null>(null);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const {
    language: contextLanguage,
    openLanguageModal: openLanguageModalFromContext,
    openHistoryDrawer,
    openMenuList,
    pendingAttachment,
    setPendingAttachment,
    setRestaurantSlug: setCtxSlug,
    setBusinessType: setCtxBusinessType,
    setGoogleReviewUrl: setCtxGoogleReviewUrl,
    setOnNewChat,
    setOnSelectThread,
    setOnOpenLiked,
    setOnOpenPopular,
    setOnAskAbout,
    setOwnerSessionToken,
    geoLocation,
  } = useAppContext();
  const activeLanguage = contextLanguage ?? language ?? "ja";
  const [message, setMessage] = useState("");
  const [hideRecommendations, setHideRecommendations] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const appliedAttachmentRef = useRef(false);
  const threadUidRef = useRef<string | null>(null);
  const [responses, setResponses] = useState<ResponseItem[]>(() => {
    // localStorageから復元（ページ遷移しても残る）
    if (typeof window === 'undefined') return [];
    try {
      const key = `ngraph_responses_${restaurantSlug || 'default'}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // blob URLは復元できないのでnullに
        return parsed.map((r: ResponseItem) => ({
          ...r,
          input: { ...r.input, imageUrl: null },
        }));
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(false);
  const loadingTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const responseImagesRef = useRef<string[]>([]);
  const threadRef = useRef<HTMLElement | null>(null);
  const captureBodyRef = useRef<HTMLDivElement | null>(null);
  const typingTimersRef = useRef<number[]>([]);
  const typingStartedRef = useRef<Set<string>>(new Set());
  const [typingState, setTypingState] = useState<
    Record<string, { title: string; intro: string; body: string[] }>
  >({});
  const [typingComplete, setTypingComplete] = useState<Set<string>>(new Set());
  // 復元されたレスポンスはタイピングアニメーションをスキップ
  const restoredIdsRef = useRef<Set<string>>(new Set(responses.map(r => r.id)));
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, Set<number>>>({});
  const [expandedDetails, setExpandedDetails] = useState<Record<string, Set<number>>>({});
  const [suggestionTarget, setSuggestionTarget] = useState<{ name_jp: string; menu_uid?: string; restaurant_uid?: string } | null>(null);
  const [likedMenus, setLikedMenus] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try { return new Set(JSON.parse(localStorage.getItem('ngraph_liked_menus') || '[]')); } catch { return new Set(); }
  });
  const [tasteCache, setTasteCache] = useState<Record<string, Record<string, number>>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('ngraph_taste_cache') || '{}'); } catch { return {}; }
  });
  const [photoAdoptedCount, setPhotoAdoptedCount] = useState(0);
  const [nfgFeedback, setNfgFeedback] = useState<Record<string, 'good' | 'bad'>>({});
  const [likedDrawerOpen, setLikedDrawerOpen] = useState(false);
  const [likedItems, setLikedItems] = useState<LikedMenuItem[]>([]);
  const [photoUploading, setPhotoUploading] = useState<string | null>(null); // menu_uid being uploaded
  const [photoResult, setPhotoResult] = useState<Record<string, { status: string; match_result: string }>>({});
  const photoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  /**
   * 応答にコピー価値のあるブロックがあるか判定 + 抽出。
   * - Safety Net テンプレ (「📋 スタッフに見せる質問」含み)
   * - インスタ投稿風 (ハッシュタグ複数)
   * - 住所/電話/予約 URL 等の店舗情報
   *
   * コピー価値がある場合は extracted (コピー対象文字列) を返す。
   * メニューレコメンドのみの応答にはコピーボタン出さない (UI ノイズ)。
   */
  const _extractCopyable = (responseText: string | undefined): string | null => {
    if (!responseText) return null;
    const text = responseText;
    // Safety Net テンプレ
    const safetyMatch = text.match(/📋[\s\S]+/);
    if (safetyMatch) return safetyMatch[0].trim();
    // インスタ投稿 (ハッシュタグ 3 個以上)
    if ((text.match(/#[^\s#]+/g) || []).length >= 3) return text.trim();
    // 住所 + 電話セット (連絡先テンプレ)
    if (/住所[:：]/.test(text) && (/電話/.test(text) || /TEL/i.test(text))) {
      return text.trim();
    }
    return null;
  };

  /** 応答の全文 (intro + body) を 1 つの文字列に。コピー用。 */
  const _getResponseFullText = (response: { output: { intro?: string; body?: string[] } | null }): string => {
    if (!response.output) return '';
    return [response.output.intro, ...(response.output.body || [])]
      .filter(Boolean)
      .join('\n');
  };

  // メッセージごとのコピー成功フィードバック (✓ Copied)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Bad 押下時のコメントボックス: 表示中の response.id を持つ
  const [badCommentResponseId, setBadCommentResponseId] = useState<string | null>(null);
  const [badCommentReason, setBadCommentReason] = useState<string | null>(null);
  const [badCommentText, setBadCommentText] = useState('');
  const submitBadComment = async (responseId: string) => {
    const response = responses.find((r) => r.id === responseId);
    if (!response?.messageUid) {
      setBadCommentResponseId(null);
      return;
    }
    try {
      await FeedbackApi.submit(response.messageUid, 'bad', {
        reason: badCommentReason || undefined,
        comment: badCommentText.trim() || undefined,
      });
    } catch {}
    setBadCommentResponseId(null);
    setBadCommentReason(null);
    setBadCommentText('');
  };
  const handleCopyResponse = async (msgId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      if (restaurantSlug) {
        EventApi.log({
          restaurant_slug: restaurantSlug,
          event: 'copy',
          message_uid: msgId,
          thread_uid: threadUidRef.current,
          lang: activeLanguage,
        });
      }
    } catch {}
  };

  // クチコミボタン: google_review_url が設定済の店舗で常時表示 (GoodBad と同じデザイン哲学)
  const shouldShowReviewPrompt = () => Boolean(restaurantData?.google_review_url);

  // クチコミ誘導テキスト: スレッドあたり最大 2 回まで (3 ターン目 + 6 ターン目)
  // 毎ターン出るとノイズ過剰 (code review HIGH-FE-4)
  const shouldShowReviewTextPrompt = (responseIdx: number) => {
    if (!restaurantData?.google_review_url) return false;
    return responseIdx === 2 || responseIdx === 5;
  };

  /** ♡ トグル共通処理。Optimistic UI + サーバ集計 like_count 更新。 */
  const handleLikeToggle = (
    menuUid: string,
    quickExplainItems?: QuickExplainItem[] | null,
  ) => {
    // 1. Optimistic UI (即時 fill 切替 + localStorage)
    const next = new Set(likedMenus);
    const isAdding = !next.has(menuUid);
    if (isAdding) next.add(menuUid);
    else next.delete(menuUid);
    setLikedMenus(next);
    try {
      localStorage.setItem('ngraph_liked_menus', JSON.stringify([...next]));
    } catch {}

    // 2. taste cache の維持 (マイグラフ用)
    const qItem = quickExplainItems?.find((i) => i.menu_uid === menuUid);
    if (isAdding && qItem?.taste_values) {
      const tc = { ...tasteCache, [menuUid]: qItem.taste_values };
      setTasteCache(tc);
      try {
        localStorage.setItem('ngraph_taste_cache', JSON.stringify(tc));
      } catch {}
    } else if (!isAdding) {
      const tc = { ...tasteCache };
      delete tc[menuUid];
      setTasteCache(tc);
      try {
        localStorage.setItem('ngraph_taste_cache', JSON.stringify(tc));
      } catch {}
    }

    // 3. EventApi (既存のテレメトリ)
    if (isAdding && restaurantSlug) {
      EventApi.log({
        restaurant_slug: restaurantSlug,
        event: 'dish_like',
        meta: { menu_uid: menuUid },
      });
    }

    // 4. サーバ like_count 更新 (公開ハート数)。失敗時は UI revert。
    toggleMenuLike(menuUid, { threadUid: threadUidRef.current })
      .then((res) => {
        // responses 内の該当 quickExplainItems の like_count を server 値で書き換え
        setResponses((prev) =>
          prev.map((r) => {
            if (!r.quickExplainItems) return r;
            let touched = false;
            const updated = r.quickExplainItems.map((it) => {
              if (it.menu_uid === menuUid) {
                touched = true;
                return { ...it, like_count: res.like_count };
              }
              return it;
            });
            return touched ? { ...r, quickExplainItems: updated } : r;
          })
        );
      })
      .catch(() => {
        // revert: localStorage と Set 両方
        const revert = new Set(likedMenus);
        if (isAdding) revert.delete(menuUid);
        else revert.add(menuUid);
        setLikedMenus(revert);
        try {
          localStorage.setItem('ngraph_liked_menus', JSON.stringify([...revert]));
        } catch {}
      });
  };

  // マイグラフ: likedMenusの味覚平均を計算
  const myTasteAvg = useMemo(() => {
    const axes = ['umami','richness','saltiness','sweetness','spiciness','lightness','sourness','bitterness','volume','locality'];
    const entries = Object.entries(tasteCache).filter(([uid]) => likedMenus.has(uid));
    if (entries.length < 2) return null;
    const sums: Record<string, number> = {};
    axes.forEach(a => { sums[a] = 0; });
    entries.forEach(([, tv]) => { axes.forEach(a => { sums[a] += (tv[a] || 0); }); });
    const avg: Record<string, number> = {};
    axes.forEach(a => { avg[a] = sums[a] / entries.length; });
    return avg;
  }, [tasteCache, likedMenus]);

  // Capture page needs scroll lock for camera UI
  useEffect(() => {
    document.documentElement.classList.add('no-scroll');
    return () => { document.documentElement.classList.remove('no-scroll'); };
  }, []);

  // NFGカード表示時: likedMenusに含まれるtaste_valuesをキャッシュに保存
  useEffect(() => {
    let updated = false;
    const next = { ...tasteCache };
    responses.forEach(r => {
      r.visionItems?.forEach((vi: any) => {
        const uid = vi.menu_uid;
        if (uid && likedMenus.has(uid) && vi.taste_values && !next[uid]) {
          next[uid] = vi.taste_values;
          updated = true;
        }
      });
    });
    if (updated) {
      setTasteCache(next);
      try { localStorage.setItem('ngraph_taste_cache', JSON.stringify(next)); } catch {}
    }
  }, [responses, likedMenus]);

  // responsesをlocalStorageに自動保存
  useEffect(() => {
    if (responses.length === 0) return;
    try {
      const key = `ngraph_responses_${restaurantSlug || 'default'}`;
      localStorage.setItem(key, JSON.stringify(responses));
    } catch {}
  }, [responses, restaurantSlug]);

  // photo adopted チェック
  useEffect(() => {
    if (!restaurantSlug) return;
    const key = `ngraph_threadUid_${restaurantSlug || 'default'}`;
    const tid = localStorage.getItem(key);
    if (!tid) return;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api';
    fetch(`${apiBaseUrl}/public-chat/${restaurantSlug}/photo-adopted?thread_uid=${tid}`)
      .then(r => r.json())
      .then(d => { if (d.adopted_count > 0) setPhotoAdoptedCount(d.adopted_count); })
      .catch(() => {});
  }, [restaurantSlug]);

  // new=1 パラメータで新規スレッド強制
  const isNewVisit = searchParams?.get('new') === '1';
  useEffect(() => {
    if (typeof window === 'undefined' || !isNewVisit) return;
    try {
      localStorage.removeItem(`ngraph_responses_${restaurantSlug || 'default'}`);
      localStorage.removeItem(`ngraph_threadUid_${restaurantSlug || 'default'}`);
    } catch {}
    threadUidRef.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // thread_uid復元 + 復元レスポンスのタイピング状態セット
  useEffect(() => {
    if (typeof window === 'undefined' || isNewVisit) return;
    try {
      const key = `ngraph_threadUid_${restaurantSlug || 'default'}`;
      const saved = localStorage.getItem(key);
      if (saved) threadUidRef.current = saved;
    } catch {}
    // 復元されたレスポンスのタイピングを完了状態にする
    if (restoredIdsRef.current.size > 0) {
      const restoredTyping: Record<string, { title: string; intro: string; body: string[] }> = {};
      const restoredComplete = new Set<string>();
      responses.forEach(r => {
        if (restoredIdsRef.current.has(r.id) && r.output) {
          restoredTyping[r.id] = { title: r.output.title, intro: r.output.intro, body: r.output.body };
          restoredComplete.add(r.id);
          typingStartedRef.current.add(r.id);
        }
      });
      if (Object.keys(restoredTyping).length > 0) {
        setTypingState(prev => ({ ...prev, ...restoredTyping }));
        setTypingComplete(prev => new Set([...prev, ...restoredComplete]));
        setHideRecommendations(true);
      }
    }
  }, [restaurantSlug]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };
  const toggleCard = (responseId: string, cardIndex: number) => {
    setExpandedCards((prev) => {
      const current = prev[responseId] || new Set<number>();
      const next = new Set(current);
      if (next.has(cardIndex)) {
        next.delete(cardIndex);
      } else {
        next.add(cardIndex);
      }
      return { ...prev, [responseId]: next };
    });
  };

  const isCardExpanded = (responseId: string, cardIndex: number, _totalItems: number) => {
    const expanded = expandedCards[responseId];
    if (expanded) return expanded.has(cardIndex);
    return cardIndex === 0;
  };

  const toggleDetails = (responseId: string, cardIndex: number) => {
    setExpandedDetails((prev) => {
      const current = prev[responseId] || new Set<number>();
      const next = new Set(current);
      if (next.has(cardIndex)) {
        next.delete(cardIndex);
      } else {
        next.add(cardIndex);
      }
      return { ...prev, [responseId]: next };
    });
  };

  const isDetailsExpanded = (responseId: string, cardIndex: number) => {
    return expandedDetails[responseId]?.has(cardIndex) ?? false;
  };

  const [isTypingActive, setIsTypingActive] = useState(false);
  const sendEnabled = message.trim().length > 0 || Boolean(attachment);
  const fromHome = searchParams?.get("from") === "home" || defaultFromHome;
  const fromRestaurant = searchParams?.get("from") === "restaurant";
  const isInStore = searchParams?.get("source") === "qr";
  const [qrMenuMode, setQrMenuMode] = useState(isInStore);
  const scanLoggedRef = useRef(false);
  const isNfgMode = searchParams?.get("nfg") === "true";
  const isQuickMode = searchParams?.get("mode") === "quick";
  const isWebMode = searchParams?.get("mode") === "web";

  // ── 店主モード: ?owner=TOKEN で入る。初回のみパスコード、以降30日セッション ──
  const ownerParam = searchParams?.get("owner");
  const [ownerSession, setOwnerSession] = useState<{
    sessionToken: string; restaurantName: string;
  } | null>(null);
  const [ownerPending, setOwnerPending] = useState(0);
  const [ownerQAActive, setOwnerQAActive] = useState(false);
  const [ownerGateOpen, setOwnerGateOpen] = useState(false);

  // 店主モードに入る: 保存済みセッションがあればパスコードなしで復元、無ければゲートを出す
  const enterOwnerMode = useCallback(() => {
    if (!ownerParam) return;
    try {
      const raw = localStorage.getItem(`omiseai_owner_${ownerParam}`);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.session_token) {
          setOwnerSession({ sessionToken: saved.session_token, restaurantName: saved.restaurant_name || "" });
          if (typeof saved.pending_count === "number") setOwnerPending(saved.pending_count);
          return;
        }
      }
    } catch {}
    setOwnerGateOpen(true);
  }, [ownerParam]);

  useEffect(() => { enterOwnerMode(); }, [enterOwnerMode]);

  // 店主セッションを context に同期(MenuListDrawer が編集UIを出すか判定する)
  useEffect(() => {
    setOwnerSessionToken(ownerSession?.sessionToken ?? null);
  }, [ownerSession, setOwnerSessionToken]);
  
  const selectedRestaurant = restaurantData;
  const nfgParam = searchParams?.get("nfg") || (cleanUrlMatch ? cleanUrlMatch[4] : null);

  // Build clean URL base for NFG card sharing (e.g., https://app.ngraph.jp/fukui/fukui/kanitokaisenbonta)
  const cleanUrlBase = useMemo(() => {
    if (!restaurantData?.url_slug || !restaurantData?.prefecture_slug || !restaurantData?.city_slug) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.ngraph.jp';
    return `${origin}/${restaurantData.prefecture_slug}/${restaurantData.city_slug}/${restaurantData.url_slug}`;
  }, [restaurantData?.url_slug, restaurantData?.prefecture_slug, restaurantData?.city_slug]);

  // Fetch restaurant data from public API endpoint
  useEffect(() => {
    if (restaurantSlug) {
      const fetchRestaurantBySlug = async () => {
        setRestaurantLoading(true);
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api';
          const langParam = activeLanguage !== 'ja' ? `?lang=${activeLanguage}` : '';
          const response = await fetch(`${apiBaseUrl}/restaurants/public/${encodeURIComponent(restaurantSlug)}${langParam}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.result && data.result.is_active) {
              console.log('Restaurant data from public API:', data.result);
              setRestaurantData({
                uid: data.result.uid,
                name: data.result.name,
                name_romaji: data.result.name_romaji,
                slug: data.result.slug,
                is_active: data.result.is_active,
                logo_url: data.result.logo_url,
                recommend_texts: data.result.recommend_texts,
                recommend_texts_ja: data.result.recommend_texts_ja,
                google_review_url: data.result.google_review_url || null,
                google_rating: data.result.google_rating || null,
                address: data.result.address || null,
                city: data.result.city || null,
                phone_number: data.result.phone_number || null,
                opening_hours: data.result.opening_hours || null,
                holidays: data.result.holidays || null,
                access_info: data.result.access_info || null,
                budget: data.result.budget || null,
                instagram_url: data.result.instagram_url || null,
                url_slug: data.result.url_slug || null,
                prefecture_slug: data.result.prefecture_slug || null,
                city_slug: data.result.city_slug || null,
                business_type: data.result.business_type || null,
                created_at: '',
                updated_at: ''
              });
              setCtxBusinessType(data.result.business_type || null);
              setCtxGoogleReviewUrl(data.result.google_review_url || null);
              recordVisit(data.result.slug, data.result.name);
              document.title = `${data.result.name_romaji || data.result.name} | NGraph`;

              // URL を綺麗な url_slug 形に置換 (日本語 slug や %エンコード塊を回避)
              // 例: ?restaurant=蟹と海鮮ぼんた → ?restaurant=kanitokaisenbonta
              // 履歴汚さないよう router.replace、search params 他は保持
              const cleanSlug: string | null = data.result.url_slug || null;
              if (cleanSlug && cleanSlug !== restaurantSlug) {
                try {
                  const params = new URLSearchParams(window.location.search);
                  params.set('restaurant', cleanSlug);
                  router.replace(`${window.location.pathname}?${params.toString()}`);
                } catch {}
              }
              return;
            }
          }
          console.log('Restaurant not found:', restaurantSlug);
          setRestaurantData(null);
        } catch (error) {
          console.error('Failed to fetch restaurant:', error);
          setRestaurantData(null);
        } finally {
          setRestaurantLoading(false);
        }
      };
      fetchRestaurantBySlug();
    }
  }, [restaurantSlug, activeLanguage]);



  // Auto-load top menus when accessed via clean URL or nfg share link
  const autoLoadDone = useRef(false);
  useEffect(() => {
    if (autoLoadDone.current || !restaurantData || !cleanUrlMatch || !nfgParam || responses.length > 0 || isWebMode) return;
    autoLoadDone.current = true;
    const slug = restaurantData.slug;
    const rName = restaurantData.name_romaji || restaurantData.name;
    TopMenusApi.fetch(slug, 20, activeLanguage).then((data) => {
      const menus = Array.isArray(data?.result?.menus) ? data.result.menus : [];
      if (menus.length === 0) return;
      let items: QuickExplainItem[] = menus.map((m: any) => ({
        name_jp: m.name_jp || '',
        name_en: m.name_en || '',
        price: m.price || 0,
        description: m.description || '',
        allergens: m.allergens || [],
        ingredients: m.ingredients || [],
        restrictions: m.restrictions || [],
        source: m.source || 'db',
        menu_uid: m.menu_uid,
        image_url: m.image_url,
        narrative: m.narrative,
        verification_rank: m.verification_rank,
        taste_values: m.taste_values,
        serving: m.serving,
        estimated_calories: m.estimated_calories,
        confidence: m.confidence,
        category: m.category,
        nfg_code: m.nfg_code,
      }));
      // If nfgParam present, filter to show only that card
      if (nfgParam) {
        const matched = items.filter(i => i.nfg_code === nfgParam);
        if (matched.length > 0) {
          items = matched;
          const item = matched[0];
          const menuName = activeLanguage !== 'ja' && item.name_en ? item.name_en : item.name_jp;
          document.title = `${menuName} - ${rName} | NGraph`;
        }
      } else {
        document.title = `${rName} | NGraph`;
      }
      const r: ResponseItem = {
        id: 'auto-nfg',
        input: { text: '', attachment: null, imageUrl: null },
        output: { title: nfgParam ? '' : rName, intro: '', body: [] },
        language: activeLanguage,
        feedback: null,
        messageUid: null,
        quickExplainItems: items,
      };
      setResponses([r]);
    }).catch(() => {});
  }, [restaurantData, cleanUrlMatch, activeLanguage]);

  // Scroll to specific NFG card when ?nfg=xxx is present
  const nfgScrollDone = useRef(false);
  useEffect(() => {
    if (!nfgParam || nfgScrollDone.current) return;
    const el = document.querySelector(`[data-nfg-code="${nfgParam}"]`);
    if (el) {
      nfgScrollDone.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLElement).click(); // expand the card
      el.classList.add('nfgcard-highlight');
      setTimeout(() => el.classList.remove('nfgcard-highlight'), 3000);
    }
  }, [nfgParam, responses]);

  // Sync slug to AppContext for sidebar
  useEffect(() => {
    if (restaurantSlug) setCtxSlug(restaurantSlug);
  }, [restaurantSlug, setCtxSlug]);

  useEffect(() => {
    if (isInStore && restaurantSlug && !scanLoggedRef.current) {
      scanLoggedRef.current = true;
      EventApi.log({ restaurant_slug: restaurantSlug, event: 'scan', lang: activeLanguage });
    }
  }, [isInStore, restaurantSlug, activeLanguage]);

  // Session tracking: start + end (duration, referrer, screen size)
  const sessionStartRef = useRef<number>(0);
  const sessionLoggedRef = useRef(false);
  useEffect(() => {
    if (!restaurantSlug || sessionLoggedRef.current) return;
    sessionLoggedRef.current = true;
    sessionStartRef.current = Date.now();
    EventApi.log({
      restaurant_slug: restaurantSlug,
      event: 'session_start',
      lang: activeLanguage,
      meta: {
        referrer: document.referrer || null,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
      },
    });

    const handleEnd = () => {
      if (!sessionStartRef.current) return;
      const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
      if (duration < 2) return;
      EventApi.beacon({
        restaurant_slug: restaurantSlug,
        event: 'session_end',
        lang: activeLanguage,
        meta: { duration_seconds: duration },
      });
      sessionStartRef.current = 0;
    };

    const handleVisibility = () => { if (document.visibilityState === 'hidden') handleEnd(); };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleEnd);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleEnd);
      handleEnd();
    };
  }, [restaurantSlug]);

  const copy = useMemo(() => getUiCopy(activeLanguage), [activeLanguage]);

  // ローテーション placeholder: 店内 QR 経由 = 既に着席している前提なので、
  // 「店内で実際に聞く質問」だけに絞る。予約/駐車/営業時間 等の来店前情報は除外。
  const placeholderCandidates = useMemo<string[]>(() => {
    const lang = activeLanguage;
    if (lang === 'ja') {
      return [
        '何でも聞いてください',
        'おすすめは？',
        '名物は？',
        'アレルギーは？',
        '季節限定メニューは？',
        'ドリンク何がある？',
        '〆は何がある？',
        '合う飲み物は？',
        '子供向けのメニューは？',
      ];
    }
    if (lang === 'en') {
      return [
        'Ask me anything',
        'What do you recommend?',
        'Any signature dishes?',
        'Any allergens?',
        'Seasonal menu?',
        'What drinks do you have?',
        'What pairs well with this?',
        'Anything kid-friendly?',
      ];
    }
    if (lang === 'ko') {
      return [
        '무엇이든 물어보세요',
        '추천 메뉴는?',
        '대표 메뉴는?',
        '알레르기 정보',
        '계절 메뉴는?',
        '음료는 뭐가 있어요?',
      ];
    }
    if (lang === 'zh-Hans' || lang === 'zh-Hant' || lang === 'zh') {
      return [
        '请随意提问',
        '有什么推荐？',
        '招牌菜是？',
        '过敏信息',
        '季节限定菜单',
        '有什么饮料？',
      ];
    }
    return ['Ask me anything', 'What do you recommend?'];
  }, [activeLanguage]);

  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  useEffect(() => {
    setPlaceholderIdx(0);  // 言語切替時に reset
    if (placeholderCandidates.length <= 1) return;
    const id = window.setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % placeholderCandidates.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [placeholderCandidates]);

  // hero (最初の発話前) は質問例を rotate、会話中は静的な placeholder を常時表示
  const isFirstMessage = responses.length === 0;
  const rotatingPlaceholder = isFirstMessage
    ? (placeholderCandidates[placeholderIdx] ?? copy.restaurant.chatPlaceholder)
    : copy.restaurant.chatPlaceholder;

  const currentSuggestions = useMemo(() => {
    if (selectedRestaurant) {
      const displayName = (activeLanguage !== 'ja' && selectedRestaurant.name_romaji)
        ? selectedRestaurant.name_romaji
        : selectedRestaurant.name;

      // Quick tap round 1: 名物/おすすめ/迷ってる (Session 73)
      return {
        guide: rotatingPlaceholder,
        chips: [
          copy.restaurant.signatureDish,
          copy.restaurant.bestTime,
          copy.restaurant.undecided
        ]
      };
    }
    return copy.suggestions;
  }, [selectedRestaurant, copy.suggestions, copy.restaurant, activeLanguage, rotatingPlaceholder]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    if (!pendingAttachment || appliedAttachmentRef.current) return;
    appliedAttachmentRef.current = true;
    const preview = pendingAttachment.file
      ? URL.createObjectURL(pendingAttachment.file)
      : null;
    setAttachment({
      id: `${Date.now()}`,
      source: pendingAttachment.source ?? "library",
      file: pendingAttachment.file ?? null,
      preview,
      revokeOnCleanup: Boolean(preview),
      label:
        pendingAttachment.source === "camera"
          ? copy.attachment.cameraPhoto
          : copy.attachment.photoLibrary,
    });
    setPendingAttachment(null);
    setHideRecommendations(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [pendingAttachment, setPendingAttachment, copy]);

  useEffect(() => {
    return () => {
      if (attachment?.preview && attachment?.revokeOnCleanup) {
        URL.revokeObjectURL(attachment.preview);
      }
    };
  }, [attachment]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      responseImagesRef.current.forEach((url) => URL.revokeObjectURL(url));
      typingTimersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    const wait = (ms: number) =>
      new Promise((resolve) => {
        const timer = window.setTimeout(resolve, ms);
        typingTimersRef.current.push(timer);
      });

    // Auto-follow during typing is disabled: the response is anchored at send
    // time and content grows downward from there. User scrolls at their pace.
    const scrollToBottom = (_smooth = true) => {};

    const typeText = async (
      fullText: string,
      onUpdate: (value: string) => void,
      scrollDuringTyping = false
    ) => {
      const chunkSize = 5;
      const delay = 10;
      
      for (let i = chunkSize; i <= fullText.length; i += chunkSize) {
        await wait(delay);
        const text = fullText.slice(0, i);
        onUpdate(text);
        
        // More frequent scrolling during typing
        if (scrollDuringTyping && i % chunkSize === 0) {
          scrollToBottom(true);
        }
      }
      
      // Ensure we show the full text
      if (fullText.length % chunkSize !== 0) {
        onUpdate(fullText);
        // Final scroll for the last chunk
        if (scrollDuringTyping) {
          scrollToBottom(true);
        }
      }
    };

    const startTyping = async (response: ResponseItem) => {
      const output = response.output;
      if (!output) return;

      // Mark typing as active - this will enable auto-scroll during typing
      setIsTypingActive(true);

      // Initial scroll to the new message
      await wait(100);
      scrollToBottom(true);

      setTypingState((prev) => {
        if (prev[response.id]) return prev;
        return {
          ...prev,
          [response.id]: {
            title: "",
            intro: "",
            body: output.body.map(() => ""),
          },
        };
      });

      // Type title
      if (output.title) {
        await typeText(output.title, (value) => {
          setTypingState((prev) => {
            const current = prev[response.id];
            if (!current) return prev;
            return { ...prev, [response.id]: { ...current, title: value } };
          });
        }, true);
      }

      // Type intro
      if (output.intro) {
        await typeText(output.intro, (value) => {
          setTypingState((prev) => {
            const current = prev[response.id];
            if (!current) return prev;
            return { ...prev, [response.id]: { ...current, intro: value } };
          });
        }, true);
      }

      // Type body lines
      for (let index = 0; index < output.body.length; index += 1) {
        const line = output.body[index];
        await typeText(line, (value) => {
          setTypingState((prev) => {
            const current = prev[response.id];
            if (!current) return prev;
            const updatedBody = [...current.body];
            updatedBody[index] = value;
            return {
              ...prev,
              [response.id]: { ...current, body: updatedBody },
            };
          });
        }, true);
      }
      
      // Mark typing as complete for this response
      setTypingComplete((prev) => new Set(prev).add(response.id));
      
      // Mark typing as inactive - now respect user scroll position
      setIsTypingActive(false);

      // No completion scroll: the response stays anchored where the user left it.
    };

    responses.forEach((response) => {
      if (!response.output) return;
      if (response.streaming) return; // SSE streaming handles its own display
      if (typingStartedRef.current.has(response.id)) return;
      typingStartedRef.current.add(response.id);
      void startTyping(response);
    });
  }, [responses]);

  // Auto-follow during generation is intentionally disabled. The response is
  // anchored at send time and content grows downward; the user scrolls at their
  // own pace (no jumpy follow-down or snap-back-to-top).

  const handleScrollToBottom = () => {
    const container = captureBodyRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
      setUserScrolledUp(false);
      setShowScrollButton(false);
    }
  };

  const handleBackgroundClick = () => {
    textareaRef.current?.blur();
  };

  const handleContentScroll = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Consider user has scrolled up if they're more than 100px from bottom
    const isNearBottom = distanceFromBottom < 100;

    // Show scroll button if user is scrolled up
    setShowScrollButton(!isNearBottom);

    // Only track user scroll position when typing is not active
    if (!isTypingActive) {
      // If user scrolls up significantly, mark as scrolled up
      if (!isNearBottom && !userScrolledUp) {
        setUserScrolledUp(true);
      } else if (isNearBottom && userScrolledUp) {
        setUserScrolledUp(false);
      }
    }

  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText ?? message;
    if ((!textToSend.trim() && !attachment) || loading) return;
    const trimmedMessage = textToSend.trim();
    const attachmentSnapshot = attachment;
    const userImage = attachmentSnapshot?.file
      ? URL.createObjectURL(attachmentSnapshot.file)
      : null;

    if (userImage) {
      responseImagesRef.current.push(userImage);
    }

    const responseId = `${Date.now()}`;
    setResponses((prev) => [
      ...prev,
      {
        id: responseId,
        input: {
          text: trimmedMessage,
          attachment: attachmentSnapshot ? attachmentSnapshot.label : null,
          imageUrl: userImage,
        },
        output: null,
        language: activeLanguage,
        feedback: null,
        messageUid: null,
      },
    ]);

    setMessage("");
    setAttachment(null);
    setHideRecommendations(true);
    setLoading(true);
    setUserScrolledUp(false); // Reset scroll state for new message
    setIsTypingActive(false); // Ensure typing state is reset

    // Anchor the user's new message near the top of the viewport so the answer
    // grows downward from a fixed position (no auto-follow, no snap-back).
    const anchorMessageTop = () => {
      const container = captureBodyRef.current;
      const el = document.getElementById(`msg-${responseId}`);
      if (container && el) {
        container.scrollTo({ top: el.offsetTop - container.offsetTop, behavior: "smooth" });
      }
    };

    requestAnimationFrame(() => {
      anchorMessageTop();
      requestAnimationFrame(anchorMessageTop);
    });
    setTimeout(anchorMessageTop, 100);
    setTimeout(anchorMessageTop, 300);

    try {
      let output: MockOutput;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api';

      if (attachmentSnapshot?.file) {
        // Image attached → use Vision API for menu analysis
        try {
          if (isQuickMode) {
            // Quick Explain モード: 軽量API
            const qeCopy = (copy as any).quickExplain || { title: "Quick Explain ({n} items)" };
            const qeResponse = await QuickExplainApi.analyze(
              attachmentSnapshot.file,
              selectedRestaurant?.slug,
              activeLanguage,
            );
            const qeItems: QuickExplainItem[] = qeResponse.result?.items || [];
            output = {
              title: qeCopy.title.replace('{n}', String(qeItems.length)),
              intro: '',
              body: [],
            };
            typingStartedRef.current.add(responseId);
            setResponses((prev) =>
              prev.map((item) =>
                item.id === responseId ? { ...item, quickExplainItems: qeItems } : item
              )
            );
            setTypingComplete((prev) => new Set(prev).add(responseId));
          } else {
          const formData = new FormData();
          formData.append('image', attachmentSnapshot.file);
          if (selectedRestaurant?.slug) {
            formData.append('restaurant_slug', selectedRestaurant.slug);
          }
          formData.append('contribute', 'true');
          if (geoLocation) {
            formData.append('lat', String(geoLocation.lat));
            formData.append('lng', String(geoLocation.lng));
          }
          {
            let sid = localStorage.getItem('ngraph_session_id');
            if (!sid) {
              sid = crypto.randomUUID();
              localStorage.setItem('ngraph_session_id', sid);
            }
            formData.append('session_id', sid);
          }

          const visionResponse = await fetch(`${apiBaseUrl}/menus/analyze-image`, {
            method: 'POST',
            body: formData,
          });

          if (visionResponse.ok) {
            const visionData = await visionResponse.json();
            const items: VisionMenuItem[] = visionData.result?.items || [];

            if (isNfgMode) {
              // NFGカード表示
              output = {
                title: copy.capture.menuAnalysis.replace('{n}', String(items.length)),
                intro: '',
                body: [],
              };
              typingStartedRef.current.add(responseId);
              setResponses((prev) =>
                prev.map((item) =>
                  item.id === responseId ? { ...item, visionItems: items } : item
                )
              );
              setTypingComplete((prev) => new Set(prev).add(responseId));
            } else {
              // 従来のマークダウン表示
              const formatItem = (item: VisionMenuItem): string => {
                const parts: string[] = [];
                const name = item.name_en
                  ? `**${item.name_jp}** (${item.name_en})`
                  : `**${item.name_jp}**`;
                const price = item.price > 0 ? ` — ¥${item.price.toLocaleString()}` : '';
                parts.push(`${name}${price}`);
                if (item.description) parts.push(item.description);
                if (item.ingredients?.length) parts.push(`${copy.nfg.ingredients}: ${item.ingredients.join(', ')}`);
                if (item.allergens?.length) parts.push(`${copy.nfg.allergens}: ${item.allergens.join(', ')}`);
                return parts.join('\n');
              };

              output = {
                title: copy.capture.menuAnalysis.replace('{n}', String(items.length)),
                intro: trimmedMessage
                  ? copy.capture.imageAnalyzedWith.replace('{q}', trimmedMessage)
                  : copy.capture.imageAnalyzed,
                body: items.map(formatItem),
              };
            }
          } else {
            throw new Error(`Vision API failed: ${visionResponse.status}`);
          }
          } // end else (not quick mode)
        } catch (visionError) {
          console.log("vision_api_error", visionError);
          // Fallback: OCR → chat
          let ocrText = "";
          try {
            const langCode = activeLanguage === "ja" ? "jpn" : activeLanguage === "ko" ? "kor" : "eng";
            const result = await Tesseract.recognize(attachmentSnapshot.file, langCode);
            ocrText = result?.data?.text ?? "";
          } catch (e) {
            console.log("ocr_error", e);
          }
          const requestText = trimmedMessage || ocrText.trim() || "メニュー画像を送信しました";
          const fallbackResponse = await generateChatResponse(requestText, selectedRestaurant);
          output = { title: '', intro: fallbackResponse, body: [] };
        }
      } else {
        // Text only → SSE streaming chat
        const requestText = trimmedMessage;
        let streamedText = '';
        try {
          const restaurantSlugForApi = selectedRestaurant?.slug || 'default';
          const abortController = new AbortController();
          abortControllerRef.current = abortController;
          // ハンバーガー「個人設定」で保存した profile を chat に持ち越す。
          // localStorage `omiseai_allergies` はアレルゲン + 食事スタイル混在 1 配列。
          let _profile: { restrictions: string[] } | undefined;
          try {
            const raw = localStorage.getItem('omiseai_allergies');
            const arr = raw ? (JSON.parse(raw) as unknown) : null;
            if (Array.isArray(arr) && arr.length > 0) {
              _profile = { restrictions: arr.filter((v): v is string => typeof v === 'string') };
            }
          } catch {}

          const streamResponse = await fetch(`${apiBaseUrl}/public-chat/${encodeURIComponent(restaurantSlugForApi)}/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: requestText,
              in_store: isInStore,
              thread_uid: threadUidRef.current,
              language: activeLanguage,
              ...(isWebMode ? { mode: 'web' } : {}),
              ...(_profile ? { profile: _profile } : {}),
            }),
            signal: abortController.signal,
          });

          if (streamResponse.ok && streamResponse.body) {
            // Keep loading spinner until first content token
            setIsTypingActive(true);
            // Prevent startTyping useEffect from running on this response
            typingStartedRef.current.add(responseId);

            let firstToken = true;
            const reader = streamResponse.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'start' && data.thread_uid) {
                    threadUidRef.current = data.thread_uid;
                    try {
                      const tKey = `ngraph_threadUid_${restaurantSlug || 'default'}`;
                      localStorage.setItem(tKey, data.thread_uid);
                    } catch {}
                  }
                  if (data.type === 'content') {
                    if (firstToken) {
                      firstToken = false;
                      setLoading(false);
                      // Show assistant row with streaming flag
                      setResponses((prev) =>
                        prev.map((item) =>
                          item.id === responseId
                            ? { ...item, output: { title: '', intro: '', body: [] }, streaming: true }
                            : item
                        )
                      );
                      setTypingState((prev) => ({
                        ...prev,
                        [responseId]: { title: '', intro: '', body: [] },
                      }));
                    }
                    streamedText += data.content;
                    setTypingState((prev) => ({
                      ...prev,
                      [responseId]: { title: '', intro: streamedText, body: [] },
                    }));
                  } else if (data.type === 'nfg_partial') {
                    // Progressive NFG: 先行到着したカードを即表示
                    const partialItems = data.nfg_items as VisionMenuItem[] | undefined;
                    if (partialItems?.length) {
                      setResponses((prev) =>
                        prev.map((item) =>
                          item.id === responseId
                            ? { ...item, visionItems: [...(item.visionItems || []), ...partialItems] }
                            : item
                        )
                      );
                    }
                  } else if (data.type === 'error') {
                    console.log("sse_error", data.message);
                    throw new Error(data.message || 'Server error');
                  } else if (data.type === 'done' && data.message_uid) {
                    const nfgItems = data.nfg_items as VisionMenuItem[] | undefined;
                    const contextChips = data.context_chips as { label: string; query: string }[] | undefined;
                    setResponses((prev) =>
                      prev.map((item) => {
                        if (item.id !== responseId) return item;
                        const existing = item.visionItems || [];
                        const incoming = nfgItems || [];
                        // Merge: keep partial cards + add new (deduplicate by name_jp)
                        const seen = new Set(existing.map(v => v.name_jp));
                        const merged = [...existing, ...incoming.filter(v => !seen.has(v.name_jp))];
                        return {
                          ...item,
                          messageUid: data.message_uid,
                          ...(merged.length ? { visionItems: merged } : {}),
                          ...(contextChips?.length ? { contextChips } : {}),
                        };
                      })
                    );
                  }
                } catch (parseErr) {
                  if (parseErr instanceof SyntaxError) continue;
                  throw parseErr;
                }
              }
            }

            // If stream completed but no content received, throw to trigger fallback
            if (!streamedText) {
              throw new Error('Empty response from server');
            }

            output = { title: '', intro: streamedText, body: [] };
            // Clear streaming flag, set output, and mark complete together
            abortControllerRef.current = null;
            setResponses((prev) =>
              prev.map((item) =>
                item.id === responseId ? { ...item, output, streaming: false } : item
              )
            );
            setIsTypingActive(false);
            setTypingComplete((prev) => new Set(prev).add(responseId));

            // No completion scroll: position stays where the user left it.

            // Save to history drawer (localStorage)
            if (threadUidRef.current && restaurantSlug) {
              try {
                const existing = getThreads(restaurantSlug).find(
                  (t) => t.thread_uid === threadUidRef.current
                );
                saveThread(restaurantSlug, {
                  thread_uid: threadUidRef.current!,
                  title: existing?.title || requestText.slice(0, 50),
                  preview: streamedText.replace(/\*\*/g, '').slice(0, 100),
                  updatedAt: new Date().toISOString(),
                });
              } catch {}
            }
          } else {
            throw new Error(`Stream API failed: ${streamResponse.status}`);
          }
        } catch (apiError: any) {
          abortControllerRef.current = null;
          console.log("chat_api_error", apiError);
          setLoading(false);
          setIsTypingActive(false);
          // If user aborted, keep what we have so far
          if (apiError?.name === 'AbortError') {
            output = { title: '', intro: streamedText || '', body: [] };
            setResponses((prev) =>
              prev.map((item) =>
                item.id === responseId ? { ...item, output, streaming: false } : item
              )
            );
            setTypingComplete((prev) => new Set(prev).add(responseId));
          } else {
            const fallbackResponse = await generateChatResponse(requestText, selectedRestaurant);
            output = { title: '', intro: fallbackResponse, body: [] };
            setTypingState((prev) => ({
              ...prev,
              [responseId]: { title: '', intro: fallbackResponse, body: [] },
            }));
            setTypingComplete((prev) => new Set(prev).add(responseId));
          }
        }
      }

      setResponses((prev) =>
        prev.map((item) =>
          item.id === responseId ? { ...item, output } : item
        )
      );
      logConversation({
        input: {
          text: trimmedMessage,
          attachment: attachmentSnapshot ? attachmentSnapshot.label : null,
        },
        output,
        language: activeLanguage,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.log("mock_api_error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationClick = (text: string) => {
    console.log("chip_send", { value: text });
    setHideRecommendations(true);
  };

  const handleRound2Click = async (round1: string, menuGroup: string) => {
    if (!selectedRestaurant) return;
    const slug = selectedRestaurant.slug;
    const round1Label = round1 === 'signatureDish' ? copy.restaurant.signatureDish : copy.restaurant.bestTime;
    const groupLabels: Record<string, string> = {
      hearty: copy.restaurant.hearty,
      single: copy.restaurant.singleDish,
      light: copy.restaurant.lightAppetizer,
    };
    const inputText = `${round1Label} → ${groupLabels[menuGroup] || menuGroup}`;
    const responseId = `${Date.now()}`;
    setHideRecommendations(true);
    setUserScrolledUp(false);

    setResponses((prev) => [
      ...prev,
      {
        id: responseId,
        input: { text: inputText, attachment: null, imageUrl: null },
        output: null,
        language: activeLanguage,
        feedback: null,
        messageUid: null,
        streaming: true,
      },
    ]);

    try {
      const q = round1 === 'signatureDish' ? '名物,看板,おすすめ' : '';
      const result = await MenuSearchApi.search({
        restaurant_slug: slug,
        menu_group: menuGroup,
        q,
        nfg: true,
        lang: activeLanguage,
        size: 5,
      });
      const menus = Array.isArray(result?.result?.menus) ? result.result.menus : [];
      const items: QuickExplainItem[] = menus.map((m: MenuNFGCard) => ({
        name_jp: m.name_jp,
        name_en: m.name_en || '',
        price: m.price,
        description: m.description || '',
        allergens: m.allergens,
        ingredients: m.ingredients,
        restrictions: m.restrictions,
        source: 'db' as const,
        menu_uid: m.uid,
        image_url: m.image_url || undefined,
        narrative: m.narrative_full || undefined,
        verification_rank: m.verification_rank || undefined,
        taste_values: m.taste_values || undefined,
        serving: m.serving || undefined,
        category: m.category,
        nfg_code: (m as any).nfg_code,
      }));

      const intro = items.length > 0
        ? (activeLanguage === 'ja' ? `${items.length}品見つかりました` : `Found ${items.length} dishes`)
        : (activeLanguage === 'ja' ? 'メニューが見つかりませんでした' : 'No dishes found');

      // 次の導線チップを生成（別のカテゴリ + 季節 + コンテキストに応じた提案）
      const otherGroups = Object.entries(groupLabels).filter(([k]) => k !== menuGroup);
      const nextChips: { label: string; query: string }[] = otherGroups.map(([, label]) => ({
        label,
        query: label,
      }));
      nextChips.push({ label: copy.restaurant.seasonalMenu, query: copy.restaurant.seasonalMenu });
      const bt = (restaurantData?.business_type || '').toLowerCase();
      const isBarType = ['バー', 'カクテルバー', 'ワインバー', 'ダイニングバー', 'bar'].some(t => bt.includes(t.toLowerCase()));
      if (!isBarType) {
        nextChips.push({ label: copy.restaurant.drinksMenu, query: copy.restaurant.drinksMenu });
      }

      setResponses((prev) =>
        prev.map((r) =>
          r.id === responseId
            ? { ...r, output: { title: '', intro, body: [] }, streaming: false, quickExplainItems: items, contextChips: nextChips }
            : r
        )
      );
      typingStartedRef.current.add(responseId);
      setTypingState((prev) => ({ ...prev, [responseId]: { title: '', intro, body: [] } }));
      setTypingComplete((prev) => new Set(prev).add(responseId));
    } catch (err) {
      const errMsg = activeLanguage === 'ja' ? '検索に失敗しました' : 'Search failed';
      setResponses((prev) =>
        prev.map((r) =>
          r.id === responseId
            ? { ...r, output: { title: '', intro: errMsg, body: [] }, streaming: false }
            : r
        )
      );
      typingStartedRef.current.add(responseId);
      setTypingState((prev) => ({ ...prev, [responseId]: { title: '', intro: errMsg, body: [] } }));
      setTypingComplete((prev) => new Set(prev).add(responseId));
    }

    requestAnimationFrame(() => {
      const container = captureBodyRef.current;
      const el = document.getElementById(`msg-${responseId}`);
      if (container && el) {
        container.scrollTo({ top: el.offsetTop - container.offsetTop, behavior: 'smooth' });
      }
    });
  };

  const handleAttachment = (file: File | null, source = "library") => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAttachment({
      id: `${Date.now()}`,
      source,
      file,
      preview,
      revokeOnCleanup: true,
      label:
        source === "camera"
          ? copy.attachment.cameraPhoto
          : copy.attachment.photoLibrary,
    });
    setHideRecommendations(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleFeedback = (id: string, rating: "good" | "bad") => {
    const response = responses.find((item) => item.id === id);
    if (!response || !response.output) return;
    // Optimistic UI update
    setResponses((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, feedback: rating } : item
      )
    );
    // Send to API if message_uid exists
    if (response.messageUid) {
      FeedbackApi.submit(response.messageUid, rating).catch((err) => {
        console.log("feedback_api_error", err);
      });
    }
    // Keep local log as fallback
    logFeedback({
      input: response.input,
      output: response.output,
      language: response.language,
      rating,
      createdAt: new Date().toISOString(),
    });
  };

  const handleNewChat = () => {
    setResponses([]);
    setMessage("");
    setAttachment(null);
    setLoading(false);
    setHideRecommendations(false);
    setUserScrolledUp(false);
    setShowScrollButton(false);
    setIsTypingActive(false);
    setTypingComplete(new Set());
    setTypingState({});
    // スレッドとセッションストレージをリセット
    threadUidRef.current = null;
    restoredIdsRef.current = new Set();
    try {
      const key = `ngraph_responses_${restaurantSlug || 'default'}`;
      const tKey = `ngraph_threadUid_${restaurantSlug || 'default'}`;
      localStorage.removeItem(key);
      localStorage.removeItem(tKey);
    } catch {}
  };

  const handleSelectThread = async (threadUid: string) => {
    // Clear current state
    setResponses([]);
    setMessage("");
    setAttachment(null);
    setLoading(true);
    setHideRecommendations(true);
    setIsTypingActive(false);
    setTypingComplete(new Set());
    setTypingState({});
    restoredIdsRef.current = new Set();
    threadUidRef.current = threadUid;
    try {
      const key = `ngraph_responses_${restaurantSlug || 'default'}`;
      const tKey = `ngraph_threadUid_${restaurantSlug || 'default'}`;
      localStorage.removeItem(key);
      localStorage.setItem(tKey, threadUid);
    } catch {}

    // Fetch thread messages from BE
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api';
      const resp = await fetch(`${apiBaseUrl}/public-chat/thread/${encodeURIComponent(threadUid)}/messages`);
      if (resp.ok) {
        const msgs: { user_message: string; ai_response: string; uid: string }[] = await resp.json();
        const restored: ResponseItem[] = msgs.map((m) => {
          const id = m.uid || `${Date.now()}-${Math.random()}`;
          return {
            id,
            input: { text: m.user_message, attachment: null, imageUrl: null },
            output: { title: '', intro: m.ai_response, body: [] },
            language: activeLanguage,
            feedback: null,
            messageUid: m.uid,
          };
        });
        const ids = new Set(restored.map((r) => r.id));
        restoredIdsRef.current = ids;
        // Set typing state as complete for all restored messages
        const restoredTyping: Record<string, { title: string; intro: string; body: string[] }> = {};
        restored.forEach((r) => {
          if (r.output) {
            restoredTyping[r.id] = { title: '', intro: r.output.intro, body: [] };
            typingStartedRef.current.add(r.id);
          }
        });
        setTypingState((prev) => ({ ...prev, ...restoredTyping }));
        setTypingComplete(new Set(ids));
        setResponses(restored);
      }
    } catch (err) {
      console.log("thread_load_error", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync handleNewChat + handleSelectThread to AppContext for sidebar
  useEffect(() => {
    setOnNewChat(() => handleNewChat);
    setOnSelectThread(() => handleSelectThread);
    return () => { setOnNewChat(null); setOnSelectThread(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantSlug]);

  const handleNfgFeedback = async (menuUid: string, type: 'good' | 'bad') => {
    const current = nfgFeedback[menuUid];
    if (current === type) return; // already submitted
    setNfgFeedback(prev => ({ ...prev, [menuUid]: type }));
    try {
      await NfgFeedbackApi.submit(menuUid, type, threadUidRef.current || undefined);
    } catch {}
  };

  const openLikedDrawer = async () => {
    setLikedDrawerOpen(true);
    const uids = [...likedMenus];
    if (uids.length === 0) return;
    try {
      const res = await LikedMenusApi.get(uids);
      setLikedItems(res.result);
    } catch {}
  };

  // 人気ランキング (♡ 数 Top N) モーダル
  const [popularOpen, setPopularOpen] = useState(false);
  const [popularItems, setPopularItems] = useState<import("../services/menuLikes").PopularMenuItem[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const openPopularDrawer = async () => {
    if (!restaurantSlug) return;
    setPopularOpen(true);
    setPopularLoading(true);
    try {
      const { getPopularMenus } = await import("../services/menuLikes");
      const items = await getPopularMenus(restaurantSlug, 10);
      setPopularItems(items);
    } catch {
      setPopularItems([]);
    } finally {
      setPopularLoading(false);
    }
  };

  // ハンバーガー内の「お気に入り」「人気ランキング」を AppContext 経由で公開
  useEffect(() => {
    setOnOpenLiked(() => openLikedDrawer);
    setOnOpenPopular(() => openPopularDrawer);
    return () => { setOnOpenLiked(null); setOnOpenPopular(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantSlug, likedMenus]);

  // MenuListDrawer のチップ → chat に質問投入する callback を登録
  // ref で最新の handleSend を常に参照（closure stale 回避）
  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  });
  useEffect(() => {
    const askHandler = (query: string) => {
      handleSendRef.current?.(query);
    };
    setOnAskAbout(() => askHandler);
    return () => { setOnAskAbout(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoUpload = async (menuUid: string, file: File) => {
    setPhotoUploading(menuUid);
    try {
      const res = await PhotoContributionApi.submit(menuUid, file, threadUidRef.current || undefined);
      setPhotoResult(prev => ({ ...prev, [menuUid]: { status: res.result.status, match_result: res.result.match_result } }));
      if (res.result.auto_published) {
        setPhotoAdoptedCount(c => c + 1);
      }
    } catch (e: any) {
      if (e.message === 'rate_limit') {
        setPhotoResult(prev => ({ ...prev, [menuUid]: { status: 'rate_limit', match_result: '' } }));
      } else {
        setPhotoResult(prev => ({ ...prev, [menuUid]: { status: 'error', match_result: '' } }));
      }
    } finally {
      setPhotoUploading(null);
    }
  };

  // 「この料理について聞く」: 料理名を入力欄に引用挿入し、客がそのまま質問を続けられるようにする
  const handleAskAbout = (item: QuickExplainItem) => {
    const name = activeLanguage !== 'ja' && item.name_en ? item.name_en : item.name_jp;
    const prefix: Record<string, string> = {
      ja: `「${name}」について `,
      en: `About "${name}": `,
      ko: `「${name}」에 대해 `,
      'zh-Hans': `关于「${name}」：`,
      'zh-Hant': `關於「${name}」：`,
    };
    const text = prefix[activeLanguage] || prefix.en;
    setMessage(text);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(text.length, text.length);
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    });
  };

  // QRスキャン時: メニュー一覧を優先表示
  if (qrMenuMode && restaurantSlug) {
    return (
      <QRMenuView
        restaurantSlug={restaurantSlug}
        language={activeLanguage}
        onChatMode={() => setQrMenuMode(false)}
      />
    );
  }

  const isHeroLanding = responses.length === 0 && !loading && !attachment && !ownerQAActive;

  return (
    <div
      className={`page capture-page${isHeroLanding ? " is-hero-landing" : ""}`}
      onClick={handleBackgroundClick}
    >
      <CaptureHeader
        onMenu={
          onOpenMenu ??
          openHistoryDrawer ??
          onBack ??
          (() => {
            router.push("/explore");
          })
        }
        onNewChat={handleNewChat}
        onLanguage={openLanguageModal ?? openLanguageModalFromContext}
        restaurantName={
          (activeLanguage !== 'ja' && selectedRestaurant?.name_romaji
            ? selectedRestaurant.name_romaji
            : selectedRestaurant?.name) || null
        }
        restaurantData={selectedRestaurant}
      />

      {photoAdoptedCount > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', textAlign: 'center', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
          📸 {activeLanguage === 'ja' ? `あなたの写真が${photoAdoptedCount}品のNFGに採用されました` : `Your photo was adopted for ${photoAdoptedCount} NFG item${photoAdoptedCount > 1 ? 's' : ''}`}
        </div>
      )}

      {ownerSession && (
        <div className="owner-banner">
          <span className="owner-banner-label">店主モード</span>
          <div className="owner-banner-actions">
            {ownerQAActive ? (
              <button type="button" className="owner-banner-btn owner-banner-btn-ghost" onClick={() => setOwnerQAActive(false)}>
                質問を閉じる
              </button>
            ) : (
              <button type="button" className="owner-banner-btn" onClick={() => setOwnerQAActive(true)}>
                {ownerPending > 0 ? `質問に答える(${ownerPending}件)` : '確認事項をチェック'}
              </button>
            )}
            {/* メニュー一覧→各品を修正(店主モードでは編集UIが出る) */}
            <button type="button" className="owner-banner-btn owner-banner-btn-ghost" onClick={() => { setOwnerQAActive(false); openMenuList(); }}>
              メニューを修正
            </button>
            {/* 店主モードごと抜けて客画面へ(セッションは保持、右下や再タップで戻れる) */}
            <button
              type="button"
              className="owner-banner-exit"
              onClick={() => { setOwnerQAActive(false); setOwnerSession(null); }}
            >
              店主モードを終了
            </button>
          </div>
        </div>
      )}

      <div
        className="capture-body"
        onScroll={handleContentScroll}
        ref={captureBodyRef}
      >
        <main
          className={`capture-main hero-stack${
            responses.length > 0 || loading || ownerQAActive ? " is-hidden" : ""
          }`}
        >
          {!restaurantLoading && !restaurantData && restaurantSlug ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              gap: '12px',
            }}>
              <div style={{ fontSize: '48px' }}>🔍</div>
              <div style={{ fontSize: '16px', color: 'var(--color-text-body)', textAlign: 'center' }}>
                {copy.capture.notFound}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', textAlign: 'center' }}>
                {copy.capture.checkUrl}
              </div>
            </div>
          ) : restaurantLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '2px solid var(--color-border-subtle)',
                borderTopColor: 'var(--color-text-half)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }} />
              <div style={{ fontSize: '14px', color: 'var(--color-text-dim)', textAlign: 'center' }}>
                {copy.capture.loading}
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <CameraPrompt
              heading={copy.hero.heading}
              sub={copy.hero.sub}
              buttonLabel={copy.cameraPrompt.openCamera}
              onCamera={() => {
                if (onOpenCamera) {
                  onOpenCamera();
                  return;
                }
                const cameraUrl = selectedRestaurant ? `/camera?restaurant=${selectedRestaurant.slug}` : "/camera";
                router.push(cameraUrl);
              }}
              restaurantLogo={selectedRestaurant?.logo_url}
              restaurantName={selectedRestaurant?.name}
              restaurantNameRomaji={activeLanguage !== 'ja' ? selectedRestaurant?.name_romaji : undefined}
              recommendations={currentSuggestions.chips?.slice(0, 3)}
              onRecommendationClick={(text) => handleSend(text)}
              isWebMode={isWebMode}
              restaurantAddress={selectedRestaurant?.address}
              restaurantAccess={selectedRestaurant?.access_info}
              restaurantHours={selectedRestaurant?.opening_hours}
              restaurantHolidays={selectedRestaurant?.holidays}
              onReservationClick={() => {
                const reservationMessages: Record<string, string> = {
                  ja: '予約をしたいのですが',
                  en: "I'd like to make a reservation",
                  ko: '예약하고 싶습니다',
                  'zh-Hans': '我想预约',
                  'zh-Hant': '我想預約',
                  es: 'Me gustaría hacer una reserva',
                  fr: 'Je voudrais faire une réservation',
                };
                handleSend(reservationMessages[activeLanguage] || reservationMessages.en);
              }}
              onExploreMenuClick={() => openMenuList()}
              menuStrip={
                /* テーブルに置いてあるメニュー: 挨拶文の下の写真/品書きミニカード(無言・静的) */
                !isWebMode && selectedRestaurant ? (
                  <MenuStrip
                    restaurantSlug={selectedRestaurant.slug}
                    onCardTap={(uid) => openMenuList(uid)}
                    onSeeAll={() => openMenuList()}
                  />
                ) : undefined
              }
            />
          )}


        </main>


        <section className="capture-thread" ref={threadRef}>
          {ownerSession && ownerQAActive && (
            <OwnerQuestionFlow
              sessionToken={ownerSession.sessionToken}
              onClose={() => setOwnerQAActive(false)}
              onCountChange={(n) => setOwnerPending(n)}
              onSessionExpired={() => {
                // 30日失効 or revoke: 保存セッションを破棄してパスコード再入力へ
                try {
                  if (ownerParam) localStorage.removeItem(`omiseai_owner_${ownerParam}`);
                } catch {}
                setOwnerSession(null);
                setOwnerQAActive(false);
                setOwnerGateOpen(true);
              }}
            />
          )}
          {/* 店主モードのQ&A中は通常チャットのスレッドを隠す
             (質問に答えるフローと客向け会話が混ざらないように) */}
          {!(ownerSession && ownerQAActive) && responses.map((response, responseIdx) => (
            <div key={response.id} className="chat-thread-item" id={`msg-${response.id}`}>
              <div className="chat-row chat-row-user">
                <div className="chat-content">
                  {response.input.text && (
                    <div className="chat-message-wrapper">
                      <div className="chat-bubble chat-bubble-user">
                        {response.input.text}
                      </div>
                    </div>
                  )}
                  {response.input.imageUrl && (
                    <div className="chat-message-wrapper">
                      <div className="chat-bubble chat-bubble-user image">
                        <img
                          src={response.input.imageUrl}
                          alt={copy.chat.uploadPreview}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {response.output && response.quickExplainItems && response.quickExplainItems.length > 0 ? (
                /* Quick Explain カード表示 */
                <div className="chat-row chat-row-assistant">
                  <div className="chat-content">
                    <div className="nfg-cards-container">
                      <div className="nfg-cards-header">
                        {response.output.title}
                      </div>
                      <NFGCard
                        items={response.quickExplainItems}
                        language={activeLanguage}
                        likedMenus={likedMenus}
                        onLike={(menuUid) => handleLikeToggle(menuUid, response.quickExplainItems)}
                        onSuggestEdit={(info) => {
                          setSuggestionTarget({
                            name_jp: info.name_jp,
                            menu_uid: info.menu_uid,
                            restaurant_uid: selectedRestaurant?.uid,
                          });
                        }}
                        onAskAbout={handleAskAbout}
                        onPhotoUpload={handlePhotoUpload}
                        photoUploading={photoUploading}
                        cleanUrlBase={cleanUrlBase || undefined}
                        copy={{
                          verified: (copy as any).quickExplain?.verified || "Owner-verified",
                          pending: (copy as any).quickExplain?.pending || "On file",
                          aiEstimate: (copy as any).quickExplain?.aiEstimate || "AI Estimate",
                          newItem: (copy as any).quickExplain?.newItem || "New",
                          ingredients: copy.nfg.ingredients,
                          allergens: copy.nfg.allergens,
                          restrictions: copy.nfg.restrictions,
                          calories: copy.nfg.calories,
                          confidence: copy.nfg.confidence,
                          texture: copy.nfg.texture,
                          pairing: copy.nfg.pairing,
                          howToEat: copy.nfg.howToEat,
                          servingStyle: copy.nfg.servingStyle,
                          kidFriendly: copy.nfg.kidFriendly,
                          notKidFriendly: copy.nfg.notKidFriendly,
                          suggestEdit: copy.nfg.suggestEdit || 'この情報を修正',
                          tasteUmami: copy.nfg.tasteUmami,
                          tasteSweetness: copy.nfg.tasteSweetness,
                          tasteSourness: copy.nfg.tasteSourness,
                          tasteSaltiness: copy.nfg.tasteSaltiness,
                          tasteBitterness: copy.nfg.tasteBitterness,
                          tasteSpiciness: copy.nfg.tasteSpiciness,
                          tasteRichness: copy.nfg.tasteRichness,
                          tasteLightness: copy.nfg.tasteLightness,
                          tasteVolume: copy.nfg.tasteVolume,
                          tasteLocality: copy.nfg.tasteLocality,
                        }}
                      />
                    </div>
                    {typingComplete.has(response.id) && response.contextChips && response.contextChips.length > 0 && (
                      <div className="context-chips">
                        {response.contextChips.map((chip, i) => (
                          <button key={i} className="context-chip" onClick={() => handleSend(chip.query)}>
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {badCommentResponseId === response.id && response.feedback === 'bad' && (
                      <div className="bad-comment-box">
                        <div className="bad-comment-prompt">どうすれば良くなりますか？（任意）</div>
                        <div className="bad-comment-reasons">
                          {[
                            { key: 'incorrect_info', label: '情報が違う' },
                            { key: 'too_long', label: '冗長すぎる' },
                            { key: 'off_topic', label: '質問とズレてる' },
                            { key: 'other', label: 'その他' },
                          ].map((r) => (
                            <button
                              key={r.key}
                              type="button"
                              className={`bad-comment-reason${badCommentReason === r.key ? ' active' : ''}`}
                              onClick={() => setBadCommentReason(r.key)}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="bad-comment-text"
                          placeholder="自由記入（任意）"
                          value={badCommentText}
                          onChange={(e) => setBadCommentText(e.target.value)}
                          maxLength={500}
                          rows={2}
                        />
                        <div className="bad-comment-actions">
                          <button
                            type="button"
                            className="bad-comment-cancel"
                            onClick={() => { setBadCommentResponseId(null); setBadCommentReason(null); setBadCommentText(''); }}
                          >
                            キャンセル
                          </button>
                          <button
                            type="button"
                            className="bad-comment-submit"
                            onClick={() => submitBadComment(response.id)}
                          >
                            送信
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="feedback-row">
                      <div className="feedback-actions">
                        <button
                          className={`feedback-btn${response.feedback === 'good' ? ' active good' : ''}`}
                          type="button"
                          onClick={() => handleFeedback(response.id, 'good')}
                          aria-label="Good"
                        >
                          <ThumbsUp size={16} />
                        </button>
                        <button
                          className={`feedback-btn${response.feedback === 'bad' ? ' active bad' : ''}`}
                          type="button"
                          onClick={() => { handleFeedback(response.id, 'bad'); setBadCommentResponseId(response.id); }}
                          aria-label="Bad"
                        >
                          <ThumbsDown size={16} />
                        </button>
                        {(() => {
                          const _ft = _getResponseFullText(response);
                          const _cp = _extractCopyable(_ft);
                          if (!_cp) return null;
                          return (
                            <button
                              className={`feedback-btn action-btn${copiedMessageId === response.id ? " copied" : ""}`}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleCopyResponse(response.id, _cp); }}
                              aria-label="Copy"
                            >
                              <Copy size={14} />
                              <span>{copiedMessageId === response.id ? "✓" : "コピー"}</span>
                            </button>
                          );
                        })()}
                        {shouldShowReviewPrompt() && (
                          <a
                            href={restaurantData?.google_review_url ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="google-review-btn"
                            aria-label="Google Review"
                            onClick={() => {
                              if (restaurantSlug) {
                                EventApi.log({ restaurant_slug: restaurantSlug, event: 'review', message_uid: response.messageUid, thread_uid: threadUidRef.current, lang: activeLanguage });
                              }
                            }}
                          >
                            <Star size={14} fill="#FBBF24" stroke="#FBBF24" />
                            <span>{copy.restaurant.googleReview}</span>
                          </a>
                        )}
                      </div>
                      {shouldShowReviewTextPrompt(responseIdx) && (
                        <div className="review-prompt-text">{(copy.restaurant as any).reviewPromptText}</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : response.output && response.visionItems && response.visionItems.length > 0 ? (
                /* NFGカード表示（チャット応答テキスト + カード） */
                <div className="chat-row chat-row-assistant">
                  <div className="chat-content">
                    {/* NFGカードがある時: 番号付きメニューリスト部分を除外し、導入1行のみ表示 */}
                    {(() => {
                      const raw = typingState[response.id]?.intro ?? "";
                      // 番号付きリスト行を除去して導入文だけ残す
                      const stripped = raw.replace(/^\s*\d+\.\s+.+$/gm, "").trim();
                      if (!stripped) return null;
                      // NFGカードがあるので導入文は1行目だけに制限
                      const firstLine = stripped.split('\n').filter(l => l.trim())[0]?.trim() || "";
                      if (!firstLine) return null;
                      return (
                        <div className="chat-message-wrapper" style={{ marginBottom: 8 }}>
                          <div className="chat-bubble chat-bubble-assistant">
                            <div className="assistant-intro">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                rehypePlugins={[rehypeHighlight]}
                                components={{
                                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                  ul: ({ children }) => <ul className="menu-list">{children}</ul>,
                                  ol: ({ children }) => <ol className="menu-list numbered">{children}</ol>,
                                  li: ({ children }) => <li className="menu-item">{children}</li>,
                                }}
                              >
                                {escapeNumberedLists(firstLine)}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="nfg-cards-container">
                      <div className="nfg-cards-header">
                        {response.output.title}
                      </div>
                      <NFGCard
                        items={response.visionItems.map(visionToQuickExplain)}
                        language={activeLanguage}
                        likedMenus={likedMenus}
                        onLike={(menuUid) => handleLikeToggle(menuUid, response.visionItems as unknown as QuickExplainItem[] | undefined)}
                        onSuggestEdit={(info) => {
                          setSuggestionTarget({
                            name_jp: info.name_jp,
                            menu_uid: info.menu_uid,
                            restaurant_uid: selectedRestaurant?.uid,
                          });
                        }}
                        onAskAbout={handleAskAbout}
                        onPhotoUpload={handlePhotoUpload}
                        photoUploading={photoUploading}
                        cleanUrlBase={cleanUrlBase || undefined}
                        copy={{
                          verified: (copy as any).quickExplain?.verified || "Owner-verified",
                          pending: (copy as any).quickExplain?.pending || "On file",
                          aiEstimate: (copy as any).quickExplain?.aiEstimate || "AI Estimate",
                          newItem: (copy as any).quickExplain?.newItem || "New",
                          ingredients: copy.nfg.ingredients,
                          allergens: copy.nfg.allergens,
                          restrictions: copy.nfg.restrictions,
                          calories: copy.nfg.calories,
                          confidence: copy.nfg.confidence,
                          texture: copy.nfg.texture,
                          pairing: copy.nfg.pairing,
                          howToEat: copy.nfg.howToEat,
                          servingStyle: copy.nfg.servingStyle,
                          kidFriendly: copy.nfg.kidFriendly,
                          notKidFriendly: copy.nfg.notKidFriendly,
                          suggestEdit: copy.nfg.suggestEdit || 'この情報を修正',
                          tasteUmami: copy.nfg.tasteUmami,
                          tasteSweetness: copy.nfg.tasteSweetness,
                          tasteSourness: copy.nfg.tasteSourness,
                          tasteSaltiness: copy.nfg.tasteSaltiness,
                          tasteBitterness: copy.nfg.tasteBitterness,
                          tasteSpiciness: copy.nfg.tasteSpiciness,
                          tasteRichness: copy.nfg.tasteRichness,
                          tasteLightness: copy.nfg.tasteLightness,
                          tasteVolume: copy.nfg.tasteVolume,
                          tasteLocality: copy.nfg.tasteLocality,
                        }}
                      />
                    </div>
                    {typingComplete.has(response.id) && response.contextChips && response.contextChips.length > 0 && (
                      <div className="context-chips">
                        {response.contextChips.map((chip, i) => (
                          <button key={i} className="context-chip" onClick={() => handleSend(chip.query)}>
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {typingComplete.has(response.id) && (() => {
                      const fullText = [response.output?.intro, ...(response.output?.body || [])].filter(Boolean).join('\n');
                      const items = extractNumberedItems(fullText);
                      if (items.length < 2) return null;
                      // Build name_jp → name_en map from NFG cards for non-ja display
                      const nameMap: Record<string, string> = {};
                      if (activeLanguage !== 'ja' && response.visionItems) {
                        for (const vi of response.visionItems) {
                          if (vi.name_jp && vi.name_en) {
                            nameMap[vi.name_jp] = vi.name_en;
                          }
                        }
                      }
                      return (
                        <div className="suggestion-mini-cards">
                          <div className="suggestion-mini-cards-label">
                            {copy.capture.relatedMenu}
                          </div>
                          {items.map((item) => {
                            const displayName = nameMap[item.name] || item.name;
                            return (
                              <button
                                key={item.num}
                                className="suggestion-mini-card"
                                type="button"
                                onClick={() => handleSend(
                                  copy.capture.tellMeMore.replace('{num}', String(item.num)).replace('{name}', displayName)
                                )}
                              >
                                <span className="suggestion-mini-card-name">{displayName}</span>
                                <span className="suggestion-mini-card-arrow">›</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                    {/* Feedback for NFG cards */}
                    {badCommentResponseId === response.id && response.feedback === 'bad' && (
                      <div className="bad-comment-box">
                        <div className="bad-comment-prompt">どうすれば良くなりますか？（任意）</div>
                        <div className="bad-comment-reasons">
                          {[
                            { key: 'incorrect_info', label: '情報が違う' },
                            { key: 'too_long', label: '冗長すぎる' },
                            { key: 'off_topic', label: '質問とズレてる' },
                            { key: 'other', label: 'その他' },
                          ].map((r) => (
                            <button
                              key={r.key}
                              type="button"
                              className={`bad-comment-reason${badCommentReason === r.key ? ' active' : ''}`}
                              onClick={() => setBadCommentReason(r.key)}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="bad-comment-text"
                          placeholder="自由記入（任意）"
                          value={badCommentText}
                          onChange={(e) => setBadCommentText(e.target.value)}
                          maxLength={500}
                          rows={2}
                        />
                        <div className="bad-comment-actions">
                          <button
                            type="button"
                            className="bad-comment-cancel"
                            onClick={() => { setBadCommentResponseId(null); setBadCommentReason(null); setBadCommentText(''); }}
                          >
                            キャンセル
                          </button>
                          <button
                            type="button"
                            className="bad-comment-submit"
                            onClick={() => submitBadComment(response.id)}
                          >
                            送信
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="feedback-row">
                      <div className="feedback-actions">
                        <button
                          className={`feedback-btn${response.feedback === 'good' ? ' active good' : ''}`}
                          type="button"
                          onClick={() => handleFeedback(response.id, 'good')}
                          aria-label="Good"
                        >
                          <ThumbsUp size={16} />
                        </button>
                        <button
                          className={`feedback-btn${response.feedback === 'bad' ? ' active bad' : ''}`}
                          type="button"
                          onClick={() => { handleFeedback(response.id, 'bad'); setBadCommentResponseId(response.id); }}
                          aria-label="Bad"
                        >
                          <ThumbsDown size={16} />
                        </button>
                        {(() => {
                          const _ft = _getResponseFullText(response);
                          const _cp = _extractCopyable(_ft);
                          if (!_cp) return null;
                          return (
                            <button
                              className={`feedback-btn action-btn${copiedMessageId === response.id ? " copied" : ""}`}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleCopyResponse(response.id, _cp); }}
                              aria-label="Copy"
                            >
                              <Copy size={14} />
                              <span>{copiedMessageId === response.id ? "✓" : "コピー"}</span>
                            </button>
                          );
                        })()}
                        {shouldShowReviewPrompt() && (
                          <a
                            href={restaurantData?.google_review_url ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="google-review-btn"
                            aria-label="Google Review"
                            onClick={() => {
                              if (restaurantSlug) {
                                EventApi.log({ restaurant_slug: restaurantSlug, event: 'review', message_uid: response.messageUid, thread_uid: threadUidRef.current, lang: activeLanguage });
                              }
                            }}
                          >
                            <Star size={14} fill="#FBBF24" stroke="#FBBF24" />
                            <span>{copy.restaurant.googleReview}</span>
                          </a>
                        )}
                      </div>
                      {shouldShowReviewTextPrompt(responseIdx) && (
                        <div className="review-prompt-text">{(copy.restaurant as any).reviewPromptText}</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : response.output ? (
                /* 従来のチャットバブル表示 */
                <div className="chat-row chat-row-assistant">

                  <div className="chat-content">
                    <div className="chat-message-wrapper">
                      <div className="chat-bubble chat-bubble-assistant">
                        {typingState[response.id]?.title && (
                          <div className="assistant-title">
                            {typingState[response.id]?.title}
                          </div>
                        )}
                        {typingState[response.id]?.intro && (
                          <div className="assistant-intro">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkBreaks]}
                              rehypePlugins={[rehypeHighlight]}
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                ul: ({ children }) => <ul className="menu-list">{children}</ul>,
                                ol: ({ children }) => <ol className="menu-list numbered">{children}</ol>,
                                li: ({ children }) => <li className="menu-item">{children}</li>,
                              }}
                            >
                              {escapeNumberedLists(typingState[response.id]?.intro ?? "")}
                            </ReactMarkdown>
                          </div>
                        )}
                        {response.output.body.map((line, index) => (
                          <div key={`${line}-${index}`} className="assistant-line">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkBreaks]}
                              rehypePlugins={[rehypeHighlight]}
                              components={{
                                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                ul: ({ children }) => <ul className="menu-list">{children}</ul>,
                                ol: ({ children }) => <ol className="menu-list numbered">{children}</ol>,
                                li: ({ children }) => <li className="menu-item">{children}</li>,
                                code: ({ children, className }) => {
                                  const isInline = !className;
                                  if (isInline) {
                                    return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
                                  }
                                  return (
                                    <div className="relative group">
                                      <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto mb-3">
                                        <code className={className}>{children}</code>
                                      </pre>
                                      <button
                                        onClick={() => handleCopyCode(String(children))}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                                      >
                                        <Copy size={12} />
                                        {copiedCode === String(children) ? 'Copied!' : 'Copy'}
                                      </button>
                                    </div>
                                  );
                                },
                                blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 mb-3">{children}</blockquote>,
                              }}
                            >
                              {escapeNumberedLists(typingState[response.id]?.body?.[index] ?? "")}
                            </ReactMarkdown>
                          </div>
                        ))}
                        {typingComplete.has(response.id) && (
                          <>
                          {badCommentResponseId === response.id && response.feedback === 'bad' && (
                            <div className="bad-comment-box">
                              <div className="bad-comment-prompt">どうすれば良くなりますか？（任意）</div>
                              <div className="bad-comment-reasons">
                                {[
                                  { key: 'incorrect_info', label: '情報が違う' },
                                  { key: 'too_long', label: '冗長すぎる' },
                                  { key: 'off_topic', label: '質問とズレてる' },
                                  { key: 'other', label: 'その他' },
                                ].map((r) => (
                                  <button
                                    key={r.key}
                                    type="button"
                                    className={`bad-comment-reason${badCommentReason === r.key ? ' active' : ''}`}
                                    onClick={() => setBadCommentReason(r.key)}
                                  >
                                    {r.label}
                                  </button>
                                ))}
                              </div>
                              <textarea
                                className="bad-comment-text"
                                placeholder="自由記入（任意）"
                                value={badCommentText}
                                onChange={(e) => setBadCommentText(e.target.value)}
                                maxLength={500}
                                rows={2}
                              />
                              <div className="bad-comment-actions">
                                <button
                                  type="button"
                                  className="bad-comment-cancel"
                                  onClick={() => { setBadCommentResponseId(null); setBadCommentReason(null); setBadCommentText(''); }}
                                >
                                  キャンセル
                                </button>
                                <button
                                  type="button"
                                  className="bad-comment-submit"
                                  onClick={() => submitBadComment(response.id)}
                                >
                                  送信
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="feedback-row">
                            <div className="feedback-actions">
                              <button
                                className={`feedback-btn${response.feedback === 'good' ? ' active good' : ''}`}
                                type="button"
                                onClick={() => handleFeedback(response.id, 'good')}
                                aria-label="Good"
                              >
                                <ThumbsUp size={16} />
                              </button>
                              <button
                                className={`feedback-btn${response.feedback === 'bad' ? ' active bad' : ''}`}
                                type="button"
                                onClick={() => { handleFeedback(response.id, 'bad'); setBadCommentResponseId(response.id); }}
                                aria-label="Bad"
                              >
                                <ThumbsDown size={16} />
                              </button>
                              {(() => {
                                const _ft = _getResponseFullText(response);
                                const _cp = _extractCopyable(_ft);
                                if (!_cp) return null;
                                return (
                                  <button
                                    className={`feedback-btn action-btn${copiedMessageId === response.id ? " copied" : ""}`}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleCopyResponse(response.id, _cp); }}
                                    aria-label="Copy"
                                  >
                                    <Copy size={14} />
                                    <span>{copiedMessageId === response.id ? "✓" : "コピー"}</span>
                                  </button>
                                );
                              })()}
                              {shouldShowReviewPrompt() && (
                                <a
                                  href={restaurantData?.google_review_url ?? undefined}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="feedback-btn action-btn"
                                  aria-label="Google Review"
                                  onClick={() => {
                                    if (restaurantSlug) {
                                      EventApi.log({ restaurant_slug: restaurantSlug, event: 'review', message_uid: response.messageUid, thread_uid: threadUidRef.current, lang: activeLanguage });
                                    }
                                  }}
                                >
                                  <Star size={16} />
                                  <span>{copy.restaurant.googleReview}</span>
                                </a>
                              )}
                            </div>
                            {shouldShowReviewTextPrompt(responseIdx) && (
                              <div className="review-prompt-text">{(copy.restaurant as any).reviewPromptText}</div>
                            )}
                          </div>
                          </>
                        )}
                      </div>
                    </div>
                    {typingComplete.has(response.id) && (() => {
                      const fullText = [response.output?.intro, ...(response.output?.body || [])].filter(Boolean).join('\n');
                      const items = extractNumberedItems(fullText);
                      if (items.length < 2) return null;
                      return (
                        <div className="quick-reply-chips">
                          {items.map((item) => (
                            <button
                              key={item.num}
                              className="quick-reply-chip"
                              type="button"
                              onClick={() => handleSend(
                                copy.capture.tellMeMore.replace('{num}', String(item.num)).replace('{name}', item.name)
                              )}
                            >
                              {item.num}. {item.name}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                    {typingComplete.has(response.id) && response.contextChips && response.contextChips.length > 0 && (
                      <div className="context-chips">
                        {response.contextChips.map((chip, i) => (
                          <button key={i} className="context-chip" onClick={() => handleSend(chip.query)}>
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          {loading && (
            <div className="chat-row chat-row-assistant">
              <div className="chat-content">
                <div className="chat-message-wrapper">
                  <div className="chat-bubble chat-bubble-assistant chat-loading-bubble">
                    <span className="typing-indicator">
                      <span />
                      <span />
                      <span />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={handleScrollToBottom}
            className="scroll-to-bottom-btn"
            aria-label="Scroll to bottom"
          >
            <ChevronDown size={20} />
          </button>
        )}
      </div>

      {/* 店主モードのQ&A中は通常チャットの入力欄を隠す。
         選択肢タップだけが唯一の操作になり、入力欄に逃げて客向け会話に落ちる事故を防ぐ */}
      {!(ownerSession && ownerQAActive) && (
        <ChatDock
          textareaRef={textareaRef}
          message={message}
          suggestion={currentSuggestions.guide}
          attachment={attachment}
          onFocus={() => {}}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            setMessage(event.target.value)
          }
          onSend={handleSend}
          isStreaming={loading || isTypingActive}
          isHero={isHeroLanding}
          onStop={() => abortControllerRef.current?.abort()}
          onAttachment={(file) => handleAttachment(file ?? null, "library")}
          onAttachmentCamera={(file) => handleAttachment(file ?? null, "camera")}
          onOpenCamera={() => {
            if (onOpenCamera) {
              onOpenCamera();
              return;
            }
            const cameraUrl = selectedRestaurant ? `/camera?restaurant=${selectedRestaurant.slug}` : "/camera";
            router.push(cameraUrl);
          }}
          onRemoveAttachment={() => setAttachment(null)}
        />
      )}

      <div onClick={(event) => event.stopPropagation()}>
      </div>

      <SuggestionModal
        open={!!suggestionTarget}
        onClose={() => setSuggestionTarget(null)}
        menuItem={suggestionTarget || { name_jp: '' }}
        onSubmit={() => setSuggestionTarget(null)}
      />

      {/* 客画面中の控えめな店主モード戻り導線(右下)。保存セッションがあればパスコードなしで復帰 */}
      {!ownerSession && ownerParam && !ownerGateOpen && (
        <button type="button" className="owner-reentry-fab" onClick={enterOwnerMode}>
          店主モードに入る
        </button>
      )}

      {/* 店主モード: 初回パスコード入力 */}
      {ownerGateOpen && ownerParam && (
        <OwnerPasscodeModal
          token={ownerParam}
          onSuccess={(res) => {
            try {
              localStorage.setItem(`omiseai_owner_${ownerParam}`, JSON.stringify(res));
            } catch {}
            setOwnerSession({ sessionToken: res.session_token, restaurantName: res.restaurant_name });
            setOwnerPending(res.pending_count);
            setOwnerGateOpen(false);
          }}
          onCancel={() => setOwnerGateOpen(false)}
        />
      )}

      {/* ♡ お気に入りモーダル */}
      {likedDrawerOpen && (
        <div className="menu-modal-overlay" onClick={() => setLikedDrawerOpen(false)}>
          <div className="menu-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="menu-modal-header">
              <h3 className="menu-modal-title">お気に入り {likedItems.length > 0 && `(${likedItems.length})`}</h3>
              <button className="icon-button" onClick={() => setLikedDrawerOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="menu-modal-body">
              {likedItems.length === 0 ? (
                <p className="menu-modal-empty">まだお気に入りはありません。NFG カードの ♡ をタップして追加できます。</p>
              ) : (
                <ul className="menu-modal-list">
                  {likedItems.map((it) => (
                    <li key={it.menu_uid} className="menu-modal-item" onClick={() => {
                      handleSend(it.name_jp + 'について教えて');
                      setLikedDrawerOpen(false);
                    }}>
                      <div className="menu-modal-item-main">
                        <div className="menu-modal-item-name">{it.name_jp}</div>
                        {it.name_en && <div className="menu-modal-item-sub">{it.name_en}</div>}
                      </div>
                      <span className="menu-modal-item-price">¥{it.price?.toLocaleString?.() ?? it.price}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔥 人気ランキングモーダル */}
      {popularOpen && (
        <div className="menu-modal-overlay" onClick={() => setPopularOpen(false)}>
          <div className="menu-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="menu-modal-header">
              <h3 className="menu-modal-title">人気ランキング</h3>
              <button className="icon-button" onClick={() => setPopularOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="menu-modal-body">
              {popularLoading ? (
                <p className="menu-modal-empty">読み込み中…</p>
              ) : popularItems.length === 0 ? (
                <p className="menu-modal-empty">まだランキングデータがありません。気に入った料理に ♡ をつけて始まります。</p>
              ) : (
                <ol className="menu-modal-list menu-modal-list-numbered">
                  {popularItems.map((it) => (
                    <li key={it.menu_uid} className="menu-modal-item" onClick={() => {
                      handleSend(it.name_jp + 'について教えて');
                      setPopularOpen(false);
                    }}>
                      <span className="menu-modal-rank">{it.rank}</span>
                      <div className="menu-modal-item-main">
                        <div className="menu-modal-item-name">{it.name_jp}</div>
                        {it.name_en && <div className="menu-modal-item-sub">{it.name_en}</div>}
                      </div>
                      <span className="menu-modal-item-likes">♡ {it.like_count}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
