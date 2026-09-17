"use client";

import { NAV_ITEMS, type TabKey } from "@/lib/nav";

interface DesktopTabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export default function DesktopTabs({ active, onChange }: DesktopTabsProps) {
  return (
    <div className="hidden gap-1 rounded-xl border border-line bg-white p-1 md:flex lg:hidden xl:flex">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            aria-current={isActive ? "page" : undefined}
            className={
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors duration-150 lg:px-2.5 lg:text-xs xl:px-4 xl:text-sm " +
              (isActive
                ? "bg-accent-soft text-accent"
                : "text-content-secondary hover:bg-ink-overlay hover:text-content-primary")
            }
          >
            <Icon className="h-4 w-4" strokeWidth={isActive ? 2.4 : 2} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
