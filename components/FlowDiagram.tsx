"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { AgentEvent, DataSource } from "@/lib/types";

interface NodeDef {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  border: string;
  text: string;
  iconBg: string;
  glow: string;
}

const NODES: NodeDef[] = [
  { key: "collect", title: "Collection Agent", subtitle: "Email #1 → #2 → #3 → human alert", icon: "✉", border: "border-cyan-300", text: "text-cyan-700", iconBg: "bg-cyan-100 text-cyan-700 border-cyan-300", glow: "shadow-cyan-200/60" },
  { key: "extract", title: "Extraction Agent", subtitle: "OCR · parsing · field detection", icon: "▤", border: "border-violet-300", text: "text-violet-700", iconBg: "bg-violet-100 text-violet-700 border-violet-300", glow: "shadow-violet-200/60" },
  { key: "validate", title: "Validation Agent", subtitle: "“N of N fields” completeness", icon: "☑", border: "border-amber-300", text: "text-amber-700", iconBg: "bg-amber-100 text-amber-700 border-amber-300", glow: "shadow-amber-200/60" },
  { key: "reconcile", title: "Reconciliation Agent", subtitle: "Data A = Data B? vs ERP", icon: "≈", border: "border-orange-300", text: "text-orange-700", iconBg: "bg-orange-100 text-orange-700 border-orange-300", glow: "shadow-orange-200/60" },
  { key: "review", title: "Human Review", subtitle: "Approve · override · force-gen", icon: "⚖", border: "border-rose-300", text: "text-rose-700", iconBg: "bg-rose-100 text-rose-700 border-rose-300", glow: "shadow-rose-200/60" },
  { key: "generate", title: "Report Generation", subtitle: "Template fills when gate opens", icon: "▦", border: "border-emerald-300", text: "text-emerald-700", iconBg: "bg-emerald-100 text-emerald-700 border-emerald-300", glow: "shadow-emerald-200/60" },
];

const NODE_W = 190;
const NODE_H = 120;

const INITIAL_POS: Record<string, { x: number; y: number }> = {
  collect: { x: 20, y: 40 },
  extract: { x: 240, y: 150 },
  validate: { x: 460, y: 40 },
  reconcile: { x: 680, y: 150 },
  review: { x: 900, y: 40 },
  generate: { x: 1120, y: 150 },
};

export function FlowDiagram({ reportId }: { reportId: string }) {
  const { sources: allSources, events: allEvents, reports } = useStore();
  const sources = allSources.filter((s) => s.reportId === reportId);
  const events = allEvents.filter((e) => e.reportId === reportId);
  const rep = reports.find((r) => r.id === reportId);
  const [positions, setPositions] = useState(INITIAL_POS);
  const [simStep, setSimStep] = useState<number>(-1); // -1 idle; 0..5 running; 6 done
  const [selected, setSelected] = useState<string | null>(null);
  const dragRef = useRef<{ key: string; dx: number; dy: number; moved: boolean } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const counts: Record<string, number> = {
    collect: sources.length,
    extract: events.filter((e) => e.kind === "extraction_done").length,
    validate: sources.filter((s) => s.status === "submitted").length,
    reconcile: events.filter((e) => e.kind === "reconciliation_done" || e.kind === "reconciliation_flag").length,
    review: events.filter((e) => e.kind === "flag_resolved").length,
    generate: events.filter((e) => e.kind === "report_generated").length,
  };

  const active = events.length > 0;

  function onPointerDown(e: React.PointerEvent, key: string) {
    const pos = positions[key];
    dragRef.current = { key, dx: e.clientX - pos.x, dy: e.clientY - pos.y, moved: false };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const x = Math.max(0, e.clientX - d.dx);
    const y = Math.max(0, Math.min(220, e.clientY - d.dy));
    const cur = positions[d.key];
    if (Math.abs(x - cur.x) > 4 || Math.abs(y - cur.y) > 4) d.moved = true;
    if (d.moved) setPositions((p) => ({ ...p, [d.key]: { x, y } }));
  }
  function onPointerUp() {
    const d = dragRef.current;
    if (d && !d.moved) setSelected((s) => (s === d.key ? null : d.key));
    dragRef.current = null;
  }

  async function runSimulation() {
    if (simStep >= 0 && simStep < 6) return;
    for (let i = 0; i <= 5; i++) {
      setSimStep(i);
      await new Promise((r) => setTimeout(r, 700));
    }
    setSimStep(6);
    setTimeout(() => setSimStep(-1), 2500);
  }

  const running = simStep >= 0 && simStep < 6;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[12px] text-slate-500">
          <span className="font-semibold text-slate-700">Click any agent</span> to open its settings for this report ·
          drag to rearrange the canvas.
        </p>
        <button
          onClick={runSimulation}
          disabled={running}
          className={`px-4 py-2 text-[13px] rounded-xl font-semibold transition-all ${
            running
              ? "glass-soft text-slate-400 border border-slate-200"
              : "btn-primary text-white"
          }`}
        >
          {running ? "⟳ Simulating dry run…" : simStep === 6 ? "✓ Dry run complete" : "▶ Test Run Workflow"}
        </button>
      </div>

      {/* ── Canvas ── */}
      <div
        ref={canvasRef}
        className="glass rounded-2xl relative overflow-x-auto select-none"
        style={{ height: 400 }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(100,116,139,0.18) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative" style={{ width: 1340, height: 380 }}>
          {/* Edges */}
          <svg className="absolute inset-0 pointer-events-none" width={1340} height={380}>
            {NODES.slice(0, -1).map((node, i) => {
              const a = positions[node.key];
              const b = positions[NODES[i + 1].key];
              const x1 = a.x + NODE_W;
              const y1 = a.y + NODE_H / 2;
              const x2 = b.x;
              const y2 = b.y + NODE_H / 2;
              const mx = (x1 + x2) / 2;
              const litEdge = running && simStep > i;
              return (
                <g key={node.key}>
                  <path
                    d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke={litEdge ? "rgba(214,58,95,0.9)" : "rgba(214,58,95,0.35)"}
                    strokeWidth={litEdge ? 3 : 2}
                    className={active || running ? "flow-edge" : ""}
                  />
                  <circle cx={x2 - 4} cy={y2} r={4} fill={litEdge ? "rgba(214,58,95,0.9)" : "rgba(214,58,95,0.5)"} />
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {NODES.map((node, idx) => {
            const pos = positions[node.key];
            const lit = running && simStep === idx;
            const done = (running || simStep === 6) && simStep > idx;
            return (
              <div
                key={node.key}
                onPointerDown={(e) => onPointerDown(e, node.key)}
                className={`absolute rounded-2xl border bg-white/85 backdrop-blur p-4 shadow-xl cursor-grab active:cursor-grabbing transition-shadow ${node.border} ${node.glow} ${
                  lit ? "ring-4 ring-rose-300/60 scale-[1.03]" : selected === node.key ? "ring-4 ring-indigo-300/70" : ""
                }`}
                style={{ left: pos.x, top: pos.y, width: NODE_W, height: NODE_H, transition: dragRef.current?.key === node.key ? "none" : "transform 0.2s" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[13px] ${node.iconBg}`}>
                    {done ? "✓" : node.icon}
                  </span>
                  <span className="text-[8.5px] uppercase tracking-widest text-slate-400 font-semibold">
                    Step {idx + 1}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 text-[12px] leading-tight">{node.title}</div>
                <div className="text-[9.5px] text-slate-500 mt-0.5 leading-snug">{node.subtitle}</div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className={`text-lg font-bold tabular-nums ${node.text}`}>{counts[node.key]}</span>
                  {lit && <span className="text-[9px] font-bold text-[#d63a5f] animate-pulse">RUNNING…</span>}
                  {done && <span className="text-[9px] font-bold text-emerald-600">PASSED</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Agent settings panel ── */}
      {selected && (
        <AgentSettings
          key={selected}
          agentKey={selected}
          node={NODES.find((n) => n.key === selected)!}
          sources={sources}
          events={events}
          repName={rep?.name ?? ""}
          repStatus={rep?.status ?? "collecting"}
          signedBy={rep?.signedBy}
          onClose={() => setSelected(null)}
        />
      )}

      <div className="glass rounded-2xl p-5 flex items-start gap-3">
        <span className="text-lg">⛩</span>
        <p className="text-[12px] text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">The gate:</span> step 6 fires only when every data source
          has cleared steps 1–5 — or a human explicitly opens it with gaps marked. Node library in the full product:
          Schedule · Send Email · Teams Alert · Wait · If/Else · OCR Document · Validate Fields · Reconcile vs ERP ·
          Human Gate · Fill Template · Store in Hub.
        </p>
      </div>
    </div>
  );
}

// ── Per-agent settings (scoped to one report) ─────────────────────────────

const INTAKE_CHANNELS = [
  { key: "excel", label: "📎 Excel / CSV upload", on: true },
  { key: "email", label: "✉ Email attachment", on: true },
  { key: "portal", label: "🌐 Portal upload", on: true },
  { key: "api", label: "⚡ API / connector push", on: false },
];

/** Deterministic mock: which channel a submitted source arrived through. */
function intakeOf(src: DataSource): string {
  const pool = ["Excel upload", "Email attachment", "Portal upload"];
  return pool[src.id.split("-")[1].charCodeAt(0) % pool.length];
}

const SRC_DOT: Record<string, string> = {
  pending: "bg-slate-400",
  reminded: "bg-amber-500",
  human_alert: "bg-rose-500",
  submitted: "bg-emerald-500",
};

function AgentSettings({
  agentKey,
  node,
  sources,
  events,
  repName,
  repStatus,
  signedBy,
  onClose,
}: {
  agentKey: string;
  node: NodeDef;
  sources: DataSource[];
  events: AgentEvent[];
  repName: string;
  repStatus: string;
  signedBy?: string;
  onClose: () => void;
}) {
  const [channels, setChannels] = useState(INTAKE_CHANNELS);
  const [tolerance, setTolerance] = useState("0.5");
  const [cadence, setCadence] = useState("daily");

  const submitted = sources.filter((s) => s.status === "submitted");
  const openFlags = sources.flatMap((s) => s.flags).filter((f) => f.status === "open");
  const resolvedFlags = sources.flatMap((s) => s.flags).filter((f) => f.status !== "open");
  const reminders = events.filter((e) => e.kind === "reminder_sent").length;
  const alerts = events.filter((e) => e.kind === "human_alert").length;

  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Wait out the fade-up entrance animation, then bring the panel into view.
    const t = setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "auto", block: "center" }), 350);
    return () => clearTimeout(t);
  }, [agentKey]);

  return (
    <div ref={panelRef} className="glass rounded-2xl p-5 fade-up">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className={`w-9 h-9 rounded-xl border flex items-center justify-center text-[15px] ${node.iconBg}`}>
            {node.icon}
          </span>
          <div>
            <h3 className="text-[14px] font-semibold text-slate-900">{node.title} — settings</h3>
            <p className="text-[11px] text-slate-400">Scoped to “{repName}”</p>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg glass-soft text-slate-400 hover:text-rose-600 text-[12px]" title="Close">
          ✕
        </button>
      </div>

      {agentKey === "collect" && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="flex flex-col gap-4">
            <div>
              <SettingLabel text="Intake channels — how data may arrive" />
              <div className="flex flex-wrap gap-2 mt-2">
                {channels.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setChannels((cs) => cs.map((x) => (x.key === c.key ? { ...x, on: !x.on } : x)))}
                    className={`text-[11.5px] px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      c.on ? "bg-cyan-50 border-cyan-300 text-cyan-800" : "glass-soft border-slate-200 text-slate-400 line-through"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <SettingLabel text="Follow-up ladder" />
              <div className="mt-2 flex items-center gap-2 text-[11.5px] text-slate-600 flex-wrap">
                <Chip t="Email #1 · due day" /> → <Chip t="Email #2 · +1d" /> → <Chip t="Email #3 · +2d" /> →
                <Chip t="Teams human alert · +3d" tone="rose" />
              </div>
              <div className="mt-2.5 flex items-center gap-2 text-[11.5px] text-slate-500">
                Check cadence:
                <select value={cadence} onChange={(e) => setCadence(e.target.value)} className="glass-soft border border-slate-200 rounded-lg px-2 py-1 text-[11.5px]">
                  <option value="daily">Every day</option>
                  <option value="12h">Every 12 hours</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400">
              Live: {reminders} follow-up(s) sent · {alerts} human alert(s) raised for this report.
            </p>
          </div>
          <div>
            <SettingLabel text={`Required sources (${sources.length}) — where each collects from`} />
            <div className="mt-2 flex flex-col gap-1.5">
              {sources.map((s) => (
                <div key={s.id} className="glass-soft rounded-lg px-3 py-2 text-[11.5px]">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${SRC_DOT[s.status]}`} />
                    <span className="font-medium text-slate-700 truncate">{s.name}</span>
                    <span className="text-slate-400 truncate">{s.owner} · {s.department} · due Day {s.dueTick}</span>
                    <span className="ml-auto text-slate-500 whitespace-nowrap">
                      {s.status === "submitted" ? `via ${intakeOf(s)}` : "awaiting"}
                    </span>
                  </div>
                  {(s.principle || s.evidence) && (
                    <div className="flex flex-wrap items-center gap-1 mt-1.5 pl-4">
                      {s.principle && (
                        <span className="px-1.5 py-0.5 rounded border bg-indigo-50 border-indigo-200 text-[#3d5a99] text-[9.5px] font-medium">{s.principle}</span>
                      )}
                      {s.evidence?.map((ev) => (
                        <span key={ev} className="px-1.5 py-0.5 rounded border bg-slate-50 border-slate-200 text-slate-500 text-[9.5px]">📎 {ev}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {agentKey === "extract" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <SettingLabel text="Parsing modes" />
            <Chip t="Native Excel/CSV" tone="violet" /> <Chip t="OCR (scanned PDF)" tone="violet" /> <Chip t="PDF table detection" tone="violet" />
          </div>
          <div>
            <SettingLabel text="Expected fields per source" />
            <div className="mt-2 grid md:grid-cols-2 gap-1.5">
              {sources.map((s) => (
                <div key={s.id} className="glass-soft rounded-lg px-3 py-2 text-[11.5px]">
                  <span className="font-medium text-slate-700">{s.name}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.expectedFields.map((f) => (
                      <span key={f} className={`px-1.5 py-0.5 rounded border text-[10px] ${s.submittedFields && f in s.submittedFields ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                        {f.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10.5px] text-slate-400">
            Live: {events.filter((e) => e.kind === "extraction_done").length} document(s) parsed for this report. Green = field extracted.
          </p>
        </div>
      )}

      {agentKey === "validate" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <SettingLabel text="Rule" />
            <Chip t="Every expected field must be present (N of N)" tone="amber" />
          </div>
          <div className="grid md:grid-cols-2 gap-1.5">
            {sources.map((s) => {
              const missing = s.status === "submitted" ? s.expectedFields.filter((f) => !(s.submittedFields && f in s.submittedFields)) : [];
              return (
                <div key={s.id} className="glass-soft rounded-lg px-3 py-2 flex items-center gap-2 text-[11.5px]">
                  <span className="font-medium text-slate-700 truncate">{s.name}</span>
                  <span className="ml-auto whitespace-nowrap">
                    {s.status !== "submitted" ? (
                      <span className="text-slate-400">not submitted yet</span>
                    ) : missing.length > 0 ? (
                      <span className="text-amber-700 font-semibold">⚑ missing: {missing.map((m) => m.replace(/_/g, " ")).join(", ")}</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">✓ {s.expectedFields.length}/{s.expectedFields.length} fields</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10.5px] text-slate-400">
            {openFlags.filter((f) => f.type === "validation").length} open validation flag(s) → routed to the Review tab.
          </p>
        </div>
      )}

      {agentKey === "reconcile" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap text-[11.5px] text-slate-600">
            <SettingLabel text="Reference system" />
            <Chip t="ERP snapshot (system of record)" tone="orange" />
            <span className="flex items-center gap-1.5">
              Variance tolerance ±
              <input value={tolerance} onChange={(e) => setTolerance(e.target.value)} className="w-12 glass-soft border border-slate-200 rounded px-1.5 py-0.5 text-[11.5px] tabular-nums" />
              %
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {sources.flatMap((s) =>
              s.flags.filter((f) => f.type === "reconciliation").map((f) => (
                <div key={f.id} className="glass-soft rounded-lg px-3 py-2 text-[11.5px] flex items-center gap-2">
                  <span className="font-medium text-slate-700">{s.name}</span>
                  <span className="text-slate-500">{f.field.replace(/_/g, " ")}: {f.extractedValue} vs ERP {f.referenceValue}</span>
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded border ${f.status === "open" ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                    {f.status === "open" ? "MISMATCH" : "RESOLVED"}
                  </span>
                </div>
              ))
            )}
            {sources.every((s) => s.flags.filter((f) => f.type === "reconciliation").length === 0) && (
              <p className="text-[11.5px] text-slate-400">No mismatches yet — {submitted.length} source(s) reconciled cleanly so far.</p>
            )}
          </div>
        </div>
      )}

      {agentKey === "review" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <SettingLabel text="Assigned reviewer" />
            <Chip t="Yash B — VP, Global Compliance & Ops" tone="rose" />
            <SettingLabel text="Notify via" />
            <Chip t="Teams" tone="rose" /> <Chip t="Email digest" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 max-w-sm">
            <Stat label="Pending decisions" value={openFlags.length} tone={openFlags.length > 0 ? "text-rose-600" : "text-slate-700"} />
            <Stat label="Resolved by human" value={resolvedFlags.length} tone="text-emerald-600" />
          </div>
          <p className="text-[10.5px] text-slate-400">
            Powers: approve flagged value · override with ERP/custom value · force-generate with gaps marked. Every decision is written to the audit ledger.
          </p>
        </div>
      )}

      {agentKey === "generate" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <SettingLabel text="Template" />
            <Chip t="Standard operations template" tone="emerald" />
            <SettingLabel text="Gate" />
            <Chip t={`All ${sources.length} sources submitted + 0 open flags`} tone="emerald" />
          </div>
          <div className="grid grid-cols-2 gap-2.5 max-w-sm">
            <Stat label="Gate status" value={repStatus === "generated" || repStatus === "generated_partial" ? "OPEN" : "CLOSED"} tone={repStatus.startsWith("generated") ? "text-emerald-600" : "text-amber-600"} />
            <Stat label="Sign-off" value={signedBy ? "Signed" : "Required"} tone={signedBy ? "text-emerald-600" : "text-slate-700"} />
          </div>
          <p className="text-[10.5px] text-slate-400">
            On generation: template fills per source section, human corrections annotated, gaps explicitly marked. Digital signature archives to the knowledge hub.
          </p>
        </div>
      )}
    </div>
  );
}

function SettingLabel({ text }: { text: string }) {
  return <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">{text}</span>;
}

function Chip({ t, tone }: { t: string; tone?: string }) {
  const cls =
    tone === "rose" ? "bg-rose-50 border-rose-200 text-rose-700"
    : tone === "violet" ? "bg-violet-50 border-violet-200 text-violet-700"
    : tone === "amber" ? "bg-amber-50 border-amber-200 text-amber-700"
    : tone === "orange" ? "bg-orange-50 border-orange-200 text-orange-700"
    : tone === "emerald" ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : "bg-slate-50 border-slate-200 text-slate-600";
  return <span className={`text-[10.5px] px-2 py-1 rounded-lg border font-medium ${cls}`}>{t}</span>;
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="glass-soft rounded-xl px-3.5 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{label}</div>
      <div className={`text-lg font-bold tabular-nums mt-0.5 ${tone}`}>{value}</div>
    </div>
  );
}
