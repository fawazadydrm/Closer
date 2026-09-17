"use client";

import { useState } from "react";
import {
  Plus,
  Link2,
  UploadCloud,
  ExternalLink,
  Trash2,
  FileText,
  Download,
} from "lucide-react";
import type { Deal, DealDocument, DocCategory } from "@/lib/types";
import { DOC_CATEGORY_META } from "@/lib/stages";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { uid, formatDateShort } from "@/lib/format";

const CATEGORY_ORDER: DocCategory[] = [
  "quotation",
  "spek_teknis",
  "bast",
  "kontrak_spk",
];

export default function DocumentHub({ deal }: { deal: Deal }) {
  const { dispatch } = useCloser();
  const { showToast } = useUI();

  const [openForm, setOpenForm] = useState<"link" | "upload" | null>(null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocCategory>("quotation");
  const [fileName, setFileName] = useState("");

  const reset = () => {
    setUrl("");
    setName("");
    setFileName("");
    setOpenForm(null);
  };

  const addDoc = (src: DealDocument["source"]) => {
    let docName = name.trim();
    if (!docName && fileName.trim()) docName = fileName.trim();
    if (!docName || !src) return;
    if (src !== "upload" && !url.trim()) {
      showToast("Isi tautan cloud terlebih dahulu.");
      return;
    }
    const resolvedSource: DealDocument["source"] =
      src === "upload"
        ? "upload"
        : /dropbox\.com/i.test(url)
        ? "dropbox"
        : "drive";
    const doc: DealDocument = {
      id: uid("doc"),
      name: docName,
      category,
      url: src === "upload" ? "#" : url.trim(),
      source: resolvedSource,
      sizeLabel: src === "upload" ? "Menunggu upload (placeholder)" : undefined,
      uploadedAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_DOCUMENT", dealId: deal.id, doc });
    showToast("Dokumen ditambahkan.");
    reset();
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
            onClick={() => setOpenForm(openForm === "upload" ? null : "upload")}
            className="btn-secondary px-2.5 py-1.5 text-xs"
          >
            <UploadCloud className="h-3.5 w-3.5" /> Upload
          </button>
        </div>
      </div>

      {/* add form */}
      {openForm && (
        <div className="glass-card space-y-3 border-accent/20 p-3 animate-fade-in">
          <div className="grid gap-2">
            <input
              className="field-input"
              placeholder="Nama dokumen (mis. Quotation_v3.pdf)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {openForm === "upload" && (
              <div>
                <button
                  onClick={() => setFileName(fileName ? "" : "dummy_file.pdf")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-muted px-3 py-4 text-xs text-content-secondary hover:border-accent/50 hover:text-accent transition-colors"
                >
                  <UploadCloud className="h-4 w-4" />
                  {fileName || "Pilih file (Supabase Storage placeholder)"}
                </button>
              </div>
            )}
            {openForm === "link" && (
              <input
                className="field-input"
                placeholder="https://drive.google.com/…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            )}
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
            <button
              onClick={() => addDoc(openForm === "upload" ? "upload" : "drive")}
              className="btn-primary px-3 py-1.5 text-xs"
            >
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
                  <p className="break-words text-xs font-semibold leading-snug text-content-primary">
                    {d.name}
                  </p>
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
                  {d.url !== "#" && (
                    <>
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
                    onClick={() =>
                      dispatch({
                        type: "REMOVE_DOCUMENT",
                        dealId: deal.id,
                        docId: d.id,
                      })
                    }
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
          Belum ada dokumen. Tambahkan tautan cloud atau upload file.
        </div>
      )}
    </div>
  );
}
