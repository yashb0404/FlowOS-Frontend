"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { DataSource, Report, SourceStatus } from "@/lib/types";
import { reportProgress } from "@/lib/engine";
import { parseSheet } from "@/lib/parseSheet";
import { downloadSheet } from "@/lib/sheetExport";

const SOURCE_STATUS: Record<SourceStatus, { label: string; cls: string; dot: string; pulse?: boolean }> = {
  pending: { label: "Scheduled", cls: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400" },
  reminded: { label: "Chasing (email)", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  human_alert: { label: "Human alert", cls: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500", pulse: true },
  submitted: { label: "Submitted", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

const REPORT_STATUS: Record<Report["status"], { label: string; cls: string }> = {
  collecting: { label: "Collecting data", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  blocked: { label: "Blocked · awaiting review", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  generated: { label: "Generated ✓", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  generated_partial: { label: "Generated with gaps", cls: "bg-orange-50 text-orange-700 border-orange-200" },
};

export function Dashboard({ reportId }: { reportId: string }) {
  const { reports, sources, tick, events } = useStore();
  const rep = reports.find((r) => r.id === reportId);
  const repSources = sources.filter((s) => s.reportId === reportId);
  const repEvents = events.filter((e) => e.reportId === reportId);

  if (!rep) return null;

  const submitted = repSources.filter((s) => s.status === "submitted").length;
  const openFlags = repSources.flatMap((s) => s.flags).filter((f) => f.status === "open").length;
  const compliance = repSources.length ? Math.round((submitted / repSources.length) * 100) : 0;
  const extractions = repEvents.filter((e) => e.kind === "extraction_done").length;
  const progress = reportProgress(rep, sources);
  const rs = REPORT_STATUS[rep.status];

  // Window the chart tightly around THIS report's activity window (its sources
  // submit in a specific date range on the FY26 calendar, not from Day 0).
  const submitDays = repEvents.filter((e) => e.kind === "submitted").map((e) => e.timestamp);
  const minDue = Math.min(...repSources.map((s) => s.dueTick));
  const firstActivity = submitDays.length ? Math.min(...submitDays, minDue) : minDue;
  const lastSubmit = submitDays.length ? Math.max(...submitDays) : minDue;
  const chartStart = Math.max(0, firstActivity - 2);
  const chartEnd = Math.max(chartStart + 8, Math.min(lastSubmit + 2, Math.max(tick, lastSubmit)));
  const baseline = repEvents.filter((e) => e.kind === "submitted" && e.timestamp < chartStart).length;
  const perDay = Array.from({ length: chartEnd - chartStart + 1 }, (_, k) =>
    repEvents.filter((e) => e.kind === "submitted" && e.timestamp === chartStart + k).length
  );

  const byDept = Object.entries(
    repSources.reduce<Record<string, { total: number; done: number }>>((acc, s) => {
      acc[s.department] = acc[s.department] || { total: 0, done: 0 };
      acc[s.department].total++;
      if (s.status === "submitted") acc[s.department].done++;
      return acc;
    }, {})
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ── Report KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Report Progress" value={`${progress}%`} note={rs.label} tone={progress === 100 ? "text-emerald-600" : "text-[#3d5a99]"} icon="◔" delay="fade-up" />
        <Kpi label="Sources In" value={`${submitted}/${repSources.length}`} note={`collection ${compliance}%`} tone="text-[#3d5a99]" icon="✓" delay="fade-up-1" />
        <Kpi label="AI Accuracy" value="98.7%" note={`${extractions} documents parsed`} tone="text-emerald-600" icon="✦" delay="fade-up-2" />
        <Kpi label="Critical Flagged" value={`${openFlags}`} note={openFlags > 0 ? "awaiting review" : "all clear"} tone={openFlags > 0 ? "text-rose-600" : "text-slate-700"} icon="⚑" delay="fade-up-3" />
      </div>

      {/* ── Trend + department compliance ── */}
      <div className="grid lg:grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 lg:col-span-2 fade-up fade-up-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-[12.5px] font-semibold text-slate-800">Submission Surveillance</h3>
              <p className="text-[10px] text-slate-400">Daily submissions + cumulative, across this report&rsquo;s collection window</p>
            </div>
            <span className="text-[9.5px] px-2 py-0.5 rounded-full glass-soft text-slate-500">
              Days {chartStart}&ndash;{chartEnd}
            </span>
          </div>
          <TrendChart perDay={perDay} baseline={baseline} startDay={chartStart} max={repSources.length} />
        </div>
        <div className="glass rounded-xl p-4 fade-up fade-up-2">
          <h3 className="text-[12.5px] font-semibold text-slate-800 mb-0.5">Department Compliance</h3>
          <p className="text-[10px] text-slate-400 mb-3">Sources submitted vs required</p>
          <div className="flex flex-col gap-2.5">
            {byDept.map(([dept, v]) => {
              const pct = Math.round((v.done / v.total) * 100);
              return (
                <div key={dept}>
                  <div className="flex justify-between text-[10.5px] mb-1">
                    <span className="text-slate-600 font-medium">{dept}</span>
                    <span className={`font-bold tabular-nums ${pct === 100 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-rose-500"}`}>{pct}%</span>
                  </div>
                  <div className="progress-track h-1.5">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Live data workbook (Excel-style, always visible) ── */}
      <LiveWorkbook sources={repSources} repName={rep.name} />

      <div className="glass rounded-2xl overflow-hidden fade-up fade-up-1">
        {/* report header */}
        <div className="px-6 py-4 border-b border-slate-200/70 bg-gradient-to-r from-rose-50/60 via-transparent to-transparent">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">{rep.name}</h2>
              <p className="text-[11.5px] text-slate-400 mt-0.5">
                {rep.project} · {rep.frequency === "one-time" ? "one-time" : `recurring ${rep.frequency}`} ·{" "}
                {repSources.length} required data sources
              </p>
              {rep.regulation && (
                <p className="text-[10.5px] text-slate-500 mt-1">
                  ⚖ <span className="font-medium">{rep.regulation}</span>
                  {rep.assurance && rep.assurance !== "none" && (
                    <span className="ml-2 px-2 py-0.5 rounded-full border bg-indigo-50 border-indigo-200 text-[#3d5a99] font-semibold uppercase text-[9px]">
                      {rep.assurance} assurance
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {openFlags > 0 && (
                <span className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                  ⚑ {openFlags} open flag{openFlags > 1 ? "s" : ""}
                </span>
              )}
              <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border ${rs.cls}`}>
                {rs.label}
              </span>
            </div>
          </div>

          {/* generation gate progress */}
          <div className="mt-3.5 flex items-center gap-3">
            <div className="progress-track flex-1 h-2">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[11.5px] tabular-nums text-slate-500 font-medium whitespace-nowrap">
              {submitted}/{repSources.length} sources · {progress}%
            </span>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-1.5">
            {rep.status === "generated" || rep.status === "generated_partial"
              ? `Generated on Day ${rep.generatedAtTick} — see the Generated Report tab.`
              : `Generation gate: report is produced only when all ${repSources.length} sources are collected, validated and reconciled.`}
          </p>
        </div>

        {/* sources table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-[10.5px] uppercase tracking-wider">
              <th className="text-left px-6 py-2.5 font-medium">Source</th>
              <th className="text-left px-4 py-2.5 font-medium">Owner</th>
              <th className="text-left px-4 py-2.5 font-medium">Dept</th>
              <th className="text-left px-4 py-2.5 font-medium">Due</th>
              <th className="text-left px-4 py-2.5 font-medium">Status</th>
              <th className="text-left px-4 py-2.5 font-medium">Follow-ups</th>
              <th className="text-right px-6 py-2.5 font-medium">Checks</th>
            </tr>
          </thead>
          <tbody>
            {repSources.map((src) => (
              <SourceRow key={src.id} src={src} tick={tick} repName={rep.name} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11.5px] text-slate-400 px-1">
        Ladder per source: email #1 on due date → #2 at +1 → #3 at +2 → <span className="text-rose-500 font-medium">human alert</span> at
        +3. Submitted data flows through extraction → validation (&ldquo;N of N fields&rdquo;) → reconciliation vs the ERP snapshot; any
        flag routes to the <span className="text-slate-600 font-medium">Review</span> tab.
      </p>
    </div>
  );
}

/** Always-visible Excel-style workbook: one worksheet tab per SPOC, live cells. */
function LiveWorkbook({ sources, repName }: { sources: DataSource[]; repName: string }) {
  const { uploadSubmit } = useStore();
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const src = sources[active] ?? sources[0];
  if (!src) return null;

  const submitted = src.status === "submitted";

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { fields } = await parseSheet(file, src.expectedFields);
      if (Object.keys(fields).length === 0) setError("No expected KPIs matched in that file");
      else uploadSubmit(src.id, file.name, fields);
    } catch {
      setError("Could not parse file");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const TAB_TONE: Record<string, string> = {
    submitted: "border-emerald-400 text-emerald-700",
    human_alert: "border-rose-400 text-rose-600",
    reminded: "border-amber-400 text-amber-700",
    pending: "border-slate-300 text-slate-400",
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-emerald-800/25 shadow-lg fade-up fade-up-1">
      {/* Excel title bar */}
      <div className="bg-emerald-700 text-white px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="bg-white/20 rounded px-1.5 py-0.5 text-[11px] font-bold">▦</span>
          <span className="text-[12.5px] font-semibold truncate">
            AREPL_BRSR_FY26_DataBook.xlsx <span className="font-normal text-emerald-100">— {sources.length} worksheets</span>
          </span>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-50 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-lime-300 pulse-glow" /> live
        </span>
      </div>

      {/* toolbar */}
      <div className="bg-emerald-50/70 border-b border-emerald-200 px-4 py-1.5 flex items-center justify-between gap-3">
        <span className="text-[11px] text-emerald-900 font-medium truncate">
          {src.name} · <span className="text-emerald-700/70">{src.owner} · {src.department}</span>
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {error && <span className="text-[9.5px] text-rose-500">{error}</span>}
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          {!submitted && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="text-[10.5px] font-semibold px-2.5 py-1 rounded border border-cyan-400 bg-white text-cyan-700 hover:bg-cyan-50 disabled:opacity-50"
            >
              {busy ? "⟳ parsing…" : "⇪ Upload filled sheet"}
            </button>
          )}
          <button
            onClick={() => downloadSheet(src, repName)}
            className="text-[10.5px] font-semibold px-2.5 py-1 rounded border border-emerald-400 bg-white text-emerald-700 hover:bg-emerald-50"
          >
            ⬇ {submitted ? "Download" : "Blank template"} (.xlsx)
          </button>
        </div>
      </div>

      {/* spreadsheet grid */}
      <div className="bg-white overflow-x-auto">
        <table className="text-[11.5px] border-collapse w-full min-w-[520px]">
          <thead>
            <tr className="bg-slate-100 text-slate-500">
              <th className="w-8 border border-slate-200 text-[9px] font-normal py-1"></th>
              <th className="border border-slate-200 px-3 py-1.5 text-left font-semibold text-slate-600">A · KPI</th>
              <th className="border border-slate-200 px-3 py-1.5 text-left font-semibold text-slate-600 w-32">B · FY26 Value</th>
              <th className="border border-slate-200 px-3 py-1.5 text-left font-semibold text-slate-600">C · Evidence Required</th>
            </tr>
          </thead>
          <tbody>
            {src.expectedFields.map((f, i) => {
              const has = src.submittedFields && f in src.submittedFields;
              return (
                <tr key={f}>
                  <td className="border border-slate-200 bg-slate-50 text-center text-[9px] text-slate-400 py-1">{i + 1}</td>
                  <td className="border border-slate-200 px-3 py-1.5 text-slate-700 capitalize">{f.replace(/_/g, " ")}</td>
                  <td className={`border border-slate-200 px-3 py-1.5 tabular-nums font-semibold ${has ? "text-slate-900 bg-emerald-50/40" : "text-slate-300 italic"}`}>
                    {has ? src.submittedFields![f] : "—"}
                  </td>
                  <td className="border border-slate-200 px-3 py-1.5 text-slate-400">📎 {src.evidence?.[i] ?? src.evidence?.[0] ?? "—"}</td>
                </tr>
              );
            })}
            <tr>
              <td className="border border-slate-200 bg-slate-50 text-center text-[9px] text-slate-300 py-1">{src.expectedFields.length + 1}</td>
              <td className="border border-slate-200 px-3 py-2 text-[10px] text-slate-400" colSpan={3}>
                {submitted
                  ? `✓ Received via portal · extracted & reconciled by FlowOS`
                  : src.status === "human_alert"
                    ? `⚠ Awaiting ${src.owner} — escalated to human after 3 reminders`
                    : `Awaiting submission from ${src.owner} (due Day ${src.dueTick})`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* worksheet tabs (Excel-style) */}
      <div className="bg-slate-100 border-t border-slate-300 px-2 py-1 flex items-center gap-0.5 overflow-x-auto">
        {sources.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            className={`shrink-0 text-[10.5px] px-2.5 py-1 rounded-t border-b-2 whitespace-nowrap transition-colors ${
              i === active
                ? `bg-white font-semibold ${TAB_TONE[s.status] ?? "border-slate-300 text-slate-700"}`
                : "bg-slate-50 border-transparent text-slate-400 hover:text-slate-600"
            }`}
            title={`${s.name} — ${s.department}`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${SOURCE_STATUS[s.status].dot}`} />
            {s.department}
          </button>
        ))}
      </div>
    </div>
  );
}

function Kpi({ label, value, note, tone, icon, delay }: { label: string; value: string; note: string; tone: string; icon: string; delay: string }) {
  return (
    <div className={`glass rounded-xl p-3.5 ${delay}`}>
      <div className="flex items-center justify-between">
        <span className="text-[9.5px] uppercase tracking-wider text-slate-400 font-semibold">{label}</span>
        <span className="text-[12px] opacity-70">{icon}</span>
      </div>
      <div className={`text-xl font-bold tabular-nums mt-1.5 ${tone}`}>{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{note}</div>
    </div>
  );
}

function TrendChart({ perDay, baseline, startDay, max }: { perDay: number[]; baseline: number; startDay: number; max: number }) {
  const W = 340;
  const H = 96;
  const PAD = 16;
  const n = perDay.length;
  const slot = (W - PAD * 2) / n;
  const denom = Math.max(max, 1);
  const cum = perDay.reduce<number[]>((acc, v, i) => {
    acc.push((i === 0 ? baseline : acc[i - 1]) + v);
    return acc;
  }, []);
  const y = (v: number) => H - 18 - (v / denom) * (H - 34);
  const cx = (i: number) => PAD + i * slot + slot / 2;
  const pts = cum.map((v, i) => `${cx(i)},${y(v)}`);
  const labelStep = Math.max(1, Math.ceil(n / 8));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110 }}>
      {/* target line */}
      <line x1={PAD} y1={y(max)} x2={W - PAD} y2={y(max)} stroke="rgba(214,58,95,0.35)" strokeWidth="1" strokeDasharray="3 3" />
      <text x={W - PAD} y={y(max) - 3} textAnchor="end" fontSize="7.5" fill="#d63a5f">
        target {max}
      </text>
      {/* daily submission bars */}
      {perDay.map((v, i) =>
        v > 0 ? (
          <rect key={i} x={cx(i) - slot * 0.25} y={y(v)} width={slot * 0.5} height={H - 18 - y(v)} rx={1.5} fill="rgba(61,90,153,0.28)" />
        ) : null
      )}
      {/* cumulative line */}
      <polyline points={pts.join(" ")} fill="none" stroke="#3d5a99" strokeWidth="2" strokeLinejoin="round" />
      {cum.map((v, i) => (perDay[i] > 0 ? <circle key={i} cx={cx(i)} cy={y(v)} r="2.5" fill="#3d5a99" /> : null))}
      {cum[n - 1] > 0 && <circle cx={cx(n - 1)} cy={y(cum[n - 1])} r="3.5" fill="#d63a5f" />}
      {/* baseline + real calendar-day labels */}
      <line x1={PAD} y1={H - 18} x2={W - PAD} y2={H - 18} stroke="rgba(100,116,139,0.25)" strokeWidth="1" />
      {perDay.map((_, i) =>
        i % labelStep === 0 ? (
          <text key={i} x={cx(i)} y={H - 6} textAnchor="middle" fontSize="7.5" fill="#94a3b8">
            D{startDay + i}
          </text>
        ) : null
      )}
    </svg>
  );
}

/** Manual intake: the SPOC's filled Excel/CSV sheet, parsed client-side and fed into the pipeline. */
function UploadButton({ src }: { src: DataSource }) {
  const { uploadSubmit } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { fields, rowsScanned } = await parseSheet(file, src.expectedFields);
      if (Object.keys(fields).length === 0) {
        setError(rowsScanned === 0 ? "No data rows found" : "No expected KPIs matched");
        return;
      }
      uploadSubmit(src.id, file.name, fields);
    } catch {
      setError("Could not parse file");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="text-[10.5px] font-semibold px-2.5 py-1 rounded-lg border border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors whitespace-nowrap disabled:opacity-50"
        title={`Upload the filled sheet for ${src.name} — expected: ${src.expectedFields.join(", ")}`}
      >
        {busy ? "⟳ parsing…" : "⇪ Upload sheet"}
      </button>
      {error && <span className="text-[9px] text-rose-500">{error}</span>}
    </span>
  );
}

function SourceRow({ src, tick }: { src: DataSource; tick: number; repName: string }) {
  const st = SOURCE_STATUS[src.status];
  const overdue = tick > src.dueTick && src.status !== "submitted";
  const openFlags = src.flags.filter((f) => f.status === "open").length;
  const resolvedFlags = src.flags.filter((f) => f.status !== "open").length;

  return (
    <tr className="row-hover border-t border-slate-200/60">
      <td className="px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border bg-[#f4ede3] text-slate-500 border-slate-200">
            {src.label.replace("Data ", "D")}
          </span>
          <div>
            <div className="font-medium text-slate-800 text-[13px]">{src.name}</div>
            <div className="text-[10.5px] text-slate-400">{src.principle ?? src.label}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-[12.5px] text-slate-600">{src.owner}</td>
      <td className="px-4 py-3 text-[12.5px] text-slate-500">{src.department}</td>
      <td className={`px-4 py-3 text-[12.5px] tabular-nums ${overdue ? "text-rose-600 font-semibold" : "text-slate-500"}`}>
        Day {src.dueTick}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap border ${st.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${st.pulse ? "pulse-glow" : ""}`} />
          {st.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`tabular-nums text-[12.5px] ${src.remindersSent >= 3 ? "text-rose-600 font-semibold" : "text-slate-400"}`}>
          {Math.min(src.remindersSent, 3)} / 3
        </span>
      </td>
      <td className="px-6 py-3 text-right">
        {src.status !== "submitted" ? (
          <UploadButton src={src} />
        ) : openFlags > 0 ? (
          <span className="text-[11px] font-semibold text-rose-600">⚑ {openFlags} open</span>
        ) : resolvedFlags > 0 ? (
          <span className="text-[11px] font-medium text-amber-600">✓ resolved by human</span>
        ) : (
          <span className="text-[11px] font-medium text-emerald-600">✓ clean</span>
        )}
      </td>
    </tr>
  );
}
