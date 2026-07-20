"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Report, ReportSection } from "@/lib/types";
import { priorYearData } from "@/lib/seed";

/** Build a clean, print-formatted document from the report data — Save-as-PDF produces the file. */
function printReport(rep: Report) {
  const secs = rep.sections ?? [];
  const kpis = secs.reduce((n, s) => n + Object.keys(s.values).length, 0);
  const depts = new Set(secs.map((s) => s.department)).size;

  const kpiRows = (sec: ReportSection) =>
    Object.entries(sec.values)
      .map(([k, v]) => {
        const prev = priorYearData[k];
        const cur = Number(v);
        const delta =
          prev !== undefined && prev !== 0 && !Number.isNaN(cur)
            ? `${cur >= prev ? "▲" : "▼"} ${Math.abs(((cur - prev) / prev) * 100).toFixed(1)}%`
            : "—";
        return `<tr>
          <td>${k.replace(/_/g, " ")}</td>
          <td class="num">${typeof v === "number" ? v.toLocaleString() : v}${unitOf(k) ? ` <span class="unit">${unitOf(k)}</span>` : ""}</td>
          <td class="num muted">${prev !== undefined ? prev.toLocaleString() : "—"}</td>
          <td class="num">${delta}</td>
        </tr>`;
      })
      .join("");

  const groups = groupByPrinciple(secs)
    .map(
      ([principle, group]) => `
      <h2>${principle}</h2>
      ${group
        .map(
          (sec) => `
        <h3>${sec.sourceName} <span class="owner">· ${sec.department} · Data owner: ${sec.owner}</span></h3>
        <table>
          <thead><tr><th>KPI</th><th class="num">FY26</th><th class="num">FY25</th><th class="num">YoY</th></tr></thead>
          <tbody>${kpiRows(sec)}</tbody>
        </table>
        ${sec.note ? `<p class="note">✎ ${sec.note}</p>` : ""}`
        )
        .join("")}`
    )
    .join("");

  const assuranceTxt =
    rep.assurance === "reasonable"
      ? "The KPIs disclosed above were subjected to reasonable assurance by an independent third-party assurance provider across all locations, covering a sample of more than 90% of reported data."
      : rep.assurance === "limited"
        ? "The KPIs disclosed above were subjected to limited assurance by an independent third-party assurance provider."
        : rep.assurance === "internal"
          ? "The KPIs disclosed above were internally assessed by Group Sustainability together with the respective department SPOCs prior to publication."
          : "";

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${rep.name}</title>
  <style>
    @page { margin: 22mm 18mm; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a202c; font-size: 12px; line-height: 1.5; }
    .letterhead { text-transform: uppercase; letter-spacing: 2.5px; font-size: 9px; color: #64748b; }
    h1 { font-size: 22px; margin: 6px 0 2px; }
    .meta { color: #475569; font-size: 11px; margin: 0 0 4px; }
    .rule { border: none; border-top: 2.5px solid #1a202c; margin: 14px 0 18px; }
    .glance { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .glance td { border: 1px solid #cbd5e1; text-align: center; padding: 8px 4px; width: 25%; }
    .glance .v { font-size: 18px; font-weight: bold; }
    .glance .l { font-size: 8.5px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #3d5a99; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 22px 0 8px; page-break-after: avoid; }
    h3 { font-size: 12.5px; margin: 12px 0 5px; page-break-after: avoid; }
    .owner { font-weight: normal; font-size: 10px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; page-break-inside: avoid; }
    th, td { border: 1px solid #d7dde6; padding: 5px 9px; text-align: left; text-transform: capitalize; }
    th { background: #f1f5f9; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.8px; color: #475569; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .unit { font-size: 9px; color: #94a3b8; }
    .muted { color: #94a3b8; }
    .note { font-size: 10.5px; color: #92600a; background: #fef8e7; border: 1px solid #f2dfa9; padding: 5px 9px; margin: 4px 0 10px; }
    .assurance { margin-top: 24px; border: 1px solid #c3cbe8; background: #f4f6fc; padding: 10px 14px; font-size: 10.5px; page-break-inside: avoid; }
    .assurance b { text-transform: uppercase; letter-spacing: 1px; font-size: 9px; color: #3d5a99; display: block; margin-bottom: 3px; }
    .sign { margin-top: 34px; page-break-inside: avoid; }
    .sign .line { border-top: 1px solid #1a202c; width: 220px; padding-top: 5px; font-size: 10.5px; }
  </style></head><body>
    <div class="letterhead">RNGalla Family Private Limited · AREPL (Galla Foods)</div>
    <h1>${rep.name}</h1>
    <p class="meta">Reporting period: FY26 (Apr '25 to Mar '26)${rep.regulation ? ` · Prepared under ${rep.regulation}` : ""}</p>
    <p class="meta">${rep.status === "generated" ? "Status: COMPLETE — all sources collected, validated and reconciled" : `Status: PARTIAL — ${rep.gaps?.length ?? 0} gap(s) explicitly disclosed`}</p>
    <hr class="rule" />
    <table class="glance"><tr>
      <td><div class="v">${kpis}</div><div class="l">KPIs disclosed</div></td>
      <td><div class="v">${depts}</div><div class="l">Functions covered</div></td>
      <td><div class="v">${secs.filter((s) => s.note).length}</div><div class="l">Human corrections</div></td>
      <td><div class="v">${rep.gaps?.length ?? 0}</div><div class="l">Gaps disclosed</div></td>
    </tr></table>
    ${rep.gaps?.length ? `<p class="note"><b>Known gaps:</b> ${rep.gaps.join(" · ")}</p>` : ""}
    ${groups}
    ${assuranceTxt ? `<div class="assurance"><b>Assurance statement</b>${assuranceTxt}</div>` : ""}
    <div class="sign"><div class="line">${rep.signedBy ? `Digitally signed and released by <b>${rep.signedBy}</b>` : "Authorized signatory"}<br/>RNGalla Family Private Limited</div></div>
  </body></html>`;

  // Hidden same-origin iframe avoids popup blockers; print() opens the Save-as-PDF dialog.
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);
  const doc = frame.contentWindow!.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    frame.contentWindow!.focus();
    frame.contentWindow!.print();
    setTimeout(() => frame.remove(), 2000);
  }, 300);
}

/** Infer a display unit from the KPI field name. */
function unitOf(field: string): string {
  if (field.endsWith("_pct")) return "%";
  if (field.includes("tco2e")) return "tCO₂e";
  if (field.endsWith("_cr")) return "₹ Cr";
  if (field.endsWith("_lakhs")) return "₹ lakh";
  if (field.endsWith("_gj")) return "GJ";
  if (field.endsWith("_kl")) return "KL";
  if (field === "ltifr") return "per mn hrs";
  return "";
}

/** Year-on-year delta chip vs FY25, when a comparative exists. */
function Delta({ field, value }: { field: string; value: number | string }) {
  const prev = priorYearData[field];
  const cur = Number(value);
  if (prev === undefined || Number.isNaN(cur)) return null;
  if (prev === 0) return <span className="text-[9.5px] text-slate-400">FY25: {prev}</span>;
  const pct = ((cur - prev) / prev) * 100;
  const arrow = pct > 0.05 ? "▲" : pct < -0.05 ? "▼" : "▬";
  return (
    <span className="text-[9.5px] text-slate-400">
      FY25: {prev.toLocaleString()}{" "}
      <span className={pct > 0.05 ? "text-[#3d5a99] font-semibold" : pct < -0.05 ? "text-rose-500 font-semibold" : "text-slate-400"}>
        {arrow} {Math.abs(pct).toFixed(1)}%
      </span>
    </span>
  );
}

/** Group report sections under their framework principle, preserving order. */
function groupByPrinciple(sections: ReportSection[]): [string, ReportSection[]][] {
  const map = new Map<string, ReportSection[]>();
  for (const sec of sections) {
    const key = sec.principle ?? "General Disclosures";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(sec);
  }
  return [...map.entries()];
}

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
        <div key={rep.id} id={`repdoc-${rep.id}`} className="glass rounded-2xl overflow-hidden fade-up">
          {/* Document header — template look */}
          <div className="px-8 pt-7 pb-5 border-b-2 border-slate-800/80 bg-gradient-to-b from-rose-50/50 to-transparent">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
                  RNGalla Family Private Limited · AREPL (Galla Foods)
                </p>
                <h2
                  className="text-xl font-bold text-slate-900 mt-1.5"
                  style={{ fontFamily: "var(--font-zen), var(--font-geist-sans), sans-serif" }}
                >
                  {rep.name}
                </h2>
                <p className="text-[12px] text-slate-500 mt-1">
                  Reporting period: FY26 (Apr&rsquo;25 to Mar&rsquo;26) · Generated Day {rep.generatedAtTick}
                </p>
                {rep.regulation && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ⚖ Prepared under <span className="font-medium">{rep.regulation}</span>
                  </p>
                )}
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
              <button
                onClick={() => printReport(rep)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white/70 text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors"
              >
                ⬇ Download PDF
              </button>
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

          {/* At a glance */}
          <div className="mx-8 mt-5 grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {(() => {
              const secs = rep.sections ?? [];
              const kpis = secs.reduce((n, s) => n + Object.keys(s.values).length, 0);
              const depts = new Set(secs.map((s) => s.department)).size;
              const corrections = secs.filter((s) => s.note).length;
              const gaps = rep.gaps?.length ?? 0;
              return [
                { l: "KPIs disclosed", v: kpis, tone: "text-slate-900" },
                { l: "Functions covered", v: depts, tone: "text-[#3d5a99]" },
                { l: "Human corrections", v: corrections, tone: corrections > 0 ? "text-amber-600" : "text-slate-900" },
                { l: "Gaps disclosed", v: gaps, tone: gaps > 0 ? "text-rose-600" : "text-emerald-600" },
              ].map((s) => (
                <div key={s.l} className="glass-soft rounded-xl px-3.5 py-2.5 text-center">
                  <div className={`text-xl font-bold tabular-nums ${s.tone}`}>{s.v}</div>
                  <div className="text-[9.5px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">{s.l}</div>
                </div>
              ));
            })()}
          </div>

          {/* Disclosures grouped by framework principle — Section C style */}
          <div className="px-8 py-6 flex flex-col gap-6">
            {groupByPrinciple(rep.sections ?? []).map(([principle, secs]) => (
              <div key={principle}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#3d5a99]">
                    {principle}
                  </span>
                  <span className="flex-1 h-px bg-slate-300/70" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {secs.map((sec) => (
                    <div key={sec.sourceName} className="rounded-xl border border-slate-200 bg-white/60 p-5">
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200/80">
                        <div>
                          <h3 className="text-[13px] font-semibold text-slate-800">{sec.sourceName}</h3>
                          <p className="text-[10.5px] text-slate-400">
                            {sec.department} · Data owner: {sec.owner}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {Object.entries(sec.values).map(([k, v]) => (
                          <div key={k}>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                              {k.replace(/_/g, " ")}
                            </div>
                            <div className="text-xl font-bold tabular-nums text-slate-900 mt-0.5">
                              {typeof v === "number" ? v.toLocaleString() : v}
                              {unitOf(k) && <span className="text-[10.5px] font-medium text-slate-400 ml-1">{unitOf(k)}</span>}
                            </div>
                            <Delta field={k} value={v} />
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
              </div>
            ))}
          </div>

          {/* Assurance statement */}
          {rep.assurance && rep.assurance !== "none" && (
            <div className="mx-8 mb-5 rounded-xl bg-indigo-50/70 border border-indigo-200 p-4">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#3d5a99] mb-1">
                ✒ Assurance statement
              </p>
              <p className="text-[11.5px] text-slate-600 leading-relaxed">
                {rep.assurance === "reasonable"
                  ? "The KPIs disclosed above were subjected to reasonable assurance by an independent third-party assurance provider across all locations, covering a sample of more than 90% of reported data. Human corrections made during review are annotated against the respective disclosure."
                  : rep.assurance === "limited"
                    ? "The KPIs disclosed above were subjected to limited assurance by an independent third-party assurance provider. Human corrections made during review are annotated against the respective disclosure."
                    : "The KPIs disclosed above were internally assessed by Group Sustainability together with the respective department SPOCs prior to publication. Human corrections made during review are annotated against the respective disclosure."}
              </p>
            </div>
          )}

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
