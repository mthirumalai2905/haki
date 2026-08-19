import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { launchCampaign } from "@/lib/execution/engine";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../../_utils";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspace = await getWorkspace();
    const { id } = await params;
    const campaign = await db.campaign.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!campaign) throw new AppError("NOT_FOUND", "Campaign not found.", 404);

    const launched = await launchCampaign(id);
    await audit({
      workspaceId: workspace.id,
      action: "campaign_launched",
      objectType: "campaign",
      objectId: id,
    });
    return jsonOk(launched);
  } catch (error) {
    return jsonError(error);
  }
}
