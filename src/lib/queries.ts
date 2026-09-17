import { getSupabase, T } from "./supabase";
import type {
  Deal,
  DealDocument,
  NoteEntry,
  StageId,
  TaskReminder,
} from "./types";

// ── Row shapes ─────────────────────────────────────────────────
interface DealRow {
  id: string;
  title: string;
  company: string;
  contact_name: string;
  contact_phone: string;
  contact_role: string | null;
  value: number;
  cogs?: number | null;
  margin_pct: number;
  stage: StageId;
  priority: Deal["priority"];
  target_close_date: string;
  industry: string;
  owner: string;
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
    cogs: Number(r.cogs) || 0,
    marginPct: Number(r.margin_pct) || 0,
    stage: r.stage,
    priority: r.priority,
    targetCloseDate: r.target_close_date,
    industry: r.industry,
    owner: r.owner,
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
  const q = db.from(T.deals).select(
    `id, title, company, contact_name, contact_phone, contact_role,
     value, cogs, margin_pct, stage, priority, target_close_date, industry, owner,
     created_at,
     deal_documents(id, deal_id, name, category, url, source, size_label, uploaded_at),
     deal_notes(id, deal_id, text, created_at)`
  );
  if (dealId) q.eq("id", dealId);
  const { data, error } = await q.order("created_at", { ascending: false });

  if (error) {
    console.error("[CLOSER] loadDeals failed:", error);
    return { deals: [], tasks: [] };
  }

  const deals: Deal[] = (data ?? []).map((row: any) => {
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

  if (tasksError) console.error("[CLOSER] loadTasks failed:", tasksError);

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
    cogs: deal.cogs,
    margin_pct: deal.marginPct,
    stage: deal.stage,
    priority: deal.priority,
    target_close_date: deal.targetCloseDate,
    industry: deal.industry,
    owner: deal.owner,
    created_at: deal.createdAt,
  });
  if (error) console.error("[CLOSER] addDeal failed:", error);
  return !error;
}

async function updateDeal(id: string, patch: Partial<Deal>): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const row: Record<string, any> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.company !== undefined) row.company = patch.company;
  if (patch.value !== undefined) row.value = patch.value;
  if (patch.cogs !== undefined) row.cogs = patch.cogs;
  if (patch.marginPct !== undefined) row.margin_pct = patch.marginPct;
  if (patch.stage !== undefined) row.stage = patch.stage;
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.targetCloseDate !== undefined) row.target_close_date = patch.targetCloseDate;
  if (patch.industry !== undefined) row.industry = patch.industry;
  if (patch.owner !== undefined) row.owner = patch.owner;
  if (patch.contact) {
    if (patch.contact.name !== undefined) row.contact_name = patch.contact.name;
    if (patch.contact.phone !== undefined) row.contact_phone = patch.contact.phone;
    if (patch.contact.role !== undefined) row.contact_role = patch.contact.role ?? null;
  }
  const { error } = await db.from(T.deals).update(row).eq("id", id);
  if (error) console.error("[CLOSER] updateDeal failed:", error);
  return !error;
}

async function deleteDeal(id: string): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  // cascade removes docs, notes, tasks via FK
  const { error } = await db.from(T.deals).delete().eq("id", id);
  if (error) console.error("[CLOSER] deleteDeal failed:", error);
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
  if (error) console.error("[CLOSER] addDocument failed:", error);
  return !error;
}

async function removeDocument(docId: string): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { error } = await db.from(T.documents).delete().eq("id", docId);
  if (error) console.error("[CLOSER] removeDocument failed:", error);
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
  if (error) console.error("[CLOSER] addNote failed:", error);
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
  if (error) console.error("[CLOSER] addTask failed:", error);
  return !error;
}

async function toggleTask(id: string, done: boolean): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { error } = await db.from(T.tasks).update({ done }).eq("id", id);
  if (error) console.error("[CLOSER] toggleTask failed:", error);
  return !error;
}

async function deleteTask(id: string): Promise<boolean> {
  const db = getSupabase();
  if (!db) return false;
  const { error } = await db.from(T.tasks).delete().eq("id", id);
  if (error) console.error("[CLOSER] deleteTask failed:", error);
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
