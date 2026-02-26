"use client";

import {
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
import { FeedbackApi, EventApi, type VisionMenuItem, ContributionApi, PhotoContributionApi, NfgFeedbackApi, LikedMenusApi, type LikedMenuItem } from "../services/api";
import SuggestionModal from "../components/SuggestionModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import { User, Bot, ChevronDown, Copy, Share2, Sparkles, ThumbsUp, ThumbsDown, Star, MapPin } from "lucide-react";
import CaptureHeader from "../components/CaptureHeader";
import CameraPrompt from "../components/CameraPrompt";
import ChatDock from "../components/ChatDock";
import { useAppContext } from "../components/AppProvider";
import { getUiCopy, type LanguageCode } from "../i18n/uiCopy";
import { recordVisit, saveThread, getThreads } from "../utils/storage";

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
  address?: string | null
  city?: string | null
  phone_number?: string | null
  opening_hours?: string | null
  holidays?: string | null
  access_info?: string | null
  budget?: string | null
  instagram_url?: string | null
  business_type?: string | null
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
  // Match patterns like "1. **料理名**" or "1. 料理名 —"
  const regex = /^\s*(\d+)\.\s+\*{0,2}([^*\n—–\-]+?)\*{0,2}\s*(?:[—–\-]|$)/gm;
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
  return "申し訳ございません、接続に問題がありました。もう一度お試しください。";
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
  const restaurantSlug = searchParams?.get("restaurant");
  const [restaurantData, setRestaurantData] = useState<ApiRestaurant | null>(null);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const {
    language: contextLanguage,
    openLanguageModal: openLanguageModalFromContext,
    openHistoryDrawer,
    pendingAttachment,
    setPendingAttachment,
    setRestaurantSlug: setCtxSlug,
    setOnNewChat,
    setOnSelectThread,
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
    // sessionStorageから復元（ページ遷移しても残る）
    if (typeof window === 'undefined') return [];
    try {
      const key = `ngraph_responses_${restaurantSlug || 'default'}`;
      const saved = sessionStorage.getItem(key);
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
  const recommendCacheRef = useRef<Record<string, { response: string; messageUid: string | null }>>({});
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
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewToast, setReviewToast] = useState(false);
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

  // responsesをsessionStorageに自動保存
  useEffect(() => {
    if (responses.length === 0) return;
    try {
      const key = `ngraph_responses_${restaurantSlug || 'default'}`;
      sessionStorage.setItem(key, JSON.stringify(responses));
    } catch {}
  }, [responses, restaurantSlug]);

  // photo adopted チェック
  useEffect(() => {
    if (!restaurantSlug) return;
    const key = `ngraph_threadUid_${restaurantSlug || 'default'}`;
    const tid = sessionStorage.getItem(key);
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
      sessionStorage.removeItem(`ngraph_responses_${restaurantSlug || 'default'}`);
      sessionStorage.removeItem(`ngraph_threadUid_${restaurantSlug || 'default'}`);
    } catch {}
    threadUidRef.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // thread_uid復元 + 復元レスポンスのタイピング状態セット
  useEffect(() => {
    if (typeof window === 'undefined' || isNewVisit) return;
    try {
      const key = `ngraph_threadUid_${restaurantSlug || 'default'}`;
      const saved = sessionStorage.getItem(key);
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

  const isCardExpanded = (responseId: string, cardIndex: number, totalItems: number) => {
    const expanded = expandedCards[responseId];
    if (expanded) return expanded.has(cardIndex);
    return totalItems <= 2;
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
  const scanLoggedRef = useRef(false);
  const isNfgMode = searchParams?.get("nfg") === "true";
  
  const selectedRestaurant = restaurantData;

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
                address: data.result.address || null,
                created_at: '',
                updated_at: ''
              });
              recordVisit(data.result.slug, data.result.name);
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

  // Pre-fetch recommend text responses for instant display
  useEffect(() => {
    if (!restaurantData?.recommend_texts?.length) return;
    const controller = new AbortController();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api';
    const slug = restaurantData.slug;
    const jaTexts = restaurantData.recommend_texts_ja || restaurantData.recommend_texts;
    recommendCacheRef.current = {};

    restaurantData.recommend_texts.forEach(async (text, i) => {
      const jaText = jaTexts?.[i] || text;
      try {
        const resp = await fetch(`${apiBaseUrl}/public-chat/${encodeURIComponent(slug)}/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: activeLanguage === 'ja' ? jaText : text, in_store: isInStore, language: activeLanguage }),
          signal: controller.signal,
        });
        if (resp.ok && resp.body) {
          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let fullText = '';
          let messageUid: string | null = null;
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
                if (data.type === 'content') fullText += data.content;
                if (data.type === 'done' && data.message_uid) messageUid = data.message_uid;
              } catch { /* skip */ }
            }
          }
          if (fullText) {
            recommendCacheRef.current[text] = { response: fullText, messageUid };
          }
        }
      } catch { /* silent — includes AbortError */ }
    });
    return () => controller.abort();
  }, [restaurantData, activeLanguage]);

  const copy = useMemo(() => getUiCopy(activeLanguage), [activeLanguage]);
  
  const currentSuggestions = useMemo(() => {
    if (selectedRestaurant) {
      const displayName = (activeLanguage !== 'ja' && selectedRestaurant.name_romaji)
        ? selectedRestaurant.name_romaji
        : selectedRestaurant.name;

      // Use custom recommend_texts if set (already translated by backend)
      if (selectedRestaurant.recommend_texts && selectedRestaurant.recommend_texts.length > 0) {
        return {
          guide: copy.restaurant.chatPlaceholder,
          chips: selectedRestaurant.recommend_texts
        };
      }

      // Default restaurant-specific suggestions
      const chips = [
        copy.restaurant.signatureDish,
        copy.restaurant.bestTime,
        copy.restaurant.dietaryOptions
      ];

      if ('cuisine' in selectedRestaurant) {
        chips.splice(1, 0, copy.restaurant.aboutCuisine.replace('{cuisine}', (selectedRestaurant as any).cuisine));
      }

      return {
        guide: copy.restaurant.chatPlaceholder,
        chips
      };
    }
    return copy.suggestions;
  }, [selectedRestaurant, copy.suggestions, copy.restaurant, activeLanguage]);

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

    const scrollToBottom = (smooth = true, force = false) => {
      const container = captureBodyRef.current;
      if (!container) return;

      // During typing, always auto-scroll regardless of user position
      // After typing, only scroll if forced or user hasn't scrolled up
      if (!isTypingActive && userScrolledUp && !force) return;

      const scrollOptions: ScrollToOptions = {
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      };

      // Use requestAnimationFrame for better reliability
      requestAnimationFrame(() => {
        container.scrollTo(scrollOptions);
      });
    };

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
      
      // Ensure final scroll to bottom after all content including feedback buttons are rendered
      // Force scroll even if user scrolled up - typing completion should always show the end
      await wait(100);
      
      // Use multiple animation frames to ensure DOM is fully updated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToBottom(true, true); // Force scroll
            
            // Double-check scroll after a bit more time for lengthy content
            setTimeout(() => {
              scrollToBottom(true, true); // Force scroll
            }, 300);
          });
        });
      });
    };

    responses.forEach((response) => {
      if (!response.output) return;
      if (response.streaming) return; // SSE streaming handles its own display
      if (typingStartedRef.current.has(response.id)) return;
      typingStartedRef.current.add(response.id);
      void startTyping(response);
    });
  }, [responses]);

  // Auto-scroll when typing state changes during active typing - ChatGPT style
  useEffect(() => {
    if (isTypingActive) {
      const container = captureBodyRef.current;
      if (container) {
        // Immediate scroll without smooth behavior for real-time following
        // This creates the ChatGPT-like effect where content is always visible
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      }
    }
  }, [typingState, isTypingActive]);

  // Continuous auto-scroll during typing or loading using requestAnimationFrame
  useEffect(() => {
    let rafId: number | null = null;
    let lastTime = 0;

    const scrollStep = (time: number) => {
      if (time - lastTime >= 200) {
        lastTime = time;
        const container = captureBodyRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }
      rafId = requestAnimationFrame(scrollStep);
    };

    if (isTypingActive || loading) {
      rafId = requestAnimationFrame(scrollStep);
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isTypingActive, loading]);

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

    // Immediate scroll to bottom - ChatGPT style
    const scrollToBottomImmediate = () => {
      const container = captureBodyRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    };

    // Scroll immediately and then keep scrolling as content loads
    scrollToBottomImmediate();
    requestAnimationFrame(scrollToBottomImmediate);
    setTimeout(scrollToBottomImmediate, 50);
    setTimeout(scrollToBottomImmediate, 150);
    setTimeout(scrollToBottomImmediate, 300);

    try {
      let output: MockOutput;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-backend.ngraph.jp/api';

      if (attachmentSnapshot?.file) {
        // Image attached → use Vision API for menu analysis
        try {
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
          const streamResponse = await fetch(`${apiBaseUrl}/public-chat/${encodeURIComponent(restaurantSlugForApi)}/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: requestText,
              in_store: isInStore,
              thread_uid: threadUidRef.current,
              language: activeLanguage,
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
                      sessionStorage.setItem(tKey, data.thread_uid);
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
                  } else if (data.type === 'error') {
                    console.log("sse_error", data.message);
                    throw new Error(data.message || 'Server error');
                  } else if (data.type === 'done' && data.message_uid) {
                    const nfgItems = data.nfg_items as VisionMenuItem[] | undefined;
                    const contextChips = data.context_chips as { label: string; query: string }[] | undefined;
                    setResponses((prev) =>
                      prev.map((item) =>
                        item.id === responseId
                          ? { ...item, messageUid: data.message_uid, ...(nfgItems?.length ? { visionItems: nfgItems } : {}), ...(contextChips?.length ? { contextChips } : {}) }
                          : item
                      )
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

  const handleCachedRecommendation = (text: string, cached: { response: string; messageUid: string | null }) => {
    if (!cached.response) {
      handleSend(text);
      return;
    }
    const responseId = `${Date.now()}`;
    setHideRecommendations(true);
    setUserScrolledUp(false);

    typingStartedRef.current.add(responseId);

    setResponses((prev) => [
      ...prev,
      {
        id: responseId,
        input: { text, attachment: null, imageUrl: null },
        output: { title: '', intro: cached.response, body: [] },
        language: activeLanguage,
        feedback: null,
        messageUid: cached.messageUid,
      },
    ]);

    setTypingState((prev) => ({
      ...prev,
      [responseId]: { title: '', intro: cached.response, body: [] },
    }));
    setTypingComplete((prev) => new Set(prev).add(responseId));

    logConversation({
      input: { text, attachment: null },
      output: { title: '', intro: cached.response, body: [] },
      language: activeLanguage,
      createdAt: new Date().toISOString(),
    });

    requestAnimationFrame(() => {
      const container = captureBodyRef.current;
      if (container) container.scrollTop = container.scrollHeight;
    });
  };

  const handleRecommendationClick = (text: string) => {
    console.log("chip_send", { value: text });
    setHideRecommendations(true);
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

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyResponse = (id: string) => {
    const response = responses.find((item) => item.id === id);
    if (!response?.output) return;
    const text = [response.output.title, response.output.intro, ...(response.output.body || [])].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
    if (restaurantSlug) {
      EventApi.log({ restaurant_slug: restaurantSlug, event: 'copy', message_uid: response.messageUid, thread_uid: threadUidRef.current, lang: activeLanguage });
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: restaurantData?.name || 'NGraph', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId('__share__');
        setTimeout(() => setCopiedId(null), 2000);
      });
    }
    if (restaurantSlug) {
      EventApi.log({ restaurant_slug: restaurantSlug, event: 'share', thread_uid: threadUidRef.current, lang: activeLanguage });
    }
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
    recommendCacheRef.current = {};
    try {
      const key = `ngraph_responses_${restaurantSlug || 'default'}`;
      const tKey = `ngraph_threadUid_${restaurantSlug || 'default'}`;
      sessionStorage.removeItem(key);
      sessionStorage.removeItem(tKey);
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
      sessionStorage.removeItem(key);
      sessionStorage.setItem(tKey, threadUid);
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

  return (
    <div className="page capture-page" onClick={handleBackgroundClick}>
      <CaptureHeader
        onMenu={
          onOpenMenu ??
          openHistoryDrawer ??
          onBack ??
          (() => {
            router.push("/explore");
          })
        }
        onLanguage={openLanguageModal ?? openLanguageModalFromContext}
        restaurantName={
          (message.trim().length > 0 || responses.length > 0 || loading)
            ? (activeLanguage !== 'ja' && selectedRestaurant?.name_romaji
                ? selectedRestaurant.name_romaji
                : selectedRestaurant?.name) || null
            : null
        }
        restaurantData={selectedRestaurant}
      />

      {photoAdoptedCount > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', textAlign: 'center', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>
          📸 {activeLanguage === 'ja' ? `あなたの写真が${photoAdoptedCount}品のNFGに採用されました` : `Your photo was adopted for ${photoAdoptedCount} NFG item${photoAdoptedCount > 1 ? 's' : ''}`}
        </div>
      )}

      {likedMenus.size > 0 && (
        <button
          type="button"
          onClick={openLikedDrawer}
          style={{
            position: 'fixed', bottom: 80, right: 16, zIndex: 50,
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,80,80,0.9)', border: 'none',
            color: '#fff', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          ♥<span style={{ fontSize: 10, position: 'absolute', top: -4, right: -4, background: '#222', borderRadius: 8, padding: '1px 5px', fontWeight: 700 }}>{likedMenus.size}</span>
        </button>
      )}

      {likedDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.6)' }} onClick={() => setLikedDrawerOpen(false)} />
          <div style={{ background: '#1a1a1a', borderRadius: '16px 16px 0 0', maxHeight: '70vh', overflow: 'auto', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#f0f0f0' }}>♥ {activeLanguage === 'ja' ? 'お気に入り' : 'Favorites'} ({likedMenus.size})</span>
              <button type="button" onClick={() => setLikedDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            {likedItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                {activeLanguage === 'ja' ? '読み込み中...' : 'Loading...'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {likedItems.map(item => (
                  <button
                    key={item.menu_uid}
                    type="button"
                    onClick={() => { setLikedDrawerOpen(false); router.push(`/capture?restaurant=${item.restaurant_slug}`); }}
                    style={{
                      display: 'flex', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)',
                      borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'left', width: '100%',
                    }}
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍽</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name_jp}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        {item.restaurant_name}{item.price ? ` · ¥${item.price}` : ''}
                      </div>
                      {item.narrative?.description && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.narrative.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
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
            message.trim().length > 0 || responses.length > 0 || loading
              ? " is-hidden"
              : ""
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
              <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                {copy.capture.notFound}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
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
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: 'rgba(255,255,255,0.5)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }} />
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
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
              onRecommendationClick={(text) => {
                const cached = recommendCacheRef.current[text];
                if (cached) {
                  handleCachedRecommendation(text, cached);
                } else {
                  // Send text as-is (translated for non-ja, original for ja)
                  handleSend(text);
                }
              }}
            />
          )}

          {/* 口コミボタン */}
          {restaurantData && (
            <button
              type="button"
              className="review-btn"
              onClick={() => setReviewOpen(true)}
            >
              {copy.capture.writeReview}
            </button>
          )}

        </main>


        <section className="capture-thread" ref={threadRef}>
          {responses.map((response) => (
            <div key={response.id} className="chat-thread-item">
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

              {response.output && response.visionItems && response.visionItems.length > 0 ? (
                /* NFGカード表示（チャット応答テキスト + カード） */
                <div className="chat-row chat-row-assistant">
                  <div className="chat-content">
                    {/* NFGカードがある時: 番号付きメニューリスト部分を除外し、導入文のみ表示 */}
                    {(() => {
                      const raw = typingState[response.id]?.intro ?? "";
                      // 番号付きリスト行を除去して導入文だけ残す
                      const stripped = raw.replace(/^\s*\d+\.\s+.+$/gm, "").trim();
                      if (!stripped) return null;
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
                                {escapeNumberedLists(stripped)}
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
                      {response.visionItems.map((vi, idx) => {
                        return (
                          <div key={idx} className="nfg-card">
                            <div className="nfg-card-header">
                              <div className="nfg-card-title-row">
                                <span className="nfg-card-number">{idx + 1}.</span>
                                <span className="nfg-card-name">
                                  {activeLanguage !== 'ja' && vi.name_en ? vi.name_en : vi.name_jp}
                                </span>
                                {vi.price > 0 && (
                                  <span className="nfg-card-price">¥{vi.price.toLocaleString()}</span>
                                )}
                              </div>
                              {(activeLanguage !== 'ja' ? vi.name_jp : vi.name_en) && (
                                <div className="nfg-card-name-en">
                                  {activeLanguage !== 'ja' ? vi.name_jp : vi.name_en}
                                </div>
                              )}
                            </div>
                            {/* === Hero: 画像 + Food Graph 横並び === */}
                            <div className="nfg-card-hero">
                              <div className="nfg-card-thumb">
                                {vi.image_url ? (
                                  <img src={vi.image_url} alt={vi.name_jp} loading="lazy" />
                                ) : (
                                  <div
                                    className="nfg-photo-upload"
                                    onClick={() => {
                                      const menuUid = (vi as any).menu_uid;
                                      if (!menuUid || photoUploading) return;
                                      photoInputRefs.current[menuUid]?.click();
                                    }}
                                  >
                                    {photoUploading === (vi as any).menu_uid ? (
                                      <div className="nfg-photo-spinner" />
                                    ) : photoResult[(vi as any).menu_uid] ? (
                                      <div className="nfg-photo-result">
                                        {photoResult[(vi as any).menu_uid].match_result === 'match' || photoResult[(vi as any).menu_uid].status === 'approved'
                                          ? '✅'
                                          : photoResult[(vi as any).menu_uid].match_result === 'mismatch'
                                          ? '❌'
                                          : photoResult[(vi as any).menu_uid].status === 'rate_limit'
                                          ? '⏳'
                                          : '📤'}
                                        <span className="nfg-photo-msg">
                                          {photoResult[(vi as any).menu_uid].status === 'approved'
                                            ? (activeLanguage === 'ja' ? '採用!' : 'Adopted!')
                                            : photoResult[(vi as any).menu_uid].match_result === 'mismatch'
                                            ? (activeLanguage === 'ja' ? '不一致' : 'Mismatch')
                                            : photoResult[(vi as any).menu_uid].status === 'rate_limit'
                                            ? (activeLanguage === 'ja' ? '上限' : 'Limit')
                                            : photoResult[(vi as any).menu_uid].status === 'pending'
                                            ? (activeLanguage === 'ja' ? '確認中' : 'Pending')
                                            : (activeLanguage === 'ja' ? 'エラー' : 'Error')}
                                        </span>
                                      </div>
                                    ) : (
                                      <>
                                        <span className="nfg-photo-icon">📷</span>
                                        <span className="nfg-photo-label">{activeLanguage === 'ja' ? '写真を投稿' : 'Add photo'}</span>
                                      </>
                                    )}
                                    <input
                                      ref={el => { if ((vi as any).menu_uid) photoInputRefs.current[(vi as any).menu_uid] = el; }}
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      capture="environment"
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        const menuUid = (vi as any).menu_uid;
                                        if (file && menuUid) handlePhotoUpload(menuUid, file);
                                        e.target.value = '';
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                              {vi.taste_values && Object.keys(vi.taste_values).length > 0 && !((vi as any).dish_category === 'drink' && (() => { const vals = Object.values(vi.taste_values as Record<string,number>); return Math.max(...vals) - Math.min(...vals) <= 3; })()) && (() => {
                                const axes = ['umami','richness','saltiness','sweetness','spiciness','lightness','sourness','bitterness','volume','locality'] as const;
                                const labels: Record<string,string> = {
                                  umami: copy.nfg.tasteUmami, richness: copy.nfg.tasteRichness,
                                  saltiness: copy.nfg.tasteSaltiness, sweetness: copy.nfg.tasteSweetness,
                                  spiciness: copy.nfg.tasteSpiciness, lightness: copy.nfg.tasteLightness,
                                  sourness: copy.nfg.tasteSourness, bitterness: copy.nfg.tasteBitterness,
                                  volume: copy.nfg.tasteVolume, locality: copy.nfg.tasteLocality,
                                };
                                const axisColors: Record<string,string> = {umami:"#00e896",richness:"#e8c050",saltiness:"#a0a0ff",sweetness:"#f0a050",spiciness:"#ff6b4a",lightness:"#80d0ff",sourness:"#50c8f0",bitterness:"#80c080",volume:"#c080ff",locality:"#ff80a0"};
                                const N = axes.length, R = 88;
                                const pt = (i: number, rv: number) => {
                                  const a = (2 * Math.PI * i / N) - Math.PI / 2;
                                  return { x: rv * Math.cos(a), y: rv * Math.sin(a) };
                                };
                                const poly = (rv: number) => axes.map((_, i) => { const p = pt(i, rv); return `${p.x},${p.y}`; }).join(' ');
                                const tv = vi.taste_values as Record<string,number>;
                                const dataPoly = axes.map((a, i) => { const p = pt(i, R * (tv[a] || 0) / 10); return `${p.x},${p.y}`; }).join(' ');
                                const uid = `fg-${response.id}-${idx}`;
                                return (
                                  <div className="nfg-taste-chart">
                                    <div className="nfg-fg-label"><div className="nfg-fg-dot" /> NFG</div>
                                    <svg className="nfg-radar" viewBox="-110 -110 220 220">
                                      <defs>
                                        <radialGradient id={`rg-${uid}`} cx="50%" cy="50%" r="50%">
                                          <stop offset="0%" stopColor="#00e896" stopOpacity="0.25"/>
                                          <stop offset="100%" stopColor="#00e896" stopOpacity="0.03"/>
                                        </radialGradient>
                                        <filter id={`glow-${uid}`}><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                                      </defs>
                                      {[0.25,0.5,0.75,1].map(lv => <polygon key={lv} points={poly(R*lv)} fill="none" stroke={lv===1?"#2a2a2a":"#1a1a1a"} strokeWidth="0.5"/>)}
                                      {axes.map((_, i) => { const p = pt(i, R); return <line key={i} x1={0} y1={0} x2={p.x} y2={p.y} stroke="#222" strokeWidth="0.5"/>; })}
                                      <polygon points={dataPoly} fill={`url(#rg-${uid})`} stroke="#00e896" strokeWidth="1.5" strokeLinejoin="round" filter={`url(#glow-${uid})`}/>
                                      {myTasteAvg && (() => {
                                        const myPoly = axes.map((a, i) => { const p = pt(i, R * (myTasteAvg[a] || 0) / 10); return `${p.x},${p.y}`; }).join(' ');
                                        return <polygon points={myPoly} fill="none" stroke="#4f8cff" strokeWidth="1.2" strokeDasharray="4,3" strokeLinejoin="round" opacity="0.7"/>;
                                      })()}
                                      {axes.map((a, i) => { const v = (tv[a]||0)/10; const active = v > 0.3; const p = pt(i, R*v); return <circle key={i} cx={p.x} cy={p.y} r={active?3.5:2} fill={active?axisColors[a]:"#555"} stroke="#0a0a0a" strokeWidth="1"/>; })}
                                      {axes.map((a, i) => { const v = (tv[a]||0)/10; const active = v > 0.3; const p = pt(i, R*1.22); return <text key={i} x={p.x} y={p.y+3.5} textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize={active?9:7.5} fill={active?axisColors[a]:"rgba(255,255,255,0.5)"}>{labels[a]}{active ? ` ${Math.round(v*100)}` : ''}</text>; })}
                                    </svg>
                                  </div>
                                );
                              })()}
                            </div>
                            {/* === Brief: 説明 + アレルゲン + バッジ === */}
                            <div className="nfg-card-brief">
                                {vi.description && (
                                  <div className="nfg-card-desc">{vi.description}</div>
                                )}
                                {vi.allergens?.length > 0 && (
                                  <div className="nfg-card-fields">
                                    <div className="nfg-field nfg-field-allergen">
                                      <span className="nfg-field-label">{copy.nfg.allergens}</span>
                                      <span className="nfg-field-value">{vi.allergens.join(activeLanguage === 'ja' ? '、' : ', ')}</span>
                                    </div>
                                  </div>
                                )}
                                <div className="nfg-card-badge-row">
                                  {(() => {
                                    const rank = (vi as any).verification_rank || 'C';
                                    const isVad = rank === 'S' || rank === 'A';
                                    return (
                                      <span className={`nfg-badge nfg-rank nfg-rank-${rank.toLowerCase()}`}>
                                        <span className="nfg-rank-source">{isVad ? 'VAD' : 'GPT-4o'}</span>
                                        <span className="nfg-rank-dot">∙</span>
                                        <span className="nfg-rank-letter">{rank}</span>
                                      </span>
                                    );
                                  })()}
                                  <button
                                    type="button"
                                    className="nfg-badge"
                                    style={{
                                      cursor: 'pointer',
                                      background: (vi as any).menu_uid && likedMenus.has((vi as any).menu_uid) ? 'rgba(255,80,80,0.18)' : 'rgba(255,255,255,0.06)',
                                      color: (vi as any).menu_uid && likedMenus.has((vi as any).menu_uid) ? '#ff5050' : 'rgba(255,255,255,0.5)',
                                      border: (vi as any).menu_uid && likedMenus.has((vi as any).menu_uid) ? '1px solid rgba(255,80,80,0.3)' : '1px solid rgba(255,255,255,0.1)',
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const menuUid = (vi as any).menu_uid;
                                      if (!menuUid) return;
                                      const next = new Set(likedMenus);
                                      const isAdding = !next.has(menuUid);
                                      if (isAdding) { next.add(menuUid); } else { next.delete(menuUid); }
                                      setLikedMenus(next);
                                      localStorage.setItem('ngraph_liked_menus', JSON.stringify([...next]));
                                      // taste_valuesキャッシュ更新
                                      if (isAdding && vi.taste_values) {
                                        const tc = { ...tasteCache, [menuUid]: vi.taste_values };
                                        setTasteCache(tc);
                                        try { localStorage.setItem('ngraph_taste_cache', JSON.stringify(tc)); } catch {}
                                      } else if (!isAdding) {
                                        const tc = { ...tasteCache };
                                        delete tc[menuUid];
                                        setTasteCache(tc);
                                        try { localStorage.setItem('ngraph_taste_cache', JSON.stringify(tc)); } catch {}
                                      }
                                      if (isAdding && restaurantSlug) {
                                        EventApi.log({ restaurant_slug: restaurantSlug, event: 'dish_like', meta: { menu_uid: menuUid } });
                                      }
                                    }}
                                  >
                                    {(vi as any).menu_uid && likedMenus.has((vi as any).menu_uid) ? '♥' : '♡'}
                                  </button>
                                  {(vi as any).menu_uid && (
                                    <>
                                      <button
                                        type="button"
                                        className="nfg-badge"
                                        style={{
                                          cursor: 'pointer',
                                          background: nfgFeedback[(vi as any).menu_uid] === 'good' ? 'rgba(16,163,127,0.2)' : 'rgba(255,255,255,0.06)',
                                          color: nfgFeedback[(vi as any).menu_uid] === 'good' ? '#10a37f' : 'rgba(255,255,255,0.5)',
                                          border: nfgFeedback[(vi as any).menu_uid] === 'good' ? '1px solid rgba(16,163,127,0.4)' : '1px solid rgba(255,255,255,0.1)',
                                        }}
                                        onClick={(e) => { e.stopPropagation(); handleNfgFeedback((vi as any).menu_uid, 'good'); }}
                                      >👍</button>
                                      <button
                                        type="button"
                                        className="nfg-badge"
                                        style={{
                                          cursor: 'pointer',
                                          background: nfgFeedback[(vi as any).menu_uid] === 'bad' ? 'rgba(255,80,80,0.2)' : 'rgba(255,255,255,0.06)',
                                          color: nfgFeedback[(vi as any).menu_uid] === 'bad' ? '#ff5050' : 'rgba(255,255,255,0.5)',
                                          border: nfgFeedback[(vi as any).menu_uid] === 'bad' ? '1px solid rgba(255,80,80,0.4)' : '1px solid rgba(255,255,255,0.1)',
                                        }}
                                        onClick={(e) => { e.stopPropagation(); handleNfgFeedback((vi as any).menu_uid, 'bad'); }}
                                      >👎</button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    className="nfg-badge"
                                    style={{ marginLeft: 'auto', cursor: 'pointer', background: 'rgba(79,140,255,0.15)', color: '#4f8cff', border: '1px solid rgba(79,140,255,0.3)' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSuggestionTarget({
                                        name_jp: vi.name_jp,
                                        menu_uid: (vi as any).menu_uid,
                                        restaurant_uid: selectedRestaurant?.uid,
                                      });
                                    }}
                                  >
                                    {copy.nfg.suggestEdit || 'この情報を修正'}
                                  </button>
                                </div>
                              </div>
                              {/* === 詳しく見るで展開 === */}
                              {(() => {
                                const hasDetails = vi.image_url || vi.narrative || (vi.serving && (vi.serving.style || vi.serving.portion || vi.serving.temperature)) || (vi.ingredients?.length > 0) || (vi.restrictions && vi.restrictions.length > 0) || vi.flavor_profile || vi.estimated_calories || vi.tax_note || (vi.confidence != null && vi.confidence > 0);
                                if (!hasDetails) return null;
                                const detailsOpen = isDetailsExpanded(response.id, idx);
                                return (
                                  <>
                                    <button
                                      type="button"
                                      className="nfg-details-toggle"
                                      onClick={(e) => { e.stopPropagation(); toggleDetails(response.id, idx); }}
                                    >
                                      {detailsOpen
                                        ? copy.capture.less
                                        : copy.capture.moreDetails
                                      }
                                      <span className={`nfg-details-chevron${detailsOpen ? ' open' : ''}`}>▼</span>
                                    </button>
                                    <div className={`nfg-card-details${detailsOpen ? ' open' : ''}`}>
                                      {vi.narrative && (
                                        <div className="nfg-narrative">
                                          {vi.narrative.story && (
                                            <div className="nfg-narrative-story">{vi.narrative.story}</div>
                                          )}
                                          {vi.narrative.texture && (
                                            <div className="nfg-field">
                                              <span className="nfg-field-label">{copy.nfg.texture}</span>
                                              <span className="nfg-field-value">{vi.narrative.texture}</span>
                                            </div>
                                          )}
                                          {vi.narrative.how_to_eat && (
                                            <div className="nfg-field">
                                              <span className="nfg-field-label">{copy.nfg.howToEat}</span>
                                              <span className="nfg-field-value">{vi.narrative.how_to_eat}</span>
                                            </div>
                                          )}
                                          {vi.narrative.pairing && (
                                            <div className="nfg-field">
                                              <span className="nfg-field-label">{copy.nfg.pairing}</span>
                                              <span className="nfg-field-value">{vi.narrative.pairing}</span>
                                            </div>
                                          )}
                                          {vi.narrative.kid_friendly != null && (
                                            <div className="nfg-field">
                                              <span className="nfg-field-label">{vi.narrative.kid_friendly ? copy.nfg.kidFriendly : copy.nfg.notKidFriendly}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {vi.serving && (vi.serving.style || vi.serving.portion || vi.serving.temperature) && (
                                        <div className="nfg-serving">
                                          <div className="nfg-field">
                                            <span className="nfg-field-label">{copy.nfg.servingStyle}</span>
                                            <span className="nfg-field-value">
                                              {[vi.serving.style, vi.serving.portion, vi.serving.temperature].filter(Boolean).join(' / ')}
                                            </span>
                                          </div>
                                          {vi.serving.abv_label && (
                                            <div className="nfg-field">
                                              <span className="nfg-field-label">{copy.nfg.abv}</span>
                                              <span className="nfg-field-value">{vi.serving.abv_label}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <div className="nfg-card-fields">
                                        {vi.ingredients?.length > 0 && (
                                          <div className="nfg-field">
                                            <span className="nfg-field-label">{copy.nfg.ingredients}</span>
                                            <span className="nfg-field-value">{vi.ingredients.join(activeLanguage === 'ja' ? '、' : ', ')}</span>
                                          </div>
                                        )}
                                        {vi.restrictions && vi.restrictions.length > 0 && (
                                          <div className="nfg-field">
                                            <span className="nfg-field-label">{copy.nfg.restrictions}</span>
                                            <span className="nfg-field-value">{vi.restrictions.join(activeLanguage === 'ja' ? '、' : ', ')}</span>
                                          </div>
                                        )}
                                        {vi.flavor_profile && (
                                          <div className="nfg-field">
                                            <span className="nfg-field-label">{copy.nfg.flavorProfile}</span>
                                            <span className="nfg-field-value">{vi.flavor_profile}</span>
                                          </div>
                                        )}
                                        {vi.estimated_calories && (
                                          <div className="nfg-field">
                                            <span className="nfg-field-label">{copy.nfg.calories}</span>
                                            <span className="nfg-field-value">{vi.estimated_calories}</span>
                                          </div>
                                        )}
                                        {vi.tax_note && (
                                          <div className="nfg-field">
                                            <span className="nfg-field-label">{copy.nfg.taxNote}</span>
                                            <span className="nfg-field-value">{vi.tax_note}</span>
                                          </div>
                                        )}
                                      </div>
                                      {vi.confidence != null && vi.confidence > 0 && (
                                        <div className="nfg-card-badge-row" style={{ marginBottom: 0 }}>
                                          <span className="nfg-badge nfg-badge-confidence">{copy.nfg.confidence} {vi.confidence}%</span>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                );
                              })()}
                          </div>
                        );
                      })}
                    </div>
                    {response.contextChips && response.contextChips.length > 0 && (
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
                          onClick={() => handleFeedback(response.id, 'bad')}
                          aria-label="Bad"
                        >
                          <ThumbsDown size={16} />
                        </button>
                        <button
                          className="feedback-btn action-btn"
                          type="button"
                          onClick={() => handleCopyResponse(response.id)}
                          aria-label="Copy"
                        >
                          <Copy size={16} />
                          <span>{copiedId === response.id ? copy.feedback.copied : copy.feedback.copy}</span>
                        </button>
                        <button
                          className="feedback-btn action-btn"
                          type="button"
                          onClick={handleShare}
                          aria-label="Share"
                        >
                          <Share2 size={16} />
                          <span>{copiedId === '__share__' ? copy.feedback.copied : copy.feedback.share}</span>
                        </button>
                        {restaurantData?.google_review_url && response.id === responses[responses.length - 1]?.id && responses.length >= 2 && (
                          <a
                            href={restaurantData.google_review_url}
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
                        {restaurantData?.address && response.id === responses[responses.length - 1]?.id && responses.length >= 2 && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantData.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="feedback-btn action-btn"
                            aria-label="Map"
                          >
                            <MapPin size={16} />
                            <span>{copy.capture.openMap}</span>
                          </a>
                        )}
                      </div>
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
                                onClick={() => handleFeedback(response.id, 'bad')}
                                aria-label="Bad"
                              >
                                <ThumbsDown size={16} />
                              </button>
                              <button
                                className="feedback-btn action-btn"
                                type="button"
                                onClick={() => handleCopyResponse(response.id)}
                                aria-label="Copy"
                              >
                                <Copy size={16} />
                                <span>{copiedId === response.id ? copy.feedback.copied : copy.feedback.copy}</span>
                              </button>
                              <button
                                className="feedback-btn action-btn"
                                type="button"
                                onClick={handleShare}
                                aria-label="Share"
                              >
                                <Share2 size={16} />
                                <span>{copiedId === '__share__' ? copy.feedback.copied : copy.feedback.share}</span>
                              </button>
                              {restaurantData?.google_review_url && response.id === responses[responses.length - 1]?.id && responses.length >= 2 && (
                                <a
                                  href={restaurantData.google_review_url}
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
                              {restaurantData?.address && response.id === responses[responses.length - 1]?.id && responses.length >= 2 && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantData.address)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="feedback-btn action-btn"
                                  aria-label="Map"
                                >
                                  <MapPin size={16} />
                                  <span>{copy.capture.openMap}</span>
                                </a>
                              )}
                            </div>
                          </div>
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

      <div onClick={(event) => event.stopPropagation()}>
      </div>

      <SuggestionModal
        open={!!suggestionTarget}
        onClose={() => setSuggestionTarget(null)}
        menuItem={suggestionTarget || { name_jp: '' }}
        onSubmit={() => setSuggestionTarget(null)}
      />

      {/* Review modal */}
      {reviewOpen && (
        <>
          <div className="review-backdrop" onClick={() => setReviewOpen(false)} />
          <div className="review-modal">
            <div className="review-handle" />
            <div className="review-title">
              {copy.capture.submitReview}
            </div>
            <div className="review-subtitle">
              {restaurantData?.name || ''}
            </div>
            <textarea
              className="review-textarea"
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder={copy.capture.reviewPlaceholder}
              rows={4}
            />
            <button
              type="button"
              className="review-submit"
              disabled={!reviewText.trim() || reviewSubmitting}
              onClick={async () => {
                if (!reviewText.trim() || !restaurantData?.uid) return;
                setReviewSubmitting(true);
                try {
                  await ContributionApi.suggest({
                    restaurant_uid: restaurantData.uid,
                    field: 'review',
                    suggested_value: reviewText.trim(),
                    session_id: (() => {
                      let id = localStorage.getItem('ngraph_session_id');
                      if (!id) { id = crypto.randomUUID(); localStorage.setItem('ngraph_session_id', id); }
                      return id;
                    })(),
                  });
                  setReviewToast(true);
                  setTimeout(() => {
                    setReviewToast(false);
                    setReviewText('');
                    setReviewOpen(false);
                  }, 1200);
                } catch (e) {
                  console.error('Review submit error:', e);
                } finally {
                  setReviewSubmitting(false);
                }
              }}
            >
              {reviewSubmitting
                ? copy.capture.submitting
                : copy.capture.submit}
            </button>
            {reviewToast && (
              <div className="review-toast">
                {copy.capture.reviewSubmitted}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
