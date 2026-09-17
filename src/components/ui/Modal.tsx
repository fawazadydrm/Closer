"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "lg",
}: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-content-primary/25 animate-fade-in"
      />
      <div
        className={
          // Mobile: bottom sheet filling width, capped by dynamic viewport so
          // browser chrome never pushes actions off-screen. Desktop: centered card.
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-xl border border-line bg-white shadow-panel animate-fade-in sm:max-h-[85vh] sm:rounded-xl " +
          (size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md")
        }
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <div className="truncate text-base font-extrabold text-content-primary">
              {title}
            </div>
            {subtitle && (
              <div className="mt-0.5 text-xs text-content-secondary">{subtitle}</div>
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

        <div className="thin-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {children}
        </div>

        {footer && (
          <footer className="flex flex-col-reverse gap-2 border-t border-line bg-surface-soft px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:flex-row sm:items-center sm:justify-end sm:gap-2 sm:px-5 sm:pb-3 [&>*]:w-full [&>*]:sm:w-auto">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
