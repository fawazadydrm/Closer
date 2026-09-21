import { getSupabase, STORAGE_BUCKET } from "./supabase";

// ── Supabase Storage helpers (PDF documents) ───────────────────
// Files live in a public bucket; the DB row only stores the public
// URL. When Supabase isn't configured every call fails gracefully so
// the UI can show a clear message instead of crashing.

export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadResult {
  url: string;
  path: string;
}

/** Human size label, e.g. "1,3 MB" / "820 KB". */
export function fileSizeLabel(bytes: number): string {
  if (bytes >= 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

/** Validate + upload a PDF under `{dealId}/{docId}.pdf`. Returns error text on failure. */
export async function uploadPdf(
  dealId: string,
  docId: string,
  file: File
): Promise<UploadResult | { error: string }> {
  const db = getSupabase();
  if (!db)
    return {
      error:
        "Supabase belum dikonfigurasi — set NEXT_PUBLIC_SUPABASE_URL & ANON_KEY di .env.local.",
    };
  if (!isPdf(file)) return { error: "Hanya file PDF yang bisa diupload." };
  if (file.size > MAX_PDF_BYTES)
    return { error: `Ukuran PDF melebihi ${fileSizeLabel(MAX_PDF_BYTES)}.` };

  const path = `${dealId}/${docId}.pdf`;
  const { error } = await db.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (error) {
    console.error("[CLOSER] uploadPdf failed:", error);
    return { error: `Gagal upload ke storage: ${error.message}` };
  }
  const { data } = db.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Extract the storage object path from one of our public URLs (null otherwise). */
export function storagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const rest = url.slice(i + marker.length);
  try {
    return decodeURIComponent(rest.split(/[?#]/)[0]);
  } catch {
    return rest.split(/[?#]/)[0];
  }
}

/** Best-effort delete of an uploaded object; never throws (DB row removal is authoritative). */
export async function removeStoredPdf(url: string): Promise<void> {
  const path = storagePathFromUrl(url);
  if (!path) return;
  const db = getSupabase();
  if (!db) return;
  const { error } = await db.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) console.error("[CLOSER] removeStoredPdf failed:", error);
}
