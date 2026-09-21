"use client";

import { useState } from "react";
import { Plus, Trash2, CalendarClock } from "lucide-react";
import type { Deal } from "@/lib/types";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { uid, formatDateTime, taskStatus, TASK_STATUS_META } from "@/lib/format";
import ReminderButton from "@/components/ui/ReminderButton";

export default function DealTasksPanel({ deal }: { deal: Deal }) {
  const { tasks, dispatch } = useCloser();
  const { showToast } = useUI();
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  const list = tasks
    .filter((t) => t.dealId === deal.id)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  const add = () => {
    if (!title.trim() || !dueAt) {
      showToast("Isi judul & waktu tugas.");
      return;
    }
    dispatch({
      type: "ADD_TASK",
      task: {
        id: uid("task"),
        dealId: deal.id,
        title: title.trim(),
        dueAt: new Date(dueAt).toISOString(),
        done: false,
        channel: "telegram",
      },
    });
    setTitle("");
    setDueAt("");
    showToast("Tugas dijadwalkan.");
  };

  return (
    <div className="space-y-3">
      <div className="glass-card space-y-2 p-3">
        <input
          className="field-input"
          placeholder="Judul follow-up"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <input
            type="datetime-local"
            className="field-input flex-1"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
          <button onClick={add} className="btn-primary px-3 text-xs">
            <Plus className="h-4 w-4" /> Jadwalkan
          </button>
        </div>
      </div>

      {list.length === 0 && (
        <p className="py-4 text-center text-xs text-content-muted">
          Belum ada reminder untuk deal ini.
        </p>
      )}

      <ul className="space-y-2">
        {list.map((t) => {
          const status = taskStatus(t.dueAt, t.done);
          const meta = TASK_STATUS_META[status];
          return (
            <li key={t.id} className="glass-card p-3">
              <div className="flex items-start justify-between gap-2">
                <label className="flex min-h-[44px] min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => dispatch({ type: "TOGGLE_TASK", id: t.id })}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-success"
                  />
                  <span className="min-w-0">
                    <span
                      className={
                        "block text-sm font-medium " +
                        (t.done ? "text-content-muted line-through" : "text-content-primary")
                      }
                    >
                      {t.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-content-muted">
                      <CalendarClock className="h-3 w-3" />
                      {formatDateTime(t.dueAt)}
                    </span>
                  </span>
                </label>
                <button
                  onClick={() => dispatch({ type: "DELETE_TASK", id: t.id })}
                  aria-label="Hapus tugas"
                  className="-m-1.5 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-content-muted transition-colors hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span
                  className={`badge border ${meta.badge} ${
                    meta.pulse ? "animate-pulse-ring" : ""
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
                {!t.done && (
                  <ReminderButton
                    label="Telegram"
                    taskId={t.id}
                    dealId={deal.id}
                    title={t.title}
                    company={deal.company}
                    dueAt={t.dueAt}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
