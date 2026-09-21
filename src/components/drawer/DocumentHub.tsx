"use client";

import { useState } from "react";
import {
  Plus,
  Link2,
  UploadCloud,
  ExternalLink,
  Eye,
  Trash2,
  FileText,
  Download,
} from "lucide-react";
import type { Deal, DealDocument, DocCategory } from "@/lib/types";
import { DOC_CATEGORY_META } from "@/lib/stages";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { uid, formatDateShort } from "@/lib/format";
import PdfUploader from "@/components/documents/PdfUploader";
import PdfPreviewModal from "@/components/documents/PdfPreviewModal";

const CATEGORY_ORDER: DocCategory[] = [
  "quotation",
  "spek_teknis",
  "bast",
  "kontrak_spk",
];

export default function DocumentHub({ deal }: { deal: Deal }) {
  const { dispatch } = useCloser();
  const { showToast } = useUI();

  const [openForm, setOpenForm] = useState<"link" | null>(null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocCategory>("quotation");
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(
    null
  );

  const reset = () => {
    setUrl("");
    setName("");
    setOpenForm(null);
  };

  const addDoc = () => {
    const docName = name.trim();
    if (!docName || !url.trim()) {
      showToast("Isi nama dan tautan cloud terlebih dahulu.");
      return;
    }
    const resolvedSource: DealDocument["source"] = /dropbox\.com/i.test(url)
      ? "dropbox"
      : "drive";
    const doc: DealDocument = {
      id: uid("doc"),
      name: docName,
      category,
      url: url.trim(),
      source: resolvedSource,
      uploadedAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_DOCUMENT", dealId: deal.id, doc });
    showToast("Dokumen ditambahkan.");
    reset();
  };

  const isViewable = (d: DealDocument) =>
    d.url !== "#" && /^https?:\/\//i.test(d.url);

  const removeDoc = (d: DealDocument) => {
    // Storage-object cleanup is handled by REMOVE_DOCUMENT in CloserContext.
    dispatch({ type: "REMOVE_DOCUMENT", dealId: deal.id, docId: d.id });
  };

  const metaIcon = (cat: string) => {
    const c = DOC_CATEGORY_META[cat];
    return c?.badge ?? "border-line bg-ink-overlay text-content-secondary";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-content-muted">
          {deal.documents.length} dokumen terikat
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={() => setOpenForm(openForm === "link" ? null : "link")}
            className="btn-secondary px-2.5 py-1.5 text-xs"
          >
            <Link2 className="h-3.5 w-3.5" /> Tautan
          </button>
          <button
            onClick={() => setUploaderOpen(true)}
            className="btn-secondary px-2.5 py-1.5 text-xs"
          >
            <UploadCloud className="h-3.5 w-3.5" /> Upload PDF
          </button>
        </div>
      </div>

      <PdfUploader
        open={uploaderOpen}
        onClose={() => setUploaderOpen(false)}
        deals={[deal]}
        defaultDealId={deal.id}
        onUploaded={(dealId, doc) =>
          dispatch({ type: "ADD_DOCUMENT", dealId, doc })
        }
      />
      <PdfPreviewModal doc={preview} onClose={() => setPreview(null)} />

      {/* add form */}
      {openForm && (
        <div className="glass-card space-y-3 border-accent/20 p-3 animate-fade-in">
          <div className="grid gap-2">
            <input
              className="field-input"
              placeholder="Nama dokumen"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="field-input"
              placeholder="https://drive.google.com/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <select
              className="field-input"
              value={category}
              onChange={(e) => setCategory(e.target.value as DocCategory)}
            >
              <option value="quotation">Quotation</option>
              <option value="spek_teknis">Spesifikasi Teknis</option>
              <option value="bast">BAST</option>
              <option value="kontrak_spk">Kontrak / SPK</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={reset} className="btn-ghost">
              Batal
            </button>
            <button onClick={addDoc} className="btn-primary px-3 py-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Tambah
            </button>
          </div>
        </div>
      )}

      {/* categorized list */}
      {CATEGORY_ORDER.map((cat) => {
        const group = deal.documents.filter((d) => d.category === cat);
        const meta = DOC_CATEGORY_META[cat];
        if (group.length === 0) return null;
        return (
          <div key={cat} className="space-y-1.5">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-content-muted">
              <span className={`h-1.5 w-1.5 rounded-full ${meta.badge.split(" ").find((c) => c.startsWith("bg-"))}`} />
              {meta.label}
              <span className="text-content-muted">({group.length})</span>
            </p>
            {group.map((d) => (
              <div
                key={d.id}
                className="glass-card flex min-w-0 items-center gap-3 p-2.5 text-sm"
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${metaIcon(d.category)}`}>
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    disabled={!isViewable(d)}
                    onClick={() => setPreview({ name: d.name, url: d.url })}
                    className="block w-full break-words text-left text-xs font-semibold leading-snug text-content-primary enabled:hover:text-accent disabled:cursor-default"
                    title={isViewable(d) ? "Pratinjau PDF" : undefined}
                  >
                    {d.name}
                  </button>
                  <p className="text-[10px] text-content-muted">
                    {d.source === "drive"
                      ? "Google Drive"
                      : d.source === "dropbox"
                      ? "Dropbox"
                      : d.sizeLabel ?? "Upload"}
                    {d.uploadedAt && ` · ${formatDateShort(d.uploadedAt)}`}
                  </p>
                </div>
                {/* 44px tap targets via grid cells; icons stay compact */}
                <div className="grid shrink-0 grid-flow-col grid-cols-[repeat(auto-max,minmax(0,44px))] items-center justify-end">
                  {isViewable(d) && (
                    <>
                      {d.source === "upload" ? (
                        <button
                          onClick={() => setPreview({ name: d.name, url: d.url })}
                          className="grid h-11 w-11 place-items-center rounded-lg text-content-secondary transition-colors hover:bg-ink-overlay hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                          title="Pratinjau PDF"
                          aria-label="Pratinjau PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      ) : (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="grid h-11 w-11 place-items-center rounded-lg text-content-secondary transition-colors hover:bg-ink-overlay hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                          title="Buka tautan"
                          aria-label="Buka tautan dokumen"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <a
                        href={d.url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="grid h-11 w-11 place-items-center rounded-lg text-content-secondary transition-colors hover:bg-ink-overlay hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
                        title="Unduh"
                        aria-label="Unduh dokumen"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => removeDoc(d)}
                    className="grid h-11 w-11 place-items-center rounded-lg text-content-secondary transition-colors hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
                    title="Hapus"
                    aria-label="Hapus dokumen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {deal.documents.length === 0 && (
        <div className="grid place-items-center rounded-xl border border-dashed border-line py-8 text-center text-xs text-content-muted">
          Belum ada dokumen.
        </div>
      )}
    </div>
  );
}
