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
import CaptureHeader from "../components/CaptureHeader";
import CameraPrompt from "../components/CameraPrompt";
import ChatDock from "../components/ChatDock";
import { useAppContext } from "../components/AppProvider";
import { getUiCopy, type LanguageCode } from "../i18n/uiCopy";

// Helper function to render text with bold formatting
const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return <strong key={index}>{boldText}</strong>;
    }
    return part;
  });
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
    const raw = localStorage.getItem("omiseaiFeedbackLog");
    const existing = raw ? JSON.parse(raw) : [];
    existing.push(entry);
    localStorage.setItem("omiseaiFeedbackLog", JSON.stringify(existing));
  } catch (error) {
    console.log("feedback_log_error", error);
  }
  console.log("feedback_log", entry);
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
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [isTypingActive, setIsTypingActive] = useState(false);
  const sendEnabled = message.trim().length > 0 || Boolean(attachment);
  const fromHome = searchParams?.get("from") === "home" || defaultFromHome;
  const fromRestaurant = searchParams?.get("from") === "restaurant";
  const restaurantId = searchParams?.get("restaurantId");
  const selectedRestaurant = restaurantId ? mockRestaurants.find(r => r.id === restaurantId) : null;

  const copy = useMemo(() => getUiCopy(activeLanguage), [activeLanguage]);
  
  const currentSuggestions = useMemo(() => {
    if (selectedRestaurant) {
      // Restaurant-specific suggestions
      return {
        guide: copy.restaurant.chatPlaceholder.replace('{name}', selectedRestaurant.name),
        chips: [
          copy.restaurant.signatureDish.replace('{name}', selectedRestaurant.name),
          copy.restaurant.aboutCuisine.replace('{cuisine}', selectedRestaurant.cuisine),
          copy.restaurant.bestTime.replace('{name}', selectedRestaurant.name),
          copy.restaurant.dietaryOptions
        ]
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
      
      container.scrollTo(scrollOptions);
    };

    const typeText = async (
      fullText: string,
      onUpdate: (value: string) => void,
      scrollDuringTyping = false
    ) => {
      const chunkSize = 2; // Smaller chunks for more frequent updates
      const delay = 25; // Slightly faster
      
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

  // Auto-scroll when typing state changes during active typing
  useEffect(() => {
    if (isTypingActive) {
      const container = captureBodyRef.current;
      if (container) {
        // Use a slight delay to ensure DOM has updated
        setTimeout(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }, 10);
      }
    }
  }, [typingState, isTypingActive]);

  const handleBackgroundClick = () => {
    textareaRef.current?.blur();
  };

  const handleContentScroll = (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50; // Reduced threshold for better sensitivity
    
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
      },
    ]);

    setMessage("");
    setAttachment(null);
    setHideRecommendations(true);
    setLoading(true);
    setUserScrolledUp(false); // Reset scroll state for new message
    setIsTypingActive(false); // Ensure typing state is reset

    // Scroll to show the user's message immediately with multiple attempts
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = captureBodyRef.current;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
          
          // Additional scroll after a short delay to ensure it works
          setTimeout(() => {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: "smooth",
            });
          }, 100);
        }
      });
    });

    try {
      let ocrText = "";
      if (attachmentSnapshot?.file) {
        const langCode =
          activeLanguage === "ja"
            ? "jpn"
            : activeLanguage === "ko"
            ? "kor"
            : "eng";
        try {
          const result = await Tesseract.recognize(
            attachmentSnapshot.file,
            langCode
          );
          ocrText = result?.data?.text ?? "";
        } catch (error) {
          console.log("ocr_error", error);
        }
      }
      const requestText = trimmedMessage || ocrText.trim();
      const output = await mockScanResponse({
        text: requestText,
        attachmentLabel: attachmentSnapshot?.label ?? "",
        language: activeLanguage,
      });
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
    setResponses((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, feedback: rating } : item
      )
    );
    logFeedback({
      input: response.input,
      output: response.output,
      language: response.language,
      rating,
      createdAt: new Date().toISOString(),
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
          <CameraPrompt
            heading={copy.hero.heading}
            sub={copy.hero.sub}
            buttonLabel={copy.cameraPrompt.openCamera}
            onCamera={() => {
              if (onOpenCamera) {
                onOpenCamera();
                return;
              }
              const cameraUrl = restaurantId ? `/camera?restaurantId=${restaurantId}` : "/camera";
              router.push(cameraUrl);
            }}
          />
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
                {response.input.text && (
                  <div className="chat-bubble chat-bubble-user">
                    {response.input.text}
                  </div>
                )}
                {response.input.imageUrl && (
                  <div className="chat-bubble chat-bubble-user image">
                    <img
                      src={response.input.imageUrl}
                      alt={copy.chat.uploadPreview}
                    />
                  </div>
                )}
              </div>

              {response.output && (
                <div className="chat-row chat-row-assistant">
                  <div className="chat-bubble chat-bubble-assistant">
                    <div className="assistant-title">
                      {typingState[response.id]?.title ?? ""}
                    </div>
                    <div className="assistant-intro">
                      {typingState[response.id]?.intro ?? ""}
                    </div>
                    {response.output.body.map((line, index) => (
                      <div key={`${line}-${index}`} className="assistant-line">
                        {renderBoldText(typingState[response.id]?.body?.[index] ?? "")}
                      </div>
                    ))}
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
              <div className="chat-bubble chat-bubble-assistant">
                <div className="loader-card" aria-live="polite">
                  <div className="chopstick-loader" aria-hidden="true">
                    <span className="chopstick stick-left" />
                    <span className="chopstick stick-right" />
                    <span className="grain" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
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
          const cameraUrl = restaurantId ? `/camera?restaurantId=${restaurantId}` : "/camera";
          router.push(cameraUrl);
        }}
        onRemoveAttachment={() => setAttachment(null)}
      />

      <div onClick={(event) => event.stopPropagation()}>
      </div>
    </div>
  );
}
