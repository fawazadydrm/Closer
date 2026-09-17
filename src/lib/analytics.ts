import type { Deal, TaskReminder } from "./types";
import { ACTIVE_STAGES, WON_STAGES, LOST_STAGES } from "./stages";
import { hasNoEstimate, isSameDay, sellingPrice } from "./format";

/** Total harga jual efektif deal yang masih aktif (COGS×margin atau manual). */
export function activePipelineValue(deals: Deal[]): number {
  return deals
    .filter((d) => ACTIVE_STAGES.includes(d.stage))
    .reduce((sum, d) => sum + sellingPrice(d), 0);
}

/** Oppty yang belum punya angka sama sekali (menunggu harga distributor). */
export function dealsWithoutBudget(deals: Deal[]): Deal[] {
  return deals.filter((d) => hasNoEstimate(d));
}

/** Deals currently sitting at Proposal / Quotation Sent. */
export function outstandingProposals(deals: Deal[]): Deal[] {
  return deals.filter((d) => d.stage === "proposal_sent");
}

/** Tasks that are due today and still pending. */
export function tasksDueToday(tasks: TaskReminder[]): TaskReminder[] {
  const now = new Date();
  return tasks.filter((t) => !t.done && isSameDay(new Date(t.dueAt), now));
}

/** Win rate: closed_won / (closed_won + closed_lost) as a percentage. */
export function winRate(deals: Deal[]): number {
  const won = deals.filter((d) => WON_STAGES.includes(d.stage)).length;
  const lost = deals.filter((d) => LOST_STAGES.includes(d.stage)).length;
  const closed = won + lost;
  if (closed === 0) return 0;
  return Math.round((won / closed) * 100);
}

/** Value-weighted forecast: active deals weighted by stage probability. */
const STAGE_WEIGHT: Record<string, number> = {
  prospecting: 0.15,
  solution_design: 0.35,
  proposal_sent: 0.55,
  negotiation: 0.75,
};

export function weightedForecast(deals: Deal[]): number {
  return deals.reduce((sum, d) => {
    const w = STAGE_WEIGHT[d.stage];
    if (!w) return sum;
    const v = sellingPrice(d);
    return v > 0 ? sum + v * w : sum; // oppty tanpa budget tidak ikut memengaruhi
  }, 0);
}

export interface StageSummary {
  stage: string;
  count: number;
  value: number;
}

export function stageBreakdown(deals: Deal[]): StageSummary[] {
  const map = new Map<string, StageSummary>();
  for (const d of deals) {
    const entry = map.get(d.stage) ?? { stage: d.stage, count: 0, value: 0 };
    entry.count += 1;
    entry.value += sellingPrice(d);
    map.set(d.stage, entry);
  }
  return [...map.values()];
}
