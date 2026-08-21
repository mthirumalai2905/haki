import { db } from "../db";
import { audit } from "../audit";
import { recordActivity } from "../activity";
import { parseJson } from "../utils";
import type { HermesProposal } from "../hermes/types";
import { graphToSpec } from "../sequence/compile";
import { replaceSteps } from "../sequence/persist";
import type { WorkflowGraph } from "../types";

export async function syncProposalToCampaign(
  workspaceId: string,
  proposal: HermesProposal,
  campaignId?: string,
) {
  if (!proposal.workflow) return null;

  const existing = campaignId
    ? await db.campaign.findFirst({
        where: { id: campaignId, workspaceId },
        include: { workflowVersions: { where: { isActive: true }, take: 1 } },
      })
    : await db.campaign.findFirst({
        where: { workspaceId, name: proposal.name },
        include: { workflowVersions: { where: { isActive: true }, take: 1 } },
      });

  if (!existing) {
    const created = await db.campaign.create({
      data: {
        workspaceId,
        name: proposal.name || "Untitled campaign",
        description: "Drafted in Haki chat. Review before launch.",
        goal: proposal.goal || "start_conversations",
        goalCustom: proposal.goalCustom,
        audience: JSON.stringify(proposal.audience ?? { type: "all" }),
        channels: JSON.stringify(proposal.channels ?? []),
        status: "draft",
        workflowVersions: {
          create: {
            version: 1,
            nodes: JSON.stringify(proposal.workflow.nodes ?? []),
            edges: JSON.stringify(proposal.workflow.edges ?? []),
            isActive: true,
          },
        },
        messages: proposal.messages?.length
          ? {
              create: proposal.messages.map((message) => ({
                nodeId: message.nodeId,
                channel: message.channel,
                subject: message.subject,
                body: message.body,
              })),
            }
          : undefined,
      },
    });

    await audit({
      workspaceId,
      action: "campaign_created",
      objectType: "campaign",
      objectId: created.id,
      metadata: { hermes: true, source: "chat" },
    });
    await recordActivity({
      workspaceId,
      campaignId: created.id,
      action: "campaign_drafted",
      simulated: true,
      metadata: { hermes: true, source: "chat" },
    });

    const createdVersion = await db.workflowVersion.findFirst({
      where: { campaignId: created.id, isActive: true },
    });
    if (createdVersion) {
      await replaceSteps(createdVersion.id, proposal.sequence ?? graphToSpec(proposal.workflow)).catch((error) => {
        console.error("Sequence persist failed", error);
      });
    }

    return { campaignId: created.id, created: true };
  }

  await db.campaign.update({
    where: { id: existing.id },
    data: {
      name: proposal.name || existing.name,
      goal: proposal.goal || existing.goal,
      goalCustom: proposal.goalCustom ?? existing.goalCustom,
      audience: proposal.audience ? JSON.stringify(proposal.audience) : existing.audience,
      channels: proposal.channels ? JSON.stringify(proposal.channels) : existing.channels,
    },
  });

  const versionId = await writeWorkflow(existing.id, existing.status, existing.workflowVersions[0], proposal.workflow);
  if (versionId) {
    await replaceSteps(versionId, proposal.sequence ?? graphToSpec(proposal.workflow)).catch((error) => {
      console.error("Sequence persist failed", error);
    });
  }

  if (proposal.messages?.length) {
    for (const message of proposal.messages) {
      await db.messageTemplate.upsert({
        where: { campaignId_nodeId: { campaignId: existing.id, nodeId: message.nodeId } },
        create: {
          campaignId: existing.id,
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

  await recordActivity({
    workspaceId,
    campaignId: existing.id,
    action: "campaign_updated",
    simulated: true,
    metadata: { hermes: true, source: "chat", changes: proposal.changes ?? [] },
  });

  return { campaignId: existing.id, created: false };
}

export function proposalFromCampaign(campaign: {
  id: string;
  name: string;
  goal: string;
  goalCustom?: string | null;
  audience: string;
  channels: string;
  workflowVersions: Array<{ nodes: string; edges: string }>;
}): HermesProposal | null {
  const version = campaign.workflowVersions[0];
  if (!version) return null;
  const nodes = parseJson<WorkflowGraph["nodes"]>(version.nodes, []);
  const edges = parseJson<WorkflowGraph["edges"]>(version.edges, []);
  return {
    kind: "campaign",
    campaignId: campaign.id,
    name: campaign.name,
    goal: campaign.goal as HermesProposal["goal"],
    goalCustom: campaign.goalCustom ?? undefined,
    audience: parseJson(campaign.audience, { type: "all" }),
    channels: parseJson(campaign.channels, []),
    workflow: { name: campaign.name, nodes, edges },
  };
}

async function writeWorkflow(
  campaignId: string,
  status: string,
  current: { id: string; version: number } | undefined,
  workflow: WorkflowGraph,
) {
  const nodes = JSON.stringify(workflow.nodes ?? []);
  const edges = JSON.stringify(workflow.edges ?? []);

  if (current && status === "draft") {
    await db.workflowVersion.update({
      where: { id: current.id },
      data: { nodes, edges },
    });
    return current.id;
  }

  if (current) {
    await db.workflowVersion.update({
      where: { id: current.id },
      data: { isActive: false },
    });
  }

  const created = await db.workflowVersion.create({
    data: {
      campaignId,
      version: (current?.version ?? 0) + 1,
      nodes,
      edges,
      isActive: true,
    },
  });
  return created.id;
}
