"use client";

import { useState } from "react";
import { BellRing, Loader2, CheckCircle2 } from "lucide-react";
import { sendTelegramReminder, type ReminderPayload } from "@/lib/telegram";
import { useUI } from "@/state/UIContext";

interface ReminderButtonProps extends ReminderPayload {
  label?: string;
  className?: string;
}

/** Fires an HTML-formatted reminder to Telegram via /api/send-reminder. */
export default function ReminderButton({
  label = "Kirim Reminder Telegram",
  className = "",
  ...payload
}: ReminderButtonProps) {
  const { showToast } = useUI();
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const fire = async () => {
    if (state === "sending") return;
    setState("sending");
    const res = await sendTelegramReminder(payload);
    showToast(res.message);
    setState(res.ok ? "sent" : "idle");
    if (res.ok) setTimeout(() => setState("idle"), 2500);
  };

  return (
    <button
      onClick={fire}
      disabled={state === "sending"}
      className={
        "btn-secondary min-h-[38px] px-3 py-1.5 text-xs " +
        (state === "sent"
          ? "!border-success/40 !bg-success/10 !text-success "
          : "") +
        className
      }
    >
      {state === "sending" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {state === "sent" && <CheckCircle2 className="h-3.5 w-3.5" />}
      {state === "idle" && <BellRing className="h-3.5 w-3.5" />}
      {state === "sent" ? "Terkirim" : label}
    </button>
  );
}
