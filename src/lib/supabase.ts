import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazily-created browser client. Returns null (so callers can fall back to
// optimistic in-memory state) when env vars are missing, e.g. before the
// project is provisioned.

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  client = url && anonKey ? createClient(url, anonKey) : null;
  if (!client && typeof window !== "undefined") {
    console.warn(
      "[CLOSER] Supabase not configured — running in-memory only. " +
        "Set NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }
  return client;
}

export const isSupabaseConfigured = () => getSupabase() !== null;

// ── Table names ────────────────────────────────────────────────
export const T = {
  deals: "deals",
  documents: "deal_documents",
  notes: "deal_notes",
  tasks: "tasks",
} as const;

// Public bucket for uploaded PDFs (created by supabase/schema.sql).
export const STORAGE_BUCKET = "documents";
