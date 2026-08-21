import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { parseJson } from "@/lib/utils";
import { proposalFromCampaign } from "@/lib/campaigns/sync";
import { jsonError, jsonOk } from "../../_utils";
import type { HermesChatMessage, HermesProposal } from "@/lib/hermes/types";

export async function GET(request: Request) {
  try {
    const workspace = await getWorkspace();
    const threadId = new URL(request.url).searchParams.get("threadId");
    const thread = threadId
      ? await db.hermesThread.findFirst({
          where: { id: threadId, workspaceId: workspace.id },
        })
      : await db.hermesThread.findFirst({
          where: { workspaceId: workspace.id },
          orderBy: { updatedAt: "desc" },
        });

    if (threadId) {
      if (!thread) {
        return jsonOk({ threadId, messages: [] as HermesChatMessage[], proposal: null });
      }
      const stored = parseJson<HermesProposal>(thread.proposal, { kind: "none", name: "" });
      return jsonOk({
        threadId: thread.id,
        campaignId: stored.campaignId,
        proposal: stored.workflow?.nodes?.length ? stored : null,
        messages: parseJson<HermesChatMessage[]>(thread.messages, []),
      });
    }

    const stored = thread ? parseJson<HermesProposal>(thread.proposal, { kind: "none", name: "" }) : null;
    if (stored?.workflow?.nodes?.length) {
      return jsonOk({
        threadId: thread?.id,
        campaignId: stored.campaignId,
        proposal: stored,
        messages: thread ? parseJson<HermesChatMessage[]>(thread.messages, []) : [],
      });
    }

    const campaign = await db.campaign.findFirst({
      where: { workspaceId: workspace.id },
      include: { workflowVersions: { where: { isActive: true }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    });
    const proposal = campaign ? proposalFromCampaign(campaign) : null;

    return jsonOk({
      threadId: thread?.id,
      campaignId: campaign?.id ?? proposal?.campaignId,
      proposal,
      messages: thread ? parseJson<HermesChatMessage[]>(thread.messages, []) : [],
    });
  } catch (error) {
    return jsonError(error);
  }
}
