// ── Formatting & date helpers ─────────────────────────────────

import type { Deal } from "./types";

// ── Simulasi komersial (HPS-driven) ───────────────────────────
// HPS = patokan budget end user (umumnya sudah termasuk PPN 11%).
// Dari HPS + margin target, sales membayangkan: harga jual ideal di
// bawah HPS, dan COGS maksimal yang layak di-bid ke distributor.
// Ini alat bantu simulasi — angka final tetap hasil diskusi internal.

/** PPN yang diasumsikan sudah termasuk di dalam HPS pemerintah. */
export const PPN_RATE = 0.11;

/** Batas aman penawaran: sedikit di bawah HPS supaya tetap menang bid. */
const SAFETY_FACTOR = 0.98;

/**
 * Hasil simulasi dari HPS + margin target (%).
 * - sellingPrice: perkiraan harga jual terbaik (di bawah HPS)
 * - cogsBid: harga maksimal ke distributor agar margin target masih tercapai
 * - profit: selisih harga jual − COGS bid
 */
export function simulateFromHps(hps: number, marginPct: number) {
  const sellingPrice = Math.round(hps * SAFETY_FACTOR);
  const cogsBid = Math.round(sellingPrice / (1 + marginPct / 100) / (1 + PPN_RATE));
  return { sellingPrice, cogsBid, profit: sellingPrice - cogsBid };
}

/**
 * Harga jual efektif.
 * HPS terisi → hasil simulasi (≈ di bawah HPS).
 * HPS kosong → `value` manual (boleh 0 = oppty masih gelap).
 */
export function sellingPrice(
  d: Pick<Deal, "hps" | "marginPct" | "value">
): number {
  if (d.hps > 0) return simulateFromHps(d.hps, d.marginPct).sellingPrice;
  return d.value;
}

/** true kalau deal ini belum punya angka apa pun (oppty gelap). */
export function hasNoEstimate(d: Pick<Deal, "hps" | "value">): boolean {
  return d.hps <= 0 && d.value <= 0;
}

const idrFull = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** Rp 1.250.000.000 */
export function formatIDR(value: number): string {
  return idrFull.format(value);
}

/** Compact: Rp 1,3 M / Rp 250 jt / Rp 12 rb */
export function formatIDRCompact(value: number): string {
  if (value >= 1_000_000_000)
    return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })} M`;
  if (value >= 1_000_000)
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 0,
    })} jt`;
  if (value >= 1_000)
    return `Rp ${(value / 1_000).toLocaleString("id-ID", {
      maximumFractionDigits: 0,
    })} rb`;
  return `Rp ${value}`;
}

const dateLong = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateShort = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTime = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateLong(iso: string): string {
  return dateLong.format(new Date(iso));
}
export function formatDateShort(iso: string): string {
  return dateShort.format(new Date(iso));
}
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "2 hari lagi", "Hari ini", "3 hari lalu" */
export function relativeDayLabel(iso: string): string {
  const target = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Besok";
  if (diff === -1) return "Kemarin";
  if (diff > 1) return `${diff} hari lagi`;
  return `${Math.abs(diff)} hari lalu`;
}

/** Local calendar date as "YYYY-MM-DD". */
export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export type TaskStatus = "overdue" | "due_today" | "upcoming" | "done";

export function taskStatus(dueAt: string, done: boolean): TaskStatus {
  if (done) return "done";
  const now = new Date();
  const due = new Date(dueAt);
  if (isSameDay(now, due)) {
    // due today but earlier in the day and still pending => overdue-ish but we treat as due today
    return "due_today";
  }
  if (due.getTime() < now.getTime()) return "overdue";
  return "upcoming";
}

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; badge: string; dot: string; pulse?: boolean }
> = {
  overdue: {
    label: "Terlambat",
    badge: "border-danger/40 bg-danger-soft text-danger",
    dot: "bg-danger",
    pulse: true,
  },
  due_today: {
    label: "Jatuh Tempo Hari Ini",
    badge: "border-warn/40 bg-warn-soft text-warn",
    dot: "bg-warn",
  },
  upcoming: {
    label: "Terjadwal",
    badge: "border-success/40 bg-success-soft text-success",
    dot: "bg-success",
  },
  done: {
    label: "Selesai",
    badge: "border-line-muted bg-ink-overlay text-content-muted",
    dot: "bg-content-muted",
  },
};


export function uid(prefix = "id"): string {
  // Text ids (Supabase columns are `text`). The random part uses
  // crypto when available so two tabs can't collide on the same id.
  const rand =
    typeof crypto !== "undefined" && "getRandomValues" in crypto
      ? Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) =>
          b.toString(36).padStart(2, "0")
        ).join("")
      : Math.random().toString(36).slice(2, 9);
  return `${prefix}_${rand}`;
}
