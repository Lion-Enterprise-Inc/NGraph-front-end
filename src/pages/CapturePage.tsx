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
import { FeedbackApi, type VisionMenuItem } from "../services/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { User, Bot, ChevronDown, Copy, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
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
  created_at: string
  updated_at: string
};

// Helper function to render text with bold formatting and proper structure
const renderBoldText = (text: string) => {
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
          const isMuted = /^(アレルゲン|宗教上の制約|味の特徴|推定カロリー|背景情報|関連提案):/i.test(line.trim());
          
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

  // responsesをsessionStorageに自動保存
  useEffect(() => {
    if (responses.length === 0) return;
    try {
      const key = `ngraph_responses_${restaurantSlug || 'default'}`;
      sessionStorage.setItem(key, JSON.stringify(responses));
    } catch {}
  }, [responses, restaurantSlug]);

  // thread_uid復元 + 復元レスポンスのタイピング状態セット
  useEffect(() => {
    if (typeof window === 'undefined') return;
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
    // デフォルト: 1-2品なら全展開、3品以上なら最初の1品だけ展開
    return totalItems <= 2 || cardIndex === 0;
  };

  const [isTypingActive, setIsTypingActive] = useState(false);
  const sendEnabled = message.trim().length > 0 || Boolean(attachment);
  const fromHome = searchParams?.get("from") === "home" || defaultFromHome;
  const fromRestaurant = searchParams?.get("from") === "restaurant";
  const isInStore = searchParams?.get("source") === "qr";
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
                created_at: '',
                updated_at: ''
              });
              recordVisit(data.result.slug, data.result.name);
              return;
            }
          }
          // Fallback if API fails
          console.log('Public API failed, using slug as fallback');
          setRestaurantData({
            uid: '',
            name: restaurantSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            slug: restaurantSlug,
            is_active: true,
            logo_url: null,
            created_at: '',
            updated_at: ''
          });
        } catch (error) {
          console.error('Failed to fetch restaurant:', error);
          setRestaurantData({
            uid: '',
            name: restaurantSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            slug: restaurantSlug,
            is_active: true,
            logo_url: null,
            created_at: '',
            updated_at: ''
          });
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

  // Pre-fetch recommend text responses for instant display
  useEffect(() => {
    if (!restaurantData?.recommend_texts?.length) return;
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
          body: JSON.stringify({ message: jaText, in_store: isInStore }),
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
      } catch { /* silent */ }
    });
  }, [restaurantData]);

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
        copy.restaurant.signatureDish.replace('{name}', displayName),
        copy.restaurant.bestTime.replace('{name}', displayName),
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

  // Continuous auto-scroll interval during typing or loading for smoother experience
  useEffect(() => {
    let scrollInterval: NodeJS.Timeout | null = null;
    
    if (isTypingActive || loading) {
      scrollInterval = setInterval(() => {
        const container = captureBodyRef.current;
        if (container) {
          const { scrollTop, scrollHeight, clientHeight } = container;
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
          
          // Always auto-scroll during active typing/loading
          container.scrollTop = container.scrollHeight;
        }
      }, 50); // Check every 50ms for smooth scrolling
    }
    
    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
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
                title: `メニュー解析結果（${items.length}品）`,
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
                if (item.ingredients?.length) parts.push(`主な材料: ${item.ingredients.join(', ')}`);
                if (item.allergens?.length) parts.push(`アレルゲン: ${item.allergens.join(', ')}`);
                return parts.join('\n');
              };

              output = {
                title: `メニュー解析結果（${items.length}品）`,
                intro: trimmedMessage
                  ? `「${trimmedMessage}」の画像を解析しました。`
                  : 'メニュー画像を解析しました。',
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
        try {
          const restaurantSlugForApi = selectedRestaurant?.slug || 'default';
          const streamResponse = await fetch(`${apiBaseUrl}/public-chat/${encodeURIComponent(restaurantSlugForApi)}/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: requestText,
              in_store: isInStore,
              thread_uid: threadUidRef.current,
              language: activeLanguage,
            }),
          });

          if (streamResponse.ok && streamResponse.body) {
            // Keep loading spinner until first content token
            setIsTypingActive(true);
            // Prevent startTyping useEffect from running on this response
            typingStartedRef.current.add(responseId);

            let streamedText = '';
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
                    setResponses((prev) =>
                      prev.map((item) =>
                        item.id === responseId ? { ...item, messageUid: data.message_uid } : item
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
        } catch (apiError) {
          console.log("chat_api_error", apiError);
          setLoading(false);
          setIsTypingActive(false);
          const fallbackResponse = await generateChatResponse(requestText, selectedRestaurant);
          output = { title: '', intro: fallbackResponse, body: [] };
          // typingStartedRef already has responseId from stream path, so startTyping won't run.
          // Set typingState and typingComplete directly.
          setTypingState((prev) => ({
            ...prev,
            [responseId]: { title: '', intro: fallbackResponse, body: [] },
          }));
          setTypingComplete((prev) => new Set(prev).add(responseId));
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
      sessionStorage.removeItem(key);
      sessionStorage.removeItem(tKey);
    } catch {}
  };

  const handleSelectThread = (threadUid: string) => {
    // Clear current responses and switch to selected thread
    setResponses([]);
    setMessage("");
    setAttachment(null);
    setLoading(false);
    setHideRecommendations(false);
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
  };

  // Sync handleNewChat + handleSelectThread to AppContext for sidebar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setOnNewChat(() => handleNewChat);
    setOnSelectThread(() => handleSelectThread);
    return () => { setOnNewChat(null); setOnSelectThread(null); };
  }, []);

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
      />

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
          {restaurantLoading ? (
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
                読み込み中...
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
                // Resolve Japanese original for API (chips may be translated)
                const jaTexts = selectedRestaurant?.recommend_texts_ja || selectedRestaurant?.recommend_texts;
                const idx = selectedRestaurant?.recommend_texts?.indexOf(text) ?? -1;
                const jaText = (idx >= 0 && jaTexts?.[idx]) ? jaTexts[idx] : text;
                if (cached) {
                  handleCachedRecommendation(text, cached);
                } else {
                  handleSend(jaText);
                }
              }}
            />
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
                /* NFGカード表示 */
                <div className="chat-row chat-row-assistant">
                  <div className="chat-content">
                    <div className="nfg-cards-container">
                      <div className="nfg-cards-header">
                        {response.output.title}
                      </div>
                      {response.visionItems.map((vi, idx) => {
                        const expanded = isCardExpanded(response.id, idx, response.visionItems!.length);
                        return (
                          <div key={idx} className="nfg-card">
                            <div
                              className="nfg-card-header"
                              onClick={() => toggleCard(response.id, idx)}
                            >
                              <div className="nfg-card-title-row">
                                <span className="nfg-card-number">{idx + 1}.</span>
                                <span className="nfg-card-name">{vi.name_jp}</span>
                                {vi.price > 0 && (
                                  <span className="nfg-card-price">¥{vi.price.toLocaleString()}</span>
                                )}
                                <span className={`nfg-card-chevron${expanded ? ' expanded' : ''}`}>▼</span>
                              </div>
                              {vi.name_en && (
                                <div className="nfg-card-name-en">{vi.name_en}</div>
                              )}
                            </div>
                            <div className={`nfg-card-body${expanded ? ' expanded' : ''}`}>
                              {vi.description && (
                                <div className="nfg-card-desc">{vi.description}</div>
                              )}
                              <div className="nfg-card-fields">
                                {vi.ingredients?.length > 0 && (
                                  <div className="nfg-field">
                                    <span className="nfg-field-label">主な材料</span>
                                    <span className="nfg-field-value">{vi.ingredients.join('、')}</span>
                                  </div>
                                )}
                                {vi.allergens?.length > 0 && (
                                  <div className="nfg-field nfg-field-allergen">
                                    <span className="nfg-field-label">アレルゲン</span>
                                    <span className="nfg-field-value">{vi.allergens.join('、')}</span>
                                  </div>
                                )}
                                {vi.restrictions && vi.restrictions.length > 0 && (
                                  <div className="nfg-field">
                                    <span className="nfg-field-label">食事制約</span>
                                    <span className="nfg-field-value">{vi.restrictions.join('、')}</span>
                                  </div>
                                )}
                                {vi.flavor_profile && (
                                  <div className="nfg-field">
                                    <span className="nfg-field-label">味の特徴</span>
                                    <span className="nfg-field-value">{vi.flavor_profile}</span>
                                  </div>
                                )}
                                {vi.estimated_calories && (
                                  <div className="nfg-field">
                                    <span className="nfg-field-label">推定カロリー</span>
                                    <span className="nfg-field-value">{vi.estimated_calories}</span>
                                  </div>
                                )}
                                {vi.tax_note && (
                                  <div className="nfg-field">
                                    <span className="nfg-field-label">税表記</span>
                                    <span className="nfg-field-value">{vi.tax_note}</span>
                                  </div>
                                )}
                              </div>
                              <div className="nfg-card-badge-row">
                                {vi.source === 'db' ? (
                                  <span className="nfg-badge nfg-badge-db">VAD 店主確認済み</span>
                                ) : (
                                  <span className="nfg-badge nfg-badge-ai">AI推測</span>
                                )}
                                {vi.confidence != null && vi.confidence > 0 && (
                                  <span className="nfg-badge nfg-badge-confidence">信頼度 {vi.confidence}%</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                ul: ({ children }) => <ul className="menu-list">{children}</ul>,
                                ol: ({ children }) => <ol className="menu-list numbered">{children}</ol>,
                                li: ({ children }) => <li className="menu-item">{children}</li>,
                              }}
                            >
                              {typingState[response.id]?.intro ?? ""}
                            </ReactMarkdown>
                          </div>
                        )}
                        {response.output.body.map((line, index) => (
                          <div key={`${line}-${index}`} className="assistant-line">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
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
                              {typingState[response.id]?.body?.[index] ?? ""}
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
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
                    <img src="/ngraph-logo.svg" alt="" className="loading-logo-spin" />
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
    </div>
  );
}
