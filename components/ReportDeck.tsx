"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Report } from "@/lib/types";
import { reportProgress } from "@/lib/engine";

const STATUS_META: Record<Report["status"], { label: string; cls: string }> = {
  collecting: { label: "Collecting", cls: "text-amber-600" },
  blocked: { label: "Awaiting review", cls: "text-rose-600" },
  generated: { label: "Generated ✓", cls: "text-emerald-600" },
  generated_partial: { label: "Generated · gaps", cls: "text-orange-600" },
};

/** Main-page field of report cards — YouTube-style, renamable, with a progress bar. */
export function ReportDeck() {
  const { reports, sources, events, tick, openReport, createReport } = useStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  function submitCreate() {
    if (!newName.trim()) return;
    createReport(newName.trim());
    setNewName("");
    setCreating(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map((rep, i) => (
          <ReportCard key={rep.id} rep={rep} delay={`fade-up-${Math.min(i + 1, 4)}`} />
        ))}

        {/* + New report card */}
        <div className="glass rounded-2xl overflow-hidden fade-up fade-up-4 border-2 border-dashed border-slate-300/70 flex flex-col items-center justify-center min-h-[220px] p-6">
          {creating ? (
            <div className="w-full flex flex-col gap-2.5">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Name your report</p>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitCreate();
                  if (e.key === "Escape") setCreating(false);
                }}
                placeholder="e.g. Monthly Ops — Plant B · August"
                className="w-full px-3 py-2 text-[13px] rounded-lg bg-white/70 border border-slate-300/70 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-rose-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={submitCreate}
                  disabled={!newName.trim()}
                  className="btn-primary px-3.5 py-1.5 text-[12px] rounded-lg text-white font-semibold disabled:opacity-40"
                >
                  Create
                </button>
                <button
                  onClick={() => setCreating(false)}
                  className="px-3.5 py-1.5 text-[12px] rounded-lg glass-soft border border-slate-300/70 text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Instantiates the standard flow template — 3 data sources, collection starts Day {tick + 1}.
              </p>
            </div>
          ) : (
            <button onClick={() => setCreating(true)} className="flex flex-col items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors">
              <span className="w-12 h-12 rounded-2xl glass-soft flex items-center justify-center text-2xl">＋</span>
              <span className="text-[13px] font-semibold">New Report</span>
              <span className="text-[10.5px]">from flow template</span>
            </button>
          )}
        </div>
      </div>

      {reports.length > 0 && (
        <p className="text-[11.5px] text-slate-400 px-1">
          Each card is an isolated workspace running the full pipeline — collection, communications, review and
          generation are scoped per report. Progress: collection 45% · checks 25% · generation 20% · sign-off 10%.
        </p>
      )}
    </div>
  );

  function ReportCard({ rep, delay }: { rep: Report; delay: string }) {
    const repSources = sources.filter((s) => s.reportId === rep.id);
    const repEvents = events.filter((e) => e.reportId === rep.id);
    const submitted = repSources.filter((s) => s.status === "submitted").length;
    const openFlags = repSources.flatMap((s) => s.flags).filter((f) => f.status === "open").length;
    const progress = reportProgress(rep, sources);
    const meta = STATUS_META[rep.status];
    const lastEvent = repEvents[repEvents.length - 1];

    const stages: { label: string; done: boolean; active: boolean }[] = [
      { label: "Collect", done: submitted === repSources.length && repSources.length > 0, active: submitted < repSources.length },
      { label: "Checks", done: submitted === repSources.length && openFlags === 0 && repSources.length > 0, active: openFlags > 0 },
      { label: "Generate", done: rep.status === "generated" || rep.status === "generated_partial", active: rep.status === "blocked" },
      { label: "Sign-off", done: Boolean(rep.signedBy), active: (rep.status === "generated" || rep.status === "generated_partial") && !rep.signedBy },
    ];

    return (
      <button
        onClick={() => openReport(rep.id)}
        className={`glass rounded-2xl overflow-hidden text-left group hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 ${delay} fade-up`}
      >
        {/* thumbnail: mini stage strip */}
        <div className="relative h-32 bg-gradient-to-br from-indigo-50/80 via-rose-50/60 to-amber-50/60 px-5 flex flex-col justify-center gap-3">
          <div className="flex items-center gap-1.5">
            {stages.map((st, i) => (
              <div key={st.label} className="flex items-center gap-1.5 flex-1 min-w-0">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 ${
                    st.done
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : st.active
                        ? "bg-rose-50 text-rose-600 border-rose-300 pulse-glow"
                        : "bg-white/70 text-slate-400 border-slate-200"
                  }`}
                >
                  {st.done ? "✓" : i + 1}
                </span>
                {i < stages.length - 1 && <span className={`flex-1 h-px ${st.done ? "bg-emerald-400" : "bg-slate-300/70"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[8.5px] uppercase tracking-wider font-semibold text-slate-400 px-0.5">
            {stages.map((st) => (
              <span key={st.label} className={st.done ? "text-emerald-600" : st.active ? "text-rose-500" : ""}>
                {st.label}
              </span>
            ))}
          </div>
          <span className="absolute top-2.5 right-2.5 text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-md bg-slate-900/80 text-white">
            {progress}%
          </span>
          {/* YouTube-style progress bar at bottom edge of thumbnail */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-200/80">
            <div
              className={`h-full transition-all duration-500 ${progress === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-[#3d5a99] to-[#d63a5f]"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* title + meta */}
        <div className="px-5 py-4">
          <h3 className="text-[13.5px] font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#b7245c] transition-colors">
            {rep.name}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1.5">
            <span className={`font-semibold ${meta.cls}`}>{meta.label}</span>
            {" · "}
            {submitted}/{repSources.length} sources
            {openFlags > 0 && (
              <>
                {" · "}
                <span className="text-rose-500 font-medium">⚑ {openFlags} open</span>
              </>
            )}
          </p>
          {rep.regulation && (
            <p className="text-[9.5px] text-slate-400 mt-1 truncate">
              ⚖ {rep.regulation}
              {rep.assurance && rep.assurance !== "none" && (
                <span className="ml-1.5 px-1.5 py-px rounded border bg-indigo-50 border-indigo-200 text-[#3d5a99] font-semibold uppercase text-[8.5px]">
                  {rep.assurance} assurance
                </span>
              )}
            </p>
          )}
          <p className="text-[10px] text-slate-400 mt-1 truncate">
            {lastEvent ? `Day ${lastEvent.timestamp}: ${lastEvent.message}` : `Scheduled — advance the day to start collection.`}
          </p>
        </div>
      </button>
    );
  }
}
