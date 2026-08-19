import { db } from "./db";

export async function recordActivity(input: {
  workspaceId: string;
  action: string;
  leadId?: string;
  campaignId?: string;
  nodeId?: string;
  channel?: string;
  status?: string;
  simulated?: boolean;
  metadata?: Record<string, unknown>;
}) {
  return db.activity.create({
    data: {
      workspaceId: input.workspaceId,
      action: input.action,
      leadId: input.leadId,
      campaignId: input.campaignId,
      nodeId: input.nodeId,
      channel: input.channel,
      status: input.status,
      simulated: input.simulated ?? false,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
  });
}

export async function listActivities(input: {
  workspaceId: string;
  leadId?: string;
  campaignId?: string;
  limit?: number;
}) {
  return db.activity.findMany({
    where: {
      workspaceId: input.workspaceId,
      ...(input.leadId ? { leadId: input.leadId } : {}),
      ...(input.campaignId ? { campaignId: input.campaignId } : {}),
    },
    include: {
      lead: {
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
          company: { select: { name: true } },
        },
      },
      campaign: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 50,
  });
}
