import { isValidEmail, isValidPhone, isValidUrl } from "./validate";
import type { FieldMapping } from "../types";

export type NormalizedLead = {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  whatsapp?: string;
  reddit?: string;
  x?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  googleWorkspace?: string;
  website?: string;
  country?: string;
  industry?: string;
  companySize?: string;
  source?: string;
  companyName?: string;
  customFields: Record<string, string>;
  emailValid: boolean;
  phoneValid: boolean;
};

function splitName(fullName?: string) {
  if (!fullName) return {};
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function domainFromWebsite(website?: string) {
  if (!website || !isValidUrl(website)) return undefined;
  try {
    const url = website.startsWith("http") ? new URL(website) : new URL(`https://${website}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function normalizeRow(
  row: Record<string, string>,
  mappings: FieldMapping[],
  source = "import",
): NormalizedLead {
  const values: Record<string, string> = {};
  const customFields: Record<string, string> = {};

  for (const mapping of mappings) {
    const raw = (row[mapping.source] ?? "").trim();
    if (!raw) continue;
    if (mapping.target === "ignore") continue;
    if (mapping.target === "custom") {
      customFields[mapping.source] = raw;
      continue;
    }
    values[mapping.target] = raw;
  }

  const fromFull = splitName(values.full_name);
  const firstName = values.first_name || fromFull.firstName;
  const lastName = values.last_name || fromFull.lastName;
  const fullName =
    values.full_name ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    undefined;

  const email = values.email?.toLowerCase();
  const website = values.website;

  return {
    firstName,
    lastName,
    fullName,
    jobTitle: values.job_title,
    email,
    phone: values.phone,
    linkedin: values.linkedin,
    whatsapp: values.whatsapp,
    reddit: values.reddit,
    x: values.x,
    instagram: values.instagram,
    youtube: values.youtube,
    tiktok: values.tiktok,
    googleWorkspace: values.google_workspace,
    website,
    country: values.country,
    industry: values.industry,
    companySize: values.company_size,
    source: values.source || source,
    companyName: values.company,
    customFields,
    emailValid: isValidEmail(email),
    phoneValid: isValidPhone(values.phone),
  };
}

export function companyDomain(lead: NormalizedLead) {
  return domainFromWebsite(lead.website);
}
