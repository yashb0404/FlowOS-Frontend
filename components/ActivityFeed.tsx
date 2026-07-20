"use client";

import { useStore } from "@/lib/store";
import { Channel, EventKind } from "@/lib/types";

const ACTOR_STYLE: Record<string, { chip: string; label: string }> = {
  "Collection Agent": { chip: "bg-cyan-50 text-cyan-700 border-cyan-200", label: "text-cyan-600" },
  "Extraction Agent": { chip: "bg-violet-50 text-violet-600 border-violet-200", label: "text-violet-600" },
  "Validation Agent": { chip: "bg-amber-50 text-amber-700 border-amber-200", label: "text-amber-600" },
  "Reconciliation Agent": { chip: "bg-orange-50 text-orange-700 border-orange-200", label: "text-orange-600" },
  "Reporting Agent": { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "text-emerald-600" },
  "Human Reviewer": { chip: "bg-rose-50 text-rose-600 border-rose-200", label: "text-rose-600" },
};

const KIND_ICON: Record<EventKind, string> = {
  reminder_sent: "✉",
  human_alert: "🔔",
  submitted: "✓",
  extraction_done: "▤",
  validation_flag: "⚑",
  reconciliation_flag: "≠",
  reconciliation_done: "≈",
  flag_resolved: "⚖",
  report_generated: "▦",
  report_signed: "✍",
};

const CHANNEL_LABEL: Record<Channel, { text: string; cls: string }> = {
  email: { text: "via Email", cls: "bg-rose-50 text-rose-600 border-rose-200" },
  teams: { text: "via Teams", cls: "bg-violet-50 text-violet-600 border-violet-200" },
};

export function ActivityFeed({ reportId }: { reportId: string }) {
  const { events } = useStore();
  const ordered = events.filter((e) => e.reportId === reportId).reverse();

  if (ordered.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl glass-soft flex items-center justify-center text-xl text-slate-400 mb-4">
          ⌁
        </div>
        <p className="text-slate-600 text-sm font-medium">No agent activity yet</p>
        <p className="text-slate-400 text-[12px] mt-1">Advance a day from the top bar to start the pipeline.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl px-6 py-5">
      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-rose-300 via-amber-200/70 to-transparent" />

        <div className="flex flex-col">
          {ordered.map((evt, idx) => {
            const style = ACTOR_STYLE[evt.actor];
            const highlight =
              evt.kind === "human_alert" ||
              evt.kind === "validation_flag" ||
              evt.kind === "reconciliation_flag" ||
              evt.kind === "report_generated";
            const showDay = idx === 0 || ordered[idx - 1].timestamp !== evt.timestamp;

            return (
              <div key={evt.id}>
                {showDay && (
                  <div className="flex items-center gap-3 pl-10 pt-4 pb-2">
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">
                      Day {evt.timestamp}
                    </span>
                    <span className="flex-1 h-px bg-slate-200/80" />
                  </div>
                )}
                <div className="relative flex items-start gap-4 py-2.5 group">
                  <span
                    className={`relative z-10 w-8 h-8 rounded-full border flex items-center justify-center text-[13px] shrink-0 transition-transform group-hover:scale-110 ${style.chip} ${
                      highlight ? "accent-ring" : ""
                    }`}
                  >
                    {KIND_ICON[evt.kind]}
                  </span>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[13px] text-slate-700 leading-snug">{evt.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className={`text-[10.5px] font-semibold uppercase tracking-wider ${style.label}`}>
                        {evt.actor}
                      </p>
                      {evt.comm && (
                        <span
                          className={`text-[9.5px] font-medium px-1.5 py-0.5 rounded-full border ${CHANNEL_LABEL[evt.comm.channel].cls}`}
                        >
                          {CHANNEL_LABEL[evt.comm.channel].text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
