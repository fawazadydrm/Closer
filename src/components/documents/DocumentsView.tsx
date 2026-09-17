"use client";

import { useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Search,
} from "lucide-react";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { DOC_CATEGORY_META } from "@/lib/stages";
import { formatDateShort } from "@/lib/format";
import type { DealDocument, DocCategory } from "@/lib/types";

interface FlatDoc extends DealDocument {
  dealId: string;
  dealTitle: string;
  company: string;
}

const CATEGORY_ORDER: (DocCategory | "all")[] = [
  "all",
  "quotation",
  "spek_teknis",
  "bast",
  "kontrak_spk",
];

export default function DocumentsView() {
  const { deals } = useCloser();
  const { openDeal } = useUI();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<DocCategory | "all">("all");

  const allDocs = useMemo<FlatDoc[]>(
    () =>
      deals.flatMap((d) =>
        d.documents.map((doc) => ({
          ...doc,
          dealId: d.id,
          dealTitle: d.title,
          company: d.company,
        }))
      ),
    [deals]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allDocs
      .filter((d) => (cat === "all" ? true : d.category === cat))
      .filter(
        (d) =>
          !q ||
          d.name.toLowerCase().includes(q) ||
          d.company.toLowerCase().includes(q) ||
          d.dealTitle.toLowerCase().includes(q)
      )
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }, [allDocs, cat, query]);

  const countOf = (c: DocCategory | "all") =>
    c === "all" ? allDocs.length : allDocs.filter((d) => d.category === c).length;

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold tracking-tight text-content-primary md:text-2xl">
          Document Hub
        </h2>
        <p className="text-sm text-content-secondary">
          {allDocs.length} dokumen di seluruh pipeline · quotation, spek teknis,
          BAST &amp; SPK
        </p>
      </div>

      {/* search + category chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <input
            className="field-input pl-9"
            placeholder="Cari dokumen, perusahaan, atau proyek…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {CATEGORY_ORDER.map((c) => {
            const active = cat === c;
            const label =
              c === "all" ? "Semua" : DOC_CATEGORY_META[c]?.label ?? c;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors " +
                  (active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line bg-ink-surface text-content-secondary hover:border-line-muted hover:text-content-primary")
                }
              >
                {label} ({countOf(c)})
              </button>
            );
          })}
        </div>
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center gap-2 py-16 text-center text-content-muted">
          <FolderOpen className="h-8 w-8" />
          <p className="text-sm">
            {allDocs.length === 0
              ? "Belum ada dokumen. Tambahkan lewat drawer deal."
              : "Tidak ada dokumen yang cocok dengan filter."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((d) => {
            const meta = DOC_CATEGORY_META[d.category];
            return (
              <li
                key={`${d.dealId}-${d.id}`}
                className="glass-card flex min-w-0 items-center gap-2 p-3 sm:gap-3"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${meta?.badge}`}
                >
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  {/* Long filenames wrap to two lines instead of truncating */}
                  <p className="line-clamp-2 break-words text-sm font-semibold leading-snug text-content-primary">
                    {d.name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-content-muted">
                    <button
                      onClick={() => openDeal(d.dealId)}
                      className="min-h-[32px] font-medium text-accent hover:underline"
                    >
                      {d.company}
                    </button>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden truncate sm:inline">{d.dealTitle}</span>
                    <span>·</span>
                    <span>{formatDateShort(d.uploadedAt)}</span>
                  </div>
                </div>
                <span
                  className={`badge shrink-0 border sm:inline-flex ${meta?.badge}`}
                >
                  {meta?.label}
                </span>
                {d.url !== "#" && (
                  <div className="grid shrink-0 grid-flow-col grid-cols-[repeat(auto-max,minmax(0,44px))] items-center">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      className="grid h-11 w-11 place-items-center rounded-lg text-content-secondary transition-colors hover:bg-ink-overlay hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                      title="Buka tautan"
                      aria-label="Buka tautan dokumen"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <a
                      href={d.url}
                      download
                      className="grid h-11 w-11 place-items-center rounded-lg text-content-secondary transition-colors hover:bg-ink-overlay hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                      title="Unduh"
                      aria-label="Unduh dokumen"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
