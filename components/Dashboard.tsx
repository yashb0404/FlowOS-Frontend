"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { DataSource, Report, SourceStatus } from "@/lib/types";
import { reportProgress } from "@/lib/engine";
import { parseSheet } from "@/lib/parseSheet";

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

  // Cumulative submissions per day for the trend line
  const days = Array.from({ length: Math.max(tick, 1) + 1 }, (_, d) =>
    repEvents.filter((e) => e.kind === "submitted" && e.timestamp <= d).length
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
              <p className="text-[10px] text-slate-400">Cumulative sources received per simulated day</p>
            </div>
            <span className="text-[9.5px] px-2 py-0.5 rounded-full glass-soft text-slate-500">Day {tick}</span>
          </div>
          <TrendChart data={days} max={repSources.length} />
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
              <SourceRow key={src.id} src={src} tick={tick} />
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

function TrendChart({ data, max }: { data: number[]; max: number }) {
  const W = 320;
  const H = 72;
  const n = Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => `${(i / n) * W},${H - (v / Math.max(max, 1)) * (H - 8) - 4}`);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 84 }} preserveAspectRatio="none">
      <polyline points={`0,${H} ${pts.join(" ")} ${W},${H}`} fill="rgba(61,90,153,0.10)" stroke="none" />
      <polyline points={pts.join(" ")} fill="none" stroke="#3d5a99" strokeWidth="2" strokeLinejoin="round" />
      {data.length > 1 && (
        <circle
          cx={W}
          cy={H - (data[data.length - 1] / Math.max(max, 1)) * (H - 8) - 4}
          r="3.5"
          fill="#d63a5f"
        />
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

function SourceRow({ src, tick }: { src: DataSource; tick: number }) {
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
