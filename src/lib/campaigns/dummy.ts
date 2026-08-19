import { db } from "../db";
import { launchCampaign } from "../execution/engine";
import { DUMMY_CAMPAIGN_NAME, multiTouchMessages, multiTouchWorkflow } from "../workflow/multitouch";
import { audit } from "../audit";
import { recordActivity } from "../activity";

export async function setupDummyMultitouchCampaign(workspaceId: string, launch = true) {
  const existing = await db.campaign.findFirst({
    where: { workspaceId, name: DUMMY_CAMPAIGN_NAME },
  });
  if (existing) {
    if (launch && existing.status !== "running") {
      await launchCampaign(existing.id);
    }
    return { campaignId: existing.id, created: false, launched: launch };
  }

  const leadCount = await db.lead.count({ where: { workspaceId } });
  const workflow = multiTouchWorkflow();
  const campaign = await db.campaign.create({
    data: {
      workspaceId,
      name: DUMMY_CAMPAIGN_NAME,
      description:
        "Simulated multi-touch sequence. No email provider. No LinkedIn/Twitter/YouTube/WhatsApp APIs. Research steps produce dummy sapien.",
      goal: "start_conversations",
      audience: JSON.stringify({ type: "all", count: leadCount, quietPath: true }),
      channels: JSON.stringify(["email", "linkedin", "x", "youtube", "whatsapp"]),
      status: "draft",
      workflowVersions: {
        create: {
          version: 1,
          nodes: JSON.stringify(workflow.nodes),
          edges: JSON.stringify(workflow.edges),
          isActive: true,
        },
      },
      messages: {
        create: multiTouchMessages(workflow),
      },
    },
  });

  await audit({
    workspaceId,
    action: "campaign_created",
    objectType: "campaign",
    objectId: campaign.id,
    metadata: { dummy: true, multitouch: true },
  });
  await recordActivity({
    workspaceId,
    campaignId: campaign.id,
    action: "campaign_drafted",
    simulated: true,
    metadata: { hermes: true, provider: "simulation" },
  });

  if (launch) {
    await launchCampaign(campaign.id);
  }

  return { campaignId: campaign.id, created: true, launched: launch };
}
