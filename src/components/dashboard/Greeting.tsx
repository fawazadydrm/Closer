"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Sparkles } from "lucide-react";
import { formatDateLong } from "@/lib/format";

export default function Greeting() {
  const [now, setNow] = useState<Date | null>(null);

  // Hydrate after mount to avoid SSR/client date mismatch.
  useEffect(() => setNow(new Date()), []);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent">
        <Sparkles className="h-4 w-4" />
        Executive Summary
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-content-primary md:text-3xl">
            Semangat Fawaz, siap closing deal hari ini?
          </h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-content-secondary">
            <CalendarDays className="h-4 w-4 text-accent" />
            {now ? formatDateLong(now.toISOString()) : "Memuat tanggal…"}
          </p>
        </div>
      </div>
    </section>
  );
}
