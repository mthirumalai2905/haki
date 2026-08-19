import { readFile } from "fs/promises";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { inferMappings } from "./map";
import { computeImportStats } from "./validate";
import type { FieldMapping, ImportStats } from "../types";

const PREVIEW_LIMIT = 100;

export type ParsedDataset = {
  headers: string[];
  rows: Record<string, string>[];
  preview: Record<string, string>[];
  mappings: FieldMapping[];
  stats: ImportStats;
};

function toRecords(headers: string[], matrix: unknown[][]): Record<string, string>[] {
  return matrix
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = String(row[index] ?? "").trim();
      });
      return record;
    });
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: "greedy",
  });

  const matrix = (parsed.data ?? []).filter((row) =>
    row.some((cell) => String(cell ?? "").trim() !== ""),
  );
  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = matrix[0].map((header, index) => {
    const value = String(header ?? "").trim();
    return value || `column_${index + 1}`;
  });

  return { headers, rows: toRecords(headers, matrix.slice(1)) };
}

function parseXlsx(buffer: Buffer): { headers: string[]; rows: Record<string, string>[] } {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  if (matrix.length === 0) return { headers: [], rows: [] };

  const headers = matrix[0].map((header, index) => {
    const value = String(header ?? "").trim();
    return value || `column_${index + 1}`;
  });

  return { headers, rows: toRecords(headers, matrix.slice(1)) };
}

export async function parseImportFile(filePath: string, fileType: string): Promise<ParsedDataset> {
  const isExcel = fileType.includes("spreadsheet") || filePath.endsWith(".xlsx") || filePath.endsWith(".xls");

  let headers: string[];
  let rows: Record<string, string>[];

  if (isExcel) {
    const buffer = await readFile(filePath);
    ({ headers, rows } = parseXlsx(buffer));
  } else {
    const text = await readFile(filePath, "utf8");
    ({ headers, rows } = parseCsv(text));
  }

  const mappings = inferMappings(headers);
  const stats = computeImportStats(rows, mappings);

  return {
    headers,
    rows,
    preview: rows.slice(0, PREVIEW_LIMIT),
    mappings,
    stats,
  };
}

export function parseJsonLeads(payload: unknown): ParsedDataset {
  const records = Array.isArray(payload) ? payload : [];
  const headers = Array.from(
    new Set(records.flatMap((row) => (row && typeof row === "object" ? Object.keys(row) : []))),
  );
  const rows = records.map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header) => {
      const value = row && typeof row === "object" ? (row as Record<string, unknown>)[header] : "";
      record[header] = value == null ? "" : String(value);
    });
    return record;
  });
  const mappings = inferMappings(headers);
  return {
    headers,
    rows,
    preview: rows.slice(0, PREVIEW_LIMIT),
    mappings,
    stats: computeImportStats(rows, mappings),
  };
}
