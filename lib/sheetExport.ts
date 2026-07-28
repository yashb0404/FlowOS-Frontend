import ExcelJS from "exceljs";
import { DataSource, Report } from "./types";
import { questionsForSource } from "./brsrQuestions";
import { trackerRows, TRACKER_COLUMNS, TrackerStatus } from "./tracker";

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
  src: DataSource
) {
  ws.columns = [{ width: 12 }, { width: 60 }, { width: 20 }, { width: 18 }, { width: 32 }];

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

  const head = ws.addRow(["Ref", "BRSR Question", "FY26 Response", "FY25 (prev.)", "Evidence Required"]);
  head.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10.5 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    c.alignment = { vertical: "middle" };
    c.border = allBorders;
  });
  head.height = 20;

  const filled = src.status === "submitted";
  const qa = questionsForSource(src);
  const resp = (a: string | number, unit?: string) => `${typeof a === "number" ? a.toLocaleString() : a}${unit ? " " + unit : ""}`;
  let band = 0;

  const scalarRow = (code: string, text: string, response: string, prev: string, evidence: string) => {
    const r = ws.addRow([code, text, response, prev, evidence]);
    r.eachCell((c, col) => {
      c.border = allBorders;
      c.alignment = { vertical: "top", wrapText: col === 2, horizontal: col === 3 || col === 4 ? "right" : "left" };
      c.font = { size: col === 1 ? 9.5 : 10.5, color: { argb: col === 1 || col === 5 ? GREY : col === 4 ? GREY : INK }, bold: col === 3 };
      if (band % 2 === 1) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_SOFT } };
    });
    band++;
  };

  const items = qa.length ? qa : src.expectedFields.map((f, i) => ({ code: `Q${i + 1}`, text: label(f), answer: filled ? (src.submittedFields?.[f] ?? "—") : "—", unit: undefined, prev: undefined, table: undefined } as (typeof qa)[number]));

  items.forEach((q, i) => {
    const evidence = src.evidence?.[i] ?? src.evidence?.[0] ?? "";
    if (filled && q.table) {
      const lbl = ws.addRow([q.code, q.text, "", "", evidence]);
      lbl.eachCell((c, col) => {
        c.border = allBorders;
        c.alignment = { vertical: "top", wrapText: col === 2, horizontal: "left" };
        c.font = { size: col === 1 ? 9.5 : 10.5, bold: col === 2, color: { argb: col === 1 || col === 5 ? GREY : INK } };
      });
      const th = ws.addRow(["", ...q.table.columns]);
      th.eachCell((c, col) => {
        if (col === 1) return;
        c.border = allBorders;
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2F9" } };
        c.font = { size: 9.5, bold: true, color: { argb: "FF334155" } };
        c.alignment = { horizontal: col === 2 ? "left" : "right" };
      });
      q.table.rows.forEach((tr) => {
        const dr = ws.addRow(["", ...tr.map((v) => (typeof v === "number" ? v : v))]);
        dr.eachCell((c, col) => {
          if (col === 1) return;
          c.border = allBorders;
          c.font = { size: 9.5, color: { argb: INK }, bold: col === 2 };
          c.alignment = { horizontal: col === 2 ? "left" : "right" };
        });
      });
      band++;
    } else {
      scalarRow(q.code, q.text, filled ? resp(q.answer, q.unit) : "—", filled && q.prev !== undefined ? resp(q.prev, q.unit) : "", evidence);
    }
  });
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
    src
  );
  await save(wb, `BRSR - FY26 - AREPL - ${src.department}${filled ? "" : " - TEMPLATE"}.xlsx`);
}

const STATUS_FILL: Record<TrackerStatus, string> = {
  pending: "FFF1F5F9",
  reminded: "FFFEF3C7",
  human_alert: "FFFFE4E6",
  submitted: "FFDCFCE7",
};
const STATUS_TEXT: Record<TrackerStatus, string> = {
  pending: "FF64748B",
  reminded: "FFB45309",
  human_alert: "FFE11D48",
  submitted: "FF059669",
};

/** Download the live collection tracker as a styled .xlsx — identical to the on-screen sheet. */
export async function downloadTracker(report: Report, sources: DataSource[], tick: number) {
  const repSources = sources.filter((s) => s.reportId === report.id);
  const rows = trackerRows(repSources);
  const inCount = repSources.filter((s) => s.status === "submitted").length;

  const wb = new ExcelJS.Workbook();
  wb.creator = "FlowOS";
  const ws = wb.addWorksheet("Collection Tracker");
  ws.columns = [{ width: 5 }, { width: 24 }, { width: 24 }, { width: 8 }, { width: 18 }, { width: 18 }, { width: 20 }, { width: 12 }, { width: 12 }, { width: 34 }];

  const titles = [
    { text: "RNGalla Family Private Limited — AREPL (Galla Foods)", brand: true, strong: true, size: 13 },
    { text: `${report.name} — Data Collection Tracker`, strong: true, size: 12 },
    { text: `As of Day ${tick} · ${inCount}/${repSources.length} data sheets received · live from FlowOS`, italic: true, size: 10.5 },
  ];
  titles.forEach((t, i) => {
    const r = ws.addRow([t.text]);
    ws.mergeCells(r.number, 1, r.number, 10);
    r.getCell(1).font = { bold: t.strong, italic: (t as { italic?: boolean }).italic ?? false, size: t.size, color: { argb: t.brand ? NAVY : i === 0 ? INK : GREY } };
    r.height = i === 0 ? 20 : 16;
  });
  ws.addRow([]);

  const head = ws.addRow([...TRACKER_COLUMNS]);
  head.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    c.alignment = { vertical: "middle", wrapText: true };
    c.border = allBorders;
  });
  head.height = 22;

  rows.forEach((row, i) => {
    const r = ws.addRow([row.no, row.department, row.spoc, row.kpis, row.due, row.status, row.submittedOn, row.followUps, row.flags, row.evidence]);
    r.eachCell((c, col) => {
      c.border = allBorders;
      c.alignment = { vertical: "middle", horizontal: col === 1 || col === 4 ? "center" : "left", wrapText: col === 10 };
      c.font = { size: 10, color: { argb: INK } };
      if (i % 2 === 1) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY_SOFT } };
      if (col === 6) {
        c.font = { size: 10, bold: true, color: { argb: STATUS_TEXT[row.statusKind] } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: STATUS_FILL[row.statusKind] } };
      }
    });
  });

  ws.views = [{ state: "frozen", ySplit: head.number }];
  await save(wb, `${report.name.replace(/[^\w]+/g, "_")}_CollectionTracker.xlsx`);
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
      s
    );
  });

  await save(wb, `${report.name.replace(/[^\w]+/g, "_")}_DataBook.xlsx`);
}
