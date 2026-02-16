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
import { User, Bot, ChevronDown, Copy, Sparkles } from "lucide-react";
import CaptureHeader from "../components/CaptureHeader";
import CameraPrompt from "../components/CameraPrompt";
import ChatDock from "../components/ChatDock";
import { useAppContext } from "../components/AppProvider";
import { getUiCopy, type LanguageCode } from "../i18n/uiCopy";

type ApiRestaurant = {
  uid: string
  name: string
  description?: string
  is_active: boolean
  slug: string
  logo_url?: string | null
  recommend_texts?: string[] | null
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
  // This implements intelligent chat responses for restaurant conversations
  // In production, this would integrate with an AI service like OpenAI

  const lowerMessage = message.toLowerCase()
  const restaurantName = restaurant?.name || 'the restaurant'
  const restaurantDescription = restaurant?.description || 'We offer a great dining experience'

  // Basic greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('こんにちは')) {
    return `Hello! Welcome to ${restaurantName}. ${restaurantDescription}. How can I help you today?`
  }

  // Menu-related queries
  if (lowerMessage.includes('menu') || lowerMessage.includes('food') || lowerMessage.includes('dish') || lowerMessage.includes('what do you serve')) {
    return `I'd be happy to help you with our menu at ${restaurantName}! We offer a variety of delicious dishes made with fresh ingredients. What type of cuisine are you interested in or do you have any dietary preferences?`
  }

  // Hours/location queries
  if (lowerMessage.includes('hours') || lowerMessage.includes('time') || lowerMessage.includes('open') || lowerMessage.includes('when are you open')) {
    return `${restaurantName} is open from 11:00 AM to 10:00 PM daily. We're here to serve you during our operating hours!`
  }

  if (lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('where') || lowerMessage.includes('find you')) {
    return `You can find ${restaurantName} at our convenient location. We're easily accessible and ready to welcome you for a great dining experience.`
  }

  // Reservation queries
  if (lowerMessage.includes('reservation') || lowerMessage.includes('book') || lowerMessage.includes('table') || lowerMessage.includes('reserve')) {
    return `I'd be happy to help you make a reservation at ${restaurantName}! Please let me know your preferred date, time, and party size, and I'll assist you with booking.`
  }

  // Dietary queries
  if (lowerMessage.includes('vegetarian') || lowerMessage.includes('vegan') || lowerMessage.includes('gluten') || lowerMessage.includes('allergy')) {
    return `At ${restaurantName}, we offer various options for dietary preferences and allergies. We have vegetarian, vegan, and gluten-free options available. Please let me know your specific requirements, and I'll help you find suitable dishes.`
  }

  // Restaurant-specific information
  if (restaurant?.description) {
    if (lowerMessage.includes('about') || lowerMessage.includes('what') || lowerMessage.includes('tell me') || lowerMessage.includes('information')) {
      return `${restaurant.description} We're excited to serve you at ${restaurantName}!`
    }
  }

  // Special requests or questions
  if (lowerMessage.includes('special') || lowerMessage.includes('event') || lowerMessage.includes('party')) {
    return `${restaurantName} can accommodate special events and parties. Please contact us for details about private dining options and group reservations.`
  }

  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('expensive') || lowerMessage.includes('cheap')) {
    return `At ${restaurantName}, we offer a range of dishes at various price points to suit different budgets. Our menu features both affordable options and premium selections.`
  }

  // Default response
  return `Thank you for your message! I'm here to help with information about ${restaurantName}, our menu, reservations, or any other questions you might have. What would you like to know?`
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
  const [restaurantData, setRestaurantData] = useState<ApiRestaurant | null>(null);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const {
    language: contextLanguage,
    openLanguageModal: openLanguageModalFromContext,
    openHistoryDrawer,
    pendingAttachment,
    setPendingAttachment,
  } = useAppContext();
  const activeLanguage = contextLanguage ?? language ?? "ja";
  const [message, setMessage] = useState("");
  const [hideRecommendations, setHideRecommendations] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const appliedAttachmentRef = useRef(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const loadingTimerRef = useRef<number | null>(null);
  const responseImagesRef = useRef<string[]>([]);
  const threadRef = useRef<HTMLElement | null>(null);
  const captureBodyRef = useRef<HTMLDivElement | null>(null);
  const typingTimersRef = useRef<number[]>([]);
  const typingStartedRef = useRef<Set<string>>(new Set());
  const [typingState, setTypingState] = useState<
    Record<string, { title: string; intro: string; body: string[] }>
  >({});
  const [typingComplete, setTypingComplete] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };
  const [isTypingActive, setIsTypingActive] = useState(false);
  const sendEnabled = message.trim().length > 0 || Boolean(attachment);
  const fromHome = searchParams?.get("from") === "home" || defaultFromHome;
  const fromRestaurant = searchParams?.get("from") === "restaurant";
  const restaurantSlug = searchParams?.get("restaurant");
  
  const selectedRestaurant = restaurantData;

  // Fetch restaurant data from public API endpoint
  useEffect(() => {
    if (restaurantSlug) {
      const fetchRestaurantBySlug = async () => {
        setRestaurantLoading(true);
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://15.207.22.103:8000';
          const response = await fetch(`${apiBaseUrl}/restaurants/public/${restaurantSlug}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.result && data.result.is_active) {
              console.log('Restaurant data from public API:', data.result);
              setRestaurantData({
                uid: data.result.uid,
                name: data.result.name,
                slug: data.result.slug,
                is_active: data.result.is_active,
                logo_url: data.result.logo_url,
                recommend_texts: data.result.recommend_texts,
                created_at: '',
                updated_at: ''
              });
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
  }, [restaurantSlug]);

  const copy = useMemo(() => getUiCopy(activeLanguage), [activeLanguage]);
  
  const currentSuggestions = useMemo(() => {
    if (selectedRestaurant) {
      // Use custom recommend_texts if set
      if (selectedRestaurant.recommend_texts && selectedRestaurant.recommend_texts.length > 0) {
        return {
          guide: copy.restaurant.chatPlaceholder.replace('{name}', selectedRestaurant.name),
          chips: selectedRestaurant.recommend_texts
        };
      }

      // Default restaurant-specific suggestions
      const chips = [
        copy.restaurant.signatureDish.replace('{name}', selectedRestaurant.name),
        copy.restaurant.bestTime.replace('{name}', selectedRestaurant.name),
        copy.restaurant.dietaryOptions
      ];

      if ('cuisine' in selectedRestaurant) {
        chips.splice(1, 0, copy.restaurant.aboutCuisine.replace('{cuisine}', (selectedRestaurant as any).cuisine));
      }

      return {
        guide: copy.restaurant.chatPlaceholder.replace('{name}', selectedRestaurant.name),
        chips
      };
    }
    return copy.suggestions;
  }, [selectedRestaurant, copy.suggestions, copy.restaurant]);

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
    setDockCollapsed(false);
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
          
          // Only auto-scroll if we're within 150px of bottom (user hasn't scrolled up much)
          if (distanceFromBottom < 150) {
            container.scrollTop = container.scrollHeight;
          }
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

    if (scrollTop > 8) {
      setDockCollapsed(true);
    }
  };

  const handleSend = async () => {
    if (!sendEnabled || loading) return;
    const trimmedMessage = message.trim();
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
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://15.207.22.103:8000';

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

            const formatItem = (item: VisionMenuItem): string => {
              const parts: string[] = [];
              const name = item.name_en
                ? `**${item.name_jp}** (${item.name_en})`
                : `**${item.name_jp}**`;
              const price = item.price > 0 ? ` — ¥${item.price.toLocaleString()}` : '';
              parts.push(`${name}${price}`);
              if (item.description) parts.push(item.description);
              if (item.ingredients?.length) parts.push(`🥬 ${item.ingredients.join(', ')}`);
              if (item.allergens?.length) parts.push(`⚠️ ${item.allergens.join(', ')}`);
              return parts.join('\n');
            };

            output = {
              title: `📋 メニュー解析結果（${items.length}品）`,
              intro: trimmedMessage
                ? `「${trimmedMessage}」の画像を解析しました。`
                : 'メニュー画像を解析しました。',
              body: items.map(formatItem),
            };
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
        // Text only → use existing chat API
        const requestText = trimmedMessage;
        try {
          const restaurantSlugForApi = selectedRestaurant?.slug || 'default';
          const chatResponse = await fetch(`${apiBaseUrl}/public-chat/${restaurantSlugForApi}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: requestText }),
          });

          if (chatResponse.ok) {
            const chatData = await chatResponse.json();
            output = { title: '', intro: chatData.ai_response, body: [] };
            // Store message_uid for feedback
            if (chatData.message_uid) {
              setResponses((prev) =>
                prev.map((item) =>
                  item.id === responseId ? { ...item, messageUid: chatData.message_uid } : item
                )
              );
            }
          } else {
            throw new Error(`Chat API failed with status: ${chatResponse.status}`);
          }
        } catch (apiError) {
          console.log("chat_api_error", apiError);
          const fallbackResponse = await generateChatResponse(requestText, selectedRestaurant);
          output = { title: '', intro: fallbackResponse, body: [] };
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
    setDockCollapsed(false);
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
    // Clear all chat responses
    setResponses([]);
    // Clear message input
    setMessage("");
    // Clear attachment
    setAttachment(null);
    // Reset loading state
    setLoading(false);
    // Clear hide recommendations
    setHideRecommendations(false);
    // Reset scroll states
    setUserScrolledUp(false);
    setShowScrollButton(false);
    // Reset typing state
    setIsTypingActive(false);
    setTypingComplete(new Set());
    // Clear feedback states
    responses.forEach(response => {
      if (response.feedback) {
        setResponses(prev => prev.map(item => 
          item.id === response.id ? { ...item, feedback: null } : item
        ));
      }
    });
  };

  return (
    <div className="page capture-page" onClick={handleBackgroundClick}>
      <CaptureHeader
        restaurant={selectedRestaurant}
        onMenu={
          onOpenMenu ??
          openHistoryDrawer ??
          onBack ??
          (() => {
            router.push("/explore");
          })
        }
        onLanguage={openLanguageModal ?? openLanguageModalFromContext}
        onNewChat={handleNewChat}
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
              height: '300px',
              fontFamily: 'Poppins, sans-serif'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '3px solid #e1e5e9', 
                borderTopColor: '#10a37f', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }} />
              <div style={{ fontSize: '16px', color: '#6b7280', textAlign: 'center' }}>
                レストラン情報を読み込み中...
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
            />
          )}
        </main>

        {(fromHome || fromRestaurant) && !hideRecommendations && (
          <div
            className={`chip-row scrollable chip-row-floating${
              dockCollapsed ? " elevated" : ""
            }`}
            role="list"
          >
            {currentSuggestions.chips.map((tip) => (
              <button
                key={tip}
                className="chip"
                type="button"
                onClick={() => handleRecommendationClick(tip)}
              >
                {tip}
              </button>
            ))}
          </div>
        )}

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
                      <div className="chat-timestamp">
                        {new Date(parseInt(response.id)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      <div className="chat-timestamp">
                        {new Date(parseInt(response.id)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {response.output && (
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
                      </div>
                      <div className="chat-timestamp">
                        {new Date(parseInt(response.id)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {typingComplete.has(response.id) && (
                <div className="feedback-row">
                  <span className="feedback-question">解説は参考になりましたか</span>
                  <div className="feedback-actions">
                    <button
                      className={`feedback-btn${response.feedback === 'good' ? ' active' : ''}`}
                      type="button"
                      onClick={() => handleFeedback(response.id, 'good')}
                      aria-label="Good"
                    >
                      👍
                    </button>
                    <button
                      className={`feedback-btn${response.feedback === 'bad' ? ' active' : ''}`}
                      type="button"
                      onClick={() => handleFeedback(response.id, 'bad')}
                      aria-label="Bad"
                    >
                      👎
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-row chat-row-assistant">
              <div className="chat-content">
                <div className="chat-message-wrapper">
                  <div className="chat-bubble chat-bubble-assistant chat-loading-bubble">
                    <div className="loader-card" aria-live="polite">
                      <div className="loader-icon">
                        <Sparkles size={20} className="sparkle-icon" />
                      </div>
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                  <div className="chat-timestamp">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        collapsed={dockCollapsed}
        onExpand={() => setDockCollapsed(false)}
        onFocus={() => {
          setDockCollapsed(false);
        }}
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
