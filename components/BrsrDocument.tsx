"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { questionsFor } from "@/lib/brsrQuestions";
import { departmentReport } from "@/lib/brsrReport";
import { BrsrQuestion, DataSource } from "@/lib/types";

/** Build the Q&A list for a department — real BRSR questions, or a fallback from its KPI fields. */
function qaFor(src: DataSource): BrsrQuestion[] {
  const real = questionsFor(src.department);
  if (real.length) return real;
  return src.expectedFields.map((f, i) => ({
    code: `Q${i + 1}`,
    section: "C" as const,
    text: `Report the value of "${f.replace(/_/g, " ")}" for the reporting period`,
    answer: src.submittedFields?.[f] ?? "",
  }));
}

/** Phase 2: per-department Q&A notebook — questions with answers, filled in as departments submit. */
export function BrsrDocument({ reportId }: { reportId: string }) {
  const { reports, sources } = useStore();
  const rep = reports.find((r) => r.id === reportId);
  const repSources = sources.filter((s) => s.reportId === reportId);
  const [active, setActive] = useState(0);
  if (!rep) return null;

  const dept = repSources[active] ?? repSources[0];
  if (!dept) return null;
  const qa = qaFor(dept);
  const answered = dept.status === "submitted";

  return (
    <div className="flex flex-col gap-4">
      {/* department selector — like an index of chapters */}
      <div className="flex flex-wrap gap-1.5">
        {repSources.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
              i === active
                ? "bg-[#3d5a99] text-white border-[#3d5a99]"
                : "glass-soft text-slate-500 border-slate-200 hover:text-slate-800"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${s.status === "submitted" ? "bg-emerald-400" : s.status === "human_alert" ? "bg-rose-400" : "bg-slate-300"}`} />
            {s.department}
          </button>
        ))}
      </div>

      {/* department Q&A "notebook page" */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/70 bg-gradient-to-r from-indigo-50/60 via-transparent to-transparent flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">{dept.department}</h3>
            <p className="text-[11.5px] text-slate-400 mt-0.5">
              Data owner: {dept.owner} · {dept.principle ?? "BRSR disclosure"} · {qa.length} questions
            </p>
          </div>
          <span
            className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full border ${
              answered ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {answered ? "✓ Answered from submitted sheet" : `Awaiting ${dept.owner}`}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {qa.map((q, i) => (
            <div key={q.code + i} className="px-6 py-4">
              <div className="flex items-start gap-2.5">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-slate-50 border-slate-200 text-slate-500 shrink-0 mt-0.5">
                  {q.code}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] text-slate-700 leading-snug">
                    <span className="font-semibold text-slate-500">Q.</span> {q.text}
                  </p>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-[11px] font-semibold text-emerald-700">A.</span>
                    {answered ? (
                      <span className="text-[13px] font-bold text-slate-900 tabular-nums">
                        {typeof q.answer === "number" ? q.answer.toLocaleString() : q.answer}
                        {q.unit && <span className="text-[10.5px] font-medium text-slate-400 ml-1">{q.unit}</span>}
                      </span>
                    ) : (
                      <span className="text-[12px] italic text-slate-300">awaiting submission…</span>
                    )}
                  </div>
                </div>
                <span className="text-[9px] text-slate-300 shrink-0">Sec {q.section}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* compiled department report — the written-up section from the answers */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-200/70 bg-gradient-to-r from-emerald-50/60 via-transparent to-transparent flex items-center gap-2">
          <span className="text-[13px]">📄</span>
          <h3 className="text-[13.5px] font-semibold text-slate-900">Compiled Department Report — {dept.department}</h3>
          <span className="ml-auto text-[9.5px] uppercase tracking-wider font-semibold text-slate-400">
            auto-drafted from answers
          </span>
        </div>
        <div className="px-6 py-5">
          {answered ? (
            <div className="max-w-3xl" style={{ fontFamily: "Georgia, serif" }}>
              {departmentReport(dept.department, qa).map((para, i) => (
                <p key={i} className="text-[13px] text-slate-700 leading-relaxed mb-3">
                  {para}
                </p>
              ))}
              {dept.evidence && dept.evidence.length > 0 && (
                <p className="text-[11px] text-slate-400 mt-2">
                  Supporting evidence on file: {dept.evidence.map((e) => `📎 ${e}`).join("  ")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] italic text-slate-400">
              This section will be compiled automatically once {dept.owner} submits the {dept.department} data sheet.
            </p>
          )}
        </div>
      </div>

      <p className="text-[11.5px] text-slate-400 px-1">
        Each department answers a focused set of BRSR questions; answers are pulled straight from its submitted Excel
        sheet and auto-drafted into the compiled section above. Advance the simulation (or upload a sheet) to watch a
        department fill in. These sections then assemble into the full BRSR document.
      </p>
    </div>
  );
}
