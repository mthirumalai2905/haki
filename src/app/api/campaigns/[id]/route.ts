import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { campaignMetrics } from "@/lib/analytics";
import { listActivities } from "@/lib/activity";
import { parseJson } from "@/lib/utils";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../_utils";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspace = await getWorkspace();
    const { id } = await params;
    const campaign = await db.campaign.findFirst({
      where: { id, workspaceId: workspace.id },
      include: {
        workflowVersions: { where: { isActive: true }, take: 1 },
        messages: true,
        campaignLeads: {
          include: {
            lead: {
              include: { company: true, qualifications: { take: 1, orderBy: { createdAt: "desc" } } },
            },
          },
          take: 100,
        },
      },
    });
    if (!campaign) throw new AppError("NOT_FOUND", "Campaign not found.", 404);

    const [metrics, activities] = await Promise.all([
      campaignMetrics(workspace.id, campaign.id),
      listActivities({ workspaceId: workspace.id, campaignId: campaign.id, limit: 40 }),
    ]);

    const version = campaign.workflowVersions[0];
    return jsonOk({
      ...campaign,
      audience: parseJson(campaign.audience, {}),
      channels: parseJson(campaign.channels, []),
      sendMode: campaign.sendMode,
      sendAt: campaign.sendAt,
      workflow: version
        ? {
            id: version.id,
            version: version.version,
            nodes: parseJson(version.nodes, []),
            edges: parseJson(version.edges, []),
          }
        : { nodes: [], edges: [] },
      metrics,
      activities,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspace = await getWorkspace();
    const { id } = await params;
    const body = await request.json();
    const existing = await db.campaign.findFirst({
      where: { id, workspaceId: workspace.id },
      include: { workflowVersions: { where: { isActive: true }, take: 1 } },
    });
    if (!existing) throw new AppError("NOT_FOUND", "Campaign not found.", 404);

    const campaign = await db.campaign.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        goal: body.goal ?? existing.goal,
        goalCustom: body.goalCustom ?? existing.goalCustom,
        audience: body.audience ? JSON.stringify(body.audience) : existing.audience,
        channels: body.channels ? JSON.stringify(body.channels) : existing.channels,
        sendMode: body.sendMode ?? existing.sendMode,
        sendAt: body.sendAt ? new Date(body.sendAt) : existing.sendAt,
      },
    });

    if (body.workflow && existing.status === "draft") {
      const current = existing.workflowVersions[0];
      if (current) {
        await db.workflowVersion.update({
          where: { id: current.id },
          data: {
            nodes: JSON.stringify(body.workflow.nodes ?? []),
            edges: JSON.stringify(body.workflow.edges ?? []),
          },
        });
      } else {
        await db.workflowVersion.create({
          data: {
            campaignId: id,
            version: 1,
            nodes: JSON.stringify(body.workflow.nodes ?? []),
            edges: JSON.stringify(body.workflow.edges ?? []),
            isActive: true,
          },
        });
      }
    } else if (body.workflow && existing.status === "running") {
      const current = existing.workflowVersions[0];
      if (current) {
        await db.workflowVersion.update({
          where: { id: current.id },
          data: { isActive: false },
        });
      }
      await db.workflowVersion.create({
        data: {
          campaignId: id,
          version: (current?.version ?? 0) + 1,
          nodes: JSON.stringify(body.workflow.nodes ?? []),
          edges: JSON.stringify(body.workflow.edges ?? []),
          isActive: true,
        },
      });
    }

    if (Array.isArray(body.messages)) {
      for (const message of body.messages) {
        await db.messageTemplate.upsert({
          where: { campaignId_nodeId: { campaignId: id, nodeId: message.nodeId } },
          create: {
            campaignId: id,
            nodeId: message.nodeId,
            channel: message.channel,
            subject: message.subject,
            body: message.body,
          },
          update: {
            subject: message.subject,
            body: message.body,
            channel: message.channel,
          },
        });
      }
    }

    return jsonOk(campaign);
  } catch (error) {
    return jsonError(error);
  }
}
