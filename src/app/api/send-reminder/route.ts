import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ReminderBody {
  dealId?: string;
  taskId?: string;
  title?: string;
  company?: string;
  dueAt?: string;
}

const TELEGRAM_API = "https://api.telegram.org";

function buildMessage(b: ReminderBody): string {
  const lines = [`🔔 <b>CLOSER — Follow-Up Reminder</b>`, "", `📌 ${b.title ?? "—"}`];
  if (b.company) lines.push(`🏢 ${b.company}`);
  if (b.dueAt) {
    const when = new Date(b.dueAt);
    if (!Number.isNaN(when.getTime())) {
      lines.push(
        `🗓 ${new Intl.DateTimeFormat("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(when)} WIB`
      );
    }
  }
  lines.push("", `Ditugaskan ke: Fawaz`);
  return lines.join("\n");
}

function isValidDate(iso?: string): boolean {
  if (!iso) return true; // optional
  return !Number.isNaN(new Date(iso).getTime());
}

export async function POST(req: Request) {
  let body: ReminderBody;
  try {
    body = (await req.json()) as ReminderBody;
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON valid." }, { status: 400 });
  }

  if (!body.title || !body.title.trim()) {
    return NextResponse.json({ error: "Field 'title' wajib diisi." }, { status: 422 });
  }
  if (!isValidDate(body.dueAt)) {
    return NextResponse.json({ error: "Field 'dueAt' bukan tanggal valid." }, { status: 422 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const text = buildMessage(body);

  // No credentials configured → dry-run so the UI still works during local dev.
  if (!token || !chatId) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      message: "Reminder dicatat (Telegram belum dikonfigurasi — set TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID).",
      preview: text,
    });
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      // don't hang the request if Telegram is slow
      signal: AbortSignal.timeout(8000),
    });

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      description?: string;
    };

    if (!res.ok || !data.ok) {
      return NextResponse.json(
        { ok: false, error: data.description ?? "Telegram menolak permintaan." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, message: "Reminder terkirim ke Telegram." });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `Gagal menghubungi Telegram: ${msg}` },
      { status: 502 }
    );
  }
}
