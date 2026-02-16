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

  const historyItems = useMemo(() => {
    const copy = getUiCopy(language);
    return [
      { id: "1", title: copy.history.title, date: "2025-01-08" },
      { id: "2", title: copy.history.title, date: "2025-01-07" },
      { id: "3", title: copy.history.title, date: "2025-01-06" },
      { id: "4", title: copy.history.title, date: "2025-01-05" },
      { id: "5", title: copy.history.title, date: "2025-01-04" },
    ];
  }, [language]);

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
    setLanguage(detected, "browser");
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
          items={historyItems}
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
