"use client";

import { useState } from "react";
import DealCard from "./DealCard";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { PIPELINE_STAGES, STAGE_ACCENT } from "@/lib/stages";
import type { Deal, StageId } from "@/lib/types";
import { formatIDRCompact, sellingPrice } from "@/lib/format";

export default function KanbanBoard({ deals }: { deals: Deal[] }) {
  const { dispatch } = useCloser();
  const { openDeal } = useUI();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<StageId | null>(null);

  const handleDrop = (stage: StageId) => {
    if (draggingId) dispatch({ type: "MOVE_DEAL", id: draggingId, stage });
    setDraggingId(null);
    setOverStage(null);
  };

  return (
    <div className="thin-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-3">
      {PIPELINE_STAGES.map((stage) => {
        const items = deals.filter((d) => d.stage === stage.id);
        const total = items.reduce((s, d) => s + sellingPrice(d), 0);
        const a = STAGE_ACCENT[stage.accent];
        const isOver = overStage === stage.id;

        return (
          <div
            key={stage.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage.id);
            }}
            onDragLeave={() =>
              setOverStage((cur) => (cur === stage.id ? null : cur))
            }
            onDrop={() => handleDrop(stage.id)}
            className={
              "flex w-[78vw] max-w-[300px] shrink-0 flex-col rounded-xl border bg-surface-soft transition-colors sm:w-[280px] md:w-[300px] " +
              (isOver ? `${a.border} bg-ink-overlay` : "border-line")
            }
          >
            {/* column header */}
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${a.dot}`} />
                <span className="truncate text-xs font-bold uppercase tracking-wide text-content-primary">
                  {stage.shortLabel}
                </span>
                <span
                  className={`badge border ${a.border} ${a.bg} ${a.text}`}
                >
                  {items.length}
                </span>
              </div>
            </div>
            <div className="px-3 pt-1.5 text-[11px] font-semibold text-content-muted">
              {total > 0 ? formatIDRCompact(total) : "—"}
            </div>

            {/* cards */}
            <div className="flex-1 space-y-2 p-2">
              {items.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  draggable
                  onOpen={openDeal}
                  onDragStart={(e, id) => {
                    setDraggingId(id);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", id);
                  }}
                />
              ))}
              {items.length === 0 && (
                <div className="grid h-24 place-items-center rounded-xl border border-dashed border-line text-[11px] text-content-muted">
                  Tarik deal ke sini
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
