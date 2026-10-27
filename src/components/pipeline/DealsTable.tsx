"use client";

import { useMemo, useState } from "react";
import { Paperclip, ChevronRight, Link2 } from "lucide-react";
import { useUI } from "@/state/UIContext";
import { DEAL_TYPE_META, STAGE_ACCENT, PRIORITY_META, stageById } from "@/lib/stages";
import type { Deal, StageId } from "@/lib/types";
import {
  formatIDR,
  formatDateShort,
  hasNoEstimate,
  isSameDay,
  sellingPrice,
  startOfDay,
} from "@/lib/format";

interface DealsTableProps {
  deals: Deal[];
}

export default function DealsTable({ deals }: DealsTableProps) {
  const { openDeal } = useUI();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return deals.filter(
      (d) =>
        !q ||
        d.company.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.contact.name.toLowerCase().includes(q)
    );
  }, [deals, query]);

  // Compare by calendar day so a deal targeting *today* isn't flagged overdue.
  const today = startOfDay(new Date());

  return (
    <div className="space-y-3">
      {/* search only — stage/type filtering lives in the pipeline toolbar */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari perusahaan, deal, atau kontak…"
        className="field-input w-full max-w-sm"
      />

      {/* Mobile: compact cards (priority columns first). sm+: full table. */}
      <div className="space-y-2 sm:hidden">
        {filtered.length === 0 && (
          <p className="rounded-xl border border-dashed border-line py-8 text-center text-sm text-content-muted">
            Tidak ada deal yang cocok.
          </p>
        )}
        {filtered.map((d) => {
          const a = STAGE_ACCENT[stageAccentOf(d.stage)];
          const p = PRIORITY_META[d.priority];
          const t = DEAL_TYPE_META[d.dealType];
          const past =
            startOfDay(new Date(d.targetCloseDate)).getTime() < today.getTime();
          return (
            <button
              key={d.id}
              onClick={() => openDeal(d.id)}
              className="glass-card glass-card-hover block w-full p-3.5 text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 text-sm font-bold leading-snug text-content-primary">
                  {d.title}
                </p>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-content-muted" />
              </div>
              <p className="mt-0.5 truncate text-xs text-content-muted">{d.company}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span className={`badge border ${a.border} ${a.bg} ${a.text}`}>
                  {stageLabelOf(d.stage)}
                </span>
                <span className={`badge border ${p.badge}`}>{p.label}</span>
                <span className={`badge border ${t.badge}`}>{t.shortLabel}</span>
                {d.landingPageUrl && (
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-accent" aria-label="Punya landing page" />
                )}
                <span className="ml-auto text-sm font-extrabold tabular-nums text-content-primary">
                  {hasNoEstimate(d) ? (
                    <span className="text-xs font-semibold text-content-muted">Belum diestimasi</span>
                  ) : (
                    formatIDR(sellingPrice(d))
                  )}
                </span>
              </div>
              <p
                className={
                  "mt-2 text-[11px] font-semibold " +
                  (past ? "text-danger" : "text-content-secondary")
                }
              >
                Target {formatDateShort(d.targetCloseDate)}
                {past && " · lewat"}
              </p>
            </button>
          );
        })}
      </div>

      {/* table */}
      <div className="thin-scrollbar hidden overflow-x-auto rounded-xl border border-line bg-white sm:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-[11px] uppercase tracking-wide text-content-muted">
              <th className="px-4 py-3 font-semibold">Deal</th>
              <th className="px-4 py-3 font-semibold">Nilai</th>
              <th className="px-4 py-3 font-semibold">Stage</th>
              <th className="px-4 py-3 font-semibold">Prioritas</th>
              <th className="px-4 py-3 font-semibold">Target</th>
              <th className="px-4 py-3 font-semibold">Kontak</th>
              <th className="px-4 py-3 font-semibold text-right">Docs</th>
              <th className="px-2 py-3" aria-label="Buka detail" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-content-muted">
                  Tidak ada deal yang cocok.
                </td>
              </tr>
            )}
            {filtered.map((d) => {
              const a = STAGE_ACCENT[stageAccentOf(d.stage)];
              const p = PRIORITY_META[d.priority];
              const closing = isSameDay(
                new Date(d.targetCloseDate),
                today
              );
              const past =
                startOfDay(new Date(d.targetCloseDate)).getTime() < today.getTime();
              return (
                <tr
                  key={d.id}
                  onClick={() => openDeal(d.id)}
                  className="cursor-pointer transition-colors hover:bg-ink-overlay"
                >
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-1.5 font-semibold text-content-primary">
                      <span className="min-w-0 truncate">{d.title}</span>
                      <span className={`badge border shrink-0 ${DEAL_TYPE_META[d.dealType].badge}`}>
                        {DEAL_TYPE_META[d.dealType].shortLabel}
                      </span>
                      {d.landingPageUrl && (
                        <Link2 className="h-3.5 w-3.5 shrink-0 text-accent" aria-label="Punya landing page" />
                      )}
                    </p>
                    <p className="text-xs text-content-muted">{d.company}</p>
                  </td>
                  <td className="px-4 py-3 font-bold tabular-nums whitespace-nowrap text-success">
                    {hasNoEstimate(d) ? (
                      <span className="text-xs font-semibold text-content-muted">— belum</span>
                    ) : (
                      formatIDR(sellingPrice(d))
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge border ${a.border} ${a.bg} ${a.text}`}>
                      {stageLabelOf(d.stage)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge border ${p.badge}`}>{p.label}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={
                        "text-xs font-semibold " +
                        (past
                          ? "text-danger"
                          : closing
                          ? "text-warn"
                          : "text-content-secondary")
                      }
                    >
                      {formatDateShort(d.targetCloseDate)}
                      {past && " · lewat"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-content-secondary">
                    <p>{d.contact.name}</p>
                    <p className="text-content-muted">{d.contact.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
                      <Paperclip className="h-3.5 w-3.5" />
                      {d.documents.length}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <ChevronRight className="h-4 w-4 text-content-muted" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function stageLabelOf(id: StageId): string {
  return stageById(id).shortLabel;
}
function stageAccentOf(id: StageId) {
  return stageById(id).accent;
}
