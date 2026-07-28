"use client";

import { createContext, useContext, useMemo, useReducer, useCallback, ReactNode } from "react";
import { AgentEvent, DataSource, Report } from "./types";
import { seedReports, seedSources, submittedData } from "./seed";
import {
  advanceSource,
  runSourcePipeline,
  checkReportGeneration,
  forceGenerate,
  makeEvent,
  createReportInstance,
  assuranceEvents,
} from "./engine";

interface State {
  tick: number;
  reports: Report[];
  sources: DataSource[];
  events: AgentEvent[];
  /** Reports open as workspace tabs, in tab order. */
  openReportIds: string[];
  /** The report whose workspace is on screen; null = main deck. */
  activeReportId: string | null;
}

type Action =
  | { type: "ADVANCE" }
  | { type: "RESET" }
  | { type: "RESOLVE_FLAG"; flagId: string; mode: "approve" | "override"; value?: number | string }
  | { type: "FORCE_GENERATE"; reportId: string }
  | { type: "SIGN_REPORT"; reportId: string; name: string }
  | { type: "OPEN_REPORT"; reportId: string }
  | { type: "CLOSE_REPORT"; reportId: string }
  | { type: "SET_ACTIVE_REPORT"; reportId: string | null }
  | { type: "RENAME_REPORT"; reportId: string; name: string }
  | { type: "CREATE_REPORT"; name: string }
  | { type: "UPLOAD_SUBMIT"; sourceId: string; fileName: string; fields: Record<string, number | string> };

const freshState: State = {
  tick: 0,
  reports: seedReports,
  sources: seedSources,
  events: [],
  openReportIds: [],
  activeReportId: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADVANCE": {
      const newTick = state.tick + 1;
      const newEvents: AgentEvent[] = [];

      const nextSources = state.sources.map((src) => {
        const wasSubmitted = src.status === "submitted";
        const repName = state.reports.find((r) => r.id === src.reportId)?.name ?? "";
        const { src: advanced, events: e1 } = advanceSource(src, newTick, repName);
        newEvents.push(...e1);
        if (!wasSubmitted && advanced.status === "submitted") {
          const { src: processed, events: e2 } = runSourcePipeline(advanced, newTick);
          newEvents.push(...e2);
          return processed;
        }
        return advanced;
      });

      const { reports: nextReports, events: e3 } = checkReportGeneration(state.reports, nextSources, newTick);
      newEvents.push(...e3);

      const e4 = assuranceEvents(nextReports, nextSources, newTick, [...state.events, ...newEvents]);
      newEvents.push(...e4);

      return { ...state, tick: newTick, reports: nextReports, sources: nextSources, events: [...state.events, ...newEvents] };
    }

    case "RESOLVE_FLAG": {
      const newEvents: AgentEvent[] = [];
      const nextSources = state.sources.map((src) => {
        const flag = src.flags.find((f) => f.id === action.flagId);
        if (!flag) return src;
        const resolved = {
          ...flag,
          status: (action.mode === "approve" ? "approved" : "overridden") as "approved" | "overridden",
          resolvedValue: action.mode === "override" ? action.value : undefined,
        };
        newEvents.push(
          makeEvent(
            src.reportId,
            src.id,
            "flag_resolved",
            action.mode === "approve"
              ? `Human approved the flagged ${flag.type} value on "${flag.field.replace(/_/g, " ")}" (${src.name}) as submitted.`
              : `Human overrode "${flag.field.replace(/_/g, " ")}" (${src.name}) to ${action.value}.`,
            state.tick,
            "Human Reviewer"
          )
        );
        return { ...src, flags: src.flags.map((f) => (f.id === action.flagId ? resolved : f)) };
      });

      const { reports: nextReports, events: e2 } = checkReportGeneration(state.reports, nextSources, state.tick);
      newEvents.push(...e2);

      return { ...state, reports: nextReports, sources: nextSources, events: [...state.events, ...newEvents] };
    }

    case "FORCE_GENERATE": {
      const rep = state.reports.find((r) => r.id === action.reportId);
      if (!rep || rep.status === "generated" || rep.status === "generated_partial") return state;
      const { rep: generated, events } = forceGenerate(rep, state.sources, state.tick);
      return {
        ...state,
        reports: state.reports.map((r) => (r.id === action.reportId ? generated : r)),
        events: [...state.events, ...events],
      };
    }

    case "SIGN_REPORT": {
      const rep = state.reports.find((r) => r.id === action.reportId);
      if (!rep || rep.signedBy || (rep.status !== "generated" && rep.status !== "generated_partial")) return state;
      const evt = makeEvent(
        rep.id,
        undefined,
        "report_signed",
        `${action.name} digitally signed and released "${rep.name}". Archived to the knowledge hub.`,
        state.tick,
        "Human Reviewer"
      );
      return {
        ...state,
        reports: state.reports.map((r) =>
          r.id === action.reportId ? { ...r, signedBy: action.name, signedAtTick: state.tick } : r
        ),
        events: [...state.events, evt],
      };
    }

    case "OPEN_REPORT": {
      if (!state.reports.some((r) => r.id === action.reportId)) return state;
      const openReportIds = state.openReportIds.includes(action.reportId)
        ? state.openReportIds
        : [...state.openReportIds, action.reportId];
      return { ...state, openReportIds, activeReportId: action.reportId };
    }

    case "CLOSE_REPORT": {
      const openReportIds = state.openReportIds.filter((id) => id !== action.reportId);
      const activeReportId =
        state.activeReportId === action.reportId
          ? openReportIds[openReportIds.length - 1] ?? null
          : state.activeReportId;
      return { ...state, openReportIds, activeReportId };
    }

    case "SET_ACTIVE_REPORT":
      if (action.reportId !== null && !state.openReportIds.includes(action.reportId)) return state;
      return { ...state, activeReportId: action.reportId };

    case "RENAME_REPORT": {
      const name = action.name.trim();
      if (!name) return state;
      return {
        ...state,
        reports: state.reports.map((r) => (r.id === action.reportId ? { ...r, name } : r)),
      };
    }

    case "UPLOAD_SUBMIT": {
      const src = state.sources.find((s) => s.id === action.sourceId);
      if (!src || src.status === "submitted") return state;
      // Register the parsed sheet as this source's data, then run the normal pipeline on it.
      submittedData[src.id] = action.fields as Record<string, number>;
      const newEvents: AgentEvent[] = [
        makeEvent(
          src.reportId,
          src.id,
          "submitted",
          `"${src.name}" received — ${src.owner} uploaded "${action.fileName}" (${Object.keys(action.fields).length} field(s) detected). Queued for extraction.`,
          state.tick,
          "Collection Agent"
        ),
      ];
      const { src: processed, events: e2 } = runSourcePipeline({ ...src, status: "submitted", submittedAtTick: state.tick }, state.tick);
      newEvents.push(...e2);
      const nextSources = state.sources.map((s) => (s.id === src.id ? processed : s));
      const { reports: nextReports, events: e3 } = checkReportGeneration(state.reports, nextSources, state.tick);
      newEvents.push(...e3);
      return { ...state, reports: nextReports, sources: nextSources, events: [...state.events, ...newEvents] };
    }

    case "CREATE_REPORT": {
      const { report, sources } = createReportInstance(action.name.trim() || "Untitled Report", state.tick);
      return {
        ...state,
        reports: [...state.reports, report],
        sources: [...state.sources, ...sources],
        openReportIds: [...state.openReportIds, report.id],
        activeReportId: report.id,
      };
    }

    case "RESET":
      return {
        ...freshState,
        // The prior-year filed report (rep-fy25) is a fixed baseline — leave it as seeded.
        reports: seedReports.map((r) =>
          r.id === "rep-fy25"
            ? r
            : { ...r, status: "collecting" as const, generatedAtTick: undefined, sections: undefined, gaps: undefined, signedBy: undefined, signedAtTick: undefined }
        ),
        sources: seedSources.map((s) =>
          s.reportId === "rep-fy25"
            ? s
            : { ...s, status: "pending" as const, remindersSent: 0, submittedFields: undefined, flags: [] }
        ),
      };

    default:
      return state;
  }
}

/**
 * The app loads with the FY26 collection cycle already run to completion — all
 * data present, with the realistic exceptions intact (CSR no-show, open flags,
 * the clean ESG report auto-generated). No manual "Advance Day" needed.
 */
const END_TICK = 42;
const initialState: State = (() => {
  let s = freshState;
  for (let i = 0; i < END_TICK; i++) s = reducer(s, { type: "ADVANCE" });
  return s;
})();

interface StoreValue extends State {
  advanceDay: () => void;
  reset: () => void;
  resolveFlag: (flagId: string, mode: "approve" | "override", value?: number | string) => void;
  forceGenerateReport: (reportId: string) => void;
  signReport: (reportId: string, name: string) => void;
  openReport: (reportId: string) => void;
  closeReport: (reportId: string) => void;
  setActiveReport: (reportId: string | null) => void;
  renameReport: (reportId: string, name: string) => void;
  createReport: (name: string) => void;
  uploadSubmit: (sourceId: string, fileName: string, fields: Record<string, number | string>) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const advanceDay = useCallback(() => dispatch({ type: "ADVANCE" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const resolveFlag = useCallback(
    (flagId: string, mode: "approve" | "override", value?: number | string) =>
      dispatch({ type: "RESOLVE_FLAG", flagId, mode, value }),
    []
  );
  const forceGenerateReport = useCallback(
    (reportId: string) => dispatch({ type: "FORCE_GENERATE", reportId }),
    []
  );
  const signReport = useCallback(
    (reportId: string, name: string) => dispatch({ type: "SIGN_REPORT", reportId, name }),
    []
  );
  const openReport = useCallback((reportId: string) => dispatch({ type: "OPEN_REPORT", reportId }), []);
  const closeReport = useCallback((reportId: string) => dispatch({ type: "CLOSE_REPORT", reportId }), []);
  const setActiveReport = useCallback(
    (reportId: string | null) => dispatch({ type: "SET_ACTIVE_REPORT", reportId }),
    []
  );
  const renameReport = useCallback(
    (reportId: string, name: string) => dispatch({ type: "RENAME_REPORT", reportId, name }),
    []
  );
  const createReport = useCallback((name: string) => dispatch({ type: "CREATE_REPORT", name }), []);
  const uploadSubmit = useCallback(
    (sourceId: string, fileName: string, fields: Record<string, number | string>) =>
      dispatch({ type: "UPLOAD_SUBMIT", sourceId, fileName, fields }),
    []
  );

  const value = useMemo(
    () => ({
      ...state,
      advanceDay,
      reset,
      resolveFlag,
      forceGenerateReport,
      signReport,
      openReport,
      closeReport,
      setActiveReport,
      renameReport,
      createReport,
      uploadSubmit,
    }),
    [state, advanceDay, reset, resolveFlag, forceGenerateReport, signReport, openReport, closeReport, setActiveReport, renameReport, createReport, uploadSubmit]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
