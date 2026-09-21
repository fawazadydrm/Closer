"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}

/** Right-sliding detail drawer. Renders nothing when closed. */
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-content-primary/25 animate-fade-in"
      />
      {/* panel */}
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-full flex-col border-l border-line bg-white shadow-panel animate-slide-in-right sm:max-w-md lg:max-w-lg">
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
          <div className="min-w-0">
            {/* Titles wrap instead of truncating — deal names are the primary identifier */}
            <div className="text-base font-extrabold leading-snug text-content-primary">
              {title}
            </div>
            {subtitle && (
              <div className="mt-1 text-xs text-content-secondary">{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-content-secondary transition-colors hover:bg-ink-overlay hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="thin-scrollbar flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-4">
          {children}
        </div>
      </aside>
    </div>
  );
}
