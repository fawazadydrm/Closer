"use client";

import { TrendingUp, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  accent?: "blue" | "emerald" | "amber" | "indigo";
}

const ACCENTS: Record<
  NonNullable<StatCardProps["accent"]>,
  { iconBg: string; iconText: string }
> = {
  blue: {
    iconBg: "bg-accent-soft",
    iconText: "text-accent",
  },
  emerald: {
    iconBg: "bg-success-soft",
    iconText: "text-success",
  },
  amber: {
    iconBg: "bg-warn-soft",
    iconText: "text-warn",
  },
  indigo: {
    iconBg: "bg-gold-soft",
    iconText: "text-gold",
  },
};

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "blue",
}: StatCardProps) {
  const a = ACCENTS[accent];
  return (
    <div className="glass-card glass-card-hover relative overflow-hidden p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
            {label}
          </p>
          <p className="mt-1.5 break-words text-xl font-extrabold tracking-tight tabular-nums text-content-primary sm:text-2xl">
            {value}
          </p>
          {sub && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-content-secondary">
              <TrendingUp className="h-3 w-3 shrink-0 text-success" />
              <span className="min-w-0">{sub}</span>
            </p>
          )}
        </div>
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${a.iconBg} ${a.iconText}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}
