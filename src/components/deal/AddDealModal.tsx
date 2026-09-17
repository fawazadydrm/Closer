"use client";

import { useState, type FormEvent } from "react";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  Link2,
  Paperclip,
  Phone,
  Plus,
  Target,
  Trash2,
  User2,
  Wallet,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { normalizeDeal, useCloser } from "@/state/CloserContext";
import { useUI } from "@/state/UIContext";
import { PIPELINE_STAGES, DOC_CATEGORY_META } from "@/lib/stages";
import { formatIDR, uid } from "@/lib/format";
import type {
  DocCategory,
  NewDealInput,
  PipelineStage,
  Priority,
  StageId,
} from "@/lib/types";

type DocRow = { name: string; url: string; category: DocCategory };

const PRIORITIES: Priority[] = ["high", "medium", "low"];

export default function AddDealModal() {
  const { dispatch } = useCloser();
  const { isAddDealOpen, closeAddDeal, openDeal, showToast } = useUI();

  // ── Core (selalu tampil) ──
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [stage, setStage] = useState<PipelineStage>(PIPELINE_STAGES[0]);
  const [priority, setPriority] = useState<Priority>("medium");
  const [openMore, setOpenMore] = useState(false);

  // ── Detail lain (opsional) ──
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [cogs, setCogs] = useState("");
  const [marginPct, setMarginPct] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");

  const reset = () => {
    setTitle("");
    setCompany("");
    setStage(PIPELINE_STAGES[0]);
    setPriority("medium");
    setOpenMore(false);
    setContactName("");
    setContactRole("");
    setContactPhone("");
    setCogs("");
    setMarginPct("");
    setIndustry("");
    setTargetDate("");
    setDocs([]);
    setReminderTitle("");
    setReminderDate("");
  };

  const handleClose = () => {
    closeAddDeal();
    reset();
  };

  const addDocRow = () =>
    setDocs((d) => [...d, { name: "", url: "", category: "quotation" }]);

  const updateDoc = (i: number, patch: Partial<DocRow>) =>
    setDocs((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const removeDoc = (i: number) => setDocs((d) => d.filter((_, idx) => idx !== i));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const cogsNum = Math.max(0, Number(cogs) || 0);
    const marginNum = Math.max(0, Math.min(100, Number(marginPct) || 0));

    const input: NewDealInput = {
      title: title.trim(), // normalizeDeal memberi default "Tanpa Judul"
      company: company.trim(), // default "—"
      stage: stage.id as StageId,
      priority,
      cogs: cogsNum,
      marginPct: marginNum,
      industry: industry.trim(),
      targetCloseDate: targetDate ? new Date(`${targetDate}T17:00:00`).toISOString() : undefined,
    };
    if (contactName.trim() || contactPhone.trim() || contactRole.trim()) {
      input.contact = {
        name: contactName.trim(),
        phone: contactPhone.trim(),
        role: contactRole.trim() || undefined,
      };
    }

    const deal = normalizeDeal(input); // id dibuat di sini — jangan buat id terpisah
    dispatch({ type: "ADD_DEAL", deal });
    const dealId = deal.id;

    // Attach any filled document links
    docs
      .filter((d) => d.url.trim())
      .forEach((row) =>
        dispatch({
          type: "ADD_DOCUMENT",
          dealId,
          doc: {
            id: uid("dc"),
            name: row.name.trim() || row.url,
            category: row.category,
            url: row.url.trim(),
            source: "drive",
            uploadedAt: new Date().toISOString(),
          },
        })
      );

    // Optional follow-up reminder
    if (reminderTitle.trim() && reminderDate) {
      dispatch({
        type: "ADD_TASK",
        task: {
          id: uid("tk"),
          dealId,
          title: reminderTitle.trim(),
          dueAt: new Date(reminderDate).toISOString(),
          done: false,
          channel: "manual",
        },
      });
    }

    handleClose();
    openDeal(dealId);
    showToast(`Deal "${deal.title}" ditambahkan`);
  };

  // Live preview harga jual saat user mengisi COGS / margin
  const cogsNum = Math.max(0, Number(cogs) || 0);
  const marginNum = Math.max(0, Math.min(100, Number(marginPct) || 0));
  const preview = cogsNum > 0 ? Math.round(cogsNum * (1 + marginNum / 100)) : 0;

  return (
    <Modal
      open={isAddDealOpen}
      onClose={handleClose}
      title="Deal Baru"
      subtitle="Catat opportunity — detail lain bisa diisi nanti"
      footer={
        <>
          <button type="button" onClick={handleClose} className="btn-secondary">
            Batal
          </button>
          <button type="submit" form="add-deal-form" className="btn-primary">
            <Plus className="h-4 w-4" /> Simpan Deal
          </button>
        </>
      }
    >
      <form id="add-deal-form" onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Inti — selalu tampil */}
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-content-muted">
            <Target className="h-3.5 w-3.5 text-accent" /> Deal
          </h3>
          <Field label="Nama Proyek / Deal *">
            <input
              autoFocus
              required
              className="field-input"
              placeholder="cth: Pengadaan Smartboard SMPN 3 Bandung"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Client / Perusahaan *">
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
              <input
                required
                className="field-input pl-9"
                placeholder="PT. Contoh Sejahtera"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Tahapan Pipeline">
            <div className="flex flex-wrap gap-2">
              {PIPELINE_STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStage(s)}
                  className={
                    "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold leading-tight transition-colors " +
                    (stage.id === s.id
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-line bg-ink-surface text-content-secondary hover:border-line-muted hover:text-content-primary")
                  }
                >
                  {s.shortLabel}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Prioritas">
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={
                    "flex-1 rounded-lg border py-2 text-xs font-semibold capitalize transition-colors " +
                    (priority === p
                      ? p === "high"
                        ? "border-danger bg-danger-soft text-danger"
                        : p === "medium"
                        ? "border-warn bg-warn-soft text-warn"
                        : "border-line-muted bg-ink-overlay text-content-primary"
                      : "border-line bg-ink-surface text-content-secondary hover:text-content-primary")
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>
        </section>

        {/* 2. Detail lain (opsional) — collapsible */}
        <section className="border-t border-line pt-5">
          <button
            type="button"
            onClick={() => setOpenMore((v) => !v)}
            className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-widest text-content-muted hover:text-content-secondary"
          >
            <span>Detail lain (opsional)</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${openMore ? "rotate-180" : ""}`}
            />
          </button>

          {openMore && (
            <div className="mt-4 space-y-5">
              {/* Kontak */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-content-secondary">
                  <User2 className="h-3.5 w-3.5 text-stage-indigo" /> Contact Person
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Nama Kontak">
                    <input
                      className="field-input"
                      placeholder="Bpk/Ibu…"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </Field>
                  <Field label="Jabatan">
                    <input
                      className="field-input"
                      placeholder="Kepala Sekolah / Pengadaan"
                      value={contactRole}
                      onChange={(e) => setContactRole(e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="No. WhatsApp / Telepon">
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
                    <input
                      className="field-input pl-9"
                      inputMode="tel"
                      placeholder="0812-xxxx-xxxx"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </Field>
              </div>

              {/* Komersial */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-content-secondary">
                  <Wallet className="h-3.5 w-3.5 text-success" /> Harga
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="HPS / Harga Distributor (Rp)">
                    <input
                      className="field-input tabular-nums"
                      inputMode="numeric"
                      placeholder="0 — kosong dulu kalau belum tahu"
                      value={cogs}
                      onChange={(e) => setCogs(e.target.value.replace(/\D/g, ""))}
                    />
                  </Field>
                  <Field label="Margin (%)">
                    <input
                      className="field-input tabular-nums"
                      inputMode="numeric"
                      placeholder="cth: 20"
                      value={marginPct}
                      onChange={(e) => setMarginPct(e.target.value.replace(/[^\d.]/g, ""))}
                    />
                  </Field>
                </div>
                {preview > 0 ? (
                  <p className="rounded-lg border border-line bg-ink-surface px-3 py-2 text-sm">
                    <span className="text-content-muted">Harga jual perkiraan: </span>
                    <span className="font-bold tabular-nums text-content-primary">
                      {formatIDR(preview)}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-content-muted">
                    Kosongkan dulu kalau budget/HPS belum diketahui — bisa diisi di detail deal nanti.
                  </p>
                )}
              </div>

              {/* Info lain */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Industri">
                  <input
                    className="field-input"
                    placeholder="Pendidikan, HCKI, Elektronik…"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </Field>
                <Field label="Target Closing">
                  <input
                    type="date"
                    className="field-input"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </Field>
              </div>

              {/* Dokumen */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-content-secondary">
                    <Paperclip className="h-3.5 w-3.5 text-stage-cyan" /> Link Dokumen
                  </h4>
                  <button type="button" onClick={addDocRow} className="btn-ghost -mr-2 text-accent">
                    <Plus className="h-4 w-4" /> Tambah link
                  </button>
                </div>
                {docs.length === 0 ? (
                  <p className="flex items-center gap-2 rounded-lg border border-dashed border-line-muted px-3 py-3 text-xs text-content-muted">
                    <Link2 className="h-4 w-4" /> Bisa ditambahkan setelah deal dibuat.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {docs.map((row, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-line bg-ink-surface p-2 sm:grid-cols-[1fr_1.4fr_auto_auto]"
                      >
                        <input
                          className="field-input"
                          placeholder="Nama file"
                          value={row.name}
                          onChange={(e) => updateDoc(i, { name: e.target.value })}
                        />
                        <input
                          className="field-input sm:col-span-1"
                          placeholder="https://drive.google.com/…"
                          value={row.url}
                          onChange={(e) => updateDoc(i, { url: e.target.value })}
                        />
                        <select
                          className="field-input"
                          value={row.category}
                          onChange={(e) =>
                            updateDoc(i, { category: e.target.value as DocCategory })
                          }
                        >
                          {Object.entries(DOC_CATEGORY_META).map(([k, m]) => (
                            <option key={k} value={k}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeDoc(i)}
                          className="btn-ghost rounded-lg p-2 text-danger"
                          aria-label="Hapus link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reminder */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-content-secondary">
                  <CalendarDays className="h-3.5 w-3.5 text-warn" /> Follow-Up Reminder
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Kegiatan">
                    <input
                      className="field-input"
                      placeholder="cth: Follow up quotation"
                      value={reminderTitle}
                      onChange={(e) => setReminderTitle(e.target.value)}
                    />
                  </Field>
                  <Field label="Jadwal (tanggal & waktu)">
                    <input
                      type="datetime-local"
                      className="field-input"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}
        </section>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
