import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { pauseCampaign, resumeCampaign } from "@/lib/execution/engine";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../../_utils";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspace = await getWorkspace();
    const { id } = await params;
    const campaign = await db.campaign.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!campaign) throw new AppError("NOT_FOUND", "Campaign not found.", 404);

    const body = await request.json().catch(() => ({ action: "pause" }));
    const updated = body.action === "resume" ? await resumeCampaign(id) : await pauseCampaign(id);
    await audit({
      workspaceId: workspace.id,
      action: body.action === "resume" ? "campaign_resumed" : "campaign_paused",
      objectType: "campaign",
      objectId: id,
    });
    return jsonOk(updated);
  } catch (error) {
    return jsonError(error);
  }
}
