import { DataSource } from "./types";
import { questionsForSource } from "./brsrQuestions";

/** Day 1 = 08-Apr-2026 (FY26 circulation date), shared with TopBar / Timeline. */
export function dayToDate(day: number): string {
  const d = new Date(2026, 3, 7);
  d.setDate(d.getDate() + day);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export type TrackerStatus = "pending" | "reminded" | "human_alert" | "submitted";

export interface TrackerRow {
  no: number;
  department: string;
  spoc: string;
  kpis: number;
  due: string;
  status: string;
  statusKind: TrackerStatus;
  submittedOn: string;
  followUps: string;
  flags: string;
  evidence: string;
}

const STATUS_LABEL: Record<TrackerStatus, string> = {
  pending: "Scheduled",
  reminded: "Chasing (email)",
  human_alert: "Human alert",
  submitted: "Submitted",
};

/** One tracker row per data source, computed live from current state. */
export function trackerRows(repSources: DataSource[]): TrackerRow[] {
  return repSources.map((s, i) => {
    const open = s.flags.filter((f) => f.status === "open").length;
    const resolved = s.flags.filter((f) => f.status !== "open").length;
    const submittedOn =
      s.status === "submitted"
        ? s.submittedAtTick != null
          ? `Day ${s.submittedAtTick} · ${dayToDate(s.submittedAtTick)}`
          : "received"
        : "—";
    const flags =
      s.status !== "submitted" ? "—" : open > 0 ? `${open} open` : resolved > 0 ? `${resolved} resolved` : "clean";
    return {
      no: i + 1,
      department: s.department,
      spoc: s.owner,
      kpis: questionsForSource(s).length || s.expectedFields.length,
      due: `Day ${s.dueTick} · ${dayToDate(s.dueTick)}`,
      status: STATUS_LABEL[s.status],
      statusKind: s.status,
      submittedOn,
      followUps: `${Math.min(s.remindersSent, 3)} / 3`,
      flags,
      evidence: s.evidence?.length ? s.evidence.join(", ") : "—",
    };
  });
}

export const TRACKER_COLUMNS = [
  "#",
  "Department",
  "SPOC / Data Owner",
  "KPIs",
  "Due Date",
  "Status",
  "Submitted On",
  "Follow-ups",
  "Flags",
  "Evidence Required",
] as const;
