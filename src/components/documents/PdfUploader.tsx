"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import type { Deal, DealDocument, DocCategory } from "@/lib/types";
import { DOC_CATEGORY_META } from "@/lib/stages";
import { uid } from "@/lib/format";
import { MAX_PDF_BYTES, fileSizeLabel, uploadPdf } from "@/lib/storage";
import Modal from "@/components/ui/Modal";
import { useUI } from "@/state/UIContext";

const CATEGORY_ORDER: DocCategory[] = [
  "quotation",
  "spek_teknis",
  "bast",
  "kontrak_spk",
];

interface PdfUploaderProps {
  open: boolean;
  onClose: () => void;
  /** Deals selectable as upload target (single-deal contexts pass [deal]). */
  deals: Pick<Deal, "id" | "title" | "company">[];
  defaultDealId?: string;
  /** Called after a successful storage upload — caller dispatches ADD_DOCUMENT. */
  onUploaded: (dealId: string, doc: DealDocument) => void;
}

export default function PdfUploader({
  open,
  onClose,
  deals,
  defaultDealId,
  onUploaded,
}: PdfUploaderProps) {
  const { showToast } = useUI();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocCategory>("quotation");
  const [dealId, setDealId] = useState(defaultDealId ?? deals[0]?.id ?? "");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  // Fresh form each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setFile(null);
    setName("");
    setCategory("quotation");
    setDealId(defaultDealId ?? deals[0]?.id ?? "");
    setDragOver(false);
    setBusy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pickFile = (f: File | null | undefined) => {
    if (!f) return;
    setFile(f);
    if (!name.trim()) setName(f.name.replace(/\.pdf$/i, ""));
  };

  const submit = async () => {
    if (!file || busy) return;
    if (!dealId) {
      showToast("Pilih deal tujuan terlebih dahulu.");
      return;
    }
    setBusy(true);
    const docId = uid("doc");
    const res = await uploadPdf(dealId, docId, file);
    if ("error" in res) {
      setBusy(false);
      showToast(res.error);
      return;
    }
    const doc: DealDocument = {
      id: docId,
      name: name.trim() || file.name,
      category,
      url: res.url,
      source: "upload",
      sizeLabel: fileSizeLabel(file.size),
      storagePath: res.path,
      uploadedAt: new Date().toISOString(),
    };
    onUploaded(dealId, doc);
    showToast("PDF berhasil diupload.");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload PDF"
      subtitle={`PDF only · maks ${fileSizeLabel(MAX_PDF_BYTES)}`}
      size="md"
      footer={
        <>
          <button onClick={onClose} className="btn-ghost">
            Batal
          </button>
          <button
            onClick={submit}
            disabled={!file || busy}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
            {busy ? "Mengupload…" : "Upload"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {deals.length > 1 && (
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-content-muted">
              Deal tujuan
            </label>
            <select
              className="field-input"
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
            >
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.company} — {d.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-content-muted">
            Kategori
          </label>
          <select
            className="field-input"
            value={category}
            onChange={(e) => setCategory(e.target.value as DocCategory)}
          >
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {DOC_CATEGORY_META[c]?.label ?? c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-content-muted">
            Nama dokumen
          </label>
          <input
            className="field-input"
            placeholder="Nama dokumen"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFile(e.dataTransfer.files?.[0]);
          }}
          className={
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-6 text-center text-xs transition-colors " +
            (dragOver
              ? "border-accent bg-accent-soft text-accent"
              : "border-line-muted text-content-secondary hover:border-accent/50 hover:text-accent")
          }
        >
          <FileUp className="h-5 w-5" />
          {file ? (
            <span className="font-semibold text-content-primary">
              {file.name} ({fileSizeLabel(file.size)})
            </span>
          ) : (
            <span>Pilih atau seret file PDF</span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>
    </Modal>
  );
}
