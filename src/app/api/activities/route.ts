import { getWorkspace } from "@/lib/workspace";
import { listActivities } from "@/lib/activity";
import { jsonError, jsonOk } from "../_utils";

export async function GET(request: Request) {
  try {
    const workspace = await getWorkspace();
    const url = new URL(request.url);
    const items = await listActivities({
      workspaceId: workspace.id,
      leadId: url.searchParams.get("leadId") ?? undefined,
      campaignId: url.searchParams.get("campaignId") ?? undefined,
      limit: Number(url.searchParams.get("limit") ?? 40),
    });
    return jsonOk(items);
  } catch (error) {
    return jsonError(error);
  }
}
