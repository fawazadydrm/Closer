"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  CalendarClock,
  CheckCheck,
  Filter,
  Inbox,
  Loader2,
  Send,
} from "lucide-react";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { sendTelegramReminder } from "@/lib/telegram";
import {
  formatDateTime,
  taskStatus,
  TASK_STATUS_META,
  type TaskStatus,
} from "@/lib/format";
import type { TaskReminder } from "@/lib/types";

const GROUPS: { key: TaskStatus; title: string; hint: string }[] = [
  { key: "overdue", title: "Terlambat", hint: "Perlu tindakan segera" },
  { key: "due_today", title: "Hari Ini", hint: "Jatuh tempo hari ini" },
  { key: "upcoming", title: "Mendatang", hint: "Sudah terjadwal" },
  { key: "done", title: "Selesai", hint: "Tugas yang sudah beres" },
];

export default function RemindersView() {
  const { tasks, deals, dispatch } = useCloser();
  const { openDeal, showToast } = useUI();
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [sendingId, setSendingId] = useState<string | null>(null);

  const companyOf = (dealId: string) =>
    deals.find((d) => d.id === dealId)?.company;

  const grouped = useMemo(() => {
    const base = [...tasks].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    const map: Record<TaskStatus, TaskReminder[]> = {
      overdue: [],
      due_today: [],
      upcoming: [],
      done: [],
    };
    base.forEach((t) => map[taskStatus(t.dueAt, t.done)].push(t));
    return map;
  }, [tasks]);

  const totalOpen = tasks.filter((t) => !t.done).length;

  const fire = async (t: TaskReminder) => {
    if (sendingId) return;
    setSendingId(t.id);
    const res = await sendTelegramReminder({
      taskId: t.id,
      dealId: t.dealId,
      title: t.title,
      company: companyOf(t.dealId),
      dueAt: t.dueAt,
    });
    showToast(res.message);
    setSendingId(null);
  };

  const fireDigest = async () => {
    if (sendingId) return;
    setSendingId("__digest__");
    const open = tasks.filter((t) => !t.done).length;
    const overdue = grouped.overdue.length;
    const res = await sendTelegramReminder({
      title: `Follow-up hari ini: ${open} tugas aktif${
        overdue ? `, ${overdue} terlambat` : ""
      }`,
      dueAt: new Date().toISOString(),
    });
    showToast(res.message);
    setSendingId(null);
  };

  const visible = filter === "all" ? tasks : grouped[filter];

  return (
    <div className="space-y-4">
      {/* header + controls */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-content-primary md:text-2xl">
            Follow-Up Reminders
          </h2>
          <p className="text-sm text-content-secondary">
            {totalOpen} tugas aktif · sinkronkan follow-up ke Telegram
          </p>
        </div>

        <button
          onClick={fireDigest}
          disabled={!!sendingId}
          className="btn-primary min-h-[40px] flex-1 sm:flex-none"
          title="Kirim ringkasan follow-up ke Telegram"
        >
          {sendingId === "__digest__" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" strokeWidth={2.4} />
          )}
          Kirim Ringkasan
        </button>
      </div>

      {/* filter chips */}
      {/* Filter chips scroll horizontally on phones instead of stacking tall */}
      <div className="thin-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 landscape:pb-0">
        <Filter className="h-4 w-4 shrink-0 text-content-muted" />
        <Chip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`Semua (${tasks.length})`}
        />
        {GROUPS.map((g) => (
          <Chip
            key={g.key}
            active={filter === g.key}
            onClick={() => setFilter(g.key)}
            label={`${g.title} (${grouped[g.key].length})`}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center gap-2 py-16 text-center text-content-muted">
          <Inbox className="h-8 w-8" />
          <p className="text-sm">Belum ada tugas pada filter ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => {
            const status = taskStatus(t.dueAt, t.done);
            const meta = TASK_STATUS_META[status];
            const company = companyOf(t.dealId);
            return (
              <div
                key={t.id}
                className="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot} ${
                      meta.pulse ? "animate-pulse-ring" : ""
                    }`}
                  />
                  <div className="min-w-0">
                    <p
                      className={
                        "text-sm font-semibold " +
                        (t.done
                          ? "text-content-muted line-through"
                          : "text-content-primary")
                      }
                    >
                      {t.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-content-muted">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {formatDateTime(t.dueAt)}
                      </span>
                      {company && (
                        <button
                          onClick={() => openDeal(t.dealId)}
                          className="inline-flex items-center gap-1 text-accent hover:underline"
                        >
                          <span className="text-content-muted">·</span> {company}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions stretch full-width on mobile, inline on sm+ */}
                <div className="flex items-center gap-2 sm:shrink-0">
                  <span className={`badge border ${meta.badge} mr-auto sm:mr-0`}>
                    {meta.label}
                  </span>
                  <button
                    onClick={() => dispatch({ type: "TOGGLE_TASK", id: t.id })}
                    className={
                      t.done
                        ? "btn-ghost min-h-[40px] flex-1 text-success sm:flex-none"
                        : "btn-secondary min-h-[40px] flex-1 px-3 py-1.5 text-xs sm:flex-none"
                    }
                  >
                    <CheckCheck className="h-4 w-4" />
                    {t.done ? "Selesai" : "Tandai"}
                  </button>
                  {!t.done && (
                    <button
                      onClick={() => fire(t)}
                      disabled={sendingId === t.id}
                      className="btn-secondary min-h-[40px] flex-1 px-3 py-1.5 text-xs sm:flex-none"
                    >
                      {sendingId === t.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BellRing className="h-4 w-4" />
                      )}
                      Telegram
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "min-h-[36px] shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors " +
        (active
          ? "border-accent bg-accent-soft text-accent"
          : "border-line bg-ink-surface text-content-secondary hover:border-line-muted hover:text-content-primary")
      }
    >
      {label}
    </button>
  );
}
