"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Save } from "lucide-react";
import type { Deal, DealType, Priority, StageId } from "@/lib/types";
import { PIPELINE_STAGES, DEAL_TYPES, DEAL_TYPE_META } from "@/lib/stages";
import { formatIDR, simulateFromHps } from "@/lib/format";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";

interface FormState {
  title: string;
  company: string;
  industry: string;
  contactName: string;
  contactPhone: string;
  hps: string;
  marginPct: string;
  priority: Priority;
  dealType: DealType;
  landingPageUrl: string;
  stage: StageId;
  targetCloseDate: string; // yyyy-mm-dd
}

const toForm = (d: Deal): FormState => ({
  title: d.title,
  company: d.company,
  industry: d.industry,
  contactName: d.contact.name === "—" ? "" : d.contact.name,
  contactPhone: d.contact.phone,
  hps: d.hps ? String(d.hps) : "",
  marginPct: d.marginPct ? String(d.marginPct) : "",
  priority: d.priority,
  dealType: d.dealType,
  landingPageUrl: d.landingPageUrl,
  stage: d.stage,
  targetCloseDate: d.targetCloseDate.slice(0, 10),
});

export default function FieldForms({ deal }: { deal: Deal }) {
  const { dispatch } = useCloser();
  const { showToast } = useUI();
  const [form, setForm] = useState<FormState>(() => toForm(deal));
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(deal));

  // Re-sync when a different deal is opened.
  useEffect(() => setForm(toForm(deal)), [deal.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Simulasi: HPS + margin target → harga jual & COGS bid (dipreview & disimpan).
  const sim = useMemo(() => {
    const hps = Number(form.hps) || 0;
    const margin = Math.max(0, Math.min(100, Number(form.marginPct) || 0));
    return hps > 0 ? simulateFromHps(hps, margin) : null;
  }, [form.hps, form.marginPct]);

  const save = () => {
    // Guard against a cleared/invalid <input type="date"> — `new Date("").toISOString()`
    // throws RangeError and would silently break the Save action.
    const parsedClose = form.targetCloseDate ? new Date(form.targetCloseDate) : null;
    const validClose = parsedClose !== null && !Number.isNaN(parsedClose.getTime());
    if (!validClose) set("targetCloseDate", deal.targetCloseDate.slice(0, 10));

    dispatch({
      type: "UPDATE_DEAL",
      id: deal.id,
      patch: {
        title: form.title.trim() || deal.title,
        company: form.company.trim(),
        industry: form.industry.trim(),
        contact: { ...deal.contact, name: form.contactName.trim() || "—", phone: form.contactPhone },
        hps: Number(form.hps) || 0,
        marginPct: Math.max(0, Math.min(100, Number(form.marginPct) || 0)),
        // HPS terisi → simpan juga hasil simulasi (harga jual + bid COGS).
        ...(sim ? { value: sim.sellingPrice, cogs: sim.cogsBid } : {}),
        priority: form.priority,
        dealType: form.dealType,
        landingPageUrl: form.landingPageUrl.trim(),
        stage: form.stage,
        targetCloseDate: validClose ? parsedClose.toISOString() : deal.targetCloseDate,
      },
    });
    showToast("Perubahan tersimpan.");
  };

  return (
    <div className="space-y-4">
      <Section title="Informasi Deal">
        <Labeled label="Judul Proyek">
          <input
            className="field-input"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </Labeled>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Labeled label="Perusahaan">
            <input
              className="field-input"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
          </Labeled>
          <Labeled label="Industri">
            <input
              className="field-input"
              value={form.industry}
              onChange={(e) => set("industry", e.target.value)}
            />
          </Labeled>
        </div>
      </Section>

      <Section title="Kontak Utama">
        <div className="grid grid-cols-1 gap-3 dxs:grid-cols-2">
          <Labeled label="Nama PIC">
            <input
              className="field-input"
              value={form.contactName}
              onChange={(e) => set("contactName", e.target.value)}
            />
          </Labeled>
          <Labeled label="No. Telepon">
            <input
              className="field-input"
              value={form.contactPhone}
              onChange={(e) => set("contactPhone", e.target.value)}
            />
          </Labeled>
        </div>
      </Section>

      <Section title="Simulasi Komersial">
        <div className="grid grid-cols-1 gap-3 dxs:grid-cols-2">
          <Labeled label="HPS dari End User (Rp)">
            <input
              inputMode="numeric"
              className="field-input tabular-nums"
              placeholder="mis. 580.000.000"
              value={form.hps}
              onChange={(e) => set("hps", e.target.value.replace(/\D/g, ""))}
            />
          </Labeled>
          <Labeled label="Margin Target (%)">
            <input
              inputMode="numeric"
              className="field-input tabular-nums"
              placeholder="0"
              value={form.marginPct}
              onChange={(e) => set("marginPct", e.target.value.replace(/[^\d.]/g, ""))}
            />
          </Labeled>
        </div>
        {sim && (
          <div className="space-y-2 rounded-lg border border-accent/25 bg-accent-soft/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-accent">
              Hasil Simulasi
            </p>
            <SimRow label="Harga Jual Ideal (di bawah HPS)" value={formatIDR(sim.sellingPrice)} strong />
            <SimRow label="Bid COGS maks. ke Distributor" value={formatIDR(sim.cogsBid)} underline />
            <SimRow label="Estimasi Profit Kotor" value={formatIDR(sim.profit)} />
            <p className="text-[10px] leading-snug text-content-muted">
              Asumsi: HPS sudah termasuk PPN 11% · penawaran aman ±2% di bawah HPS.
            </p>
          </div>
        )}
        {!sim && (
          <div className="rounded-lg border border-dashed border-line px-3 py-2.5 text-xs text-content-muted">
            Isi HPS untuk melihat simulasi harga jual &amp; bid COGS.
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 dxs:grid-cols-2">
          <Labeled label="Prioritas">
            <select
              className="field-input"
              value={form.priority}
              onChange={(e) => set("priority", e.target.value as Priority)}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Labeled>
          <Labeled label="Target Closing">
            <input
              type="date"
              className="field-input"
              value={form.targetCloseDate}
              onChange={(e) => set("targetCloseDate", e.target.value)}
            />
          </Labeled>
        </div>
        <Labeled label="Stage Pipeline">
          <select
            className="field-input"
            value={form.stage}
            onChange={(e) => set("stage", e.target.value as StageId)}
          >
            {PIPELINE_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Labeled>
      </Section>

      <Section title="Tipe & Sumber Link">
        <Labeled label="Tipe Penanganan">
          <div className="flex flex-wrap gap-2">
            {DEAL_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("dealType", t)}
                className={
                  "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold leading-tight transition-colors " +
                  (form.dealType === t
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line bg-ink-surface text-content-secondary hover:border-line-muted hover:text-content-primary")
                }
              >
                {DEAL_TYPE_META[t].label}
              </button>
            ))}
          </div>
        </Labeled>
        {(form.dealType === "tender" || form.dealType === "mini_kompetisi") && (
          <Labeled label="Link Landing Page (portal tender / mikom)">
            <div className="relative">
              <ExternalLink className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
              <input
                className="field-input pl-9"
                type="url"
                inputMode="url"
                placeholder="https://…"
                value={form.landingPageUrl}
                onChange={(e) => set("landingPageUrl", e.target.value)}
              />
            </div>
          </Labeled>
        )}
        {form.dealType === "sales_langsung" && form.landingPageUrl.trim() !== "" && (
          <Labeled label="Link Landing Page">
            <input
              className="field-input"
              type="url"
              placeholder="https://…"
              value={form.landingPageUrl}
              onChange={(e) => set("landingPageUrl", e.target.value)}
            />
          </Labeled>
        )}
      </Section>

      <button
        onClick={save}
        disabled={!dirty}
        className="btn-primary w-full"
      >
        <Save className="h-4 w-4" />
        Simpan Perubahan
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card space-y-3 p-4">
      <h4 className="text-xs font-bold uppercase tracking-wide text-content-secondary">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function SimRow({
  label,
  value,
  strong,
  underline,
}: {
  label: string;
  value: string;
  strong?: boolean;
  underline?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-content-secondary">{label}</span>
      <span
        className={
          "tabular-nums " +
          (strong ? "font-extrabold text-content-primary " : "font-semibold text-content-primary ") +
          (underline ? "underline decoration-accent/50 decoration-2 underline-offset-4" : "")
        }
      >
        {value}
      </span>
    </div>
  );
}
