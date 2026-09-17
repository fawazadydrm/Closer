"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { Deal, NewDealInput, NoteEntry, StageId, TaskReminder } from "@/lib/types";
import { INITIAL_DEALS, INITIAL_TASKS } from "@/lib/data";
import { sellingPrice, uid } from "@/lib/format";
import { db } from "@/lib/queries";
import { getSupabase } from "@/lib/supabase";

/** Lengkapi input minimal form deal jadi objek Deal utuh dengan default aman. */
export function normalizeDeal(input: NewDealInput): Deal {
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}T17:00:00.000Z`;
  const base: Deal = {
    id: uid("de"),
    title: input.title.trim() || "Tanpa Judul",
    company: input.company.trim() || "—",
    contact: {
      name: input.contact?.name?.trim() || "—",
      phone: input.contact?.phone?.trim() || "",
      role: input.contact?.role?.trim() || undefined,
    },
    value: input.value ?? 0,
    cogs: input.cogs ?? 0,
    marginPct: input.marginPct ?? 0,
    stage: input.stage ?? "prospecting",
    priority: input.priority ?? "medium",
    targetCloseDate: input.targetCloseDate ?? todayIso,
    industry: input.industry?.trim() || "Umum",
    owner: input.owner ?? "Fawaz",
    documents: input.documents ?? [],
    notes: input.notes ?? [],
    createdAt: new Date().toISOString(),
  };
  // Harga jual selalu sinkron dengan rumus COGS × margin.
  base.value = sellingPrice(base);
  return base;
}

// ── Actions ───────────────────────────────────────────────────
export type CloserAction =
  | { type: "REPLACE"; deals: Deal[]; tasks: TaskReminder[] }
  | { type: "ADD_DEAL"; deal: Deal }
  | { type: "UPDATE_DEAL"; id: string; patch: Partial<Deal> }
  | { type: "MOVE_DEAL"; id: string; stage: StageId }
  | { type: "DELETE_DEAL"; id: string }
  | { type: "ADD_NOTE"; dealId: string; text: string; noteId: string }
  | { type: "ADD_DOCUMENT"; dealId: string; doc: Deal["documents"][number] }
  | { type: "REMOVE_DOCUMENT"; dealId: string; docId: string }
  | { type: "ADD_TASK"; task: TaskReminder }
  | { type: "TOGGLE_TASK"; id: string }
  | { type: "DELETE_TASK"; id: string };

interface CloserState {
  deals: Deal[];
  tasks: TaskReminder[];
}

// ── Reducer ───────────────────────────────────────────────────
function closerReducer(state: CloserState, action: CloserAction): CloserState {
  switch (action.type) {
    case "REPLACE":
      return { deals: action.deals, tasks: action.tasks };

    case "ADD_DEAL":
      return { ...state, deals: [action.deal, ...state.deals] };

    case "UPDATE_DEAL":
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === action.id ? { ...d, ...action.patch } : d
        ),
      };

    case "MOVE_DEAL":
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === action.id ? { ...d, stage: action.stage } : d
        ),
      };

    case "DELETE_DEAL":
      return {
        deals: state.deals.filter((d) => d.id !== action.id),
        tasks: state.tasks.filter((t) => t.dealId !== action.id),
      };

    case "ADD_NOTE":
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === action.dealId
            ? {
                ...d,
                notes: [
                  {
                    id: action.noteId,
                    text: action.text,
                    createdAt: new Date().toISOString(),
                  } as NoteEntry,
                  ...d.notes,
                ],
              }
            : d
        ),
      };

    case "ADD_DOCUMENT":
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === action.dealId
            ? { ...d, documents: [...d.documents, action.doc] }
            : d
        ),
      };

    case "REMOVE_DOCUMENT":
      return {
        ...state,
        deals: state.deals.map((d) =>
          d.id === action.dealId
            ? { ...d, documents: d.documents.filter((x) => x.id !== action.docId) }
            : d
        ),
      };

    case "ADD_TASK":
      return { ...state, tasks: [...state.tasks, action.task] };

    case "TOGGLE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t
        ),
      };

    case "DELETE_TASK":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────
interface CloserContextValue extends CloserState {
  dispatch: React.Dispatch<CloserAction>;
  dealById: (id: string) => Deal | undefined;
  loading: boolean;
}

const CloserContext = createContext<CloserContextValue | null>(null);

export function CloserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(closerReducer, {
    deals: [],
    tasks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        if (getSupabase() === null) {
          // No DB configured → seed dummy so the UI stays alive in dev.
          dispatch({ type: "REPLACE", deals: INITIAL_DEALS, tasks: INITIAL_TASKS });
          if (!cancelled) setLoading(false);
          return;
        }
        const { deals, tasks } = await db.loadDeals();
        if (cancelled) return;
        // Begin empty: if DB is truly empty, keep it empty (no dummy fallback).
        dispatch({ type: "REPLACE", deals, tasks });
        setLoading(false);
      } catch (e) {
        console.error("[CLOSER] hydrate failed:", e);
        dispatch({ type: "REPLACE", deals: INITIAL_DEALS, tasks: INITIAL_TASKS });
        if (!cancelled) setLoading(false);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Write-through on every mutation (optimistic UI stays as-is).
  const dispatchWithPersistence = (action: CloserAction) => {
    switch (action.type) {
      case "ADD_DEAL":
        dispatch(action);
        db.addDeal(action.deal);
        break;
      case "UPDATE_DEAL":
        dispatch(action);
        db.updateDeal(action.id, action.patch);
        break;
      case "MOVE_DEAL":
        dispatch(action);
        db.updateDeal(action.id, { stage: action.stage });
        break;
      case "DELETE_DEAL":
        dispatch(action);
        db.deleteDeal(action.id);
        break;
      case "ADD_NOTE":
        dispatch(action);
        db.addNote(action.dealId, {
          id: action.noteId,
          text: action.text,
          createdAt: new Date().toISOString(),
        });
        break;
      case "ADD_DOCUMENT":
        dispatch(action);
        db.addDocument(action.dealId, action.doc);
        break;
      case "REMOVE_DOCUMENT":
        dispatch(action);
        db.removeDocument(action.docId);
        break;
      case "ADD_TASK":
        dispatch(action);
        db.addTask(action.task);
        break;
      case "TOGGLE_TASK": {
        const t = state.tasks.find((x) => x.id === action.id);
        dispatch(action);
        if (t) db.toggleTask(action.id, !t.done);
        break;
      }
      case "DELETE_TASK":
        dispatch(action);
        db.deleteTask(action.id);
        break;
      case "REPLACE":
        // Initial hydration only — nothing to persist.
        dispatch(action);
        break;
    }
  };

  const value = useMemo<CloserContextValue>(
    () => ({
      ...state,
      dispatch: dispatchWithPersistence,
      dealById: (id) => state.deals.find((d) => d.id === id),
      loading,
    }),
    [state, loading]
  );

  return (
    <CloserContext.Provider value={value}>{children}</CloserContext.Provider>
  );
}

export function useCloser(): CloserContextValue {
  const ctx = useContext(CloserContext);
  if (!ctx) throw new Error("useCloser must be used within <CloserProvider>");
  return ctx;
}
