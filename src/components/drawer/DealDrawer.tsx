"use client";

import { useState } from "react";
import {
  Building2,
  LayoutList,
  FolderOpen,
  StickyNote,
  BellRing,
  ExternalLink,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import FieldForms from "./FieldForms";
import DocumentHub from "./DocumentHub";
import NotesPanel from "./NotesPanel";
import DealTasksPanel from "./DealTasksPanel";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { DEAL_TYPE_META, stageById, STAGE_ACCENT } from "@/lib/stages";
import {
  formatIDR,
  formatIDRCompact,
  hasNoEstimate,
  sellingPrice,
  simulateFromHps,
} from "@/lib/format";

type Tab = "overview" | "documents" | "notes" | "tasks";

const TABS: { id: Tab; label: string; icon: typeof LayoutList }[] = [
  { id: "overview", label: "Overview", icon: LayoutList },
  { id: "documents", label: "Dokumen", icon: FolderOpen },
  { id: "notes", label: "Catatan", icon: StickyNote },
  { id: "tasks", label: "Reminder", icon: BellRing },
];

export default function DealDrawer() {
  const { selectedDealId, closeDeal, showToast } = useUI();
  const { dealById, dispatch } = useCloser();
  const [tab, setTab] = useState<Tab>("overview");

  const deal = selectedDealId ? dealById(selectedDealId) : undefined;

  if (!deal) return <Drawer open={false} onClose={closeDeal} title="" />;

  const stage = stageById(deal.stage);
  const accent = STAGE_ACCENT[stage.accent];
  const typeMeta = DEAL_TYPE_META[deal.dealType];

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
          <span className={`badge border ${typeMeta.badge}`}>{typeMeta.label}</span>
          {deal.landingPageUrl && (
            <a
              href={deal.landingPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Landing Page
            </a>
          )}
        </span>
      }
    >
      {/* archive controls — manual move to Repository */}
      <div className="mb-3 flex items-center justify-between gap-2">
        {deal.archived ? (
          <span className="badge border border-line-muted bg-ink-overlay text-content-secondary">
            <Archive className="h-3 w-3" /> Diarsipkan
          </span>
        ) : (
          <span className="text-[11px] text-content-muted">
            {deal.stage === "closed_lost" ? "Closed lost — siap diarsipkan." : ""}
          </span>
        )}
        <button
          onClick={() => {
            const next = !deal.archived;
            dispatch({ type: "UPDATE_DEAL", id: deal.id, patch: { archived: next } });
            showToast(
              next
                ? "Deal dipindahkan ke Repository."
                : "Deal dikembalikan ke pipeline."
            );
          }}
          className={
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors " +
            (deal.archived
              ? "border-accent/40 bg-accent-soft text-accent hover:opacity-80"
              : "border-line bg-ink-surface text-content-secondary hover:border-line-muted hover:text-content-primary")
          }
        >
          {deal.archived ? (
            <>
              <ArchiveRestore className="h-3.5 w-3.5" /> Kembalikan
            </>
          ) : (
            <>
              <Archive className="h-3.5 w-3.5" /> Arsipkan
            </>
          )}
        </button>
      </div>

      {/* value banner — hasil simulasi HPS */}
      <div className="mb-4 rounded-xl border border-line bg-accent-soft px-4 py-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-content-secondary">
              {hasNoEstimate(deal) ? "Belum ada budget" : "Harga Jual (simulasi)"}
            </p>
            <p className="text-xl font-extrabold tabular-nums text-content-primary">
              {hasNoEstimate(deal) ? "—" : formatIDR(sellingPrice(deal))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-content-secondary">
              Margin Target
            </p>
            <p className="text-lg font-bold tabular-nums text-success">
              {deal.hps > 0 ? `${deal.marginPct}%` : "—"}
            </p>
          </div>
        </div>
        {deal.hps > 0 &&
          (() => {
            const sim = simulateFromHps(deal.hps, deal.marginPct);
            return (
              <div className="mt-2 grid grid-cols-3 gap-2 border-t border-accent/20 pt-2 text-center">
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-content-muted">HPS</p>
                  <p className="text-xs font-bold tabular-nums text-content-primary">
                    {formatIDRCompact(deal.hps)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-content-muted">
                    Bid COGS
                  </p>
                  <p className="text-xs font-bold tabular-nums text-content-primary underline decoration-accent/50 decoration-2 underline-offset-2">
                    {formatIDRCompact(sim.cogsBid)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-content-muted">Profit</p>
                  <p className="text-xs font-bold tabular-nums text-content-primary">
                    {formatIDRCompact(sim.profit)}
                  </p>
                </div>
              </div>
            );
          })()}
      </div>
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
                "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors " +
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
