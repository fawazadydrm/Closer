// ── CLOSER domain types ───────────────────────────────────────

export type StageId =
  | "prospecting"
  | "solution_design"
  | "proposal_sent"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type Priority = "high" | "medium" | "low";

/** Cara deal ditangani: tender resmi, mini kompetisi, atau sales langsung. */
export type DealType = "tender" | "mini_kompetisi" | "sales_langsung";

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
  /** Object path in the Supabase Storage bucket — set for real uploads only. */
  storagePath?: string;
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
  /** Harga jual ke client (IDR). Cache — dihitung dari simulasi HPS bila HPS terisi. */
  value: number;
  /** Harga dari distributor (IDR). Hasil bidikan — bukan input utama. 0 = belum ada. */
  cogs: number;
  /** Patokan budget end user (IDR, umumnya sudah termasuk PPN 11%). Input utama simulasi. */
  hps: number;
  /** Margin target (%) → harga jual & COGS bid dihitung otomatis dari HPS. */
  marginPct: number;
  stage: StageId;
  priority: Priority;
  /** Jenis penangananan deal — default "sales_langsung" untuk data lama. */
  dealType: DealType;
  /** URL landing page (portal tender / halaman mikom). Kosong = tidak ada. */
  landingPageUrl: string;
  targetCloseDate: string; // ISO date
  industry: string;
  owner: string;
  /** Dipindah manual ke Repository — disembunyikan dari pipeline & KPI aktif. */
  archived: boolean;
  documents: DealDocument[];
  notes: NoteEntry[];
  createdAt: string; // ISO
}

/** Minimal input to create a deal — everything except title/company is optional. */
export type NewDealInput = Partial<Omit<Deal, "documents" | "notes" | "createdAt">> & {
  title: string;
  company: string;
  documents?: DealDocument[];
  notes?: NoteEntry[];
};
