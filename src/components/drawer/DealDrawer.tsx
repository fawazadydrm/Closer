"use client";

import { useState } from "react";
import { Building2, LayoutList, FolderOpen, StickyNote, BellRing } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import FieldForms from "./FieldForms";
import DocumentHub from "./DocumentHub";
import NotesPanel from "./NotesPanel";
import DealTasksPanel from "./DealTasksPanel";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { stageById, STAGE_ACCENT } from "@/lib/stages";
import { formatIDR, formatIDRCompact, hasNoEstimate, sellingPrice } from "@/lib/format";

type Tab = "overview" | "documents" | "notes" | "tasks";

const TABS: { id: Tab; label: string; icon: typeof LayoutList }[] = [
  { id: "overview", label: "Overview", icon: LayoutList },
  { id: "documents", label: "Dokumen", icon: FolderOpen },
  { id: "notes", label: "Catatan", icon: StickyNote },
  { id: "tasks", label: "Reminder", icon: BellRing },
];

export default function DealDrawer() {
  const { selectedDealId, closeDeal } = useUI();
  const { dealById } = useCloser();
  const [tab, setTab] = useState<Tab>("overview");

  const deal = selectedDealId ? dealById(selectedDealId) : undefined;

  if (!deal) return <Drawer open={false} onClose={closeDeal} title="" children={null} />;

  const stage = stageById(deal.stage);
  const accent = STAGE_ACCENT[stage.accent];

  return (
    <Drawer
      open={!!selectedDealId}
      onClose={closeDeal}
      title={deal.title}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Building2 className="h-3 w-3" /> {deal.company}
          <span className={`badge border ${accent.border} ${accent.bg} ${accent.text}`}>
            {stage.shortLabel}
          </span>
        </span>
      }
    >
      {/* value banner — wraps on narrow drawers so big IDR figures never clip */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 rounded-xl border border-line bg-accent-soft px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-content-secondary">
            {hasNoEstimate(deal) ? "Belum ada budget" : "Harga Jual"}
          </p>
          <p className="break-words text-lg font-extrabold tabular-nums text-content-primary sm:text-xl">
            {hasNoEstimate(deal) ? "—" : formatIDR(sellingPrice(deal))}
          </p>
          {!hasNoEstimate(deal) && deal.cogs > 0 && (
            <p className="mt-0.5 text-[10px] text-content-muted">
              HPS {formatIDRCompact(deal.cogs)} × (1 + {deal.marginPct}%)
            </p>
          )}
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] uppercase tracking-wide text-content-secondary">Margin</p>
          <p className="text-lg font-bold tabular-nums text-success">
            {deal.cogs > 0 ? `${deal.marginPct}%` : "—"}
          </p>
        </div>
      </div>
      {hasNoEstimate(deal) && (
        <p className="mb-4 -mt-2 text-[11px] text-content-muted">
          Isi HPS &amp; margin di tab Overview begitu harga distributor turun.
        </p>
      )}

      {/* tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface-warm p-1 no-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "flex min-h-[38px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors " +
                (active
                  ? "bg-white text-content-primary shadow-card"
                  : "text-content-secondary hover:text-content-primary")
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <FieldForms deal={deal} />}
      {tab === "documents" && <DocumentHub deal={deal} />}
      {tab === "notes" && <NotesPanel deal={deal} />}
      {tab === "tasks" && <DealTasksPanel deal={deal} />}
    </Drawer>
  );
}
