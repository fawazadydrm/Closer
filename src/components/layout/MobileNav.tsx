"use client";

import { NAV_ITEMS, type TabKey } from "@/lib/nav";

interface MobileNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export default function MobileNav({ active, onChange }: MobileNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 backdrop-blur-sm md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-6 px-1 pb-[env(safe-area-inset-bottom)] pt-0.5 landscape:max-w-2xl landscape:pt-0">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              aria-current={isActive ? "page" : undefined}
              className={
                // Portrait: stacked icon-over-label. Landscape phone: horizontal
                // pill — same destinations, far less vertical footprint.
                "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold leading-none transition-colors landscape:min-h-[44px] landscape:flex-row landscape:gap-1.5 landscape:py-2 landscape:text-xs sm:text-[11px] " +
                (isActive
                  ? "text-accent"
                  : "text-content-muted hover:text-content-secondary")
              }
            >
              <span
                className={
                  "grid h-9 w-full max-w-[72px] place-items-center rounded-lg transition-colors landscape:h-8 landscape:w-8 landscape:max-w-none " +
                  (isActive ? "bg-accent-soft" : "")
                }
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.4 : 2} />
              </span>
              {item.shortLabel}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
