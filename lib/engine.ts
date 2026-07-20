import { AgentEvent, CommPayload, DataSource, EventKind, Flag, Report, ReportSection } from "./types";
import { submittedData, erpSnapshot } from "./seed";

let eventCounter = 0;
export function nextEventId() {
  eventCounter += 1;
  return `evt-${eventCounter}`;
}
let flagCounter = 0;
function nextFlagId() {
  flagCounter += 1;
  return `flag-${flagCounter}`;
}

export function makeEvent(
  reportId: string,
  sourceId: string | undefined,
  kind: EventKind,
  message: string,
  tick: number,
  actor: AgentEvent["actor"],
  comm?: CommPayload
): AgentEvent {
  return { id: nextEventId(), reportId, sourceId, kind, message, timestamp: tick, actor, comm };
}

function firstName(owner: string): string {
  return owner.split(" ")[0].replace(".", "");
}

/**
 * One simulated day of the Collection Agent for a single data source.
 * Ladder: due day email #1 → +1 email #2 → +2 email #3 → +3 human alert (Teams), then silence.
 */
export function advanceSource(
  src: DataSource,
  tick: number
): { src: DataSource; events: AgentEvent[] } {
  const events: AgentEvent[] = [];

  if (src.status === "submitted") return { src, events };

  // Submission scripted per source for a repeatable demo
  if (src.submitAtTick !== null && tick >= src.submitAtTick) {
    events.push(
      makeEvent(
        src.reportId,
        src.id,
        "submitted",
        `${src.owner} submitted "${src.name}" (${src.label}).`,
        tick,
        "Collection Agent"
      )
    );
    return { src: { ...src, status: "submitted" }, events };
  }

  const daysPastDue = tick - src.dueTick;
  if (daysPastDue < 0) return { src, events };

  if (daysPastDue <= 2) {
    const n = daysPastDue + 1;
    const overdueTxt =
      daysPastDue === 0 ? "is due today" : `is ${daysPastDue} day${daysPastDue > 1 ? "s" : ""} overdue`;
    const comm: CommPayload = {
      channel: "email",
      to: src.owner,
      subject:
        n === 1
          ? `Reminder: "${src.name}" is due today`
          : `Follow-up #${n}: "${src.name}" ${overdueTxt}`,
      body: `Hi ${firstName(src.owner)},\n\n${
        n === 1
          ? `Your submission "${src.name}" (${src.label} for the ${src.department} section) is due today.`
          : `This is follow-up #${n} — "${src.name}" ${overdueTxt}. The report it feeds cannot be generated until your data arrives.`
      }\n\nPlease upload it to the portal or reply with the attachment.\n\n— FlowOS Collection Agent`,
    };
    events.push(
      makeEvent(
        src.reportId,
        src.id,
        "reminder_sent",
        `Email follow-up #${n} sent to ${src.owner} — "${src.name}" ${overdueTxt}.`,
        tick,
        "Collection Agent",
        comm
      )
    );
    return { src: { ...src, status: "reminded", remindersSent: src.remindersSent + 1 }, events };
  }

  if (daysPastDue === 3) {
    const comm: CommPayload = {
      channel: "teams",
      to: "Operations Lead",
      body: `🔔 Human intervention needed: "${src.name}" (${src.label}, owner: ${src.owner}, ${src.department}) is 3 days overdue after 3 email follow-ups. The dependent report is blocked. Please chase manually or decide on partial generation.`,
    };
    events.push(
      makeEvent(
        src.reportId,
        src.id,
        "human_alert",
        `Alert raised to a human — "${src.name}" is 3 days overdue; email follow-ups exhausted.`,
        tick,
        "Collection Agent",
        comm
      )
    );
    return { src: { ...src, status: "human_alert", remindersSent: src.remindersSent + 1 }, events };
  }

  // Ladder exhausted — a human owns it now; the agent stops chasing.
  return { src, events };
}

/** Runs once, right after a source is submitted: extraction → validation → reconciliation. */
export function runSourcePipeline(
  src: DataSource,
  tick: number
): { src: DataSource; events: AgentEvent[] } {
  const events: AgentEvent[] = [];
  const fields = submittedData[src.id] ?? {};
  const flags: Flag[] = [];

  events.push(
    makeEvent(
      src.reportId,
      src.id,
      "extraction_done",
      `Extracted ${Object.keys(fields).length} field(s) from "${src.name}" (OCR + parsing).`,
      tick,
      "Extraction Agent"
    )
  );

  // Validation: every expected field must be present
  const missing = src.expectedFields.filter((f) => !(f in fields));
  for (const f of missing) {
    flags.push({
      id: nextFlagId(),
      sourceId: src.id,
      reportId: src.reportId,
      type: "validation",
      field: f,
      detail: `Required field "${f.replace(/_/g, " ")}" is missing from the submission (${src.expectedFields.length - missing.length} of ${src.expectedFields.length} fields present).`,
      status: "open",
    });
  }
  if (missing.length > 0) {
    events.push(
      makeEvent(
        src.reportId,
        src.id,
        "validation_flag",
        `Validation: ${src.expectedFields.length - missing.length} of ${src.expectedFields.length} required fields present in "${src.name}" — flagged ${missing.length} missing.`,
        tick,
        "Validation Agent"
      )
    );
  }

  // Reconciliation vs mock ERP snapshot
  const erp = erpSnapshot[src.id] ?? {};
  let mismatches = 0;
  for (const [key, val] of Object.entries(fields)) {
    const refVal = erp[key];
    if (refVal !== undefined && val !== refVal) {
      mismatches++;
      const pct = ((val - refVal) / refVal) * 100;
      flags.push({
        id: nextFlagId(),
        sourceId: src.id,
        reportId: src.reportId,
        type: "reconciliation",
        field: key,
        detail: `Submitted ${val} vs ERP ${refVal} (${pct > 0 ? "+" : ""}${pct.toFixed(1)}%).`,
        status: "open",
        extractedValue: val,
        referenceValue: refVal,
      });
    }
  }
  if (mismatches > 0) {
    events.push(
      makeEvent(
        src.reportId,
        src.id,
        "reconciliation_flag",
        `Reconciliation: ${mismatches} mismatch(es) between "${src.name}" and the ERP snapshot — routed to human review.`,
        tick,
        "Reconciliation Agent"
      )
    );
  } else {
    events.push(
      makeEvent(
        src.reportId,
        src.id,
        "reconciliation_done",
        `"${src.name}" reconciled cleanly against the ERP snapshot.`,
        tick,
        "Reconciliation Agent"
      )
    );
  }

  return { src: { ...src, submittedFields: fields, flags }, events };
}

/** Final value for a field after human resolution. */
function finalValue(src: DataSource, field: string): number | string | undefined {
  const flag = src.flags.find((f) => f.field === field);
  if (flag && flag.status === "overridden" && flag.resolvedValue !== undefined) return flag.resolvedValue;
  return src.submittedFields?.[field];
}

function buildSections(sources: DataSource[]): ReportSection[] {
  return sources
    .filter((s) => s.status === "submitted")
    .map((s) => {
      const values: Record<string, number | string> = {};
      for (const f of s.expectedFields) {
        const v = finalValue(s, f);
        if (v !== undefined) values[f] = v;
      }
      const overrides = s.flags.filter((f) => f.status === "overridden").length;
      const approved = s.flags.filter((f) => f.status === "approved").length;
      return {
        sourceName: `${s.label} · ${s.name}`,
        department: s.department,
        owner: s.owner,
        values,
        note:
          overrides + approved > 0
            ? `${overrides > 0 ? `${overrides} value(s) corrected by human review. ` : ""}${approved > 0 ? `${approved} flagged value(s) approved as submitted.` : ""}`.trim()
            : undefined,
      };
    });
}

/**
 * The generation gate: a report generates only when ALL sources are submitted
 * AND every flag is resolved. Returns updated reports plus generation events.
 */
export function checkReportGeneration(
  reports: Report[],
  sources: DataSource[],
  tick: number
): { reports: Report[]; events: AgentEvent[] } {
  const events: AgentEvent[] = [];
  const nextReports = reports.map((rep) => {
    if (rep.status === "generated" || rep.status === "generated_partial") return rep;

    const repSources = sources.filter((s) => s.reportId === rep.id);
    const allSubmitted = repSources.every((s) => s.status === "submitted");
    const openFlags = repSources.flatMap((s) => s.flags).filter((f) => f.status === "open");

    if (allSubmitted && openFlags.length === 0) {
      events.push(
        makeEvent(
          rep.id,
          undefined,
          "report_generated",
          `All ${repSources.length} data sources collected, validated and reconciled — "${rep.name}" generated from template.`,
          tick,
          "Reporting Agent"
        )
      );
      return {
        ...rep,
        status: "generated" as const,
        generatedAtTick: tick,
        sections: buildSections(repSources),
        gaps: [],
      };
    }

    if (allSubmitted && openFlags.length > 0) {
      return { ...rep, status: "blocked" as const };
    }
    return rep;
  });

  return { reports: nextReports, events };
}

/**
 * Hybrid progress %: stage-weighted, item-based fill inside each stage.
 * Collection 45 · checks (flag resolution) 25 · generation 20 · sign-off 10.
 */
export function reportProgress(rep: Report, sources: DataSource[]): number {
  const repSources = sources.filter((s) => s.reportId === rep.id);
  if (repSources.length === 0) return 0;

  const submitted = repSources.filter((s) => s.status === "submitted");
  const collect = (submitted.length / repSources.length) * 45;

  // A submitted source is "clean" in proportion to its resolved flags (no flags = fully clean).
  const checkFill = submitted.reduce((acc, s) => {
    if (s.flags.length === 0) return acc + 1;
    return acc + s.flags.filter((f) => f.status !== "open").length / s.flags.length;
  }, 0);
  const checks = (checkFill / repSources.length) * 25;

  const generated = rep.status === "generated" || rep.status === "generated_partial" ? 20 : 0;
  const signed = rep.signedBy ? 10 : 0;

  return Math.min(100, Math.round(collect + checks + generated + signed));
}

let reportCounter = 100;
let sourceCounter = 100;

/**
 * Instantiate a fresh report from the demo flow template: three sources with
 * scripted submissions relative to the current tick, data pre-registered so the
 * extraction/validation/reconciliation pipeline runs cleanly (one recon flag for drama).
 */
export function createReportInstance(
  name: string,
  tick: number
): { report: Report; sources: DataSource[] } {
  reportCounter += 1;
  const repId = `rep-${reportCounter}`;

  const template: { name: string; department: string; owner: string; fields: Record<string, number>; erp: Record<string, number>; dueOffset: number; submitOffset: number }[] = [
    { name: "Sales Summary", department: "Sales", owner: "R. Menon", fields: { revenue_lakhs: 512, units_sold: 1140 }, erp: { revenue_lakhs: 512, units_sold: 1140 }, dueOffset: 1, submitOffset: 1 },
    { name: "Production Output", department: "Production", owner: "D. Rao", fields: { output_units: 13800, downtime_hours: 9 }, erp: { output_units: 13800, downtime_hours: 9 }, dueOffset: 1, submitOffset: 2 },
    { name: "Inventory Position", department: "Warehouse", owner: "S. Bhatt", fields: { closing_stock: 9100, variance_pct: 2 }, erp: { closing_stock: 8700, variance_pct: 2 }, dueOffset: 2, submitOffset: 3 },
  ];

  const sources: DataSource[] = template.map((t, i) => {
    sourceCounter += 1;
    const id = `ds-${sourceCounter}`;
    submittedData[id] = t.fields;
    erpSnapshot[id] = t.erp;
    return {
      id,
      reportId: repId,
      label: `Data ${i + 1}`,
      name: t.name,
      department: t.department,
      owner: t.owner,
      dueTick: tick + t.dueOffset,
      submitAtTick: tick + t.submitOffset,
      status: "pending",
      remindersSent: 0,
      expectedFields: Object.keys(t.fields),
      flags: [],
    };
  });

  const report: Report = {
    id: repId,
    name,
    project: "Custom Flow",
    frequency: "one-time",
    status: "collecting",
  };

  return { report, sources };
}

/** Human decision: generate the report anyway, with the gaps explicitly marked. */
export function forceGenerate(
  rep: Report,
  sources: DataSource[],
  tick: number
): { rep: Report; events: AgentEvent[] } {
  const repSources = sources.filter((s) => s.reportId === rep.id);
  const gaps: string[] = [];
  for (const s of repSources) {
    if (s.status !== "submitted") {
      gaps.push(`${s.label} · ${s.name} (${s.owner}) — never submitted; section omitted.`);
    } else {
      for (const f of s.flags.filter((fl) => fl.status === "open")) {
        gaps.push(`${s.label} · ${s.name} — unresolved ${f.type} flag on "${f.field.replace(/_/g, " ")}".`);
      }
    }
  }
  const events = [
    makeEvent(
      rep.id,
      undefined,
      "report_generated",
      `Human reviewer force-generated "${rep.name}" with ${gaps.length} gap(s) explicitly marked.`,
      tick,
      "Human Reviewer"
    ),
  ];
  return {
    rep: {
      ...rep,
      status: "generated_partial",
      generatedAtTick: tick,
      sections: buildSections(repSources),
      gaps,
    },
    events,
  };
}
