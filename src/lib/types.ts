// ── CLOSER domain types ───────────────────────────────────────

export type StageId =
  | "prospecting"
  | "solution_design"
  | "proposal_sent"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type Priority = "high" | "medium" | "low";

export type DocCategory =
  | "quotation"
  | "spek_teknis"
  | "bast"
  | "kontrak_spk";

export interface PipelineStage {
  id: StageId;
  label: string;
  shortLabel: string;
  /** tailwind text/border accent color token */
  accent: "blue" | "indigo" | "amber" | "violet" | "emerald" | "rose";
}

export interface Contact {
  name: string;
  phone: string;
  role?: string;
}

export interface DealDocument {
  id: string;
  name: string;
  category: DocCategory;
  url: string;
  source: "drive" | "dropbox" | "upload";
  sizeLabel?: string;
  uploadedAt: string; // ISO
}

export interface NoteEntry {
  id: string;
  text: string;
  createdAt: string; // ISO
}

export interface TaskReminder {
  id: string;
  dealId: string;
  title: string;
  dueAt: string; // ISO datetime
  done: boolean;
  channel: "telegram" | "manual";
}

export interface Deal {
  id: string;
  title: string;
  company: string;
  contact: Contact;
  /** Harga jual ke client (IDR). Cache — dihitung dari cogs × margin bila COGS terisi. */
  value: number;
  /** HPS / harga distributor (IDR). 0 = belum ada angka (oppty masih gelap). */
  cogs: number;
  /** Markup % terhadap COGS → harga jual = cogs × (1 + marginPct/100). */
  marginPct: number;
  stage: StageId;
  priority: Priority;
  targetCloseDate: string; // ISO date
  industry: string;
  owner: string;
  documents: DealDocument[];
  notes: NoteEntry[];
  createdAt: string; // ISO
}

/** Minimal input to create a deal — everything except title/company is optional. */
export type NewDealInput = Partial<Omit<Deal, "id" | "documents" | "notes" | "createdAt">> & {
  title: string;
  company: string;
  documents?: DealDocument[];
  notes?: NoteEntry[];
};
