"use client";

import { Target, FileSignature, Clock3, Trophy } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { useCloser } from "@/state/CloserContext";
import {
  activePipelineValue,
  dealsWithoutBudget,
  outstandingProposals,
  tasksDueToday,
  winRate,
} from "@/lib/analytics";
import { formatIDRCompact } from "@/lib/format";

export default function KpiGrid() {
  const { deals, tasks } = useCloser();

  const pipeline = activePipelineValue(deals);
  const proposals = outstandingProposals(deals).length;
  const dueToday = tasksDueToday(tasks).length;
  const rate = winRate(deals);
  const noBudget = dealsWithoutBudget(deals).length;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      <StatCard
        label="Active Pipeline"
        value={formatIDRCompact(pipeline)}
        sub={noBudget > 0 ? `${noBudget} oppty menunggu harga distributor` : "Total nilai peluang aktif"}
        icon={Target}
        accent="blue"
      />
      <StatCard
        label="Outstanding Proposal"
        value={String(proposals)}
        sub="Menunggu keputusan klien"
        icon={FileSignature}
        accent="amber"
      />
      <StatCard
        label="Tasks Due Today"
        value={String(dueToday)}
        sub="Follow-up wajib hari ini"
        icon={Clock3}
        accent="indigo"
      />
      <StatCard
        label="Win Rate"
        value={`${rate}%`}
        sub="Rasio deal closed won"
        icon={Trophy}
        accent="emerald"
      />
    </section>
  );
}
