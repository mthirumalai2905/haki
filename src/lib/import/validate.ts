import type { ImportStats } from "../types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s().-]{7,20}$/;
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[^\s]*)?$/i;

export function isValidEmail(value?: string | null) {
  return Boolean(value && EMAIL_RE.test(value.trim()));
}

export function isValidPhone(value?: string | null) {
  if (!value) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && PHONE_RE.test(value.trim());
}

export function isValidUrl(value?: string | null) {
  return Boolean(value && URL_RE.test(value.trim()));
}

export function computeImportStats(
  rows: Record<string, string>[],
  mappings: Array<{ source: string; target: string }>,
): ImportStats {
  const emailCol = mappings.find((m) => m.target === "email")?.source;
  const phoneCol = mappings.find((m) => m.target === "phone")?.source;
  const mappedSources = mappings
    .filter((m) => m.target !== "ignore" && m.target !== "custom")
    .map((m) => m.source);

  const emails = new Set<string>();
  let validEmails = 0;
  let validPhones = 0;
  let duplicates = 0;
  let missingFields = 0;

  for (const row of rows) {
    if (emailCol) {
      const email = (row[emailCol] ?? "").trim().toLowerCase();
      if (isValidEmail(email)) {
        validEmails += 1;
        if (emails.has(email)) duplicates += 1;
        emails.add(email);
      }
    }
    if (phoneCol && isValidPhone(row[phoneCol])) validPhones += 1;

    const emptyMapped = mappedSources.filter((source) => !String(row[source] ?? "").trim());
    if (emptyMapped.length > 0) missingFields += 1;
  }

  return {
    rows: rows.length,
    columns: rows[0] ? Object.keys(rows[0]).length : 0,
    validEmails,
    validPhones,
    duplicates,
    missingFields,
  };
}
