import type { FieldMapping, LeadField } from "../types";

const ALIASES: Record<string, LeadField> = {
  company: "company",
  company_name: "company",
  companyname: "company",
  business: "company",
  organization: "company",
  org: "company",
  account: "company",
  first_name: "first_name",
  firstname: "first_name",
  first: "first_name",
  given_name: "first_name",
  last_name: "last_name",
  lastname: "last_name",
  last: "last_name",
  surname: "last_name",
  family_name: "last_name",
  name: "full_name",
  full_name: "full_name",
  fullname: "full_name",
  contact: "full_name",
  contact_name: "full_name",
  person: "full_name",
  job_title: "job_title",
  jobtitle: "job_title",
  title: "job_title",
  role: "job_title",
  position: "job_title",
  email: "email",
  email_address: "email",
  emailaddress: "email",
  business_email: "email",
  work_email: "email",
  workemail: "email",
  phone: "phone",
  phone_number: "phone",
  phonenumber: "phone",
  mobile: "phone",
  cell: "phone",
  telephone: "phone",
  tel: "phone",
  linkedin: "linkedin",
  linkedin_url: "linkedin",
  linkedinurl: "linkedin",
  linkedin_profile: "linkedin",
  whatsapp: "whatsapp",
  reddit: "reddit",
  twitter: "x",
  twitter_url: "x",
  x: "x",
  x_url: "x",
  instagram: "instagram",
  instagram_url: "instagram",
  youtube: "youtube",
  youtube_url: "youtube",
  tiktok: "tiktok",
  tiktok_url: "tiktok",
  google_workspace: "google_workspace",
  googleworkspace: "google_workspace",
  google_business: "google_workspace",
  gbp: "google_workspace",
  business_name: "company",
  business_website: "website",
  onsite_email: "email",
  business_onsite_email: "email",
  my_phone: "phone",
  website: "website",
  site: "website",
  url: "website",
  domain: "website",
  homepage: "website",
  country: "country",
  location: "country",
  nation: "country",
  industry: "industry",
  sector: "industry",
  vertical: "industry",
  company_size: "company_size",
  companysize: "company_size",
  employees: "company_size",
  headcount: "company_size",
  size: "company_size",
  source: "source",
};

function normalizeHeader(header: string) {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function confidenceFor(header: string, target: LeadField): FieldMapping["confidence"] {
  const key = normalizeHeader(header);
  if (ALIASES[key] === target) return "high";
  if (key.includes(target.replace("_", "")) || target.includes(key)) return "medium";
  return "low";
}

export function inferMappings(headers: string[]): FieldMapping[] {
  const used = new Set<string>();

  return headers.map((source) => {
    const key = normalizeHeader(source);
    const direct = ALIASES[key];
    if (direct && !used.has(direct)) {
      used.add(direct);
      return { source, target: direct, confidence: "high" as const };
    }

    const fuzzy = Object.entries(ALIASES).find(
      ([alias, field]) =>
        !used.has(field) && (key.includes(alias) || alias.includes(key)),
    );

    if (fuzzy) {
      used.add(fuzzy[1]);
      return {
        source,
        target: fuzzy[1],
        confidence: confidenceFor(source, fuzzy[1]),
      };
    }

    return { source, target: "custom" as const, confidence: "low" as const };
  });
}

export const FIELD_LABELS: Record<string, string> = {
  company: "Business name",
  first_name: "First name",
  last_name: "Last name",
  full_name: "Contact",
  job_title: "Job title",
  email: "Onsite email",
  phone: "Phone",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  reddit: "Reddit",
  x: "Twitter / X",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  google_workspace: "Google Workspace",
  website: "Business website",
  country: "Country",
  industry: "Industry",
  company_size: "Company size",
  source: "Source",
  custom: "Custom field",
  ignore: "Ignore",
};
