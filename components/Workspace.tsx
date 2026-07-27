"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { reportProgress } from "@/lib/engine";
import { Dashboard } from "./Dashboard";
import { Communications } from "./Communications";
import { Review } from "./Review";
import { ActivityFeed } from "./ActivityFeed";
import { Reports } from "./Reports";
import { FlowDiagram } from "./FlowDiagram";
import { BrsrDocument } from "./BrsrDocument";
import { CollectionTracker } from "./CollectionTracker";

export const WORKSPACE_TABS = [
  { key: "dashboard", label: "Collection Dashboard", icon: "◧" },
  { key: "tracker", label: "Live Tracker", icon: "▦" },
  { key: "flow", label: "Flow", icon: "⬡" },
  { key: "comms", label: "Communications", icon: "✉" },
  { key: "review", label: "Review", icon: "⚖" },
  { key: "activity", label: "Agent Activity", icon: "⌁" },
  { key: "qa", label: "Q&A Data Book", icon: "❓" },
  { key: "reports", label: "Generated Report", icon: "▦" },
] as const;

export type WorkspaceTabKey = (typeof WORKSPACE_TABS)[number]["key"];

const TAB_SUBS: Record<WorkspaceTabKey, string> = {
  dashboard: "This report is generated only when every one of its data sources is collected, validated and reconciled.",
  tracker: "The live collection tracker as a spreadsheet — status ticks over as sheets arrive; download the identical Excel any time.",
  flow: "This report's agent pipeline, live. Click any agent to inspect and configure its requirements for this report.",
  comms: "Every follow-up email and Teams alert sent for this report — exactly as recipients see them.",
  review: "Flags for this report land here. Approve, override, or force-generate with gaps — every decision is audited.",
  activity: "The complete, auditable trail of everything the agents did for this report.",
  qa: "Each department's BRSR questions, answered straight from its submitted sheet — the raw material for the report.",
  reports: "Built from the template the moment this report's generation gate opens — never before.",
};

export function Workspace({
  tab,
  onTab,
}: {
  tab: WorkspaceTabKey;
  onTab: (t: WorkspaceTabKey) => void;
}) {
  const {
    reports,
    sources,
    openReportIds,
    activeReportId,
    setActiveReport,
    closeReport,
    renameReport,
  } = useStore();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  const active = reports.find((r) => r.id === activeReportId);
  if (!active) return null;

  const openReports = openReportIds
    .map((id) => reports.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  function commitRename(id: string) {
    if (draftName.trim()) renameReport(id, draftName);
    setRenamingId(null);
  }

  return (
    <div className="flex flex-col">
      {/* ── Chrome-style report tab strip ── */}
      <div className="flex items-end gap-1 overflow-x-auto pb-0 -mb-px">
        <button
          onClick={() => setActiveReport(null)}
          className="shrink-0 px-3 py-2 text-[12px] rounded-t-xl glass-soft border border-b-0 border-slate-200/70 text-slate-500 hover:text-slate-800 transition-colors"
          title="Back to all reports"
        >
          ← Deck
        </button>
        {openReports.map((rep) => {
          const isActive = rep.id === activeReportId;
          const progress = reportProgress(rep, sources);
          return (
            <div
              key={rep.id}
              className={`shrink-0 flex items-center gap-2 rounded-t-xl border border-b-0 px-3.5 py-2 max-w-[240px] cursor-pointer transition-colors relative overflow-hidden ${
                isActive
                  ? "glass border-slate-200/70 text-slate-900"
                  : "bg-white/40 border-slate-200/50 text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setActiveReport(rep.id)}
            >
              {renamingId === rep.id ? (
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={() => commitRename(rep.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(rep.id);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-40 text-[12px] bg-white/80 border border-rose-200 rounded px-1.5 py-0.5 focus:outline-none"
                />
              ) : (
                <span
                  className="text-[12px] font-medium truncate"
                  title={`${rep.name} — double-click to rename`}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(rep.id);
                    setDraftName(rep.name);
                  }}
                >
                  {rep.name}
                </span>
              )}
              <span className="text-[9.5px] tabular-nums font-bold text-slate-400 shrink-0">{progress}%</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeReport(rep.id);
                }}
                className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                title="Close tab"
              >
                ✕
              </button>
              {/* per-tab progress underline */}
              <span className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#3d5a99] to-[#d63a5f]" style={{ width: `${progress}%` }} />
            </div>
          );
        })}
      </div>

      {/* ── Workspace body ── */}
      <div className="glass rounded-b-2xl rounded-tr-2xl border border-slate-200/70 p-5 lg:p-7">
        <div className="pb-5 fade-up">
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-zen), var(--font-geist-sans), sans-serif" }}
          >
            <span className="grad-text">{active.name}</span>
          </h1>
          <p className="text-[12.5px] text-slate-500 mt-1 max-w-2xl">{TAB_SUBS[tab]}</p>
        </div>

        {/* inner tab nav */}
        <div className="flex gap-2 overflow-x-auto pb-5 -mx-1 px-1">
          {WORKSPACE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => onTab(t.key)}
              className={`whitespace-nowrap px-3.5 py-2 rounded-lg text-[12px] font-medium transition flex items-center gap-1.5 ${
                tab === t.key
                  ? "bg-[#d63a5f] text-white shadow-md shadow-rose-300/60"
                  : "glass-soft text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="text-[11px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div key={`${active.id}-${tab}`} className="fade-up fade-up-1">
          {tab === "dashboard" && <Dashboard reportId={active.id} />}
          {tab === "tracker" && <CollectionTracker reportId={active.id} />}
          {tab === "flow" && <FlowDiagram reportId={active.id} />}
          {tab === "comms" && <Communications reportId={active.id} />}
          {tab === "review" && <Review reportId={active.id} />}
          {tab === "activity" && <ActivityFeed reportId={active.id} />}
          {tab === "qa" && <BrsrDocument reportId={active.id} />}
          {tab === "reports" && <Reports reportId={active.id} />}
        </div>
      </div>
    </div>
  );
}
