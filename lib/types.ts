export type Frequency = "weekly" | "monthly" | "quarterly" | "one-time";

export type Channel = "email" | "teams";

export interface CommPayload {
  channel: Channel;
  to: string;
  subject?: string;
  body: string;
}

export type SourceStatus = "pending" | "reminded" | "human_alert" | "submitted";

export type FlagType = "validation" | "reconciliation";
export type FlagStatus = "open" | "approved" | "overridden";

export interface Flag {
  id: string;
  sourceId: string;
  reportId: string;
  type: FlagType;
  field: string;
  detail: string;
  status: FlagStatus;
  extractedValue?: number | string;
  referenceValue?: number | string;
  resolvedValue?: number | string;
}

export interface DataSource {
  id: string;
  reportId: string;
  label: string; // Data 1, Data 2 ...
  name: string;
  department: string;
  owner: string;
  dueTick: number;
  submitAtTick: number | null; // null = never submits (demo: unresponsive owner)
  status: SourceStatus;
  remindersSent: number;
  expectedFields: string[];
  submittedFields?: Record<string, number | string>;
  flags: Flag[];
  /** Backup documents the SPOC must attach as proof (BRSR assurance requirement). */
  evidence?: string[];
  /** BRSR principle / framework clause this source feeds, e.g. "P6 — Environment". */
  principle?: string;
}

export type ReportStatus = "collecting" | "blocked" | "generated" | "generated_partial";

export interface ReportSection {
  sourceName: string;
  department: string;
  owner: string;
  values: Record<string, number | string>;
  note?: string;
}

export type AssuranceLevel = "none" | "internal" | "limited" | "reasonable";

export interface Report {
  id: string;
  name: string;
  project: string;
  frequency: Frequency;
  status: ReportStatus;
  /** Governing regulation / framework, e.g. "SEBI LODR Reg. 34(2)(f)". */
  regulation?: string;
  /** Assurance level the data must survive. */
  assurance?: AssuranceLevel;
  generatedAtTick?: number;
  sections?: ReportSection[];
  gaps?: string[];
  signedBy?: string;
  signedAtTick?: number;
}

export type EventKind =
  | "reminder_sent"
  | "human_alert"
  | "submitted"
  | "extraction_done"
  | "validation_flag"
  | "reconciliation_flag"
  | "reconciliation_done"
  | "flag_resolved"
  | "report_generated"
  | "report_signed";

export interface AgentEvent {
  id: string;
  sourceId?: string;
  reportId: string;
  kind: EventKind;
  message: string;
  timestamp: number; // simulated tick
  actor:
    | "Collection Agent"
    | "Extraction Agent"
    | "Validation Agent"
    | "Reconciliation Agent"
    | "Reporting Agent"
    | "Human Reviewer";
  comm?: CommPayload;
}
