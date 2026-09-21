"use client";

import { Plus, BellRing, CheckCircle2, Circle } from "lucide-react";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { tasksDueToday } from "@/lib/analytics";
import { formatTime } from "@/lib/format";

export default function DailyActionBanner() {
  const { tasks, dealById, dispatch } = useCloser();
  const { openAddDeal, openDeal, showToast } = useUI();

  const todays = tasksDueToday(tasks).sort((a, b) =>
    a.dueAt.localeCompare(b.dueAt)
  );

  return (
    <section className="glass-panel p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <BellRing className="h-5 w-5 shrink-0 text-success" />
            <h3 className="min-w-0 text-base font-bold text-content-primary md:text-lg">
              Agenda Hari Ini
            </h3>
            <span className="badge border border-success/30 bg-success-soft text-success">
              {todays.length} task
            </span>
          </div>

          <ul className="mt-3 space-y-1.5">
            {todays.length === 0 && (
              <li className="text-sm text-content-secondary">
                Tidak ada follow-up terjadwal hari ini.
              </li>
            )}
            {todays.map((t) => {
              const deal = dealById(t.dealId);
              return (
                <li key={t.id}>
                  <button
                    onClick={() => dispatch({ type: "TOGGLE_TASK", id: t.id })}
                    className="group flex min-h-[44px] w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-ink-overlay"
                  >
                    {t.done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-content-muted group-hover:text-accent" />
                    )}
                    <span
                      className={
                        "min-w-0 flex-1 text-sm leading-snug " +
                        (t.done
                          ? "text-content-muted line-through"
                          : "text-content-primary")
                      }
                    >
                      {t.title}
                      {deal && (
                        <span className="ml-2 text-xs text-content-muted">
                          · {deal.company}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-warn">
                      {formatTime(t.dueAt)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

        </div>

        {/* Primary CTA */}
        {/* Mobile: CTAs stretch full width; sm+ inline; lg stacks in the rail */}
        <div className="flex flex-col gap-2 sm:flex-row lg:w-52 lg:shrink-0 lg:flex-col">
          <button
            onClick={openAddDeal}
            className="btn-primary min-h-[44px] whitespace-nowrap px-5 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" strokeWidth={2.6} />
            Deal Baru
          </button>
          <button
            onClick={() => {
              const pending = tasksDueToday(tasks)[0];
              if (pending) openDeal(pending.dealId);
              else showToast("Tidak ada agenda tersisa.");
            }}
            className="btn-secondary min-h-[44px] whitespace-nowrap"
          >
            Buka Deal Terkait
          </button>
        </div>
      </div>
    </section>
  );
}
