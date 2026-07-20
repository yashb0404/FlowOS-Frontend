"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Report } from "@/lib/types";

export function Reports({ reportId }: { reportId: string }) {
  const { reports } = useStore();
  const generated = reports.filter(
    (r) => r.id === reportId && (r.status === "generated" || r.status === "generated_partial")
  );

  if (generated.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl glass-soft flex items-center justify-center text-xl text-slate-400 mb-4">
          ▦
        </div>
        <p className="text-slate-600 text-sm font-medium">No reports generated yet</p>
        <p className="text-slate-400 text-[12px] mt-1 max-w-md mx-auto">
          The generation gate is closed — a report is produced from its template only when every required data
          source has been collected, validated and reconciled (or a human force-generates it with gaps marked).
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <BriefingArchitect reportId={reportId} />
      {generated.map((rep) => (
        <div key={rep.id} className="glass rounded-2xl overflow-hidden fade-up">
          {/* Document header — template look */}
          <div className="px-8 pt-7 pb-5 border-b-2 border-slate-800/80 bg-gradient-to-b from-rose-50/50 to-transparent">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
                  FlowOS · Auto-generated from template
                </p>
                <h2
                  className="text-xl font-bold text-slate-900 mt-1.5"
                  style={{ fontFamily: "var(--font-zen), var(--font-geist-sans), sans-serif" }}
                >
                  {rep.name}
                </h2>
                <p className="text-[12px] text-slate-500 mt-1">
                  {rep.project} · Generated Day {rep.generatedAtTick}
                </p>
              </div>
              {rep.status === "generated" ? (
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  COMPLETE · ALL SOURCES RECONCILED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 pulse-glow" />
                  PARTIAL · {rep.gaps?.length ?? 0} GAP(S) MARKED
                </span>
              )}
            </div>
          </div>

          {/* Gaps callout for partial reports */}
          {rep.status === "generated_partial" && rep.gaps && rep.gaps.length > 0 && (
            <div className="mx-8 mt-5 rounded-xl bg-orange-50/80 border border-orange-200 p-4">
              <p className="text-[10.5px] uppercase tracking-wider font-semibold text-orange-700 mb-1.5">
                ⚠ Known gaps — human-approved partial generation
              </p>
              {rep.gaps.map((g, i) => (
                <p key={i} className="text-[12px] text-orange-800/90 leading-relaxed">
                  • {g}
                </p>
              ))}
            </div>
          )}

          {/* Sections per data source */}
          <div className="px-8 py-6 grid gap-5 md:grid-cols-2">
            {rep.sections?.map((sec) => (
              <div key={sec.sourceName} className="rounded-xl border border-slate-200 bg-white/60 p-5">
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200/80">
                  <div>
                    <h3 className="text-[13px] font-semibold text-slate-800">{sec.sourceName}</h3>
                    <p className="text-[10.5px] text-slate-400">
                      {sec.department} · {sec.owner}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.entries(sec.values).map(([k, v]) => (
                    <div key={k}>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                        {k.replace(/_/g, " ")}
                      </div>
                      <div className="text-xl font-bold tabular-nums text-slate-900 mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>
                {sec.note && (
                  <p className="text-[10.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-3">
                    ✎ {sec.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          <SignOff rep={rep} />

          <div className="px-8 pb-6">
            <p className="text-[10.5px] text-slate-400 border-t border-slate-200/70 pt-3">
              Every figure above is traceable: collected by the Collection Agent, extracted, validated
              ({"all required fields present"}), reconciled against the ERP snapshot, and human-reviewed where flagged.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

const TONES = [
  { key: "board", label: "Executive Board Briefing", hint: "High-level KPIs & SLA" },
  { key: "audit", label: "SOP Compliance Strict Audit", hint: "Granular validation detail" },
  { key: "risk", label: "Risk Mitigation Heatmap", hint: "Bottlenecks & alerts" },
] as const;

function BriefingArchitect({ reportId }: { reportId: string }) {
  const { sources: allSources, tick } = useStore();
  const sources = allSources.filter((s) => s.reportId === reportId);
  const [tone, setTone] = useState<(typeof TONES)[number]["key"]>("board");
  const [exported, setExported] = useState<string | null>(null);

  const submitted = sources.filter((s) => s.status === "submitted").length;
  const openFlags = sources.flatMap((s) => s.flags).filter((f) => f.status === "open");
  const resolved = sources.flatMap((s) => s.flags).filter((f) => f.status !== "open");
  const alerts = sources.filter((s) => s.status === "human_alert");

  const narrative =
    tone === "board"
      ? `As of Day ${tick}, FlowOS has autonomously collected ${submitted} of ${sources.length} data sources for this report (collection index ${sources.length ? Math.round((submitted / sources.length) * 100) : 0}%). ${resolved.length} exception(s) resolved with human sign-off; ${alerts.length} source(s) escalated to human follow-up.`
      : tone === "audit"
        ? `Strict audit view: every submission passed field-completeness checks except ${resolved.filter((f) => f.type === "validation").length + openFlags.filter((f) => f.type === "validation").length} validation exception(s); reconciliation vs the ERP snapshot raised ${resolved.filter((f) => f.type === "reconciliation").length + openFlags.filter((f) => f.type === "reconciliation").length} variance flag(s). Each resolution is recorded in the immutable audit ledger with actor and day.`
        : `Risk view: the highest current risk is ${alerts.length > 0 ? `non-submission by ${alerts.map((a) => a.owner).join(", ")} — email automation exhausted, human intervention pending` : openFlags.length > 0 ? `${openFlags.length} unresolved data flag(s) blocking generation` : "low — all pipelines clear"}. Recommended action: enforce earlier vendor deadlines to catch chronic late-submitters inside the email window.`;

  function doExport(kind: string) {
    setExported(kind);
    setTimeout(() => setExported(null), 2000);
  }

  return (
    <div className="glass rounded-xl p-4 fade-up">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div>
          <h3 className="text-[12.5px] font-semibold text-slate-800">AI Reporting Architect</h3>
          <p className="text-[10px] text-slate-400">Synthesized live from pipeline state — pick a tone</p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => doExport("PDF")} className="text-[10.5px] px-2.5 py-1.5 rounded-lg font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-colors">
            {exported === "PDF" ? "✓ Exported" : "⬇ Export PDF"}
          </button>
          <button onClick={() => doExport("Slides")} className="text-[10.5px] px-2.5 py-1.5 rounded-lg font-semibold btn-primary text-white">
            {exported === "Slides" ? "✓ Exported" : "⬇ Export Slides"}
          </button>
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {TONES.map((t) => (
          <button
            key={t.key}
            onClick={() => setTone(t.key)}
            className={`text-[10.5px] px-2.5 py-1.5 rounded-lg border transition-colors ${
              tone === t.key
                ? "bg-rose-50 border-rose-300 text-[#b7245c] font-semibold"
                : "glass-soft border-slate-200 text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label} <span className="opacity-60">· {t.hint}</span>
          </button>
        ))}
      </div>
      <p className="text-[12px] text-slate-600 leading-relaxed border-l-2 border-[#3d5a99]/40 pl-3">{narrative}</p>
    </div>
  );
}

function SignOff({ rep }: { rep: Report }) {
  const { signReport, tick } = useStore();
  const [name, setName] = useState("");

  if (rep.signedBy) {
    return (
      <div className="mx-8 mb-5 rounded-xl bg-emerald-50/80 border border-emerald-200 p-4 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3d5a99] to-[#7ca982] flex items-center justify-center text-[12px] font-bold text-white shrink-0">
          {rep.signedBy.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
        </span>
        <div>
          <p className="text-[12.5px] font-semibold text-emerald-800">
            ✍ Digitally signed &amp; released by {rep.signedBy}
          </p>
          <p className="text-[11px] text-emerald-700/80 mt-0.5">
            Day {rep.signedAtTick ?? tick} · archived to the knowledge hub · immutable audit entry recorded
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-8 mb-5 rounded-xl glass-soft border border-slate-200 p-4">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
        Digital release signature
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your full name to sign…"
          className="flex-1 min-w-[200px] px-3 py-2 text-[13px] rounded-lg bg-white/70 border border-slate-300/70 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-300"
          style={{ fontFamily: "var(--font-zen), cursive" }}
        />
        <button
          onClick={() => name.trim() && signReport(rep.id, name.trim())}
          disabled={!name.trim()}
          className="btn-primary px-4 py-2 text-[12.5px] rounded-xl text-white font-semibold disabled:opacity-40"
        >
          Complete Authorized Release
        </button>
      </div>
      <p className="text-[10.5px] text-slate-400 mt-2">
        Signing archives the report and writes an immutable entry to the audit trail.
      </p>
    </div>
  );
}
