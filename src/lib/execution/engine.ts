import { db } from "../db";
import { recordActivity } from "../activity";
import { ai } from "../ai";
import { parseJson } from "../utils";
import type { WorkflowGraph, WorkflowNodeData } from "../types";
import { getChannel } from "./channels";
import { personalize } from "./personalize";
import { gatherTwitterIntel, gatherYoutubeIntel } from "../touchpoints/intel";

const REPLY_RATE = 0.08;
const OPEN_RATE = 0.42;
const MEETING_RATE = 0.02;

type GraphNode = WorkflowGraph["nodes"][number];

function getActiveGraph(nodes: string, edges: string): WorkflowGraph {
  return {
    name: "active",
    nodes: parseJson(nodes, []),
    edges: parseJson(edges, []),
  };
}

function outgoing(graph: WorkflowGraph, nodeId: string, handle?: string) {
  return graph.edges.find((edge) => {
    if (edge.source !== nodeId) return false;
    if (!handle) return !edge.sourceHandle || edge.sourceHandle === "default";
    return edge.sourceHandle === handle || edge.label === handle;
  });
}

function requiredContact(channel?: string | null, lead?: { email?: string | null; phone?: string | null; linkedin?: string | null }) {
  if (!channel || !lead) return true;
  if (channel === "email") return Boolean(lead.email);
  if (channel === "sms" || channel === "whatsapp" || channel === "phone") return Boolean(lead.phone);
  if (channel === "linkedin") return Boolean(lead.linkedin || lead.email);
  return true;
}

export async function launchCampaign(campaignId: string) {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    include: { workflowVersions: { where: { isActive: true }, take: 1 } },
  });
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "running") return campaign;

  const audience = parseJson<{ type?: string; leadIds?: string[]; filters?: Record<string, unknown> }>(
    campaign.audience,
    {},
  );

  const leads = await resolveAudience(campaign.workspaceId, audience);
  const graph = campaign.workflowVersions[0];
  const parsed = graph ? getActiveGraph(graph.nodes, graph.edges) : null;
  const trigger = parsed?.nodes.find((node) => node.data.type === "trigger");
  const firstEdge = trigger ? outgoing(parsed!, trigger.id) : undefined;
  const firstNodeId = firstEdge?.target ?? parsed?.nodes[0]?.id ?? null;

  await db.$transaction(async (tx) => {
    await tx.campaign.update({
      where: { id: campaignId },
      data: { status: "running", startedAt: new Date() },
    });

    for (const lead of leads) {
      await tx.campaignLead.upsert({
        where: { campaignId_leadId: { campaignId, leadId: lead.id } },
        create: {
          campaignId,
          leadId: lead.id,
          status: "queued",
          currentNodeId: firstNodeId,
          nextExecutionAt: new Date(),
        },
        update: {
          status: "queued",
          currentNodeId: firstNodeId,
          nextExecutionAt: new Date(),
          completedAt: null,
        },
      });
    }
  });

  await recordActivity({
    workspaceId: campaign.workspaceId,
    campaignId,
    action: "campaign_started",
    simulated: true,
    metadata: { leadCount: leads.length, provider: "simulation" },
  });

  await processDue(40);
  return db.campaign.findUnique({ where: { id: campaignId } });
}

export async function pauseCampaign(campaignId: string) {
  const campaign = await db.campaign.update({
    where: { id: campaignId },
    data: { status: "paused" },
  });
  await db.campaignLead.updateMany({
    where: { campaignId, status: { in: ["queued", "active", "waiting"] } },
    data: { status: "paused" },
  });
  await recordActivity({
    workspaceId: campaign.workspaceId,
    campaignId,
    action: "campaign_paused",
  });
  return campaign;
}

export async function resumeCampaign(campaignId: string) {
  const campaign = await db.campaign.update({
    where: { id: campaignId },
    data: { status: "running" },
  });
  await db.campaignLead.updateMany({
    where: { campaignId, status: "paused" },
    data: { status: "waiting", nextExecutionAt: new Date() },
  });
  return campaign;
}

async function resolveAudience(
  workspaceId: string,
  audience: { type?: string; leadIds?: string[] },
) {
  if (audience.type === "selected" && audience.leadIds?.length) {
    return db.lead.findMany({
      where: { workspaceId, id: { in: audience.leadIds }, optedOut: false },
    });
  }
  if (audience.type === "qualified") {
    return db.lead.findMany({
      where: { workspaceId, status: "qualified", optedOut: false },
    });
  }
  return db.lead.findMany({
    where: { workspaceId, optedOut: false },
    take: 5000,
  });
}

export async function processDue(limit = 25) {
  const due = await db.campaignLead.findMany({
    where: {
      status: { in: ["queued", "active", "waiting"] },
      nextExecutionAt: { lte: new Date() },
      campaign: { status: "running" },
    },
    include: {
      campaign: {
        include: {
          workflowVersions: { where: { isActive: true }, take: 1 },
          messages: true,
        },
      },
      lead: { include: { company: true } },
    },
    take: limit,
    orderBy: { nextExecutionAt: "asc" },
  });

  for (const item of due) {
    try {
      await executeCampaignLead(item.id);
    } catch (error) {
      console.error("Execution failed", error);
      await db.campaignLead.update({
        where: { id: item.id },
        data: { status: "failed" },
      });
    }
  }

  return due.length;
}

export async function executeCampaignLead(campaignLeadId: string) {
  const item = await db.campaignLead.findUnique({
    where: { id: campaignLeadId },
    include: {
      campaign: {
        include: {
          workflowVersions: { where: { isActive: true }, take: 1 },
          messages: true,
        },
      },
      lead: { include: { company: true } },
    },
  });
  if (!item) return;
  if (item.campaign.status !== "running") return;
  if (item.lead.optedOut) {
    await db.campaignLead.update({
      where: { id: item.id },
      data: { status: "stopped", completedAt: new Date() },
    });
    return;
  }

  const version = item.campaign.workflowVersions[0];
  if (!version || !item.currentNodeId) {
    await completeLead(item.id, "completed");
    return;
  }

  const graph = getActiveGraph(version.nodes, version.edges);
  const current = graph.nodes.find((node) => node.id === item.currentNodeId);
  if (!current) {
    await completeLead(item.id, "completed");
    return;
  }

  await db.campaignLead.update({
    where: { id: item.id },
    data: { status: "active", startedAt: item.startedAt ?? new Date() },
  });

  const already = await db.execution.findUnique({
    where: {
      campaignLeadId_nodeId: {
        campaignLeadId: item.id,
        nodeId: current.id,
      },
    },
  });
  if (already && current.data.type === "action") {
    await advance(item.id, graph, current, "default");
    return;
  }

  if (current.data.weekdayOnly && current.data.type === "action") {
    const day = new Date().getDay();
    if (day === 0 || day === 6) {
      await db.campaignLead.update({
        where: { id: item.id },
        data: {
          status: "waiting",
          nextExecutionAt: new Date(Date.now() + 5000),
        },
      });
      await recordActivity({
        workspaceId: item.campaign.workspaceId,
        campaignId: item.campaignId,
        leadId: item.lead.id,
        nodeId: current.id,
        channel: current.data.channel,
        action: "weekday_hold",
        simulated: true,
        metadata: { reason: "weekday_only" },
      });
      return;
    }
  }

  const nextHandle = await runNode(item, current);

  if (current.data.type !== "wait") {
    await db.execution.upsert({
      where: {
        campaignLeadId_nodeId: { campaignLeadId: item.id, nodeId: current.id },
      },
      create: { campaignLeadId: item.id, nodeId: current.id, status: "completed" },
      update: { status: "completed" },
    });
  }

  if (current.data.type === "end") {
    await completeLead(item.id, "completed");
    await maybeCompleteCampaign(item.campaignId);
    return;
  }

  if (current.data.type === "wait") {
    const hours = current.data.waitHours || 24;
    const delayMs = Math.max(2500, Math.min(hours * 1500, 20000));
    const next = outgoing(graph, current.id);
    await db.campaignLead.update({
      where: { id: item.id },
      data: {
        status: "waiting",
        currentNodeId: next?.target ?? current.id,
        nextExecutionAt: new Date(Date.now() + delayMs),
      },
    });
    return;
  }

  await advance(item.id, graph, current, nextHandle);
}

async function runNode(
  item: {
    id: string;
    campaignId: string;
    campaign: {
      workspaceId: string;
      goal: string;
      audience?: string;
      messages: Array<{ nodeId: string; subject: string | null; body: string; channel: string }>;
    };
    lead: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      fullName: string | null;
      jobTitle: string | null;
      email: string | null;
      phone: string | null;
      linkedin: string | null;
      x?: string | null;
      youtube?: string | null;
      industry: string | null;
      website: string | null;
      customFields: string;
      optedOut: boolean;
      company: { name: string | null } | null;
    };
  },
  node: GraphNode,
): Promise<string> {
  const data = node.data as WorkflowNodeData;

  if (data.type === "trigger") return "default";
  if (data.type === "end") return "default";

  if (data.action === "qualify") {
    const icp = await db.icp.findFirst({
      where: { workspaceId: item.campaign.workspaceId },
      orderBy: { createdAt: "desc" },
    });
    const result = await ai.qualifyLead(item.lead, icp ?? {});
    await db.qualification.create({
      data: {
        leadId: item.lead.id,
        icpId: icp?.id,
        score: result.score,
        status: result.status,
        reason: result.reason,
      },
    });
    await db.lead.update({
      where: { id: item.lead.id },
      data: { status: result.status },
    });
    await recordActivity({
      workspaceId: item.campaign.workspaceId,
      leadId: item.lead.id,
      campaignId: item.campaignId,
      nodeId: node.id,
      action: "lead_qualified",
      metadata: result,
    });
    return "default";
  }

  if (data.action === "research_x" || data.action === "research_youtube") {
    const intel =
      data.action === "research_x"
        ? gatherTwitterIntel(item.lead)
        : gatherYoutubeIntel(item.lead);
    await recordActivity({
      workspaceId: item.campaign.workspaceId,
      leadId: item.lead.id,
      campaignId: item.campaignId,
      nodeId: node.id,
      channel: data.channel,
      action: data.action === "research_x" ? "twitter_researched" : "youtube_researched",
      status: "intel",
      simulated: true,
      metadata: intel,
    });
    return "default";
  }

  if (data.action === "connect_linkedin") {
    await recordActivity({
      workspaceId: item.campaign.workspaceId,
      leadId: item.lead.id,
      campaignId: item.campaignId,
      nodeId: node.id,
      channel: "linkedin",
      action: "linkedin_connection_sent",
      status: "sent",
      simulated: true,
      metadata: { provider: "simulation", note: "Connection request simulated. No LinkedIn automation." },
    });
    return "default";
  }

  if (data.type === "action") {
    const quiet = isQuietPath(item.campaign);
    const research = await latestIntel(item.campaignId, item.lead.id);
    const channel = getChannel(data.channel);
    if (data.channel && !requiredContact(data.channel, item.lead)) {
      await recordActivity({
        workspaceId: item.campaign.workspaceId,
        leadId: item.lead.id,
        campaignId: item.campaignId,
        nodeId: node.id,
        channel: data.channel,
        action: `${data.channel}_skipped`,
        status: "skipped",
        simulated: true,
        metadata: { reason: "Missing required contact information" },
      });
      return "default";
    }

    const template = item.campaign.messages.find((message) => message.nodeId === node.id);
    const subject = personalize(template?.subject ?? data.subject, item.lead, research);
    const body = personalize(template?.body ?? data.body, item.lead, research);
    const result = channel
      ? await channel.send({ to: item.lead.email, subject, body })
      : { ok: true, simulated: true, provider: "simulation", message: "Action simulated" };

    const actionName =
      data.channel === "email"
        ? "email_sent"
        : data.channel === "sms"
          ? "sms_sent"
          : data.channel === "whatsapp"
            ? "whatsapp_sent"
            : data.channel === "linkedin"
              ? "linkedin_message_sent"
              : data.action || "action_executed";

    await recordActivity({
      workspaceId: item.campaign.workspaceId,
      leadId: item.lead.id,
      campaignId: item.campaignId,
      nodeId: node.id,
      channel: data.channel,
      action: actionName,
      status: result.ok ? "sent" : "failed",
      simulated: true,
      metadata: { subject, preview: body.slice(0, 180), provider: result.provider },
    });

    if (!quiet && data.channel === "email" && Math.random() < OPEN_RATE) {
      await recordActivity({
        workspaceId: item.campaign.workspaceId,
        leadId: item.lead.id,
        campaignId: item.campaignId,
        nodeId: node.id,
        channel: "email",
        action: "email_opened",
        simulated: true,
      });
    }

    if (!quiet && Math.random() < REPLY_RATE) {
      const category = Math.random() < 0.55 ? "positive" : "neutral";
      await recordActivity({
        workspaceId: item.campaign.workspaceId,
        leadId: item.lead.id,
        campaignId: item.campaignId,
        nodeId: node.id,
        channel: data.channel,
        action: data.channel === "email" ? "email_replied" : "reply_received",
        simulated: true,
        metadata: { category },
      });
      if (category === "positive") {
        await recordActivity({
          workspaceId: item.campaign.workspaceId,
          leadId: item.lead.id,
          campaignId: item.campaignId,
          action: "positive_reply",
          simulated: true,
        });
        await db.campaignLead.update({
          where: { id: item.id },
          data: { status: "interested" },
        });
      }
      if (Math.random() < MEETING_RATE) {
        await recordActivity({
          workspaceId: item.campaign.workspaceId,
          leadId: item.lead.id,
          campaignId: item.campaignId,
          action: "meeting_booked",
          simulated: true,
        });
      }
    }

    return "default";
  }

  if (data.type === "condition") {
    const replied = await db.activity.findFirst({
      where: {
        campaignId: item.campaignId,
        leadId: item.lead.id,
        action: { in: ["email_replied", "sms_replied", "reply_received", "positive_reply"] },
      },
    });
    const opened = await db.activity.findFirst({
      where: {
        campaignId: item.campaignId,
        leadId: item.lead.id,
        action: "email_opened",
      },
    });
    if (data.condition === "email_opened") return opened ? "yes" : "no";
    if (data.condition === "any_engagement") return opened || replied ? "yes" : "no";
    if (data.condition === "no_response") return replied ? "no" : "yes";
    return replied ? "yes" : "no";
  }

  if (data.type === "ai_decision") {
    const recommendation = await ai.recommendNextAction(item.lead);
    await recordActivity({
      workspaceId: item.campaign.workspaceId,
      leadId: item.lead.id,
      campaignId: item.campaignId,
      nodeId: node.id,
      action: "ai_decision",
      simulated: true,
      metadata: recommendation,
    });
    return recommendation.action.includes("email") ? "email" : "default";
  }

  return "default";
}

function isQuietPath(campaign: { audience?: string }) {
  return Boolean(parseJson<{ quietPath?: boolean }>(campaign.audience ?? "{}", {}).quietPath);
}

async function latestIntel(campaignId: string, leadId: string) {
  const items = await db.activity.findMany({
    where: {
      campaignId,
      leadId,
      action: { in: ["twitter_researched", "youtube_researched"] },
    },
    orderBy: { createdAt: "desc" },
  });
  const extra: Record<string, string> = {};
  for (const item of items) {
    const meta = parseJson<{ sapien?: string }>(item.metadata, {});
    if (item.action === "twitter_researched" && meta.sapien) extra.twitter_sapien = meta.sapien;
    if (item.action === "youtube_researched" && meta.sapien) extra.youtube_sapien = meta.sapien;
  }
  return extra;
}

async function advance(
  campaignLeadId: string,
  graph: WorkflowGraph,
  current: GraphNode,
  handle: string,
) {
  const next = outgoing(graph, current.id, handle) || outgoing(graph, current.id);
  if (!next) {
    await completeLead(campaignLeadId, "completed");
    return;
  }
  await db.campaignLead.update({
    where: { id: campaignLeadId },
    data: {
      status: "waiting",
      currentNodeId: next.target,
      nextExecutionAt: new Date(),
    },
  });
}

async function completeLead(id: string, status: string) {
  await db.campaignLead.update({
    where: { id },
    data: { status, completedAt: new Date(), nextExecutionAt: null },
  });
}

async function maybeCompleteCampaign(campaignId: string) {
  const remaining = await db.campaignLead.count({
    where: {
      campaignId,
      status: { in: ["queued", "active", "waiting"] },
    },
  });
  if (remaining === 0) {
    const campaign = await db.campaign.update({
      where: { id: campaignId },
      data: { status: "completed", completedAt: new Date() },
    });
    await recordActivity({
      workspaceId: campaign.workspaceId,
      campaignId,
      action: "campaign_completed",
    });
  }
}
