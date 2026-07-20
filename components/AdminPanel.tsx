"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

type Panel = "integrations" | "rbac" | "secrets" | "audit";

const PANELS: { key: Panel; icon: string; label: string; desc: string }[] = [
  { key: "integrations", icon: "⚙", label: "Integrations Matrix", desc: "ERP, email & Teams connectors" },
  { key: "rbac", icon: "👥", label: "Role-Based Access Controls", desc: "Personnel roles & scopes" },
  { key: "secrets", icon: "🗝", label: "Developer API Secrets", desc: "Tokens & webhook endpoints" },
  { key: "audit", icon: "▤", label: "Security Audit Log", desc: "Tamper-evident action ledger" },
];

const PERSONNEL = [
  { email: "yash.b@arepl.co", role: "VP, Global Compliance & Ops / Reviewer", scope: "Global (all reports)" },
  { email: "mansi.s@arepl.co", role: "Group Sustainability Lead", scope: "BRSR · Sustainability Report" },
  { email: "hima.bindu@arepl.co", role: "HR SPOC", scope: "P3 KPIs · payroll evidence" },
  { email: "palla.satish@arepl.co", role: "HSE SPOC", scope: "Safety KPIs · incident register" },
  { email: "avinash.p@arepl.co", role: "Finance SPOC", scope: "Turnover · CSR spend ledger" },
];

const INITIAL_INTEGRATIONS = [
  { key: "erp", name: "SAP ERP Snapshot Connector", detail: "Source-of-truth for reconciliation (read-only)", on: true },
  { key: "email", name: "Email (SMTP relay)", detail: "Collection Agent follow-up ladder, 3 attempts", on: true },
  { key: "teams", name: "Microsoft Teams Webhook", detail: "Human alerts after follow-ups are exhausted", on: true },
  { key: "sharepoint", name: "SharePoint Document Intake", detail: "Watches upload folders per department", on: true },
  { key: "whatsapp", name: "WhatsApp Business API", detail: "Optional reminder channel — disabled per policy", on: false },
];

export function AdminPanel() {
  const [panel, setPanel] = useState<Panel>("integrations");

  return (
    <div className="grid lg:grid-cols-4 gap-5 items-start">
      {/* ── Sub-nav ── */}
      <div className="glass rounded-2xl p-3 flex flex-col gap-1.5">
        {PANELS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPanel(p.key)}
            className={`text-left rounded-xl px-3.5 py-3 transition-all border ${
              panel === p.key
                ? "bg-gradient-to-r from-rose-100/80 to-amber-50/60 border-rose-200 accent-ring"
                : "border-transparent hover:bg-white/70"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[14px]">{p.icon}</span>
              <div>
                <div className="text-[12.5px] font-semibold text-slate-800 leading-tight">{p.label}</div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{p.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Panel body ── */}
      <div className="lg:col-span-3">
        {panel === "integrations" && <Integrations />}
        {panel === "rbac" && <Rbac />}
        {panel === "secrets" && <Secrets />}
        {panel === "audit" && <AuditLog />}
      </div>
    </div>
  );
}

function Integrations() {
  const [items, setItems] = useState(INITIAL_INTEGRATIONS);
  return (
    <div className="glass rounded-2xl p-6 fade-up">
      <PanelHeader
        title="Integrations Matrix"
        desc="Connectors the agents use. Toggling a channel immediately changes what the Collection Agent is allowed to send."
      />
      <div className="flex flex-col gap-3 mt-5">
        {items.map((it) => (
          <div key={it.key} className="glass-soft rounded-xl px-4 py-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="text-[13px] font-semibold text-slate-800">{it.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{it.detail}</div>
            </div>
            <button
              onClick={() => setItems((arr) => arr.map((x) => (x.key === it.key ? { ...x, on: !x.on } : x)))}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                it.on ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  it.on ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      <p className="text-[10.5px] text-slate-400 mt-4">
        Demo note: toggles are local to this session. In production these gate the workflow engine&rsquo;s channel nodes.
      </p>
    </div>
  );
}

function Rbac() {
  return (
    <div className="glass rounded-2xl p-6 fade-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PanelHeader
          title="Authorized Personnel (RBAC)"
          desc="Who can see, submit, review and sign — scoped per department and report."
        />
        <button className="btn-primary px-4 py-2 text-[12.5px] rounded-xl text-white font-semibold shrink-0">
          + Invite User
        </button>
      </div>
      <div className="overflow-x-auto mt-5 rounded-xl border border-slate-200/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-[10px] uppercase tracking-wider bg-white/50">
              <th className="text-left px-4 py-2.5 font-medium">User</th>
              <th className="text-left px-4 py-2.5 font-medium">Security role</th>
              <th className="text-left px-4 py-2.5 font-medium">Authorized scope</th>
              <th className="text-right px-4 py-2.5 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {PERSONNEL.map((p) => (
              <tr key={p.email} className="row-hover border-t border-slate-200/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3d5a99] to-[#7ca982] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                      {p.email.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-[12.5px] text-slate-700 font-mono">{p.email}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[12.5px] text-slate-600">{p.role}</td>
                <td className="px-4 py-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-md glass-soft text-slate-500 font-mono">{p.scope}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-slate-300 hover:text-rose-500 transition-colors text-sm" title="Remove">
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Secrets() {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="glass rounded-2xl p-6 fade-up">
      <PanelHeader
        title="Developer API Keys & Credentials"
        desc="Authorization tokens for webhook connections and REST pipelines."
      />
      <div className="flex flex-col gap-3 mt-5">
        <div className="glass-soft rounded-xl px-4 py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-[12.5px] text-slate-600 font-medium">SAP ERP Live Connector Key</div>
          <div className="flex items-center gap-2">
            <code className="text-[11.5px] px-3 py-1.5 rounded-lg bg-white/70 border border-slate-200 text-slate-700 font-mono">
              {revealed ? "sk_live_sap_4200_e8b04b7ca982" : "sk_live_sap_4200_••••••••••••"}
            </code>
            <button
              onClick={() => setRevealed((v) => !v)}
              className="text-[11px] px-2.5 py-1.5 rounded-lg glass-soft border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              {revealed ? "Hide" : "Reveal"}
            </button>
          </div>
        </div>
        <div className="glass-soft rounded-xl px-4 py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-[12.5px] text-slate-600 font-medium">Document Webhook Ingress Endpoint</div>
          <code className="text-[11.5px] px-3 py-1.5 rounded-lg bg-white/70 border border-slate-200 text-[#3d5a99] font-mono">
            https://api.flowos.co/v1/ingest
          </code>
        </div>
        <div className="glass-soft rounded-xl px-4 py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-[12.5px] text-slate-600 font-medium">Teams Alert Webhook</div>
          <code className="text-[11.5px] px-3 py-1.5 rounded-lg bg-white/70 border border-slate-200 text-[#3d5a99] font-mono">
            https://outlook.office.com/webhook/•••
          </code>
        </div>
      </div>
      <p className="text-[10.5px] text-slate-400 mt-4">
        Keys shown are demo placeholders. Production keys live in a vault and rotate automatically.
      </p>
    </div>
  );
}

function AuditLog() {
  const { events, tick } = useStore();

  const entries = [...events]
    .reverse()
    .filter((e) =>
      ["flag_resolved", "human_alert", "report_signed", "report_generated", "submitted"].includes(e.kind)
    )
    .map((e) => {
      const sev =
        e.kind === "flag_resolved" || e.kind === "report_signed"
          ? { label: "HIGH", cls: "bg-rose-50 text-rose-600 border-rose-200" }
          : e.kind === "human_alert" || e.kind === "report_generated"
            ? { label: "MEDIUM", cls: "bg-amber-50 text-amber-700 border-amber-200" }
            : { label: "LOW", cls: "bg-slate-100 text-slate-500 border-slate-200" };
      const who = e.actor === "Human Reviewer" ? "sarah.jenkins@globalmfg.co" : e.actor;
      return { id: e.id, sev, who, msg: e.message, day: e.timestamp };
    });

  return (
    <div className="glass rounded-2xl p-6 fade-up">
      <div className="flex items-start justify-between gap-4">
        <PanelHeader
          title="Enterprise Security Log Ledger"
          desc="Chronological, tamper-evident record of every override, alert, signature and release — generated live from this session's pipeline."
        />
        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-slate-900 text-emerald-300 font-mono">
          AUDIT NODE ACTIVE
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="glass-soft rounded-xl px-4 py-6 mt-5 text-center text-[12px] text-slate-500">
          No auditable actions yet — advance the simulation and resolve a flag to see entries appear here.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mt-5">
          {entries.map((en) => (
            <div key={en.id} className="glass-soft rounded-xl px-4 py-3 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-md border mt-0.5 ${en.sev.cls}`}>
                  {en.sev.label}
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-slate-700 font-mono truncate">{en.who}</div>
                  <div className="text-[12px] text-slate-500 mt-0.5 leading-snug">{en.msg}</div>
                </div>
              </div>
              <div className="shrink-0 text-right text-[10px] text-slate-400 font-mono">
                Day {en.day}
                <br />
                IP: 192.168.12.98
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10.5px] text-slate-400 mt-4">
        Current simulation day: {tick}. In production every entry is SHA-256 hash-chained for tamper evidence.
      </p>
    </div>
  );
}

function PanelHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
      <p className="text-[12px] text-slate-400 mt-1 max-w-xl">{desc}</p>
    </div>
  );
}
