"use client";

import { useState } from "react";
import { QueryHub } from "./QueryHub";
import { AdminPanel } from "./AdminPanel";
import { TopBar } from "./TopBar";
import { ReportDeck } from "./ReportDeck";
import { Workspace, WorkspaceTabKey, WORKSPACE_TABS } from "./Workspace";
import { TourHud, TOUR_STEPS } from "./Tour";
import { useStore } from "@/lib/store";

const NAV = [
  { key: "home", label: "Reports", icon: "▦", hint: "All report workspaces" },
  { key: "query", label: "Ask FlowOS", icon: "✦", hint: "Knowledge agent Q&A" },
  { key: "settings", label: "Settings", icon: "⚙", hint: "Integrations · RBAC · audit" },
] as const;

type NavKey = (typeof NAV)[number]["key"];

const TITLES: Record<NavKey, { title: string; sub: string }> = {
  home: { title: "Report Workspaces", sub: "Every card is an isolated report running the full agentic pipeline. Open one to work inside it; rename from its tab." },
  query: { title: "Ask FlowOS", sub: "Query everything the platform has collected across all reports — like chatting with your operations data." },
  settings: { title: "Platform Administration", sub: "Enterprise API tokens, connector toggles, user role scopes, and the tamper-evident security ledger." },
};

const WORKSPACE_KEYS = WORKSPACE_TABS.map((t) => t.key) as string[];

export function Tabs() {
  const [view, setView] = useState<NavKey>("home");
  const [wsTab, setWsTab] = useState<WorkspaceTabKey>("dashboard");
  const [tourStep, setTourStep] = useState(1);
  const [showTour, setShowTour] = useState(true);
  const { events, sources, reports, activeReportId, setActiveReport, openReport } = useStore();

  const inWorkspace = activeReportId !== null;

  const tourTarget = showTour ? TOUR_STEPS[tourStep - 1]?.tab : null;
  const goToStep = (n: number) => {
    setTourStep(n);
    const tab = TOUR_STEPS[n - 1]?.tab;
    if (!tab) return;
    if (WORKSPACE_KEYS.includes(tab)) {
      // Workspace step: open the first seeded report and jump to that inner tab.
      const target = reports[0];
      if (target) {
        openReport(target.id);
        setWsTab(tab as WorkspaceTabKey);
      }
    } else {
      setActiveReport(null);
      setView(tab as NavKey);
    }
  };

  const selectView = (key: NavKey) => {
    setActiveReport(null);
    setView(key);
  };

  const openFlags = sources.flatMap((s) => s.flags).filter((f) => f.status === "open").length;
  const alerts = sources.filter((s) => s.status === "human_alert").length;
  const reviewCount = openFlags + alerts;

  return (
    <div className="flex flex-1 min-h-screen">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col glass border-r border-slate-200/70 sticky top-0 h-screen">
        <div className="px-5 py-6 flex items-center gap-3 border-b border-slate-200/70">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3d5a99] via-[#d63a5f] to-[#f2a0b5] flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-rose-300/60">
            F
          </div>
          <div>
            <div className="font-semibold tracking-tight text-[15px] text-slate-900">FlowOS</div>
            <div className="text-[11px] text-slate-500 leading-tight">Agentic Operations Platform</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map((n) => {
            const isActive = !inWorkspace && view === n.key;
            return (
              <button
                key={n.key}
                onClick={() => selectView(n.key)}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-rose-100/80 to-amber-50/60 text-slate-900 accent-ring"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/70"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors ${
                    isActive
                      ? "bg-[#d63a5f] text-white shadow-md shadow-rose-300/60"
                      : "bg-[#f4ede3] text-slate-400 group-hover:text-slate-600"
                  }`}
                >
                  {n.icon}
                </span>
                <span className="flex-1">
                  <span className="block text-[13px] font-medium leading-tight">{n.label}</span>
                  <span className="block text-[10.5px] text-slate-400 leading-tight mt-0.5">{n.hint}</span>
                </span>
                {n.key === "home" && reviewCount > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 border border-rose-200 pulse-glow">
                    {reviewCount}
                  </span>
                )}
                {tourTarget === n.key && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#d63a5f] pulse-glow shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-slate-200/70 flex flex-col gap-2.5">
          {/* Persona widget */}
          <div className="glass-soft rounded-xl p-3 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3d5a99] to-[#7ca982] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              YB
            </span>
            <div className="min-w-0">
              <div className="text-[11.5px] font-semibold text-slate-800 leading-tight">Yash B</div>
              <div className="text-[9.5px] text-slate-400 leading-tight">VP, Global Compliance &amp; Ops</div>
            </div>
          </div>
          <div className="glass-soft rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-500 text-emerald-500" />
              <span className="text-[11px] font-medium text-emerald-700">All agents online</span>
            </div>
            <div className="text-[10.5px] text-slate-500 leading-relaxed">
              {events.length} actions executed autonomously
            </div>
          </div>
          <button
            onClick={() => setShowTour((v) => !v)}
            className={`text-[11px] font-semibold rounded-xl px-3 py-2 border transition-colors ${
              showTour
                ? "bg-rose-50 border-rose-200 text-[#d63a5f]"
                : "glass-soft border-slate-200 text-slate-500 hover:text-slate-800"
            }`}
          >
            ✦ {showTour ? "Hide demo flow" : "Show demo flow"}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 px-6 lg:px-10 pb-12">
          <div className="max-w-6xl mx-auto">
            {/* Mobile nav */}
            <div className="md:hidden flex gap-2 overflow-x-auto pt-4 pb-1 -mx-1 px-1">
              {NAV.map((n) => (
                <button
                  key={n.key}
                  onClick={() => selectView(n.key)}
                  className={`whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-medium transition ${
                    !inWorkspace && view === n.key
                      ? "bg-[#d63a5f] text-white shadow-md shadow-rose-300/60"
                      : "glass-soft text-slate-500"
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>

            {inWorkspace ? (
              <div className="pt-8">
                <Workspace tab={wsTab} onTab={setWsTab} />
              </div>
            ) : (
              <>
                <div className="pt-8 pb-6 fade-up">
                  <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ fontFamily: "var(--font-zen), var(--font-geist-sans), sans-serif" }}
                  >
                    <span className="grad-text">{TITLES[view].title}</span>
                  </h1>
                  <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">{TITLES[view].sub}</p>
                </div>

                <div key={view} className="fade-up fade-up-1">
                  {view === "home" && <ReportDeck />}
                  {view === "query" && <QueryHub />}
                  {view === "settings" && <AdminPanel />}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {showTour && <TourHud step={tourStep} onStep={goToStep} onClose={() => setShowTour(false)} />}
    </div>
  );
}
