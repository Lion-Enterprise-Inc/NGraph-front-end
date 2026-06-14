"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import LanguageModal from "./LanguageModal";
import LanguageSuggestionBanner from "./LanguageSuggestionBanner";
import OnboardingModal from "./OnboardingModal";
import PreferencesModal from "./PreferencesModal";
import HistoryDrawer from "./HistoryDrawer";
import MenuListDrawer from "./MenuListDrawer";
import { getUiCopy } from "../i18n/uiCopy";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "./admin/Toast";

type PendingAttachment = {
  file: File;
  source: "camera" | "library";
};

type Theme = "dark" | "light";

// スタッフモードのハンバーガー項目。CapturePage が ownerSession 確立時に登録し、
// HistoryDrawer(ハンバーガー)がこれを読んで「スタッフ」セクションを描画する。
// 客 or プレビュー中は null(=スタッフ項目を出さない)。
type StaffMenu = {
  pending: number;            // 未回答質問数(②のバッジ)
  onRegisterMenu: () => void; // ① メニューを登録(写真)
  onQuestions: () => void;    // ② 質問に答える
  onDailyMenu: () => void;    // ③ 今日の献立
  onBulkEdit: () => void;     // ④ まとめて直す
  onMenuFix: () => void;      // メニューを修正(一覧)
  onProcurement: () => void;  // ⑤ 納品書を撮る
  onShareLinks: () => void;   // ⑥⑦ リンク共有(お客様用QR/スタッフ招待)
  onPreviewAsCustomer: () => void; // ⑧ お客様画面で確認
} | null;

type AppContextValue = {
  language: string;
  setLanguage: (code: string, source?: string) => void;
  openLanguageModal: () => void;
  openHistoryDrawer: () => void;
  closeHistoryDrawer: () => void;
  openMenuList: (focusMenuUid?: string, category?: string) => void;
  closeMenuList: () => void;
  openPreferences: () => void;
  closePreferences: () => void;
  pendingAttachment: PendingAttachment | null;
  setPendingAttachment: (attachment: PendingAttachment | null) => void;
  restaurantSlug: string | null;
  setRestaurantSlug: (slug: string | null) => void;
  businessType: string | null;
  setBusinessType: (type: string | null) => void;
  googleReviewUrl: string | null;
  setGoogleReviewUrl: (url: string | null) => void;
  onNewChat: (() => void) | null;
  setOnNewChat: (fn: (() => void) | null) => void;
  onSelectThread: ((threadUid: string) => void) | null;
  setOnSelectThread: (fn: ((threadUid: string) => void) | null) => void;
  // ハンバーガー内の「お気に入り」「人気ランキング」呼び出し用 (CapturePage が登録)
  onOpenLiked: (() => void) | null;
  setOnOpenLiked: (fn: (() => void) | null) => void;
  onOpenPopular: (() => void) | null;
  setOnOpenPopular: (fn: (() => void) | null) => void;
  // MenuListDrawer 内チップから chat に質問投入する callback
  onAskAbout: ((query: string) => void) | null;
  setOnAskAbout: (fn: ((query: string) => void) | null) => void;
  // 店主モードのセッショントークン(MenuListDrawer で編集UIを出すか判定)
  ownerSessionToken: string | null;
  setOwnerSessionToken: (token: string | null) => void;
  // スタッフモードのハンバーガー項目(CapturePage が登録、HistoryDrawer が描画)
  staffMenu: StaffMenu;
  setStaffMenu: (menu: StaffMenu) => void;
  geoLocation: { lat: number; lng: number } | null;
  setGeoLocation: (loc: { lat: number; lng: number } | null) => void;
  theme: Theme;
  toggleTheme: () => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "appLanguage";
const THEME_STORAGE_KEY = "ngraph-theme";

const logLanguageSelection = (entry: {
  language: string;
  source: string;
  createdAt: string;
}) => {
  try {
    const raw = localStorage.getItem("languageSelectionLog");
    const existing = raw ? JSON.parse(raw) : [];
    existing.push(entry);
    localStorage.setItem("languageSelectionLog", JSON.stringify(existing));
  } catch (error) {
    console.log("language_log_error", error);
  }
  console.log("language_selection_log", entry);
};

export function AppProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [language, setLanguageState] = useState("ja");
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuListOpen, setMenuListOpen] = useState(false);
  // MenuStrip 等から特定カードを展開した状態で開くための uid
  const [menuListFocusUid, setMenuListFocusUid] = useState<string | null>(null);
  // MenuStrip のカテゴリーチップから、そのカテゴリーで絞った状態で開くための初期カテゴリー
  const [menuListInitialCategory, setMenuListInitialCategory] = useState<string | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] =
    useState<PendingAttachment | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string | null>(null);
  const [onNewChat, setOnNewChat] = useState<(() => void) | null>(null);
  const [onSelectThread, setOnSelectThread] = useState<((threadUid: string) => void) | null>(null);
  const [onOpenLiked, setOnOpenLiked] = useState<(() => void) | null>(null);
  const [onOpenPopular, setOnOpenPopular] = useState<(() => void) | null>(null);
  const [onAskAbout, setOnAskAbout] = useState<((query: string) => void) | null>(null);
  const [ownerSessionToken, setOwnerSessionToken] = useState<string | null>(null);
  const [staffMenu, setStaffMenu] = useState<StaffMenu>(null);

  // オンボーディング: 初回訪問 (店舗 context あり) で表示
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingDefaultLang, setOnboardingDefaultLang] = useState("ja");
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!restaurantSlug) return;  // 店舗未確定なら出さない
    // 店主リンク(owner=)から入った端末には客向けオンボを出さない。
    // 出すと店主ゲート(パスコード)や質問フローの上に言語選択が被って初回体験を壊す
    if (new URLSearchParams(window.location.search).has("owner")) {
      try { localStorage.setItem("omiseai_onboarded", "true"); } catch {}
      return;
    }
    if (localStorage.getItem("omiseai_onboarded") === "true") return;
    // 既に何度か言語選択した実績がある場合は出さない
    if (localStorage.getItem("appLanguage")) {
      try { localStorage.setItem("omiseai_onboarded", "true"); } catch {}
      return;
    }
    // ブラウザ言語を検出して default
    const browser = (navigator.language || "ja").toLowerCase();
    let detected = browser.split("-")[0];
    if (browser.startsWith("zh")) {
      detected = browser.includes("hant") || browser.includes("tw") || browser.includes("hk")
        ? "zh-Hant" : "zh-Hans";
    }
    setOnboardingDefaultLang(detected);
    setOnboardingOpen(true);
  }, [restaurantSlug]);

  const handleOnboardingComplete = (lang: string, allergies: string[], firstQuery: string | null) => {
    setLanguage(lang, "onboarding");
    try {
      localStorage.setItem("omiseai_onboarded", "true");
      localStorage.setItem("omiseai_allergies", JSON.stringify(allergies));
    } catch {}
    setOnboardingOpen(false);
    if (firstQuery && onAskAbout) {
      // chat に最初のクエリ投入
      setTimeout(() => onAskAbout(firstQuery), 200);
    }
  };
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [theme, setThemeState] = useState<Theme>("dark");

  // Geolocation is requested on-demand (e.g. "現在地の近く" button), not on page load

  const setLanguage = (code: string, source = "unknown") => {
    setLanguageState(code);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch (error) {
      console.log("language_persist_error", error);
    }
    logLanguageSelection({
      language: code,
      source,
      createdAt: new Date().toISOString(),
    });
  };

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) {
      setLanguage(stored, "storage");
      return;
    }
    // 初回訪問: 干渉的なモーダル自動 open は廃止。
    // 代わりに LanguageSuggestionBanner が穏やかに切替誘導する。
    // デフォルトは "ja" のまま（OMISEAI = 日本の店内 QR 起点が多数派）。
    // ブラウザ言語が ja 以外なら banner が「Switch to {lang}?」を提示。
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = language;
  }, [language]);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch {}
    document.documentElement.setAttribute("data-theme", next);
  };

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
      <AppContext.Provider
        value={{
          language,
          setLanguage,
          openLanguageModal: () => setLanguageModalOpen(true),
          openHistoryDrawer: () => setDrawerOpen(true),
          closeHistoryDrawer: () => setDrawerOpen(false),
          openMenuList: (focusMenuUid?: string, category?: string) => {
            setMenuListFocusUid(focusMenuUid ?? null);
            setMenuListInitialCategory(category ?? null);
            setMenuListOpen(true);
          },
          closeMenuList: () => setMenuListOpen(false),
          openPreferences: () => setPreferencesOpen(true),
          closePreferences: () => setPreferencesOpen(false),
          pendingAttachment,
          setPendingAttachment,
          restaurantSlug,
          setRestaurantSlug,
          businessType,
          setBusinessType,
          googleReviewUrl,
          setGoogleReviewUrl,
          onNewChat,
          setOnNewChat,
          onSelectThread,
          setOnSelectThread,
          onOpenLiked,
          setOnOpenLiked,
          onOpenPopular,
          setOnOpenPopular,
          onAskAbout,
          setOnAskAbout,
          ownerSessionToken,
          setOwnerSessionToken,
          staffMenu,
          setStaffMenu,
          geoLocation,
          setGeoLocation,
          theme,
          toggleTheme,
        }}
      >
        {children}
        {!isAdmin && (
          <OnboardingModal
            open={onboardingOpen}
            defaultLang={onboardingDefaultLang}
            onComplete={handleOnboardingComplete}
          />
        )}
        {!isAdmin && !onboardingOpen && <LanguageSuggestionBanner />}
        {!isAdmin && (
          <>
            <LanguageModal
              open={languageModalOpen}
              selected={language}
              onSelect={(code) => {
                setLanguage(code, "modal");
                setLanguageModalOpen(false);
              }}
              onClose={() => setLanguageModalOpen(false)}
            />
            <HistoryDrawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              restaurantSlug={restaurantSlug}
              onNewChat={onNewChat ?? undefined}
              onSelectThread={onSelectThread ?? undefined}
              staffMenu={staffMenu}
            />
            <MenuListDrawer
              open={menuListOpen}
              onClose={() => {
                setMenuListOpen(false);
                setMenuListFocusUid(null);
                setMenuListInitialCategory(null);
              }}
              restaurantSlug={restaurantSlug}
              businessType={businessType}
              onAskAbout={onAskAbout ?? undefined}
              initialExpandedUid={menuListFocusUid}
              initialCategory={menuListInitialCategory}
              ownerSessionToken={ownerSessionToken}
            />
            <PreferencesModal
              open={preferencesOpen}
              onClose={() => setPreferencesOpen(false)}
            />
          </>
        )}
      </AppContext.Provider>
      </ToastProvider>
    </AuthProvider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
