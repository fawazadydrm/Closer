// Client helper for the /api/send-reminder route (Task 9).

export interface ReminderPayload {
  dealId?: string;
  taskId?: string;
  title: string;
  company?: string;
  dueAt?: string;
}

export async function sendTelegramReminder(
  payload: ReminderPayload
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("/api/send-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: data?.error ?? "Gagal mengirim reminder." };
    }
    return { ok: true, message: data?.message ?? "Reminder terkirim ke Telegram." };
  } catch {
    return { ok: false, message: "Koneksi ke server gagal." };
  }
}
