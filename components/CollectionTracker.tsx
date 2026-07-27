"use client";

import { useStore } from "@/lib/store";
import { trackerRows, TRACKER_COLUMNS, TrackerStatus } from "@/lib/tracker";
import { downloadTracker } from "@/lib/sheetExport";

const STATUS_CELL: Record<TrackerStatus, string> = {
  pending: "bg-slate-100 text-slate-500",
  reminded: "bg-amber-100 text-amber-800",
  human_alert: "bg-rose-100 text-rose-700",
  submitted: "bg-emerald-100 text-emerald-800",
};

const COL_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
// Right-align the numeric/short columns like a spreadsheet would.
const CENTER = new Set([0, 3]);

/** A live, Excel-styled collection tracker — updates as days advance, downloadable identically. */
export function CollectionTracker({ reportId }: { reportId: string }) {
  const { reports, sources, tick } = useStore();
  const rep = reports.find((r) => r.id === reportId);
  const repSources = sources.filter((s) => s.reportId === reportId);
  if (!rep) return null;

  const rows = trackerRows(repSources);
  const inCount = repSources.filter((s) => s.status === "submitted").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl overflow-hidden border border-emerald-800/25 shadow-lg">
        {/* Excel title bar */}
        <div className="bg-emerald-700 text-white px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="bg-white/20 rounded px-1.5 py-0.5 text-[11px] font-bold">▦</span>
            <span className="text-[12.5px] font-semibold truncate">
              {rep.name.replace(/[^\w]+/g, "_")}_CollectionTracker.xlsx
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-50">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-300 pulse-glow" /> live · Day {tick}
            </span>
            <button
              onClick={() => downloadTracker(rep, sources, tick)}
              className="text-[10.5px] font-semibold px-2.5 py-1 rounded border border-white/40 bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              ⬇ Download .xlsx
            </button>
          </div>
        </div>

        {/* Spreadsheet grid */}
        <div className="overflow-x-auto bg-white">
          <table className="text-[11.5px] border-collapse min-w-[900px] w-full">
            <thead>
              {/* Excel column letters */}
              <tr className="bg-slate-100 text-slate-400 text-[9px]">
                <th className="w-8 border border-slate-200 font-normal py-0.5"></th>
                {COL_LETTERS.map((l) => (
                  <th key={l} className="border border-slate-200 font-normal py-0.5">{l}</th>
                ))}
              </tr>
              {/* Column names */}
              <tr className="bg-slate-50 text-slate-600">
                <th className="border border-slate-200 bg-slate-100"></th>
                {TRACKER_COLUMNS.map((c) => (
                  <th key={c} className="border border-slate-200 px-2.5 py-1.5 text-left font-semibold whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const cells = [row.no, row.department, row.spoc, row.kpis, row.due, row.status, row.submittedOn, row.followUps, row.flags, row.evidence];
                return (
                  <tr key={row.no} className="hover:bg-indigo-50/30">
                    <td className="border border-slate-200 bg-slate-50 text-center text-[9px] text-slate-400">{i + 1}</td>
                    {cells.map((val, col) => {
                      if (col === 5) {
                        return (
                          <td key={col} className="border border-slate-200 px-2 py-1.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap ${STATUS_CELL[row.statusKind]}`}>
                              {val}
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td
                          key={col}
                          className={`border border-slate-200 px-2.5 py-1.5 ${CENTER.has(col) ? "text-center tabular-nums" : "text-left"} ${
                            col === 1 ? "font-medium text-slate-800" : "text-slate-600"
                          } ${col === 9 ? "text-[10.5px] text-slate-400" : ""}`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11.5px] text-slate-400 px-1">
        This is the live collection tracker — each row updates as the Collection Agent chases, escalates, and receives
        each department&rsquo;s sheet ({inCount}/{repSources.length} in). The <span className="text-emerald-700 font-medium">Download .xlsx</span> gives
        you the exact same tracker as a formatted Excel file, refreshed to the current day.
      </p>
    </div>
  );
}
