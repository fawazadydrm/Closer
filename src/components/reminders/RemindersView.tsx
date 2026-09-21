"use client";

import { useMemo } from "react";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import ReminderButton from "@/components/ui/ReminderButton";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { formatDateTime, taskStatus, TASK_STATUS_META } from "@/lib/format";

export default function RemindersView() {
  const { tasks, dealById, dispatch } = useCloser();
  const { openDeal } = useUI();

  // Pending first (by due date), completed last.
  const sorted = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return a.dueAt.localeCompare(b.dueAt);
      }),
    [tasks]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <h2 className="text-xl font-extrabold tracking-tight text-content-primary md:text-2xl">
          Reminder
        </h2>
        <p className="text-xs text-content-muted tabular-nums">
          {sorted.filter((t) => !t.done).length} aktif ·{" "}
          {sorted.filter((t) => t.done).length} selesai
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="glass-panel py-12 text-center text-sm text-content-muted">
          Belum ada reminder.
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((t) => {
            const deal = dealById(t.dealId);
            const meta = TASK_STATUS_META[taskStatus(t.dueAt, t.done)];
            return (
              <li key={t.id} className="glass-card p-3.5">
                <div className="flex min-w-0 items-start gap-3">
                  <button
                    onClick={() =>
                      dispatch({ type: "TOGGLE_TASK", id: t.id })
                    }
                    className="mt-0.5 shrink-0 rounded-md p-0.5 text-content-secondary transition-colors hover:text-success"
                    aria-label={t.done ? "Tandai belum selesai" : "Tandai selesai"}
                  >
                    {t.done ? (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    ) : (
                      <span className="block h-5 w-5 rounded-full border-2 border-line-muted" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        "text-sm font-semibold leading-snug " +
                        (t.done
                          ? "text-content-muted line-through"
                          : "text-content-primary")
                      }
                    >
                      {t.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-content-muted">
                      {deal && (
                        <button
                          onClick={() => openDeal(deal.id)}
                          className="font-medium text-accent hover:underline"
                        >
                          {deal.company}
                        </button>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {formatDateTime(t.dueAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`badge border ${meta.badge} ${
                        meta.pulse ? "animate-pulse-ring" : ""
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    {!t.done && deal && (
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
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
