import type { DealType, PipelineStage, StageId } from "./types";

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "prospecting",
    label: "Prospecting / Lead Masuk",
    shortLabel: "Prospecting",
    accent: "blue",
  },
  {
    id: "solution_design",
    label: "Solution Design & Spek (BoQ)",
    shortLabel: "Solution Design",
    accent: "indigo",
  },
  {
    id: "proposal_sent",
    label: "Proposal / Quotation Sent",
    shortLabel: "Proposal Sent",
    accent: "amber",
  },
  {
    id: "negotiation",
    label: "Negotiation & E-Katalog Process",
    shortLabel: "Negotiation",
    accent: "violet",
  },
  {
    id: "closed_won",
    label: "Closed Won (SPK Issued)",
    shortLabel: "Closed Won",
    accent: "emerald",
  },
  {
    id: "closed_lost",
    label: "Closed Lost",
    shortLabel: "Closed Lost",
    accent: "rose",
  },
];

/** Stages counted as "active pipeline" (not yet lost, not yet won). */
export const ACTIVE_STAGES: StageId[] = [
  "prospecting",
  "solution_design",
  "proposal_sent",
  "negotiation",
];

/** Stages that represent a won deal (for win-rate calc). */
export const WON_STAGES: StageId[] = ["closed_won"];
export const LOST_STAGES: StageId[] = ["closed_lost"];

export const stageById = (id: StageId): PipelineStage =>
  PIPELINE_STAGES.find((s) => s.id === id) ?? PIPELINE_STAGES[0];

/** Tailwind class bundles keyed by the accent token.
 *  Restrained pipeline palette: neutral warm tints for open stages,
 *  terracotta emphasis for negotiation, sage/red only for won/lost. */
export const STAGE_ACCENT: Record<
  PipelineStage["accent"],
  { text: string; bg: string; border: string; dot: string; ring: string }
> = {
  blue: {
    text: "text-stage-blue",
    bg: "bg-surface-warm",
    border: "border-line",
    dot: "bg-stage-blue",
    ring: "ring-stage-blue/25",
  },
  indigo: {
    text: "text-stage-indigo",
    bg: "bg-surface-warm",
    border: "border-line",
    dot: "bg-stage-indigo",
    ring: "ring-stage-indigo/25",
  },
  amber: {
    text: "text-stage-amber",
    bg: "bg-gold-soft",
    border: "border-gold/25",
    dot: "bg-stage-amber",
    ring: "ring-stage-amber/25",
  },
  violet: {
    text: "text-stage-cyan",
    bg: "bg-surface-warm",
    border: "border-line",
    dot: "bg-stage-cyan",
    ring: "ring-stage-cyan/25",
  },
  emerald: {
    text: "text-success",
    bg: "bg-success-soft",
    border: "border-success/25",
    dot: "bg-success",
    ring: "ring-success/25",
  },
  rose: {
    text: "text-danger",
    bg: "bg-danger-soft",
    border: "border-danger/25",
    dot: "bg-danger",
    ring: "ring-danger/25",
  },
};

export const DOC_CATEGORY_META: Record<
  string,
  { label: string; badge: string }
> = {
  quotation: {
    label: "Quotation",
    badge: "border-warn/30 bg-warn-soft text-warn",
  },
  spek_teknis: {
    label: "Spesifikasi Teknis",
    badge: "border-accent/30 bg-accent-soft text-accent",
  },
  bast: {
    label: "BAST",
    badge: "border-stage-indigo/30 bg-stage-indigo/10 text-stage-indigo",
  },
  kontrak_spk: {
    label: "Kontrak / SPK",
    badge: "border-success/30 bg-success-soft text-success",
  },
};

/** How the deal is being handled — chip label + restrained badge style. */
export const DEAL_TYPE_META: Record<
  DealType,
  { label: string; shortLabel: string; badge: string }
> = {
  tender: {
    label: "Tender",
    shortLabel: "Tender",
    badge: "border-accent/30 bg-accent-soft text-accent",
  },
  mini_kompetisi: {
    label: "Mini Kompetisi",
    shortLabel: "Mikom",
    badge: "border-gold/40 bg-gold-soft text-gold",
  },
  sales_langsung: {
    label: "Sales Langsung",
    shortLabel: "Langsung",
    badge: "border-line-muted bg-ink-overlay text-content-secondary",
  },
};

export const DEAL_TYPES: DealType[] = ["tender", "mini_kompetisi", "sales_langsung"];

export const PRIORITY_META: Record<
  string,
  { label: string; badge: string }
> = {
  high: {
    label: "High",
    badge: "border-danger/30 bg-danger-soft text-danger",
  },
  medium: {
    label: "Medium",
    badge: "border-warn/30 bg-warn-soft text-warn",
  },
  low: {
    label: "Low",
    badge: "border-line-muted bg-ink-overlay text-content-secondary",
  },
};
