"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Search,
  Building2,
  CalendarClock,
} from "lucide-react";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { DEAL_TYPE_META, PRIORITY_META, STAGE_ACCENT, stageById } from "@/lib/stages";
import { formatDateShort, formatIDR, hasNoEstimate, sellingPrice } from "@/lib/format";
import type { Deal } from "@/lib/types";

export default function RepositoryView() {
  const { deals, dispatch } = useCloser();
  const { openDeal, showToast } = useUI();
  const [query, setQuery] = useState("");

  const archived = useMemo(() => deals.filter((d) => d.archived), [deals]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? archived.filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            d.company.toLowerCase().includes(q) ||
            d.contact.name.toLowerCase().includes(q)
        )
      : archived;
    return [...list].sort((a, b) =>
      b.targetCloseDate.localeCompare(a.targetCloseDate)
    );
  }, [archived, query]);

  const restore = (d: Deal) => {
    dispatch({ type: "UPDATE_DEAL", id: d.id, patch: { archived: false } });
    showToast(`"${d.title}" dikembalikan ke pipeline.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-content-primary md:text-2xl">
            Repository
          </h2>
          <p className="text-sm text-content-secondary">
            {archived.length} deal diarsipkan
          </p>
        </div>
      </div>

      <div className="relative min-w-0 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
        <input
          className="field-input pl-9"
          placeholder="Cari deal yang diarsipkan…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center gap-2 py-16 text-center text-content-muted">
          <Archive className="h-8 w-8" />
          <p className="text-sm">
            {archived.length === 0
              ? "Belum ada deal di Repository. Arsipkan deal lewat tombol \"Arsipkan\" di detail deal."
              : "Tidak ada deal yang cocok."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((d) => {
            const stage = stageById(d.stage);
            const accent = STAGE_ACCENT[stage.accent];
            const p = PRIORITY_META[d.priority];
            const t = DEAL_TYPE_META[d.dealType];
            const hasContact =
              d.contact.name && d.contact.name !== "—" ? d.contact.name : "";
            return (
              <li key={d.id} className="glass-card p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => openDeal(d.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-bold text-content-primary">
                      {d.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-content-muted">
                      <Building2 className="h-3.5 w-3.5 shrink-0" /> {d.company}
                    </p>
                  </button>
                  <button
                    onClick={() => restore(d)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/40 bg-accent-soft px-2.5 py-1.5 text-xs font-semibold text-accent transition-opacity hover:opacity-80"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" /> Kembalikan
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <span className={`badge border ${accent.border} ${accent.bg} ${accent.text}`}>
                    {stage.shortLabel}
                  </span>
                  <span className={`badge border ${p.badge}`}>{p.label}</span>
                  <span className={`badge border ${t.badge}`}>{t.shortLabel}</span>
                  <span className="ml-auto text-sm font-extrabold tabular-nums text-content-primary">
                    {hasNoEstimate(d) ? (
                      <span className="text-xs font-semibold text-content-muted">
                        Belum diestimasi
                      </span>
                    ) : (
                      formatIDR(sellingPrice(d))
                    )}
                  </span>
                </div>

                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-content-muted">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" />
                    Target {formatDateShort(d.targetCloseDate)}
                  </span>
                  {hasContact && <span>· {hasContact}</span>}
                  <span>· {d.documents.length} dokumen</span>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
