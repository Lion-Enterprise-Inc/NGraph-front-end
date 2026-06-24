"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react";
import { Camera, ArrowUp, Square, ImagePlus } from "lucide-react";
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
  onFocus?: () => void;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: (overrideText?: string) => void;
  isStreaming?: boolean;
  isHero?: boolean;
  onStop?: () => void;
  onAttachment?: (file: File) => void;
  onAttachmentCamera?: (file: File) => void;
  onOpenCamera?: () => void;
  onRemoveAttachment?: () => void;
};

type HeroChip = {
  label: string;
  query: string;
  /** action='open-preferences' → PreferencesModal 直開く (chat 送信しない、 chat 側で逃げ場無く宗教制約だけ提示される事故防止) */
  action?: 'send' | 'open-preferences';
};
// chip query を強化: 「この店の」を明示して AI が generic 郷土料理を提案するのを防止
const HERO_CHIPS: Record<string, HeroChip[]> = {
  ja: [
    { label: 'おすすめは？', query: 'この店のおすすめメニューを教えてください' },
    { label: '名物は？', query: 'この店の名物・看板メニューを教えてください' },
    { label: 'アレルギー・食事制限', query: '', action: 'open-preferences' },
  ],
  en: [
    { label: "What's recommended?", query: "What do you recommend from this restaurant's menu?" },
    { label: 'Specialty?', query: "What is this restaurant's signature dish?" },
    { label: 'Allergies / Diet', query: '', action: 'open-preferences' },
  ],
  ko: [
    { label: '추천 메뉴는?', query: '이 가게의 추천 메뉴를 알려주세요' },
    { label: '대표 메뉴는?', query: '이 가게의 대표 메뉴는 무엇인가요?' },
    { label: '알레르기 · 식이', query: '', action: 'open-preferences' },
  ],
  'zh-Hans': [
    { label: '推荐什么？', query: '请告诉我这家店的推荐菜' },
    { label: '招牌菜？', query: '这家店的招牌菜是什么？' },
    { label: '过敏 / 饮食', query: '', action: 'open-preferences' },
  ],
  'zh-Hant': [
    { label: '推薦什麼？', query: '請告訴我這家店的推薦菜' },
    { label: '招牌菜？', query: '這家店的招牌菜是什麼？' },
    { label: '過敏 / 飲食', query: '', action: 'open-preferences' },
  ],
};

const getHeroChips = (lang: string): HeroChip[] => HERO_CHIPS[lang] || HERO_CHIPS.en;

// LINE/Instagram等のアプリ内ブラウザは getUserMedia(専用カメラ画面 /camera)をブロックする。
// その場合は OS標準カメラを直接開く <input capture> 経路に切り替える(アプリ内でも確実に動く)。
const isInAppBrowser = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /\bLine\//i.test(ua) || /Instagram/i.test(ua) || /FBAN|FBAV/i.test(ua);
};

const SAFETY_NOTICE: Record<string, string> = {
  ja: 'アレルギー・宗教上の制約など重要なご質問はスタッフにご確認ください',
  en: 'For allergies and religious or dietary restrictions, please always confirm with our staff.',
  ko: '알레르기·종교적 제약 등 중요한 사항은 반드시 직원에게 확인해 주세요.',
  'zh-Hans': '关于过敏、宗教或饮食限制等重要事项，请务必向工作人员确认。',
  'zh-Hant': '關於過敏、宗教或飲食限制等重要事項，請務必向工作人員確認。',
  es: 'Para alergias y restricciones religiosas o dietéticas, confirme siempre con nuestro personal.',
  fr: 'Pour les allergies et les restrictions religieuses ou alimentaires, veuillez toujours confirmer auprès de notre personnel.',
  de: 'Bei Allergien sowie religiösen oder diätetischen Einschränkungen bitte immer das Personal fragen.',
  it: 'Per allergie e restrizioni religiose o alimentari, confermare sempre con il nostro personale.',
  pt: 'Para alergias e restrições religiosas ou dietéticas, confirme sempre com nossa equipe.',
  ru: 'По вопросам аллергии и религиозных или диетических ограничений всегда уточняйте у персонала.',
  th: 'กรุณายืนยันกับพนักงานเสมอเกี่ยวกับอาการแพ้และข้อจำกัดทางศาสนาหรืออาหาร',
  vi: 'Đối với dị ứng và hạn chế tôn giáo hoặc ăn uống, vui lòng luôn xác nhận với nhân viên.',
  id: 'Untuk alergi dan pembatasan agama atau makanan, harap selalu konfirmasi dengan staf kami.',
  ms: 'Untuk alahan dan sekatan agama atau pemakanan, sila sentiasa sahkan dengan kakitangan kami.',
  ar: 'للحساسية والقيود الدينية أو الغذائية، يرجى دائمًا التأكيد مع موظفينا.',
  hi: 'एलर्जी और धार्मिक या आहार संबंधी प्रतिबंधों के लिए कृपया हमेशा हमारे स्टाफ से पुष्टि करें।',
  tr: 'Alerji ve dini veya beslenme kısıtlamaları için lütfen her zaman personelimize teyit ettirin.',
  bn: 'অ্যালার্জি এবং ধর্মীয় বা খাদ্য সংক্রান্ত বিধিনিষেধের জন্য, অনুগ্রহ করে আমাদের কর্মীদের সাথে নিশ্চিত করুন।',
  my: 'ဓာတ်မတည့်မှုနှင့် ဘာသာရေး သို့မဟုတ် အစားအသောက်ဆိုင်ရာ ကန့်သတ်ချက်များအတွက် ဝန်ထမ်းနှင့် မေးမြန်းပါ။',
  tl: 'Para sa mga allergy at relihiyoso o dietary na paghihigpit, mangyaring laging kumpirmahin sa aming staff.',
  lo: 'ສຳລັບການແພ້ ແລະ ຂໍ້ຈຳກັດທາງສາສະໜາ ຫຼື ອາຫານ ກະລຸນາຢືນຢັນກັບພະນັກງານສະເໝີ.',
  km: 'សម្រាប់ការមិនទទួលរ៉ាបាន និងការដាក់កម្រិតផ្នែកសាសនា ឬអាហារ សូមបញ្ជាក់ជានិច្ចជាមួយបុគ្គលិករបស់យើង។',
  ne: 'एलर्जी र धार्मिक वा आहार सम्बन्धी प्रतिबन्धहरूको लागि कृपया हाम्रो स्टाफसँग सधैं पुष्टि गर्नुहोस्।',
  mn: 'Харшил, шашин эсвэл хооллолтын хязгаарлалтын талаар ажилтнаас үргэлж лавлана уу.',
  fa: 'برای آلرژی و محدودیت‌های مذهبی یا غذایی، لطفاً همیشه با کارکنان ما تأیید کنید.',
  uk: 'Щодо алергії та релігійних чи дієтичних обмежень завжди уточнюйте у нашого персоналу.',
  pl: 'W przypadku alergii oraz ograniczeń religijnych lub dietetycznych zawsze potwierdzaj z naszym personelem.',
};

export default function ChatDock({
  message,
  suggestion,
  attachment,
  textareaRef,
  onFocus,
  onChange,
  onSend,
  isStreaming,
  isHero,
  onStop,
  onAttachment,
  onAttachmentCamera,
  onOpenCamera,
  onRemoveAttachment,
}: ChatDockProps) {
  const { language, openPreferences } = useAppContext();
  const copy = getUiCopy(language);
  const sendEnabled = message.trim().length > 0 || Boolean(attachment);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [multiline, setMultiline] = useState(false);
  // フォーカス中フラグ。ヒーロー時の浮いた入力欄(bottom:22dvh)はキーボード出現で
  // dvh が縮んで飛び、iOS実機でフォーカスが外れる/位置がずれる。フォーカス中だけ
  // 最下部にピン留めする(.chat-dock-input-focused)ためのフラグ。
  const [inputFocused, setInputFocused] = useState(false);

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
      className={`chat-dock chat-dock-floating${inputFocused ? " chat-dock-input-focused" : ""}`}
      onClick={(e) => e.stopPropagation()}
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

      {isHero ? (
        <div className="chat-dock-hero">
          <textarea
            ref={textareaRef}
            className="chat-dock-hero-input"
            placeholder={suggestion}
            aria-label={copy.chat.messageInput}
            value={message}
            rows={1}
            enterKeyHint="send"
            autoComplete="off"
            onFocus={() => { setInputFocused(true); onFocus?.(); }}
            onBlur={() => setInputFocused(false)}
            onClick={onFocus}
            onChange={onChange}
            onInput={(event) =>
              onChange(event as ChangeEvent<HTMLTextAreaElement>)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isStreaming) onSend();
              }
            }}
          />
          <div className="chat-dock-hero-actions">
            <div className="chat-dock-hero-tools">
              <button
                className="chat-icon chat-icon-hero"
                type="button"
                aria-label={copy.chat.camera}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenCamera && !isInAppBrowser()) {
                    onOpenCamera();
                  } else {
                    cameraInputRef.current?.click();
                  }
                }}
              >
                <Camera size={20} strokeWidth={1.6} color="currentColor" />
              </button>
              <button
                className="chat-icon chat-icon-hero"
                type="button"
                aria-label="画像を選択"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <ImagePlus size={20} strokeWidth={1.6} color="currentColor" />
              </button>
            </div>
            {isStreaming ? (
              <button
                className="chat-dock-send active chat-dock-send-hero"
                type="button"
                aria-label="Stop"
                onClick={() => onStop?.()}
              >
                <Square size={14} strokeWidth={0} fill="#fff" />
              </button>
            ) : (
              <button
                className={`chat-dock-send chat-dock-send-hero${sendEnabled ? " active" : ""}`}
                type="button"
                aria-label={copy.chat.sendMessage}
                disabled={!sendEnabled}
                onClick={() => onSend()}
              >
                <ArrowUp size={20} strokeWidth={2.5} color={sendEnabled ? "#fff" : "rgba(255,255,255,0.4)"} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="chat-dock-row">
          <div className="chat-dock-icons">
            <button
              className="chat-icon"
              type="button"
              aria-label={copy.chat.camera}
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenCamera && !isInAppBrowser()) {
                  onOpenCamera();
                } else {
                  cameraInputRef.current?.click();
                }
              }}
            >
              <Camera size={20} strokeWidth={1.6} color="#10a37f" />
            </button>
            <button
              className="chat-icon"
              type="button"
              aria-label="画像を選択"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <ImagePlus size={20} strokeWidth={1.6} color="#10a37f" />
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
              enterKeyHint="send"
              autoComplete="off"
              onFocus={() => { setInputFocused(true); onFocus?.(); }}
              onBlur={() => setInputFocused(false)}
              onClick={onFocus}
              onChange={onChange}
              onInput={(event) =>
                onChange(event as ChangeEvent<HTMLTextAreaElement>)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isStreaming) onSend();
                }
              }}
            />
            {isStreaming ? (
              <button
                className="chat-dock-send active"
                type="button"
                aria-label="Stop"
                onClick={() => onStop?.()}
              >
                <Square size={14} strokeWidth={0} fill="#fff" />
              </button>
            ) : (
              <button
                className={`chat-dock-send${sendEnabled ? " active" : ""}`}
                type="button"
                aria-label={copy.chat.sendMessage}
                disabled={!sendEnabled}
                onClick={() => onSend()}
              >
                <ArrowUp size={18} strokeWidth={2.5} color={sendEnabled ? "#fff" : "rgba(255,255,255,0.4)"} />
              </button>
            )}
          </div>
        </div>
      )}

      {isHero && !attachment && !isStreaming && (
        <div className="chat-dock-hero-chips">
          {getHeroChips(language).map((chip) => (
            <button
              key={chip.label}
              type="button"
              className="chat-dock-hero-chip"
              onClick={(e) => {
                e.stopPropagation();
                if (chip.action === 'open-preferences') {
                  openPreferences();
                } else {
                  onSend(chip.query);
                }
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <p className="chat-dock-safety">
        {SAFETY_NOTICE[language] || SAFETY_NOTICE.en}
      </p>
      <p className="chat-dock-powered-by">Powered by OMISEAI</p>

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
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => handleFileSelect(e, "camera")}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFileSelect(e, "library")}
      />
    </div>
  );
}
