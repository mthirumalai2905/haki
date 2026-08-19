import { getWorkspace } from "@/lib/workspace";
import { searchLeads } from "@/lib/leads/query";
import { jsonError, jsonOk } from "../_utils";
import { parseJson } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const workspace = await getWorkspace();
    const url = new URL(request.url);
    const result = await searchLeads({
      workspaceId: workspace.id,
      page: Number(url.searchParams.get("page") ?? 1),
      pageSize: Number(url.searchParams.get("pageSize") ?? 50),
      sort: url.searchParams.get("sort") ?? "createdAt",
      direction: (url.searchParams.get("direction") as "asc" | "desc") ?? "desc",
      filters: {
        search: url.searchParams.get("search") ?? undefined,
        industry: url.searchParams.get("industry") ?? undefined,
        country: url.searchParams.get("country") ?? undefined,
        companySize: url.searchParams.get("companySize") ?? undefined,
        jobTitle: url.searchParams.get("jobTitle") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        hasEmail: url.searchParams.get("hasEmail") === "1",
        hasPhone: url.searchParams.get("hasPhone") === "1",
        hasLinkedin: url.searchParams.get("hasLinkedin") === "1",
      },
    });

    return jsonOk({
      ...result,
      items: result.items.map((lead) => ({
        ...lead,
        customFields: parseJson(lead.customFields, {}),
        qualification: lead.qualifications[0] ?? null,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
