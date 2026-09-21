"use client";

import { useRef, useState, type DragEvent } from "react";
import { FileUp, X } from "lucide-react";
import type { DealDocument, DocCategory } from "@/lib/types";
import { DOC_CATEGORY_META } from "@/lib/stages";
import { uid } from "@/lib/format";
import { MAX_PDF_BYTES, fileSizeLabel, uploadPdf } from "@/lib/storage";
import { useUI } from "@/state/UIContext";

const CATEGORY_ORDER: DocCategory[] = ["quotation", "spek_teknis", "bast", "kontrak_spk"];

interface StagedDoc {
  key: string;
  file: File;
  name: string;
  category: DocCategory;
}

interface PdfDropzoneProps {
  /** Staged files chosen by the user — parent renders them in a list. */
  onStagedChange: (docs: StagedDoc[]) => void;
  staged: StagedDoc[];
}

/**
 * Inline PDF picker for places where the deal doesn't exist yet
 * (e.g. Add Deal modal). Files are staged locally and uploaded by the
 * parent once the deal is saved, so cancelling never leaves orphan files.
 */
export default function PdfDropzone({ onStagedChange, staged }: PdfDropzoneProps) {
  const { showToast } = useUI();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<DocCategory>("quotation");
  const [dragOver, setDragOver] = useState(false);

  const pickFiles = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    const accepted: StagedDoc[] = [];
    for (const f of files) {
      if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
        showToast(`"${f.name}" dilewati — hanya PDF.`);
        continue;
      }
      if (f.size > MAX_PDF_BYTES) {
        showToast(`"${f.name}" dilewati — melebihi ${fileSizeLabel(MAX_PDF_BYTES)}.`);
        continue;
      }
      accepted.push({
        key: uid("st"),
        file: f,
        name: f.name.replace(/\.pdf$/i, ""),
        category,
      });
    }
    if (accepted.length > 0) onStagedChange([...staged, ...accepted]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeStaged = (key: string) =>
    onStagedChange(staged.filter((s) => s.key !== key));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="field-input w-auto flex-1 text-xs sm:flex-none"
          value={category}
          onChange={(e) => setCategory(e.target.value as DocCategory)}
          aria-label="Kategori dokumen"
        >
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {DOC_CATEGORY_META[c]?.label ?? c}
            </option>
          ))}
        </select>
        <span className="text-[10px] text-content-muted">
          Kategori berlaku untuk file yang dipilih berikutnya.
        </span>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e: DragEvent<HTMLButtonElement>) => {
          e.preventDefault();
          setDragOver(false);
          pickFiles(e.dataTransfer.files);
        }}
        className={
          "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-4 text-center text-xs transition-colors " +
          (dragOver
            ? "border-accent bg-accent-soft text-accent"
            : "border-line-muted text-content-secondary hover:border-accent/50 hover:text-accent")
        }
      >
        <FileUp className="h-5 w-5" />
        <span className="font-semibold">Seret atau pilih PDF</span>
        <span className="text-[10px] text-content-muted">
          PDF · maks {fileSizeLabel(MAX_PDF_BYTES)}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => pickFiles(e.target.files)}
      />

      {staged.length > 0 && (
        <ul className="space-y-1">
          {staged.map((s) => (
            <li
              key={s.key}
              className="flex items-center gap-2 rounded-lg border border-line bg-ink-surface px-2.5 py-1.5 text-xs"
            >
              <span className="min-w-0 flex-1 truncate font-medium text-content-primary">
                {s.name}
              </span>
              <span className="shrink-0 text-content-muted">
                {DOC_CATEGORY_META[s.category]?.label ?? s.category} ·{" "}
                {fileSizeLabel(s.file.size)}
              </span>
              <button
                type="button"
                onClick={() => removeStaged(s.key)}
                className="btn-ghost rounded-lg p-1 text-danger"
                aria-label={`Hapus ${s.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Upload all staged files for a freshly created deal. Returns finished docs. */
export async function uploadStagedPdfs(
  dealId: string,
  staged: StagedDoc[]
): Promise<{ docs: DealDocument[]; errors: string[] }> {
  const docs: DealDocument[] = [];
  const errors: string[] = [];
  for (const s of staged) {
    const docId = uid("doc");
    const res = await uploadPdf(dealId, docId, s.file);
    if ("error" in res) {
      errors.push(`${s.name}: ${res.error}`);
      continue;
    }
    docs.push({
      id: docId,
      name: s.name || s.file.name,
      category: s.category,
      url: res.url,
      source: "upload",
      sizeLabel: fileSizeLabel(s.file.size),
      storagePath: res.path,
      uploadedAt: new Date().toISOString(),
    });
  }
  return { docs, errors };
}

export type { StagedDoc };
