import type { Deal, TaskReminder } from "./types";

// Seed data for the no-database mode (Supabase env vars unset).
// Intentionally empty — the app shows its real empty states instead of
// demo rows so nothing here can be mistaken for live pipeline data.

export const INITIAL_DEALS: Deal[] = [];
export const INITIAL_TASKS: TaskReminder[] = [];
