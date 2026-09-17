"use client";

import Greeting from "./Greeting";
import KpiGrid from "./KpiGrid";
import DailyActionBanner from "./DailyActionBanner";
import PipelineSnapshot from "./PipelineSnapshot";

export default function DashboardView() {
  return (
    <div className="space-y-5 md:space-y-6">
      <Greeting />
      <KpiGrid />
      <DailyActionBanner />
      <PipelineSnapshot />
    </div>
  );
}
