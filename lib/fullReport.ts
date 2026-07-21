import { DataSource, Report } from "./types";
import { questionsForSource } from "./brsrQuestions";
import { departmentReport } from "./brsrReport";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fmtVal = (a: string | number, unit?: string) =>
  `${typeof a === "number" ? a.toLocaleString() : esc(String(a))}${unit ? " " + esc(unit) : ""}`;

/** Assemble the full report document as a print-ready HTML string:
 *  cover page → contents/index → per-department (Q&A + compiled narrative). */
export function buildFullReportHtml(report: Report, sources: DataSource[]): string {
  const repSources = sources.filter((s) => s.reportId === report.id);
  const submitted = repSources.filter((s) => s.status === "submitted");

  const contents = repSources
    .map((s, i) => {
      const done = s.status === "submitted";
      return `<tr>
        <td class="c-no">${i + 1}</td>
        <td class="c-dept">${esc(s.department)}<span class="c-owner"> · ${esc(s.owner)}</span></td>
        <td class="c-sec">${esc(s.principle ?? "Disclosure")}</td>
        <td class="c-stat ${done ? "ok" : "pending"}">${done ? "Included" : "Awaiting"}</td>
      </tr>`;
    })
    .join("");

  const sections = repSources
    .map((s, i) => {
      const qa = questionsForSource(s);
      const done = s.status === "submitted";
      const qaRows = qa.length
        ? qa
            .map(
              (q) => `<tr>
              <td class="q-code">${esc(q.code)}</td>
              <td class="q-text">${esc(q.text)}</td>
              <td class="q-ans">${done ? fmtVal(q.answer, q.unit) : "<span class='await'>awaiting</span>"}</td>
            </tr>`
            )
            .join("")
        : `<tr><td colspan="3" class="await">No questionnaire defined for this department.</td></tr>`;

      const narrative = done
        ? departmentReport(s.department, qa).map((p) => `<p>${esc(p)}</p>`).join("")
        : `<p class="await">This section will be compiled once ${esc(s.owner)} submits the ${esc(s.department)} data sheet.</p>`;

      const evidence = s.evidence?.length
        ? `<p class="evi">Supporting evidence on file: ${s.evidence.map((e) => "📎 " + esc(e)).join("&nbsp;&nbsp;")}</p>`
        : "";

      return `<section class="dept">
        <h2>${i + 1}. ${esc(s.department)}</h2>
        <p class="dept-meta">Data owner: ${esc(s.owner)} · ${esc(s.principle ?? "Disclosure")} · ${qa.length} questions</p>
        <h3>Questionnaire &amp; responses</h3>
        <table class="qa"><thead><tr><th>Ref</th><th>Question</th><th>Response</th></tr></thead><tbody>${qaRows}</tbody></table>
        <h3>Compiled disclosure</h3>
        <div class="narr">${narrative}${evidence}</div>
      </section>`;
    })
    .join("");

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
    .toc { page-break-after: always; }
    .toc h2 { border: none; }
    table { width: 100%; border-collapse: collapse; }
    .contents td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    .contents .c-no { width: 28px; color: #94a3b8; }
    .contents .c-dept { font-weight: bold; }
    .contents .c-owner { font-weight: normal; color: #64748b; }
    .contents .c-sec { color: #64748b; }
    .contents .c-stat { text-align: right; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .contents .ok { color: #059669; }
    .contents .pending { color: #d97706; }
    .dept { page-break-inside: avoid; }
    .dept-meta { color: #64748b; font-size: 10.5px; margin: 2px 0 4px; }
    table.qa { margin-bottom: 8px; }
    table.qa th { background: #f1f5f9; text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.6px; color: #475569; padding: 5px 8px; border: 1px solid #d7dde6; }
    table.qa td { border: 1px solid #e2e8f0; padding: 5px 8px; vertical-align: top; }
    .q-code { width: 70px; color: #64748b; font-size: 10px; }
    .q-ans { width: 130px; text-align: right; font-weight: bold; font-variant-numeric: tabular-nums; }
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
      <p class="foot">${submitted.length} of ${repSources.length} departments included · generated by FlowOS from submitted data sheets.</p>
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
