import * as XLSX from "xlsx";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Parse an uploaded Excel/CSV data sheet and map its rows onto the KPI fields
 * this source expects. Rows are read as label→value pairs from the first sheet,
 * matched fuzzily (case/punctuation/underscore-insensitive, substring both ways),
 * so the real "BRSR - FY26 - AREPL - HR.xlsx" style sheets work as-is.
 */
export async function parseSheet(
  file: File,
  expectedFields: string[]
): Promise<{ fields: Record<string, number | string>; rowsScanned: number }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, { header: 1, defval: null });

  const fields: Record<string, number | string> = {};
  let rowsScanned = 0;

  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const labelIdx = row.findIndex((c) => typeof c === "string" && c.trim() !== "");
    if (labelIdx === -1) continue;
    const label = String(row[labelIdx]);
    const value = row.slice(labelIdx + 1).find((c) => c !== null && c !== "");
    if (value === undefined) continue;
    rowsScanned++;

    const nl = norm(label);
    const match = expectedFields.find((f) => {
      const nf = norm(f);
      return nl === nf || nl.includes(nf) || nf.includes(nl);
    });
    if (match && !(match in fields)) {
      const num = typeof value === "number" ? value : Number(String(value).replace(/[,%\s]/g, ""));
      fields[match] = Number.isNaN(num) ? String(value) : num;
    }
  }

  return { fields, rowsScanned };
}
