"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FileUp,
  FolderOpen,
  Search,
} from "lucide-react";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { DOC_CATEGORY_META } from "@/lib/stages";
import { formatDateShort } from "@/lib/format";
import type { DealDocument, DocCategory } from "@/lib/types";
import PdfUploader from "@/components/documents/PdfUploader";
import PdfPreviewModal from "@/components/documents/PdfPreviewModal";

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
  const { deals, dispatch } = useCloser();
  const { openDeal } = useUI();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<DocCategory | "all">("all");
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(
    null
  );

  const isViewable = (d: DealDocument) =>
    d.url !== "#" && /^https?:\/\//i.test(d.url);

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-content-primary">
            Document Hub
          </h2>
          <p className="text-sm text-content-secondary">
            {allDocs.length} dokumen · quotation, spek teknis, BAST &amp; SPK
          </p>
        </div>
        <button
          onClick={() => setUploaderOpen(true)}
          disabled={deals.length === 0}
          className="btn-primary inline-flex items-center gap-2 px-3 py-1.5 text-xs disabled:opacity-50"
          title={
            deals.length === 0 ? "Buat deal terlebih dahulu." : "Upload PDF"
          }
        >
          <FileUp className="h-3.5 w-3.5" /> Upload PDF
        </button>
      </div>

      <PdfUploader
        open={uploaderOpen}
        onClose={() => setUploaderOpen(false)}
        deals={deals}
        onUploaded={(dealId, doc) =>
          dispatch({ type: "ADD_DOCUMENT", dealId, doc })
        }
      />
      <PdfPreviewModal doc={preview} onClose={() => setPreview(null)} />

      {/* search + category filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <input
            className="field-input pl-9"
            placeholder="Cari dokumen…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="relative shrink-0">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value as DocCategory | "all")}
            aria-label="Filter kategori"
            className={
              "w-full appearance-none rounded-lg border py-2 pl-3 pr-8 text-xs font-semibold transition-colors focus:outline-none sm:w-auto " +
              (cat === "all"
                ? "border-line bg-ink-surface text-content-secondary hover:border-line-muted"
                : "border-accent/50 bg-accent-soft text-accent")
            }
          >
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {(c === "all" ? "Semua Kategori" : DOC_CATEGORY_META[c]?.label ?? c) +
                  ` (${countOf(c)})`}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-muted" />
        </div>
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center gap-2 py-16 text-center text-content-muted">
          <FolderOpen className="h-8 w-8" />
          <p className="text-sm">
            {allDocs.length === 0
              ? "Belum ada dokumen."
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
                className="glass-card flex items-center gap-3 p-3"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${meta?.badge}`}
                >
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    disabled={!isViewable(d)}
                    onClick={() => setPreview({ name: d.name, url: d.url })}
                    className="block w-full truncate text-left text-sm font-semibold text-content-primary enabled:hover:text-accent disabled:cursor-default"
                    title={isViewable(d) ? "Pratinjau dokumen" : undefined}
                  >
                    {d.name}
                  </button>
                  <div className="flex items-center gap-2 text-[11px] text-content-muted">
                    <button
                      onClick={() => openDeal(d.dealId)}
                      className="font-medium text-accent hover:underline"
                    >
                      {d.company}
                    </button>
                    <span>·</span>
                    <span className="truncate">{d.dealTitle}</span>
                    <span>·</span>
                    <span>{formatDateShort(d.uploadedAt)}</span>
                  </div>
                </div>
                <span className={`badge hidden border sm:inline-flex ${meta?.badge}`}>
                  {meta?.label}
                </span>
                {isViewable(d) && (
                  <div className="flex shrink-0 gap-1">
                    {d.source === "upload" ? (
                      <button
                        onClick={() => setPreview({ name: d.name, url: d.url })}
                        className="rounded-lg p-2 text-content-secondary transition-colors hover:bg-ink-overlay hover:text-content-primary"
                        title="Pratinjau PDF"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    ) : (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-2 text-content-secondary transition-colors hover:bg-ink-overlay hover:text-content-primary"
                        title="Buka tautan"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <a
                      href={d.url}
                      download
                      className="rounded-lg p-2 text-content-secondary transition-colors hover:bg-ink-overlay hover:text-content-primary"
                      title="Unduh"
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
