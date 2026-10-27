import { getSupabase, T } from "./supabase";
import { storagePathFromUrl } from "./storage";
import type {
  Deal,
  DealDocument,
  DealType,
  NoteEntry,
  StageId,
  TaskReminder,
} from "./types";

// ── Sync error reporting ───────────────────────────────────────
// Mutations return a boolean so the optimistic UI can keep moving; the real
// failure reason is forwarded here so the UI can surface it instead of the
// write silently reverting on the next reload (e.g. a missing column because
// a Supabase migration hasn't been run).
type SyncErrorHandler = (message: string) => void;
let syncErrorHandler: SyncErrorHandler | null = null;

export function setSyncErrorHandler(handler: SyncErrorHandler | null): void {
  syncErrorHandler = handler;
}

/** Flatten anything Supabase/JS throws into a readable one-liner.
 *  `PostgrestError` extends Error with a non-enumerable `message`, so logging
 *  the raw object renders as `{}` in devtools/dev-overlay — read the fields. */
function describeError(error: unknown): string {
  if (error == null) return "Terjadi kesalahan.";
  if (typeof error === "string") return error;

  const rec = error as Record<string, unknown>;
  const parts = [rec.message, rec.code, rec.details, rec.hint].filter(
    (v): v is string => typeof v === "string" && v.length > 0
  );
  if (parts.length > 0) return parts.join(" · ");
  if (error instanceof Error) return error.name;

  try {
    const json = JSON.stringify(error);
    if (json && json !== "{}") return json;
  } catch {
    /* circular — ignore */
  }
  return "Kesalahan tidak diketahui (lihat console).";
}

function reportSyncError(scope: string, error: unknown): void {
  const message = describeError(error);
  const rec = error as Record<string, unknown>;
  console.error(`[CLOSER] ${scope} failed: ${message}`, {
    message: rec?.message,
    code: rec?.code,
    details: rec?.details,
    hint: rec?.hint,
  });
  syncErrorHandler?.(`${scope} — ${message}`);
}

// ── Row shapes ─────────────────────────────────────────────────
interface DealRow {
  id: string;
  title: string;
  company: string;
  contact_name: string;
  contact_phone: string;
  contact_role: string | null;
  value: number;
  hps?: number | null;
  cogs?: number | null;
  margin_pct: number;
  stage: StageId;
  priority: Deal["priority"];
  deal_type?: DealType | null;
  landing_page_url?: string | null;
  target_close_date: string;
  industry: string;
  owner: string;
  archived?: boolean | null;
  created_at: string;
}

interface DocRow {
  id: string;
  deal_id: string;
  name: string;
  category: DealDocument["category"];
  url: string;
  source: DealDocument["source"];
  size_label: string | null;
  uploaded_at: string;
}

interface NoteRow {
  id: string;
  deal_id: string;
  text: string;
  created_at: string;
}

interface TaskRow {
  id: string;
  deal_id: string;
  title: string;
  due_at: string;
  done: boolean;
  channel: TaskReminder["channel"];
}

/** A deals row with its nested documents/notes (from the relational select). */
interface DealWithRelationsRow extends DealRow {
  deal_documents: DocRow[] | null;
  deal_notes: NoteRow[] | null;
}

// ── Row → type ─────────────────────────────────────────────────
function rowToDeal(r: DealRow): Deal {
  return {
    id: r.id,
    title: r.title,
    company: r.company,
    contact: {
      name: r.contact_name,
      phone: r.contact_phone,
      role: r.contact_role ?? undefined,
    },
    value: Number(r.value) || 0,
    hps: Number(r.hps) || 0,
    cogs: Number(r.cogs) || 0,
    marginPct: Number(r.margin_pct) || 0,
    stage: r.stage,
    priority: r.priority,
    dealType: r.deal_type ?? "sales_langsung",
    landingPageUrl: r.landing_page_url ?? "",
    targetCloseDate: r.target_close_date,
    industry: r.industry,
    owner: r.owner,
    archived: r.archived ?? false,
    documents: [],
    notes: [],
    createdAt: r.created_at,
  };
}

function rowToDoc(r: DocRow): DealDocument {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    url: r.url,
    source: r.source,
    sizeLabel: r.size_label ?? undefined,
    // Derive the storage path (for cleanup) from our own public URLs.
    storagePath:
      r.source === "upload" ? storagePathFromUrl(r.url) ?? undefined : undefined,
    uploadedAt: r.uploaded_at,
  };
}

function rowToNote(r: NoteRow): NoteEntry {
  return { id: r.id, text: r.text, createdAt: r.created_at };
}

function rowToTask(r: TaskRow): TaskReminder {
  return {
    id: r.id,
    dealId: r.deal_id,
    title: r.title,
    dueAt: r.due_at,
    done: r.done,
    channel: r.channel,
  };
}

// ── Load ───────────────────────────────────────────────────────
/** Optionally scopes docs/notes to one deal to avoid over-fetching. */
async function loadDeals(
  dealId?: string
): Promise<{ deals: Deal[]; tasks: TaskReminder[] }> {
  const db = getSupabase();
  if (!db) return { deals: [], tasks: [] };

  const DEAL_RELATIONS = `deal_documents(id, deal_id, name, category, url, source, size_label, uploaded_at),
     deal_notes(id, deal_id, text, created_at)`;
  const DEAL_COLS_V6 = `id, title, company, contact_name, contact_phone, contact_role,
     value, hps, cogs, margin_pct, stage, priority, deal_type, landing_page_url,
     target_close_date, industry, owner, created_at`;
  const DEAL_COLS_V7 = `id, title, company, contact_name, contact_phone, contact_role,
     value, hps, cogs, margin_pct, stage, priority, deal_type, landing_page_url,
     target_close_date, industry, owner, archived, created_at`;

  const runQuery = (cols: string) => {
    const q = db.from(T.deals).select(`${cols}, ${DEAL_RELATIONS}`);
    if (dealId) q.eq("id", dealId);
    return q.order("created_at", { ascending: false });
  };

  // `archived` was added in schema v7. Until the migration is run the column is
  // absent and selecting it would fail — quietly retry without it (archived
  // then defaults to false) so a pending migration never blanks the pipeline.
  let { data, error } = await runQuery(DEAL_COLS_V7);
  if (error) {
    console.warn(
      "[CLOSER] Query with `archived` failed — run the v7 migration in supabase/schema.sql. Falling back without it.",
      error.message
    );
    ({ data, error } = await runQuery(DEAL_COLS_V6));
  }

  if (error) {
    reportSyncError("Gagal memuat data", error);
    return { deals: [], tasks: [] };
  }

  // `select` is fed a runtime-built string, so PostgREST's literal-typed
  // inference is unavailable — assert the known row shape instead.
  const rows = (data ?? []) as unknown as DealWithRelationsRow[];
  const deals: Deal[] = rows.map((row) => {
    const deal = rowToDeal(row);
    deal.documents = (row.deal_documents ?? []).sort((a: DocRow, b: DocRow) =>
      b.uploaded_at.localeCompare(a.uploaded_at)
    ).map(rowToDoc);
    deal.notes = (row.deal_notes ?? []).sort((a: NoteRow, b: NoteRow) =>
      b.created_at.localeCompare(a.created_at)
    ).map(rowToNote);
    return deal;
  });

  // tasks — always load all (needed by dashboard/reminders)
  const { data: tasksData, error: tasksError } = await db
    .from(T.tasks)
    .select("id, deal_id, title, due_at, done, channel")
    .order("due_at", { ascending: true });

  if (tasksError) reportSyncError("Gagal memuat tugas", tasksError);

  return { deals, tasks: (tasksData ?? []).map(rowToTask) };
}

// ── Mutations ──────────────────────────────────────────────────
async function addDeal(deal: Deal): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { error } = await db.from(T.deals).insert({
    id: deal.id,
    title: deal.title,
    company: deal.company,
    contact_name: deal.contact.name,
    contact_phone: deal.contact.phone,
    contact_role: deal.contact.role ?? null,
    value: deal.value,
    hps: deal.hps,
    cogs: deal.cogs,
    margin_pct: deal.marginPct,
    stage: deal.stage,
    priority: deal.priority,
    deal_type: deal.dealType,
    landing_page_url: deal.landingPageUrl || null,
    target_close_date: deal.targetCloseDate,
    industry: deal.industry,
    owner: deal.owner,
    archived: deal.archived,
    created_at: deal.createdAt,
  });
  if (error) {
    reportSyncError("Gagal menyimpan deal", error);
    return false;
  }

  // Documents uploaded while creating the deal (AddDealModal stages PDFs and
  // embeds them in `deal.documents`) must be persisted here too — otherwise
  // they exist only in optimistic state and disappear on the next reload.
  if (deal.documents.length > 0) {
    const { error: docsError } = await db.from(T.documents).insert(
      deal.documents.map((doc) => ({
        id: doc.id,
        deal_id: deal.id,
        name: doc.name,
        category: doc.category,
        url: doc.url,
        source: doc.source,
        size_label: doc.sizeLabel ?? null,
        uploaded_at: doc.uploadedAt,
      }))
    );
    if (docsError) reportSyncError("Gagal menyimpan dokumen deal", docsError);
  }
  return true;
}

async function updateDeal(id: string, patch: Partial<Deal>): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.company !== undefined) row.company = patch.company;
  if (patch.value !== undefined) row.value = patch.value;
  if (patch.hps !== undefined) row.hps = patch.hps;
  if (patch.cogs !== undefined) row.cogs = patch.cogs;
  if (patch.marginPct !== undefined) row.margin_pct = patch.marginPct;
  if (patch.stage !== undefined) row.stage = patch.stage;
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.dealType !== undefined) row.deal_type = patch.dealType;
  if (patch.landingPageUrl !== undefined) row.landing_page_url = patch.landingPageUrl || null;
  if (patch.targetCloseDate !== undefined) row.target_close_date = patch.targetCloseDate;
  if (patch.industry !== undefined) row.industry = patch.industry;
  if (patch.owner !== undefined) row.owner = patch.owner;
  if (patch.archived !== undefined) row.archived = patch.archived;
  if (patch.contact) {
    if (patch.contact.name !== undefined) row.contact_name = patch.contact.name;
    if (patch.contact.phone !== undefined) row.contact_phone = patch.contact.phone;
    if (patch.contact.role !== undefined) row.contact_role = patch.contact.role ?? null;
  }
  const { error } = await db.from(T.deals).update(row).eq("id", id);
  if (error) reportSyncError("Gagal memperbarui deal", error);
  return !error;
}

async function deleteDeal(id: string): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  // cascade removes docs, notes, tasks via FK
  const { error } = await db.from(T.deals).delete().eq("id", id);
  if (error) reportSyncError("Gagal menghapus deal", error);
  return !error;
}

async function addDocument(dealId: string, doc: DealDocument): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { error } = await db.from(T.documents).insert({
    id: doc.id,
    deal_id: dealId,
    name: doc.name,
    category: doc.category,
    url: doc.url,
    source: doc.source,
    size_label: doc.sizeLabel ?? null,
    uploaded_at: doc.uploadedAt,
  });
  if (error) reportSyncError("Gagal menambah dokumen", error);
  return !error;
}

async function removeDocument(docId: string): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { error } = await db.from(T.documents).delete().eq("id", docId);
  if (error) reportSyncError("Gagal menghapus dokumen", error);
  return !error;
}

async function addNote(dealId: string, note: NoteEntry): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { error } = await db.from(T.notes).insert({
    id: note.id,
    deal_id: dealId,
    text: note.text,
    created_at: note.createdAt,
  });
  if (error) reportSyncError("Gagal menambah catatan", error);
  return !error;
}

async function addTask(task: TaskReminder): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { error } = await db.from(T.tasks).insert({
    id: task.id,
    deal_id: task.dealId,
    title: task.title,
    due_at: task.dueAt,
    done: task.done,
    channel: task.channel,
  });
  if (error) reportSyncError("Gagal menambah tugas", error);
  return !error;
}

async function toggleTask(id: string, done: boolean): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { error } = await db.from(T.tasks).update({ done }).eq("id", id);
  if (error) reportSyncError("Gagal memperbarui tugas", error);
  return !error;
}

async function deleteTask(id: string): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { error } = await db.from(T.tasks).delete().eq("id", id);
  if (error) reportSyncError("Gagal menghapus tugas", error);
  return !error;
}

export const db = {
  loadDeals,
  addDeal,
  updateDeal,
  deleteDeal,
  addDocument,
  removeDocument,
  addNote,
  addTask,
  toggleTask,
  deleteTask,
};
