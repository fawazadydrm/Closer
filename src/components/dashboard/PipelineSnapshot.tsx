"use client";

import { BarChart3 } from "lucide-react";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { PIPELINE_STAGES, STAGE_ACCENT } from "@/lib/stages";
import { stageBreakdown, weightedForecast } from "@/lib/analytics";
import { formatIDRCompact } from "@/lib/format";

export default function PipelineSnapshot() {
  const { deals } = useCloser();
  const { navigate } = useUI();

  const breakdown = stageBreakdown(deals);
  const max = Math.max(1, ...breakdown.map((b) => b.value));
  const forecast = weightedForecast(deals);

  return (
    <section className="glass-panel p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <BarChart3 className="h-5 w-5 shrink-0 text-accent" />
          <h3 className="text-base font-bold text-content-primary md:text-lg">
            Pipeline Distribution
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wide text-content-muted">
            Weighted Forecast
          </p>
          <p className="text-base font-extrabold tabular-nums text-success sm:text-lg">
            {formatIDRCompact(forecast)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {PIPELINE_STAGES.map((stage) => {
          const b = breakdown.find((x) => x.stage === stage.id);
          const value = b?.value ?? 0;
          const count = b?.count ?? 0;
          const a = STAGE_ACCENT[stage.accent];
          const pct = Math.round((value / max) * 100);
          return (
            <button
              key={stage.id}
              onClick={() => navigate("pipeline")}
              className="group flex w-full min-w-0 items-center gap-2 py-1 text-left sm:gap-3"
            >
              {/* Label column flexes down instead of forcing a fixed 160px on phones */}
              <span className="flex w-24 shrink-0 items-center gap-2 sm:w-40 md:w-52">
                <span className={`h-2 w-2 shrink-0 rounded-full ${a.dot}`} />
                <span className="truncate text-[11px] font-medium text-content-secondary sm:text-xs md:text-sm">
                  {stage.shortLabel}
                </span>
              </span>
              <span className="relative h-7 min-w-0 flex-1 overflow-hidden rounded-md bg-ink-overlay">
                <span
                  className={`absolute inset-y-0 left-0 ${a.bg} ${a.border} border-r transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
                <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-bold text-content-primary">
                  {count > 0 && `${count} deal`}
                </span>
              </span>
              <span className="w-16 shrink-0 text-right text-[11px] font-bold tabular-nums text-content-primary sm:w-24 sm:text-xs">
                {value > 0 ? formatIDRCompact(value) : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
