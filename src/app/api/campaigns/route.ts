import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { audit } from "@/lib/audit";
import { parseJson } from "@/lib/utils";
import { jsonError, jsonOk } from "../_utils";

export async function GET() {
  try {
    const workspace = await getWorkspace();
    const items = await db.campaign.findMany({
      where: { workspaceId: workspace.id },
      include: {
        campaignLeads: { select: { id: true, status: true } },
        workflowVersions: { where: { isActive: true }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    return jsonOk(
      items.map((campaign) => ({
        ...campaign,
        audience: parseJson(campaign.audience, {}),
        channels: parseJson(campaign.channels, []),
        leadCount: campaign.campaignLeads.length,
        workflow: campaign.workflowVersions[0]
          ? {
              nodes: parseJson(campaign.workflowVersions[0].nodes, []),
              edges: parseJson(campaign.workflowVersions[0].edges, []),
            }
          : null,
      })),
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const workspace = await getWorkspace();
    const body = await request.json();

    const campaign = await db.campaign.create({
      data: {
        workspaceId: workspace.id,
        name: body.name || "Untitled campaign",
        description: body.description,
        goal: body.goal || "start_conversations",
        goalCustom: body.goalCustom,
        audience: JSON.stringify(body.audience ?? { type: "all" }),
        channels: JSON.stringify(body.channels ?? []),
        status: "draft",
        workflowVersions: body.workflow
          ? {
              create: {
                version: 1,
                nodes: JSON.stringify(body.workflow.nodes ?? []),
                edges: JSON.stringify(body.workflow.edges ?? []),
                isActive: true,
              },
            }
          : undefined,
        messages: body.messages?.length
          ? {
              create: body.messages.map(
                (message: { nodeId: string; channel: string; subject?: string; body: string }) => ({
                  nodeId: message.nodeId,
                  channel: message.channel,
                  subject: message.subject,
                  body: message.body,
                }),
              ),
            }
          : undefined,
      },
    });

    await audit({
      workspaceId: workspace.id,
      action: "campaign_created",
      objectType: "campaign",
      objectId: campaign.id,
    });

    return jsonOk(campaign, 201);
  } catch (error) {
    return jsonError(error);
  }
}
