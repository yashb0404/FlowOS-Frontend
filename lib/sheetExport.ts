import * as XLSX from "xlsx";
import { DataSource } from "./types";
import { questionsForSource } from "./brsrQuestions";

const label = (f: string) => f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
  XLSX.utils.book_append_sheet(wb, ws, src.department.slice(0, 28));
  const kind = filled ? "" : " - TEMPLATE";
  XLSX.writeFile(wb, `BRSR - FY26 - AREPL - ${src.department}${kind}.xlsx`);
}
