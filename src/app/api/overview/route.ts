import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { overviewStats } from "@/lib/analytics";
import { jsonError, jsonOk } from "../_utils";

export async function GET() {
  try {
    const workspace = await getWorkspace();
    const [stats, campaigns] = await Promise.all([
      overviewStats(workspace.id),
      db.campaign.findMany({
        where: { workspaceId: workspace.id, status: { in: ["running", "paused"] } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { campaignLeads: { select: { id: true } } },
      }),
    ]);
    return jsonOk({
      workspace,
      ...stats,
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        goal: campaign.goal,
        leadCount: campaign.campaignLeads.length,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
