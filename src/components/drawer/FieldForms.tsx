"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import type { Deal, Priority, StageId } from "@/lib/types";
import { PIPELINE_STAGES } from "@/lib/stages";
import { formatIDR } from "@/lib/format";
import { useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";

interface FormState {
  title: string;
  company: string;
  industry: string;
  contactName: string;
  contactPhone: string;
  cogs: string;
  marginPct: string;
  priority: Priority;
  stage: StageId;
  targetCloseDate: string; // yyyy-mm-dd
}

const toForm = (d: Deal): FormState => ({
  title: d.title,
  company: d.company,
  industry: d.industry,
  contactName: d.contact.name === "—" ? "" : d.contact.name,
  contactPhone: d.contact.phone,
  cogs: d.cogs ? String(d.cogs) : "",
  marginPct: d.marginPct ? String(d.marginPct) : "",
  priority: d.priority,
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

  // Harga jual otomatis dari COGS × margin (untuk preview & disimpan ke value).
  const computedValue = useMemo(() => {
    const cogs = Number(form.cogs) || 0;
    const margin = Math.max(0, Math.min(100, Number(form.marginPct) || 0));
    return cogs > 0 ? Math.round(cogs * (1 + margin / 100)) : 0;
  }, [form.cogs, form.marginPct]);

  const save = () => {
    dispatch({
      type: "UPDATE_DEAL",
      id: deal.id,
      patch: {
        title: form.title.trim() || deal.title,
        company: form.company.trim(),
        industry: form.industry.trim(),
        contact: { ...deal.contact, name: form.contactName.trim() || "—", phone: form.contactPhone },
        cogs: Number(form.cogs) || 0,
        marginPct: Math.max(0, Math.min(100, Number(form.marginPct) || 0)),
        // kalau COGS terisi, value = hasil hitung; kalau tidak, pertahankan value lama
        ...(computedValue > 0 ? { value: computedValue } : {}),
        priority: form.priority,
        stage: form.stage,
        targetCloseDate: new Date(form.targetCloseDate).toISOString(),
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

      <Section title="Komersial">
        <div className="grid grid-cols-1 gap-3 dxs:grid-cols-2">
          <Labeled label="HPS / COGS (Rp)">
            <input
              inputMode="numeric"
              className="field-input tabular-nums"
              placeholder="belum ada"
              value={form.cogs}
              onChange={(e) => set("cogs", e.target.value.replace(/\D/g, ""))}
            />
          </Labeled>
          <Labeled label="Margin (%)">
            <input
              inputMode="numeric"
              className="field-input tabular-nums"
              placeholder="0"
              value={form.marginPct}
              onChange={(e) => set("marginPct", e.target.value.replace(/[^\d.]/g, ""))}
            />
          </Labeled>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-line bg-ink-overlay px-3 py-2 text-sm">
          <span className="text-content-secondary">Harga jual (auto)</span>
          <span className="font-bold tabular-nums text-content-primary">
            {computedValue > 0 ? formatIDR(computedValue) : "—"}
          </span>
        </div>
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
