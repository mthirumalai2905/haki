import { getWorkspace } from "@/lib/workspace";
import { breakdown, campaignMetrics } from "@/lib/analytics";
import { jsonError, jsonOk } from "../_utils";

export async function GET(request: Request) {
  try {
    const workspace = await getWorkspace();
    const url = new URL(request.url);
    const campaignId = url.searchParams.get("campaignId") ?? undefined;
    const group = (url.searchParams.get("group") as "channel" | "campaign" | "industry" | "workflow_step") || "channel";
    const [metrics, groups] = await Promise.all([
      campaignMetrics(workspace.id, campaignId),
      breakdown(workspace.id, group),
    ]);
    return jsonOk({ metrics, groups });
  } catch (error) {
    return jsonError(error);
  }
}
