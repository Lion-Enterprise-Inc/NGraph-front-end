"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
  type SyntheticEvent,
} from "react";
import GalleryIcon from "../assets/Group 624689.svg";
import CameraIcon from "../assets/Group 624690.svg";
import VectorIcon from "../assets/Vector.svg";
import Vector from "../assets/vectorbtn.png";
import { getUiCopy } from "../i18n/uiCopy";
import { useAppContext } from "./AppProvider";

type Attachment = {
  label: string;
  preview?: string | null;
};

type ChatDockProps = {
  message: string;
  suggestion: string;
  attachment: Attachment | null;
  textareaRef: RefObject<HTMLTextAreaElement>;
  collapsed?: boolean;
  onFocus?: () => void;
  onExpand?: () => void;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onAttachment?: (file: File) => void;
  onAttachmentCamera?: (file: File) => void;
  onOpenCamera?: () => void;
  onRemoveAttachment?: () => void;
};

export default function ChatDock({
  message,
  suggestion,
  attachment,
  textareaRef,
  collapsed = false,
  onFocus,
  onExpand,
  onChange,
  onSend,
  onAttachment,
  onAttachmentCamera,
  onOpenCamera,
  onRemoveAttachment,
}: ChatDockProps) {
  const { language } = useAppContext();
  const copy = getUiCopy(language);
  const sendEnabled = message.trim().length > 0 || Boolean(attachment);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [multiline, setMultiline] = useState(false);

  useEffect(() => {
    const dockEl = dockRef.current;
    if (!dockEl || typeof ResizeObserver === "undefined") return;

    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--chat-dock-height",
        `${dockEl.offsetHeight}px`
      );
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(dockEl);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    const measureEl = measureRef.current;
    if (!el) return;
    if (!measureEl) return;
    const sync = () => {
      const styles = window.getComputedStyle(el);
      const fontSize = Number.parseFloat(styles.fontSize || "16");
      const rawLineHeight = Number.parseFloat(styles.lineHeight || "");
      const lineHeight = Number.isFinite(rawLineHeight)
        ? rawLineHeight
        : fontSize * 1.2;
      const paddingTop = Number.parseFloat(styles.paddingTop || "0");
      const paddingBottom = Number.parseFloat(styles.paddingBottom || "0");
      const paddingLeft = Number.parseFloat(styles.paddingLeft || "0");
      const paddingRight = Number.parseFloat(styles.paddingRight || "0");
      const paddingY = paddingTop + paddingBottom;

      measureEl.style.fontFamily = styles.fontFamily;
      measureEl.style.fontSize = styles.fontSize;
      measureEl.style.fontWeight = styles.fontWeight;
      measureEl.style.letterSpacing = styles.letterSpacing;
      measureEl.style.lineHeight = styles.lineHeight;
      measureEl.style.paddingTop = styles.paddingTop;
      measureEl.style.paddingBottom = styles.paddingBottom;
      measureEl.style.paddingLeft = styles.paddingLeft;
      measureEl.style.paddingRight = styles.paddingRight;
      measureEl.style.width = `${el.clientWidth - paddingLeft - paddingRight}px`;
      measureEl.textContent = message.length ? message : suggestion;

      const contentHeight = Math.max(0, measureEl.scrollHeight - paddingY);
      const lines = Math.max(1, Math.round(contentHeight / lineHeight));
      setMultiline(lines > 1);
    };
    const raf = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(raf);
  }, [message, suggestion, textareaRef]);

  const handleDockClick = (e: SyntheticEvent) => {
    e.stopPropagation();
    onExpand?.();
  };

  const handleInputFocus = () => {
    onExpand?.();
    onFocus?.();
  };

  const handleFileSelect = (
    e: ChangeEvent<HTMLInputElement>,
    source: "camera" | "library"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (source === "camera") {
        onAttachmentCamera?.(file);
      } else {
        onAttachment?.(file);
      }
    }
    e.target.value = "";
  };

  return (
    <div
      ref={dockRef}
      className={`chat-dock chat-dock-floating${
        collapsed ? " collapsed" : ""
      }`}
      onClick={handleDockClick}
      onMouseDown={handleDockClick}
      onTouchStart={handleDockClick}
    >
      {attachment && (
        <div className="attachment-pill">
          <div className="attachment-thumb">
            {attachment.preview ? (
              <img src={attachment.preview} alt={copy.chat.uploadPreview} />
            ) : (
              <div
                className="attachment-thumb-placeholder"
                aria-hidden="true"
              />
            )}
            <button
              className="attachment-remove"
              type="button"
              aria-label={copy.chat.removeAttachment}
              onClick={onRemoveAttachment}
            >
              ×
            </button>
          </div>
          <div className="attachment-meta">
            <div className="attachment-title">{attachment.label}</div>
            <div className="attachment-sub">
              {copy.chat.attachmentGuide}
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="chat-dock-collapsed" aria-hidden="true">
          <span className="collapsed-hint">{copy.chat.tapToOpen}</span>
        </div>
      )}

      <div className="chat-dock-row">
        <div className="chat-dock-icons" aria-hidden="true">
          <button
            className="chat-icon"
            type="button"
            aria-label={copy.chat.camera}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenCamera) {
                onOpenCamera();
              } else {
                cameraInputRef.current?.click();
              }
            }}
          >
            <img src={CameraIcon.src} alt="" />
          </button>
          <button
            className="chat-icon"
            type="button"
            aria-label={copy.chat.gallery}
            onClick={(e) => {
              e.stopPropagation();
              galleryInputRef.current?.click();
            }}
          >
            <img src={GalleryIcon.src} alt="" />
          </button>
        </div>
        <div className={`chat-dock-area${multiline ? " multiline" : ""}`}>
          <textarea
            ref={textareaRef}
            className="chat-dock-input multiline"
            placeholder={suggestion}
            aria-label={copy.chat.messageInput}
            value={message}
            rows={1}
            onFocus={handleInputFocus}
            onClick={handleInputFocus}
            onChange={onChange}
            onInput={(event) =>
              onChange(event as ChangeEvent<HTMLTextAreaElement>)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <button
            className={`chat-dock-send${sendEnabled ? " " : ""}`}
            type="button"
            aria-label={copy.chat.sendMessage}
            disabled={!sendEnabled}
            onClick={onSend}
          >
            {sendEnabled ? (
              <img src={Vector.src} alt={copy.chat.send} />
            ) : (
              <img src={VectorIcon.src} alt={copy.chat.sendDisabled} />
            )}
          </button>
        </div>
      </div>

      <div
        ref={measureRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          visibility: "hidden",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          padding: "0",
        }}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFileSelect(e, "library")}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => handleFileSelect(e, "camera")}
      />
    </div>
  );
}
