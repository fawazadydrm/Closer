"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Deal,
  DealDocument,
  NewDealInput,
  NoteEntry,
  StageId,
  TaskReminder,
} from "@/lib/types";
import { INITIAL_DEALS, INITIAL_TASKS } from "@/lib/data";
import { sellingPrice, simulateFromHps, uid } from "@/lib/format";
import { db } from "@/lib/queries";
import { getSupabase } from "@/lib/supabase";
import { removeStoredPdf } from "@/lib/storage";

/** Lengkapi input minimal form deal jadi objek Deal utuh dengan default aman. */
export function normalizeDeal(input: NewDealInput): Deal {
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}T17:00:00.000Z`;
  const base: Deal = {
    id: input.id ?? uid("de"), // pre-generated when PDFs are uploaded with the deal
    title: input.title.trim() || "Tanpa Judul",
    company: input.company.trim() || "—",
    contact: {
      name: input.contact?.name?.trim() || "—",
      phone: input.contact?.phone?.trim() || "",
      role: input.contact?.role?.trim() || undefined,
    },
    value: input.value ?? 0,
    hps: input.hps ?? 0,
    cogs: input.cogs ?? 0,
    marginPct: input.marginPct ?? 0,
    stage: input.stage ?? "prospecting",
    priority: input.priority ?? "medium",
    dealType: input.dealType ?? "sales_langsung",
    landingPageUrl: input.landingPageUrl?.trim() ?? "",
    targetCloseDate: input.targetCloseDate ?? todayIso,
    industry: input.industry?.trim() || "Umum",
    owner: input.owner ?? "Fawaz",
    documents: input.documents ?? [],
    notes: input.notes ?? [],
    createdAt: new Date().toISOString(),
  };
  // HPS terisi → value & cogs adalah hasil simulasi (harga jual + bid COGS).
  if (base.hps > 0) {
    const sim = simulateFromHps(base.hps, base.marginPct);
    base.value = sim.sellingPrice;
    base.cogs = sim.cogsBid;
  } else {
    base.value = sellingPrice(base);
  }
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

/** Write-through persistence per mutation — returns success so the UI can
 *  reflect sync status (the pulsing "sinkron" indicator). */
function persistAction(
  action: CloserAction,
  stateRef: React.MutableRefObject<CloserState>
): Promise<boolean> | null {
  switch (action.type) {
    case "ADD_DEAL":
      return db.addDeal(action.deal);
    case "UPDATE_DEAL":
      return db.updateDeal(action.id, action.patch);
    case "MOVE_DEAL":
      return db.updateDeal(action.id, { stage: action.stage });
    case "DELETE_DEAL":
      return db.deleteDeal(action.id);
    case "ADD_NOTE":
      return db.addNote(action.dealId, {
        id: action.noteId,
        text: action.text,
        createdAt: new Date().toISOString(),
      });
    case "ADD_DOCUMENT":
      return db.addDocument(action.dealId, action.doc);
    case "REMOVE_DOCUMENT": {
      const doc: DealDocument | undefined = stateRef.current.deals
        .flatMap((d) => d.documents)
        .find((x) => x.id === action.docId);
      // Also delete the storage object behind real PDF uploads.
      if (doc?.source === "upload") void removeStoredPdf(doc.url);
      return db.removeDocument(action.docId);
    }
    case "ADD_TASK":
      return db.addTask(action.task);
    case "TOGGLE_TASK": {
      const t = stateRef.current.tasks.find((x) => x.id === action.id);
      return t ? db.toggleTask(action.id, !t.done) : Promise.resolve(true);
    }
    case "DELETE_TASK":
      return db.deleteTask(action.id);
    case "REPLACE":
      // Initial hydration only — nothing to persist.
      return null;
  }
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
  meta: { lastSyncedAt: string; syncing: number };
}

const CloserContext = createContext<CloserContextValue | null>(null);

export function CloserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(closerReducer, {
    deals: [],
    tasks: [],
  });
  const [loading, setLoading] = useState(true);
  // Timestamp of the last successful hydration — surfaced to the UI as
  // "data terakhir disinkronkan".
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => new Date().toISOString());

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        if (getSupabase() === null) {
          // No DB configured → start empty; the UI shows its empty states.
          dispatch({ type: "REPLACE", deals: INITIAL_DEALS, tasks: INITIAL_TASKS });
          if (!cancelled) {
            setLastSyncedAt(new Date().toISOString());
            setLoading(false);
          }
          return;
        }
        const { deals, tasks } = await db.loadDeals();
        if (cancelled) return;
        dispatch({ type: "REPLACE", deals, tasks });
        setLastSyncedAt(new Date().toISOString());
        setLoading(false);
      } catch (e) {
        console.error("[CLOSER] hydrate failed:", e);
        dispatch({ type: "REPLACE", deals: [], tasks: [] });
        if (!cancelled) {
          setLastSyncedAt(new Date().toISOString());
          setLoading(false);
        }
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Write-through on every mutation (optimistic UI stays as-is).
  // `syncing` counts in-flight DB writes — drives the live sync indicator.
  // Stable identity: reads latest state from a ref so the memo below doesn't
  // need to re-create dispatch on every state change.
  const [syncing, setSyncing] = useState(0);
  const syncingRef = useRef(0);
  const bumpSyncing = useCallback((delta: number) => {
    syncingRef.current = Math.max(0, syncingRef.current + delta);
    setSyncing(syncingRef.current);
  }, []);

  const stateRef = useRef(state);
  stateRef.current = state;
  const dispatchWithPersistence = useCallback(
    (action: CloserAction) => {
      dispatch(action);
      const pending = persistAction(action, stateRef);
      if (!pending) return;
      bumpSyncing(+1);
      pending
        .then((ok) => {
          if (ok) setLastSyncedAt(new Date().toISOString());
        })
        .finally(() => bumpSyncing(-1));
    },
    [bumpSyncing]
  );

  const value = useMemo<CloserContextValue>(
    () => ({
      ...state,
      dispatch: dispatchWithPersistence,
      dealById: (id) => state.deals.find((d) => d.id === id),
      loading,
      meta: { lastSyncedAt, syncing },
    }),
    [state, loading, lastSyncedAt, syncing, dispatchWithPersistence]
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
