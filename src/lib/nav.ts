import {
  LayoutDashboard,
  Columns3,
  FolderOpen,
  BellRing,
  type LucideIcon,
} from "lucide-react";

export type TabKey = "dashboard" | "pipeline" | "documents" | "reminders";

export interface NavItem {
  key: TabKey;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "pipeline", label: "Pipeline", icon: Columns3 },
  { key: "documents", label: "Documents", icon: FolderOpen },
  { key: "reminders", label: "Reminders", icon: BellRing },
];
