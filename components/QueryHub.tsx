"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { DataSource, Report } from "@/lib/types";

const SUGGESTIONS = [
  "Which data sources are overdue?",
  "Show all open flags",
  "What is blocking the BRSR report?",
  "Summarize report status",
];

export function QueryHub() {
  const { reports, sources, tick } = useStore();
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);

  function ask(q: string) {
    if (!q.trim()) return;
    const answer = answerQuery(q, reports, sources, tick);
    setHistory((h) => [...h, { q, a: answer }]);
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Input ── */}
      <div className="glass rounded-2xl p-5 accent-ring">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-100 to-amber-50 border border-rose-200 flex items-center justify-center text-[#d63a5f] shrink-0">
            ✦
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(query)}
            placeholder="Ask about any report, data source, flag, or owner…"
            className="flex-1 bg-transparent text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={() => ask(query)}
            className="btn-primary px-5 py-2 text-[13px] rounded-xl text-white font-semibold shrink-0"
          >
            Ask
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 pl-12">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="text-[11.5px] px-3 py-1.5 rounded-full glass-soft text-slate-500 hover:text-[#d63a5f] hover:border-rose-300 border border-transparent transition-all duration-200"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Conversation ── */}
      <div className="flex flex-col gap-4">
        {history.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center">
            <p className="text-slate-600 text-sm font-medium">This is the Knowledge Agent</p>
            <p className="text-slate-400 text-[12px] mt-1 max-w-md mx-auto">
              Everything the pipeline collects becomes queryable knowledge. Ask a question or tap a suggestion.
            </p>
          </div>
        )}
        {[...history].reverse().map((h, idx) => (
          <div key={idx} className="fade-up flex flex-col gap-2.5">
            <div className="self-end max-w-[80%]">
              <div className="rounded-2xl rounded-br-md px-4 py-2.5 bg-gradient-to-r from-[#d63a5f] to-[#b7245c] text-[13px] text-white shadow-lg shadow-rose-300/40">
                {h.q}
              </div>
            </div>
            <div className="self-start max-w-[85%] flex gap-3">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3d5a99] to-[#d63a5f] flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-1 shadow-md shadow-rose-300/50">
                F
              </span>
              <div className="glass rounded-2xl rounded-tl-md px-4 py-3">
                <p className="text-[13px] text-slate-700 whitespace-pre-line leading-relaxed">{h.a}</p>
                <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-medium">
                  Knowledge Agent · grounded in {reports.length} reports, {sources.length} data sources
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function answerQuery(q: string, reports: Report[], sources: DataSource[], tick: number): string {
  const lower = q.toLowerCase();

  if (lower.includes("overdue")) {
    const overdue = sources.filter((s) => s.status !== "submitted" && tick > s.dueTick);
    if (overdue.length === 0) return "No data sources are currently overdue.";
    return overdue
      .map((s) => {
        const rep = reports.find((r) => r.id === s.reportId);
        return `• ${s.name} (${s.owner}, ${s.department}) — due Day ${s.dueTick}, now Day ${tick}. Feeds "${rep?.name}". Status: ${s.status === "human_alert" ? "human alert raised" : `${Math.min(s.remindersSent, 3)}/3 follow-ups sent`}.`;
      })
      .join("\n");
  }

  if (lower.includes("flag")) {
    const open = sources.flatMap((s) => s.flags.filter((f) => f.status === "open").map((f) => ({ f, s })));
    if (open.length === 0) return "No open flags — everything submitted so far has passed validation and reconciliation (or been resolved by a human).";
    return open.map(({ f, s }) => `• [${f.type}] ${s.name} · ${f.field.replace(/_/g, " ")}: ${f.detail}`).join("\n");
  }

  if (lower.includes("block") || lower.includes("brsr")) {
    const rep = reports.find((r) => r.name.toLowerCase().includes("brsr report")) ?? reports[0];
    const repSources = sources.filter((s) => s.reportId === rep.id);
    if (rep.status === "generated" || rep.status === "generated_partial")
      return `"${rep.name}" was generated on Day ${rep.generatedAtTick}${rep.status === "generated_partial" ? ` with ${rep.gaps?.length} gap(s) marked` : ""}.`;
    const missing = repSources.filter((s) => s.status !== "submitted");
    const open = repSources.flatMap((s) => s.flags).filter((f) => f.status === "open");
    const parts: string[] = [];
    if (missing.length > 0) parts.push(`Missing data: ${missing.map((m) => `${m.name} from ${m.owner} (${m.status === "human_alert" ? "human alert raised" : "being chased"})`).join("; ")}`);
    if (open.length > 0) parts.push(`Unresolved flags: ${open.map((f) => f.field.replace(/_/g, " ")).join(", ")} — waiting in the Review tab`);
    return `"${rep.name}" cannot generate yet.\n${parts.map((p) => `• ${p}`).join("\n")}`;
  }

  if (lower.includes("status") || lower.includes("summar") || lower.includes("report")) {
    return reports
      .map((rep) => {
        const repSources = sources.filter((s) => s.reportId === rep.id);
        const done = repSources.filter((s) => s.status === "submitted").length;
        const openFlags = repSources.flatMap((s) => s.flags).filter((f) => f.status === "open").length;
        const statusTxt =
          rep.status === "generated"
            ? `✓ generated Day ${rep.generatedAtTick}`
            : rep.status === "generated_partial"
              ? `generated with gaps Day ${rep.generatedAtTick}`
              : `${done}/${repSources.length} sources in${openFlags > 0 ? `, ${openFlags} open flag(s)` : ""}`;
        return `• ${rep.name}: ${statusTxt}`;
      })
      .join("\n");
  }

  return `I searched ${reports.length} reports and ${sources.length} data sources but couldn't match that question in this demo. Try asking about "overdue", "flags", "blocked", or "status".`;
}
