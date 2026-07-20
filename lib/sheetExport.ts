import * as XLSX from "xlsx";
import { DataSource } from "./types";

const label = (f: string) => f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Download this source's sheet as a real .xlsx — the filled sheet if submitted,
 * otherwise a blank collection template (exactly what gets circulated to SPOCs).
 */
export function downloadSheet(src: DataSource, repName: string) {
  const filled = src.status === "submitted" && src.submittedFields;
  const rows: (string | number)[][] = [
    [`${repName}`],
    [`Data sheet: ${src.name} · SPOC: ${src.owner} (${src.department})`],
    [],
    ["KPI", "FY26 Value", "Evidence Required"],
    ...src.expectedFields.map((f, i) => [
      label(f),
      filled ? (src.submittedFields![f] ?? "") : "",
      src.evidence?.[i] ?? src.evidence?.[0] ?? "",
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 32 }, { wch: 16 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, src.department.slice(0, 28));
  const kind = filled ? "" : " - TEMPLATE";
  XLSX.writeFile(wb, `BRSR - FY26 - AREPL - ${src.department}${kind}.xlsx`);
}
