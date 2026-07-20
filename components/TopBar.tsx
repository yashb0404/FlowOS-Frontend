"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

export function TopBar() {
  const { tick, advanceDay, reset, sources, reports } = useStore();

  const collected = sources.filter((s) => s.status === "submitted").length;
  const collectRate = sources.length ? Math.round((collected / sources.length) * 100) : 0;
  const generated = reports.filter((r) => r.status === "generated" || r.status === "generated_partial").length;
  const [autoPlay, setAutoPlay] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoPlay) {
      intervalRef.current = setInterval(advanceDay, 1400);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoPlay, advanceDay]);

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
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#3d5a99] text-[#3d5a99]" />
            <span>
              Day <span className="text-slate-900 font-bold tabular-nums">{tick}</span>
            </span>
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

        <div className="flex items-center gap-2.5">
          <button
            onClick={advanceDay}
            className="btn-primary px-4 py-2 text-[13px] rounded-xl text-white font-semibold"
          >
            Advance Day →
          </button>
          <button
            onClick={() => setAutoPlay((v) => !v)}
            className={`px-3.5 py-2 text-[13px] rounded-xl font-medium transition-all duration-200 border ${
              autoPlay
                ? "bg-indigo-50 border-indigo-300 text-[#3d5a99] shadow-lg shadow-indigo-200/40"
                : "glass-soft border-slate-300/70 text-slate-600 hover:border-slate-400/70 hover:text-slate-900"
            }`}
          >
            {autoPlay ? "◼ Pause" : "▶ Auto-play"}
          </button>
          <button
            onClick={() => {
              setAutoPlay(false);
              reset();
            }}
            className="px-3.5 py-2 text-[13px] rounded-xl glass-soft border border-slate-300/70 text-slate-400 hover:text-slate-700 hover:border-slate-400/70 transition-all duration-200"
          >
            ↺ Reset
          </button>
        </div>
      </div>
    </header>
  );
}
