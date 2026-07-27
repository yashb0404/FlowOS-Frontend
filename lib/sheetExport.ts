import * as XLSX from "xlsx";
import { DataSource, Report } from "./types";
import { questionsForSource } from "./brsrQuestions";

const label = (f: string) => f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Excel worksheet names: strip illegal chars, cap at 31. */
const safeName = (s: string) => s.replace(/[[\]:*?/\\]/g, " ").slice(0, 31);

/** Rows (Ref · Question · Response · Unit · Evidence) for one source's sheet. */
function questionRows(src: DataSource): (string | number)[][] {
  const filled = src.status === "submitted";
  const qa = questionsForSource(src);
  return qa.length
    ? qa.map((q, i) => [q.code, q.text, filled ? q.answer : "", q.unit ?? "", src.evidence?.[i] ?? src.evidence?.[0] ?? ""])
    : src.expectedFields.map((f, i) => [`Q${i + 1}`, label(f), filled ? (src.submittedFields?.[f] ?? "") : "", "", src.evidence?.[i] ?? src.evidence?.[0] ?? ""]);
}

/**
 * Download this source's sheet as a real .xlsx — the filled sheet if submitted,
 * otherwise a blank collection template. Columns mirror the BRSR questionnaire
 * (Ref · Question · Response · Unit · Evidence) so the file matches the Q&A and report.
 */
export function downloadSheet(src: DataSource, repName: string) {
  const filled = src.status === "submitted";
  const qa = questionsForSource(src);

  const header: (string | number)[][] = [
    ["RNGalla Family Private Limited — AREPL (Galla Foods)"],
    [repName],
    [`Data sheet: ${src.department}   ·   SPOC: ${src.owner}`],
    [`Status: ${filled ? "Submitted" : "Awaiting submission"}   ·   Reporting period: FY26 (Apr'25 – Mar'26)`],
    [],
    ["Ref", "BRSR Question", "FY26 Response", "Unit", "Evidence Required"],
  ];

  const body: (string | number)[][] = qa.length
    ? qa.map((q, i) => [q.code, q.text, filled ? q.answer : "", q.unit ?? "", src.evidence?.[i] ?? src.evidence?.[0] ?? ""])
    : src.expectedFields.map((f, i) => [
        `Q${i + 1}`,
        label(f),
        filled ? (src.submittedFields?.[f] ?? "") : "",
        "",
        src.evidence?.[i] ?? src.evidence?.[0] ?? "",
      ]);

  const ws = XLSX.utils.aoa_to_sheet([...header, ...body]);
  ws["!cols"] = [{ wch: 11 }, { wch: 56 }, { wch: 16 }, { wch: 12 }, { wch: 32 }];
  // Merge the four title rows across all columns for a clean letterhead.
  ws["!merges"] = [0, 1, 2, 3].map((r) => ({ s: { r, c: 0 }, e: { r, c: 4 } }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, safeName(src.department));
  const kind = filled ? "" : " - TEMPLATE";
  XLSX.writeFile(wb, `BRSR - FY26 - AREPL - ${src.department}${kind}.xlsx`);
}

/**
 * Download the whole report as one Excel workbook — a Contents sheet plus one
 * worksheet per department (its Q&A + answers), mirroring the client's data book.
 */
export function downloadFullWorkbook(report: Report, sources: DataSource[]) {
  const repSources = sources.filter((s) => s.reportId === report.id);
  const wb = XLSX.utils.book_new();

  const contents: (string | number)[][] = [
    ["RNGalla Family Private Limited — AREPL (Galla Foods)"],
    [report.name],
    [report.project],
    [`Reporting period: FY26 (Apr'25 – Mar'26)`],
    report.regulation ? [`Prepared under: ${report.regulation}`] : [""],
    report.assurance && report.assurance !== "none" ? [`Assurance: ${report.assurance} assurance`] : [""],
    [],
    ["#", "Department", "Data Owner", "Framework", "Status"],
    ...repSources.map((s, i) => [i + 1, s.department, s.owner, s.principle ?? "", s.status === "submitted" ? "Submitted" : "Awaiting"]),
  ];
  const cws = XLSX.utils.aoa_to_sheet(contents);
  cws["!cols"] = [{ wch: 5 }, { wch: 26 }, { wch: 24 }, { wch: 28 }, { wch: 14 }];
  cws["!merges"] = [0, 1, 2, 3, 4, 5].map((r) => ({ s: { r, c: 0 }, e: { r, c: 4 } }));
  XLSX.utils.book_append_sheet(wb, cws, "Contents");

  repSources.forEach((s, i) => {
    const filled = s.status === "submitted";
    const rows: (string | number)[][] = [
      [s.department],
      [`SPOC: ${s.owner}   ·   ${s.principle ?? "Disclosure"}`],
      [`Status: ${filled ? "Submitted" : "Awaiting submission"}`],
      [],
      ["Ref", "BRSR Question", "FY26 Response", "Unit", "Evidence Required"],
      ...questionRows(s),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 11 }, { wch: 56 }, { wch: 16 }, { wch: 12 }, { wch: 32 }];
    ws["!merges"] = [0, 1, 2].map((r) => ({ s: { r, c: 0 }, e: { r, c: 4 } }));
    XLSX.utils.book_append_sheet(wb, ws, safeName(`${i + 1}. ${s.department}`));
  });

  XLSX.writeFile(wb, `${report.name.replace(/[^\w]+/g, "_")}_DataBook.xlsx`);
}
