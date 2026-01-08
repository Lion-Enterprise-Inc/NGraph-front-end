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

    const scrollToEnd = () => {
      const container = threadRef.current;
      const items = container?.querySelectorAll<HTMLElement>(
        ".chat-thread-item"
      );
      const last = items?.[items.length - 1] ?? null;
      if (!last) return;

      last.scrollIntoView({ behavior: "smooth", block: "start" });
      last.setAttribute("tabindex", "-1");
      requestAnimationFrame(() => {
        last.focus({ preventScroll: true });
      });
    };

    const typeText = async (
      fullText: string,
      onUpdate: (value: string) => void
    ) => {
      for (let i = 1; i <= fullText.length; i += 1) {
        await wait(22);
        onUpdate(fullText.slice(0, i));
      }
    };

    const startTyping = async (response: ResponseItem) => {
      const output = response.output;
      if (!output) return;

      if (responses.length > 1) {
        requestAnimationFrame(() => {
          requestAnimationFrame(scrollToEnd);
        });
      }

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

      await typeText(output.title, (value) => {
        setTypingState((prev) => {
          const current = prev[response.id];
          if (!current) return prev;
          return { ...prev, [response.id]: { ...current, title: value } };
        });
      });

      await typeText(output.intro, (value) => {
        setTypingState((prev) => {
          const current = prev[response.id];
          if (!current) return prev;
          return { ...prev, [response.id]: { ...current, intro: value } };
        });
      });

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
        });
      }
    };

    responses.forEach((response) => {
      if (!response.output) return;
      if (typingStartedRef.current.has(response.id)) return;
      typingStartedRef.current.add(response.id);
      void startTyping(response);
    });
  }, [responses]);

  const handleBackgroundClick = () => {
    textareaRef.current?.blur();
  };

  const handleContentScroll = (event: UIEvent<HTMLDivElement>) => {
    if (event.currentTarget.scrollTop > 8) {
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
              router.push("/camera");
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
                        {typingState[response.id]?.body?.[index] ?? ""}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* <div className="feedback-row">
                <span className="feedback-question">解説は参考になりましたか</span>
                <div className="feedback-actions">
                  <button
                    className={`feedback-btn${response.feedback === 'good' ? ' active' : ''}`}
                    type="button"
                    onClick={() => handleFeedback(response.id, 'good')}
                  >
                    ??
                  </button>
                  <button
                    className={`feedback-btn${response.feedback === 'bad' ? ' active' : ''}`}
                    type="button"
                    onClick={() => handleFeedback(response.id, 'bad')}
                  >
                    ??
                  </button>
                </div>
              </div> */}
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
          router.push("/camera");
        }}
        onRemoveAttachment={() => setAttachment(null)}
      />

      <div onClick={(event) => event.stopPropagation()}>
      </div>
    </div>
  );
}
