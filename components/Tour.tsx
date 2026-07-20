"use client";

import { useState } from "react";

export interface TourStep {
  tab: string;
  title: string;
  desc: string;
  action: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    tab: "home",
    title: "The report deck",
    desc: "Every card is an isolated report workspace with its own pipeline. The bar at the bottom of each card shows how far that report has progressed toward sign-off.",
    action: "Click Advance Day (or Auto-play) a few times and watch each card's progress bar fill at its own pace. Then open the Plant A card.",
  },
  {
    tab: "dashboard",
    title: "Inside a workspace: the generation gate",
    desc: "You're now inside one report. Everything here — dashboard, comms, review, activity — is scoped to this report only. It generates only when every source is collected, validated and reconciled.",
    action: "Notice the chrome-style tab above with this report's live % — double-click its title to rename the report.",
  },
  {
    tab: "flow",
    title: "The agent pipeline",
    desc: "Every report has its own live pipeline: collect → extract → validate → reconcile → human review → generate. The counts on each node are this report's alone.",
    action: "Drag any node, then click Test Run Workflow to watch a dry-run light up the pipeline.",
  },
  {
    tab: "comms",
    title: "Automated chasing",
    desc: "Every data source is chased by email — three escalating follow-ups. Only when automation is exhausted does a human get a Teams alert.",
    action: "Read the actual emails, then find the Teams alert for Zenith Distributors (the vendor who never submits).",
  },
  {
    tab: "review",
    title: "Human in the loop",
    desc: "Validation and reconciliation flags land here. The reviewer sees submitted vs ERP side-by-side and decides — nothing silently overwrites the data.",
    action: "Resolve both flags (approve, use ERP value, or type your own), then click 'Generate anyway — mark gaps' for the blocked report.",
  },
  {
    tab: "reports",
    title: "Template-built reports",
    desc: "The report fills its template the moment the gate opens. Human corrections are annotated; missing sections are explicitly marked as gaps. Signing pushes the card to 100%.",
    action: "Type your name in the Digital Release Signature box and click Complete Authorized Release — then check the card's bar on the deck.",
  },
  {
    tab: "query",
    title: "Ask your operations data",
    desc: "Everything collected becomes queryable knowledge — overdue sources, open flags, what's blocking which report.",
    action: "Click the 'What is blocking the Plant A report?' suggestion and watch the grounded answer.",
  },
];

export function TourHud({
  step,
  onStep,
  onClose,
}: {
  step: number;
  onStep: (n: number) => void;
  onClose: () => void;
}) {
  const [minimized, setMinimized] = useState(false);
  const data = TOUR_STEPS[step - 1];
  if (!data) return null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-5 right-5 z-40 glass rounded-full pl-3 pr-4 py-2.5 accent-ring shadow-2xl flex items-center gap-2 text-[12px] font-semibold text-slate-700 hover:scale-105 transition-transform"
      >
        <span className="text-[#d63a5f]">✦</span>
        Demo step {step}/{TOUR_STEPS.length}
        <span className="text-slate-400">▲</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-full max-w-sm glass rounded-2xl p-5 accent-ring fade-up shadow-2xl">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[#d63a5f]">✦</span>
          <span className="text-[10px] font-extrabold text-[#d63a5f] uppercase tracking-widest">
            Guided demo flow
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="px-1.5 py-0.5 text-slate-400 hover:text-slate-800 text-sm"
            title="Minimize"
          >
            ▾
          </button>
          <button
            onClick={() => onStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-1.5 py-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 text-sm"
          >
            ‹
          </button>
          <span className="text-[11px] font-bold tabular-nums text-slate-600 px-1">
            {step} / {TOUR_STEPS.length}
          </span>
          <button
            onClick={() => onStep(Math.min(TOUR_STEPS.length, step + 1))}
            disabled={step === TOUR_STEPS.length}
            className="px-1.5 py-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 text-sm"
          >
            ›
          </button>
        </div>
      </div>

      <div className="progress-track h-1 mb-4">
        <div className="progress-fill" style={{ width: `${(step / TOUR_STEPS.length) * 100}%` }} />
      </div>

      <h4 className="text-[13px] font-bold text-slate-900">
        {step}. {data.title}
      </h4>
      <p className="text-[12px] text-slate-500 leading-relaxed mt-1.5">{data.desc}</p>

      <div className="mt-3.5 rounded-xl bg-rose-50/80 border border-rose-200 p-3 flex items-start gap-2">
        <span className="text-[#d63a5f] text-sm shrink-0">▸</span>
        <div>
          <span className="text-[9.5px] font-bold text-[#b7245c] uppercase tracking-wider block">Try this</span>
          <p className="text-[12px] text-slate-700 font-medium mt-0.5 leading-snug">{data.action}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 text-[10.5px] text-slate-400">
        <span>Steps follow the whiteboard flow</span>
        <button onClick={onClose} className="hover:text-slate-800 font-semibold underline">
          Dismiss tour
        </button>
      </div>
    </div>
  );
}
