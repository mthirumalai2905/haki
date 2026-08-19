import { db } from "../db";
import type { LeadFilters } from "../types";

export function leadWhere(workspaceId: string, filters: LeadFilters = {}) {
  return {
    workspaceId,
    ...(filters.search
      ? {
          OR: [
            { fullName: { contains: filters.search } },
            { firstName: { contains: filters.search } },
            { lastName: { contains: filters.search } },
            { email: { contains: filters.search } },
            { company: { name: { contains: filters.search } } },
          ],
        }
      : {}),
    ...(filters.industry ? { industry: filters.industry } : {}),
    ...(filters.country ? { country: filters.country } : {}),
    ...(filters.companySize ? { companySize: filters.companySize } : {}),
    ...(filters.jobTitle ? { jobTitle: { contains: filters.jobTitle } } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.hasEmail ? { email: { not: null } } : {}),
    ...(filters.hasPhone ? { phone: { not: null } } : {}),
    ...(filters.hasLinkedin ? { linkedin: { not: null } } : {}),
  };
}

export async function searchLeads(input: {
  workspaceId: string;
  filters?: LeadFilters;
  page?: number;
  pageSize?: number;
  sort?: string;
  direction?: "asc" | "desc";
}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, input.pageSize ?? 50);
  const where = leadWhere(input.workspaceId, input.filters);
  const sort = input.sort ?? "createdAt";
  const direction = input.direction ?? "desc";

  const [items, total] = await Promise.all([
    db.lead.findMany({
      where,
      include: {
        company: true,
        qualifications: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy:
        sort === "company"
          ? { company: { name: direction } }
          : { [sort]: direction },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.lead.count({ where }),
  ]);

  return { items, total, page, pageSize };
}
