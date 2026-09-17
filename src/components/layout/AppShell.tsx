"use client";

import { type ReactNode } from "react";
import { Loader2, Radar } from "lucide-react";
import DesktopTabs from "./DesktopTabs";
import MobileNav from "./MobileNav";
import { useUI } from "@/state/UIContext";
import { useCloser } from "@/state/CloserContext";

export default function AppShell({ children }: { children: ReactNode }) {
  const { activeTab, navigate } = useUI();
  const { loading } = useCloser();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 landscape:py-2 md:gap-4 md:px-6 md:py-3">
          <Brand />
          <DesktopTabs active={activeTab} onChange={navigate} />
        </div>
      </div>

      {/* Content — bottom padding clears the fixed mobile nav + iOS home indicator */}
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 landscape:pt-3 md:px-6 md:pb-10 md:pt-5">
        {loading ? (
          <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center gap-3 py-16 text-content-secondary">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
            <p className="text-sm font-medium">Menarik data dari Supabase…</p>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav active={activeTab} onChange={navigate} />
    </div>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent sm:h-10 sm:w-10">
        <Radar className="h-5 w-5 text-white sm:h-6 sm:w-6" strokeWidth={2.2} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-success ring-2 ring-white" />
      </div>
      <div className="min-w-0 leading-tight">
        <h1 className="truncate text-base font-extrabold tracking-tight text-content-primary sm:text-lg">
          CLOSER
        </h1>
        <p className="hidden truncate text-[11px] font-medium text-content-secondary lg:block">
          Personal Pipeline OS{" "}
          <span className="text-content-muted">|</span> Fawaz Adya Dermawan
        </p>
      </div>
    </div>
  );
}
