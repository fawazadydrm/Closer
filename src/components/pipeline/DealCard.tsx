"use client";

import {
  Building2,
  Phone,
  CalendarClock,
  Paperclip,
  GripVertical,
} from "lucide-react";
import type { Deal } from "@/lib/types";
import { PRIORITY_META } from "@/lib/stages";
import { formatIDRCompact, formatDateShort, hasNoEstimate, sellingPrice } from "@/lib/format";

interface DealCardProps {
  deal: Deal;
  onOpen: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  compact?: boolean;
}

export default function DealCard({
  deal,
  onOpen,
  draggable,
  onDragStart,
}: DealCardProps) {
  const p = PRIORITY_META[deal.priority];

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, deal.id)}
      onClick={() => onOpen(deal.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(deal.id);
      }}
      className="glass-card glass-card-hover group relative w-full cursor-pointer p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:cursor-grabbing"
    >
      {/* top row: priority + drag handle */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className={`badge border ${p.badge}`}>{p.label}</span>
        {draggable && (
          <GripVertical className="h-4 w-4 shrink-0 text-content-muted md:opacity-0 md:transition-opacity md:group-hover:opacity-100" />
        )}
      </div>

      <h4 className="line-clamp-2 text-sm font-bold leading-snug text-content-primary">
        {deal.title}
      </h4>

      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-content-secondary">
        <Building2 className="h-3.5 w-3.5 shrink-0 text-content-muted" />
        <span className="truncate">{deal.company}</span>
      </p>

      {hasNoEstimate(deal) ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-content-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-warn" />
          Belum diestimasi
        </p>
      ) : (
        <p className="mt-2 text-base font-extrabold tracking-tight text-content-primary tabular-nums">
          {formatIDRCompact(sellingPrice(deal))}
        </p>
      )}

      <div className="mt-2 space-y-1 border-t border-line pt-2">
        <p className="flex items-center gap-1.5 text-[11px] text-content-secondary">
          <Phone className="h-3 w-3 shrink-0 text-content-muted" />
          <span className="truncate">
            {deal.contact.name} · {deal.contact.phone}
          </span>
        </p>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] text-content-secondary">
            <CalendarClock className="h-3 w-3 shrink-0 text-content-muted" />
            Target {formatDateShort(deal.targetCloseDate)}
          </p>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-accent">
            <Paperclip className="h-3 w-3" />
            {deal.documents.length}
          </span>
        </div>
      </div>
    </div>
  );
}
