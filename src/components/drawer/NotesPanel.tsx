"use client";

import { useState } from "react";
import { Send, StickyNote } from "lucide-react";
import type { Deal } from "@/lib/types";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { formatDateShort, uid } from "@/lib/format";

export default function NotesPanel({ deal }: { deal: Deal }) {
  const { dispatch } = useCloser();
  const { showToast } = useUI();
  const [text, setText] = useState("");

  const add = () => {
    if (!text.trim()) return;
    dispatch({ type: "ADD_NOTE", dealId: deal.id, text: text.trim(), noteId: uid("nt") });
    setText("");
    showToast("Catatan ditambahkan.");
  };

  return (
    <div className="space-y-3">
      <div className="glass-card p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add();
          }}
          rows={3}
          placeholder="Tulis catatan log meeting / negosiasi…"
          className="field-input resize-none"
        />
        <div className="mt-2 flex justify-end">
          <button onClick={add} className="btn-primary px-3 py-1.5 text-xs">
            <Send className="h-3.5 w-3.5" />
            Simpan Catatan
          </button>
        </div>
      </div>

      {deal.notes.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-line py-8 text-center text-xs text-content-muted">
          <StickyNote className="mb-2 h-5 w-5" />
          Belum ada catatan.
        </div>
      ) : (
        <ul className="space-y-2">
          {deal.notes.map((n) => (
            <li key={n.id} className="glass-card p-3">
              <p className="text-sm text-content-primary">{n.text}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-content-muted">
                {formatDateShort(n.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
