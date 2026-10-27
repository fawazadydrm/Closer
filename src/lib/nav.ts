import {
  LayoutDashboard,
  Columns3,
  FolderOpen,
  BellRing,
  Users,
  Archive,
  type LucideIcon,
} from "lucide-react";

export type TabKey =
  | "dashboard"
  | "pipeline"
  | "contacts"
  | "documents"
  | "reminders"
  | "repository";

export interface NavItem {
  key: TabKey;
  label: string;
  /** Compact label for the mobile bottom bar where space is tight. */
  shortLabel: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", shortLabel: "Dashboard", icon: LayoutDashboard },
  { key: "pipeline", label: "Pipeline", shortLabel: "Pipeline", icon: Columns3 },
  { key: "contacts", label: "Contacts", shortLabel: "Kontak", icon: Users },
  { key: "documents", label: "Documents", shortLabel: "Docs", icon: FolderOpen },
  { key: "reminders", label: "Reminders", shortLabel: "Reminder", icon: BellRing },
  { key: "repository", label: "Repository", shortLabel: "Arsip", icon: Archive },
];
