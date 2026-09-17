"use client";

import { useState } from "react";
import { Columns3, Table2, Plus } from "lucide-react";
import KanbanBoard from "./KanbanBoard";
import DealsTable from "./DealsTable";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";

type ViewMode = "kanban" | "table";

export default function PipelineView() {
  const { deals } = useCloser();
  const { openAddDeal } = useUI();
  const [mode, setMode] = useState<ViewMode>("kanban");

  return (
    <div className="space-y-4">
      {/* header + controls */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-content-primary md:text-2xl">
            Sales Pipeline
          </h2>
          <p className="text-sm text-content-secondary">
            {deals.length} deal ·{" "}
            <span className="hidden sm:inline">tarik kartu untuk pindah stage</span>
            <span className="sm:hidden">ketuk kartu untuk detail & pindah stage</span>
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
          <div className="flex rounded-lg border border-line bg-white p-1">
            <ViewToggle
              active={mode === "kanban"}
              onClick={() => setMode("kanban")}
              icon={Columns3}
              label="Kanban"
            />
            <ViewToggle
              active={mode === "table"}
              onClick={() => setMode("table")}
              icon={Table2}
              label="Tabel"
            />
          </div>
          <button onClick={openAddDeal} className="btn-primary min-h-[38px]">
            <Plus className="h-4 w-4" strokeWidth={2.6} />
            Deal Baru
          </button>
        </div>
      </div>

      {mode === "kanban" ? (
        <KanbanBoard deals={deals} />
      ) : (
        <DealsTable deals={deals} />
      )}
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Columns3;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "flex min-h-[36px] items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
        (active
          ? "bg-accent-soft text-accent"
          : "text-content-secondary hover:bg-ink-overlay hover:text-content-primary")
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
