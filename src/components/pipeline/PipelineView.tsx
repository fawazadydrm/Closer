"use client";

import { useMemo, useState } from "react";
import { ChevronDown, LayoutGrid, List, Plus } from "lucide-react";
import KanbanBoard from "./KanbanBoard";
import DealsTable from "./DealsTable";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { DEAL_TYPES, DEAL_TYPE_META, PIPELINE_STAGES } from "@/lib/stages";
import type { DealType, StageId } from "@/lib/types";

type ViewMode = "board" | "table";

export default function PipelineView() {
  const { deals } = useCloser();
  const { openAddDeal } = useUI();
  const [mode, setMode] = useState<ViewMode>("board");

  const [stageFilter, setStageFilter] = useState<StageId | "all">("all");
  const [typeFilter, setTypeFilter] = useState<DealType | "all">("all");

  const stageOptions = useMemo(
    () => [
      { id: "all" as const, label: "Semua Tahap", count: deals.length },
      ...PIPELINE_STAGES.map((s) => ({
        id: s.id,
        label: s.shortLabel,
        count: deals.filter((d) => d.stage === s.id).length,
      })),
    ],
    [deals]
  );

  const typeOptions = useMemo(
    () => [
      { id: "all" as const, label: "Semua Tipe", count: deals.length },
      ...DEAL_TYPES.map((t) => ({
        id: t,
        label: DEAL_TYPE_META[t].label,
        count: deals.filter((d) => d.dealType === t).length,
      })),
    ],
    [deals]
  );

  const filtered = useMemo(
    () =>
      deals.filter(
        (d) =>
          (stageFilter === "all" || d.stage === stageFilter) &&
          (typeFilter === "all" || d.dealType === typeFilter)
      ),
    [deals, stageFilter, typeFilter]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-content-primary md:text-2xl">
            Pipeline
          </h2>
          <p className="text-sm text-content-secondary">
            {filtered.length} deal
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* view toggle */}
          <div className="flex rounded-xl border border-line bg-ink-surface p-1">
            {(
              [
                { id: "board", icon: LayoutGrid, label: "Papan" },
                { id: "table", icon: List, label: "Tabel" },
              ] as const
            ).map((v) => {
              const Icon = v.icon;
              const active = mode === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setMode(v.id)}
                  title={`Tampilan ${v.label}`}
                  className={
                    "flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors " +
                    (active
                      ? "bg-accent text-white shadow-card"
                      : "text-content-secondary hover:text-content-primary")
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              );
            })}
          </div>
          <button onClick={openAddDeal} className="btn-primary min-h-[38px] whitespace-nowrap px-4 py-2 text-sm">
            <Plus className="h-4 w-4" strokeWidth={2.6} />
            Deal Baru
          </button>
        </div>
      </div>

      {/* filters — one compact row, works in board & table mode, mobile-safe */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={stageFilter}
          onChange={(v) => setStageFilter(v as StageId | "all")}
          options={stageOptions}
        />
        <FilterSelect
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as DealType | "all")}
          options={typeOptions}
        />
        {(stageFilter !== "all" || typeFilter !== "all") && (
          <button
            onClick={() => {
              setStageFilter("all");
              setTypeFilter("all");
            }}
            className="text-xs font-semibold text-content-muted underline-offset-2 transition-colors hover:text-content-primary hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      {mode === "board" ? (
        <KanbanBoard deals={filtered} />
      ) : (
        <DealsTable deals={filtered} />
      )}
    </div>
  );
}

/** Compact select styled like the other toolbar controls. */
function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string; count: number }[];
}) {
  const active = options.find((o) => o.id === value) ?? options[0];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={active.label}
        className={
          "appearance-none rounded-lg border py-1.5 pl-3 pr-8 text-xs font-semibold transition-colors focus:outline-none " +
          (value === "all"
            ? "border-line bg-ink-surface text-content-secondary hover:border-line-muted"
            : "border-accent/50 bg-accent-soft text-accent")
        }
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label} ({o.count})
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-muted" />
    </div>
  );
}
