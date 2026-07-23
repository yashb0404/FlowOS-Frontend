"use client";

import { useStore } from "@/lib/store";

export function Communications({ reportId }: { reportId: string }) {
  const { events } = useStore();
  const comms = events.filter((e) => e.comm && e.reportId === reportId);

  const emails = comms.filter((e) => e.comm!.channel === "email");
  const teams = comms.filter((e) => e.comm!.channel === "teams");

  if (comms.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl glass-soft flex items-center justify-center text-xl text-slate-400 mb-4">
          ✉
        </div>
        <p className="text-slate-600 text-sm font-medium">No messages sent yet</p>
        <p className="text-slate-400 text-[12px] mt-1 max-w-sm mx-auto">
          The Collection Agent chases every data source by email — three follow-ups, then a Teams alert to a human.
          Every message appears here exactly as the recipient sees it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Channel stats ── */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="glass rounded-2xl p-4 flex items-center gap-3.5 fade-up">
          <span className="w-10 h-10 rounded-xl border flex items-center justify-center text-lg bg-rose-50 text-rose-600 border-rose-200">
            ✉
          </span>
          <div>
            <div className="text-2xl font-bold tabular-nums text-slate-800">{emails.length}</div>
            <div className="text-[11px] text-slate-500">Email follow-ups</div>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-3.5 fade-up fade-up-1">
          <span className="w-10 h-10 rounded-xl border flex items-center justify-center text-lg bg-violet-50 text-violet-600 border-violet-200">
            ▣
          </span>
          <div>
            <div className="text-2xl font-bold tabular-nums text-slate-800">{teams.length}</div>
            <div className="text-[11px] text-slate-500">Teams human alerts</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* ── Email outbox ── */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <SectionLabel icon="✉" text="Email outbox" tone="text-rose-600" />
          {[...emails].reverse().map((e) => {
            const inbound = e.comm!.direction === "in";
            const sender = inbound ? e.comm!.from ?? "SPOC" : "FlowOS Collection Agent";
            const senderEmail = inbound
              ? `<${sender.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@arepl.co>`
              : "<agent@flowos.ai>";
            return (
              <div key={e.id} className={`glass rounded-2xl overflow-hidden fade-up ${inbound ? "ml-6 border-l-2 border-l-emerald-300" : ""}`}>
                <div className={`px-5 py-3.5 border-b border-slate-200/70 ${inbound ? "bg-gradient-to-r from-emerald-50/80 to-transparent" : "bg-gradient-to-r from-rose-50/90 via-amber-50/50 to-transparent"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${inbound ? "bg-gradient-to-br from-[#7ca982] to-[#3d5a99]" : "bg-gradient-to-br from-[#3d5a99] to-[#d63a5f]"}`}>
                        {inbound ? sender.slice(0, 1) : "F"}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold text-slate-800 truncate">
                          {sender} <span className="font-normal text-slate-400">{senderEmail}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">To: {e.comm!.to}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap shrink-0 ${inbound ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "glass-soft text-slate-500"}`}>
                      {inbound ? "Reply" : "Sent"} · Day {e.timestamp}
                    </span>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <div className="text-[13px] font-semibold text-slate-800 mb-2.5">{e.comm!.subject}</div>
                  <p className="text-[12.5px] text-slate-600 leading-relaxed whitespace-pre-line">{e.comm!.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Teams alerts ── */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:sticky lg:top-24">
          <SectionLabel icon="▣" text="Teams · human alerts" tone="text-violet-600" />
          {teams.length === 0 && (
            <div className="glass-soft rounded-xl px-4 py-3 text-[12px] text-slate-500">
              No human alerts yet — they fire when 3 email follow-ups go unanswered.
            </div>
          )}
          {[...teams].reverse().map((e) => (
            <div key={e.id} className="glass rounded-2xl p-4 border-l-4 border-l-violet-400 fade-up">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="w-7 h-7 rounded-lg bg-violet-100 border border-violet-300 text-violet-700 flex items-center justify-center text-[12px] shrink-0">
                  ▣
                </span>
                <span className="text-[12px] font-semibold text-slate-800">→ {e.comm!.to}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full glass-soft text-slate-500">Day {e.timestamp}</span>
              </div>
              <p className="text-[12.5px] text-slate-600 leading-relaxed">{e.comm!.body}</p>
            </div>
          ))}
          {/* SLA escalation matrix */}
          <div className="glass rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2.5">
              🛡 Escalation SLA matrix
            </p>
            <div className="flex flex-col gap-2">
              {[
                { l: "L1", cls: "bg-slate-100 text-slate-600 border-slate-200", t: "Due date → +2 days", d: "Three automated email follow-ups, escalating tone." },
                { l: "L2", cls: "bg-amber-50 text-amber-700 border-amber-200", t: "+3 days overdue", d: "Teams alert to a human — automation stops chasing." },
                { l: "L3", cls: "bg-rose-50 text-rose-600 border-rose-200", t: "Still unresolved", d: "Reviewer decides: keep waiting or generate with gaps marked." },
              ].map((r) => (
                <div key={r.l} className="flex items-start gap-2.5">
                  <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border ${r.cls}`}>{r.l}</span>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-700 leading-tight">{r.t}</div>
                    <div className="text-[10px] text-slate-400 leading-snug">{r.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ icon, text, tone }: { icon: string; text: string; tone: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className={`text-sm ${tone}`}>{icon}</span>
      <span className="text-[11px] uppercase tracking-widest font-semibold text-slate-500">{text}</span>
      <span className="flex-1 h-px bg-slate-200" />
    </div>
  );
}
