"use client";

import { type ReactNode } from "react";
import { Loader2, Radar } from "lucide-react";
import DesktopTabs from "./DesktopTabs";
import MobileNav from "./MobileNav";
import { useUI } from "@/state/UIContext";
import { useCloser } from "@/state/CloserContext";

export default function AppShell({ children }: { children: ReactNode }) {
  const { activeTab, navigate } = useUI();
  const { loading, meta } = useCloser();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 landscape:py-2 md:gap-4 md:px-6 md:py-3">
          <Brand />
          <div className="flex items-center gap-3 md:gap-4">
            <DesktopTabs active={activeTab} onChange={navigate} />
            <SyncBadge lastSyncedAt={meta.lastSyncedAt} syncing={meta.syncing} />
          </div>
        </div>
      </div>

      {/* Content — bottom padding clears the fixed mobile nav + iOS home indicator */}
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 landscape:pt-3 md:px-6 md:pb-10 md:pt-5">
        {loading ? (
          <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center gap-3 py-16 text-content-secondary">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
            <p className="text-sm font-medium">Memuat data…</p>
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

/** Live sync beacon + last-updated time — pulses while writes are in flight. */
function SyncBadge({ lastSyncedAt, syncing }: { lastSyncedAt: string; syncing: number }) {
  const live = syncing > 0;
  const time = new Date(lastSyncedAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-lg border border-line bg-ink-overlay px-2.5 py-1.5"
      title={live ? "Menyimpan perubahan…" : `Tersinkronkan pukul ${time}`}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {live && (
          <span className="absolute inline-flex h-full w-full animate-sync-ping rounded-full bg-success/60" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full transition-colors duration-300 ${
            live ? "animate-pulse bg-accent" : "bg-success"
          }`}
        />
      </span>
      <span
        className={`text-[11px] font-semibold leading-tight ${
          live ? "text-accent" : "text-content-secondary"
        }`}
      >
        {live ? "Sinkron…" : "Sinkron"}
        <span className="block font-medium tabular-nums text-content-muted">{time}</span>
      </span>
    </div>
  );
}
