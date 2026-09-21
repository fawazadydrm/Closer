"use client";

import { Download, ExternalLink } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface PdfPreviewModalProps {
  /** Null when closed. Only pass http(s) URLs (skip legacy "#" placeholders). */
  doc: { name: string; url: string } | null;
  onClose: () => void;
}

export default function PdfPreviewModal({ doc, onClose }: PdfPreviewModalProps) {
  return (
    <Modal
      open={doc !== null}
      onClose={onClose}
      title={doc?.name ?? ""}
      size="lg"
      footer={
        <>
          {doc && (
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" /> Buka tab baru
            </a>
          )}
          {doc && (
            <a
              href={doc.url}
              download
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" /> Unduh
            </a>
          )}
        </>
      }
    >
      {doc && (
        <iframe
          src={doc.url}
          title={doc.name}
          className="h-[60vh] w-full rounded-lg border border-line bg-ink-overlay sm:h-[70vh]"
        />
      )}
    </Modal>
  );
}
