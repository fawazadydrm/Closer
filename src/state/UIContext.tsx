"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { TabKey } from "@/lib/nav";

interface UIContextValue {
  // Active module / tab
  activeTab: TabKey;
  navigate: (tab: TabKey) => void;

  // Deal detail drawer
  selectedDealId: string | null;
  openDeal: (id: string) => void;
  closeDeal: () => void;

  // New deal modal
  isAddDealOpen: boolean;
  openAddDeal: () => void;
  closeAddDeal: () => void;

  // Lightweight toast
  toast: string | null;
  showToast: (message: string) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isAddDealOpen, setAddDealOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({
      activeTab,
      navigate: (tab) => setActiveTab(tab),
      selectedDealId,
      openDeal: (id) => setSelectedDealId(id),
      closeDeal: () => setSelectedDealId(null),
      isAddDealOpen,
      openAddDeal: () => setAddDealOpen(true),
      closeAddDeal: () => setAddDealOpen(false),
      toast,
      showToast,
    }),
    [activeTab, selectedDealId, isAddDealOpen, toast, showToast]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within <UIProvider>");
  return ctx;
}
