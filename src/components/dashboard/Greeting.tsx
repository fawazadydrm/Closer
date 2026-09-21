"use client";

import { todayISO } from "@/lib/format";

/** Time-aware greeting + today's date in Indonesian locale. */
export default function Greeting() {
  const h = new Date().getHours();
  const part =
    h < 11 ? "Pagi" : h < 15 ? "Siang" : h < 19 ? "Sore" : "Malam";
  const today = new Date(todayISO() + "T00:00:00");

  return (
    <section className="min-w-0">
      <p className="text-sm font-medium text-content-secondary md:text-base">
        {part}, <span className="font-semibold text-accent">Fawaz</span>
      </p>
      <h2 className="mt-0.5 text-xl font-extrabold tracking-tight text-content-primary sm:text-2xl lg:text-3xl">
        Ringkasan Pipeline
      </h2>
      <p className="mt-1 text-xs text-content-muted md:text-sm">
        {today.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </section>
  );
}
