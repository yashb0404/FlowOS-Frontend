"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Flag } from "@/lib/types";

export function Review({ reportId }: { reportId: string }) {
  const { reports, sources, resolveFlag, forceGenerateReport } = useStore();
  const repSourcesAll = sources.filter((s) => s.reportId === reportId);

  const allFlags = repSourcesAll.flatMap((s) => s.flags.map((f) => ({ flag: f, src: s })));
  const open = allFlags.filter((x) => x.flag.status === "open");
  const resolved = allFlags.filter((x) => x.flag.status !== "open");

  const blockedReports = reports.filter((r) => {
    if (r.id !== reportId) return false;
    if (r.status === "generated" || r.status === "generated_partial") return false;
    const repSources = sources.filter((s) => s.reportId === r.id);
    const hasAlert = repSources.some((s) => s.status === "human_alert");
    const hasOpen = repSources.some((s) => s.flags.some((f) => f.status === "open"));
    return hasAlert || hasOpen;
  });

  if (allFlags.length === 0 && blockedReports.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl glass-soft flex items-center justify-center text-xl text-slate-400 mb-4">
          ⚖
        </div>
        <p className="text-slate-600 text-sm font-medium">Nothing needs a human yet</p>
        <p className="text-slate-400 text-[12px] mt-1 max-w-sm mx-auto">
          Validation and reconciliation flags land here, along with reports blocked on missing data. Advance the
          simulation to see the agents route work to you.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Open flags ── */}
      {open.length > 0 && (
        <section>
          <SectionLabel icon="⚑" text={`Open flags — your decision needed (${open.length})`} tone="text-rose-600" />
          <div className="grid gap-4 lg:grid-cols-2 mt-3">
            {open.map(({ flag, src }) => (
              <FlagCard key={flag.id} flag={flag} srcName={`${src.label} · ${src.name}`} owner={src.owner} onResolve={resolveFlag} />
            ))}
          </div>
        </section>
      )}

      {/* ── Blocked reports / force generate ── */}
      {blockedReports.length > 0 && (
        <section>
          <SectionLabel icon="⛔" text="Reports waiting on data or decisions" tone="text-amber-600" />
          <div className="grid gap-4 mt-3">
            {blockedReports.map((rep) => {
              const repSources = sources.filter((s) => s.reportId === rep.id);
              const missing = repSources.filter((s) => s.status !== "submitted");
              const openCount = repSources.flatMap((s) => s.flags).filter((f) => f.status === "open").length;
              return (
                <div key={rep.id} className="glass rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-[13.5px] font-semibold text-slate-900">{rep.name}</h3>
                    <p className="text-[12px] text-slate-500 mt-1">
                      {missing.length > 0 && (
                        <>
                          Waiting on:{" "}
                          <span className="text-rose-600 font-medium">
                            {missing.map((m) => `${m.name} (${m.owner})`).join(", ")}
                          </span>
                          {openCount > 0 && " · "}
                        </>
                      )}
                      {openCount > 0 && <>{openCount} unresolved flag(s)</>}
                    </p>
                  </div>
                  <button
                    onClick={() => forceGenerateReport(rep.id)}
                    className="px-4 py-2 text-[12.5px] rounded-xl font-semibold border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    Generate anyway — mark gaps
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Resolved audit trail ── */}
      {resolved.length > 0 && (
        <section>
          <SectionLabel icon="✓" text={`Resolved (${resolved.length})`} tone="text-emerald-600" />
          <div className="flex flex-col gap-2 mt-3">
            {resolved.map(({ flag, src }) => (
              <div key={flag.id} className="glass-soft rounded-xl px-4 py-3 flex items-center gap-3">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    flag.status === "approved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-indigo-50 text-[#3d5a99] border-indigo-200"
                  }`}
                >
                  {flag.status === "approved" ? "APPROVED" : "OVERRIDDEN"}
                </span>
                <p className="text-[12px] text-slate-600 flex-1">
                  <span className="font-medium text-slate-800">{src.name}</span> · {flag.field.replace(/_/g, " ")} —{" "}
                  {flag.status === "approved"
                    ? `kept submitted value${flag.extractedValue !== undefined ? ` (${flag.extractedValue})` : ""}`
                    : `changed to ${flag.resolvedValue}`}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FlagCard({
  flag,
  srcName,
  owner,
  onResolve,
}: {
  flag: Flag;
  srcName: string;
  owner: string;
  onResolve: (flagId: string, mode: "approve" | "override", value?: number | string) => void;
}) {
  const [custom, setCustom] = useState("");
  const isRecon = flag.type === "reconciliation";

  return (
    <div className="glass rounded-2xl p-5 relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${isRecon ? "bg-gradient-to-b from-rose-500 to-orange-400" : "bg-gradient-to-b from-amber-500 to-yellow-400"}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={`text-[9.5px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
              isRecon ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {isRecon ? "Reconciliation mismatch" : "Validation · missing field"}
          </span>
          <h3 className="text-[13.5px] font-semibold text-slate-900 mt-2">{srcName}</h3>
          <p className="text-[11px] text-slate-400">{owner}</p>
        </div>
      </div>

      <p className="text-[12.5px] text-slate-600 mt-3 leading-relaxed">{flag.detail}</p>

      <div className="mt-2.5 rounded-lg bg-slate-900 px-3 py-2">
        <p className="text-[9px] uppercase tracking-wider font-bold text-cyan-300">✦ AI diagnosis</p>
        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
          {isRecon
            ? `Likely cause: late-posted or duplicate entry in the source system. Submitted deviates ${
                flag.extractedValue && flag.referenceValue
                  ? `${(((Number(flag.extractedValue) - Number(flag.referenceValue)) / Number(flag.referenceValue)) * 100).toFixed(1)}%`
                  : ""
              } from ERP. Recommended: use the ERP value unless the owner confirms a correction.`
            : `The template requires this field for downstream totals. Recommended: request the value from the owner, or accept without it and let the gap be marked.`}
        </p>
      </div>

      {isRecon && (
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <div className="glass-soft rounded-xl px-3.5 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Submitted</div>
            <div className="text-lg font-bold tabular-nums text-rose-600 mt-0.5">{flag.extractedValue}</div>
          </div>
          <div className="glass-soft rounded-xl px-3.5 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">ERP snapshot</div>
            <div className="text-lg font-bold tabular-nums text-[#3d5a99] mt-0.5">{flag.referenceValue}</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button
          onClick={() => onResolve(flag.id, "approve")}
          className="px-3.5 py-1.5 text-[12px] rounded-lg font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors"
        >
          {isRecon ? "Approve submitted value" : "Accept without field"}
        </button>
        {isRecon && (
          <button
            onClick={() => onResolve(flag.id, "override", flag.referenceValue)}
            className="px-3.5 py-1.5 text-[12px] rounded-lg font-semibold bg-indigo-50 text-[#3d5a99] border border-indigo-300 hover:bg-indigo-100 transition-colors"
          >
            Use ERP value ({flag.referenceValue})
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={isRecon ? "or enter value…" : "enter missing value…"}
            className="w-32 px-2.5 py-1.5 text-[12px] rounded-lg glass-soft border border-slate-300/70 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-300"
          />
          <button
            onClick={() => {
              if (custom.trim() === "") return;
              const num = Number(custom);
              onResolve(flag.id, "override", Number.isNaN(num) ? custom : num);
            }}
            className="px-3 py-1.5 text-[12px] rounded-lg font-semibold btn-primary text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ icon, text, tone }: { icon: string; text: string; tone: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className={`text-sm ${tone}`}>{icon}</span>
      <span className="text-[11px] uppercase tracking-widest font-semibold text-slate-500">{text}</span>
      <span className="flex-1 h-px bg-slate-200" />
    </div>
  );
}
