import ExcelJS from "exceljs";
import { DataSource, Report } from "./types";
import { questionsForSource } from "./brsrQuestions";

const label = (f: string) => f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const safeName = (s: string) => s.replace(/[[\]:*?/\\]/g, " ").slice(0, 31);

const NAVY = "FF3D5A99";
const NAVY_SOFT = "FFEDF1FA";
const INK = "FF1A202C";
const GREY = "FF64748B";
const BORDER = "FFD9E0EA";

const thin = { style: "thin" as const, color: { argb: BORDER } };
const allBorders = { top: thin, left: thin, bottom: thin, right: thin };

/** Trigger a browser download from an ExcelJS workbook. */
async function save(wb: ExcelJS.Workbook, filename: string) {
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Lay out a titled Q&A sheet (letterhead block + styled table) on an ExcelJS worksheet. */
function layoutQaSheet(
  ws: ExcelJS.Worksheet,
  titleLines: { text: string; strong?: boolean; brand?: boolean; italic?: boolean }[],
  rows: (string | number)[][]
) {
  ws.columns = [{ width: 12 }, { width: 62 }, { width: 18 }, { width: 12 }, { width: 34 }];

  titleLines.forEach((t, i) => {
    const r = ws.addRow([t.text]);
    ws.mergeCells(r.number, 1, r.number, 5);
    r.getCell(1).font = {
      bold: t.strong ?? false,
      italic: t.italic ?? false,
      size: i === 0 ? 13 : t.strong ? 12 : 10.5,
      color: { argb: t.brand ? NAVY : i === 0 ? INK : GREY },
    };
    r.height = i === 0 ? 20 : 16;
  });
  ws.addRow([]);

  const head = ws.addRow(["Ref", "BRSR Question", "FY26 Response", "Unit", "Evidence Required"]);
  head.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10.5 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    c.alignment = { vertical: "middle" };
    c.border = allBorders;
  });
  head.height = 20;

  rows.forEach((row, i) => {
    const r = ws.addRow(row);
    r.eachCell((c, col) => {
      c.border = allBorders;
      c.alignment = { vertical: "top", wrapText: col === 2, horizontal: col === 3 ? "right" : "left" };
      c.font = { size: 10.5, color: { argb: col === 3 ? INK : col === 1 || col === 5 ? GREY : INK }, bold: col === 3 };
      if (col === 1) c.font = { size: 9.5, color: { argb: GREY } };
      if (i % 2 === 1) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_SOFT } };
    });
  });
}

/** Rows (Ref · Question · Response · Unit · Evidence) for one source. */
function questionRows(src: DataSource): (string | number)[][] {
  const filled = src.status === "submitted";
  const qa = questionsForSource(src);
  return qa.length
    ? qa.map((q, i) => [q.code, q.text, filled ? q.answer : "—", q.unit ?? "", src.evidence?.[i] ?? src.evidence?.[0] ?? ""])
    : src.expectedFields.map((f, i) => [`Q${i + 1}`, label(f), filled ? (src.submittedFields?.[f] ?? "—") : "—", "", src.evidence?.[i] ?? src.evidence?.[0] ?? ""]);
}

/** Download a single department's sheet as a styled .xlsx. */
export async function downloadSheet(src: DataSource, repName: string) {
  const filled = src.status === "submitted";
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(safeName(src.department));
  layoutQaSheet(
    ws,
    [
      { text: "RNGalla Family Private Limited — AREPL (Galla Foods)", brand: true, strong: true },
      { text: repName, strong: true },
      { text: `Data sheet: ${src.department}   ·   SPOC: ${src.owner}` },
      { text: `Status: ${filled ? "Submitted" : "Awaiting submission"}   ·   Reporting period: FY26 (Apr'25 – Mar'26)`, italic: true },
    ],
    questionRows(src)
  );
  await save(wb, `BRSR - FY26 - AREPL - ${src.department}${filled ? "" : " - TEMPLATE"}.xlsx`);
}

/** Download the whole report as one styled Excel workbook — Contents + a sheet per department. */
export async function downloadFullWorkbook(report: Report, sources: DataSource[]) {
  const repSources = sources.filter((s) => s.reportId === report.id);
  const wb = new ExcelJS.Workbook();
  wb.creator = "FlowOS";

  // ── Contents sheet ──
  const cws = wb.addWorksheet("Contents");
  cws.columns = [{ width: 6 }, { width: 28 }, { width: 26 }, { width: 30 }, { width: 16 }];
  const titles = [
    { text: "RNGalla Family Private Limited — AREPL (Galla Foods)", brand: true, strong: true },
    { text: report.name, strong: true },
    { text: report.project, italic: true },
    { text: "Reporting period: FY26 (Apr'25 – Mar'26)" },
    ...(report.regulation ? [{ text: `Prepared under: ${report.regulation}` }] : []),
    ...(report.assurance && report.assurance !== "none" ? [{ text: `Assurance: ${report.assurance} assurance` }] : []),
  ];
  titles.forEach((t, i) => {
    const r = cws.addRow([t.text]);
    cws.mergeCells(r.number, 1, r.number, 5);
    r.getCell(1).font = { bold: t.strong ?? false, italic: (t as { italic?: boolean }).italic ?? false, size: i === 0 ? 14 : t.strong ? 12 : 10.5, color: { argb: t.brand ? NAVY : i === 0 ? INK : GREY } };
    r.height = i === 0 ? 22 : 16;
  });
  cws.addRow([]);
  const chead = cws.addRow(["#", "Department", "Data Owner", "Framework", "Status"]);
  chead.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10.5 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    c.border = allBorders;
  });
  chead.height = 20;
  repSources.forEach((s, i) => {
    const done = s.status === "submitted";
    const r = cws.addRow([i + 1, s.department, s.owner, s.principle ?? "", done ? "Submitted" : "Awaiting"]);
    r.eachCell((c, col) => {
      c.border = allBorders;
      c.font = { size: 10.5, color: { argb: col === 5 ? (done ? "FF059669" : "FFD97706") : INK }, bold: col === 5 };
      if (i % 2 === 1) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_SOFT } };
    });
  });

  // ── One sheet per department ──
  repSources.forEach((s, i) => {
    const ws = wb.addWorksheet(safeName(`${i + 1}. ${s.department}`));
    layoutQaSheet(
      ws,
      [
        { text: s.department, brand: true, strong: true },
        { text: `SPOC: ${s.owner}   ·   ${s.principle ?? "Disclosure"}` },
        { text: `Status: ${s.status === "submitted" ? "Submitted" : "Awaiting submission"}`, italic: true },
      ],
      questionRows(s)
    );
  });

  await save(wb, `${report.name.replace(/[^\w]+/g, "_")}_DataBook.xlsx`);
}
