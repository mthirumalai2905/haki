type LeadLike = {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  industry?: string | null;
  website?: string | null;
  company?: { name?: string | null } | null;
  customFields?: string | Record<string, string> | null;
};

function customMap(value?: string | Record<string, string> | null) {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, string>;
    } catch {
      return {};
    }
  }
  return value;
}

export function personalize(
  template: string | null | undefined,
  lead: LeadLike,
  extra: Record<string, string> = {},
) {
  if (!template) return "";
  const custom = customMap(lead.customFields);
  const vars: Record<string, string> = {
    first_name: lead.firstName || lead.fullName?.split(" ")[0] || "there",
    last_name: lead.lastName || "",
    full_name: lead.fullName || [lead.firstName, lead.lastName].filter(Boolean).join(" "),
    company_name: lead.company?.name || "your team",
    company: lead.company?.name || "your team",
    job_title: lead.jobTitle || "your role",
    industry: lead.industry || "your industry",
    website: lead.website || "",
    email: lead.email || "",
    twitter_sapien: extra.twitter_sapien || custom.twitter_sapien || "their latest public post",
    youtube_sapien: extra.youtube_sapien || custom.youtube_sapien || "their latest video",
    ...custom,
    ...extra,
  };

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    return vars[key] ?? "";
  });
}
