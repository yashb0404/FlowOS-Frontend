import { BrsrQuestion, DataSource, Report } from "./types";
import { questionsForSource } from "./brsrQuestions";
import { departmentReport } from "./brsrReport";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmtVal = (a: string | number, unit?: string) =>
  `${typeof a === "number" ? a.toLocaleString() : esc(String(a))}${unit ? " " + esc(unit) : ""}`;

const PRINCIPLE_TITLES: Record<number, string> = {
  1: "Businesses should conduct and govern themselves with integrity, and in a manner that is ethical, transparent and accountable",
  2: "Businesses should provide goods and services in a manner that is sustainable and safe",
  3: "Businesses should respect and promote the well-being of all employees, including those in their value chains",
  4: "Businesses should respect the interests of and be responsive to all their stakeholders",
  5: "Businesses should respect and promote human rights",
  6: "Businesses should respect and make efforts to protect and restore the environment",
  7: "Businesses, when engaging in influencing public and regulatory policy, should do so responsibly and transparently",
  8: "Businesses should promote inclusive growth and equitable development",
  9: "Businesses should engage with and provide value to their consumers in a responsible manner",
};

interface Row {
  q: BrsrQuestion;
  owner: string;
  submitted: boolean;
}

/** Nested table for a tabular indicator. */
function miniTable(t: { columns: string[]; rows: (string | number)[][] }): string {
  return `<table class="mini"><thead><tr>${t.columns
    .map((c) => `<th>${esc(c)}</th>`)
    .join("")}</tr></thead><tbody>${t.rows
    .map((row) => `<tr>${row.map((cell, ci) => `<td class="${ci === 0 ? "" : "num"}">${typeof cell === "number" ? cell.toLocaleString() : esc(String(cell))}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

/** FY26 response cell with an inline FY25 comparison for scalar indicators. */
function responseScalar(q: BrsrQuestion): string {
  let out = `<span class="cur">${fmtVal(q.answer, q.unit)}</span>`;
  if (q.prev !== undefined) {
    const c = Number(q.answer);
    const p = Number(q.prev);
    let delta = "";
    if (!Number.isNaN(c) && !Number.isNaN(p) && p !== 0) {
      const pct = ((c - p) / p) * 100;
      delta = ` ${pct > 0.05 ? "▲" : pct < -0.05 ? "▼" : "▬"} ${Math.abs(pct).toFixed(1)}%`;
    }
    out += `<span class="prev">FY25: ${fmtVal(q.prev, q.unit)}${delta}</span>`;
  }
  return out;
}

const qaTable = (rows: Row[], ownerCol: boolean) => {
  const cols = ownerCol ? 4 : 3;
  const body = rows
    .map((r) => {
      if (r.submitted && r.q.table) {
        return `<tr>
          <td class="q-code">${esc(r.q.code)}</td>
          <td class="q-text" colspan="${cols - 1}">${esc(r.q.text)}${miniTable(r.q.table)}</td>
        </tr>`;
      }
      return `<tr>
        <td class="q-code">${esc(r.q.code)}</td>
        <td class="q-text">${esc(r.q.text)}</td>
        <td class="q-ans">${r.submitted ? responseScalar(r.q) : "<span class='await'>awaiting</span>"}</td>
        ${ownerCol ? `<td class="q-owner">${esc(r.owner)}</td>` : ""}
      </tr>`;
    })
    .join("");
  return `<table class="qa"><thead><tr><th>Ref</th><th>Disclosure</th><th>Response</th>${ownerCol ? "<th>Data owner</th>" : ""}</tr></thead><tbody>${body}</tbody></table>`;
};

/** BRSR-format body: Section A (general) → Section B (management & process) → Section C (Principle 1–9). */
function brsrFormatBody(repSources: DataSource[]): { contents: string; sections: string } {
  const sectionA: Row[] = [];
  const byPrinciple: Record<number, Row[]> = {};
  const deptByPrinciple: Record<number, DataSource[]> = {};

  for (const src of repSources) {
    const submitted = src.status === "submitted";
    for (const q of questionsForSource(src)) {
      const row: Row = { q, owner: src.owner, submitted };
      if (q.section === "A") {
        if (!sectionA.some((r) => r.q.code === q.code)) sectionA.push(row);
        continue;
      }
      const m = q.code.match(/P(\d)/);
      const p = m ? Number(m[1]) : 0;
      if (p >= 1 && p <= 9) {
        (byPrinciple[p] ??= []).push(row);
        const depts = (deptByPrinciple[p] ??= []);
        if (!depts.some((d) => d.id === src.id)) depts.push(src);
      }
    }
  }

  const shown = new Set<string>();
  const principlesPresent = Object.keys(byPrinciple).map(Number).sort((a, b) => a - b);

  const contents = `
    <tr><td class="c-no">A</td><td class="c-dept">Section A — General Disclosures</td><td class="c-sec">${sectionA.length} disclosures</td></tr>
    <tr><td class="c-no">B</td><td class="c-dept">Section B — Management &amp; Process Disclosures</td><td class="c-sec">Policy &amp; governance</td></tr>
    <tr><td class="c-no">C</td><td class="c-dept">Section C — Principle-wise Performance</td><td class="c-sec">${principlesPresent.length} principles</td></tr>
    ${principlesPresent
      .map((p) => `<tr><td class="c-no c-sub"></td><td class="c-dept c-sub">Principle ${p}</td><td class="c-sec">${byPrinciple[p].length} indicators</td></tr>`)
      .join("")}`;

  const sectionAHtml = `<section class="dept"><h2>Section A — General Disclosures</h2>
    <p class="dept-meta">Details of the listed entity and its operations (Essential Indicators A.1–A.26).</p>
    ${qaTable(sectionA, true)}</section>`;

  const policyRows = [
    ["P1", "Ethics & governance", "Yes", "Yes", "Yes", "Board / Audit Committee"],
    ["P2", "Sustainable & safe goods", "Yes", "Yes", "Yes", "R&D / Quality"],
    ["P3", "Employee well-being", "Yes", "Yes", "Yes", "CHRO"],
    ["P4", "Stakeholder responsiveness", "Yes", "Yes", "Partial", "Corporate Affairs"],
    ["P5", "Human rights", "Yes", "Yes", "Yes", "CHRO / Legal"],
    ["P6", "Environment", "Yes", "Yes", "Yes", "Chief Sustainability Officer"],
    ["P7", "Policy advocacy", "Yes", "Yes", "N/A", "Corporate Affairs"],
    ["P8", "Inclusive growth", "Yes", "Yes", "Yes", "CSR Committee"],
    ["P9", "Consumer value", "Yes", "Yes", "Yes", "Marketing / Quality"],
  ];
  const sectionBHtml = `<section class="dept"><h2>Section B — Management &amp; Process Disclosures</h2>
    <p class="dept-meta">Policy and management processes across the nine NGRBC principles (indicators B.1–B.12).</p>
    <table class="qa"><thead><tr><th>Principle</th><th>Coverage area</th><th>Policy in place</th><th>Board approved</th><th>Extends to value chain</th><th>Oversight</th></tr></thead><tbody>${policyRows
      .map(
        (r) => `<tr>${r.map((c, ci) => `<td class="${ci === 0 ? "q-code" : ""}">${esc(c)}</td>`).join("")}</tr>`
      )
      .join("")}</tbody></table>
    <div class="narr"><p>The entity's policies are translated into operating procedures and reviewed periodically by the
    Board and its committees; independent assessment of their working is carried out and disclosed under B.10–B.12.</p></div></section>`;

  const sectionCHtml = `<section class="dept"><h2>Section C — Principle-wise Performance Disclosure</h2></section>
    ${principlesPresent
      .map((p) => {
        const narrs = (deptByPrinciple[p] ?? [])
          .filter((d) => d.status === "submitted" && !shown.has(d.id))
          .map((d) => {
            shown.add(d.id);
            return departmentReport(d.department, questionsForSource(d))
              .map((para) => `<p>${esc(para)}</p>`)
              .join("");
          })
          .join("");
        return `<section class="principle">
          <h3 class="p-head">Principle ${p}</h3>
          <p class="p-title">${esc(PRINCIPLE_TITLES[p] ?? "")}</p>
          ${qaTable(byPrinciple[p], true)}
          ${narrs ? `<div class="narr">${narrs}</div>` : ""}
        </section>`;
      })
      .join("")}`;

  return { contents, sections: sectionAHtml + sectionBHtml + sectionCHtml };
}

/** Department-grouped body (GRI / CSR / assurance / ESG reports that aren't in BRSR format). */
function departmentGroupedBody(repSources: DataSource[]): { contents: string; sections: string } {
  const contents = repSources
    .map((s, i) => {
      const done = s.status === "submitted";
      return `<tr><td class="c-no">${i + 1}</td><td class="c-dept">${esc(s.department)}<span class="c-owner"> · ${esc(s.owner)}</span></td>
        <td class="c-sec">${esc(s.principle ?? "Disclosure")}</td>
        <td class="c-stat ${done ? "ok" : "pending"}">${done ? "Included" : "Awaiting"}</td></tr>`;
    })
    .join("");

  const sections = repSources
    .map((s, i) => {
      const qa = questionsForSource(s);
      const done = s.status === "submitted";
      const rows: Row[] = qa.map((q) => ({ q, owner: s.owner, submitted: done }));
      const narrative = done
        ? departmentReport(s.department, qa).map((p) => `<p>${esc(p)}</p>`).join("")
        : `<p class="await">This section will be compiled once ${esc(s.owner)} submits the ${esc(s.department)} data sheet.</p>`;
      const evidence = s.evidence?.length
        ? `<p class="evi">Supporting evidence on file: ${s.evidence.map((e) => "📎 " + esc(e)).join("&nbsp;&nbsp;")}</p>`
        : "";
      return `<section class="dept">
        <h2>${i + 1}. ${esc(s.department)}</h2>
        <p class="dept-meta">Data owner: ${esc(s.owner)} · ${esc(s.principle ?? "Disclosure")} · ${qa.length} questions</p>
        <h3>Questionnaire &amp; responses</h3>${rows.length ? qaTable(rows, false) : "<p class='await'>No questionnaire defined.</p>"}
        <h3>Compiled disclosure</h3><div class="narr">${narrative}${evidence}</div>
      </section>`;
    })
    .join("");

  return { contents, sections };
}

/** Assemble the full report document as a print-ready HTML string. */
export function buildFullReportHtml(report: Report, sources: DataSource[]): string {
  const repSources = sources.filter((s) => s.reportId === report.id);
  const submitted = repSources.filter((s) => s.status === "submitted");

  // BRSR format when the report's questions use NGRBC principle codes (P1–P9).
  const isBrsr = repSources.some((s) => questionsForSource(s).some((q) => /^P\d/.test(q.code)));
  const { contents, sections } = isBrsr ? brsrFormatBody(repSources) : departmentGroupedBody(repSources);

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(report.name)}</title>
  <style>
    @page { margin: 20mm 16mm; }
    * { box-sizing: border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a202c; font-size: 12px; line-height: 1.55; }
    .cover { height: 90vh; display: flex; flex-direction: column; justify-content: center; text-align: center; page-break-after: always; }
    .cover .kicker { text-transform: uppercase; letter-spacing: 3px; font-size: 11px; color: #64748b; }
    .cover h1 { font-size: 30px; margin: 14px 0 8px; line-height: 1.2; }
    .cover .sub { font-size: 13px; color: #475569; }
    .cover .reg { margin-top: 22px; font-size: 11px; color: #64748b; }
    .cover .badge { margin-top: 26px; font-size: 11px; color: #3d5a99; border: 1px solid #c3cbe8; background: #f4f6fc; display: inline-block; padding: 6px 14px; border-radius: 6px; }
    h2 { font-size: 15px; color: #1a202c; border-bottom: 2px solid #1a202c; padding-bottom: 4px; margin: 26px 0 4px; page-break-after: avoid; }
    h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #3d5a99; margin: 16px 0 6px; page-break-after: avoid; }
    .p-head { font-size: 13px; color: #1a202c; letter-spacing: 0; text-transform: none; margin: 20px 0 2px; }
    .p-title { font-size: 11px; font-style: italic; color: #64748b; margin: 0 0 8px; }
    .principle { page-break-inside: avoid; }
    .toc { page-break-after: always; }
    .toc h2 { border: none; }
    table { width: 100%; border-collapse: collapse; }
    .contents td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    .contents .c-no { width: 30px; color: #94a3b8; font-weight: bold; }
    .contents .c-sub { color: #94a3b8; font-weight: normal; padding-left: 22px; font-size: 11px; }
    .contents .c-dept { font-weight: bold; }
    .contents .c-dept.c-sub { font-weight: normal; }
    .contents .c-owner { font-weight: normal; color: #64748b; }
    .contents .c-sec { color: #64748b; }
    .contents .c-stat { text-align: right; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .contents .ok { color: #059669; } .contents .pending { color: #d97706; }
    .dept { page-break-inside: avoid; }
    .dept-meta { color: #64748b; font-size: 10.5px; margin: 2px 0 4px; }
    table.qa { margin-bottom: 8px; }
    table.qa th { background: #f1f5f9; text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.6px; color: #475569; padding: 5px 8px; border: 1px solid #d7dde6; }
    table.qa td { border: 1px solid #e2e8f0; padding: 5px 8px; vertical-align: top; }
    .q-code { width: 66px; color: #64748b; font-size: 10px; }
    .q-ans { width: 150px; text-align: right; font-variant-numeric: tabular-nums; }
    .q-ans .cur { font-weight: bold; display: block; }
    .q-ans .prev { display: block; font-size: 9px; font-weight: normal; color: #94a3b8; margin-top: 1px; }
    table.mini { width: auto; margin: 6px 0 2px; border-collapse: collapse; }
    table.mini th { background: #eef2f9; border: 1px solid #cbd5e1; padding: 3px 8px; font-size: 9px; text-transform: none; letter-spacing: 0; color: #334155; text-align: left; }
    table.mini td { border: 1px solid #d7dde6; padding: 3px 8px; font-size: 9.5px; }
    table.mini td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .q-owner { width: 96px; color: #64748b; font-size: 10px; }
    .narr p { margin: 0 0 8px; }
    .await { color: #b45309; font-style: italic; }
    .evi { color: #94a3b8; font-size: 10px; }
    .foot { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 10px; color: #94a3b8; }
  </style></head><body>
    <div class="cover">
      <div class="kicker">RNGalla Family Private Limited · AREPL (Galla Foods)</div>
      <h1>${esc(report.name)}</h1>
      <div class="sub">${esc(report.project)}</div>
      <div class="reg">Reporting period: FY26 (Apr &rsquo;25 – Mar &rsquo;26)${report.regulation ? "<br/>Prepared under " + esc(report.regulation) : ""}</div>
      ${report.assurance && report.assurance !== "none" ? `<div class="badge">${esc(report.assurance)} assurance</div>` : ""}
    </div>

    <div class="toc">
      <h2>Contents</h2>
      <table class="contents"><tbody>${contents}</tbody></table>
      <p class="foot">${submitted.length} of ${repSources.length} data sheets included · generated by FlowOS from submitted data.</p>
    </div>

    ${sections}

    <div class="foot">Auto-assembled by FlowOS · answers sourced from department Excel submissions · human corrections annotated during review.</div>
  </body></html>`;
}

/** Render an HTML string to the browser's print / Save-as-PDF dialog via a hidden iframe. */
export function printHtml(html: string) {
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);
  const doc = frame.contentWindow!.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    frame.contentWindow!.focus();
    frame.contentWindow!.print();
    setTimeout(() => frame.remove(), 2000);
  }, 300);
}
