"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import LanguageModal from "./LanguageModal";
import HistoryDrawer from "./HistoryDrawer";
import { getUiCopy } from "../i18n/uiCopy";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "./admin/Toast";

type PendingAttachment = {
  file: File;
  source: "camera" | "library";
};

type AppContextValue = {
  language: string;
  setLanguage: (code: string, source?: string) => void;
  openLanguageModal: () => void;
  openHistoryDrawer: () => void;
  closeHistoryDrawer: () => void;
  pendingAttachment: PendingAttachment | null;
  setPendingAttachment: (attachment: PendingAttachment | null) => void;
  restaurantSlug: string | null;
  setRestaurantSlug: (slug: string | null) => void;
  onNewChat: (() => void) | null;
  setOnNewChat: (fn: (() => void) | null) => void;
  onSelectThread: ((threadUid: string) => void) | null;
  setOnSelectThread: (fn: ((threadUid: string) => void) | null) => void;
  geoLocation: { lat: number; lng: number } | null;
  setGeoLocation: (loc: { lat: number; lng: number } | null) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "appLanguage";

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
  const [language, setLanguageState] = useState("ja");
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] =
    useState<PendingAttachment | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);
  const [onNewChat, setOnNewChat] = useState<(() => void) | null>(null);
  const [onSelectThread, setOnSelectThread] = useState<((threadUid: string) => void) | null>(null);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);

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
    // First visit: detect browser language and show language picker
    const browserLanguage = navigator.language;
    const normalized = browserLanguage.toLowerCase();
    let detected = normalized.split("-")[0];
    if (normalized.startsWith("zh")) {
      detected =
        normalized.includes("hant") ||
        normalized.includes("tw") ||
        normalized.includes("hk")
          ? "zh-Hant"
          : "zh-Hans";
    }
    setLanguageState(detected);
    // Auto-open language sheet on first visit so user confirms their language
    setLanguageModalOpen(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = language;
  }, [language]);

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
          pendingAttachment,
          setPendingAttachment,
          restaurantSlug,
          setRestaurantSlug,
          onNewChat,
          setOnNewChat,
          onSelectThread,
          setOnSelectThread,
          geoLocation,
          setGeoLocation,
        }}
      >
        {children}
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
        />
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
