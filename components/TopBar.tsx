"use client";

import { useStore } from "@/lib/store";

export function TopBar() {
  const { sources, reports } = useStore();

  const collected = sources.filter((s) => s.status === "submitted").length;
  const collectRate = sources.length ? Math.round((collected / sources.length) * 100) : 0;
  const generated = reports.filter((r) => r.status === "generated" || r.status === "generated_partial").length;

  return (
    <header className="sticky top-0 z-20 glass border-b border-slate-200/70">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3d5a99] to-[#d63a5f] flex items-center justify-center font-bold text-white shadow-lg shadow-rose-300/50">
            F
          </div>
          <span className="font-semibold text-sm text-slate-900">FlowOS</span>
        </div>

        <div className="hidden md:flex items-center gap-5 text-[12px]">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-500 text-emerald-500" />
            <span className="font-medium text-slate-700">FY26 reporting cycle · live</span>
          </div>
          <div className="hidden lg:flex items-center gap-4 font-mono text-[10.5px] border-l border-slate-200 pl-5">
            <span className="text-slate-400">
              COLLECTION <span className="text-slate-800 font-bold">{collectRate}%</span>
            </span>
            <span className="text-slate-400">
              AI ACCURACY <span className="text-emerald-600 font-bold">98.7%</span>
            </span>
            <span className="text-slate-400">
              REPORTS OUT <span className="text-[#d63a5f] font-bold">{generated}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-glow" />
          All agents online
        </div>
      </div>
    </header>
  );
}
