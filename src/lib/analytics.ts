import { db } from "./db";

const SENT = [
  "email_sent",
  "sms_sent",
  "linkedin_message_sent",
  "linkedin_connection_sent",
  "whatsapp_sent",
  "action_executed",
];
const REPLIES = ["email_replied", "sms_replied", "reply_received"];
const POSITIVE = ["positive_reply"];
const MEETINGS = ["meeting_booked"];
const OPENS = ["email_opened"];

export async function campaignMetrics(workspaceId: string, campaignId?: string) {
  const where = {
    workspaceId,
    ...(campaignId ? { campaignId } : {}),
  };

  const activities = await db.activity.findMany({
    where,
    select: { action: true, channel: true, leadId: true, campaignId: true, metadata: true },
  });

  const contacted = new Set(
    activities.filter((item) => SENT.includes(item.action) && item.leadId).map((item) => item.leadId),
  );
  const sent = activities.filter((item) => SENT.includes(item.action)).length;
  const opens = activities.filter((item) => OPENS.includes(item.action)).length;
  const replies = activities.filter((item) => REPLIES.includes(item.action)).length;
  const positive = activities.filter((item) => POSITIVE.includes(item.action)).length;
  const meetings = activities.filter((item) => MEETINGS.includes(item.action)).length;

  return {
    leadsContacted: contacted.size,
    messagesSent: sent,
    opens,
    replies,
    positiveReplies: positive,
    meetings,
    openRate: sent ? (opens / sent) * 100 : 0,
    replyRate: sent ? (replies / sent) * 100 : 0,
    positiveReplyRate: replies ? (positive / replies) * 100 : 0,
    conversionRate: contacted.size ? (meetings / contacted.size) * 100 : 0,
  };
}

export async function breakdown(
  workspaceId: string,
  group: "channel" | "campaign" | "industry" | "workflow_step",
) {
  if (group === "campaign") {
    const campaigns = await db.campaign.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    });
    return Promise.all(
      campaigns.map(async (campaign) => ({
        key: campaign.id,
        label: campaign.name,
        metrics: await campaignMetrics(workspaceId, campaign.id),
      })),
    );
  }

  const activities = await db.activity.findMany({
    where: { workspaceId },
    include: {
      lead: { select: { industry: true } },
    },
  });

  const buckets = new Map<string, typeof activities>();
  for (const activity of activities) {
    const key =
      group === "channel"
        ? activity.channel || "unknown"
        : group === "industry"
          ? activity.lead?.industry || "Unknown"
          : activity.nodeId || activity.action;
    const list = buckets.get(key) ?? [];
    list.push(activity);
    buckets.set(key, list);
  }

  return Array.from(buckets.entries()).map(([key, items]) => {
    const sent = items.filter((item) => SENT.includes(item.action)).length;
    const replies = items.filter((item) => REPLIES.includes(item.action)).length;
    const meetings = items.filter((item) => MEETINGS.includes(item.action)).length;
    return {
      key,
      label: key,
      metrics: {
        messagesSent: sent,
        replies,
        meetings,
        replyRate: sent ? (replies / sent) * 100 : 0,
      },
    };
  });
}

export async function overviewStats(workspaceId: string) {
  const [leads, campaigns, metrics, recent] = await Promise.all([
    db.lead.count({ where: { workspaceId } }),
    db.campaign.count({ where: { workspaceId, status: "running" } }),
    campaignMetrics(workspaceId),
    db.activity.findMany({
      where: { workspaceId },
      include: {
        lead: {
          select: {
            fullName: true,
            firstName: true,
            lastName: true,
            company: { select: { name: true } },
          },
        },
        campaign: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    totalLeads: leads,
    activeCampaigns: campaigns,
    ...metrics,
    recent,
  };
}
