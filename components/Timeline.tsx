"use client";

import { useStore } from "@/lib/store";

/** Day 1 = 08-Apr-2026 (FY26 data-collection circulation date, per the client plan). */
const SPAN_DAYS = 91; // Apr 08 → Jul 07 (13 weeks)

function dateOf(day: number): Date {
  const d = new Date(2026, 3, 7); // Apr 7 = Day 0
  d.setDate(d.getDate() + day);
  return d;
}
function fmt(day: number): string {
  return dateOf(day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

type Track = "BRSR Report" | "Sustainability Report";
interface Milestone {
  track: Track;
  label: string;
  target: string; // as written in the client plan
  startDay: number;
  endDay: number;
  point?: boolean;
  check?: (c: Ctx) => boolean; // real-state completion; absent → date-driven
}
interface Ctx {
  brsrIn: boolean;
  brsrClean: boolean;
  brsrDone: boolean;
  susIn: boolean;
  susDone: boolean;
}

const MILESTONES: Milestone[] = [
  { track: "BRSR Report", label: "Circulation of Excel sheets for data collection", target: "08-Apr", startDay: 1, endDay: 3, point: true },
  { track: "BRSR Report", label: "Familiarization session to all SPOCs", target: "13-Apr", startDay: 5, endDay: 7, point: true },
  { track: "BRSR Report", label: "Data entry & compilation in Excel sheets", target: "24-Apr", startDay: 8, endDay: 17, check: (c) => c.brsrIn },
  { track: "BRSR Report", label: "Internal assurance of BRSR data", target: "27–30 Apr", startDay: 20, endDay: 23, check: (c) => c.brsrIn && c.brsrClean },
  { track: "BRSR Report", label: "External assurance of BRSR data", target: "3rd week May", startDay: 38, endDay: 44, check: (c) => c.brsrIn && c.brsrClean },
  { track: "BRSR Report", label: "Closure of findings & final assurance report", target: "29-May", startDay: 50, endDay: 52 },
  { track: "BRSR Report", label: "Closure of BRSR report", target: "03-Jun", startDay: 55, endDay: 57, point: true, check: (c) => c.brsrDone },
  { track: "Sustainability Report", label: "Initiation of preparation", target: "05-Jun", startDay: 58, endDay: 60, point: true },
  { track: "Sustainability Report", label: "Completion of information collection", target: "20-Jun", startDay: 60, endDay: 74, check: (c) => c.susIn },
  { track: "Sustainability Report", label: "Development of sustainability report content", target: "30-Jun", startDay: 75, endDay: 84 },
  { track: "Sustainability Report", label: "Design of sustainability report", target: "07-Jul", startDay: 85, endDay: 91, point: true, check: (c) => c.susDone },
];

type Status = "done" | "active" | "at_risk" | "upcoming";
const STATUS_META: Record<Status, { bar: string; chip: string; label: string }> = {
  done: { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Done" },
  active: { bar: "bg-amber-400", chip: "bg-amber-50 text-amber-700 border-amber-200", label: "In progress" },
  at_risk: { bar: "bg-rose-500", chip: "bg-rose-50 text-rose-600 border-rose-200", label: "At risk" },
  upcoming: { bar: "bg-slate-300", chip: "bg-slate-100 text-slate-400 border-slate-200", label: "Upcoming" },
};

export function Timeline() {
  const { reports, sources, tick } = useStore();

  const srcOf = (id: string) => sources.filter((s) => s.reportId === id);
  const brsrSrc = srcOf("rep-1");
  const susSrc = srcOf("rep-2");
  const rep = (id: string) => reports.find((r) => r.id === id);
  const isDone = (id: string) => {
    const r = rep(id);
    return !!r && (r.status === "generated" || r.status === "generated_partial" || !!r.signedBy);
  };

  const ctx: Ctx = {
    brsrIn: brsrSrc.length > 0 && brsrSrc.every((s) => s.status === "submitted"),
    brsrClean: brsrSrc.length > 0 && brsrSrc.every((s) => s.status === "submitted") && !brsrSrc.some((s) => s.flags.some((f) => f.status === "open")),
    brsrDone: isDone("rep-1"),
    susIn: susSrc.length > 0 && susSrc.every((s) => s.status === "submitted"),
    susDone: isDone("rep-2"),
  };

  function statusOf(m: Milestone): Status {
    const satisfied = m.check ? m.check(ctx) : tick > m.endDay;
    if (satisfied) return "done";
    if (tick > m.endDay) return "at_risk";
    if (tick >= m.startDay) return "active";
    return "upcoming";
  }

  const x = (day: number) => ((day - 1) / SPAN_DAYS) * 100;
  const todayLeft = Math.max(0, Math.min(100, x(tick + 1)));

  // Month header groups across the 13 week columns.
  const weeks = Array.from({ length: 13 }, (_, i) => ({ startDay: 1 + i * 7, month: dateOf(1 + i * 7).toLocaleDateString("en-IN", { month: "short" }) }));
  const monthGroups: { month: string; span: number }[] = [];
  for (const w of weeks) {
    const last = monthGroups[monthGroups.length - 1];
    if (last && last.month === w.month) last.span++;
    else monthGroups.push({ month: w.month, span: 1 });
  }

  const tracks: Track[] = ["BRSR Report", "Sustainability Report"];
  const summary = MILESTONES.reduce(
    (acc, m) => {
      acc[statusOf(m)]++;
      return acc;
    },
    { done: 0, active: 0, at_risk: 0, upcoming: 0 } as Record<Status, number>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* summary strip */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[11px] text-slate-500">
          Program clock: <span className="font-semibold text-slate-800">Day {tick}</span> · {fmt(tick)} &rsquo;26
        </span>
        <span className="flex-1" />
        {(["done", "active", "at_risk", "upcoming"] as Status[]).map((s) => (
          <span key={s} className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_META[s].chip}`}>
            {summary[s]} {STATUS_META[s].label}
          </span>
        ))}
      </div>

      <div className="glass rounded-2xl p-5 overflow-x-auto">
        <div className="min-w-[860px]">
          {/* header: month + week grid */}
          <div className="flex">
            <div className="w-[300px] shrink-0" />
            <div className="flex-1 relative">
              <div className="flex">
                {monthGroups.map((g, i) => (
                  <div key={i} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-l border-slate-200 pl-1.5 pb-0.5" style={{ width: `${(g.span / 13) * 100}%` }}>
                    {g.month} &rsquo;26
                  </div>
                ))}
              </div>
              <div className="flex">
                {weeks.map((w, i) => (
                  <div key={i} className="text-[8.5px] text-slate-400 border-l border-slate-100 pl-1 py-0.5" style={{ width: `${(1 / 13) * 100}%` }}>
                    W{i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* tracks */}
          {tracks.map((track) => (
            <div key={track} className="mt-2">
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#3d5a99] py-1.5 border-b border-slate-200">
                {track}
              </div>
              {MILESTONES.filter((m) => m.track === track).map((m, i) => {
                const st = statusOf(m);
                const meta = STATUS_META[st];
                return (
                  <div key={i} className="flex items-center border-b border-slate-100 group">
                    {/* label */}
                    <div className="w-[300px] shrink-0 py-2 pr-3">
                      <div className="text-[11.5px] text-slate-700 leading-tight">{m.label}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9.5px] text-slate-400">🎯 {m.target}</span>
                        <span className={`text-[8.5px] font-semibold px-1.5 py-px rounded border ${meta.chip}`}>{meta.label}</span>
                      </div>
                    </div>
                    {/* track lane */}
                    <div className="flex-1 relative h-9">
                      {/* week gridlines */}
                      {weeks.map((_, wi) => (
                        <div key={wi} className="absolute top-0 bottom-0 border-l border-slate-100" style={{ left: `${(wi / 13) * 100}%` }} />
                      ))}
                      {/* today line */}
                      <div className="absolute top-0 bottom-0 w-px bg-[#d63a5f] z-10" style={{ left: `${todayLeft}%` }} />
                      {/* bar */}
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-4 rounded-md ${meta.bar} ${st === "active" ? "pulse-glow" : ""} flex items-center justify-center shadow-sm`}
                        style={{ left: `${x(m.startDay)}%`, width: `${Math.max(x(m.endDay) - x(m.startDay), 1.5)}%` }}
                        title={`${m.label} · ${m.target} · ${meta.label}`}
                      >
                        {st === "done" && <span className="text-white text-[9px] font-bold">✓</span>}
                        {st === "at_risk" && <span className="text-white text-[9px] font-bold">!</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11.5px] text-slate-400 px-1">
        The AREPL FY26 assurance plan, live. Bars fill green as each milestone completes; a milestone turns{" "}
        <span className="text-rose-500 font-medium">red (at risk)</span> when its target date passes but the underlying
        data isn&rsquo;t in yet — e.g. SPOCs still chasing when internal assurance is due. The{" "}
        <span className="text-[#d63a5f] font-medium">vertical line</span> is today.
      </p>
    </div>
  );
}
