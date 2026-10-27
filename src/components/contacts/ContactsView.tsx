"use client";

import { useMemo, useState } from "react";
import { Users, Search, Phone, Building2, Copy, Archive } from "lucide-react";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { stageById, STAGE_ACCENT } from "@/lib/stages";
import type { Deal } from "@/lib/types";

interface ContactEntry {
  key: string;
  dealId: string;
  name: string;
  phone: string;
  role: string;
  company: string;
  dealTitle: string;
  archived: boolean;
  stage: Deal["stage"];
}

const PLACEHOLDER = "—";

/** Flatten the contact attached to every deal into a single searchable list. */
function buildContacts(deals: Deal[]): ContactEntry[] {
  const entries: ContactEntry[] = [];
  for (const d of deals) {
    const name = (d.contact.name ?? "").trim();
    const phone = (d.contact.phone ?? "").trim();
    const role = (d.contact.role ?? "").trim();
    const hasInfo =
      (name && name !== PLACEHOLDER) || phone.length > 0 || role.length > 0;
    if (!hasInfo) continue;
    entries.push({
      key: d.id,
      dealId: d.id,
      name: name && name !== PLACEHOLDER ? name : "Tanpa nama",
      phone,
      role,
      company: d.company,
      dealTitle: d.title,
      archived: d.archived,
      stage: d.stage,
    });
  }
  return entries;
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ContactsView() {
  const { deals } = useCloser();
  const { openDeal, showToast } = useUI();
  const [query, setQuery] = useState("");

  const contacts = useMemo(() => buildContacts(deals), [deals]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q) ||
            c.role.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.dealTitle.toLowerCase().includes(q)
        )
      : contacts;
    return [...list].sort(
      (a, b) =>
        a.company.localeCompare(b.company, "id") ||
        a.name.localeCompare(b.name, "id")
    );
  }, [contacts, query]);

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      showToast("Nomor disalin.");
    } catch {
      showToast("Gagal menyalin nomor.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-content-primary md:text-2xl">
            Kontak
          </h2>
          <p className="text-sm text-content-secondary">
            {contacts.length} kontak dari {deals.length} deal
          </p>
        </div>
      </div>

      <div className="relative min-w-0 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
        <input
          className="field-input pl-9"
          placeholder="Cari nama, nomor, jabatan, perusahaan…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center gap-2 py-16 text-center text-content-muted">
          <Users className="h-8 w-8" />
          <p className="text-sm">
            {contacts.length === 0
              ? "Belum ada informasi kontak. Isi contact person pada deal."
              : "Tidak ada kontak yang cocok."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((c) => {
            const stage = stageById(c.stage);
            const accent = STAGE_ACCENT[stage.accent];
            return (
              <li key={c.key} className="glass-card flex items-start gap-3 p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-extrabold text-accent">
                  {initials(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-bold text-content-primary">
                      {c.name}
                    </span>
                    {c.role && (
                      <span className="text-[11px] text-content-muted">{c.role}</span>
                    )}
                    {c.archived && (
                      <span className="badge border border-line-muted bg-ink-overlay text-content-secondary">
                        <Archive className="h-3 w-3" /> Arsip
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-content-muted">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <button
                        onClick={() => openDeal(c.dealId)}
                        className="font-medium text-accent hover:underline"
                      >
                        {c.company}
                      </button>
                    </span>
                    <span>·</span>
                    <span className="truncate">{c.dealTitle}</span>
                    <span
                      className={`badge border ${accent.border} ${accent.bg} ${accent.text}`}
                    >
                      {stage.shortLabel}
                    </span>
                  </div>

                  {c.phone && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <a
                        href={`tel:${c.phone.replace(/\s+/g, "")}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-primary hover:text-accent"
                      >
                        <Phone className="h-3.5 w-3.5 text-content-muted" />
                        {c.phone}
                      </a>
                      <button
                        onClick={() => copyPhone(c.phone)}
                        aria-label="Salin nomor"
                        title="Salin nomor"
                        className="grid h-7 w-7 place-items-center rounded-md text-content-muted transition-colors hover:bg-ink-overlay hover:text-content-primary"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
