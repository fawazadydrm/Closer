"use client";

import AppShell from "@/components/layout/AppShell";
import DashboardView from "@/components/dashboard/DashboardView";
import PipelineView from "@/components/pipeline/PipelineView";
import RemindersView from "@/components/reminders/RemindersView";
import DocumentsView from "@/components/documents/DocumentsView";
import { useUI } from "@/state/UIContext";

export default function Page() {
  const { activeTab } = useUI();

  return (
    <AppShell>
      {activeTab === "dashboard" && <DashboardView />}
      {activeTab === "pipeline" && <PipelineView />}
      {activeTab === "reminders" && <RemindersView />}
      {activeTab === "documents" && <DocumentsView />}
    </AppShell>
  );
}
